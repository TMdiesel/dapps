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
  console.log("🎮 Setting up demo environment...\n");

  // Load deployment addresses
  const network = (await ethers.provider.getNetwork()).name;
  const deploymentFile = path.join(__dirname, "..", "deployments", `latest-${network}.json`);
  
  if (!fs.existsSync(deploymentFile)) {
    console.error("❌ Deployment file not found. Please run deployment first.");
    process.exit(1);
  }

  const deployed: DeployedContracts = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
  console.log("📁 Loaded deployment from:", deploymentFile);

  const [deployer, user1, user2] = await ethers.getSigners();
  console.log("👤 Deployer:", deployer.address);
  console.log("👤 User1:", user1.address);
  console.log("👤 User2:", user2.address, "\n");

  // Get contract instances
  const demoToken = await ethers.getContractAt("DemoToken", deployed.demoToken);
  const demoNFT = await ethers.getContractAt("DemoNFT", deployed.demoNFT);
  const simpleDEX = await ethers.getContractAt("SimpleDEX", deployed.simpleDEX);
  const demoPaymaster = await ethers.getContractAt("DemoPaymaster", deployed.demoPaymaster);

  console.log("⚙️ Setting up demo data...");

  // 1. Mint tokens to users for testing
  console.log("\n🪙 Minting demo tokens...");
  const mintAmount = ethers.parseEther("1000");
  
  await demoToken.mint(user1.address, mintAmount);
  console.log("✅ Minted", ethers.formatEther(mintAmount), "DEMO to user1");
  
  await demoToken.mint(user2.address, mintAmount);
  console.log("✅ Minted", ethers.formatEther(mintAmount), "DEMO to user2");

  // 2. Add users to paymaster whitelist
  console.log("\n🎫 Setting up paymaster access...");
  await demoPaymaster.addToWhitelist(user1.address);
  await demoPaymaster.addToWhitelist(user2.address);
  console.log("✅ Added user1 and user2 to paymaster whitelist");

  // 3. Fund paymaster deposits for users
  console.log("\n💰 Funding paymaster deposits...");
  const depositAmount = ethers.parseEther("0.1");
  
  await demoPaymaster.connect(user1).depositFor(user1.address, { value: depositAmount });
  console.log("✅ User1 deposited", ethers.formatEther(depositAmount), "ETH to paymaster");
  
  await demoPaymaster.connect(user2).depositFor(user2.address, { value: depositAmount });
  console.log("✅ User2 deposited", ethers.formatEther(depositAmount), "ETH to paymaster");

  // 4. Set up DEX liquidity pool
  console.log("\n🏊 Setting up DEX liquidity...");
  
  // Create a second demo token for DEX trading
  console.log("📦 Deploying second token for DEX...");
  const DemoToken2 = await ethers.getContractFactory("DemoToken");
  const demoToken2 = await DemoToken2.deploy();
  await demoToken2.waitForDeployment();
  console.log("✅ DemoToken2 deployed to:", await demoToken2.getAddress());

  // Mint tokens for liquidity
  const liquidityAmount = ethers.parseEther("10000");
  await demoToken.mint(deployer.address, liquidityAmount);
  await demoToken2.mint(deployer.address, liquidityAmount);
  console.log("✅ Minted liquidity tokens to deployer");

  // Create pool
  const poolTx = await simpleDEX.createPool(await demoToken.getAddress(), await demoToken2.getAddress());
  await poolTx.wait();
  
  // Get pool ID
  const poolId = await simpleDEX.getPoolId(await demoToken.getAddress(), await demoToken2.getAddress());
  console.log("✅ Created DEX pool with ID:", poolId);

  // Add liquidity
  await demoToken.approve(await simpleDEX.getAddress(), liquidityAmount);
  await demoToken2.approve(await simpleDEX.getAddress(), liquidityAmount);
  
  const addLiquidityTx = await simpleDEX.addLiquidity(
    poolId,
    ethers.parseEther("5000"), // 5000 DEMO1
    ethers.parseEther("5000"), // 5000 DEMO2
    ethers.parseEther("4900"), // min amounts with 2% slippage
    ethers.parseEther("4900")
  );
  await addLiquidityTx.wait();
  console.log("✅ Added initial liquidity to DEX pool");

  // 5. Prepare NFT for minting
  console.log("\n🖼️ Setting up NFT minting...");
  await demoNFT.setMintPrice(ethers.parseEther("0.001")); // Very low price for testing
  console.log("✅ Set NFT mint price to 0.001 ETH");

  // 6. Create sample accounts using factory
  console.log("\n👛 Creating sample smart accounts...");
  const accountFactory = await ethers.getContractAt("SimpleAccountFactory", deployed.accountFactory);
  
  // Create account for user1
  const salt1 = ethers.randomBytes(32);
  const createAccountTx1 = await accountFactory.createAccount(user1.address, salt1);
  await createAccountTx1.wait();
  
  const user1AccountAddress = await accountFactory.getAddress(user1.address, salt1);
  console.log("✅ Created smart account for user1:", user1AccountAddress);

  // Create account for user2
  const salt2 = ethers.randomBytes(32);
  const createAccountTx2 = await accountFactory.createAccount(user2.address, salt2);
  await createAccountTx2.wait();
  
  const user2AccountAddress = await accountFactory.getAddress(user2.address, salt2);
  console.log("✅ Created smart account for user2:", user2AccountAddress);

  // 7. Save demo configuration
  console.log("\n💾 Saving demo configuration...");
  
  const demoConfig = {
    ...deployed,
    demoToken2: await demoToken2.getAddress(),
    poolId: poolId,
    sampleAccounts: {
      user1: {
        owner: user1.address,
        smartAccount: user1AccountAddress,
        salt: ethers.hexlify(salt1)
      },
      user2: {
        owner: user2.address,
        smartAccount: user2AccountAddress,
        salt: ethers.hexlify(salt2)
      }
    },
    demoData: {
      tokenMintAmount: ethers.formatEther(mintAmount),
      paymasterDeposit: ethers.formatEther(depositAmount),
      nftMintPrice: "0.001",
      dexLiquidity: ethers.formatEther(liquidityAmount)
    },
    setupTimestamp: Math.floor(Date.now() / 1000)
  };

  const demoConfigFile = path.join(__dirname, "..", "deployments", `demo-config-${network}.json`);
  fs.writeFileSync(demoConfigFile, JSON.stringify(demoConfig, null, 2));
  console.log("✅ Demo configuration saved to:", demoConfigFile);

  console.log("\n🎉 Demo environment setup completed!");
  console.log("\n📋 Demo Configuration Summary:");
  console.log("├── Demo Tokens: DEMO, DEMO2");
  console.log("├── DEX Pool: DEMO/DEMO2 with initial liquidity");
  console.log("├── NFT Collection: DemoNFT (0.001 ETH mint price)");
  console.log("├── Paymaster: Funded with deposits and whitelist");
  console.log("└── Smart Accounts: Created for user1 and user2");

  console.log("\n🚀 Ready for demo!");
  console.log("Try the following operations:");
  console.log("• Token transfers (gasless via paymaster)");
  console.log("• NFT minting");
  console.log("• DEX trading");
  console.log("• Batch operations");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Demo setup failed:", error);
    process.exit(1);
  });