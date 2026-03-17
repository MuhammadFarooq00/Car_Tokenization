// SPDX-License-Identifier: MIT
// scripts/deploy.js

const hre = require("hardhat");

async function main() {
  console.log("🚀 Starting deployment to", hre.network.name);
  console.log("=" .repeat(60));

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "ETH");
  console.log("=" .repeat(60));

  // Deploy CarShares
  console.log("\n📦 Deploying CarShares contract...");
  const CarShares = await hre.ethers.getContractFactory("CarShares");
  const carShares = await CarShares.deploy();
  await carShares.waitForDeployment();
  const carSharesAddress = await carShares.getAddress();
  
  console.log("✅ CarShares deployed to:", carSharesAddress);

  // Deploy Marketplace
  console.log("\n📦 Deploying Marketplace contract...");
  const Marketplace = await hre.ethers.getContractFactory("Marketplace");
  const marketplace = await Marketplace.deploy(carSharesAddress);
  await marketplace.waitForDeployment();
  const marketplaceAddress = await marketplace.getAddress();
  
  console.log("✅ Marketplace deployed to:", marketplaceAddress);

  // Verify deployment
  console.log("\n🔍 Verifying deployment...");
  
  const owner = await carShares.owner();
  const globalFee = await carShares.globalFeeBps();
  const marketplaceCarShares = await marketplace.carShares();
  
  console.log("   CarShares owner:", owner);
  console.log("   Global fee (bps):", globalFee.toString());
  console.log("   Marketplace references CarShares:", marketplaceCarShares === carSharesAddress);

  // Summary
  console.log("\n" + "=" .repeat(60));
  console.log("🎉 DEPLOYMENT COMPLETE");
  console.log("=" .repeat(60));
  console.log("\n📋 Contract Addresses:");
  console.log("   CarShares:  ", carSharesAddress);
  console.log("   Marketplace:", marketplaceAddress);
  
  console.log("\n📝 Next Steps:");
  console.log("   1. Verify contracts on Etherscan:");
  console.log("      npx hardhat verify --network", hre.network.name, carSharesAddress);
  console.log("      npx hardhat verify --network", hre.network.name, marketplaceAddress, carSharesAddress);
  console.log("\n   2. Update frontend configuration with these addresses");
  console.log("\n   3. Users must approve marketplace before listing:");
  console.log("      carShares.setApprovalForAll(marketplace, true)");

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      CarShares: carSharesAddress,
      Marketplace: marketplaceAddress
    },
    configuration: {
      globalFeeBps: globalFee.toString(),
      maxFeeBps: "1000",
      owner: owner
    }
  };

  const fs = require('fs');
  const deploymentPath = `./deployments/${hre.network.name}-deployment.json`;
  
  if (!fs.existsSync('./deployments')) {
    fs.mkdirSync('./deployments');
  }
  
  fs.writeFileSync(
    deploymentPath,
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  console.log("\n💾 Deployment info saved to:", deploymentPath);
  console.log("\n" + "=" .repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });
