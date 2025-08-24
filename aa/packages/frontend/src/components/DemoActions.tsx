import React, { useState } from 'react'

interface DemoActionsProps {
  smartAccount: string
}

const DemoActions: React.FC<DemoActionsProps> = ({ smartAccount }) => {
  const [activeTab, setActiveTab] = useState<'token' | 'nft' | 'dex'>('token')
  const [isExecuting, setIsExecuting] = useState(false)

  const executeAction = async (action: string) => {
    setIsExecuting(true)
    try {
      console.log(`Executing ${action} for account ${smartAccount}`)
      
      // Import AA Provider for real blockchain interactions
      const { aaProvider } = await import('../services/aa-provider')
      let txHash: string
      
      switch (action) {
        case 'Token Transfer':
          // Execute token transfer through Smart Account
          txHash = await aaProvider.transferToken(
            smartAccount,
            '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', // recipient
            '10', // amount
            '0x68B1D87F95878fE05B998F19b66F4baba5De1aed' // token address from deployments
          )
          break
          
        case 'NFT Mint':
          // Execute NFT mint through Smart Account
          txHash = await aaProvider.mintNFT(
            smartAccount,
            '0x3Aa5ebB10DC797CAC828524e59A333d0A371443c' // NFT contract address from deployments
          )
          break
          
        case 'Token Swap':
          // Execute token swap through Smart Account
          txHash = await aaProvider.swapTokens(
            smartAccount,
            '0xc6e7DF5E7b4f2A278906862b61205850344D4e7d', // DEX address from deployments
            '0x68B1D87F95878fE05B998F19b66F4baba5De1aed', // tokenIn
            '0x0000000000000000000000000000000000000000', // tokenOut (ETH)
            '5', // amountIn
            '0.01' // amountOutMin
          )
          break
          
        default:
          throw new Error(`Unknown action: ${action}`)
      }
      
      console.log(`✅ ${action} transaction completed:`, txHash)
      alert(`${action} executed successfully! Transaction: ${txHash.slice(0, 10)}...`)
      
      // Wait a bit for the transaction to be mined, then reload transaction history
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('transactionCompleted', { 
          detail: { action, txHash, smartAccount } 
        }))
      }, 3000)
      
    } catch (error) {
      console.error(`❌ ${action} failed:`, error)
      alert(`${action} failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsExecuting(false)
    }
  }

  const tabs = [
    { id: 'token', label: 'Token Operations', icon: '🪙' },
    { id: 'nft', label: 'NFT Minting', icon: '🖼️' },
    { id: 'dex', label: 'DEX Trading', icon: '🔄' },
  ]

  return (
    <div className="card">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Demo Actions</h2>
        
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span>{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        {activeTab === 'token' && (
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Token Transfer</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">To Address</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="0x..."
                    defaultValue="0x742d35Cc6635F35B57C293aE"
                  />
                </div>
                <div>
                  <label className="label">Amount</label>
                  <input
                    type="number"
                    className="input"
                    placeholder="0.0"
                    defaultValue="10"
                  />
                </div>
              </div>
              <button
                onClick={() => executeAction('Token Transfer')}
                disabled={isExecuting}
                className="btn-primary mt-3 w-full"
              >
                {isExecuting ? 'Processing...' : 'Send Tokens (Gasless)'}
              </button>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-3">Faucet</h3>
              <p className="text-sm text-gray-600 mb-3">
                Get 100 DEMO tokens for testing (1 hour cooldown)
              </p>
              <button
                onClick={() => executeAction('Faucet Claim')}
                disabled={isExecuting}
                className="btn-secondary w-full"
              >
                Claim from Faucet
              </button>
            </div>
          </div>
        )}

        {activeTab === 'nft' && (
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Mint NFT</h3>
              <div className="bg-gray-50 p-4 rounded-md mb-4">
                <div className="w-full h-32 bg-gradient-to-br from-blue-400 to-purple-500 rounded-md mb-3"></div>
                <p className="text-sm text-gray-600 text-center">
                  Demo NFT Collection #1234
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-600">Price:</span>
                  <span className="font-medium ml-1">0.001 ETH</span>
                </div>
                <div>
                  <span className="text-gray-600">Supply:</span>
                  <span className="font-medium ml-1">1,234 / 10,000</span>
                </div>
              </div>

              <button
                onClick={() => executeAction('NFT Mint')}
                disabled={isExecuting}
                className="btn-primary w-full mt-4"
              >
                {isExecuting ? 'Minting...' : 'Mint NFT (Gasless)'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'dex' && (
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Token Swap</h3>
              
              <div className="space-y-3">
                <div>
                  <label className="label">From</label>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      className="input flex-1"
                      placeholder="0.0"
                      defaultValue="100"
                    />
                    <select className="input w-24">
                      <option>DEMO</option>
                      <option>ETH</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-center">
                  <button className="p-2 bg-gray-100 rounded-full">
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                    </svg>
                  </button>
                </div>

                <div>
                  <label className="label">To (Estimated)</label>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      className="input flex-1"
                      placeholder="0.0"
                      value="0.95"
                      disabled
                    />
                    <select className="input w-24">
                      <option>ETH</option>
                      <option>DEMO</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-3 rounded-md mt-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Exchange Rate:</span>
                  <span>1 DEMO = 0.0095 ETH</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Price Impact:</span>
                  <span className="text-green-600">0.1%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Fee:</span>
                  <span>0.3%</span>
                </div>
              </div>

              <button
                onClick={() => executeAction('Token Swap')}
                disabled={isExecuting}
                className="btn-primary w-full mt-4"
              >
                {isExecuting ? 'Swapping...' : 'Swap Tokens (Gasless)'}
              </button>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-3">Add Liquidity</h3>
              <p className="text-sm text-gray-600 mb-3">
                Add liquidity to earn trading fees
              </p>
              <button
                onClick={() => executeAction('Add Liquidity')}
                disabled={isExecuting}
                className="btn-secondary w-full"
              >
                Add Liquidity
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2 text-green-600">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Paymaster Active</span>
          </div>
          <span className="text-gray-500">All transactions are gasless</span>
        </div>
      </div>
    </div>
  )
}

export default DemoActions