const axios = require('axios');

async function testWithdraw() {
  try {
    console.log('🧪 Testing withdrawal flow...');
    
    const baseURL = 'http://localhost:5000';
    const walletAddress = '0x5CD1f65706607c9C2C9150b7e0649Ab474BA982F';
    
    // Step 1: Get withdrawal details
    console.log('📤 Step 1: Getting withdrawal details...');
    const detailsResponse = await axios.get(`${baseURL}/api/withdraw`, {
      headers: {
        'x-wallet-address': walletAddress
      }
    });
    
    console.log('✅ Withdrawal details:', detailsResponse.data);
    
    // Step 2: Initiate withdrawal
    console.log('📤 Step 2: Initiating withdrawal...');
    const withdrawResponse = await axios.post(`${baseURL}/api/withdraw`, {
      amount: 100,
      type: 'stripe',
      accountHolder: 'Test User',
      accountNumber: '1234567890',
      ifsc: 'SBIN0001234',
      bankName: 'State Bank of India'
    }, {
      headers: {
        'Content-Type': 'application/json',
        'x-wallet-address': walletAddress
      }
    });
    
    console.log('✅ Withdrawal initiated:', withdrawResponse.data);
    
    // Step 3: Check balance after withdrawal
    console.log('📤 Step 3: Checking balance after withdrawal...');
    const balanceResponse = await axios.get(`${baseURL}/api/contracts/balance/${walletAddress}`);
    console.log('💰 Current balance:', balanceResponse.data);
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testWithdraw();
