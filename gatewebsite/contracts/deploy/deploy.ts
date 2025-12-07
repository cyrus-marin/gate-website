import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Deploying Gate402 contracts to Monad Testnet...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "MON\n");

  // Deploy APIRegistry
  console.log("📝 Deploying APIRegistry...");
  const APIRegistry = await ethers.getContractFactory("APIRegistry");
  const registry = await APIRegistry.deploy();
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  console.log("✅ APIRegistry deployed to:", registryAddress);

  // Deploy PaymentEscrow
  console.log("\n💰 Deploying PaymentEscrow...");
  const PaymentEscrow = await ethers.getContractFactory("PaymentEscrow");
  const escrow = await PaymentEscrow.deploy(registryAddress);
  await escrow.waitForDeployment();
  const escrowAddress = await escrow.getAddress();
  console.log("✅ PaymentEscrow deployed to:", escrowAddress);

  console.log("\n" + "=".repeat(80));
  console.log("🎉 Deployment complete!");
  console.log("=".repeat(80));
  
  console.log("\n📋 Update your .env.local with these values:");
  console.log("-".repeat(80));
  console.log(`NEXT_PUBLIC_REGISTRY_CONTRACT=${registryAddress}`);
  console.log(`NEXT_PUBLIC_ESCROW_CONTRACT=${escrowAddress}`);
  console.log(`NEXT_PUBLIC_MONAD_CHAIN_ID=10143`);
  console.log(`NEXT_PUBLIC_ENABLE_WEB3=true`);
  console.log("-".repeat(80));

  console.log("\n🔍 Verify contracts on MonadScan:");
  console.log(`https://testnet-explorer.monad.xyz/address/${registryAddress}`);
  console.log(`https://testnet-explorer.monad.xyz/address/${escrowAddress}`);

  console.log("\n📦 To verify source code, run:");
  console.log(`npx hardhat verify --network monadTestnet ${registryAddress}`);
  console.log(`npx hardhat verify --network monadTestnet ${escrowAddress} ${registryAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });
