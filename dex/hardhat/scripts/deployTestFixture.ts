import { ethers } from "hardhat"

async function addLiquidity(factory, router, token0, token1, units0: number, units1: number, account) {
    const symbol0 = await token0.symbol()
    const symbol1 = await token1.symbol()
    const decimals0 = await token0.decimals()
    const decimals1 = await token1.decimals()

    // Create Pool
    let poolAddress = await factory.getPool(token0.address, token1.address)
    if (poolAddress === ethers.constants.AddressZero) {
        await factory.createPool(token0.address, token1.address)
        poolAddress = await factory.getPool(token0.address, token1.address)
    }
    console.log(`${symbol0}-${symbol1} pool address:`, poolAddress)

    // Add liquidity
    const reserve0Before = await token0.balanceOf(poolAddress)
    const reserve1Before = await token1.balanceOf(poolAddress)

    const amount0Desired = ethers.utils.parseUnits(units0.toString(), decimals0);
    const amount1Desired = ethers.utils.parseUnits(units1.toString(), decimals1);
    const deadline = Math.floor(Date.now() / 1000) + 120;
    await token0.connect(account).approve(router.address, amount0Desired);
    await token1.connect(account).approve(router.address, amount1Desired);
    await router.connect(account).addLiquidity(
        token0.address, token1.address, amount0Desired, amount1Desired, 0, 0, account.address, deadline
    )

    const reserve0After = await token0.balanceOf(poolAddress)
    const reserve1After = await token1.balanceOf(poolAddress)
    console.log(`${symbol0} reserve changed from ${reserve0Before} to ${reserve0After}`)
    console.log(`${symbol1} reserve changed from ${reserve1Before} to ${reserve1After}`)
}

async function main() {
    const [account0, account1, account2] = await ethers.getSigners();

    // Deploy UDex
    const Factory = await ethers.getContractFactory("UdexFactory");
    const factory = await Factory.deploy()
    await factory.deployed();
    console.log(`factory address: ${factory.address}`);  // 0x5FbDB2315678afecb367f032d93F642f64180aa3

    const Router = await ethers.getContractFactory("UdexRouter");
    const router = await Router.deploy(factory.address);
    await router.deployed();
    console.log(`router address: ${router.address}`);  // 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512

    // Deploy ERC20 tokens
    const ERC20 = await ethers.getContractFactory("TokenTest")
    const tokenA = await ERC20.deploy("Galleon", "GLN", 18, ethers.utils.parseUnits("100000", 18))
    await tokenA.deployed()
    console.log('GLN address:', tokenA.address) // 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0

    const tokenB = await ERC20.deploy("Zenny", "ZNY", 18, ethers.utils.parseUnits("200000", 18))
    await tokenB.deployed()
    console.log('ZNY address:', tokenB.address) // 0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9

    const tokenC = await ERC20.deploy("USDC", "USDC", 6, ethers.utils.parseUnits("300000", 6))
    await tokenC.deployed() 
    console.log('USDC address:', tokenC.address) // 0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9

    const tokenD = await ERC20.deploy("WBTC", "WBTC", 8, ethers.utils.parseUnits("400000", 8))
    await tokenD.deployed()
    console.log('WBTC address:', tokenD.address) // 0x5FC8d32690cc91D4c39d9d3abcBD16989F875707

    // Give tokens to each account
    for (let token of [tokenA, tokenB, tokenC, tokenD]) {
        const decimals = await token.decimals()
        for (let account of [account1, account2]) {
            token.connect(account0).transfer(account.address, ethers.utils.parseUnits("20000", decimals))
        }
    }

    // Create pools for each token pair
    for (let token0 of [tokenA, tokenB, tokenC, tokenD]) {
        for (let token1 of [tokenA, tokenB]) {  // skip tokenC, tokenD
            if (token0.address < token1.address) {         
                for (let account of [account1, account2]) {
                    const units0 = 1000  // human readable amount
                    const units1 = 2000
                    await addLiquidity(factory, router, token0, token1, units0, units1, account)  // need await to avoid allowance collision
                }
            }
        }
    }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});