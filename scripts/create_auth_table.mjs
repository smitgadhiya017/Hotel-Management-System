import 'dotenv/config';
import pkg from 'pg';
import crypto from 'crypto';

const { Client } = pkg;
const connectionString = process.env.DATABASE_URL;

export function hashPassword(password, salt = 'grandstay_salt_2026') {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
}

async function run() {
  if (!connectionString) {
    console.error('❌ Error: DATABASE_URL is not defined. Please set it in your .env file or environment.');
    process.exit(1);
  }
  console.log('Connecting to Supabase PostgreSQL...');
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();

  console.log('Ensuring auth_users table...');
  await client.query(`
    CREATE TABLE IF NOT EXISTS public.auth_users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'Administrator',
      avatar TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      last_login TIMESTAMPTZ
    );
  `);

  console.log('Removing non-admin users so only Administrator can log in...');
  await client.query(`DELETE FROM public.auth_users WHERE email != 'admin@grandstay.in';`);

  const adminHash = hashPassword('admin123');
  await client.query(`
    INSERT INTO public.auth_users (id, email, password_hash, name, role, avatar)
    VALUES ('usr_admin', 'admin@grandstay.in', $1, 'Rajeshwar Rao', 'Administrator', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150')
    ON CONFLICT (id) DO UPDATE SET
      password_hash = $1,
      role = 'Administrator',
      name = 'Rajeshwar Rao';
  `, [adminHash]);

  const allUsers = await client.query('SELECT id, email, name, role, created_at FROM public.auth_users;');
  console.log('✅ Current auth_users in Supabase (Admin Only):', allUsers.rows);

  await client.end();
}

run().catch(err => {
  console.error('❌ Error setting up auth_users:', err);
  process.exit(1);
});
