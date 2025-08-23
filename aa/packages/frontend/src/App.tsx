import React from 'react'
import { useState } from 'react'
import WalletConnect from './components/WalletConnect'
import AccountInfo from './components/AccountInfo'
import DemoActions from './components/DemoActions'
import TransactionHistory from './components/TransactionHistory'

function App() {
  const [isConnected, setIsConnected] = useState(false)
  const [smartAccount, setSmartAccount] = useState<string>('')

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Account Abstraction Demo
              </h1>
              <p className="text-gray-600">
                Experience gasless transactions with smart contract wallets
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                isConnected 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!isConnected ? (
          <div className="max-w-md mx-auto">
            <WalletConnect 
              onConnect={(account) => {
                setIsConnected(true)
                setSmartAccount(account)
              }}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <AccountInfo smartAccount={smartAccount} />
              <DemoActions smartAccount={smartAccount} />
            </div>
            <div className="lg:col-span-1">
              <TransactionHistory />
            </div>
          </div>
        )}
      </main>

      <footer className="bg-white border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-500">
            <p>🚀 Built with Account Abstraction (ERC-4337)</p>
            <p className="text-sm mt-2">
              Demo environment • Educational purposes only
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App