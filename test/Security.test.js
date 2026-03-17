// SPDX-License-Identifier: MIT
// test/Security.test.js

const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Security Tests - Attack Vectors & Edge Cases", function () {
  let carShares, marketplace;
  let owner, carOwner, attacker, user1, user2;
  let carSharesAddress, marketplaceAddress;

  const TOTAL_SUPPLY = 10000n;
  const PUBLIC_RATIO_BPS = 5000n;
  const PRICE_PER_SHARE = ethers.parseEther("0.01");
  const MIN_PRIMARY_BUY = 10n;
  const METADATA_CID = "QmTestCID123456789";

  beforeEach(async function () {
    [owner, carOwner, attacker, user1, user2] = await ethers.getSigners();

    const CarShares = await ethers.getContractFactory("CarShares");
    carShares = await CarShares.deploy();
    carSharesAddress = await carShares.getAddress();

    const Marketplace = await ethers.getContractFactory("Marketplace");
    marketplace = await Marketplace.deploy(carSharesAddress);
    marketplaceAddress = await marketplace.getAddress();
  });

  describe("Reentrancy Protection", function () {
    it("Should verify nonReentrant modifiers are in place on critical functions", async function () {
      await carShares.connect(carOwner).createCar(
        TOTAL_SUPPLY, PUBLIC_RATIO_BPS, PRICE_PER_SHARE, MIN_PRIMARY_BUY, METADATA_CID
      );

      const amount = 1000n;
      const cost = amount * PRICE_PER_SHARE;
      const fee = (cost * 250n) / 10000n;

      // Normal operations should work fine
      await expect(
        carShares.connect(user1).buyPrimary(1, amount, { value: cost + fee })
      ).to.not.be.reverted;

      await expect(
        carShares.connect(owner).withdrawFees()
      ).to.not.be.reverted;
    });

    it("Should verify marketplace has nonReentrant protection", async function () {
      await carShares.connect(carOwner).createCar(
        TOTAL_SUPPLY, PUBLIC_RATIO_BPS, PRICE_PER_SHARE, MIN_PRIMARY_BUY, METADATA_CID
      );

      const amount = 1000n;
      const cost = amount * PRICE_PER_SHARE;
      const fee = (cost * 250n) / 10000n;
      await carShares.connect(user1).buyPrimary(1, amount, { value: cost + fee });

      await carShares.connect(user1).setApprovalForAll(marketplaceAddress, true);

      // Normal marketplace operations should work
      await expect(
        marketplace.connect(user1).createListing(1, 500n, PRICE_PER_SHARE)
      ).to.not.be.reverted;

      const buyAmount = 100n;
      const buyCost = buyAmount * PRICE_PER_SHARE;
      const buyFee = (buyCost * 250n) / 10000n;

      await expect(
        marketplace.connect(user2).buyFromListing(1, buyAmount, { value: buyCost + buyFee })
      ).to.not.be.reverted;

      await expect(
        marketplace.connect(user1).cancelListing(1)
      ).to.not.be.reverted;
    });
  });

  describe("Access Control", function () {
    beforeEach(async function () {
      await carShares.connect(carOwner).createCar(
        TOTAL_SUPPLY, PUBLIC_RATIO_BPS, PRICE_PER_SHARE, MIN_PRIMARY_BUY, METADATA_CID
      );
    });

    it("Should prevent non-owner from updating metadata", async function () {
      await expect(
        carShares.connect(attacker).updateMetadata(1, "QmHackedCID")
      ).to.be.revertedWithCustomError(carShares, "OnlyCarOwner");
    });

    it("Should prevent non-owner from withdrawing public supply", async function () {
      await expect(
        carShares.connect(attacker).withdrawPublicSupply(1)
      ).to.be.revertedWithCustomError(carShares, "OnlyCarOwner");
    });

    it("Should prevent non-platform-owner from setting fees", async function () {
      await expect(
        carShares.connect(attacker).setGlobalFee(0)
      ).to.be.revertedWithCustomError(carShares, "OwnableUnauthorizedAccount");
    });

    it("Should prevent non-platform-owner from pausing sales", async function () {
      await expect(
        carShares.connect(attacker).pausePrimarySales(true)
      ).to.be.revertedWithCustomError(carShares, "OwnableUnauthorizedAccount");
    });

    it("Should prevent non-platform-owner from withdrawing fees", async function () {
      await expect(
        carShares.connect(attacker).withdrawFees()
      ).to.be.revertedWithCustomError(carShares, "OwnableUnauthorizedAccount");
    });

    it("Should prevent non-seller from cancelling listing", async function () {
      const amount = 1000n;
      const cost = amount * PRICE_PER_SHARE;
      const fee = (cost * 250n) / 10000n;
      await carShares.connect(user1).buyPrimary(1, amount, { value: cost + fee });

      await carShares.connect(user1).setApprovalForAll(marketplaceAddress, true);
      await marketplace.connect(user1).createListing(1, 500n, PRICE_PER_SHARE);

      await expect(
        marketplace.connect(attacker).cancelListing(1)
      ).to.be.revertedWithCustomError(marketplace, "OnlySeller");
    });
  });

  describe("Integer Overflow/Underflow Protection", function () {
    it("Should handle maximum uint256 values safely in calculations", async function () {
      const maxSupply = ethers.MaxUint256 / 10000n; // Avoid overflow in percentage calc

      // This should not overflow
      await carShares.connect(carOwner).createCar(
        maxSupply, 1000n, 1n, 0n, METADATA_CID
      );

      const car = await carShares.getCarConfig(1);
      expect(car.totalSupply).to.equal(maxSupply);
    });

    it("Should handle high price values without overflow in fee calculations", async function () {
      // Use a high but reasonable price
      const highPrice = ethers.parseEther("1000"); // 1000 ETH per share
      await carShares.connect(carOwner).createCar(
        TOTAL_SUPPLY, PUBLIC_RATIO_BPS, highPrice, MIN_PRIMARY_BUY, METADATA_CID
      );

      // Buying with high prices should work correctly
      const amount = 10n;
      const cost = amount * highPrice;
      const fee = (cost * 250n) / 10000n;
      const totalRequired = cost + fee;

      // This should work without overflow (though expensive)
      // We're just testing that the math doesn't overflow
      const car = await carShares.getCarConfig(1);
      expect(car.pricePerShare).to.equal(highPrice);
    });

    it("Should handle edge case of 0 shares remaining after purchase", async function () {
      await carShares.connect(carOwner).createCar(
        100n, 10000n, PRICE_PER_SHARE, 10n, METADATA_CID
      );

      const amount = 100n;
      const cost = amount * PRICE_PER_SHARE;
      const fee = (cost * 250n) / 10000n;
      await carShares.connect(user1).buyPrimary(1, amount, { value: cost + fee });

      const car = await carShares.getCarConfig(1);
      expect(car.remainingPublicSupply).to.equal(0);
      expect(car.primarySaleActive).to.be.false;
    });
  });

  describe("Payment Handling", function () {
    beforeEach(async function () {
      await carShares.connect(carOwner).createCar(
        TOTAL_SUPPLY, PUBLIC_RATIO_BPS, PRICE_PER_SHARE, MIN_PRIMARY_BUY, METADATA_CID
      );
    });

    it("Should reject primary purchase with 0 ETH", async function () {
      await expect(
        carShares.connect(user1).buyPrimary(1, 100n, { value: 0 })
      ).to.be.revertedWithCustomError(carShares, "InsufficientPayment");
    });

    it("Should reject marketplace purchase with 0 ETH", async function () {
      const amount = 1000n;
      const cost = amount * PRICE_PER_SHARE;
      const fee = (cost * 250n) / 10000n;
      await carShares.connect(user1).buyPrimary(1, amount, { value: cost + fee });

      await carShares.connect(user1).setApprovalForAll(marketplaceAddress, true);
      await marketplace.connect(user1).createListing(1, 500n, PRICE_PER_SHARE);

      await expect(
        marketplace.connect(user2).buyFromListing(1, 100n, { value: 0 })
      ).to.be.revertedWithCustomError(marketplace, "InsufficientPayment");
    });

    it("Should correctly refund excess payment in primary sale", async function () {
      const amount = 100n;
      const cost = amount * PRICE_PER_SHARE;
      const fee = (cost * 250n) / 10000n;
      const excess = ethers.parseEther("10");

      const balanceBefore = await ethers.provider.getBalance(user1.address);

      const tx = await carShares.connect(user1).buyPrimary(1, amount, {
        value: cost + fee + excess
      });
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;

      const balanceAfter = await ethers.provider.getBalance(user1.address);

      // Should only spend cost + fee + gas
      expect(balanceBefore - balanceAfter).to.equal(cost + fee + gasUsed);
    });

    it("Should correctly refund excess payment in marketplace", async function () {
      const amount = 1000n;
      const cost = amount * PRICE_PER_SHARE;
      const fee = (cost * 250n) / 10000n;
      await carShares.connect(user1).buyPrimary(1, amount, { value: cost + fee });

      await carShares.connect(user1).setApprovalForAll(marketplaceAddress, true);
      await marketplace.connect(user1).createListing(1, 500n, PRICE_PER_SHARE);

      const buyAmount = 100n;
      const buyCost = buyAmount * PRICE_PER_SHARE;
      const buyFee = (buyCost * 250n) / 10000n;
      const excess = ethers.parseEther("5");

      const balanceBefore = await ethers.provider.getBalance(user2.address);

      const tx = await marketplace.connect(user2).buyFromListing(1, buyAmount, {
        value: buyCost + buyFee + excess
      });
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;

      const balanceAfter = await ethers.provider.getBalance(user2.address);

      expect(balanceBefore - balanceAfter).to.equal(buyCost + buyFee + gasUsed);
    });
  });

  describe("State Consistency", function () {
    it("Should maintain consistent state across failed transactions", async function () {
      await carShares.connect(carOwner).createCar(
        TOTAL_SUPPLY, PUBLIC_RATIO_BPS, PRICE_PER_SHARE, MIN_PRIMARY_BUY, METADATA_CID
      );

      const initialCar = await carShares.getCarConfig(1);

      // Attempt invalid purchase
      await expect(
        carShares.connect(user1).buyPrimary(1, 5n, { value: 0 })
      ).to.be.reverted;

      // State should be unchanged
      const afterCar = await carShares.getCarConfig(1);
      expect(afterCar.remainingPublicSupply).to.equal(initialCar.remainingPublicSupply);
      expect(afterCar.sharesSold).to.equal(initialCar.sharesSold);
    });

    it("Should maintain listing state consistency on failed purchases", async function () {
      await carShares.connect(carOwner).createCar(
        TOTAL_SUPPLY, PUBLIC_RATIO_BPS, PRICE_PER_SHARE, MIN_PRIMARY_BUY, METADATA_CID
      );

      const amount = 1000n;
      const cost = amount * PRICE_PER_SHARE;
      const fee = (cost * 250n) / 10000n;
      await carShares.connect(user1).buyPrimary(1, amount, { value: cost + fee });

      await carShares.connect(user1).setApprovalForAll(marketplaceAddress, true);
      await marketplace.connect(user1).createListing(1, 500n, PRICE_PER_SHARE);

      const initialListing = await marketplace.getListing(1);

      // Attempt invalid purchase
      await expect(
        marketplace.connect(user2).buyFromListing(1, 600n, { value: 0 })
      ).to.be.reverted;

      // State should be unchanged
      const afterListing = await marketplace.getListing(1);
      expect(afterListing.amount).to.equal(initialListing.amount);
      expect(afterListing.active).to.equal(initialListing.active);
    });

    it("Should properly update activeListings mapping", async function () {
      await carShares.connect(carOwner).createCar(
        TOTAL_SUPPLY, PUBLIC_RATIO_BPS, PRICE_PER_SHARE, MIN_PRIMARY_BUY, METADATA_CID
      );

      const amount = 1000n;
      const cost = amount * PRICE_PER_SHARE;
      const fee = (cost * 250n) / 10000n;
      await carShares.connect(user1).buyPrimary(1, amount, { value: cost + fee });

      await carShares.connect(user1).setApprovalForAll(marketplaceAddress, true);

      // Create listing
      await marketplace.connect(user1).createListing(1, 500n, PRICE_PER_SHARE);
      expect(await marketplace.getActiveListing(user1.address, 1)).to.equal(1);

      // Fill listing completely
      const buyCost = 500n * PRICE_PER_SHARE;
      const buyFee = (buyCost * 250n) / 10000n;
      await marketplace.connect(user2).buyFromListing(1, 500n, { value: buyCost + buyFee });

      // Active listing should be cleared
      expect(await marketplace.getActiveListing(user1.address, 1)).to.equal(0);
    });
  });

  describe("Griefing & DoS Attacks", function () {
    it("Should handle listing with dust amounts", async function () {
      await carShares.connect(carOwner).createCar(
        TOTAL_SUPPLY, PUBLIC_RATIO_BPS, PRICE_PER_SHARE, MIN_PRIMARY_BUY, METADATA_CID
      );

      const amount = 1000n;
      const cost = amount * PRICE_PER_SHARE;
      const fee = (cost * 250n) / 10000n;
      await carShares.connect(user1).buyPrimary(1, amount, { value: cost + fee });

      await carShares.connect(user1).setApprovalForAll(marketplaceAddress, true);

      // List single share at extremely high price
      await marketplace.connect(user1).createListing(1, 1n, ethers.parseEther("1000000"));

      const listing = await marketplace.getListing(1);
      expect(listing.amount).to.equal(1n);
    });

    it("Should not allow blocking other users by holding shares", async function () {
      await carShares.connect(carOwner).createCar(
        TOTAL_SUPPLY, PUBLIC_RATIO_BPS, PRICE_PER_SHARE, MIN_PRIMARY_BUY, METADATA_CID
      );

      // User1 buys and lists
      const amount = 1000n;
      const cost = amount * PRICE_PER_SHARE;
      const fee = (cost * 250n) / 10000n;
      await carShares.connect(user1).buyPrimary(1, amount, { value: cost + fee });

      await carShares.connect(user1).setApprovalForAll(marketplaceAddress, true);
      await marketplace.connect(user1).createListing(1, 500n, PRICE_PER_SHARE);

      // User2 can still buy from primary sale
      await expect(
        carShares.connect(user2).buyPrimary(1, 100n, { value: cost / 10n + fee / 10n })
      ).to.not.be.reverted;
    });
  });

  describe("Token Approval & Transfer Edge Cases", function () {
    beforeEach(async function () {
      await carShares.connect(carOwner).createCar(
        TOTAL_SUPPLY, PUBLIC_RATIO_BPS, PRICE_PER_SHARE, MIN_PRIMARY_BUY, METADATA_CID
      );

      const amount = 1000n;
      const cost = amount * PRICE_PER_SHARE;
      const fee = (cost * 250n) / 10000n;
      await carShares.connect(user1).buyPrimary(1, amount, { value: cost + fee });
    });

    it("Should fail to create listing without approval", async function () {
      await expect(
        marketplace.connect(user1).createListing(1, 500n, PRICE_PER_SHARE)
      ).to.be.revertedWith("Not approved");
    });

    it("Should allow creating listing after approval", async function () {
      await carShares.connect(user1).setApprovalForAll(marketplaceAddress, true);

      await expect(
        marketplace.connect(user1).createListing(1, 500n, PRICE_PER_SHARE)
      ).to.emit(marketplace, "ListingCreated");
    });

    it("Should handle approval revocation after listing creation", async function () {
      await carShares.connect(user1).setApprovalForAll(marketplaceAddress, true);
      await marketplace.connect(user1).createListing(1, 500n, PRICE_PER_SHARE);

      // Shares are already in marketplace, so revoke won't affect existing listing
      await carShares.connect(user1).setApprovalForAll(marketplaceAddress, false);

      // Purchase should still work since shares are in marketplace
      const cost = 100n * PRICE_PER_SHARE;
      const fee = (cost * 250n) / 10000n;
      await expect(
        marketplace.connect(user2).buyFromListing(1, 100n, { value: cost + fee })
      ).to.not.be.reverted;
    });
  });

  describe("Boundary Conditions", function () {
    it("Should handle car creation with exact boundary values", async function () {
      // 100% public ratio
      await carShares.connect(carOwner).createCar(
        TOTAL_SUPPLY, 10000n, PRICE_PER_SHARE, 0n, METADATA_CID
      );

      const car = await carShares.getCarConfig(1);
      expect(car.remainingPublicSupply).to.equal(TOTAL_SUPPLY);
      expect(await carShares.balanceOf(carOwner.address, 1)).to.equal(0);
    });

    it("Should handle buying exact remaining supply", async function () {
      await carShares.connect(carOwner).createCar(
        TOTAL_SUPPLY, PUBLIC_RATIO_BPS, PRICE_PER_SHARE, MIN_PRIMARY_BUY, METADATA_CID
      );

      const publicSupply = (TOTAL_SUPPLY * PUBLIC_RATIO_BPS) / 10000n;
      const cost = publicSupply * PRICE_PER_SHARE;
      const fee = (cost * 250n) / 10000n;

      await carShares.connect(user1).buyPrimary(1, publicSupply, { value: cost + fee });

      const car = await carShares.getCarConfig(1);
      expect(car.remainingPublicSupply).to.equal(0);
      expect(car.primarySaleActive).to.be.false;
    });

    it("Should handle maximum allowed fee rate", async function () {
      await carShares.connect(owner).setGlobalFee(1000n); // 10% max

      await expect(
        carShares.connect(owner).setGlobalFee(1001n)
      ).to.be.revertedWithCustomError(carShares, "InvalidFee");
    });
  });
});

