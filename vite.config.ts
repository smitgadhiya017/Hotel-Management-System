import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import pkg from 'pg'
import crypto from 'crypto'
const { Pool } = pkg

const pool = new Pool({
  connectionString: 'postgresql://postgres:Smitgadhiya@db.ykrwarvqrpxndkgyswiv.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
})

const PASSWORD_SALT = 'grandstay_salt_2026';
function hashPassword(password: string): string {
  return crypto.pbkdf2Sync(password, PASSWORD_SALT, 10000, 64, 'sha512').toString('hex');
}

function supabaseDevPlugin(): Plugin {
  return {
    name: 'supabase-dev-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/supabase') && !req.url?.startsWith('/api/auth')) return next();

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

        if (req.method === 'OPTIONS') {
          res.statusCode = 200;
          res.end();
          return;
        }

        try {
          if (req.url === '/api/auth/me') {
            const authHeader = (req.headers['authorization'] as string) || '';
            const token = authHeader.replace(/^Bearer\s+/i, '');
            if (!token) {
              res.statusCode = 401;
              res.end(JSON.stringify({ status: 'error', message: 'No authorization token' }));
              return;
            }
            try {
              const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf8'));
              const userRes = await pool.query(
                'SELECT id, email, name, role, avatar, created_at as "createdAt", last_login as "lastLogin" FROM public.auth_users WHERE id = $1 LIMIT 1',
                [decoded.id]
              );
              if (userRes.rows.length === 0) {
                res.statusCode = 401;
                res.end(JSON.stringify({ status: 'error', message: 'User not found' }));
                return;
              }
              res.end(JSON.stringify({ status: 'success', user: userRes.rows[0] }));
            } catch {
              res.statusCode = 401;
              res.end(JSON.stringify({ status: 'error', message: 'Invalid token' }));
            }
            return;
          }

          if (req.url === '/api/supabase/status') {
            const timeRes = await pool.query('SELECT NOW() as now;');
            const counts = await pool.query(`
              SELECT 
                (SELECT COUNT(*) FROM public.rooms)::int as rooms,
                (SELECT COUNT(*) FROM public.guests)::int as guests,
                (SELECT COUNT(*) FROM public.reservations)::int as reservations,
                (SELECT COUNT(*) FROM public.payments)::int as payments,
                (SELECT COUNT(*) FROM public.staff)::int as staff;
            `);
            res.end(JSON.stringify({
              status: 'success',
              time: timeRes.rows[0].now,
              counts: counts.rows[0]
            }));
            return;
          }

          if (req.url === '/api/supabase/all') {
            const [rooms, guests, reservations, payments, staff, settings] = await Promise.all([
              pool.query('SELECT * FROM public.rooms ORDER BY "roomNumber" ASC;'),
              pool.query('SELECT * FROM public.guests ORDER BY "createdAt" DESC;'),
              pool.query('SELECT * FROM public.reservations ORDER BY "createdAt" DESC;'),
              pool.query('SELECT * FROM public.payments ORDER BY date DESC;'),
              pool.query('SELECT * FROM public.staff ORDER BY id ASC;'),
              pool.query("SELECT data FROM public.hotel_settings WHERE id = 'current' LIMIT 1;"),
            ]);

            res.end(JSON.stringify({
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
            }));
            return;
          }

          if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', async () => {
              try {
                const parsed = JSON.parse(body || '{}');

                // Auth: Login
                if (req.url === '/api/auth/login') {
                  const { email, password } = parsed;
                  const cleanEmail = (email || '').trim().toLowerCase();
                  if (!cleanEmail || !password) {
                    res.statusCode = 400;
                    res.end(JSON.stringify({ status: 'error', message: 'Email and password are required' }));
                    return;
                  }
                  const userRes = await pool.query('SELECT * FROM public.auth_users WHERE LOWER(email) = $1 LIMIT 1', [cleanEmail]);
                  if (userRes.rows.length === 0) {
                    res.statusCode = 401;
                    res.end(JSON.stringify({ status: 'error', message: 'No account found with this email' }));
                    return;
                  }
                  const user = userRes.rows[0];
                  const computedHash = hashPassword(password);
                  if (user.password_hash !== computedHash) {
                    res.statusCode = 401;
                    res.end(JSON.stringify({ status: 'error', message: 'Incorrect password' }));
                    return;
                  }
                  await pool.query('UPDATE public.auth_users SET last_login = NOW() WHERE id = $1', [user.id]);
                  const token = Buffer.from(JSON.stringify({ id: user.id, email: user.email, role: user.role, t: Date.now() })).toString('base64');
                  res.end(JSON.stringify({
                    status: 'success',
                    message: 'Login successful',
                    token,
                    user: {
                      id: user.id,
                      email: user.email,
                      name: user.name,
                      role: user.role,
                      avatar: user.avatar,
                      lastLogin: new Date().toISOString()
                    }
                  }));
                  return;
                }

                // Auth: Register
                if (req.url === '/api/auth/register') {
                  const { name, email, password, role } = parsed;
                  const cleanEmail = (email || '').trim().toLowerCase();
                  const cleanName = (name || '').trim();
                  const cleanRole = (role || 'Staff').trim();
                  if (!cleanName || !cleanEmail || !password) {
                    res.statusCode = 400;
                    res.end(JSON.stringify({ status: 'error', message: 'Name, email, and password are required' }));
                    return;
                  }
                  if (password.length < 6) {
                    res.statusCode = 400;
                    res.end(JSON.stringify({ status: 'error', message: 'Password must be at least 6 characters long' }));
                    return;
                  }
                  const existing = await pool.query('SELECT id FROM public.auth_users WHERE LOWER(email) = $1 LIMIT 1', [cleanEmail]);
                  if (existing.rows.length > 0) {
                    res.statusCode = 400;
                    res.end(JSON.stringify({ status: 'error', message: 'An account with this email already exists' }));
                    return;
                  }
                  const hash = hashPassword(password);
                  const id = `usr_${Date.now()}`;
                  const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanName)}&background=172554&color=fff`;
                  await pool.query(
                    `INSERT INTO public.auth_users (id, email, password_hash, name, role, avatar, created_at, last_login)
                     VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
                    [id, cleanEmail, hash, cleanName, cleanRole, avatar]
                  );
                  const token = Buffer.from(JSON.stringify({ id, email: cleanEmail, role: cleanRole, t: Date.now() })).toString('base64');
                  res.end(JSON.stringify({
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
                      lastLogin: new Date().toISOString()
                    }
                  }));
                  return;
                }

                // Auth: Logout
                if (req.url === '/api/auth/logout') {
                  res.end(JSON.stringify({ status: 'success', message: 'Signed out successfully' }));
                  return;
                }

                if (req.url === '/api/supabase/syncAll') {
                  const { rooms, guests, reservations, payments, staff, settings } = parsed;

                  if (rooms && rooms.length > 0) {
                    for (const r of rooms) {
                      await pool.query(`
                        INSERT INTO public.rooms (id, "roomNumber", type, floor, capacity, "pricePerNight", status, amenities, description, image)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                        ON CONFLICT (id) DO UPDATE SET
                          "roomNumber" = EXCLUDED."roomNumber",
                          type = EXCLUDED.type,
                          floor = EXCLUDED.floor,
                          capacity = EXCLUDED.capacity,
                          "pricePerNight" = EXCLUDED."pricePerNight",
                          status = EXCLUDED.status,
                          amenities = EXCLUDED.amenities,
                          description = EXCLUDED.description,
                          image = EXCLUDED.image;
                      `, [r.id, r.roomNumber, r.type, r.floor, r.capacity, r.pricePerNight, r.status, JSON.stringify(r.amenities), r.description, r.image || null]);
                    }
                  }

                  if (guests && guests.length > 0) {
                    for (const g of guests) {
                      await pool.query(`
                        INSERT INTO public.guests (id, "firstName", "lastName", email, phone, country, address, notes, status, "totalBookings", "totalSpent")
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                        ON CONFLICT (id) DO UPDATE SET
                          "firstName" = EXCLUDED."firstName",
                          "lastName" = EXCLUDED."lastName",
                          email = EXCLUDED.email,
                          phone = EXCLUDED.phone,
                          country = EXCLUDED.country,
                          address = EXCLUDED.address,
                          notes = EXCLUDED.notes,
                          status = EXCLUDED.status,
                          "totalBookings" = EXCLUDED."totalBookings",
                          "totalSpent" = EXCLUDED."totalSpent";
                      `, [g.id, g.firstName, g.lastName, g.email, g.phone, g.country, g.address, g.notes, g.status, g.totalBookings, g.totalSpent]);
                    }
                  }

                  if (reservations && reservations.length > 0) {
                    for (const resItem of reservations) {
                      await pool.query(`
                        INSERT INTO public.reservations (
                          id, "bookingId", "guestId", "guestName", "guestEmail", "guestPhone",
                          "roomId", "roomNumber", "roomType", "checkIn", "checkOut", adults, children,
                          "pricePerNight", nights, "totalAmount", "paymentStatus", "bookingStatus", notes
                        )
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
                        ON CONFLICT (id) DO UPDATE SET
                          "bookingId" = EXCLUDED."bookingId",
                          "guestId" = EXCLUDED."guestId",
                          "guestName" = EXCLUDED."guestName",
                          "guestEmail" = EXCLUDED."guestEmail",
                          "guestPhone" = EXCLUDED."guestPhone",
                          "roomId" = EXCLUDED."roomId",
                          "roomNumber" = EXCLUDED."roomNumber",
                          "roomType" = EXCLUDED."roomType",
                          "checkIn" = EXCLUDED."checkIn",
                          "checkOut" = EXCLUDED."checkOut",
                          adults = EXCLUDED.adults,
                          children = EXCLUDED.children,
                          "pricePerNight" = EXCLUDED."pricePerNight",
                          nights = EXCLUDED.nights,
                          "totalAmount" = EXCLUDED."totalAmount",
                          "paymentStatus" = EXCLUDED."paymentStatus",
                          "bookingStatus" = EXCLUDED."bookingStatus",
                          notes = EXCLUDED.notes;
                      `, [
                        resItem.id, resItem.bookingId, resItem.guestId, resItem.guestName, resItem.guestEmail, resItem.guestPhone,
                        resItem.roomId, resItem.roomNumber, resItem.roomType, resItem.checkIn, resItem.checkOut, resItem.adults, resItem.children,
                        resItem.pricePerNight, resItem.nights, resItem.totalAmount, resItem.paymentStatus, resItem.bookingStatus, resItem.notes
                      ]);
                    }
                  }

                  if (payments && payments.length > 0) {
                    for (const p of payments) {
                      await pool.query(`
                        INSERT INTO public.payments (id, "paymentId", "bookingId", "reservationId", "guestId", "guestName", date, method, amount, status, notes)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                        ON CONFLICT (id) DO UPDATE SET
                          "paymentId" = EXCLUDED."paymentId",
                          "bookingId" = EXCLUDED."bookingId",
                          "reservationId" = EXCLUDED."reservationId",
                          "guestId" = EXCLUDED."guestId",
                          "guestName" = EXCLUDED."guestName",
                          date = EXCLUDED.date,
                          method = EXCLUDED.method,
                          amount = EXCLUDED.amount,
                          status = EXCLUDED.status,
                          notes = EXCLUDED.notes;
                      `, [p.id, p.paymentId, p.bookingId, p.reservationId, p.guestId, p.guestName, p.date, p.method, p.amount, p.status, p.notes]);
                    }
                  }

                  if (staff && staff.length > 0) {
                    for (const s of staff) {
                      await pool.query(`
                        INSERT INTO public.staff (id, "employeeId", "firstName", "lastName", role, email, phone, "joiningDate", status, department, avatar)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                        ON CONFLICT (id) DO UPDATE SET
                          "employeeId" = EXCLUDED."employeeId",
                          "firstName" = EXCLUDED."firstName",
                          "lastName" = EXCLUDED."lastName",
                          role = EXCLUDED.role,
                          email = EXCLUDED.email,
                          phone = EXCLUDED.phone,
                          "joiningDate" = EXCLUDED."joiningDate",
                          status = EXCLUDED.status,
                          department = EXCLUDED.department,
                          avatar = EXCLUDED.avatar;
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

                  res.end(JSON.stringify({ status: 'success', message: 'All hotel data synchronized with Supabase' }));
                  return;
                }

                if (req.url === '/api/supabase/entity') {
                  const { entity, data } = parsed;
                  const items = Array.isArray(data) ? data : [data];

                  if (entity === 'rooms') {
                    for (const r of items) {
                      await pool.query(`
                        INSERT INTO public.rooms (id, "roomNumber", type, floor, capacity, "pricePerNight", status, amenities, description, image)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                        ON CONFLICT (id) DO UPDATE SET
                          "roomNumber" = EXCLUDED."roomNumber",
                          type = EXCLUDED.type,
                          floor = EXCLUDED.floor,
                          capacity = EXCLUDED.capacity,
                          "pricePerNight" = EXCLUDED."pricePerNight",
                          status = EXCLUDED.status,
                          amenities = EXCLUDED.amenities,
                          description = EXCLUDED.description,
                          image = EXCLUDED.image;
                      `, [r.id, r.roomNumber, r.type, r.floor, r.capacity, r.pricePerNight, r.status, JSON.stringify(r.amenities), r.description, r.image || null]);
                    }
                  } else if (entity === 'guests') {
                    for (const g of items) {
                      await pool.query(`
                        INSERT INTO public.guests (id, "firstName", "lastName", email, phone, country, address, notes, status, "totalBookings", "totalSpent")
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                        ON CONFLICT (id) DO UPDATE SET
                          "firstName" = EXCLUDED."firstName",
                          "lastName" = EXCLUDED."lastName",
                          email = EXCLUDED.email,
                          phone = EXCLUDED.phone,
                          country = EXCLUDED.country,
                          address = EXCLUDED.address,
                          notes = EXCLUDED.notes,
                          status = EXCLUDED.status,
                          "totalBookings" = EXCLUDED."totalBookings",
                          "totalSpent" = EXCLUDED."totalSpent";
                      `, [g.id, g.firstName, g.lastName, g.email, g.phone, g.country, g.address, g.notes, g.status, g.totalBookings, g.totalSpent]);
                    }
                  } else if (entity === 'reservations') {
                    for (const resItem of items) {
                      await pool.query(`
                        INSERT INTO public.reservations (
                          id, "bookingId", "guestId", "guestName", "guestEmail", "guestPhone",
                          "roomId", "roomNumber", "roomType", "checkIn", "checkOut", adults, children,
                          "pricePerNight", nights, "totalAmount", "paymentStatus", "bookingStatus", notes
                        )
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
                        ON CONFLICT (id) DO UPDATE SET
                          "bookingId" = EXCLUDED."bookingId",
                          "guestId" = EXCLUDED."guestId",
                          "guestName" = EXCLUDED."guestName",
                          "guestEmail" = EXCLUDED."guestEmail",
                          "guestPhone" = EXCLUDED."guestPhone",
                          "roomId" = EXCLUDED."roomId",
                          "roomNumber" = EXCLUDED."roomNumber",
                          "roomType" = EXCLUDED."roomType",
                          "checkIn" = EXCLUDED."checkIn",
                          "checkOut" = EXCLUDED."checkOut",
                          adults = EXCLUDED.adults,
                          children = EXCLUDED.children,
                          "pricePerNight" = EXCLUDED."pricePerNight",
                          nights = EXCLUDED.nights,
                          "totalAmount" = EXCLUDED."totalAmount",
                          "paymentStatus" = EXCLUDED."paymentStatus",
                          "bookingStatus" = EXCLUDED."bookingStatus",
                          notes = EXCLUDED.notes;
                      `, [
                        resItem.id, resItem.bookingId, resItem.guestId, resItem.guestName, resItem.guestEmail, resItem.guestPhone,
                        resItem.roomId, resItem.roomNumber, resItem.roomType, resItem.checkIn, resItem.checkOut, resItem.adults, resItem.children,
                        resItem.pricePerNight, resItem.nights, resItem.totalAmount, resItem.paymentStatus, resItem.bookingStatus, resItem.notes
                      ]);
                    }
                  } else if (entity === 'payments') {
                    for (const p of items) {
                      await pool.query(`
                        INSERT INTO public.payments (id, "paymentId", "bookingId", "reservationId", "guestId", "guestName", date, method, amount, status, notes)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                        ON CONFLICT (id) DO UPDATE SET
                          "paymentId" = EXCLUDED."paymentId",
                          "bookingId" = EXCLUDED."bookingId",
                          "reservationId" = EXCLUDED."reservationId",
                          "guestId" = EXCLUDED."guestId",
                          "guestName" = EXCLUDED."guestName",
                          date = EXCLUDED.date,
                          method = EXCLUDED.method,
                          amount = EXCLUDED.amount,
                          status = EXCLUDED.status,
                          notes = EXCLUDED.notes;
                      `, [p.id, p.paymentId, p.bookingId, p.reservationId, p.guestId, p.guestName, p.date, p.method, p.amount, p.status, p.notes]);
                    }
                  } else if (entity === 'staff') {
                    for (const s of items) {
                      await pool.query(`
                        INSERT INTO public.staff (id, "employeeId", "firstName", "lastName", role, email, phone, "joiningDate", status, department, avatar)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                        ON CONFLICT (id) DO UPDATE SET
                          "employeeId" = EXCLUDED."employeeId",
                          "firstName" = EXCLUDED."firstName",
                          "lastName" = EXCLUDED."lastName",
                          role = EXCLUDED.role,
                          email = EXCLUDED.email,
                          phone = EXCLUDED.phone,
                          "joiningDate" = EXCLUDED."joiningDate",
                          status = EXCLUDED.status,
                          department = EXCLUDED.department,
                          avatar = EXCLUDED.avatar;
                      `, [s.id, s.employeeId, s.firstName, s.lastName, s.role, s.email, s.phone, s.joiningDate, s.status, s.department, s.avatar || null]);
                    }
                  } else if (entity === 'settings') {
                    await pool.query(`
                      INSERT INTO public.hotel_settings (id, data, "updatedAt")
                      VALUES ('current', $1, NOW())
                      ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, "updatedAt" = NOW();
                    `, [JSON.stringify(data)]);
                  }

                  res.end(JSON.stringify({ status: 'success', message: `Synced ${entity} to Supabase` }));
                  return;
                }

                res.end(JSON.stringify({ status: 'error', message: 'Unknown endpoint' }));
              } catch (e: unknown) {
                const message = e instanceof Error ? e.message : String(e);
                res.statusCode = 500;
                res.end(JSON.stringify({ status: 'error', message }));
              }
            });
            return;
          }

          res.statusCode = 404;
          res.end(JSON.stringify({ status: 'error', message: 'Not found' }));
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err);
          res.statusCode = 500;
          res.end(JSON.stringify({ status: 'error', message }));
        }
      });
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), supabaseDevPlugin()],
})
