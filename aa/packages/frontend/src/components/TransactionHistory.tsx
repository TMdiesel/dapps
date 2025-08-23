import React from 'react'

const TransactionHistory: React.FC = () => {
  const transactions = [
    {
      id: '1',
      type: 'token',
      action: 'Token Transfer',
      amount: '10 DEMO',
      status: 'success',
      timestamp: '2 minutes ago',
      hash: '0x1234...5678',
      gasUsed: '0 ETH (Sponsored)'
    },
    {
      id: '2',
      type: 'nft',
      action: 'NFT Mint',
      amount: '1 NFT',
      status: 'success',
      timestamp: '5 minutes ago',
      hash: '0x2345...6789',
      gasUsed: '0 ETH (Sponsored)'
    },
    {
      id: '3',
      type: 'dex',
      action: 'Token Swap',
      amount: '50 DEMO → 0.48 ETH',
      status: 'pending',
      timestamp: '7 minutes ago',
      hash: '0x3456...7890',
      gasUsed: '0 ETH (Sponsored)'
    },
    {
      id: '4',
      type: 'token',
      action: 'Faucet Claim',
      amount: '100 DEMO',
      status: 'success',
      timestamp: '12 minutes ago',
      hash: '0x4567...8901',
      gasUsed: '0 ETH (Sponsored)'
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-600 bg-green-50'
      case 'pending':
        return 'text-yellow-600 bg-yellow-50'
      case 'failed':
        return 'text-red-600 bg-red-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'token':
        return '🪙'
      case 'nft':
        return '🖼️'
      case 'dex':
        return '🔄'
      default:
        return '📝'
    }
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Transaction History</h2>
        <button className="text-sm text-primary-600 hover:text-primary-700">
          View all
        </button>
      </div>

      <div className="space-y-4">
        {transactions.map((tx) => (
          <div key={tx.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center space-x-3">
                <div className="text-lg">{getTypeIcon(tx.type)}</div>
                <div>
                  <div className="font-medium text-gray-900">{tx.action}</div>
                  <div className="text-sm text-gray-500">{tx.amount}</div>
                </div>
              </div>
              <div className="text-right">
                <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(tx.status)}`}>
                  {tx.status === 'pending' && (
                    <div className="animate-spin rounded-full h-3 w-3 border-b border-current mr-1"></div>
                  )}
                  {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                </div>
              </div>
            </div>

            <div className="text-xs text-gray-500 space-y-1">
              <div className="flex justify-between">
                <span>Time:</span>
                <span>{tx.timestamp}</span>
              </div>
              <div className="flex justify-between">
                <span>Hash:</span>
                <span className="font-mono">{tx.hash}</span>
              </div>
              <div className="flex justify-between">
                <span>Gas:</span>
                <span className="text-green-600 font-medium">{tx.gasUsed}</span>
              </div>
            </div>

            {tx.status === 'success' && (
              <div className="mt-2 pt-2 border-t border-gray-100">
                <button className="text-xs text-primary-600 hover:text-primary-700">
                  View on Explorer
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600 mb-1">$0.00</div>
          <div className="text-sm text-gray-600">Total Gas Saved</div>
          <div className="text-xs text-gray-500 mt-1">
            All transactions sponsored by Paymaster
          </div>
        </div>
      </div>

      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <div className="text-sm text-blue-700 font-medium">
            Account Abstraction Benefits
          </div>
        </div>
        <ul className="mt-2 text-xs text-blue-600 space-y-1 ml-4">
          <li>• No gas fees for users</li>
          <li>• Batch multiple operations</li>
          <li>• Enhanced security features</li>
          <li>• Better user experience</li>
        </ul>
      </div>
    </div>
  )
}

export default TransactionHistory