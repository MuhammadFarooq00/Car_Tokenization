// SPDX-License-Identifier: MIT
// test/CarOwnership.test.js

const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Car Ownership System", function () {
  let carShares, marketplace;
  let owner, carOwner, buyer1, buyer2, buyer3;
  let carSharesAddress, marketplaceAddress;

  const TOTAL_SUPPLY = 10000n;
  const PUBLIC_RATIO_BPS = 3000n; // 30%
  const PRICE_PER_SHARE = ethers.parseEther("0.01");
  const MIN_PRIMARY_BUY = 10n;
  const METADATA_CID = "QmTestCID123456789";

  beforeEach(async function () {
    [owner, carOwner, buyer1, buyer2, buyer3] = await ethers.getSigners();

    // Deploy CarShares
    const CarShares = await ethers.getContractFactory("CarShares");
    carShares = await CarShares.deploy();
    carSharesAddress = await carShares.getAddress();

    // Deploy Marketplace
    const Marketplace = await ethers.getContractFactory("Marketplace");
    marketplace = await Marketplace.deploy(carSharesAddress);
    marketplaceAddress = await marketplace.getAddress();
  });

  describe("CarShares - Car Creation", function () {
    it("Should create a car with correct supply distribution", async function () {
      const tx = await carShares.connect(carOwner).createCar(
        TOTAL_SUPPLY,
        PUBLIC_RATIO_BPS,
        PRICE_PER_SHARE,
        MIN_PRIMARY_BUY,
        METADATA_CID
      );

      await expect(tx)
        .to.emit(carShares, "CarCreated")
        .withArgs(1, carOwner.address, TOTAL_SUPPLY, 3000n, PRICE_PER_SHARE, MIN_PRIMARY_BUY, METADATA_CID);

      // Check balances
      const publicSupply = (TOTAL_SUPPLY * PUBLIC_RATIO_BPS) / 10000n;
      const ownerSupply = TOTAL_SUPPLY - publicSupply;

      expect(await carShares.balanceOf(carSharesAddress, 1)).to.equal(publicSupply);
      expect(await carShares.balanceOf(carOwner.address, 1)).to.equal(ownerSupply);
    });

    it("Should increment car IDs correctly", async function () {
      await carShares.connect(carOwner).createCar(
        TOTAL_SUPPLY, PUBLIC_RATIO_BPS, PRICE_PER_SHARE, MIN_PRIMARY_BUY, METADATA_CID
      );
      await carShares.connect(buyer1).createCar(
        TOTAL_SUPPLY, PUBLIC_RATIO_BPS, PRICE_PER_SHARE, MIN_PRIMARY_BUY, METADATA_CID
      );

      expect(await carShares.nextCarId()).to.equal(3);
    });

    it("Should return correct IPFS URI", async function () {
      await carShares.connect(carOwner).createCar(
        TOTAL_SUPPLY, PUBLIC_RATIO_BPS, PRICE_PER_SHARE, MIN_PRIMARY_BUY, METADATA_CID
      );

      const uri = await carShares.uri(1);
      expect(uri).to.equal(`ipfs://${METADATA_CID}`);
    });

    it("Should revert with invalid total supply", async function () {
      await expect(
        carShares.connect(carOwner).createCar(0, PUBLIC_RATIO_BPS, PRICE_PER_SHARE, MIN_PRIMARY_BUY, METADATA_CID)
      ).to.be.revertedWithCustomError(carShares, "InvalidTotalSupply");
    });

    it("Should revert with invalid public ratio", async function () {
      await expect(
        carShares.connect(carOwner).createCar(TOTAL_SUPPLY, 10001n, PRICE_PER_SHARE, MIN_PRIMARY_BUY, METADATA_CID)
      ).to.be.revertedWithCustomError(carShares, "InvalidPublicRatio");
    });
  });

  describe("CarShares - Primary Sale", function () {
    beforeEach(async function () {
      await carShares.connect(carOwner).createCar(
        TOTAL_SUPPLY, PUBLIC_RATIO_BPS, PRICE_PER_SHARE, MIN_PRIMARY_BUY, METADATA_CID
      );
    });

    it("Should allow primary purchase with correct payment", async function () {
      const amount = 100n;
      const totalCost = amount * PRICE_PER_SHARE;
      const fee = (totalCost * 250n) / 10000n; // 2.5% fee
      const payment = totalCost + fee;

      const ownerBalanceBefore = await ethers.provider.getBalance(carOwner.address);

      await expect(
        carShares.connect(buyer1).buyPrimary(1, amount, { value: payment })
      ).to.emit(carShares, "PrimaryPurchase")
        .withArgs(1, buyer1.address, amount, totalCost, fee);

      // Check buyer received shares
      expect(await carShares.balanceOf(buyer1.address, 1)).to.equal(amount);

      // Check car owner received payment
      const ownerBalanceAfter = await ethers.provider.getBalance(carOwner.address);
      expect(ownerBalanceAfter - ownerBalanceBefore).to.equal(totalCost);
    });

    it("Should refund excess payment", async function () {
      const amount = 100n;
      const totalCost = amount * PRICE_PER_SHARE;
      const fee = (totalCost * 250n) / 10000n;
      const requiredPayment = totalCost + fee;
      const excessPayment = ethers.parseEther("1");

      const buyerBalanceBefore = await ethers.provider.getBalance(buyer1.address);

      const tx = await carShares.connect(buyer1).buyPrimary(1, amount, { 
        value: requiredPayment + excessPayment 
      });
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;

      const buyerBalanceAfter = await ethers.provider.getBalance(buyer1.address);
      const actualSpent = buyerBalanceBefore - buyerBalanceAfter;

      // Should only spend required payment + gas
      expect(actualSpent).to.equal(requiredPayment + gasUsed);
    });

    it("Should enforce minimum buy requirement", async function () {
      const amount = 5n; // Below minimum of 10
      const totalCost = amount * PRICE_PER_SHARE;
      const fee = (totalCost * 250n) / 10000n;
      const payment = totalCost + fee;

      await expect(
        carShares.connect(buyer1).buyPrimary(1, amount, { value: payment })
      ).to.be.revertedWithCustomError(carShares, "BelowMinimumPurchase");
    });

    it("Should update remaining public supply", async function () {
      const amount = 1000n;
      const totalCost = amount * PRICE_PER_SHARE;
      const fee = (totalCost * 250n) / 10000n;

      await carShares.connect(buyer1).buyPrimary(1, amount, { value: totalCost + fee });

      const car = await carShares.getCarConfig(1);
      expect(car.remainingPublicSupply).to.equal(3000n - amount);
    });

    it("Should close primary sale when fully sold", async function () {
      const publicSupply = 3000n;
      const totalCost = publicSupply * PRICE_PER_SHARE;
      const fee = (totalCost * 250n) / 10000n;

      await carShares.connect(buyer1).buyPrimary(1, publicSupply, { value: totalCost + fee });

      const car = await carShares.getCarConfig(1);
      expect(car.primarySaleActive).to.be.false;
      expect(car.remainingPublicSupply).to.equal(0);
    });

    it("Should revert when paused", async function () {
      await carShares.connect(owner).pausePrimarySales(true);

      const amount = 100n;
      const totalCost = amount * PRICE_PER_SHARE;
      const fee = (totalCost * 250n) / 10000n;

      await expect(
        carShares.connect(buyer1).buyPrimary(1, amount, { value: totalCost + fee })
      ).to.be.revertedWithCustomError(carShares, "PrimarySalesPausedError");
    });
  });



  describe("CarShares - Public Supply Withdrawal", function () {
    beforeEach(async function () {
      await carShares.connect(carOwner).createCar(
        TOTAL_SUPPLY, PUBLIC_RATIO_BPS, PRICE_PER_SHARE, MIN_PRIMARY_BUY, METADATA_CID
      );
    });

    it("Should allow car owner to withdraw unsold shares", async function () {
      const publicSupply = 3000n;

      await expect(
        carShares.connect(carOwner).withdrawPublicSupply(1)
      ).to.emit(carShares, "PublicSupplyWithdrawn")
        .withArgs(1, carOwner.address, publicSupply);

      // Check balances
      expect(await carShares.balanceOf(carOwner.address, 1)).to.equal(TOTAL_SUPPLY);
      expect(await carShares.balanceOf(carSharesAddress, 1)).to.equal(0);

      const car = await carShares.getCarConfig(1);
      expect(car.primarySaleActive).to.be.false;
      expect(car.remainingPublicSupply).to.equal(0);
    });

    it("Should withdraw partial remaining supply", async function () {
      // Buy 1000 shares
      const bought = 1000n;
      const totalCost = bought * PRICE_PER_SHARE;
      const fee = (totalCost * 250n) / 10000n;
      await carShares.connect(buyer1).buyPrimary(1, bought, { value: totalCost + fee });

      const remaining = 2000n;
      await carShares.connect(carOwner).withdrawPublicSupply(1);

      expect(await carShares.balanceOf(carOwner.address, 1)).to.equal(7000n + remaining);
    });
  });

  describe("Marketplace - Listing Management", function () {
    beforeEach(async function () {
      await carShares.connect(carOwner).createCar(
        TOTAL_SUPPLY, PUBLIC_RATIO_BPS, PRICE_PER_SHARE, MIN_PRIMARY_BUY, METADATA_CID
      );

      // Buy shares for listing
      const amount = 1000n;
      const totalCost = amount * PRICE_PER_SHARE;
      const fee = (totalCost * 250n) / 10000n;
      await carShares.connect(buyer1).buyPrimary(1, amount, { value: totalCost + fee });

      // Approve marketplace
      await carShares.connect(buyer1).setApprovalForAll(marketplaceAddress, true);
    });

    it("Should create a listing", async function () {
      const listingAmount = 500n;
      const listingPrice = ethers.parseEther("0.015");

      await expect(
        marketplace.connect(buyer1).createListing(1, listingAmount, listingPrice)
      ).to.emit(marketplace, "ListingCreated")
        .withArgs(1, buyer1.address, 1, listingAmount, listingPrice);

      // Check shares are locked in marketplace
      expect(await carShares.balanceOf(marketplaceAddress, 1)).to.equal(listingAmount);
      expect(await carShares.balanceOf(buyer1.address, 1)).to.equal(500n);
    });

    it("Should prevent multiple active listings per user per car", async function () {
      await marketplace.connect(buyer1).createListing(1, 500n, PRICE_PER_SHARE);

      await expect(
        marketplace.connect(buyer1).createListing(1, 100n, PRICE_PER_SHARE)
      ).to.be.revertedWithCustomError(marketplace, "ExistingActiveListing");
    });

    it("Should allow listing after cancellation", async function () {
      await marketplace.connect(buyer1).createListing(1, 500n, PRICE_PER_SHARE);
      await marketplace.connect(buyer1).cancelListing(1);

      await expect(
        marketplace.connect(buyer1).createListing(1, 300n, PRICE_PER_SHARE)
      ).to.emit(marketplace, "ListingCreated");
    });
  });

  describe("Marketplace - Buying", function () {
    beforeEach(async function () {
      await carShares.connect(carOwner).createCar(
        TOTAL_SUPPLY, PUBLIC_RATIO_BPS, PRICE_PER_SHARE, MIN_PRIMARY_BUY, METADATA_CID
      );

      const amount = 1000n;
      const totalCost = amount * PRICE_PER_SHARE;
      const fee = (totalCost * 250n) / 10000n;
      await carShares.connect(buyer1).buyPrimary(1, amount, { value: totalCost + fee });
      
      await carShares.connect(buyer1).setApprovalForAll(marketplaceAddress, true);
      await marketplace.connect(buyer1).createListing(1, 500n, PRICE_PER_SHARE);
    });

    it("Should allow partial fill", async function () {
      const buyAmount = 200n;
      const totalCost = buyAmount * PRICE_PER_SHARE;
      const fee = (totalCost * 250n) / 10000n;

      const sellerBalanceBefore = await ethers.provider.getBalance(buyer1.address);

      await expect(
        marketplace.connect(buyer2).buyFromListing(1, buyAmount, { value: totalCost + fee })
      ).to.emit(marketplace, "ListingFilled")
        .withArgs(1, buyer2.address, buyAmount, totalCost, fee);

      // Check buyer received shares
      expect(await carShares.balanceOf(buyer2.address, 1)).to.equal(buyAmount);

      // Check listing updated
      const listing = await marketplace.getListing(1);
      expect(listing.amount).to.equal(300n);
      expect(listing.active).to.be.true;

      // Check seller received payment
      const sellerBalanceAfter = await ethers.provider.getBalance(buyer1.address);
      expect(sellerBalanceAfter - sellerBalanceBefore).to.equal(totalCost);
    });

    it("Should close listing on full fill", async function () {
      const buyAmount = 500n;
      const totalCost = buyAmount * PRICE_PER_SHARE;
      const fee = (totalCost * 250n) / 10000n;

      await expect(
        marketplace.connect(buyer2).buyFromListing(1, buyAmount, { value: totalCost + fee })
      ).to.emit(marketplace, "ListingClosed")
        .withArgs(1);

      const listing = await marketplace.getListing(1);
      expect(listing.active).to.be.false;
      expect(listing.amount).to.equal(0);
    });

    it("Should send fee to platform owner", async function () {
      const buyAmount = 200n;
      const totalCost = buyAmount * PRICE_PER_SHARE;
      const fee = (totalCost * 250n) / 10000n;

      const ownerBalanceBefore = await ethers.provider.getBalance(owner.address);

      await marketplace.connect(buyer2).buyFromListing(1, buyAmount, { value: totalCost + fee });

      const ownerBalanceAfter = await ethers.provider.getBalance(owner.address);
      expect(ownerBalanceAfter - ownerBalanceBefore).to.equal(fee);
    });
  });

  describe("Marketplace - Cancellation", function () {
    beforeEach(async function () {
      await carShares.connect(carOwner).createCar(
        TOTAL_SUPPLY, PUBLIC_RATIO_BPS, PRICE_PER_SHARE, MIN_PRIMARY_BUY, METADATA_CID
      );

      const amount = 1000n;
      const totalCost = amount * PRICE_PER_SHARE;
      const fee = (totalCost * 250n) / 10000n;
      await carShares.connect(buyer1).buyPrimary(1, amount, { value: totalCost + fee });
      
      await carShares.connect(buyer1).setApprovalForAll(marketplaceAddress, true);
      await marketplace.connect(buyer1).createListing(1, 500n, PRICE_PER_SHARE);
    });

    it("Should allow seller to cancel listing", async function () {
      await expect(
        marketplace.connect(buyer1).cancelListing(1)
      ).to.emit(marketplace, "ListingCancelled")
        .withArgs(1, 500n);

      // Check shares returned
      expect(await carShares.balanceOf(buyer1.address, 1)).to.equal(1000n);
      expect(await carShares.balanceOf(marketplaceAddress, 1)).to.equal(0);

      const listing = await marketplace.getListing(1);
      expect(listing.active).to.be.false;
    });

    it("Should not allow non-seller to cancel", async function () {
      await expect(
        marketplace.connect(buyer2).cancelListing(1)
      ).to.be.revertedWithCustomError(marketplace, "OnlySeller");
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to update global fee", async function () {
      const newFee = 500n; // 5%

      await expect(
        carShares.connect(owner).setGlobalFee(newFee)
      ).to.emit(carShares, "GlobalFeeUpdated")
        .withArgs(250n, newFee);

      expect(await carShares.globalFeeBps()).to.equal(newFee);
    });

    it("Should not allow fee above maximum", async function () {
      const invalidFee = 1001n; // 10.01%

      await expect(
        carShares.connect(owner).setGlobalFee(invalidFee)
      ).to.be.revertedWithCustomError(carShares, "InvalidFee");
    });

    it("Should allow owner to withdraw fees", async function () {
      await carShares.connect(carOwner).createCar(
        TOTAL_SUPPLY, PUBLIC_RATIO_BPS, PRICE_PER_SHARE, MIN_PRIMARY_BUY, METADATA_CID
      );

      const amount = 100n;
      const totalCost = amount * PRICE_PER_SHARE;
      const fee = (totalCost * 250n) / 10000n;
      await carShares.connect(buyer1).buyPrimary(1, amount, { value: totalCost + fee });

      const ownerBalanceBefore = await ethers.provider.getBalance(owner.address);

      const tx = await carShares.connect(owner).withdrawFees();
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;

      const ownerBalanceAfter = await ethers.provider.getBalance(owner.address);
      expect(ownerBalanceAfter - ownerBalanceBefore + gasUsed).to.equal(fee);
    });
  });
});
