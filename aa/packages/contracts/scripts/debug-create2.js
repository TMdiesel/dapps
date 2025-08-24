const { ethers } = require('hardhat');

async function main() {
  const factoryAddress = '0x9A9f2CCfdE556A7E9Ff0848998Aa4a0CFD8863AE';
  const ownerAddress = '0x70997970c51812dc3a010c7d01b50e0d17dc79c8';
  const salt = '0';

  // Get factory contract
  const factory = await ethers.getContractAt('SimpleAccountFactory', factoryAddress);
  
  console.log('Factory address:', factoryAddress);
  console.log('Owner address:', ownerAddress);
  console.log('Salt:', salt);
  
  // Get account implementation address
  const accountImplementation = await factory.accountImplementation();
  console.log('Account implementation:', accountImplementation);
  
  // Manually compute the address using ethers
  const ERC1967Proxy = await ethers.getContractFactory("ERC1967Proxy");
  const SimpleAccount = await ethers.getContractFactory("SimpleAccount");
  
  // Get the initcode
  const initData = SimpleAccount.interface.encodeFunctionData("initialize", [ownerAddress]);
  console.log('Init data:', initData);
  
  const constructorArgs = ethers.AbiCoder.defaultAbiCoder().encode(
    ["address", "bytes"],
    [accountImplementation, initData]
  );
  console.log('Constructor args:', constructorArgs);
  
  const initCode = ethers.concat([
    ERC1967Proxy.bytecode,
    constructorArgs
  ]);
  console.log('Init code hash:', ethers.keccak256(initCode));
  
  // Manual CREATE2 computation
  const create2Address = ethers.getCreate2Address(
    factoryAddress,
    ethers.zeroPadValue(ethers.toBeHex(salt), 32),
    ethers.keccak256(initCode)
  );
  console.log('Manual CREATE2 address:', create2Address);
  
  // Compare with factory computation
  try {
    const factoryComputed = await factory.getAddress(ownerAddress, salt);
    console.log('Factory computed address:', factoryComputed);
    console.log('Addresses match:', create2Address === factoryComputed);
  } catch (error) {
    console.error('Error calling factory.getAddress:', error);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});