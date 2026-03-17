require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const p = new PrismaClient({ adapter });
(async () => {
  try {
    const s = await p.blockchainSyncState.findUnique({ where: { id: 'singleton' } });
    console.log('Sync state:', s);
    const sh = await p.shareHolding.count();
    console.log('ShareHoldings count:', sh);
    const l = await p.listing.count();
    console.log('Listings count:', l);
    const t = await p.transaction.count();
    console.log('Transactions count:', t);
  } catch(e) {
    console.error(e);
  } finally {
    await p.$disconnect();
  }
})();
