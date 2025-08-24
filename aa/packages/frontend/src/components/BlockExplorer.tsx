import React, { useState, useEffect } from 'react'
import { ethers } from 'ethers'

interface Transaction {
  hash: string
  from: string
  to: string | null
  value: string
  gasUsed: string
  gasPrice: string
  status: 'success' | 'failed'
  blockNumber: number
  timestamp: number
  data: string
}

interface Block {
  number: number
  hash: string
  timestamp: number
  transactions: number
  gasUsed: string
  gasLimit: string
}

const BlockExplorer: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'transactions' | 'blocks'>('transactions')
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [blocks, setBlocks] = useState<Block[]>([])
  const [loading, setLoading] = useState(true)
  const [provider, setProvider] = useState<ethers.JsonRpcProvider | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResult, setSearchResult] = useState<any>(null)

  useEffect(() => {
    const initProvider = async () => {
      const rpcProvider = new ethers.JsonRpcProvider('http://localhost:8545')
      setProvider(rpcProvider)
      await loadRecentData(rpcProvider)
    }
    initProvider()
  }, [])

  const loadRecentData = async (rpcProvider: ethers.JsonRpcProvider) => {
    try {
      setLoading(true)
      const latestBlock = await rpcProvider.getBlockNumber()
      
      // Load recent blocks
      const blockPromises = []
      for (let i = Math.max(0, latestBlock - 9); i <= latestBlock; i++) {
        blockPromises.push(loadBlockData(rpcProvider, i))
      }
      const blockData = await Promise.all(blockPromises)
      setBlocks(blockData.filter(Boolean))

      // Load recent transactions
      const txs: Transaction[] = []
      for (let i = Math.max(0, latestBlock - 20); i <= latestBlock; i++) {
        const block = await rpcProvider.getBlock(i, true)
        if (block && block.transactions) {
          for (const tx of block.transactions) {
            if (typeof tx === 'object' && txs.length < 50) {
              const receipt = await rpcProvider.getTransactionReceipt(tx.hash)
              txs.push({
                hash: tx.hash,
                from: tx.from,
                to: tx.to,
                value: ethers.formatEther(tx.value),
                gasUsed: receipt?.gasUsed.toString() || '0',
                gasPrice: tx.gasPrice?.toString() || '0',
                status: receipt?.status === 1 ? 'success' : 'failed',
                blockNumber: i,
                timestamp: block.timestamp,
                data: tx.data
              })
            }
          }
        }
      }
      setTransactions(txs.reverse())

    } catch (error) {
      console.error('Failed to load blockchain data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadBlockData = async (rpcProvider: ethers.JsonRpcProvider, blockNumber: number): Promise<Block | null> => {
    try {
      const block = await rpcProvider.getBlock(blockNumber)
      if (!block) return null

      return {
        number: block.number,
        hash: block.hash,
        timestamp: block.timestamp,
        transactions: block.transactions.length,
        gasUsed: block.gasUsed.toString(),
        gasLimit: block.gasLimit.toString()
      }
    } catch (error) {
      console.error(`Failed to load block ${blockNumber}:`, error)
      return null
    }
  }

  const handleSearch = async () => {
    if (!provider || !searchQuery.trim()) return

    try {
      setLoading(true)
      setSearchResult(null)

      // Determine search type
      if (searchQuery.match(/^0x[a-fA-F0-9]{64}$/)) {
        // Transaction hash
        const tx = await provider.getTransaction(searchQuery)
        const receipt = await provider.getTransactionReceipt(searchQuery)
        setSearchResult({
          type: 'transaction',
          data: { ...tx, receipt }
        })
      } else if (searchQuery.match(/^0x[a-fA-F0-9]{40}$/)) {
        // Address
        const balance = await provider.getBalance(searchQuery)
        const code = await provider.getCode(searchQuery)
        setSearchResult({
          type: 'address',
          data: {
            address: searchQuery,
            balance: ethers.formatEther(balance),
            isContract: code !== '0x',
            code: code !== '0x' ? code : null
          }
        })
      } else if (searchQuery.match(/^\d+$/)) {
        // Block number
        const blockNumber = parseInt(searchQuery)
        const block = await provider.getBlock(blockNumber, true)
        setSearchResult({
          type: 'block',
          data: block
        })
      }
    } catch (error) {
      console.error('Search failed:', error)
      setSearchResult({ type: 'error', data: 'Not found' })
    } finally {
      setLoading(false)
    }
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString()
  }

  if (loading && !transactions.length && !blocks.length) {
    return (
      <div className="card">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          <span className="ml-2">Loading blockchain data...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Block Explorer</h2>
        
        {/* Search */}
        <div className="flex space-x-2 mb-4">
          <input
            type="text"
            placeholder="Search by address, transaction hash, or block number"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            Search
          </button>
        </div>

        {/* Search Results */}
        {searchResult && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2">Search Result</h3>
            {searchResult.type === 'transaction' && (
              <div>
                <p><strong>Hash:</strong> {searchResult.data.hash}</p>
                <p><strong>From:</strong> {searchResult.data.from}</p>
                <p><strong>To:</strong> {searchResult.data.to || 'Contract Creation'}</p>
                <p><strong>Value:</strong> {ethers.formatEther(searchResult.data.value)} ETH</p>
                <p><strong>Status:</strong> 
                  <span className={`ml-1 ${searchResult.data.receipt?.status === 1 ? 'text-green-600' : 'text-red-600'}`}>
                    {searchResult.data.receipt?.status === 1 ? 'Success' : 'Failed'}
                  </span>
                </p>
              </div>
            )}
            {searchResult.type === 'address' && (
              <div>
                <p><strong>Address:</strong> {searchResult.data.address}</p>
                <p><strong>Balance:</strong> {searchResult.data.balance} ETH</p>
                <p><strong>Type:</strong> {searchResult.data.isContract ? 'Contract' : 'EOA'}</p>
              </div>
            )}
            {searchResult.type === 'block' && (
              <div>
                <p><strong>Block:</strong> {searchResult.data.number}</p>
                <p><strong>Hash:</strong> {searchResult.data.hash}</p>
                <p><strong>Transactions:</strong> {searchResult.data.transactions.length}</p>
                <p><strong>Timestamp:</strong> {formatTimestamp(searchResult.data.timestamp)}</p>
              </div>
            )}
            {searchResult.type === 'error' && (
              <p className="text-red-600">{searchResult.data}</p>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="flex space-x-4 border-b">
          <button
            onClick={() => setActiveTab('transactions')}
            className={`pb-2 px-1 ${
              activeTab === 'transactions'
                ? 'border-b-2 border-primary-500 text-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Latest Transactions
          </button>
          <button
            onClick={() => setActiveTab('blocks')}
            className={`pb-2 px-1 ${
              activeTab === 'blocks'
                ? 'border-b-2 border-primary-500 text-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Latest Blocks
          </button>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'transactions' && (
        <div className="space-y-3">
          {transactions.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No transactions found</p>
          ) : (
            transactions.map((tx) => (
              <div key={tx.hash} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-mono text-sm">
                    <span className="font-semibold">Hash:</span> {formatAddress(tx.hash)}
                  </div>
                  <div className={`px-2 py-1 rounded text-xs ${
                    tx.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {tx.status}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>
                    <span className="font-semibold">From:</span> {formatAddress(tx.from)}
                  </div>
                  <div>
                    <span className="font-semibold">To:</span> {tx.to ? formatAddress(tx.to) : 'Contract Creation'}
                  </div>
                  <div>
                    <span className="font-semibold">Value:</span> {parseFloat(tx.value).toFixed(6)} ETH
                  </div>
                  <div>
                    <span className="font-semibold">Gas Used:</span> {parseInt(tx.gasUsed).toLocaleString()}
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  Block {tx.blockNumber} • {formatTimestamp(tx.timestamp)}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'blocks' && (
        <div className="space-y-3">
          {blocks.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No blocks found</p>
          ) : (
            blocks.map((block) => (
              <div key={block.number} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-semibold">Block {block.number}</div>
                  <div className="text-sm text-gray-500">
                    {formatTimestamp(block.timestamp)}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>
                    <span className="font-semibold">Hash:</span> {formatAddress(block.hash)}
                  </div>
                  <div>
                    <span className="font-semibold">Transactions:</span> {block.transactions}
                  </div>
                  <div>
                    <span className="font-semibold">Gas Used:</span> {parseInt(block.gasUsed).toLocaleString()}
                  </div>
                  <div>
                    <span className="font-semibold">Gas Limit:</span> {parseInt(block.gasLimit).toLocaleString()}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default BlockExplorer