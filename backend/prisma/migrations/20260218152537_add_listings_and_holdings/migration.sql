-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('active', 'filled', 'cancelled');

-- AlterEnum
ALTER TYPE "TransactionType" ADD VALUE 'car_created';

-- CreateTable
CREATE TABLE "listings" (
    "id" INTEGER NOT NULL,
    "sellerId" TEXT NOT NULL,
    "carId" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "remainingAmount" INTEGER NOT NULL,
    "pricePerShare" TEXT NOT NULL,
    "status" "ListingStatus" NOT NULL DEFAULT 'active',
    "txHash" TEXT,
    "blockNumber" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cancelledAt" TIMESTAMP(3),
    "filledAt" TIMESTAMP(3),

    CONSTRAINT "listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "share_holdings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "carId" INTEGER NOT NULL,
    "shares" INTEGER NOT NULL,
    "lastUpdatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "share_holdings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "listings_txHash_key" ON "listings"("txHash");

-- CreateIndex
CREATE INDEX "listings_sellerId_idx" ON "listings"("sellerId");

-- CreateIndex
CREATE INDEX "listings_carId_idx" ON "listings"("carId");

-- CreateIndex
CREATE INDEX "listings_status_idx" ON "listings"("status");

-- CreateIndex
CREATE UNIQUE INDEX "share_holdings_userId_carId_key" ON "share_holdings"("userId", "carId");

-- CreateIndex
CREATE INDEX "share_holdings_userId_idx" ON "share_holdings"("userId");

-- CreateIndex
CREATE INDEX "share_holdings_carId_idx" ON "share_holdings"("carId");

-- AddForeignKey
ALTER TABLE "listings" ADD CONSTRAINT "listings_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listings" ADD CONSTRAINT "listings_carId_fkey" FOREIGN KEY ("carId") REFERENCES "cars"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "share_holdings" ADD CONSTRAINT "share_holdings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "share_holdings" ADD CONSTRAINT "share_holdings_carId_fkey" FOREIGN KEY ("carId") REFERENCES "cars"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
