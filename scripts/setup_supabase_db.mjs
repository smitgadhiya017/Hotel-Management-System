import 'dotenv/config';
import pkg from 'pg';
import crypto from 'crypto';
const { Client } = pkg;
import {
  INITIAL_ROOMS, INITIAL_GUESTS, INITIAL_RESERVATIONS,
  INITIAL_PAYMENTS, INITIAL_STAFF, INITIAL_SETTINGS
} from '../src/data/mockData.ts';

const PASSWORD_SALT = 'grandstay_salt_2026';
function hashPassword(password) {
  return crypto.pbkdf2Sync(password, PASSWORD_SALT, 10000, 64, 'sha512').toString('hex');
}

const connectionString = process.env.DATABASE_URL;

async function setupDatabase() {
  if (!connectionString) {
    console.error('❌ Error: DATABASE_URL is not defined. Please set it in your .env file or environment.');
    process.exit(1);
  }
  console.log('Connecting to Supabase PostgreSQL database...');
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });

  try {
    await client.connect();
    console.log('Connected successfully!');

    console.log('Creating tables...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.rooms (
        id TEXT PRIMARY KEY,
        "roomNumber" TEXT NOT NULL,
        type TEXT NOT NULL,
        floor INTEGER NOT NULL,
        capacity INTEGER NOT NULL,
        "pricePerNight" NUMERIC NOT NULL,
        status TEXT NOT NULL,
        amenities JSONB DEFAULT '[]'::jsonb,
        description TEXT,
        image TEXT
      );

      CREATE TABLE IF NOT EXISTS public.guests (
        id TEXT PRIMARY KEY,
        "firstName" TEXT NOT NULL,
        "lastName" TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        country TEXT,
        address TEXT,
        notes TEXT,
        status TEXT DEFAULT 'Active',
        "totalBookings" INTEGER DEFAULT 0,
        "totalSpent" NUMERIC DEFAULT 0,
        "createdAt" TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS public.reservations (
        id TEXT PRIMARY KEY,
        "bookingId" TEXT NOT NULL,
        "guestId" TEXT,
        "guestName" TEXT NOT NULL,
        "guestEmail" TEXT,
        "guestPhone" TEXT,
        "roomId" TEXT,
        "roomNumber" TEXT NOT NULL,
        "roomType" TEXT NOT NULL,
        "checkIn" TEXT NOT NULL,
        "checkOut" TEXT NOT NULL,
        adults INTEGER DEFAULT 1,
        children INTEGER DEFAULT 0,
        "pricePerNight" NUMERIC NOT NULL,
        nights INTEGER NOT NULL,
        "totalAmount" NUMERIC NOT NULL,
        "paymentStatus" TEXT DEFAULT 'Unpaid',
        "bookingStatus" TEXT DEFAULT 'Confirmed',
        notes TEXT,
        "createdAt" TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS public.payments (
        id TEXT PRIMARY KEY,
        "paymentId" TEXT NOT NULL,
        "bookingId" TEXT,
        "reservationId" TEXT,
        "guestId" TEXT,
        "guestName" TEXT NOT NULL,
        date TEXT NOT NULL,
        method TEXT NOT NULL,
        amount NUMERIC NOT NULL,
        status TEXT NOT NULL,
        notes TEXT
      );

      CREATE TABLE IF NOT EXISTS public.staff (
        id TEXT PRIMARY KEY,
        "employeeId" TEXT NOT NULL,
        "firstName" TEXT NOT NULL,
        "lastName" TEXT NOT NULL,
        role TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        "joiningDate" TEXT,
        status TEXT DEFAULT 'Active',
        department TEXT,
        avatar TEXT
      );

      CREATE TABLE IF NOT EXISTS public.hotel_settings (
        id TEXT PRIMARY KEY DEFAULT 'current',
        data JSONB NOT NULL,
        "updatedAt" TIMESTAMPTZ DEFAULT NOW()
      );

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
    console.log('Tables created successfully!');

    console.log('Enabling Row Level Security and creating policies for anon & authenticated roles...');
    await client.query(`
      ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.hotel_settings ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.auth_users ENABLE ROW LEVEL SECURITY;

      DO $$
      BEGIN
        DROP POLICY IF EXISTS "Allow all on rooms" ON public.rooms;
        CREATE POLICY "Allow all on rooms" ON public.rooms FOR ALL USING (true) WITH CHECK (true);
        
        DROP POLICY IF EXISTS "Allow all on guests" ON public.guests;
        CREATE POLICY "Allow all on guests" ON public.guests FOR ALL USING (true) WITH CHECK (true);
        
        DROP POLICY IF EXISTS "Allow all on reservations" ON public.reservations;
        CREATE POLICY "Allow all on reservations" ON public.reservations FOR ALL USING (true) WITH CHECK (true);
        
        DROP POLICY IF EXISTS "Allow all on payments" ON public.payments;
        CREATE POLICY "Allow all on payments" ON public.payments FOR ALL USING (true) WITH CHECK (true);
        
        DROP POLICY IF EXISTS "Allow all on staff" ON public.staff;
        CREATE POLICY "Allow all on staff" ON public.staff FOR ALL USING (true) WITH CHECK (true);
        
        DROP POLICY IF EXISTS "Allow all on hotel_settings" ON public.hotel_settings;
        CREATE POLICY "Allow all on hotel_settings" ON public.hotel_settings FOR ALL USING (true) WITH CHECK (true);

        DROP POLICY IF EXISTS "Allow all on auth_users" ON public.auth_users;
        CREATE POLICY "Allow all on auth_users" ON public.auth_users FOR ALL USING (true) WITH CHECK (true);
      END $$;

      GRANT ALL ON TABLE public.rooms TO anon, authenticated, service_role;
      GRANT ALL ON TABLE public.guests TO anon, authenticated, service_role;
      GRANT ALL ON TABLE public.reservations TO anon, authenticated, service_role;
      GRANT ALL ON TABLE public.payments TO anon, authenticated, service_role;
      GRANT ALL ON TABLE public.staff TO anon, authenticated, service_role;
      GRANT ALL ON TABLE public.hotel_settings TO anon, authenticated, service_role;
      GRANT ALL ON TABLE public.auth_users TO anon, authenticated, service_role;
      GRANT ALL ON TABLE public.staff TO anon, authenticated, service_role;
      GRANT ALL ON TABLE public.hotel_settings TO anon, authenticated, service_role;
    `);
    console.log('RLS policies and grants applied!');

    // Seed data
    console.log('Seeding initial rooms...');
    for (const r of INITIAL_ROOMS) {
      await client.query(`
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

    console.log('Seeding initial guests...');
    for (const g of INITIAL_GUESTS) {
      await client.query(`
        INSERT INTO public.guests (id, "firstName", "lastName", email, phone, country, address, notes, status, "totalBookings", "totalSpent", "createdAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
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
      `, [g.id, g.firstName, g.lastName, g.email, g.phone, g.country, g.address, g.notes, g.status, g.totalBookings, g.totalSpent, g.createdAt]);
    }

    console.log('Seeding initial reservations...');
    for (const res of INITIAL_RESERVATIONS) {
      await client.query(`
        INSERT INTO public.reservations (
          id, "bookingId", "guestId", "guestName", "guestEmail", "guestPhone",
          "roomId", "roomNumber", "roomType", "checkIn", "checkOut", adults, children,
          "pricePerNight", nights, "totalAmount", "paymentStatus", "bookingStatus", notes, "createdAt"
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
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
        res.id, res.bookingId, res.guestId, res.guestName, res.guestEmail, res.guestPhone,
        res.roomId, res.roomNumber, res.roomType, res.checkIn, res.checkOut, res.adults, res.children,
        res.pricePerNight, res.nights, res.totalAmount, res.paymentStatus, res.bookingStatus, res.notes, res.createdAt
      ]);
    }

    console.log('Seeding initial payments...');
    for (const p of INITIAL_PAYMENTS) {
      await client.query(`
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

    console.log('Seeding initial staff...');
    for (const s of INITIAL_STAFF) {
      await client.query(`
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

    console.log('Seeding settings...');
    await client.query(`
      INSERT INTO public.hotel_settings (id, data, "updatedAt")
      VALUES ('current', $1, NOW())
      ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, "updatedAt" = NOW();
    `, [JSON.stringify(INITIAL_SETTINGS)]);

    console.log('Seeding default admin auth user...');
    await client.query(`DELETE FROM public.auth_users WHERE email != 'admin@grandstay.in';`);
    const adminHash = hashPassword('admin123');
    await client.query(`
      INSERT INTO public.auth_users (id, email, password_hash, name, role, avatar, created_at, last_login)
      VALUES ('usr_admin', 'admin@grandstay.in', $1, 'Rajeshwar Rao', 'Administrator', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        name = EXCLUDED.name,
        role = 'Administrator',
        avatar = EXCLUDED.avatar;
    `, [adminHash]);

    console.log('Supabase database setup and seeding COMPLETE!');
    await client.end();
  } catch (err) {
    console.error('Database setup error:', err);
    await client.end().catch(() => {});
    process.exit(1);
  }
}

setupDatabase();
