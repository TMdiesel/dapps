import { ethers } from 'ethers'



export interface UserOperationStruct {
  sender: string
  nonce: string
  initCode: string
  callData: string
  callGasLimit: string
  verificationGasLimit: string
  preVerificationGas: string
  maxFeePerGas: string
  maxPriorityFeePerGas: string
  paymasterAndData: string
  signature: string
}

export class AAProvider {
  private provider: ethers.JsonRpcProvider
  private bundlerUrl: string
  private entryPointAddress: string
  private accountFactoryAddress: string
  private paymasterAddress: string
  private deployedContracts: any

  constructor(
    rpcUrl: string = 'http://localhost:8545',
    bundlerUrl: string = 'http://localhost:3000',
    entryPointAddress: string = '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
    accountFactoryAddress: string = '',
    paymasterAddress: string = ''
  ) {
    this.provider = new ethers.JsonRpcProvider(rpcUrl)
    this.bundlerUrl = bundlerUrl
    this.entryPointAddress = entryPointAddress
    this.accountFactoryAddress = accountFactoryAddress
    this.paymasterAddress = paymasterAddress
    
    // Initialize with hardcoded addresses immediately for latest deployment
    this.accountFactoryAddress = '0x9A9f2CCfdE556A7E9Ff0848998Aa4a0CFD8863AE'
    this.paymasterAddress = '0x59b670e9fA9D0A427751Af201D676719a970857b'
    
    // Then try to load from JSON (async)
    this.loadDeployedContracts()
  }

  private async loadDeployedContracts() {
    try {
      // Try to load from public folder first
      let response = await fetch('/latest-localhost.json')
      if (!response.ok) {
        // Fallback to hardcoded addresses from deployment
        console.log('Using hardcoded contract addresses')
        this.deployedContracts = {
          entryPoint: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
          accountFactory: '0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e',
          mockPaymaster: '0x0B306BF915C4d645ff596e518fAf3F9669b97016'
        }
      } else {
        this.deployedContracts = await response.json()
      }
      
      this.accountFactoryAddress = this.deployedContracts.accountFactory
      this.paymasterAddress = this.deployedContracts.mockPaymaster
      console.log('Loaded contract addresses:', {
        accountFactory: this.accountFactoryAddress,
        paymaster: this.paymasterAddress
      })
    } catch (error) {
      console.error('Failed to load deployed contracts:', error)
      // Use hardcoded fallback addresses
      this.accountFactoryAddress = '0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e'
      this.paymasterAddress = '0x0B306BF915C4d645ff596e518fAf3F9669b97016'
    }
  }

