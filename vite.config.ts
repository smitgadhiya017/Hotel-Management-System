import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import pkg from 'pg'
const { Pool } = pkg

const pool = new Pool({
  connectionString: 'postgresql://postgres:Smitgadhiya@db.ykrwarvqrpxndkgyswiv.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
})

function supabaseDevPlugin(): Plugin {
  return {
    name: 'supabase-dev-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/supabase')) return next();

        res.setHeader('Content-Type', 'application/json');

        try {
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
