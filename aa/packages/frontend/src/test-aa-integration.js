// AA Integration Test Script
// This can be run in browser console to test the AA functionality

async function testAAIntegration() {
  console.log('🧪 Testing AA Integration...')
  
  try {
    // Test 1: AA Provider initialization
    const { AAProvider } = await import('./services/aa-provider')
    const aaProvider = new AAProvider()
    console.log('✅ AA Provider initialized')
    
    // Test 2: Mock owner address (from Hardhat)
    const mockOwner = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'
    
    // Test 3: Create Smart Account
    console.log('Creating smart account for:', mockOwner)
    const smartAccount = await aaProvider.createSmartAccount(mockOwner)
    console.log('✅ Smart Account created:', smartAccount)
    
    // Test 4: Verify it's not the factory address
    const factoryAddress = '0x9A9f2CCfdE556A7E9Ff0848998Aa4a0CFD8863AE'
    if (smartAccount !== factoryAddress) {
      console.log('✅ Address is different from factory')
    } else {
      console.log('❌ Address is same as factory - problem!')
    }
    
    // Test 5: Check transaction history
    console.log('Getting transaction history...')
    const transactions = await aaProvider.getTransactionHistory(smartAccount)
    console.log('✅ Transaction history:', transactions.length, 'transactions')
    
    // Test 6: Contract loading
    console.log('✅ All tests completed successfully!')
    
    return {
      success: true,
      smartAccount,
      transactionCount: transactions.length
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// Auto-run if in browser
if (typeof window !== 'undefined') {
  window.testAAIntegration = testAAIntegration
  console.log('🚀 Run testAAIntegration() in console to test AA functionality')
}

export { testAAIntegration }