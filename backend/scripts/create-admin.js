require('dotenv').config();
const pg = require('pg');
const bcrypt = require('bcrypt');

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  const hash = await bcrypt.hash('admin123', 12);

  const sql = `
    INSERT INTO users (id, email, "passwordHash", name, roles, "activeRole", "kycVerified", "emailVerified", "onboardingCompleted", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), $1, $2, $3, ARRAY['admin']::"UserRole"[], 'admin', true, true, true, now(), now())
    ON CONFLICT (email) DO UPDATE SET
      "passwordHash" = EXCLUDED."passwordHash",
      roles = ARRAY['admin']::"UserRole"[],
      "activeRole" = 'admin',
      "emailVerified" = true,
      "onboardingCompleted" = true,
      "updatedAt" = now()
  `;

  await pool.query(sql, ['admin@demo.com', hash, 'Platform Admin']);

  const check = await pool.query(
    'SELECT id, email, roles, "emailVerified", "onboardingCompleted" FROM users WHERE email = $1',
    ['admin@demo.com']
  );
  console.log('Admin user ready:', JSON.stringify(check.rows[0]));
  await pool.end();
}

run().catch(e => { console.error('Error:', e.message); process.exit(1); });
