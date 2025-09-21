const axios = require('axios');

async function testDeposit() {
  try {
    console.log('🧪 Testing deposit flow...');
    
    const baseURL = 'http://localhost:5000';
    const walletAddress = '0x5CD1f65706607c9C2C9150b7e0649Ab474BA982F';
    
    // Step 1: Initiate deposit
    console.log('📤 Step 1: Initiating deposit...');
    const depositResponse = await axios.post(`${baseURL}/api/transactions/deposit`, {
      amount: 500,
      type: 'stripe'
    }, {
      headers: {
        'Content-Type': 'application/json',
        'x-wallet-address': walletAddress
      }
    });
    
    console.log('✅ Deposit initiated:', depositResponse.data);
    const transactionId = depositResponse.data.data.transactionId;
    const paymentIntentId = depositResponse.data.data.paymentIntent.id;
    
    // Step 2: Confirm deposit
    console.log('📤 Step 2: Confirming deposit...');
    const confirmResponse = await axios.post(`${baseURL}/api/transactions/confirm-deposit`, {
      transactionId: transactionId,
      paymentIntentId: paymentIntentId
    }, {
      headers: {
        'Content-Type': 'application/json',
        'x-wallet-address': walletAddress
      }
    });
    
    console.log('✅ Deposit confirmed:', confirmResponse.data);
    
    // Step 3: Check balance
    console.log('📤 Step 3: Checking balance...');
    const balanceResponse = await axios.get(`${baseURL}/api/contracts/balance/${walletAddress}`);
    console.log('💰 Current balance:', balanceResponse.data);
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testDeposit();
