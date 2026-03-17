require('dotenv').config();
const pg = require('pg');
const bcrypt = require('bcrypt');

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Truncate all tables in reverse FK dependency order, keeping nothing
    await client.query(`
      TRUNCATE TABLE
        listings,
        transactions,
        dividends,
        expenses,
        rides,
        driver_applications,
        driver_profiles,
        kyc_verifications,
        share_holdings,
        notifications,
        user_wallets,
        cars,
        users,
        blockchain_sync_state
      RESTART IDENTITY CASCADE
    `);

    console.log('All tables cleared.');

    // Re-create admin user
    const hash = await bcrypt.hash('admin123', 12);
    await client.query(`
      INSERT INTO users (
        id, email, "passwordHash", name, roles, "activeRole",
        "kycVerified", "emailVerified", "onboardingCompleted", "createdAt", "updatedAt"
      )
      VALUES (
        gen_random_uuid(), $1, $2, $3,
        ARRAY['admin']::"UserRole"[], 'admin',
        true, true, true, now(), now()
      )
    `, ['admin@demo.com', hash, 'Platform Admin']);

    await client.query('COMMIT');

    // Verify
    const res = await client.query(
      'SELECT id, email, roles, "emailVerified" FROM users WHERE email = $1',
      ['admin@demo.com']
    );
    console.log('Admin user restored:', JSON.stringify(res.rows[0]));
    console.log('\nDB reset complete. Only admin@demo.com / admin123 remains.');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Reset failed, rolled back:', e.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
