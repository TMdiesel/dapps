import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

interface DeployedContracts {
  entryPoint: string;
  accountFactory: string;
  demoToken: string;
  demoNFT: string;
  simpleDEX: string;
  mockPaymaster: string;
  network: string;
  blockNumber: number;
  timestamp: number;
}

async function main() {
  console.log("🚀 Starting Simplified Account Abstraction Demo deployment...\n");
  
  const [deployer] = await ethers.getSigners();
  
  console.log("📋 Deployment Details:");
  console.log("Network:", (await ethers.provider.getNetwork()).name);
  console.log("Deployer:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

  // 1. Use standard EntryPoint address (pre-deployed)
  console.log("📦 Using standard EntryPoint...");
  const entryPointAddress = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789";
  console.log("✅ EntryPoint address:", entryPointAddress);

  // 2. Deploy SimpleAccountFactory
  console.log("\n📦 Deploying SimpleAccountFactory...");
  const SimpleAccountFactory = await ethers.getContractFactory("SimpleAccountFactory");
  const accountFactory = await SimpleAccountFactory.deploy(entryPointAddress);
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

  // 6. Deploy MockPaymaster (simpler version)
  console.log("\n📦 Deploying MockPaymaster...");
  const MockPaymaster = await ethers.getContractFactory("MockPaymaster");
  const mockPaymaster = await MockPaymaster.deploy();
  await mockPaymaster.waitForDeployment();
  console.log("✅ MockPaymaster deployed to:", await mockPaymaster.getAddress());

  const currentBlock = await ethers.provider.getBlockNumber();
  const currentTimestamp = Math.floor(Date.now() / 1000);

  // Save deployment addresses
  const deployedContracts: DeployedContracts = {
    entryPoint: entryPointAddress,
    accountFactory: await accountFactory.getAddress(),
    demoToken: await demoToken.getAddress(),
    demoNFT: await demoNFT.getAddress(),
    simpleDEX: await simpleDEX.getAddress(),
    mockPaymaster: await mockPaymaster.getAddress(),
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
  console.log("└── MockPaymaster:", deployedContracts.mockPaymaster);

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