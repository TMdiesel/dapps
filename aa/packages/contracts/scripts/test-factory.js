const { ethers } = require('hardhat');

async function main() {
  // Test parameters
  const factoryAddress = '0x9A9f2CCfdE556A7E9Ff0848998Aa4a0CFD8863AE';
  const ownerAddress = '0x70997970c51812dc3a010c7d01b50e0d17dc79c8';
  const salt = '0';

  // Get factory contract
  const factory = await ethers.getContractAt('SimpleAccountFactory', factoryAddress);
  
  console.log('Factory address:', factoryAddress);
  console.log('Owner address:', ownerAddress);
  console.log('Salt:', salt);
  
  try {
    // Get the computed address
    const computedAddress = await factory.getAddress(ownerAddress, salt);
    console.log('Computed Smart Account address:', computedAddress);
    
    // Check if it's different from factory
    if (computedAddress === factoryAddress) {
      console.log('ERROR: getAddress returned factory address!');
    } else {
      console.log('✓ Address computation looks correct');
    }
    
    // Check if account exists
    const code = await ethers.provider.getCode(computedAddress);
    console.log('Account code length:', code.length);
    console.log('Account exists:', code !== '0x');
    
  } catch (error) {
    console.error('Error testing factory:', error);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});