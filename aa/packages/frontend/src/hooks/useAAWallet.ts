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
      console.log('EOA owner:', owner)
      
      // Create or get smart account
      const smartAccount = await aaProvider.createSmartAccount(owner)
      console.log('Smart Account created/retrieved:', smartAccount)
      
      // Store the smart account address for consistency
      localStorage.setItem('smartAccount', smartAccount)
      localStorage.setItem('owner', owner)
      
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
    // Clear localStorage
    localStorage.removeItem('smartAccount')
    localStorage.removeItem('owner')
    
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
      console.log('🔄 Checking auto-connection...')
      try {
        const storedSmartAccount = localStorage.getItem('smartAccount')
        const storedOwner = localStorage.getItem('owner')
        
        console.log('📦 Stored data:', { storedSmartAccount, storedOwner })
        
        if (storedSmartAccount && storedOwner) {
          if (typeof window.ethereum !== 'undefined') {
            const accounts = await window.ethereum.request({
              method: 'eth_accounts'
            })
            
            console.log('🔗 MetaMask accounts:', accounts)
            
            if (accounts.length > 0 && accounts[0].toLowerCase() === storedOwner.toLowerCase()) {
              console.log('✅ Auto-connecting with stored addresses:', {
                smartAccount: storedSmartAccount,
                owner: storedOwner
              })
              
              setState(prev => ({
                ...prev,
                isConnected: true,
                smartAccount: storedSmartAccount,
                owner: storedOwner,
                balance: '1.5'
              }))
              
              console.log('🎉 Auto-connection successful!')
            } else {
              console.log('❌ Stored owner does not match MetaMask accounts')
              // Clear invalid stored data
              localStorage.removeItem('smartAccount')
              localStorage.removeItem('owner')
            }
          } else {
            console.log('❌ MetaMask not available')
          }
        } else {
          console.log('📭 No stored wallet data found')
        }
      } catch (error) {
        console.error('❌ Failed to check connection:', error)
      }
    }

    checkConnection()
    
    // Listen for wallet connection events
    const handleWalletConnected = (event: CustomEvent) => {
      console.log('🎧 Received walletConnected event:', event.detail)
      const { smartAccount, owner } = event.detail
      
      setState(prev => ({
        ...prev,
        isConnected: true,
        smartAccount,
        owner,
        balance: '1.5',
        isLoading: false
      }))
    }
    
    window.addEventListener('walletConnected', handleWalletConnected as EventListener)
    
    // Cleanup event listener
    return () => {
      window.removeEventListener('walletConnected', handleWalletConnected as EventListener)
    }
  }, [])

  return {
    ...state,
    connectWallet,
    disconnect,
    sendTransaction
  }
}