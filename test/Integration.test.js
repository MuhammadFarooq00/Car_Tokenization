// SPDX-License-Identifier: MIT
// test/Integration.test.js

const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Integration Tests - CarShares & Marketplace", function () {
  let carShares, marketplace;
  let owner, carOwner, user1, user2, user3, user4, user5;
  let carSharesAddress, marketplaceAddress;

  const TOTAL_SUPPLY = 10000n;
  const PUBLIC_RATIO_BPS = 6000n; // 60%
  const PRICE_PER_SHARE = ethers.parseEther("0.01");
  const MIN_PRIMARY_BUY = 10n;
  const METADATA_CID = "QmTestCID123456789";

  beforeEach(async function () {
    [owner, carOwner, user1, user2, user3, user4, user5] = await ethers.getSigners();

    const CarShares = await ethers.getContractFactory("CarShares");
    carShares = await CarShares.deploy();
    carSharesAddress = await carShares.getAddress();

    const Marketplace = await ethers.getContractFactory("Marketplace");
    marketplace = await Marketplace.deploy(carSharesAddress);
    marketplaceAddress = await marketplace.getAddress();
  });

  describe("End-to-End Car Lifecycle", function () {
    it("Should handle full car lifecycle: create, primary sales, secondary trading", async function () {
      // 1. Car owner creates car
      await carShares.connect(carOwner).createCar(
        TOTAL_SUPPLY, PUBLIC_RATIO_BPS, PRICE_PER_SHARE, MIN_PRIMARY_BUY, METADATA_CID
      );

      // 2. Multiple users buy from primary sale
      const buy1 = 1000n;
      const cost1 = buy1 * PRICE_PER_SHARE;
      const fee1 = (cost1 * 250n) / 10000n;
      await carShares.connect(user1).buyPrimary(1, buy1, { value: cost1 + fee1 });

      const buy2 = 1500n;
      const cost2 = buy2 * PRICE_PER_SHARE;
      const fee2 = (cost2 * 250n) / 10000n;
      await carShares.connect(user2).buyPrimary(1, buy2, { value: cost2 + fee2 });

      // 3. User1 lists shares on marketplace
      await carShares.connect(user1).setApprovalForAll(marketplaceAddress, true);
      const listPrice = ethers.parseEther("0.012"); // 20% markup
      await marketplace.connect(user1).createListing(1, 500n, listPrice);

      // 4. User3 buys from marketplace
      const buyAmount = 200n;
      const marketCost = buyAmount * listPrice;
      const marketFee = (marketCost * 250n) / 10000n;
      await marketplace.connect(user3).buyFromListing(1, buyAmount, { value: marketCost + marketFee });

      // 5. Verify final balances
      expect(await carShares.balanceOf(carOwner.address, 1)).to.equal(4000n); // Owner kept 40%
      expect(await carShares.balanceOf(user1.address, 1)).to.equal(500n); // 1000 - 500 listed
      expect(await carShares.balanceOf(user2.address, 1)).to.equal(1500n);
      expect(await carShares.balanceOf(user3.address, 1)).to.equal(200n);
      expect(await carShares.balanceOf(marketplaceAddress, 1)).to.equal(300n); // 500 - 200 sold

      const car = await carShares.getCarConfig(1);
      expect(car.remainingPublicSupply).to.equal(3500n); // 6000 - 2500 sold
    });

    it("Should handle car with complete primary sellout and active secondary market", async function () {
      await carShares.connect(carOwner).createCar(
        TOTAL_SUPPLY, PUBLIC_RATIO_BPS, PRICE_PER_SHARE, MIN_PRIMARY_BUY, METADATA_CID
      );

      // Sell out primary
      const publicSupply = 6000n;
      const portion = 2000n;

      for (let i = 0; i < 3; i++) {
        const cost = portion * PRICE_PER_SHARE;
        const fee = (cost * 250n) / 10000n;
        const users = [user1, user2, user3];
        await carShares.connect(users[i]).buyPrimary(1, portion, { value: cost + fee });
      }

      const car = await carShares.getCarConfig(1);
      expect(car.primarySaleActive).to.be.false;

      // Create multiple secondary listings
      await carShares.connect(user1).setApprovalForAll(marketplaceAddress, true);
      await carShares.connect(user2).setApprovalForAll(marketplaceAddress, true);

      await marketplace.connect(user1).createListing(1, 1000n, ethers.parseEther("0.012"));
      await marketplace.connect(user2).createListing(1, 800n, ethers.parseEther("0.011"));

      // User4 buys from cheaper listing
      const buyAmount = 500n;
      const cost = buyAmount * ethers.parseEther("0.011");
      const fee = (cost * 250n) / 10000n;
      await marketplace.connect(user4).buyFromListing(2, buyAmount, { value: cost + fee });

      expect(await carShares.balanceOf(user4.address, 1)).to.equal(500n);
    });
  });

  describe("Complex Trading Scenarios", function () {
    beforeEach(async function () {
      await carShares.connect(carOwner).createCar(
        TOTAL_SUPPLY, PUBLIC_RATIO_BPS, PRICE_PER_SHARE, MIN_PRIMARY_BUY, METADATA_CID
      );

      // Setup: Users buy from primary
      for (const user of [user1, user2, user3]) {
        const amount = 1000n;
        const cost = amount * PRICE_PER_SHARE;
        const fee = (cost * 250n) / 10000n;
        await carShares.connect(user).buyPrimary(1, amount, { value: cost + fee });
      }
    });

    it("Should handle circular trading pattern", async function () {
      // user1 -> user2 -> user3 -> user1
      await carShares.connect(user1).setApprovalForAll(marketplaceAddress, true);
      await marketplace.connect(user1).createListing(1, 100n, ethers.parseEther("0.011"));

      const cost1 = 100n * ethers.parseEther("0.011");
      const fee1 = (cost1 * 250n) / 10000n;
      await marketplace.connect(user2).buyFromListing(1, 100n, { value: cost1 + fee1 });

      await carShares.connect(user2).setApprovalForAll(marketplaceAddress, true);
      await marketplace.connect(user2).createListing(1, 100n, ethers.parseEther("0.012"));

      const cost2 = 100n * ethers.parseEther("0.012");
      const fee2 = (cost2 * 250n) / 10000n;
      await marketplace.connect(user3).buyFromListing(2, 100n, { value: cost2 + fee2 });

      await carShares.connect(user3).setApprovalForAll(marketplaceAddress, true);
      await marketplace.connect(user3).createListing(1, 100n, ethers.parseEther("0.013"));

      const cost3 = 100n * ethers.parseEther("0.013");
      const fee3 = (cost3 * 250n) / 10000n;
      await marketplace.connect(user1).buyFromListing(3, 100n, { value: cost3 + fee3 });

      // user1 ends up with 1000 shares (started 1000, sold 100, bought 100)
      expect(await carShares.balanceOf(user1.address, 1)).to.equal(1000n);
    });

    it("Should handle price discovery with competing listings", async function () {
      await carShares.connect(user1).setApprovalForAll(marketplaceAddress, true);
      await carShares.connect(user2).setApprovalForAll(marketplaceAddress, true);
      await carShares.connect(user3).setApprovalForAll(marketplaceAddress, true);

      // Different price points
      await marketplace.connect(user1).createListing(1, 300n, ethers.parseEther("0.015")); // Highest
      await marketplace.connect(user2).createListing(1, 300n, ethers.parseEther("0.012")); // Middle
      await marketplace.connect(user3).createListing(1, 300n, ethers.parseEther("0.011")); // Lowest

      // Buyer should prefer lowest price
      const amount = 300n;
      const cost = amount * ethers.parseEther("0.011");
      const fee = (cost * 250n) / 10000n;
      await marketplace.connect(user4).buyFromListing(3, amount, { value: cost + fee });

      expect(await carShares.balanceOf(user4.address, 1)).to.equal(300n);

      // Other listings should still be active
      expect(await marketplace.isListingActive(1)).to.be.true;
      expect(await marketplace.isListingActive(2)).to.be.true;
      expect(await marketplace.isListingActive(3)).to.be.false;
    });

    it("Should handle rapid listing and cancellation cycles", async function () {
      await carShares.connect(user1).setApprovalForAll(marketplaceAddress, true);

      for (let i = 0; i < 5; i++) {
        await marketplace.connect(user1).createListing(1, 100n, PRICE_PER_SHARE);
        const listingId = await marketplace.getActiveListing(user1.address, 1);
        await marketplace.connect(user1).cancelListing(listingId);
      }

      // Final balance should be unchanged
      expect(await carShares.balanceOf(user1.address, 1)).to.equal(1000n);
      expect(await marketplace.nextListingId()).to.equal(6n);
    });
  });

  describe("Fee Distribution Scenarios", function () {
    it("Should correctly distribute fees across primary and secondary sales", async function () {
      await carShares.connect(carOwner).createCar(
        TOTAL_SUPPLY, PUBLIC_RATIO_BPS, PRICE_PER_SHARE, MIN_PRIMARY_BUY, METADATA_CID
      );

      const ownerBalanceBefore = await ethers.provider.getBalance(owner.address);

      // Primary sale
      const primaryAmount = 1000n;
      const primaryCost = primaryAmount * PRICE_PER_SHARE;
      const primaryFee = (primaryCost * 250n) / 10000n;
      await carShares.connect(user1).buyPrimary(1, primaryAmount, { value: primaryCost + primaryFee });

      // Secondary sale
      await carShares.connect(user1).setApprovalForAll(marketplaceAddress, true);
      await marketplace.connect(user1).createListing(1, 500n, ethers.parseEther("0.012"));

      const secondaryAmount = 500n;
      const secondaryCost = secondaryAmount * ethers.parseEther("0.012");
      const secondaryFee = (secondaryCost * 250n) / 10000n;
      await marketplace.connect(user2).buyFromListing(1, secondaryAmount, { value: secondaryCost + secondaryFee });

      // Withdraw primary sale fees
      const tx = await carShares.connect(owner).withdrawFees();
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;

      const ownerBalanceAfter = await ethers.provider.getBalance(owner.address);

      // Owner should have received both fees minus gas
      const totalFeesReceived = ownerBalanceAfter - ownerBalanceBefore + gasUsed;
      expect(totalFeesReceived).to.equal(primaryFee + secondaryFee);
    });

    it("Should handle fee changes mid-lifecycle", async function () {
      await carShares.connect(carOwner).createCar(
        TOTAL_SUPPLY, PUBLIC_RATIO_BPS, PRICE_PER_SHARE, MIN_PRIMARY_BUY, METADATA_CID
      );

      // Primary sale with 2.5% fee
      const amount = 1000n;
      const cost = amount * PRICE_PER_SHARE;
      const fee1 = (cost * 250n) / 10000n;
      await carShares.connect(user1).buyPrimary(1, amount, { value: cost + fee1 });

      // Change fee to 5%
      await carShares.connect(owner).setGlobalFee(500n);

      // Secondary sale with new 5% fee
      await carShares.connect(user1).setApprovalForAll(marketplaceAddress, true);
      await marketplace.connect(user1).createListing(1, 500n, PRICE_PER_SHARE);

      const cost2 = 500n * PRICE_PER_SHARE;
      const fee2 = (cost2 * 500n) / 10000n;
      await marketplace.connect(user2).buyFromListing(1, 500n, { value: cost2 + fee2 });

      // Verify platform received correct fees
      expect(await carShares.accumulatedFees()).to.equal(fee1);
    });
  });

  describe("Ownership Transfer Scenarios", function () {
    beforeEach(async function () {
      await carShares.connect(carOwner).createCar(
        TOTAL_SUPPLY, PUBLIC_RATIO_BPS, PRICE_PER_SHARE, MIN_PRIMARY_BUY, METADATA_CID
      );
    });

    it("Should allow car owner to sell their reserved shares on marketplace", async function () {
      await carShares.connect(carOwner).setApprovalForAll(marketplaceAddress, true);

      const ownerShares = 4000n; // 40% owner supply
      await marketplace.connect(carOwner).createListing(1, 2000n, ethers.parseEther("0.015"));

      const amount = 1000n;
      const cost = amount * ethers.parseEther("0.015");
      const fee = (cost * 250n) / 10000n;
      await marketplace.connect(user1).buyFromListing(1, amount, { value: cost + fee });

      expect(await carShares.balanceOf(user1.address, 1)).to.equal(amount);
      expect(await carShares.balanceOf(marketplaceAddress, 1)).to.equal(1000n);
    });

    it("Should handle majority shareholder accumulation", async function () {
      // User1 buys large amounts from both primary and secondary
      const primary = 3000n;
      const cost1 = primary * PRICE_PER_SHARE;
      const fee1 = (cost1 * 250n) / 10000n;
      await carShares.connect(user1).buyPrimary(1, primary, { value: cost1 + fee1 });

      // User2 buys and lists
      const amount = 2000n;
      const cost2 = amount * PRICE_PER_SHARE;
      const fee2 = (cost2 * 250n) / 10000n;
      await carShares.connect(user2).buyPrimary(1, amount, { value: cost2 + fee2 });

      await carShares.connect(user2).setApprovalForAll(marketplaceAddress, true);
      await marketplace.connect(user2).createListing(1, 2000n, PRICE_PER_SHARE);

      // User1 buys all
      const cost3 = 2000n * PRICE_PER_SHARE;
      const fee3 = (cost3 * 250n) / 10000n;
      await marketplace.connect(user1).buyFromListing(1, 2000n, { value: cost3 + fee3 });

      // User1 now has 5000 shares (50%)
      expect(await carShares.balanceOf(user1.address, 1)).to.equal(5000n);
    });
  });

  describe("Stress Test Scenarios", function () {
    it("Should handle many users trading small amounts", async function () {
      await carShares.connect(carOwner).createCar(
        TOTAL_SUPPLY, 9000n, PRICE_PER_SHARE, 10n, METADATA_CID
      );

      const users = [user1, user2, user3, user4, user5];

      // Each user buys 100 shares
      for (const user of users) {
        const amount = 100n;
        const cost = amount * PRICE_PER_SHARE;
        const fee = (cost * 250n) / 10000n;
        await carShares.connect(user).buyPrimary(1, amount, { value: cost + fee });
      }

      // Each user lists 50 shares
      for (const user of users) {
        await carShares.connect(user).setApprovalForAll(marketplaceAddress, true);
        await marketplace.connect(user).createListing(1, 50n, ethers.parseEther("0.011"));
      }

      // Verify all listings are active
      for (let i = 1; i <= 5; i++) {
        expect(await marketplace.isListingActive(i)).to.be.true;
      }
    });

    it("Should handle large volume trades", async function () {
      const largeSupply = 1000000n; // 1 million shares
      await carShares.connect(carOwner).createCar(
        largeSupply, 5000n, ethers.parseEther("0.000001"), 1n, METADATA_CID
      );

      const largeAmount = 100000n; // 100k shares
      const cost = largeAmount * ethers.parseEther("0.000001");
      const fee = (cost * 250n) / 10000n;

      await carShares.connect(user1).buyPrimary(1, largeAmount, { value: cost + fee });
      expect(await carShares.balanceOf(user1.address, 1)).to.equal(largeAmount);
    });

    it("Should handle multiple cars with active trading", async function () {
      // Create 3 cars
      for (let i = 0; i < 3; i++) {
        await carShares.connect(carOwner).createCar(
          5000n, 5000n, PRICE_PER_SHARE, 10n, `QmCar${i}`
        );
      }

      // User1 buys from all cars
      for (let carId = 1; carId <= 3; carId++) {
        const amount = 500n;
        const cost = amount * PRICE_PER_SHARE;
        const fee = (cost * 250n) / 10000n;
        await carShares.connect(user1).buyPrimary(carId, amount, { value: cost + fee });
      }

      // User1 lists shares from all cars
      await carShares.connect(user1).setApprovalForAll(marketplaceAddress, true);
      for (let carId = 1; carId <= 3; carId++) {
        await marketplace.connect(user1).createListing(carId, 200n, ethers.parseEther("0.012"));
      }

      // Verify all listings exist
      for (let carId = 1; carId <= 3; carId++) {
        const listingId = await marketplace.getActiveListing(user1.address, carId);
        expect(listingId).to.be.gt(0);
      }
    });
  });

  describe("Edge Case Interactions", function () {
    it("Should handle buying from primary sale then immediately listing", async function () {
      await carShares.connect(carOwner).createCar(
        TOTAL_SUPPLY, PUBLIC_RATIO_BPS, PRICE_PER_SHARE, MIN_PRIMARY_BUY, METADATA_CID
      );

      const amount = 1000n;
      const cost = amount * PRICE_PER_SHARE;
      const fee = (cost * 250n) / 10000n;
      await carShares.connect(user1).buyPrimary(1, amount, { value: cost + fee });

      await carShares.connect(user1).setApprovalForAll(marketplaceAddress, true);
      await marketplace.connect(user1).createListing(1, amount, ethers.parseEther("0.015"));

      expect(await carShares.balanceOf(marketplaceAddress, 1)).to.equal(amount);
    });

    it("Should handle owner withdrawing public supply while active listings exist", async function () {
      await carShares.connect(carOwner).createCar(
        TOTAL_SUPPLY, PUBLIC_RATIO_BPS, PRICE_PER_SHARE, MIN_PRIMARY_BUY, METADATA_CID
      );

      // User1 buys and lists
      const amount = 1000n;
      const cost = amount * PRICE_PER_SHARE;
      const fee = (cost * 250n) / 10000n;
      await carShares.connect(user1).buyPrimary(1, amount, { value: cost + fee });

      await carShares.connect(user1).setApprovalForAll(marketplaceAddress, true);
      await marketplace.connect(user1).createListing(1, 500n, ethers.parseEther("0.012"));

      // Owner withdraws remaining public supply
      await carShares.connect(carOwner).withdrawPublicSupply(1);

      // Marketplace listing should still be valid
      expect(await marketplace.isListingActive(1)).to.be.true;

      // Should be able to buy from marketplace
      const buyAmount = 200n;
      const marketCost = buyAmount * ethers.parseEther("0.012");
      const marketFee = (marketCost * 250n) / 10000n;
      await marketplace.connect(user2).buyFromListing(1, buyAmount, { value: marketCost + marketFee });

      expect(await carShares.balanceOf(user2.address, 1)).to.equal(buyAmount);
    });

    it("Should handle pausing primary sales with active secondary market", async function () {
      await carShares.connect(carOwner).createCar(
        TOTAL_SUPPLY, PUBLIC_RATIO_BPS, PRICE_PER_SHARE, MIN_PRIMARY_BUY, METADATA_CID
      );

      const amount = 1000n;
      const cost = amount * PRICE_PER_SHARE;
      const fee = (cost * 250n) / 10000n;
      await carShares.connect(user1).buyPrimary(1, amount, { value: cost + fee });

      await carShares.connect(user1).setApprovalForAll(marketplaceAddress, true);
      await marketplace.connect(user1).createListing(1, 500n, PRICE_PER_SHARE);

      // Pause primary sales
      await carShares.connect(owner).pausePrimarySales(true);

      // Primary sales should fail
      await expect(
        carShares.connect(user2).buyPrimary(1, 100n, { value: cost + fee })
      ).to.be.revertedWithCustomError(carShares, "PrimarySalesPausedError");

      // Secondary market should still work
      const buyAmount = 200n;
      const marketCost = buyAmount * PRICE_PER_SHARE;
      const marketFee = (marketCost * 250n) / 10000n;
      await marketplace.connect(user2).buyFromListing(1, buyAmount, { value: marketCost + marketFee });

      expect(await carShares.balanceOf(user2.address, 1)).to.equal(buyAmount);
    });
  });
});
