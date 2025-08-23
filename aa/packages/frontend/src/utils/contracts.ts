// Contract addresses and configuration
export const CONTRACTS = {
  ENTRY_POINT: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789', // Standard EntryPoint
  ACCOUNT_FACTORY: '',
  DEMO_TOKEN: '',
  DEMO_NFT: '',
  SIMPLE_DEX: '',
  DEMO_PAYMASTER: '',
} as const

export const NETWORK_CONFIG = {
  chainId: 31337, // Hardhat local
  rpcUrl: 'http://localhost:8545',
  bundlerUrl: 'http://localhost:3000',
  explorerUrl: 'http://localhost:8545' // Mock explorer
} as const

// Load deployment addresses from contracts package
export const loadDeploymentAddresses = async () => {
  try {
    // In a real app, this would load from the deployment files
    // For now, return mock addresses
    return {
      entryPoint: '0x1234567890123456789012345678901234567890',
      accountFactory: '0x2345678901234567890123456789012345678901',
      demoToken: '0x3456789012345678901234567890123456789012',
      demoNFT: '0x4567890123456789012345678901234567890123',
      simpleDEX: '0x5678901234567890123456789012345678901234',
      demoPaymaster: '0x6789012345678901234567890123456789012345'
    }
  } catch (error) {
    console.error('Failed to load deployment addresses:', error)
    return CONTRACTS
  }
}

// Contract ABIs (minimal for demo)
export const ABIS = {
  ERC20: [
    'function transfer(address to, uint256 amount) returns (bool)',
    'function approve(address spender, uint256 amount) returns (bool)',
    'function balanceOf(address account) view returns (uint256)',
  ],
  ERC721: [
    'function mint(address to) payable',
    'function balanceOf(address owner) view returns (uint256)',
    'function ownerOf(uint256 tokenId) view returns (address)',
  ],
  DEX: [
    'function swap(address tokenIn, address tokenOut, uint256 amountIn, uint256 amountOutMin)',
    'function addLiquidity(address tokenA, address tokenB, uint256 amountA, uint256 amountB)',
    'function getAmountOut(address tokenIn, uint256 amountIn) view returns (uint256)',
  ],
  ACCOUNT_FACTORY: [
    'function createAccount(address owner, uint256 salt) returns (address)',
    'function getAddress(address owner, uint256 salt) view returns (address)',
  ],
} as const

export type ContractName = keyof typeof CONTRACTS
export type ABIName = keyof typeof ABIS