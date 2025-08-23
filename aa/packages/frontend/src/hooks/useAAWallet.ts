import { useState, useEffect } from 'react'
import { aaProvider } from '../services/aa-provider'

export interface AAWalletState {
  isConnected: boolean
  smartAccount: string | null
  owner: string | null
  balance: string
  isLoading: boolean
  error: string | null
}

export const useAAWallet = () => {
  const [state, setState] = useState<AAWalletState>({
    isConnected: false,
    smartAccount: null,
    owner: null,
    balance: '0',
    isLoading: false,
    error: null
  })

  const connectWallet = async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))
    
    try {
      // Check if MetaMask is available
      if (typeof window.ethereum === 'undefined') {
        throw new Error('MetaMask is not installed')
      }

      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      })

      if (accounts.length === 0) {
        throw new Error('No accounts found')
      }

      const owner = accounts[0]
      
      // Create or get smart account
      const smartAccount = await aaProvider.createSmartAccount(owner)
      
      setState(prev => ({
        ...prev,
        isConnected: true,
        smartAccount,
        owner,
        balance: '1.5', // Mock balance
        isLoading: false
      }))

      return smartAccount

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }))
      throw error
    }
  }

  const disconnect = () => {
    setState({
      isConnected: false,
      smartAccount: null,
      owner: null,
      balance: '0',
      isLoading: false,
      error: null
    })
  }

  const sendTransaction = async (
    _to: string,
    _value: string,
    data: string = '0x'
  ) => {
    if (!state.smartAccount) {
      throw new Error('Wallet not connected')
    }

    try {
      const txHash = await aaProvider.sendUserOperation({
        sender: state.smartAccount,
        callData: data
      })

      return txHash
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Transaction failed'
      setState(prev => ({ ...prev, error: errorMessage }))
      throw error
    }
  }

  // Auto-connect if previously connected
  useEffect(() => {
    const checkConnection = async () => {
      try {
        if (typeof window.ethereum !== 'undefined') {
          const accounts = await window.ethereum.request({
            method: 'eth_accounts'
          })
          
          if (accounts.length > 0) {
            // Auto-connect logic could go here
            // For demo, we'll skip auto-connect
          }
        }
      } catch (error) {
        console.error('Failed to check connection:', error)
      }
    }

    checkConnection()
  }, [])

  return {
    ...state,
    connectWallet,
    disconnect,
    sendTransaction
  }
}