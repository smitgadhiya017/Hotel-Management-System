import express from 'express';
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const pkg = require('pg');
const { Pool } = pkg;

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 10000;

// ── Database connection (uses env var in production, hardcoded for local fallback) ──
const pool = new Pool({
  connectionString: process.env.DATABASE_URL ||
    'postgresql://postgres:Smitgadhiya@db.ykrwarvqrpxndkgyswiv.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false },
  max: 5,
  idleTimeoutMillis: 30000,
});

// ── Middleware ──
app.use(express.json({ limit: '10mb' }));

// ── CORS headers (allow your Render frontend domain) ──
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
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
