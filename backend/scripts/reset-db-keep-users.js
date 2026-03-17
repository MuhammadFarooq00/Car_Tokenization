require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const pg = require('pg');

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Clear all data EXCEPT users and user_wallets
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
        cars,
        blockchain_sync_state
      RESTART IDENTITY CASCADE
    `);

    // Reset onboarding & pending roles on all users so they start fresh
    await client.query(`
      UPDATE users SET
        "onboardingCompleted" = false,
        "pendingRoles" = ARRAY[]::text[],
        "kycVerified" = false,
        "updatedAt" = now()
    `);

    // Keep admin fully set up
    await client.query(`
      UPDATE users SET
        "onboardingCompleted" = true,
        "kycVerified" = true,
        "updatedAt" = now()
      WHERE roles @> ARRAY['admin']::"UserRole"[]
    `);

    await client.query('COMMIT');

    const users = await client.query(
      'SELECT email, roles, "onboardingCompleted", "kycVerified" FROM users ORDER BY "createdAt"'
    );
    console.log('\nAll app data cleared. Users kept:');
    users.rows.forEach(u => console.log(' -', u.email, JSON.stringify(u.roles), `onboarding=${u.onboardingCompleted}`));
    console.log('\nDone.');
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
