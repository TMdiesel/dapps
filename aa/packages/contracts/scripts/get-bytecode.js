const { ethers } = require('hardhat');

async function main() {
  // Get the ERC1967Proxy contract factory
  const ERC1967Proxy = await ethers.getContractFactory("ERC1967Proxy");
  console.log('ERC1967Proxy bytecode:', ERC1967Proxy.bytecode);
  console.log('ERC1967Proxy bytecode length:', ERC1967Proxy.bytecode.length);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});