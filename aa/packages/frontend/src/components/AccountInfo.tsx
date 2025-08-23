import React, { useState, useEffect } from 'react'

interface AccountInfoProps {
  smartAccount: string
}

const AccountInfo: React.FC<AccountInfoProps> = ({ smartAccount }) => {
  const [balance, setBalance] = useState('0.0')
  const [isLoading, setIsLoading] = useState(true)
  const [paymasterBalance, setPaymasterBalance] = useState('0.0')

  useEffect(() => {
    // Simulate loading account data
    const timer = setTimeout(() => {
      setBalance('1.5')
      setPaymasterBalance('0.1')
      setIsLoading(false)
    }, 1500)

    return () => clearTimeout(timer)
  }, [smartAccount])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('Address copied to clipboard!')
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  if (isLoading) {
    return (
      <div className="card">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Account Info</h2>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-400 rounded-full"></div>
          <span className="text-sm text-gray-600">Active</span>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="label">Smart Contract Address</label>
          <div className="flex items-center space-x-2">
            <div className="flex-1 p-3 bg-gray-50 rounded-md font-mono text-sm">
              {formatAddress(smartAccount)}
            </div>
            <button
              onClick={() => copyToClipboard(smartAccount)}
              className="p-2 text-gray-500 hover:text-gray-700"
              title="Copy address"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">ETH Balance</label>
            <div className="p-3 bg-gray-50 rounded-md">
              <div className="text-lg font-semibold">{balance} ETH</div>
              <div className="text-xs text-gray-500">~$2,400 USD</div>
            </div>
          </div>

          <div>
            <label className="label">Paymaster Balance</label>
            <div className="p-3 bg-green-50 rounded-md">
              <div className="text-lg font-semibold text-green-700">{paymasterBalance} ETH</div>
              <div className="text-xs text-green-600">Available for gas</div>
            </div>
          </div>
        </div>

        <div>
          <label className="label">Account Features</label>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center space-x-2 p-2 bg-blue-50 rounded">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Gasless Transactions</span>
            </div>
            <div className="flex items-center space-x-2 p-2 bg-purple-50 rounded">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>Batch Operations</span>
            </div>
            <div className="flex items-center space-x-2 p-2 bg-orange-50 rounded">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span>Social Recovery</span>
            </div>
            <div className="flex items-center space-x-2 p-2 bg-green-50 rounded">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Custom Logic</span>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-200">
          <div className="flex justify-between items-center text-sm text-gray-600">
            <span>Network</span>
            <span className="font-medium">Localhost (Hardhat)</span>
          </div>
          <div className="flex justify-between items-center text-sm text-gray-600 mt-1">
            <span>Entry Point</span>
            <span className="font-mono text-xs">0x123...abc</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AccountInfo