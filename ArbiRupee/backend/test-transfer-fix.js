const axios = require('axios');

async function testTransfer() {
  try {
    console.log('🧪 Testing transfer flow...');
    
    const baseURL = 'http://localhost:5000';
    const senderAddress = '0x5CD1f65706607c9C2C9150b7e0649Ab474BA982F';
    const recipientAddress = '0x742d35Cc6634C0532925A3B8D7389C7AbB1f1c1e';
    
    // Step 1: Check sender balance before transfer
    console.log('📤 Step 1: Checking sender balance before transfer...');
    const balanceBeforeResponse = await axios.get(`${baseURL}/api/contracts/balance/${senderAddress}`);
    console.log('💰 Sender balance before:', balanceBeforeResponse.data.data.balance);
    
    // Step 2: Make transfer
    console.log('📤 Step 2: Making transfer...');
    const transferResponse = await axios.post(`${baseURL}/api/transactions/transfer`, {
      recipientAddress: recipientAddress,
      amount: 100
    }, {
      headers: {
        'Content-Type': 'application/json',
        'x-wallet-address': senderAddress
      }
    });
    
    console.log('✅ Transfer result:', transferResponse.data);
    
    // Step 3: Check sender balance after transfer
    console.log('📤 Step 3: Checking sender balance after transfer...');
    const balanceAfterResponse = await axios.get(`${baseURL}/api/contracts/balance/${senderAddress}`);
    console.log('💰 Sender balance after:', balanceAfterResponse.data.data.balance);
    
    const balanceBefore = balanceBeforeResponse.data.data.balance;
    const balanceAfter = balanceAfterResponse.data.data.balance;
    const difference = balanceBefore - balanceAfter;
    
    console.log(`\n📊 Transfer Summary:`);
    console.log(`Balance before: ${balanceBefore} arbINR`);
    console.log(`Balance after: ${balanceAfter} arbINR`);
    console.log(`Amount transferred: 100 arbINR`);
    console.log(`Actual deduction: ${difference} arbINR`);
    
    if (Math.abs(difference - 100) < 0.01) {
      console.log('✅ Transfer working correctly - amount properly deducted!');
    } else {
      console.log('❌ Transfer issue - amount not properly deducted!');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testTransfer();