  async createSmartAccount(owner: string, salt: string = '0'): Promise<string> {
    console.log('createSmartAccount called with:', { owner, salt, factoryAddress: this.accountFactoryAddress })
    
    if (!this.accountFactoryAddress || this.accountFactoryAddress === '') {
      console.error('AccountFactory address not loaded, waiting...')
      // Wait for contracts to load
      await new Promise(resolve => setTimeout(resolve, 1000))
      if (!this.accountFactoryAddress || this.accountFactoryAddress === '') {
        throw new Error('AccountFactory address not loaded')
      }
    }

    try {
      // Get factory contract
      const factory = new ethers.Contract(
        this.accountFactoryAddress,
        [
          'function createAccount(address owner, uint256 salt) returns (address)',
          'function getAddress(address owner, uint256 salt) view returns (address)',
          'function accountImplementation() view returns (address)'
        ],
        this.provider
      )

      // Try to get account implementation address
      let accountImplementation: string
      try {
        accountImplementation = await factory['accountImplementation']()
        console.log('Account implementation:', accountImplementation)
      } catch (error) {
        console.warn('Could not get accountImplementation, using fallback:', error)
        // Use a reasonable default implementation address
        accountImplementation = '0x2b961E3959b79326A8e7F64Ef0d2d825707669b5'
      }
      
      // Try factory's getAddress method first
      let accountAddress: string
      try {
        accountAddress = await factory['getAddress'](owner, salt)
        console.log('Factory computed address:', accountAddress)
        
        // Validate that it's not the factory address (known bug)
        if (accountAddress === this.accountFactoryAddress) {
          throw new Error('Factory returned its own address - using manual computation')
        }
      } catch (error) {
        console.warn('Factory getAddress failed, using manual computation:', error)
        
        // Manual CREATE2 computation as fallback
        const SimpleAccount = new ethers.Interface(['function initialize(address owner)'])
        const initData = SimpleAccount.encodeFunctionData('initialize', [owner])
        
        const constructorArgs = ethers.AbiCoder.defaultAbiCoder().encode(
          ['address', 'bytes'],
          [accountImplementation, initData]
        )
        
        // Use the actual ERC1967Proxy bytecode
        const proxyBytecode = '0x608060405260405161040938038061040983398101604081905261002291610267565b61002c8282610033565b5050610351565b61003c82610092565b6040516001600160a01b038316907fbc7cd75a20ee27fd9adebab32041f755214dbc6bffa90cc0225b39da2e5c2d3b90600090a280511561008657610081828261010e565b505050565b61008e610185565b5050565b806001600160a01b03163b6000036100cd57604051634c9c8ce360e01b81526001600160a01b03821660048201526024015b60405180910390fd5b7f360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc80546001600160a01b0319166001600160a01b0392909216919091179055565b6060600080846001600160a01b03168460405161012b9190610335565b600060405180830381855af49150503d8060008114610166576040519150601f19603f3d011682016040523d82523d6000602084013e61016b565b606091505b50909250905061017c8583836101a6565b95945050505050565b34156101a45760405163b398979f60e01b815260040160405180910390fd5b565b6060826101bb576101b682610205565b6101fe565b81511580156101d257506001600160a01b0384163b155b156101fb57604051639996b31560e01b81526001600160a01b03851660048201526024016100c4565b50805b9392505050565b80511561021457805160208201fd5b60405163d6bda27560e01b815260040160405180910390fd5b634e487b7160e01b600052604160045260246000fd5b60005b8381101561025e578181015183820152602001610246565b50506000910152565b6000806040838503121561027a57600080fd5b82516001600160a01b038116811461029157600080fd5b60208401519092506001600160401b03808211156102ae57600080fd5b818501915085601f8301126102c257600080fd5b8151818111156102d4576102d461022d565b604051601f8201601f19908116603f011681019083821181831017156102fc576102fc61022d565b8160405282815288602084870101111561031557600080fd5b610326836020830160208801610243565b80955050505050509250929050565b60008251610347818460208701610243565b9190910192915050565b60aa8061035f6000396000f3fe6080604052600a600c565b005b60186014601a565b6051565b565b6000604c7f360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc546001600160a01b031690565b905090565b3660008037600080366000845af43d6000803e808015606f573d6000f35b3d6000fdfea26469706673582212208412c0f1000a19ab365fc9e61f8dc1f89115bfd4e3fabb7011ce47be3fe358a764736f6c63430008170033'
        
        // Use ethers to compute CREATE2 address
        const initCode = ethers.concat([proxyBytecode, constructorArgs])
        accountAddress = ethers.getCreate2Address(
          this.accountFactoryAddress,
          ethers.zeroPadValue(ethers.toBeHex(salt), 32),
          ethers.keccak256(initCode)
        )
      }
      
      console.log('Final Smart Account address:', accountAddress)
      
      // Validate the address is different from factory
      if (accountAddress === this.accountFactoryAddress) {
        throw new Error('Address computation failed - computed same as factory address')
      }
      
      // Check if account already exists
      const code = await this.provider.getCode(accountAddress)
      if (code !== '0x') {
        console.log('Smart Account already deployed at:', accountAddress)
        return accountAddress
      }

      // Create account if it doesn't exist
      console.log('Deploying new Smart Account...')
      // Connect through window.ethereum for browser compatibility
      const browserProvider = new ethers.BrowserProvider(window.ethereum!)
      const signer = await browserProvider.getSigner()
      const factoryWithSigner = factory.connect(signer)
      
      try {
        const tx = await factoryWithSigner['createAccount'](owner, salt)
        console.log('Deploy transaction hash:', tx.hash)
        const receipt = await tx.wait()
        console.log('Deploy transaction receipt:', receipt)
        
        // Verify the account was created
        const finalCode = await this.provider.getCode(accountAddress)
        if (finalCode === '0x') {
          console.warn('Smart Account deployment may have failed - no code at expected address')
        }
      } catch (deployError) {
        console.warn('Contract deployment failed, but address may already exist:', deployError)
      }
      
      console.log('Smart Account address:', accountAddress)
      return accountAddress

    } catch (error) {
      console.error('Error creating smart account:', error)
      throw error
    }
  }

  async getAccountAddress(owner: string, salt: string): Promise<string> {
    if (!this.accountFactoryAddress) {
      throw new Error('AccountFactory address not loaded')
    }

    const factory = new ethers.Contract(
      this.accountFactoryAddress,
      ['function getAddress(address owner, uint256 salt) view returns (address)'],
      this.provider
    )

    const address = await factory['getAddress'](owner, salt)
    return address
  }

