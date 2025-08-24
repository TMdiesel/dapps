import React, { useState, useEffect } from 'react'
import { useAAWallet } from '../hooks/useAAWallet'
import { aaProvider } from '../services/aa-provider'

const TransactionHistory: React.FC = () => {
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { smartAccount } = useAAWallet()

  useEffect(() => {
    console.log('TransactionHistory useEffect triggered with smartAccount:', smartAccount)
    const loadTransactionHistory = async () => {
      if (!smartAccount) {
        setTransactions([])
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        console.log('Loading transaction history for smartAccount:', smartAccount)
        console.log('Smart Account length:', smartAccount?.length)
        
        // Use the smartAccount directly since WalletConnect now provides the correct address
        const fullSmartAccount = smartAccount
        console.log('Using Smart Account address:', fullSmartAccount)
        console.log('About to call aaProvider.getTransactionHistory...')
        
        // Get transaction history from the AA provider
        const history = await aaProvider.getTransactionHistory(fullSmartAccount!)
        console.log('aaProvider.getTransactionHistory completed')
        console.log('Retrieved transaction history:', history)
        
        // Transform the data for display
        const transformedTxs = history.map((tx: any, index: number) => ({
          id: tx.hash || index.toString(),
          // Keep original data if present so type detection works
          data: tx.data,
          type: determineTransactionType(tx),
          action: tx.description || getTransactionAction(tx),
          amount: formatTransactionAmount(tx),
          status: tx.status,
          timestamp: formatTimestamp(tx.timestamp),
          hash: tx.hash,
          gasUsed: `${parseInt(tx.gasUsed || '0').toLocaleString()} wei`,
          blockNumber: tx.blockNumber,
          from: tx.from,
          to: tx.to,
          value: tx.value,
          logs: tx.logs
        }))

        console.log('Transformed transactions:', transformedTxs)
        
        // Merge with any optimistic items already shown instead of replacing.
        setTransactions((prev) => {
          // If nothing fetched, keep previous (avoid flicker/disappear) or show demo if empty.
          if (transformedTxs.length === 0) {
            if (prev.length > 0) return prev
            // Show demo only when we have absolutely nothing to show
            return [
              {
                id: 'demo-1',
                type: 'token',
                action: 'Smart Account Created',
                amount: 'Factory Call',
                status: 'success',
                timestamp: 'Just now',
                hash: '0x6bff89c024af71f14932de1a325d4a3443ccb35e4056be39a877321dc82667c1',
                gasUsed: '0 ETH (Sponsored)',
                blockNumber: 28,
                from: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
                to: '0x9A9f2CCfdE556A7E9Ff0848998Aa4a0CFD8863AE',
                value: '0'
              }
            ]
          }

          // Merge by hash, prefer fetched items over optimistic duplicates
          const byHash = new Map<string, any>()
          for (const t of prev) {
            if (t.hash) byHash.set(t.hash, t)
          }
          for (const t of transformedTxs) {
            if (t.hash) byHash.set(t.hash, t)
          }
          // Preserve order: fetched first (already sorted by backend), then any remaining prev
          const fetchedHashes = new Set(transformedTxs.map(t => t.hash))
          const merged: any[] = [...transformedTxs]
          for (const t of prev) {
            if (t.hash && !fetchedHashes.has(t.hash)) merged.push(t)
          }
          return merged
        })
        
      } catch (error) {
        console.error('Failed to load transaction history:', error)
        console.error('Error details:', error)
        setTransactions([])
      } finally {
        setLoading(false)
      }
    }

    loadTransactionHistory()
    
    // Listen for new transactions
    const handleTransactionCompleted = async (event: any) => {
      console.log('🎆 New transaction completed, reloading history...')
      const txHash = event?.detail?.txHash as string | undefined
      // Optimistically fetch the single tx by hash and prepend
      if (txHash) {
        try {
          const tx = await aaProvider.getTransactionDetails(txHash)
          if (tx) {
            const optimistic = {
              id: tx.hash,
              data: tx.data,
              type: determineTransactionType(tx),
              action: tx.description || getTransactionAction(tx),
              amount: formatTransactionAmount(tx),
              status: tx.status,
              timestamp: tx.timestamp ? formatTimestamp(tx.timestamp) : 'Just now',
              hash: tx.hash,
              gasUsed: `${parseInt(tx.gasUsed || '0').toLocaleString()} wei`,
              blockNumber: tx.blockNumber,
              from: tx.from,
              to: tx.to,
              value: tx.value,
              logs: tx.logs || 0
            }
            setTransactions(prev => {
              const exists = prev.some(p => p.hash === optimistic.hash)
              return exists ? prev : [optimistic, ...prev]
            })
          }
        } catch (e) {
          console.warn('Failed to optimistically fetch tx details:', e)
        }
      }
      // Then refresh full history shortly after
      setTimeout(() => {
        loadTransactionHistory()
      }, 1500)
    }
    
    window.addEventListener('transactionCompleted', handleTransactionCompleted as EventListener)
    
    // Cleanup event listener
    return () => {
      window.removeEventListener('transactionCompleted', handleTransactionCompleted as EventListener)
    }
  }, [smartAccount])

  const determineTransactionType = (tx: any): string => {
    if (tx.data && tx.data !== '0x') {
      // Try to decode the transaction data to determine type
      if (tx.data.includes('a9059cbb')) return 'token' // transfer function signature
      if (tx.data.includes('40c10f19')) return 'nft'   // mint function signature
      if (tx.data.includes('38ed1739')) return 'dex'   // swapExactTokensForTokens signature
    }
    return 'eth'
  }

  const getTransactionAction = (tx: any): string => {
    const type = determineTransactionType(tx)
    switch (type) {
      case 'token': return 'Token Transfer'
      case 'nft': return 'NFT Mint'
      case 'dex': return 'Token Swap'
      default: return 'ETH Transfer'
    }
  }

  const formatTransactionAmount = (tx: any): string => {
    const type = determineTransactionType(tx)
    const ethAmount = parseFloat(tx.value)
    
    switch (type) {
      case 'token':
        return `${ethAmount.toFixed(4)} DEMO`
      case 'nft':
        return '1 NFT'
      case 'dex':
        return `${ethAmount.toFixed(4)} ETH`
      default:
        return `${ethAmount.toFixed(6)} ETH`
    }
  }

  const formatTimestamp = (timestamp: number): string => {
    const now = Math.floor(Date.now() / 1000)
    const diff = now - timestamp
    
    if (diff < 60) return `${diff} seconds ago`
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`
    return `${Math.floor(diff / 86400)} days ago`
  }

  const getDemoTransactions = () => [
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
      case 'eth':
        return '⟠'
      default:
        return '📝'
    }
  }

  const openInExplorer = (hash: string) => {
    // In a real app, this would open Etherscan or local explorer
    navigator.clipboard.writeText(hash)
    alert(`Transaction hash copied: ${hash}`)
  }

  if (loading) {
    return (
      <div className="card">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
          <span className="ml-2">Loading transactions...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Transaction History</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => window.location.reload()}
            className="text-sm text-primary-600 hover:text-primary-700"
          >
            Refresh
          </button>
          <button className="text-sm text-primary-600 hover:text-primary-700">
            View all
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {transactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No transactions found</p>
            <p className="text-sm mt-1">
              {smartAccount ? 'Make your first transaction to see history here' : 'Connect wallet to view transaction history'}
            </p>
          </div>
        ) : (
          transactions.map((tx) => (
            <div key={tx.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
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
                    {tx.status}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{tx.timestamp}</div>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="space-x-4">
                  <button 
                    onClick={() => openInExplorer(tx.hash)}
                    className="hover:text-primary-600 font-mono"
                  >
                    {tx.hash.slice(0, 10)}...{tx.hash.slice(-8)}
                  </button>
                  {tx.blockNumber && (
                    <span>Block {tx.blockNumber}</span>
                  )}
                </div>
                <div>
                  Gas: {tx.gasUsed}
                </div>
              </div>

              {/* Additional details for real transactions */}
              {tx.from && tx.to && (
                <div className="mt-2 pt-2 border-t border-gray-100">
                  <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
                    <div>
                      <span className="font-semibold">From:</span> {tx.from.slice(0, 8)}...{tx.from.slice(-6)}
                    </div>
                    <div>
                      <span className="font-semibold">To:</span> {tx.to.slice(0, 8)}...{tx.to.slice(-6)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default TransactionHistory
