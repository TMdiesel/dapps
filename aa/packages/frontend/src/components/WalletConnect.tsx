import React, { useState } from 'react'

interface WalletConnectProps {
  onConnect: (smartAccount: string) => void
}

const WalletConnect: React.FC<WalletConnectProps> = ({ onConnect }) => {
  const [isConnecting, setIsConnecting] = useState(false)
  const [step, setStep] = useState<'wallet' | 'account'>('wallet')

  const connectWallet = async () => {
    setIsConnecting(true)
    try {
      // Check if MetaMask is available
      if (typeof window.ethereum === 'undefined') {
        alert('MetaMask is not installed. Please install MetaMask to continue.')
        return
      }

      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      })

      if (accounts.length === 0) {
        throw new Error('No accounts found')
      }

      setStep('account')
      
      // For demo, we'll simulate smart account creation
      // In real implementation, this would use the AccountFactory
      const mockSmartAccount = '0x' + Math.random().toString(16).slice(2, 42)
      
      setTimeout(() => {
        onConnect(mockSmartAccount)
        setIsConnecting(false)
      }, 2000)

    } catch (error) {
      console.error('Failed to connect:', error)
      alert('Failed to connect wallet. Please try again.')
      setIsConnecting(false)
      setStep('wallet')
    }
  }

  return (
    <div className="card text-center">
      <div className="mb-6">
        <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-10 h-10 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 0h10a2 2 0 002-2v-2a2 2 0 00-2-2H9a2 2 0 00-2 2v2a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Connect Your Wallet
        </h2>
        <p className="text-gray-600">
          Connect your MetaMask wallet to create a smart contract wallet
        </p>
      </div>

      {step === 'wallet' && (
        <div>
          <button
            onClick={connectWallet}
            disabled={isConnecting}
            className="btn-primary w-full text-lg py-3 mb-4"
          >
            {isConnecting ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Connecting...
              </div>
            ) : (
              'Connect MetaMask'
            )}
          </button>
          
          <div className="text-sm text-gray-500 space-y-2">
            <p>🔐 Your keys, your crypto</p>
            <p>💰 Gasless transactions with Paymaster</p>
            <p>🎯 Smart contract wallet features</p>
          </div>
        </div>
      )}

      {step === 'account' && (
        <div>
          <div className="animate-pulse mb-4">
            <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
          </div>
          <p className="text-primary-600 font-medium">
            Creating your smart contract wallet...
          </p>
          <div className="mt-4 text-sm text-gray-500">
            <p>⏳ Deploying smart account</p>
            <p>🔗 Setting up Account Abstraction</p>
          </div>
        </div>
      )}

      <div className="mt-6 pt-6 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          Demo environment • No real funds required
        </p>
      </div>
    </div>
  )
}

export default WalletConnect