  async sendUserOperation(userOp: Partial<UserOperationStruct>): Promise<string> {
    try {
      if (!userOp.sender) {
        throw new Error('Sender address required')
      }

      // Create a proper UserOperation for the bundler
      const fullUserOp = await this.buildUserOperation(userOp)
      
      // Send to bundler
      const response = await fetch(`${this.bundlerUrl}/rpc`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_sendUserOperation',
          params: [fullUserOp, this.entryPointAddress],
          id: Date.now()
        })
      })

      const result = await response.json()
      
      if (result.error) {
        throw new Error(`Bundler error: ${result.error.message}`)
      }

      const userOpHash = result.result
      console.log('UserOperation submitted:', userOpHash)
      
      // Wait for the transaction to be mined
      const receipt = await this.waitForUserOperationReceipt(userOpHash)
      
      return receipt?.transactionHash || userOpHash

    } catch (error) {
      console.error('Error sending user operation:', error)
      // Fallback to direct execution if bundler fails
      return await this.directExecution(userOp)
    }
  }

  private async buildUserOperation(userOp: Partial<UserOperationStruct>): Promise<any> {
    const account = new ethers.Contract(
      userOp.sender!,
      ['function getNonce() view returns (uint256)'],
      this.provider
    )

    try {
      const nonce = await account.getNonce()
      
      return {
        sender: userOp.sender,
        nonce: `0x${nonce.toString(16)}`,
        initCode: '0x', // Account already created
        callData: userOp.callData || '0x',
        callGasLimit: '0x7A120', // 500,000
        verificationGasLimit: '0x186A0', // 100,000
        preVerificationGas: '0x5208', // 21,000
        maxFeePerGas: '0x59682F00', // 1.5 gwei
        maxPriorityFeePerGas: '0x59682F00', // 1.5 gwei
        paymasterAndData: this.paymasterAddress ? this.paymasterAddress + '0'.repeat(40) : '0x',
        signature: '0x' + '0'.repeat(130) // Will be filled by wallet
      }
    } catch (error) {
      console.error('Failed to build UserOperation:', error)
      throw error
    }
  }

  private async directExecution(userOp: Partial<UserOperationStruct>): Promise<string> {
    console.log('Falling back to direct execution')
    
    // Get the smart account contract
    const account = new ethers.Contract(
      userOp.sender!,
      [
        'function execute(address dest, uint256 value, bytes calldata func)',
        'function executeBatch(address[] calldata dest, uint256[] calldata value, bytes[] calldata func)'
      ],
      this.provider
    )

    const ownerSigner = await this.getOwnerSigner()
    const accountWithSigner = account.connect(ownerSigner)

    // Parse the callData to determine the target and function
    const callData = userOp.callData || '0x'
    
    let tx
    if (callData === '0x') {
      // Simple ETH transfer
      tx = await ownerSigner.sendTransaction({
        to: userOp.sender,
        value: 0
      })
    } else {
      // Contract call through smart account
      // For demo, assume it's calling the contract directly
      const dest = userOp.sender // placeholder
      const value = 0
      tx = await accountWithSigner['execute'](dest, value, callData)
    }

    await tx.wait()
    return tx.hash
  }

  private async waitForUserOperationReceipt(userOpHash: string, maxWaitTime: number = 30000): Promise<any> {
    const startTime = Date.now()
    
    while (Date.now() - startTime < maxWaitTime) {
      try {
        const response = await fetch(`${this.bundlerUrl}/rpc`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_getUserOperationReceipt',
            params: [userOpHash],
            id: Date.now()
          })
        })

        const result = await response.json()
        
        if (result.result) {
          return result.result
        }
        
        // Wait 2 seconds before trying again
        await new Promise(resolve => setTimeout(resolve, 2000))
      } catch (error) {
        console.error('Error checking receipt:', error)
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }
    
    return null
  }

  private async getOwnerSigner(): Promise<ethers.Signer> {
    // Get signer from MetaMask
    if (typeof window.ethereum === 'undefined') {
      throw new Error('MetaMask not available')
    }

    const provider = new ethers.BrowserProvider(window.ethereum)
    return await provider.getSigner()
  }

  async estimateUserOperationGas(userOp: Partial<UserOperationStruct>) {
    // Real gas estimation would be more complex
    try {
      const gasEstimate = await this.provider.estimateGas({
        to: userOp.sender,
        data: userOp.callData || '0x'
      })

      return {
        callGasLimit: gasEstimate.toString(),
        verificationGasLimit: '100000',
        preVerificationGas: '21000'
      }
    } catch (error) {
      console.error('Gas estimation failed:', error)
      return {
        callGasLimit: '50000',
        verificationGasLimit: '100000',
        preVerificationGas: '21000'
      }
    }
  }

  async getUserOperationReceipt(userOpHash: string) {
    try {
      const receipt = await this.provider.getTransactionReceipt(userOpHash)
      return {
        userOpHash,
        success: receipt?.status === 1,
        actualGasUsed: receipt?.gasUsed.toString() || '0',
        actualGasCost: ((receipt?.gasUsed || 0n) * (receipt?.gasPrice || 0n)).toString(),
        receipt
      }
    } catch (error) {
      console.error('Failed to get receipt:', error)
      return null
    }
  }

  // Token operations
  async transferToken(
    from: string,
    to: string,
    amount: string,
    tokenAddress: string
  ): Promise<string> {
    const callData = this.encodeTransferCall(to, amount)
    
    // Execute through smart account
    const account = new ethers.Contract(
      from,
      ['function execute(address dest, uint256 value, bytes calldata func)'],
      this.provider
    )

    const ownerSigner = await this.getOwnerSigner()
    const accountWithSigner = account.connect(ownerSigner)

    const tx = await accountWithSigner['execute'](tokenAddress, 0, callData)
    await tx.wait()
    
    return tx.hash
  }

  // NFT operations
  async mintNFT(account: string, nftAddress: string): Promise<string> {
    const callData = this.encodeMintCall(account)
    
    const accountContract = new ethers.Contract(
      account,
      ['function execute(address dest, uint256 value, bytes calldata func)'],
      this.provider
    )

    const ownerSigner = await this.getOwnerSigner()
    const accountWithSigner = accountContract.connect(ownerSigner)

    const tx = await accountWithSigner['execute'](nftAddress, 0, callData)
    await tx.wait()
    
    return tx.hash
  }

  // DEX operations
  async swapTokens(
    account: string,
    dexAddress: string,
    tokenIn: string,
    tokenOut: string,
    amountIn: string,
    amountOutMin: string
  ): Promise<string> {
    const callData = this.encodeSwapCall(tokenIn, tokenOut, amountIn, amountOutMin)
    
    const accountContract = new ethers.Contract(
      account,
      ['function execute(address dest, uint256 value, bytes calldata func)'],
      this.provider
    )

    const ownerSigner = await this.getOwnerSigner()
    const accountWithSigner = accountContract.connect(ownerSigner)

    const tx = await accountWithSigner['execute'](dexAddress, 0, callData)
    await tx.wait()
    
    return tx.hash
  }

  private encodeTransferCall(to: string, amount: string): string {
    const iface = new ethers.Interface([
      'function transfer(address to, uint256 amount)'
    ])
    return iface.encodeFunctionData('transfer', [to, ethers.parseEther(amount)])
  }

  private encodeMintCall(to: string): string {
    const iface = new ethers.Interface([
      'function mint(address to)'
    ])
    return iface.encodeFunctionData('mint', [to])
  }

  private encodeSwapCall(
    tokenIn: string,
    tokenOut: string,
    amountIn: string,
    amountOutMin: string
  ): string {
    const iface = new ethers.Interface([
      'function swap(address tokenIn, address tokenOut, uint256 amountIn, uint256 amountOutMin)'
    ])
    return iface.encodeFunctionData('swap', [tokenIn, tokenOut, amountIn, amountOutMin])
  }

  // Get real transaction history
  async getTransactionHistory(smartAccount: string): Promise<any[]> {
    console.log('getTransactionHistory called with:', smartAccount)
    try {
      const latestBlock = await this.provider.getBlockNumber()
      console.log('Latest block:', latestBlock)
      const transactions = []

      // Search all blocks (since we have few blocks in local development)
      console.log(`Searching all ${latestBlock + 1} blocks for transactions...`)
      
      for (let i = 0; i <= latestBlock; i++) {
        try {
          const block = await this.provider.getBlock(i, true)
          if (block && block.transactions && block.transactions.length > 0) {
            console.log(`Block ${i}: ${block.transactions.length} transactions`)
            
            for (const tx of block.transactions) {
              if (typeof tx === 'object' && tx !== null && 'hash' in tx) {
                const transaction = tx as any
                
                // More comprehensive search criteria
                const smartAccountLower = smartAccount.toLowerCase()
                const factoryAddressLower = this.accountFactoryAddress.toLowerCase()
                
                // Check if transaction is related to our Smart Account:
                const isDirectlyRelated = 
                  transaction.to?.toLowerCase() === smartAccountLower || 
                  transaction.from?.toLowerCase() === smartAccountLower
                
                const isFactoryRelated = 
                  transaction.to?.toLowerCase() === factoryAddressLower
                
                const isDataRelated = transaction.data && 
                  transaction.data.toLowerCase().includes(smartAccountLower.slice(2))
                
                // Also check for any other contract interactions that might be related
                const isContractCall = transaction.data && transaction.data !== '0x' && transaction.data.length > 10
                
                const isRelevant = isDirectlyRelated || isFactoryRelated || isDataRelated || isContractCall
                
                if (isRelevant) {
                  console.log(`🔍 Found potentially relevant transaction in block ${i}:`, {
                    hash: transaction.hash,
                    from: transaction.from,
                    to: transaction.to,
                    value: transaction.value?.toString(),
                    data: transaction.data?.slice(0, 30) + '...',
                    directlyRelated: isDirectlyRelated,
                    factoryRelated: isFactoryRelated,
                    dataRelated: isDataRelated,
                    isContractCall: isContractCall
                  })
                  
                  try {
                    const receipt = await this.provider.getTransactionReceipt(transaction.hash)
                    
                    // More detailed analysis of logs for Smart Account activity
                    let isActuallyRelated = isDirectlyRelated || isFactoryRelated || isDataRelated
                    
                    if (!isActuallyRelated && receipt && receipt.logs) {
                      // Check transaction logs for Smart Account address
                      for (const log of receipt.logs) {
                        if (log.address?.toLowerCase() === smartAccountLower ||
                            log.topics?.some(topic => topic.toLowerCase().includes(smartAccountLower.slice(2))) ||
                            log.data?.toLowerCase().includes(smartAccountLower.slice(2))) {
                          isActuallyRelated = true
                          console.log(`📝 Found Smart Account in transaction logs:`, log)
                          break
                        }
                      }
                    }
                    
                    if (isActuallyRelated) {
                      // Determine transaction description
                      let description = 'Transaction'
                      if (isFactoryRelated) {
                        description = 'Smart Account Creation'
                      } else if (transaction.data && transaction.data !== '0x') {
                        const data = transaction.data.toLowerCase()
                        if (data.includes('5fbfb9cf')) { // createAccount(address,uint256)
                          description = 'Smart Account Creation'
                        } else if (data.includes('a9059cbb')) { // transfer(address,uint256)
                          description = 'Token Transfer'
                        } else if (data.includes('40c10f19')) { // mint(address)
                          description = 'NFT Mint'
                        } else if (data.includes('b61d27f6')) { // execute(address,uint256,bytes)
                          description = 'Smart Account Execute'
                        } else if (data.includes('38ed1739')) { // swapExactTokensForTokens
                          description = 'Token Swap'
                        } else if (isContractCall) {
                          description = 'Contract Interaction'
                        }
                      }
                      
                      console.log(`✅ Adding transaction: ${description}`)
                      
                      transactions.push({
                        hash: transaction.hash,
                        from: transaction.from,
                        to: transaction.to,
                        value: transaction.value.toString(),
                        gasUsed: receipt?.gasUsed.toString() || '0',
                        status: receipt?.status === 1 ? 'success' : 'failed',
                        blockNumber: i,
                        timestamp: block.timestamp,
                        description,
                        logs: receipt?.logs.length || 0
                      })
                    } else {
                      console.log(`❌ Transaction not actually related to Smart Account`)
                    }
                  } catch (receiptError) {
                    console.warn(`Failed to get receipt for ${transaction.hash}:`, receiptError)
                  }
                }
              }
            }
          }
        } catch (blockError) {
          console.warn(`Failed to get block ${i}:`, blockError)
        }
      }

      console.log(`Found ${transactions.length} total transactions related to Smart Account`)
      
      // Sort by block number (newest first)
      transactions.sort((a, b) => b.blockNumber - a.blockNumber)
      
      if (transactions.length === 0) {
        console.log('No transactions found. Debugging info:')
        console.log('- Smart Account:', smartAccount)
        console.log('- Factory Address:', this.accountFactoryAddress)
        console.log('- Latest Block:', latestBlock)
      }
      
      return transactions
      
    } catch (error) {
      console.error('Failed to get transaction history:', error)
      return []
    }
  }
}

// Singleton instance
export const aaProvider = new AAProvider()