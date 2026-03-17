import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import * as bcrypt from 'bcrypt';

const pool = new pg.Pool({ connectionString: process.env['DATABASE_URL'] });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');

  // ─── Clear existing data (reverse dependency order) ─────────────────────────
  await prisma.transaction.deleteMany();
  await prisma.dividend.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.ride.deleteMany();
  await prisma.driverApplication.deleteMany();
  await prisma.driverProfile.deleteMany();
  await prisma.kYCVerification.deleteMany();
  await prisma.car.deleteMany();
  await prisma.user.deleteMany();
  await prisma.blockchainSyncState.deleteMany();

  console.log('Cleared existing data.');

  // ─── Create Users ───────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('demo123', 12);
  const adminHash = await bcrypt.hash('admin123', 12);

  const investor = await prisma.user.create({
    data: {
      email: 'investor@demo.com',
      passwordHash,
      name: 'Alex Investor',
      walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
      roles: ['investor'],
      activeRole: 'investor',
      kycVerified: true,
      emailVerified: true,
      onboardingCompleted: true,
    },
  });

  const owner = await prisma.user.create({
    data: {
      email: 'owner@demo.com',
      passwordHash,
      name: 'Sarah CarOwner',
      walletAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
      roles: ['car_owner'],
      activeRole: 'car_owner',
      kycVerified: true,
      emailVerified: true,
      onboardingCompleted: true,
    },
  });

  const driver = await prisma.user.create({
    data: {
      email: 'driver@demo.com',
      passwordHash,
      name: 'Mike Driver',
      walletAddress: '0x9876543210fedcba9876543210fedcba98765432',
      roles: ['driver'],
      activeRole: 'driver',
      kycVerified: true,
      emailVerified: true,
      onboardingCompleted: true,
    },
  });

  const admin = await prisma.user.create({
    data: {
      email: 'admin@demo.com',
      passwordHash: adminHash,
      name: 'Platform Admin',
      walletAddress: '0xfedcba9876543210fedcba9876543210fedcba98',
      roles: ['admin'],
      activeRole: 'admin',
      kycVerified: true,
      emailVerified: true,
      onboardingCompleted: true,
    },
  });

  console.log(`Created ${4} users.`);

  // ─── Create Cars ────────────────────────────────────────────────────────────
  const carsData = [
    {
      id: 0,
      name: '2024 Porsche 911 GT3',
      make: 'Porsche',
      model: '911 GT3',
      year: 2024,
      vin: 'WP0AC2A97RS123456',
      totalShares: 1000,
      pricePerShare: '25000000000000000', // 0.025 ETH
      metadataCID: 'QmPorsche911GT3MetadataPlaceholder',
    },
    {
      id: 1,
      name: '2023 Ferrari SF90 Stradale',
      make: 'Ferrari',
      model: 'SF90 Stradale',
      year: 2023,
      vin: 'ZFF96LLA7P0123456',
      totalShares: 2000,
      pricePerShare: '50000000000000000', // 0.05 ETH
      metadataCID: 'QmFerrariSF90MetadataPlaceholder',
    },
    {
      id: 2,
      name: '2024 BMW M4 Competition',
      make: 'BMW',
      model: 'M4 Competition',
      year: 2024,
      vin: 'WBS43AZ04R8123456',
      totalShares: 800,
      pricePerShare: '15000000000000000', // 0.015 ETH
      metadataCID: 'QmBMWM4CompetitionMetadataPlaceholder',
    },
    {
      id: 3,
      name: '2024 Mercedes-AMG GT 63',
      make: 'Mercedes-Benz',
      model: 'AMG GT 63',
      year: 2024,
      vin: 'W1K7X6HB7RA123456',
      totalShares: 1500,
      pricePerShare: '35000000000000000', // 0.035 ETH
      metadataCID: 'QmMercedesAMGGT63MetadataPlaceholder',
    },
    {
      id: 4,
      name: '2024 Lamborghini Huracan EVO',
      make: 'Lamborghini',
      model: 'Huracan EVO',
      year: 2024,
      vin: 'ZHWUF5ZF5PLA12345',
      totalShares: 2500,
      pricePerShare: '40000000000000000', // 0.04 ETH
      metadataCID: 'QmLamborghiniHuracanEVOMetadataPlaceholder',
    },
    {
      id: 5,
      name: '2024 Audi R8 V10 Performance',
      make: 'Audi',
      model: 'R8 V10',
      year: 2024,
      vin: 'WUABAAFX3R7123456',
      totalShares: 1200,
      pricePerShare: '30000000000000000', // 0.03 ETH
      metadataCID: 'QmAudiR8V10MetadataPlaceholder',
    },
    {
      id: 6,
      name: '1967 Ford Mustang Shelby GT500',
      make: 'Ford',
      model: 'Mustang Shelby GT500',
      year: 1967,
      vin: '7T02S123456789012',
      totalShares: 500,
      pricePerShare: '100000000000000000', // 0.1 ETH
      metadataCID: 'QmFordMustangShelbyGT500MetadataPlaceholder',
    },
    {
      id: 7,
      name: '2024 Range Rover SV',
      make: 'Land Rover',
      model: 'Range Rover SV',
      year: 2024,
      vin: 'SALGS5SE5RA123456',
      totalShares: 1000,
      pricePerShare: '20000000000000000', // 0.02 ETH
      metadataCID: 'QmRangeRoverSVMetadataPlaceholder',
    },
  ];

  for (const carData of carsData) {
    await prisma.car.create({
      data: {
        ...carData,
        ownerId: owner.id,
        status: 'active',
      },
    });
  }

  console.log(`Created ${carsData.length} cars.`);

  // ─── Create Driver Profile ──────────────────────────────────────────────────
  await prisma.driverProfile.create({
    data: {
      userId: driver.id,
      license: 'DL-2024-MK-78901',
      experience: 5,
      rating: 4.8,
      totalRides: 142,
      approved: true,
      assignedCarId: 0, // Porsche 911 GT3
    },
  });

  console.log('Created driver profile.');

  // ─── Create Driver Applications ─────────────────────────────────────────────
  await prisma.driverApplication.create({
    data: {
      userId: driver.id,
      carId: 1,
      license: 'DL-2024-MK-78901',
      experience: 5,
      documents: { license: 'ipfs://license-doc', insurance: 'ipfs://insurance-doc' },
      status: 'approved',
      reviewNote: 'Experienced driver with clean record',
      reviewedAt: new Date('2024-11-15'),
    },
  });

  await prisma.driverApplication.create({
    data: {
      userId: investor.id,
      carId: 2,
      license: 'DL-2024-AL-12345',
      experience: 2,
      documents: { license: 'ipfs://investor-license' },
      status: 'pending',
    },
  });

  console.log('Created 2 driver applications.');

  // ─── Create KYC Verifications ───────────────────────────────────────────────
  await prisma.kYCVerification.create({
    data: {
      userId: investor.id,
      documentType: 'passport',
      documentUrl: 'ipfs://investor-passport',
      selfieUrl: 'ipfs://investor-selfie',
      status: 'verified',
      reviewedAt: new Date('2024-10-20'),
    },
  });

  await prisma.kYCVerification.create({
    data: {
      userId: driver.id,
      documentType: 'drivers_license',
      documentUrl: 'ipfs://driver-dl',
      status: 'pending',
    },
  });

  console.log('Created 2 KYC verifications.');

  // ─── Create Rides ───────────────────────────────────────────────────────────
  const ridesData = [
    { carId: 0, pickup: 'Downtown LA', dropoff: 'Beverly Hills', distance: 12.5, duration: 35, grossEarnings: '500000000000000', commission: '50000000000000', netEarnings: '450000000000000' },
    { carId: 0, pickup: 'Santa Monica', dropoff: 'Hollywood', distance: 15.2, duration: 42, grossEarnings: '600000000000000', commission: '60000000000000', netEarnings: '540000000000000' },
    { carId: 0, pickup: 'LAX Airport', dropoff: 'Downtown LA', distance: 18.0, duration: 50, grossEarnings: '800000000000000', commission: '80000000000000', netEarnings: '720000000000000' },
    { carId: 1, pickup: 'Central Park', dropoff: 'Wall Street', distance: 8.3, duration: 28, grossEarnings: '700000000000000', commission: '70000000000000', netEarnings: '630000000000000' },
    { carId: 1, pickup: 'Times Square', dropoff: 'Brooklyn Bridge', distance: 6.1, duration: 22, grossEarnings: '450000000000000', commission: '45000000000000', netEarnings: '405000000000000' },
    { carId: 2, pickup: 'Marina Bay', dropoff: 'Orchard Road', distance: 9.7, duration: 30, grossEarnings: '350000000000000', commission: '35000000000000', netEarnings: '315000000000000' },
    { carId: 2, pickup: 'Sentosa Island', dropoff: 'Changi', distance: 22.4, duration: 55, grossEarnings: '900000000000000', commission: '90000000000000', netEarnings: '810000000000000' },
    { carId: 0, pickup: 'Malibu', dropoff: 'Pasadena', distance: 35.0, duration: 60, grossEarnings: '1200000000000000', commission: '120000000000000', netEarnings: '1080000000000000' },
  ];

  const now = new Date();
  for (let i = 0; i < ridesData.length; i++) {
    const r = ridesData[i];
    await prisma.ride.create({
      data: {
        ...r,
        driverId: driver.id,
        status: 'completed',
        timestamp: new Date(now.getTime() - (i + 1) * 24 * 60 * 60 * 1000), // 1 day apart
      },
    });
  }

  console.log(`Created ${ridesData.length} rides.`);

  // ─── Create Expenses ────────────────────────────────────────────────────────
  const expensesData = [
    { carId: 0, type: 'fuel' as const, amount: '200000000000000', description: 'Full tank refuel', status: 'pending' as const },
    { carId: 0, type: 'maintenance' as const, amount: '1500000000000000', description: 'Oil change and filter replacement', status: 'approved' as const, approvedAt: new Date('2024-12-10') },
    { carId: 1, type: 'cleaning' as const, amount: '100000000000000', description: 'Full interior + exterior detailing', status: 'pending' as const },
    { carId: 2, type: 'maintenance' as const, amount: '3000000000000000', description: 'Brake pad replacement', status: 'rejected' as const },
  ];

  for (const exp of expensesData) {
    const { status, approvedAt, ...data } = exp;
    await prisma.expense.create({
      data: {
        ...data,
        submittedById: driver.id,
        status,
        approvedAt: approvedAt || null,
      },
    });
  }

  console.log(`Created ${expensesData.length} expenses.`);

  // ─── Create Dividends ───────────────────────────────────────────────────────
  const dividendsData = [
    { carId: 0, amount: '750000000000000', status: 'completed' as const, txHash: '0xdividend1abc123', paidAt: new Date('2024-12-01') },
    { carId: 1, amount: '1200000000000000', status: 'completed' as const, txHash: '0xdividend2def456', paidAt: new Date('2024-12-15') },
    { carId: 2, amount: '400000000000000', status: 'completed' as const, txHash: '0xdividend3ghi789', paidAt: new Date('2025-01-01') },
  ];

  for (const div of dividendsData) {
    await prisma.dividend.create({
      data: {
        investorId: investor.id,
        ...div,
      },
    });
  }

  console.log(`Created ${dividendsData.length} dividends.`);

  // ─── Create Transactions ────────────────────────────────────────────────────
  const transactionsData = [
    { userId: investor.id, type: 'primary_purchase' as const, carId: 0, amount: 100, price: '2500000000000000000', txHash: '0xtx001aaa', blockNumber: 1000001 },
    { userId: investor.id, type: 'primary_purchase' as const, carId: 1, amount: 50, price: '2500000000000000000', txHash: '0xtx002bbb', blockNumber: 1000005 },
    { userId: investor.id, type: 'primary_purchase' as const, carId: 2, amount: 200, price: '3000000000000000000', txHash: '0xtx003ccc', blockNumber: 1000010 },
    { userId: investor.id, type: 'listing_filled' as const, carId: 0, amount: 50, price: '1500000000000000000', txHash: '0xtx004ddd', blockNumber: 1000020 },
    { userId: owner.id, type: 'listing_created' as const, carId: 3, amount: 300, price: '10500000000000000000', txHash: '0xtx005eee', blockNumber: 1000030 },
  ];

  for (let i = 0; i < transactionsData.length; i++) {
    const tx = transactionsData[i];
    await prisma.transaction.create({
      data: {
        ...tx,
        timestamp: new Date(now.getTime() - (i + 1) * 2 * 24 * 60 * 60 * 1000), // 2 days apart
      },
    });
  }

  console.log(`Created ${transactionsData.length} transactions.`);

  // ─── Create Blockchain Sync State ───────────────────────────────────────────
  await prisma.blockchainSyncState.upsert({
    where: { id: 'singleton' },
    update: { lastProcessedBlock: 0 },
    create: { id: 'singleton', lastProcessedBlock: 0 },
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