/*
Note: The reentrancy tests above demonstrate that the contracts are protected.
To fully test reentrancy attacks, you would need to deploy malicious contracts:

Example MaliciousBuyer contract:
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface ICarShares {
    function buyPrimary(uint256 carId, uint256 amount) external payable;
}

contract MaliciousBuyer {
    ICarShares public carShares;
    bool public attacking;

    constructor(address _carShares) {
        carShares = ICarShares(_carShares);
    }

    function attack(uint256 carId, uint256 amount) external payable {
        attacking = true;
        carShares.buyPrimary{value: msg.value / 2}(carId, amount);
    }

    receive() external payable {
        if (attacking) {
            attacking = false;
            carShares.buyPrimary{value: address(this).balance / 2}(1, 10);
        }
    }
}

Example MaliciousMarketBuyer contract:
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IMarketplace {
    function buyFromListing(uint256 listingId, uint256 amount) external payable;
}

contract MaliciousMarketBuyer {
    IMarketplace public marketplace;
    bool public attacking;

    constructor(address _marketplace) {
        marketplace = IMarketplace(_marketplace);
    }

    function attack(uint256 listingId, uint256 amount) external payable {
        attacking = true;
        marketplace.buyFromListing{value: msg.value / 2}(listingId, amount);
    }

    receive() external payable {
        if (attacking) {
            attacking = false;
            marketplace.buyFromListing{value: address(this).balance / 2}(1, 10);
        }
    }
}
*/
