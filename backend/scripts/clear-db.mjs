// Script to clear all data except users, user_wallets, kyc_verifications
// Run from backend/: node scripts/clear-db.mjs

import { createRequire } from 'module';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env manually
const envPath = resolve(__dirname, '../.env');
const envContent = readFileSync(envPath, 'utf-8');
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const idx = trimmed.indexOf('=');
  if (idx === -1) continue;
  const key = trimmed.slice(0, idx).trim();
  const val = trimmed.slice(idx + 1).trim();
  if (!process.env[key]) process.env[key] = val;
}

const { PrismaClient } = await import('@prisma/client');
const { PrismaPg } = await import('@prisma/adapter-pg');
const pg = (await import('pg')).default;

const pool = new pg.Pool({ connectionString: process.env['DATABASE_URL'] });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Starting DB cleanup — keeping users, wallets, KYC...\n');

  // Delete in FK-safe order (children before parents)
  const r1 = await prisma.shareHolding.deleteMany();
  console.log(`share_holdings deleted: ${r1.count}`);

  const r2 = await prisma.dividend.deleteMany();
  console.log(`dividends deleted: ${r2.count}`);

  const r3 = await prisma.transaction.deleteMany();
  console.log(`transactions deleted: ${r3.count}`);

  const r4 = await prisma.listing.deleteMany();
  console.log(`listings deleted: ${r4.count}`);

  const r5 = await prisma.expense.deleteMany();
  console.log(`expenses deleted: ${r5.count}`);

  const r6 = await prisma.ride.deleteMany();
  console.log(`rides deleted: ${r6.count}`);

  const r7 = await prisma.notification.deleteMany();
  console.log(`notifications deleted: ${r7.count}`);

  const r8 = await prisma.driverApplication.deleteMany();
  console.log(`driver_applications deleted: ${r8.count}`);

  // Reset driver profile: clear assigned car + reset stats (keep profile itself)
  const r9 = await prisma.driverProfile.updateMany({
    data: {
      assignedCarId: null,
      rating: 0,
      totalRides: 0,
      approved: false,
    },
  });
  console.log(`driver_profiles reset: ${r9.count}`);

  // Delete all cars (after all FK deps are gone)
  const r10 = await prisma.car.deleteMany();
  console.log(`cars deleted: ${r10.count}`);

  // Reset blockchain sync state
  await prisma.blockchainSyncState.deleteMany();
  await prisma.blockchainSyncState.upsert({
    where: { id: 'singleton' },
    create: { id: 'singleton', lastProcessedBlock: 0 },
    update: { lastProcessedBlock: 0 },
  });
  console.log('blockchain_sync_state reset to block 0');

  console.log('\nDB cleanup complete.');
  console.log('Users, user_wallets, kyc_verifications, and driver_profiles (empty) are preserved.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
