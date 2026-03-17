// SPDX-License-Identifier: MIT
// test/CarShares.comprehensive.test.js

const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CarShares - Comprehensive Edge Cases", function () {
  let carShares;
  let owner, carOwner, buyer1, buyer2, buyer3, attacker;
  let carSharesAddress;

  const TOTAL_SUPPLY = 10000n;
  const PUBLIC_RATIO_BPS = 3000n; // 30%
  const PRICE_PER_SHARE = ethers.parseEther("0.01");
  const MIN_PRIMARY_BUY = 10n;
  const METADATA_CID = "QmTestCID123456789";

  beforeEach(async function () {
    [owner, carOwner, buyer1, buyer2, buyer3, attacker] = await ethers.getSigners();

    const CarShares = await ethers.getContractFactory("CarShares");
    carShares = await CarShares.deploy();
    carSharesAddress = await carShares.getAddress();
  });

  describe("Car Creation Edge Cases", function () {
    it("Should create car with 0% public ratio (100% owner supply)", async function () {
      await carShares.connect(carOwner).createCar(
        TOTAL_SUPPLY,
        0n, // 0% public
        PRICE_PER_SHARE,
        MIN_PRIMARY_BUY,
        METADATA_CID
      );

      expect(await carShares.balanceOf(carOwner.address, 1)).to.equal(TOTAL_SUPPLY);
      expect(await carShares.balanceOf(carSharesAddress, 1)).to.equal(0);

      const car = await carShares.getCarConfig(1);
      expect(car.primarySaleActive).to.be.false;
      expect(car.remainingPublicSupply).to.equal(0);
    });

    it("Should create car with 100% public ratio (0% owner supply)", async function () {
      await carShares.connect(carOwner).createCar(
        TOTAL_SUPPLY,
        10000n, // 100% public
        PRICE_PER_SHARE,
        MIN_PRIMARY_BUY,
        METADATA_CID
      );

      expect(await carShares.balanceOf(carSharesAddress, 1)).to.equal(TOTAL_SUPPLY);
      expect(await carShares.balanceOf(carOwner.address, 1)).to.equal(0);

      const car = await carShares.getCarConfig(1);
      expect(car.primarySaleActive).to.be.true;
      expect(car.remainingPublicSupply).to.equal(TOTAL_SUPPLY);
    });

    it("Should create car with 0 minimum buy requirement", async function () {
      await carShares.connect(carOwner).createCar(
        TOTAL_SUPPLY,
        PUBLIC_RATIO_BPS,
        PRICE_PER_SHARE,
        0n, // No minimum
        METADATA_CID
      );

      const car = await carShares.getCarConfig(1);
      expect(car.minPrimaryBuy).to.equal(0);
    });

    it("Should revert with zero price", async function () {
      await expect(
        carShares.connect(carOwner).createCar(
          TOTAL_SUPPLY,
          PUBLIC_RATIO_BPS,
          0n, // Invalid price
          MIN_PRIMARY_BUY,
          METADATA_CID
        )
      ).to.be.revertedWithCustomError(carShares, "InvalidPrice");
    });

    it("Should allow creating multiple cars by same owner", async function () {
      await carShares.connect(carOwner).createCar(
        TOTAL_SUPPLY, PUBLIC_RATIO_BPS, PRICE_PER_SHARE, MIN_PRIMARY_BUY, METADATA_CID
      );
      await carShares.connect(carOwner).createCar(
        5000n, 5000n, ethers.parseEther("0.02"), 5n, "QmAnotherCID"
      );

      expect(await carShares.carExists(1)).to.be.true;
      expect(await carShares.carExists(2)).to.be.true;
      expect(await carShares.nextCarId()).to.equal(3);
    });

    it("Should create car with very large supply", async function () {
      const largeSupply = ethers.parseEther("1000000"); // 1 million tokens
      await carShares.connect(carOwner).createCar(
        largeSupply,
        PUBLIC_RATIO_BPS,
        PRICE_PER_SHARE,
        MIN_PRIMARY_BUY,
        METADATA_CID
      );

      const car = await carShares.getCarConfig(1);
      expect(car.totalSupply).to.equal(largeSupply);
    });

    it("Should create car with single share", async function () {
      await carShares.connect(carOwner).createCar(
        1n, // Single share
        0n,
        PRICE_PER_SHARE,
        0n,
        METADATA_CID
      );

      expect(await carShares.balanceOf(carOwner.address, 1)).to.equal(1);
    });
  });

  describe("Primary Sale Edge Cases", function () {
    beforeEach(async function () {
      await carShares.connect(carOwner).createCar(
        TOTAL_SUPPLY, PUBLIC_RATIO_BPS, PRICE_PER_SHARE, MIN_PRIMARY_BUY, METADATA_CID
      );
    });

    it("Should revert when buying from invalid car ID", async function () {
      const amount = 100n;
      const totalCost = amount * PRICE_PER_SHARE;
      const fee = (totalCost * 250n) / 10000n;

      await expect(
        carShares.connect(buyer1).buyPrimary(999, amount, { value: totalCost + fee })
      ).to.be.revertedWithCustomError(carShares, "InvalidCarId");
    });

    it("Should revert when buying with insufficient payment", async function () {
      const amount = 100n;
      const totalCost = amount * PRICE_PER_SHARE;
      const fee = (totalCost * 250n) / 10000n;
      const insufficientPayment = totalCost + fee - 1n;

      await expect(
        carShares.connect(buyer1).buyPrimary(1, amount, { value: insufficientPayment })
      ).to.be.revertedWithCustomError(carShares, "InsufficientPayment");
    });

    it("Should revert when buying more than available supply", async function () {
      const amount = 3001n; // More than public supply
      const totalCost = amount * PRICE_PER_SHARE;
      const fee = (totalCost * 250n) / 10000n;

      await expect(
        carShares.connect(buyer1).buyPrimary(1, amount, { value: totalCost + fee })
      ).to.be.revertedWithCustomError(carShares, "InsufficientPublicSupply");
    });

    it("Should handle exact payment (no excess)", async function () {
      const amount = 100n;
      const totalCost = amount * PRICE_PER_SHARE;
      const fee = (totalCost * 250n) / 10000n;
      const exactPayment = totalCost + fee;

      const buyerBalanceBefore = await ethers.provider.getBalance(buyer1.address);

      const tx = await carShares.connect(buyer1).buyPrimary(1, amount, { value: exactPayment });
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;

      const buyerBalanceAfter = await ethers.provider.getBalance(buyer1.address);
      const actualSpent = buyerBalanceBefore - buyerBalanceAfter;

      expect(actualSpent).to.equal(exactPayment + gasUsed);
    });

    it("Should track accumulated fees correctly across multiple purchases", async function () {
      const amount = 100n;
      const totalCost = amount * PRICE_PER_SHARE;
      const fee = (totalCost * 250n) / 10000n;

      await carShares.connect(buyer1).buyPrimary(1, amount, { value: totalCost + fee });
      expect(await carShares.accumulatedFees()).to.equal(fee);

      await carShares.connect(buyer2).buyPrimary(1, amount, { value: totalCost + fee });
      expect(await carShares.accumulatedFees()).to.equal(fee * 2n);

      await carShares.connect(buyer3).buyPrimary(1, amount, { value: totalCost + fee });
      expect(await carShares.accumulatedFees()).to.equal(fee * 3n);
    });

    it("Should track sharesSold correctly", async function () {
      const amount1 = 100n;
      const amount2 = 250n;
      const amount3 = 150n;

      const cost1 = amount1 * PRICE_PER_SHARE;
      const fee1 = (cost1 * 250n) / 10000n;
      await carShares.connect(buyer1).buyPrimary(1, amount1, { value: cost1 + fee1 });

      let car = await carShares.getCarConfig(1);
      expect(car.sharesSold).to.equal(amount1);

      const cost2 = amount2 * PRICE_PER_SHARE;
      const fee2 = (cost2 * 250n) / 10000n;
      await carShares.connect(buyer2).buyPrimary(1, amount2, { value: cost2 + fee2 });

      car = await carShares.getCarConfig(1);
      expect(car.sharesSold).to.equal(amount1 + amount2);

      const cost3 = amount3 * PRICE_PER_SHARE;
      const fee3 = (cost3 * 250n) / 10000n;
      await carShares.connect(buyer3).buyPrimary(1, amount3, { value: cost3 + fee3 });

      car = await carShares.getCarConfig(1);
      expect(car.sharesSold).to.equal(amount1 + amount2 + amount3);
    });

    it("Should revert when buying from car with no public supply", async function () {
      // Create car with 0% public ratio
      await carShares.connect(carOwner).createCar(
        TOTAL_SUPPLY, 0n, PRICE_PER_SHARE, MIN_PRIMARY_BUY, METADATA_CID
      );

      const amount = 100n;
      const totalCost = amount * PRICE_PER_SHARE;
      const fee = (totalCost * 250n) / 10000n;

      await expect(
        carShares.connect(buyer1).buyPrimary(2, amount, { value: totalCost + fee })
      ).to.be.revertedWithCustomError(carShares, "InsufficientPublicSupply");
    });

    it("Should revert when buying after primary sale is closed", async function () {
      // Buy all public supply
      const publicSupply = 3000n;
      const totalCost = publicSupply * PRICE_PER_SHARE;
      const fee = (totalCost * 250n) / 10000n;
      await carShares.connect(buyer1).buyPrimary(1, publicSupply, { value: totalCost + fee });

      // Try to buy more
      const amount = 10n;
      const cost = amount * PRICE_PER_SHARE;
      const fee2 = (cost * 250n) / 10000n;

      await expect(
        carShares.connect(buyer2).buyPrimary(1, amount, { value: cost + fee2 })
      ).to.be.revertedWithCustomError(carShares, "InsufficientPublicSupply");
    });

    it("Should allow buying minimum required amount", async function () {
      const amount = MIN_PRIMARY_BUY;
      const totalCost = amount * PRICE_PER_SHARE;
      const fee = (totalCost * 250n) / 10000n;

      await expect(
        carShares.connect(buyer1).buyPrimary(1, amount, { value: totalCost + fee })
      ).to.emit(carShares, "PrimaryPurchase");

      expect(await carShares.balanceOf(buyer1.address, 1)).to.equal(amount);
    });

    it("Should allow buying when minimum is 0", async function () {
      // Create car with 0 minimum
      await carShares.connect(carOwner).createCar(
        TOTAL_SUPPLY, PUBLIC_RATIO_BPS, PRICE_PER_SHARE, 0n, METADATA_CID
      );

      const amount = 1n;
      const totalCost = amount * PRICE_PER_SHARE;
      const fee = (totalCost * 250n) / 10000n;

      await expect(
        carShares.connect(buyer1).buyPrimary(2, amount, { value: totalCost + fee })
      ).to.emit(carShares, "PrimaryPurchase");
    });

    it("Should handle multiple sequential purchases depleting supply", async function () {
      // Buy in chunks
      const chunk1 = 1000n;
      const chunk2 = 1500n;
      const chunk3 = 500n; // Total = 3000

      const cost1 = chunk1 * PRICE_PER_SHARE;
      const fee1 = (cost1 * 250n) / 10000n;
      await carShares.connect(buyer1).buyPrimary(1, chunk1, { value: cost1 + fee1 });

      const cost2 = chunk2 * PRICE_PER_SHARE;
      const fee2 = (cost2 * 250n) / 10000n;
      await carShares.connect(buyer2).buyPrimary(1, chunk2, { value: cost2 + fee2 });

      const cost3 = chunk3 * PRICE_PER_SHARE;
      const fee3 = (cost3 * 250n) / 10000n;
      await carShares.connect(buyer3).buyPrimary(1, chunk3, { value: cost3 + fee3 });

      const car = await carShares.getCarConfig(1);
      expect(car.remainingPublicSupply).to.equal(0);
      expect(car.primarySaleActive).to.be.false;
    });

    it("Should revert when trying to buy after owner withdraws public supply", async function () {
      await carShares.connect(carOwner).withdrawPublicSupply(1);

      const amount = 100n;
      const totalCost = amount * PRICE_PER_SHARE;
      const fee = (totalCost * 250n) / 10000n;

      await expect(
        carShares.connect(buyer1).buyPrimary(1, amount, { value: totalCost + fee })
      ).to.be.revertedWithCustomError(carShares, "InsufficientPublicSupply");
    });
  });

  describe("Metadata Management Edge Cases", function () {
    beforeEach(async function () {
      await carShares.connect(carOwner).createCar(
        TOTAL_SUPPLY, PUBLIC_RATIO_BPS, PRICE_PER_SHARE, MIN_PRIMARY_BUY, METADATA_CID
      );
    });

    it("Should revert when non-owner tries to update metadata", async function () {
      await expect(
        carShares.connect(buyer1).updateMetadata(1, "QmNewCID")
      ).to.be.revertedWithCustomError(carShares, "OnlyCarOwner");
    });

    it("Should allow owner to update metadata multiple times", async function () {
      await expect(
        carShares.connect(carOwner).updateMetadata(1, "QmNewCID1")
      ).to.emit(carShares, "MetadataUpdated");

      await expect(
        carShares.connect(carOwner).updateMetadata(1, "QmNewCID2")
      ).to.emit(carShares, "MetadataUpdated");

      expect(await carShares.uri(1)).to.equal("ipfs://QmNewCID2");
    });

    it("Should allow updating to empty string", async function () {
      await carShares.connect(carOwner).updateMetadata(1, "");
      expect(await carShares.uri(1)).to.equal("ipfs://");
    });

    it("Should revert URI query for invalid car ID", async function () {
      await expect(
        carShares.uri(999)
      ).to.be.revertedWithCustomError(carShares, "InvalidCarId");
    });
  });

  describe("Public Supply Withdrawal Edge Cases", function () {
    beforeEach(async function () {
      await carShares.connect(carOwner).createCar(
        TOTAL_SUPPLY, PUBLIC_RATIO_BPS, PRICE_PER_SHARE, MIN_PRIMARY_BUY, METADATA_CID
      );
    });

    it("Should revert when non-owner tries to withdraw", async function () {
      await expect(
        carShares.connect(buyer1).withdrawPublicSupply(1)
      ).to.be.revertedWithCustomError(carShares, "OnlyCarOwner");
    });

    it("Should revert when withdrawing with no remaining supply", async function () {
      await carShares.connect(carOwner).withdrawPublicSupply(1);

      await expect(
        carShares.connect(carOwner).withdrawPublicSupply(1)
      ).to.be.revertedWithCustomError(carShares, "InsufficientPublicSupply");
    });

    it("Should revert when withdrawing from car with 0% public ratio", async function () {
      await carShares.connect(carOwner).createCar(
        TOTAL_SUPPLY, 0n, PRICE_PER_SHARE, MIN_PRIMARY_BUY, METADATA_CID
      );

      await expect(
        carShares.connect(carOwner).withdrawPublicSupply(2)
      ).to.be.revertedWithCustomError(carShares, "InsufficientPublicSupply");
    });

    it("Should revert after all shares are sold", async function () {
      const publicSupply = 3000n;
      const totalCost = publicSupply * PRICE_PER_SHARE;
      const fee = (totalCost * 250n) / 10000n;
      await carShares.connect(buyer1).buyPrimary(1, publicSupply, { value: totalCost + fee });

      await expect(
        carShares.connect(carOwner).withdrawPublicSupply(1)
      ).to.be.revertedWithCustomError(carShares, "InsufficientPublicSupply");
    });

    it("Should allow withdrawal after partial sales", async function () {
      const amount = 1000n;
      const totalCost = amount * PRICE_PER_SHARE;
      const fee = (totalCost * 250n) / 10000n;
      await carShares.connect(buyer1).buyPrimary(1, amount, { value: totalCost + fee });

      await carShares.connect(carOwner).withdrawPublicSupply(1);

      expect(await carShares.balanceOf(carOwner.address, 1)).to.equal(9000n);
    });
  });

  describe("Admin Functions Edge Cases", function () {
    it("Should revert when non-owner tries to update fee", async function () {
      await expect(
        carShares.connect(buyer1).setGlobalFee(500n)
      ).to.be.revertedWithCustomError(carShares, "OwnableUnauthorizedAccount");
    });

    it("Should allow setting fee to 0", async function () {
      await expect(
        carShares.connect(owner).setGlobalFee(0n)
      ).to.emit(carShares, "GlobalFeeUpdated");

      expect(await carShares.globalFeeBps()).to.equal(0);
    });

    it("Should allow setting fee to maximum", async function () {
      await expect(
        carShares.connect(owner).setGlobalFee(1000n) // 10%
      ).to.emit(carShares, "GlobalFeeUpdated");

      expect(await carShares.globalFeeBps()).to.equal(1000);
    });

    it("Should revert when non-owner tries to pause", async function () {
      await expect(
        carShares.connect(buyer1).pausePrimarySales(true)
      ).to.be.revertedWithCustomError(carShares, "OwnableUnauthorizedAccount");
    });

    it("Should allow unpausing", async function () {
      await carShares.connect(owner).pausePrimarySales(true);
      expect(await carShares.primarySalesPaused()).to.be.true;

      await carShares.connect(owner).pausePrimarySales(false);
      expect(await carShares.primarySalesPaused()).to.be.false;
    });

    it("Should revert when withdrawing fees with 0 balance", async function () {
      await expect(
        carShares.connect(owner).withdrawFees()
      ).to.be.revertedWithCustomError(carShares, "NoFeesToWithdraw");
    });

    it("Should revert when non-owner tries to withdraw fees", async function () {
      await expect(
        carShares.connect(buyer1).withdrawFees()
      ).to.be.revertedWithCustomError(carShares, "OwnableUnauthorizedAccount");
    });

    it("Should reset accumulated fees after withdrawal", async function () {
      await carShares.connect(carOwner).createCar(
        TOTAL_SUPPLY, PUBLIC_RATIO_BPS, PRICE_PER_SHARE, MIN_PRIMARY_BUY, METADATA_CID
      );

      const amount = 100n;
      const totalCost = amount * PRICE_PER_SHARE;
      const fee = (totalCost * 250n) / 10000n;
      await carShares.connect(buyer1).buyPrimary(1, amount, { value: totalCost + fee });

      expect(await carShares.accumulatedFees()).to.equal(fee);

      await carShares.connect(owner).withdrawFees();
      expect(await carShares.accumulatedFees()).to.equal(0);

      await expect(
        carShares.connect(owner).withdrawFees()
      ).to.be.revertedWithCustomError(carShares, "NoFeesToWithdraw");
    });

    it("Should affect new purchases after fee change", async function () {
      await carShares.connect(carOwner).createCar(
        TOTAL_SUPPLY, PUBLIC_RATIO_BPS, PRICE_PER_SHARE, MIN_PRIMARY_BUY, METADATA_CID
      );

      // Buy with 2.5% fee
      const amount = 100n;
      const totalCost = amount * PRICE_PER_SHARE;
      const oldFee = (totalCost * 250n) / 10000n;
      await carShares.connect(buyer1).buyPrimary(1, amount, { value: totalCost + oldFee });

      // Change fee to 5%
      await carShares.connect(owner).setGlobalFee(500n);

      // Buy with new 5% fee
      const newFee = (totalCost * 500n) / 10000n;
      await carShares.connect(buyer2).buyPrimary(1, amount, { value: totalCost + newFee });

      expect(await carShares.accumulatedFees()).to.equal(oldFee + newFee);
    });
  });

  describe("View Functions", function () {
    it("Should return false for non-existent car", async function () {
      expect(await carShares.carExists(999)).to.be.false;
    });

    it("Should return true for existing car", async function () {
      await carShares.connect(carOwner).createCar(
        TOTAL_SUPPLY, PUBLIC_RATIO_BPS, PRICE_PER_SHARE, MIN_PRIMARY_BUY, METADATA_CID
      );

      expect(await carShares.carExists(1)).to.be.true;
    });

    it("Should return correct car configuration", async function () {
      await carShares.connect(carOwner).createCar(
        TOTAL_SUPPLY, PUBLIC_RATIO_BPS, PRICE_PER_SHARE, MIN_PRIMARY_BUY, METADATA_CID
      );

      const car = await carShares.getCarConfig(1);
      expect(car.owner).to.equal(carOwner.address);
      expect(car.totalSupply).to.equal(TOTAL_SUPPLY);
      expect(car.remainingPublicSupply).to.equal(3000n);
      expect(car.pricePerShare).to.equal(PRICE_PER_SHARE);
      expect(car.minPrimaryBuy).to.equal(MIN_PRIMARY_BUY);
      expect(car.metadataCID).to.equal(METADATA_CID);
      expect(car.primarySaleActive).to.be.true;
      expect(car.sharesSold).to.equal(0);
    });
  });

  describe("ERC1155 Receiver", function () {
    it("Should return correct selector for onERC1155Received", async function () {
      const selector = await carShares.onERC1155Received.staticCall(
        owner.address,
        owner.address,
        1,
        100,
        "0x"
      );

      // The selector is returned as bytes4
      expect(selector).to.equal("0xf23a6e61");
    });

    it("Should return correct selector for onERC1155BatchReceived", async function () {
      const selector = await carShares.onERC1155BatchReceived.staticCall(
        owner.address,
        owner.address,
        [1, 2],
        [100, 200],
        "0x"
      );

      // The selector is returned as bytes4
      expect(selector).to.equal("0xbc197c81");
    });
  });
});
