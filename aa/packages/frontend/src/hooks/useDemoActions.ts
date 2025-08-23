import { useState } from 'react'
import { aaProvider } from '../services/aa-provider'

export interface Transaction {
  id: string
  type: 'token' | 'nft' | 'dex'
  action: string
  amount: string
  status: 'pending' | 'success' | 'failed'
  timestamp: string
  hash: string
  gasUsed: string
}

export const useDemoActions = (smartAccount: string | null) => {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isExecuting, setIsExecuting] = useState(false)

  const addTransaction = (tx: Omit<Transaction, 'id' | 'timestamp' | 'status'>) => {
    const newTx: Transaction = {
      ...tx,
      id: Date.now().toString(),
      timestamp: 'Just now',
      status: 'pending'
    }
    
    setTransactions(prev => [newTx, ...prev])
    return newTx.id
  }

  const updateTransaction = (id: string, updates: Partial<Transaction>) => {
    setTransactions(prev =>
      prev.map(tx => tx.id === id ? { ...tx, ...updates } : tx)
    )
  }

  const executeTokenTransfer = async (to: string, amount: string) => {
    if (!smartAccount) throw new Error('Wallet not connected')

    setIsExecuting(true)
    const txId = addTransaction({
      type: 'token',
      action: 'Token Transfer',
      amount: `${amount} DEMO`,
      hash: '0x...',
      gasUsed: '0 ETH (Sponsored)'
    })

    try {
      const hash = await aaProvider.transferToken(
        smartAccount,
        to,
        amount,
        '0x...' // Token address
      )

      updateTransaction(txId, {
        status: 'success',
        hash: hash.slice(0, 10) + '...' + hash.slice(-8)
      })

      return hash
    } catch (error) {
      updateTransaction(txId, { status: 'failed' })
      throw error
    } finally {
      setIsExecuting(false)
    }
  }

  const executeNFTMint = async () => {
    if (!smartAccount) throw new Error('Wallet not connected')

    setIsExecuting(true)
    const txId = addTransaction({
      type: 'nft',
      action: 'NFT Mint',
      amount: '1 NFT',
      hash: '0x...',
      gasUsed: '0 ETH (Sponsored)'
    })

    try {
      const hash = await aaProvider.mintNFT(
        smartAccount,
        '0x...' // NFT address
      )

      updateTransaction(txId, {
        status: 'success',
        hash: hash.slice(0, 10) + '...' + hash.slice(-8)
      })

      return hash
    } catch (error) {
      updateTransaction(txId, { status: 'failed' })
      throw error
    } finally {
      setIsExecuting(false)
    }
  }

  const executeTokenSwap = async (
    tokenIn: string,
    tokenOut: string,
    amountIn: string
  ) => {
    if (!smartAccount) throw new Error('Wallet not connected')

    setIsExecuting(true)
    const txId = addTransaction({
      type: 'dex',
      action: 'Token Swap',
      amount: `${amountIn} ${tokenIn} → ${tokenOut}`,
      hash: '0x...',
      gasUsed: '0 ETH (Sponsored)'
    })

    try {
      const hash = await aaProvider.swapTokens(
        smartAccount,
        '0x...', // DEX address
        tokenIn,
        tokenOut,
        amountIn,
        '0' // Min amount out
      )

      updateTransaction(txId, {
        status: 'success',
        hash: hash.slice(0, 10) + '...' + hash.slice(-8)
      })

      return hash
    } catch (error) {
      updateTransaction(txId, { status: 'failed' })
      throw error
    } finally {
      setIsExecuting(false)
    }
  }

  const executeFaucetClaim = async () => {
    if (!smartAccount) throw new Error('Wallet not connected')

    setIsExecuting(true)
    const txId = addTransaction({
      type: 'token',
      action: 'Faucet Claim',
      amount: '100 DEMO',
      hash: '0x...',
      gasUsed: '0 ETH (Sponsored)'
    })

    try {
      // Simulate faucet claim
      await new Promise(resolve => setTimeout(resolve, 2000))
      const hash = '0x' + Math.random().toString(16).slice(2, 64)

      updateTransaction(txId, {
        status: 'success',
        hash: hash.slice(0, 10) + '...' + hash.slice(-8)
      })

      return hash
    } catch (error) {
      updateTransaction(txId, { status: 'failed' })
      throw error
    } finally {
      setIsExecuting(false)
    }
  }

  return {
    transactions,
    isExecuting,
    executeTokenTransfer,
    executeNFTMint,
    executeTokenSwap,
    executeFaucetClaim
  }
}