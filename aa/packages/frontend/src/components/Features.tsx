import React from 'react';

interface Feature {
  title: string;
  description: string;
  icon: string;
}

const Features: React.FC = () => {
  const features: Feature[] = [
    {
      title: 'Smart Wallet',
      description: 'Create and manage your smart contract wallet with advanced features',
      icon: '🔐'
    },
    {
      title: 'Gasless Transactions',
      description: 'Execute transactions without holding ETH using our paymaster',
      icon: '⛽'
    },
    {
      title: 'Token Faucet',
      description: 'Get demo tokens instantly to test the platform features',
      icon: '🚰'
    },
    {
      title: 'DEX Trading',
      description: 'Trade tokens on our integrated decentralized exchange',
      icon: '📈'
    },
    {
      title: 'NFT Collection',
      description: 'Mint and manage your NFT collection with smart wallet',
      icon: '🖼️'
    },
    {
      title: 'Batch Operations',
      description: 'Execute multiple operations in a single transaction',
      icon: '📦'
    }
  ];

  return (
    <section className="py-20 px-4 relative">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-6">
            Platform Features
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Experience the future of blockchain interactions with Account Abstraction
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="glass-card p-8 hover:scale-105 transition-all duration-300 group cursor-pointer"
            >
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>
              <div className="mt-4 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
            </div>
          ))}
        </div>
      </div>
      
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/4 w-32 h-32 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse" />
      <div className="absolute top-3/4 right-1/4 w-24 h-24 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse delay-1000" />
    </section>
  );
};

export default Features;