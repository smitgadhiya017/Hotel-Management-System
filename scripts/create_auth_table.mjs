import pkg from 'pg';
import crypto from 'crypto';

const { Client } = pkg;
const connectionString = 'postgresql://postgres:Smitgadhiya@db.ykrwarvqrpxndkgyswiv.supabase.co:5432/postgres';

export function hashPassword(password, salt = 'grandstay_salt_2026') {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
}

async function run() {
  console.log('Connecting to Supabase PostgreSQL...');
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();

  console.log('Creating auth_users table if not exists...');
  await client.query(`
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

  console.log('Checking existing users...');
  const existing = await client.query('SELECT email FROM public.auth_users;');
  const existingEmails = new Set(existing.rows.map(r => r.email.toLowerCase()));

  const defaultUsers = [
    {
      id: 'usr_admin',
      email: 'admin@grandstay.in',
      password: 'admin123',
      name: 'Rajeshwar Rao',
      role: 'Administrator',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    },
    {
      id: 'usr_manager',
      email: 'manager@grandstay.in',
      password: 'manager123',
      name: 'Sunita Kapoor',
      role: 'Manager',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    },
    {
      id: 'usr_reception',
      email: 'reception@grandstay.in',
      password: 'reception123',
      name: 'Amit Singhania',
      role: 'Receptionist',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    },
  ];

  for (const user of defaultUsers) {
    const hash = hashPassword(user.password);
    if (existingEmails.has(user.email.toLowerCase())) {
      console.log(`User ${user.email} already exists, updating password hash...`);
      await client.query(
        `UPDATE public.auth_users SET password_hash = $1, name = $2, role = $3, avatar = $4 WHERE email = $5`,
        [hash, user.name, user.role, user.avatar, user.email]
      );
    } else {
      console.log(`Inserting default user: ${user.email} (${user.role})...`);
      await client.query(
        `INSERT INTO public.auth_users (id, email, password_hash, name, role, avatar)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [user.id, user.email, hash, user.name, user.role, user.avatar]
      );
    }
  }

  const allUsers = await client.query('SELECT id, email, name, role, created_at FROM public.auth_users;');
  console.log('✅ Current auth_users in Supabase:', allUsers.rows);

  await client.end();
}

run().catch(err => {
  console.error('❌ Error setting up auth_users:', err);
  process.exit(1);
});
