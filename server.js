import 'dotenv/config';
import express from 'express';
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const require = createRequire(import.meta.url);
const pkg = require('pg');
const { Pool, types } = pkg;
if (types) {
  types.setTypeParser(1700, (val) => parseFloat(val));
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 10000;

// ── Database connection (uses DATABASE_URL environment variable) ──
function getResolvedConnectionString() {
  let connStr = (process.env.DATABASE_URL || '').trim();
  if (!connStr) {
    console.warn('⚠️  DATABASE_URL environment variable is not defined. Please set DATABASE_URL in your environment or .env file.');
    return '';
  }
  // Automatically rewrite IPv6 direct connection to IPv4 pooler if applicable
  const dbMatch = connStr.match(/@db\.([a-z0-9]+)\.supabase\.co/);
  if (dbMatch && dbMatch[1]) {
    const projectRef = dbMatch[1];
    connStr = connStr
      .replace(`db.${projectRef}.supabase.co:5432`, 'aws-0-ap-southeast-2.pooler.supabase.com:6543')
      .replace('postgres:', `postgres.${projectRef}:`);
  }
  return connStr;
}

const pool = new Pool({
  connectionString: getResolvedConnectionString(),
  ssl: { rejectUnauthorized: false },
  max: 5,
  idleTimeoutMillis: 30000,
});


// ── Password Hashing Helper ──
const PASSWORD_SALT = 'grandstay_salt_2026';
function hashPassword(password) {
  return crypto.pbkdf2Sync(password, PASSWORD_SALT, 10000, 64, 'sha512').toString('hex');
}

// Ensure auth_users table and initial accounts exist
async function ensureAuthTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS public.auth_users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'Staff',
        avatar TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        last_login TIMESTAMPTZ
      );
    `);

    // Ensure default admin user exists
    const check = await pool.query("SELECT id FROM public.auth_users WHERE email = 'admin@grandstay.in' LIMIT 1;");
    if (check.rows.length === 0) {
      const adminHash = hashPassword('admin123');
      await pool.query(`
        INSERT INTO public.auth_users (id, email, password_hash, name, role, avatar)
        VALUES ('usr_admin', 'admin@grandstay.in', $1, 'Rajeshwar Rao', 'Administrator', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150')
        ON CONFLICT (id) DO NOTHING;
      `, [adminHash]);
    }
  } catch (err) {
    console.warn('Note: Error checking auth table:', err.message);
  }
}
ensureAuthTable();

// ── Middleware ──
app.use(express.json({ limit: '10mb' }));

// ── CORS headers (allow your Render frontend domain) ──
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// ── Health check for Render & monitoring ──
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

// ──────────────────────────────────────────────

//  AUTHENTICATION ROUTES (/api/auth/*)
// ──────────────────────────────────────────────

// POST /api/auth/login — authenticate with email and password
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const cleanEmail = (email || '').trim().toLowerCase();

    if (!cleanEmail || !password) {
      return res.status(400).json({ status: 'error', message: 'Email and password are required' });
    }

    const userRes = await pool.query(
      'SELECT * FROM public.auth_users WHERE LOWER(email) = $1 LIMIT 1',
      [cleanEmail]
    );

    if (userRes.rows.length === 0) {
      return res.status(401).json({ status: 'error', message: 'No administrator account found with this email' });
    }

    const user = userRes.rows[0];

    // Restrict access: Only Administrator can sign in
    if (user.role !== 'Administrator') {
      return res.status(403).json({ status: 'error', message: 'Access denied: Only Administrators can sign in to this portal.' });
    }

    const computedHash = hashPassword(password);

    if (user.password_hash !== computedHash) {
      return res.status(401).json({ status: 'error', message: 'Incorrect password' });
    }

    // Update last_login
    await pool.query('UPDATE public.auth_users SET last_login = NOW() WHERE id = $1', [user.id]);

    const token = Buffer.from(
      JSON.stringify({ id: user.id, email: user.email, role: user.role, t: Date.now() })
    ).toString('base64');

    res.json({
      status: 'success',
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        lastLogin: new Date().toISOString(),
      },
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// POST /api/auth/register — create new account
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body || {};
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanName = (name || '').trim();
    const cleanRole = (role || 'Staff').trim();

    if (!cleanName || !cleanEmail || !password) {
      return res.status(400).json({ status: 'error', message: 'Name, email, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ status: 'error', message: 'Password must be at least 6 characters long' });
    }

    // Check if user already exists
    const existing = await pool.query(
      'SELECT id FROM public.auth_users WHERE LOWER(email) = $1 LIMIT 1',
      [cleanEmail]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ status: 'error', message: 'An account with this email already exists' });
    }

    const hash = hashPassword(password);
    const id = `usr_${Date.now()}`;
    const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanName)}&background=172554&color=fff`;

    await pool.query(
      `INSERT INTO public.auth_users (id, email, password_hash, name, role, avatar, created_at, last_login)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
      [id, cleanEmail, hash, cleanName, cleanRole, avatar]
    );

    const token = Buffer.from(
      JSON.stringify({ id, email: cleanEmail, role: cleanRole, t: Date.now() })
    ).toString('base64');

    res.json({
      status: 'success',
      message: 'Account registered successfully',
      token,
      user: {
        id,
        email: cleanEmail,
        name: cleanName,
        role: cleanRole,
        avatar,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      },
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// GET /api/auth/me — get currently logged in user from token
app.get('/api/auth/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace(/^Bearer\s+/i, '');

    if (!token) {
      return res.status(401).json({ status: 'error', message: 'No authorization token provided' });
    }

    const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf8'));
    const userRes = await pool.query(
      'SELECT id, email, name, role, avatar, created_at as "createdAt", last_login as "lastLogin" FROM public.auth_users WHERE id = $1 LIMIT 1',
      [decoded.id]
    );

    if (userRes.rows.length === 0) {
      return res.status(401).json({ status: 'error', message: 'User not found' });
    }

    res.json({ status: 'success', user: userRes.rows[0] });
  } catch (err) {
    res.status(401).json({ status: 'error', message: 'Invalid or expired session token' });
  }
});

// POST /api/auth/logout — sign out
app.post('/api/auth/logout', (req, res) => {
  res.json({ status: 'success', message: 'Signed out successfully' });
});

// ──────────────────────────────────────────────
//  API ROUTES  (/api/supabase/*)
// ──────────────────────────────────────────────

// GET /api/supabase/status — connection health check
app.get('/api/supabase/status', async (req, res) => {
  try {
    const timeRes = await pool.query('SELECT NOW() as now;');
    const counts = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM public.rooms)::int          AS rooms,
        (SELECT COUNT(*) FROM public.guests)::int         AS guests,
        (SELECT COUNT(*) FROM public.reservations)::int   AS reservations,
        (SELECT COUNT(*) FROM public.payments)::int       AS payments,
        (SELECT COUNT(*) FROM public.staff)::int          AS staff;
    `);
    res.json({ status: 'success', time: timeRes.rows[0].now, counts: counts.rows[0] });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// GET /api/supabase/all — fetch all hotel data
app.get('/api/supabase/all', async (req, res) => {
  try {
    const [rooms, guests, reservations, payments, staff, settings] = await Promise.all([
      pool.query('SELECT * FROM public.rooms ORDER BY "roomNumber" ASC;'),
      pool.query('SELECT * FROM public.guests ORDER BY "createdAt" DESC;'),
      pool.query('SELECT * FROM public.reservations ORDER BY "createdAt" DESC;'),
      pool.query('SELECT * FROM public.payments ORDER BY date DESC;'),
      pool.query('SELECT * FROM public.staff ORDER BY id ASC;'),
      pool.query("SELECT data FROM public.hotel_settings WHERE id = 'current' LIMIT 1;"),
    ]);
    res.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      data: {
        rooms: rooms.rows,
        guests: guests.rows,
        reservations: reservations.rows,
        payments: payments.rows,
        staff: staff.rows,
        settings: settings.rows[0]?.data || null,
      }
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// POST /api/supabase/syncAll — push all local data to Supabase
app.post('/api/supabase/syncAll', async (req, res) => {
  try {
    const { rooms, guests, reservations, payments, staff, settings } = req.body;

    if (rooms?.length > 0) {
      for (const r of rooms) {
        await pool.query(`
          INSERT INTO public.rooms (id, "roomNumber", type, floor, capacity, "pricePerNight", status, amenities, description, image)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
          ON CONFLICT (id) DO UPDATE SET
            "roomNumber"=$2, type=$3, floor=$4, capacity=$5,
            "pricePerNight"=$6, status=$7, amenities=$8, description=$9, image=$10;
        `, [r.id, r.roomNumber, r.type, r.floor, r.capacity, r.pricePerNight, r.status, JSON.stringify(r.amenities), r.description, r.image || null]);
      }
    }

    if (guests?.length > 0) {
      for (const g of guests) {
        await pool.query(`
          INSERT INTO public.guests (id, "firstName", "lastName", email, phone, country, address, notes, status, "totalBookings", "totalSpent")
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
          ON CONFLICT (id) DO UPDATE SET
            "firstName"=$2, "lastName"=$3, email=$4, phone=$5, country=$6,
            address=$7, notes=$8, status=$9, "totalBookings"=$10, "totalSpent"=$11;
        `, [g.id, g.firstName, g.lastName, g.email, g.phone, g.country, g.address, g.notes, g.status, g.totalBookings, g.totalSpent]);
      }
    }

    if (reservations?.length > 0) {
      for (const r of reservations) {
        await pool.query(`
          INSERT INTO public.reservations (
            id, "bookingId", "guestId", "guestName", "guestEmail", "guestPhone",
            "roomId", "roomNumber", "roomType", "checkIn", "checkOut", adults, children,
            "pricePerNight", nights, "totalAmount", "paymentStatus", "bookingStatus", notes
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
          ON CONFLICT (id) DO UPDATE SET
            "bookingId"=$2, "guestId"=$3, "guestName"=$4, "guestEmail"=$5, "guestPhone"=$6,
            "roomId"=$7, "roomNumber"=$8, "roomType"=$9, "checkIn"=$10, "checkOut"=$11,
            adults=$12, children=$13, "pricePerNight"=$14, nights=$15,
            "totalAmount"=$16, "paymentStatus"=$17, "bookingStatus"=$18, notes=$19;
        `, [r.id, r.bookingId, r.guestId, r.guestName, r.guestEmail, r.guestPhone,
            r.roomId, r.roomNumber, r.roomType, r.checkIn, r.checkOut, r.adults, r.children,
            r.pricePerNight, r.nights, r.totalAmount, r.paymentStatus, r.bookingStatus, r.notes]);
      }
    }

    if (payments?.length > 0) {
      for (const p of payments) {
        await pool.query(`
          INSERT INTO public.payments (id, "paymentId", "bookingId", "reservationId", "guestId", "guestName", date, method, amount, status, notes)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
          ON CONFLICT (id) DO UPDATE SET
            "paymentId"=$2, "bookingId"=$3, "reservationId"=$4, "guestId"=$5,
            "guestName"=$6, date=$7, method=$8, amount=$9, status=$10, notes=$11;
        `, [p.id, p.paymentId, p.bookingId, p.reservationId, p.guestId, p.guestName, p.date, p.method, p.amount, p.status, p.notes]);
      }
    }

    if (staff?.length > 0) {
      for (const s of staff) {
        await pool.query(`
          INSERT INTO public.staff (id, "employeeId", "firstName", "lastName", role, email, phone, "joiningDate", status, department, avatar)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
          ON CONFLICT (id) DO UPDATE SET
            "employeeId"=$2, "firstName"=$3, "lastName"=$4, role=$5, email=$6,
            phone=$7, "joiningDate"=$8, status=$9, department=$10, avatar=$11;
        `, [s.id, s.employeeId, s.firstName, s.lastName, s.role, s.email, s.phone, s.joiningDate, s.status, s.department, s.avatar || null]);
      }
    }

    if (settings) {
      await pool.query(`
        INSERT INTO public.hotel_settings (id, data, "updatedAt")
        VALUES ('current', $1, NOW())
        ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, "updatedAt" = NOW();
      `, [JSON.stringify(settings)]);
    }

    res.json({ status: 'success', message: 'All hotel data synchronized with Supabase' });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// POST /api/supabase/entity — sync a single entity
app.post('/api/supabase/entity', async (req, res) => {
  try {
    const { entity, data } = req.body;
    const items = Array.isArray(data) ? data : [data];

    if (entity === 'settings') {
      await pool.query(`
        INSERT INTO public.hotel_settings (id, data, "updatedAt")
        VALUES ('current', $1, NOW())
        ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, "updatedAt" = NOW();
      `, [JSON.stringify(data)]);
    } else if (entity === 'rooms') {
      for (const r of items) {
        await pool.query(`
          INSERT INTO public.rooms (id, "roomNumber", type, floor, capacity, "pricePerNight", status, amenities, description, image)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
          ON CONFLICT (id) DO UPDATE SET
            "roomNumber"=$2, type=$3, floor=$4, capacity=$5,
            "pricePerNight"=$6, status=$7, amenities=$8, description=$9, image=$10;
        `, [r.id, r.roomNumber, r.type, r.floor, r.capacity, r.pricePerNight, r.status, JSON.stringify(r.amenities), r.description, r.image || null]);
      }
    } else if (entity === 'guests') {
      for (const g of items) {
        await pool.query(`
          INSERT INTO public.guests (id, "firstName", "lastName", email, phone, country, address, notes, status, "totalBookings", "totalSpent")
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
          ON CONFLICT (id) DO UPDATE SET
            "firstName"=$2, "lastName"=$3, email=$4, phone=$5, country=$6,
            address=$7, notes=$8, status=$9, "totalBookings"=$10, "totalSpent"=$11;
        `, [g.id, g.firstName, g.lastName, g.email, g.phone, g.country, g.address, g.notes, g.status, g.totalBookings, g.totalSpent]);
      }
    }

    res.json({ status: 'success', message: `Synced ${entity} to Supabase` });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// ──────────────────────────────────────────────
//  SERVE REACT FRONTEND (production build)
// ──────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'dist')));

// Catch-all: serve index.html for React Router (Express 5 requires named wildcard)
app.get('/{*splat}', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// ── Start server ──
app.listen(PORT, () => {
  console.log(`✅ Hotel Management System server running on port ${PORT}`);
  console.log(`📊 Database: ${process.env.DATABASE_URL ? 'Using DATABASE_URL env var' : 'Using hardcoded connection string'}`);
});
