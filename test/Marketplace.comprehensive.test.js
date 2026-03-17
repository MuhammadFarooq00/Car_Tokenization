// SPDX-License-Identifier: MIT
// test/Marketplace.comprehensive.test.js

const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Marketplace - Comprehensive Edge Cases", function () {
  let carShares, marketplace;
  let owner, carOwner, seller, buyer1, buyer2, buyer3;
  let carSharesAddress, marketplaceAddress;

  const TOTAL_SUPPLY = 10000n;
  const PUBLIC_RATIO_BPS = 5000n; // 50%
  const PRICE_PER_SHARE = ethers.parseEther("0.01");
  const MIN_PRIMARY_BUY = 10n;
  const METADATA_CID = "QmTestCID123456789";

  beforeEach(async function () {
    [owner, carOwner, seller, buyer1, buyer2, buyer3] = await ethers.getSigners();

    const CarShares = await ethers.getContractFactory("CarShares");
    carShares = await CarShares.deploy();
    carSharesAddress = await carShares.getAddress();

    const Marketplace = await ethers.getContractFactory("Marketplace");
    marketplace = await Marketplace.deploy(carSharesAddress);
    marketplaceAddress = await marketplace.getAddress();

    // Create a car and buy shares for seller
    await carShares.connect(carOwner).createCar(
      TOTAL_SUPPLY, PUBLIC_RATIO_BPS, PRICE_PER_SHARE, MIN_PRIMARY_BUY, METADATA_CID
    );

    const amount = 2000n;
    const totalCost = amount * PRICE_PER_SHARE;
    const fee = (totalCost * 250n) / 10000n;
    await carShares.connect(seller).buyPrimary(1, amount, { value: totalCost + fee });
  });

  describe("Listing Creation Edge Cases", function () {
    it("Should revert when creating listing for invalid car", async function () {
      await carShares.connect(seller).setApprovalForAll(marketplaceAddress, true);

      await expect(
        marketplace.connect(seller).createListing(999, 100n, PRICE_PER_SHARE)
      ).to.be.revertedWithCustomError(marketplace, "InvalidCarId");
    });

    it("Should revert when creating listing with 0 amount", async function () {
      await carShares.connect(seller).setApprovalForAll(marketplaceAddress, true);

      await expect(
        marketplace.connect(seller).createListing(1, 0n, PRICE_PER_SHARE)
      ).to.be.revertedWithCustomError(marketplace, "InvalidAmount");
    });

    it("Should revert when creating listing with 0 price", async function () {
      await carShares.connect(seller).setApprovalForAll(marketplaceAddress, true);

      await expect(
        marketplace.connect(seller).createListing(1, 100n, 0n)
      ).to.be.revertedWithCustomError(marketplace, "InvalidPrice");
    });

    it("Should revert when creating listing without approval", async function () {
      await expect(
        marketplace.connect(seller).createListing(1, 100n, PRICE_PER_SHARE)
      ).to.be.revertedWith("Not approved");
    });

    it("Should revert when creating listing with insufficient balance", async function () {
      await carShares.connect(seller).setApprovalForAll(marketplaceAddress, true);

      await expect(
        marketplace.connect(seller).createListing(1, 3000n, PRICE_PER_SHARE)
      ).to.be.revertedWith("Insufficient shares");
    });

    it("Should create listing with exact balance", async function () {
      await carShares.connect(seller).setApprovalForAll(marketplaceAddress, true);

      await expect(
        marketplace.connect(seller).createListing(1, 2000n, PRICE_PER_SHARE)
      ).to.emit(marketplace, "ListingCreated");

      expect(await carShares.balanceOf(marketplaceAddress, 1)).to.equal(2000n);
      expect(await carShares.balanceOf(seller.address, 1)).to.equal(0n);
    });

    it("Should create listing with single share", async function () {
      await carShares.connect(seller).setApprovalForAll(marketplaceAddress, true);

      await expect(
        marketplace.connect(seller).createListing(1, 1n, PRICE_PER_SHARE)
      ).to.emit(marketplace, "ListingCreated");
    });

    it("Should create listing with very high price", async function () {
      await carShares.connect(seller).setApprovalForAll(marketplaceAddress, true);
      const highPrice = ethers.parseEther("1000");

      await expect(
        marketplace.connect(seller).createListing(1, 100n, highPrice)
      ).to.emit(marketplace, "ListingCreated")
        .withArgs(1, seller.address, 1, 100n, highPrice);
    });

    it("Should create listing with very low price", async function () {
      await carShares.connect(seller).setApprovalForAll(marketplaceAddress, true);
      const lowPrice = 1n; // 1 wei

      await expect(
        marketplace.connect(seller).createListing(1, 100n, lowPrice)
      ).to.emit(marketplace, "ListingCreated")
        .withArgs(1, seller.address, 1, 100n, lowPrice);
    });

    it("Should allow different users to list same car", async function () {
      // Give buyer1 some shares
      const amount = 500n;
      const totalCost = amount * PRICE_PER_SHARE;
      const fee = (totalCost * 250n) / 10000n;
      await carShares.connect(buyer1).buyPrimary(1, amount, { value: totalCost + fee });

      await carShares.connect(seller).setApprovalForAll(marketplaceAddress, true);
      await carShares.connect(buyer1).setApprovalForAll(marketplaceAddress, true);

      await marketplace.connect(seller).createListing(1, 100n, PRICE_PER_SHARE);
      await marketplace.connect(buyer1).createListing(1, 200n, PRICE_PER_SHARE);

      expect(await marketplace.nextListingId()).to.equal(3);
    });

    it("Should increment listing IDs correctly", async function () {
      await carShares.connect(seller).setApprovalForAll(marketplaceAddress, true);

      await marketplace.connect(seller).createListing(1, 100n, PRICE_PER_SHARE);
      await marketplace.connect(seller).cancelListing(1);
      await marketplace.connect(seller).createListing(1, 200n, PRICE_PER_SHARE);

      expect(await marketplace.nextListingId()).to.equal(3);
    });
  });

  describe("Buying Edge Cases", function () {
    beforeEach(async function () {
      await carShares.connect(seller).setApprovalForAll(marketplaceAddress, true);
      await marketplace.connect(seller).createListing(1, 1000n, PRICE_PER_SHARE);
    });

    it("Should revert when buying from inactive listing", async function () {
      await marketplace.connect(seller).cancelListing(1);

      const amount = 100n;
      const totalCost = amount * PRICE_PER_SHARE;
      const fee = (totalCost * 250n) / 10000n;

      await expect(
        marketplace.connect(buyer1).buyFromListing(1, amount, { value: totalCost + fee })
      ).to.be.revertedWithCustomError(marketplace, "ListingNotActive");
    });

    it("Should revert when buying with 0 amount", async function () {
      const amount = 0n;
      const totalCost = amount * PRICE_PER_SHARE;
      const fee = (totalCost * 250n) / 10000n;

      await expect(
        marketplace.connect(buyer1).buyFromListing(1, amount, { value: totalCost + fee })
      ).to.be.revertedWithCustomError(marketplace, "InsufficientListingAmount");
    });

    it("Should revert when buying more than listing amount", async function () {
      const amount = 1001n;
      const totalCost = amount * PRICE_PER_SHARE;
      const fee = (totalCost * 250n) / 10000n;

      await expect(
        marketplace.connect(buyer1).buyFromListing(1, amount, { value: totalCost + fee })
      ).to.be.revertedWithCustomError(marketplace, "InsufficientListingAmount");
    });

    it("Should revert when buying with insufficient payment", async function () {
      const amount = 100n;
      const totalCost = amount * PRICE_PER_SHARE;
      const fee = (totalCost * 250n) / 10000n;
      const insufficientPayment = totalCost + fee - 1n;

      await expect(
        marketplace.connect(buyer1).buyFromListing(1, amount, { value: insufficientPayment })
      ).to.be.revertedWithCustomError(marketplace, "InsufficientPayment");
    });

    it("Should handle exact payment (no excess)", async function () {
      const amount = 100n;
      const totalCost = amount * PRICE_PER_SHARE;
      const fee = (totalCost * 250n) / 10000n;
      const exactPayment = totalCost + fee;

      const buyerBalanceBefore = await ethers.provider.getBalance(buyer1.address);

      const tx = await marketplace.connect(buyer1).buyFromListing(1, amount, { value: exactPayment });
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;

      const buyerBalanceAfter = await ethers.provider.getBalance(buyer1.address);
      const actualSpent = buyerBalanceBefore - buyerBalanceAfter;

      expect(actualSpent).to.equal(exactPayment + gasUsed);
    });

    it("Should refund excess payment", async function () {
      const amount = 100n;
      const totalCost = amount * PRICE_PER_SHARE;
      const fee = (totalCost * 250n) / 10000n;
      const requiredPayment = totalCost + fee;
      const excessPayment = ethers.parseEther("1");

      const buyerBalanceBefore = await ethers.provider.getBalance(buyer1.address);

      const tx = await marketplace.connect(buyer1).buyFromListing(1, amount, {
        value: requiredPayment + excessPayment
      });
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;

      const buyerBalanceAfter = await ethers.provider.getBalance(buyer1.address);
      const actualSpent = buyerBalanceBefore - buyerBalanceAfter;

      expect(actualSpent).to.equal(requiredPayment + gasUsed);
    });

    it("Should handle multiple partial fills from different buyers", async function () {
      const amount1 = 200n;
      const cost1 = amount1 * PRICE_PER_SHARE;
      const fee1 = (cost1 * 250n) / 10000n;
      await marketplace.connect(buyer1).buyFromListing(1, amount1, { value: cost1 + fee1 });

      const amount2 = 300n;
      const cost2 = amount2 * PRICE_PER_SHARE;
      const fee2 = (cost2 * 250n) / 10000n;
      await marketplace.connect(buyer2).buyFromListing(1, amount2, { value: cost2 + fee2 });

      const amount3 = 250n;
      const cost3 = amount3 * PRICE_PER_SHARE;
      const fee3 = (cost3 * 250n) / 10000n;
      await marketplace.connect(buyer3).buyFromListing(1, amount3, { value: cost3 + fee3 });

      expect(await carShares.balanceOf(buyer1.address, 1)).to.equal(amount1);
      expect(await carShares.balanceOf(buyer2.address, 1)).to.equal(amount2);
      expect(await carShares.balanceOf(buyer3.address, 1)).to.equal(amount3);

      const listing = await marketplace.getListing(1);
      expect(listing.amount).to.equal(250n); // 1000 - 200 - 300 - 250
      expect(listing.active).to.be.true;
    });

    it("Should allow seller to buy from own listing", async function () {
      const amount = 100n;
      const totalCost = amount * PRICE_PER_SHARE;
      const fee = (totalCost * 250n) / 10000n;

      await expect(
        marketplace.connect(seller).buyFromListing(1, amount, { value: totalCost + fee })
      ).to.emit(marketplace, "ListingFilled");

      expect(await carShares.balanceOf(seller.address, 1)).to.equal(1100n); // 1000 + 100
    });

    it("Should handle buying exact remaining amount", async function () {
      // First buy 900 shares
      const amount1 = 900n;
      const cost1 = amount1 * PRICE_PER_SHARE;
      const fee1 = (cost1 * 250n) / 10000n;
      await marketplace.connect(buyer1).buyFromListing(1, amount1, { value: cost1 + fee1 });

      // Buy remaining 100
      const amount2 = 100n;
      const cost2 = amount2 * PRICE_PER_SHARE;
      const fee2 = (cost2 * 250n) / 10000n;

      await expect(
        marketplace.connect(buyer2).buyFromListing(1, amount2, { value: cost2 + fee2 })
      ).to.emit(marketplace, "ListingClosed");

      const listing = await marketplace.getListing(1);
      expect(listing.active).to.be.false;
      expect(listing.amount).to.equal(0);
    });

    it("Should distribute fees correctly to platform owner", async function () {
      const amount = 500n;
      const totalCost = amount * PRICE_PER_SHARE;
      const fee = (totalCost * 250n) / 10000n;

      const ownerBalanceBefore = await ethers.provider.getBalance(owner.address);

      await marketplace.connect(buyer1).buyFromListing(1, amount, { value: totalCost + fee });

      const ownerBalanceAfter = await ethers.provider.getBalance(owner.address);
      expect(ownerBalanceAfter - ownerBalanceBefore).to.equal(fee);
    });

    it("Should reflect fee changes in marketplace purchases", async function () {
      // Change fee to 5%
      await carShares.connect(owner).setGlobalFee(500n);

      const amount = 100n;
      const totalCost = amount * PRICE_PER_SHARE;
      const newFee = (totalCost * 500n) / 10000n;

      const ownerBalanceBefore = await ethers.provider.getBalance(owner.address);

      await marketplace.connect(buyer1).buyFromListing(1, amount, { value: totalCost + newFee });

      const ownerBalanceAfter = await ethers.provider.getBalance(owner.address);
      expect(ownerBalanceAfter - ownerBalanceBefore).to.equal(newFee);
    });

    it("Should work with 0% platform fee", async function () {
      await carShares.connect(owner).setGlobalFee(0n);

      const amount = 100n;
      const totalCost = amount * PRICE_PER_SHARE;
      const fee = 0n;

      const sellerBalanceBefore = await ethers.provider.getBalance(seller.address);
      const ownerBalanceBefore = await ethers.provider.getBalance(owner.address);

      await marketplace.connect(buyer1).buyFromListing(1, amount, { value: totalCost });

      const sellerBalanceAfter = await ethers.provider.getBalance(seller.address);
      const ownerBalanceAfter = await ethers.provider.getBalance(owner.address);

      expect(sellerBalanceAfter - sellerBalanceBefore).to.equal(totalCost);
      expect(ownerBalanceAfter - ownerBalanceBefore).to.equal(0);
    });

    it("Should work with maximum platform fee", async function () {
      await carShares.connect(owner).setGlobalFee(1000n); // 10%

      const amount = 100n;
      const totalCost = amount * PRICE_PER_SHARE;
      const fee = (totalCost * 1000n) / 10000n;

      await expect(
        marketplace.connect(buyer1).buyFromListing(1, amount, { value: totalCost + fee })
      ).to.emit(marketplace, "ListingFilled");
    });
  });

  describe("Listing Cancellation Edge Cases", function () {
    beforeEach(async function () {
      await carShares.connect(seller).setApprovalForAll(marketplaceAddress, true);
      await marketplace.connect(seller).createListing(1, 1000n, PRICE_PER_SHARE);
    });

    it("Should revert when non-seller tries to cancel", async function () {
      await expect(
        marketplace.connect(buyer1).cancelListing(1)
      ).to.be.revertedWithCustomError(marketplace, "OnlySeller");
    });

    it("Should revert when cancelling inactive listing", async function () {
      await marketplace.connect(seller).cancelListing(1);

      await expect(
        marketplace.connect(seller).cancelListing(1)
      ).to.be.revertedWithCustomError(marketplace, "ListingNotActive");
    });

    it("Should revert when cancelling non-existent listing", async function () {
      await expect(
        marketplace.connect(seller).cancelListing(999)
      ).to.be.revertedWithCustomError(marketplace, "OnlySeller");
    });

    it("Should return correct amount after partial fill and cancellation", async function () {
      // Buy 400 shares
      const amount = 400n;
      const totalCost = amount * PRICE_PER_SHARE;
      const fee = (totalCost * 250n) / 10000n;
      await marketplace.connect(buyer1).buyFromListing(1, amount, { value: totalCost + fee });

      // Cancel remaining
      await marketplace.connect(seller).cancelListing(1);

      expect(await carShares.balanceOf(seller.address, 1)).to.equal(1600n); // 1000 + 600
    });

    it("Should allow creating new listing after cancellation", async function () {
      await marketplace.connect(seller).cancelListing(1);

      await expect(
        marketplace.connect(seller).createListing(1, 500n, ethers.parseEther("0.02"))
      ).to.emit(marketplace, "ListingCreated");
    });

    it("Should clear activeListings mapping on cancellation", async function () {
      await marketplace.connect(seller).cancelListing(1);

      const activeListing = await marketplace.getActiveListing(seller.address, 1);
      expect(activeListing).to.equal(0);
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      await carShares.connect(seller).setApprovalForAll(marketplaceAddress, true);
      await marketplace.connect(seller).createListing(1, 1000n, PRICE_PER_SHARE);
    });

    it("Should return correct listing details", async function () {
      const listing = await marketplace.getListing(1);

      expect(listing.seller).to.equal(seller.address);
      expect(listing.carId).to.equal(1);
      expect(listing.amount).to.equal(1000n);
      expect(listing.pricePerShare).to.equal(PRICE_PER_SHARE);
      expect(listing.active).to.be.true;
    });

    it("Should return correct active listing ID", async function () {
      const activeListingId = await marketplace.getActiveListing(seller.address, 1);
      expect(activeListingId).to.equal(1);
    });

    it("Should return 0 for non-existent active listing", async function () {
      const activeListingId = await marketplace.getActiveListing(buyer1.address, 1);
      expect(activeListingId).to.equal(0);
    });

    it("Should return true for active listing", async function () {
      expect(await marketplace.isListingActive(1)).to.be.true;
    });

    it("Should return false for inactive listing", async function () {
      await marketplace.connect(seller).cancelListing(1);
      expect(await marketplace.isListingActive(1)).to.be.false;
    });

    it("Should return false for non-existent listing", async function () {
      expect(await marketplace.isListingActive(999)).to.be.false;
    });

    it("Should calculate cost correctly", async function () {
      const amount = 250n;
      const [totalCost, fee, totalRequired] = await marketplace.calculateCost(1, amount);

      expect(totalCost).to.equal(amount * PRICE_PER_SHARE);
      expect(fee).to.equal((totalCost * 250n) / 10000n);
      expect(totalRequired).to.equal(totalCost + fee);
    });

    it("Should calculate cost with different fee rates", async function () {
      await carShares.connect(owner).setGlobalFee(500n);

      const amount = 100n;
      const [totalCost, fee, totalRequired] = await marketplace.calculateCost(1, amount);

      const expectedTotalCost = amount * PRICE_PER_SHARE;
      const expectedFee = (expectedTotalCost * 500n) / 10000n;

      expect(totalCost).to.equal(expectedTotalCost);
      expect(fee).to.equal(expectedFee);
      expect(totalRequired).to.equal(expectedTotalCost + expectedFee);
    });

    it("Should calculate cost with 0 fee", async function () {
      await carShares.connect(owner).setGlobalFee(0n);

      const amount = 100n;
      const [totalCost, fee, totalRequired] = await marketplace.calculateCost(1, amount);

      expect(totalCost).to.equal(amount * PRICE_PER_SHARE);
      expect(fee).to.equal(0);
      expect(totalRequired).to.equal(totalCost);
    });

    it("Should update listing details after partial fill", async function () {
      const buyAmount = 300n;
      const totalCost = buyAmount * PRICE_PER_SHARE;
      const fee = (totalCost * 250n) / 10000n;
      await marketplace.connect(buyer1).buyFromListing(1, buyAmount, { value: totalCost + fee });

      const listing = await marketplace.getListing(1);
      expect(listing.amount).to.equal(700n);
      expect(listing.active).to.be.true;
      expect(listing.seller).to.equal(seller.address); // Other fields unchanged
    });
  });

  describe("Multiple Cars and Listings", function () {
    it("Should handle listings for multiple cars", async function () {
      // Create second car
      await carShares.connect(carOwner).createCar(
        TOTAL_SUPPLY, PUBLIC_RATIO_BPS, PRICE_PER_SHARE, MIN_PRIMARY_BUY, "QmSecondCar"
      );

      // Buy shares from second car
      const amount = 1000n;
      const totalCost = amount * PRICE_PER_SHARE;
      const fee = (totalCost * 250n) / 10000n;
      await carShares.connect(seller).buyPrimary(2, amount, { value: totalCost + fee });

      // Create listings for both cars
      await carShares.connect(seller).setApprovalForAll(marketplaceAddress, true);
      await marketplace.connect(seller).createListing(1, 500n, PRICE_PER_SHARE);
      await marketplace.connect(seller).createListing(2, 500n, PRICE_PER_SHARE);

      expect(await marketplace.getActiveListing(seller.address, 1)).to.equal(1);
      expect(await marketplace.getActiveListing(seller.address, 2)).to.equal(2);
    });

    it("Should track separate listings per car correctly", async function () {
      await carShares.connect(carOwner).createCar(
        TOTAL_SUPPLY, PUBLIC_RATIO_BPS, PRICE_PER_SHARE, MIN_PRIMARY_BUY, "QmSecondCar"
      );

      const amount = 1000n;
      const totalCost = amount * PRICE_PER_SHARE;
      const fee = (totalCost * 250n) / 10000n;
      await carShares.connect(seller).buyPrimary(2, amount, { value: totalCost + fee });

      await carShares.connect(seller).setApprovalForAll(marketplaceAddress, true);
      await marketplace.connect(seller).createListing(1, 500n, PRICE_PER_SHARE);
      await marketplace.connect(seller).createListing(2, 300n, ethers.parseEther("0.02"));

      const listing1 = await marketplace.getListing(1);
      const listing2 = await marketplace.getListing(2);

      expect(listing1.carId).to.equal(1);
      expect(listing1.amount).to.equal(500n);
      expect(listing2.carId).to.equal(2);
      expect(listing2.amount).to.equal(300n);
    });
  });

  describe("Integration Scenarios", function () {
    it("Should handle complete workflow: list, partial buy, cancel", async function () {
      await carShares.connect(seller).setApprovalForAll(marketplaceAddress, true);
      await marketplace.connect(seller).createListing(1, 1000n, PRICE_PER_SHARE);

      // Partial buy
      const buyAmount = 400n;
      const totalCost = buyAmount * PRICE_PER_SHARE;
      const fee = (totalCost * 250n) / 10000n;
      await marketplace.connect(buyer1).buyFromListing(1, buyAmount, { value: totalCost + fee });

      // Cancel
      await marketplace.connect(seller).cancelListing(1);

      expect(await carShares.balanceOf(seller.address, 1)).to.equal(1600n);
      expect(await carShares.balanceOf(buyer1.address, 1)).to.equal(400n);
      expect(await carShares.balanceOf(marketplaceAddress, 1)).to.equal(0);
    });

    it("Should handle complete workflow: list, full buy, relist", async function () {
      await carShares.connect(seller).setApprovalForAll(marketplaceAddress, true);
      await marketplace.connect(seller).createListing(1, 1000n, PRICE_PER_SHARE);

      // Full buy
      const totalCost = 1000n * PRICE_PER_SHARE;
      const fee = (totalCost * 250n) / 10000n;
      await marketplace.connect(buyer1).buyFromListing(1, 1000n, { value: totalCost + fee });

      // Buyer relists
      await carShares.connect(buyer1).setApprovalForAll(marketplaceAddress, true);
      await marketplace.connect(buyer1).createListing(1, 500n, ethers.parseEther("0.015"));

      const listing = await marketplace.getListing(2);
      expect(listing.seller).to.equal(buyer1.address);
      expect(listing.amount).to.equal(500n);
    });
  });
});
