import { useState } from 'react'
import WalletConnect from './components/WalletConnect'
import AccountInfo from './components/AccountInfo'
import DemoActions from './components/DemoActions'
import TransactionHistory from './components/TransactionHistory'
import Header from './components/Header'
import Features from './components/Features'

function App() {
  const [isConnected, setIsConnected] = useState(false)
  const [smartAccount, setSmartAccount] = useState<string>('')

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse delay-700"></div>
        <div className="absolute top-40 left-40 w-60 h-60 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse delay-1000"></div>
      </div>

      <Header isConnected={isConnected} />

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!isConnected ? (
          <div className="space-y-16">
            {/* Hero Section */}
            <div className="text-center space-y-8">
              <div className="space-y-4">
                <h1 className="text-6xl font-black gradient-text leading-tight">
                  Account Abstraction
                </h1>
                <h2 className="text-4xl font-bold text-gray-800">
                  Demo Experience
                </h2>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                  Explore the future of Web3 with gasless transactions, smart contract wallets,
                  and seamless user experiences powered by ERC-4337
                </p>
              </div>
              
              {/* Stats */}
              <div className="flex justify-center space-x-12">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">0%</div>
                  <div className="text-sm text-gray-600">Gas Fees</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">100%</div>
                  <div className="text-sm text-gray-600">Gasless</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">∞</div>
                  <div className="text-sm text-gray-600">Possibilities</div>
                </div>
              </div>
            </div>

            {/* Features */}
            <Features />

            {/* Connect Section */}
            <div className="max-w-md mx-auto">
              <WalletConnect 
                onConnect={(account) => {
                  setIsConnected(true)
                  setSmartAccount(account)
                }}
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
            <div className="xl:col-span-3 space-y-8">
              <AccountInfo smartAccount={smartAccount} />
              <DemoActions smartAccount={smartAccount} />
            </div>
            <div className="xl:col-span-1">
              <TransactionHistory />
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 bg-white/30 backdrop-blur-sm border-t border-white/20 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg"></div>
              <span className="text-xl font-bold gradient-text">AA Demo</span>
            </div>
            <p className="text-gray-600">
              🚀 Built with Account Abstraction (ERC-4337) • Educational Demo
            </p>
            <div className="flex justify-center space-x-6 text-sm text-gray-500">
              <span>🔐 Your keys, your crypto</span>
              <span>💰 Zero gas fees</span>
              <span>🎯 Smart contract wallets</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App