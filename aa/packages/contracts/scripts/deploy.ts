import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

interface DeployedContracts {
  entryPoint: string;
  accountFactory: string;
  demoToken: string;
  demoNFT: string;
  simpleDEX: string;
  demoPaymaster: string;
  network: string;
  blockNumber: number;
  timestamp: number;
}

async function main() {
  console.log("🚀 Starting Account Abstraction Demo deployment...\n");
  
  const [deployer, paymasterSigner] = await ethers.getSigners();
  
  console.log("📋 Deployment Details:");
  console.log("Network:", (await ethers.provider.getNetwork()).name);
  console.log("Deployer:", deployer.address);
  console.log("Paymaster Signer:", paymasterSigner.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

  // 1. Deploy EntryPoint (from @account-abstraction/contracts)
  console.log("📦 Deploying EntryPoint...");
  const EntryPoint = await ethers.getContractFactory("EntryPoint");
  const entryPoint = await EntryPoint.deploy();
  await entryPoint.waitForDeployment();
  console.log("✅ EntryPoint deployed to:", await entryPoint.getAddress());

  // 2. Deploy SimpleAccountFactory (from @account-abstraction/contracts)
  console.log("\n📦 Deploying SimpleAccountFactory...");
  const SimpleAccountFactory = await ethers.getContractFactory("SimpleAccountFactory");
  const accountFactory = await SimpleAccountFactory.deploy(await entryPoint.getAddress());
  await accountFactory.waitForDeployment();
  console.log("✅ SimpleAccountFactory deployed to:", await accountFactory.getAddress());

  // 3. Deploy DemoToken
  console.log("\n📦 Deploying DemoToken...");
  const DemoToken = await ethers.getContractFactory("DemoToken");
  const demoToken = await DemoToken.deploy();
  await demoToken.waitForDeployment();
  console.log("✅ DemoToken deployed to:", await demoToken.getAddress());

  // 4. Deploy DemoNFT
  console.log("\n📦 Deploying DemoNFT...");
  const DemoNFT = await ethers.getContractFactory("DemoNFT");
  const demoNFT = await DemoNFT.deploy();
  await demoNFT.waitForDeployment();
  console.log("✅ DemoNFT deployed to:", await demoNFT.getAddress());

  // 5. Deploy SimpleDEX
  console.log("\n📦 Deploying SimpleDEX...");
  const SimpleDEX = await ethers.getContractFactory("SimpleDEX");
  const simpleDEX = await SimpleDEX.deploy();
  await simpleDEX.waitForDeployment();
  console.log("✅ SimpleDEX deployed to:", await simpleDEX.getAddress());

  // 6. Deploy DemoPaymaster
  console.log("\n📦 Deploying DemoPaymaster...");
  const DemoPaymaster = await ethers.getContractFactory("DemoPaymaster");
  const demoPaymaster = await DemoPaymaster.deploy(
    await entryPoint.getAddress(),
    paymasterSigner.address
  );
  await demoPaymaster.waitForDeployment();
  console.log("✅ DemoPaymaster deployed to:", await demoPaymaster.getAddress());

  // 7. Fund and setup contracts
  console.log("\n⚙️ Setting up contracts...");
  
  // Fund paymaster
  const paymasterFunding = ethers.parseEther("1.0");
  await deployer.sendTransaction({
    to: await demoPaymaster.getAddress(),
    value: paymasterFunding
  });
  console.log("💰 Funded DemoPaymaster with", ethers.formatEther(paymasterFunding), "ETH");

  // Add deployer to whitelist
  await demoPaymaster.addToWhitelist(deployer.address);
  console.log("✅ Added deployer to paymaster whitelist");

  // Create a pool in DEX (ETH/DemoToken)
  const tokenAmount = ethers.parseEther("1000"); // 1000 DEMO tokens
  const ethAmount = ethers.parseEther("1.0");   // 1 ETH

  // Transfer tokens to deployer for pool creation
  await demoToken.mint(deployer.address, tokenAmount);
  console.log("🪙 Minted", ethers.formatEther(tokenAmount), "DEMO tokens to deployer");

  // Approve DEX to spend tokens
  await demoToken.approve(await simpleDEX.getAddress(), tokenAmount);

  // Create ETH/DEMO pool (using WETH pattern or direct ETH handling)
  // Note: For simplicity, we'll create a token-token pool instead
  // In a real implementation, you'd need WETH contract

  const currentBlock = await ethers.provider.getBlockNumber();
  const currentTimestamp = Math.floor(Date.now() / 1000);

  // Save deployment addresses
  const deployedContracts: DeployedContracts = {
    entryPoint: await entryPoint.getAddress(),
    accountFactory: await accountFactory.getAddress(),
    demoToken: await demoToken.getAddress(),
    demoNFT: await demoNFT.getAddress(),
    simpleDEX: await simpleDEX.getAddress(),
    demoPaymaster: await demoPaymaster.getAddress(),
    network: (await ethers.provider.getNetwork()).name,
    blockNumber: currentBlock,
    timestamp: currentTimestamp
  };

  // Create deployments directory if it doesn't exist
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  // Save to file
  const deploymentFile = path.join(deploymentsDir, `deployment-${deployedContracts.network}-${currentTimestamp}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deployedContracts, null, 2));
  
  // Also save as latest
  const latestFile = path.join(deploymentsDir, `latest-${deployedContracts.network}.json`);
  fs.writeFileSync(latestFile, JSON.stringify(deployedContracts, null, 2));

  console.log("\n🎉 Deployment completed successfully!");
  console.log("📄 Deployment info saved to:", deploymentFile);
  
  console.log("\n📋 Contract Addresses:");
  console.log("├── EntryPoint:", deployedContracts.entryPoint);
  console.log("├── SimpleAccountFactory:", deployedContracts.accountFactory);
  console.log("├── DemoToken:", deployedContracts.demoToken);
  console.log("├── DemoNFT:", deployedContracts.demoNFT);
  console.log("├── SimpleDEX:", deployedContracts.simpleDEX);
  console.log("└── DemoPaymaster:", deployedContracts.demoPaymaster);

  console.log("\n🔧 Next steps:");
  console.log("1. Start bundler service: npm run start:bundler");
  console.log("2. Start frontend: npm run dev:frontend");
  console.log("3. Create smart accounts and test transactions");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });