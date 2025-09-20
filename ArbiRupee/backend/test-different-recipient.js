const axios = require('axios');

async function testDifferentRecipient() {
  console.log('👥 Testing Transfer to Different Recipient...');
  
  try {
    const baseURL = 'http://localhost:5000';
    const senderAddress = '0x5CD1f65706607c9C2C9150b7e0649Ab474BA982F';
    const recipientAddress = '0x742d35Cc6634C0532925a3b8D7389c7abb1F1c1e'; // Different address - will fix checksum
    
    const transferData = {
      recipientAddress: recipientAddress,
      amount: 0.1,
      note: 'Test transfer'
    };
    
    console.log('📤 Sending transfer request...');
    console.log('   From:', senderAddress);
    console.log('   To:', recipientAddress);
    console.log('   Amount:', transferData.amount, 'arbINR');
    
    const response = await axios.post(`${baseURL}/api/transactions/transfer`, transferData, {
      headers: {
        'Content-Type': 'application/json',
        'x-wallet-address': senderAddress
      }
    });
    
    console.log('✅ API Response:');
    console.log('   Status:', response.status);
    console.log('   Data:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.log('❌ API Error:');
    if (error.response) {
      console.log('   Status:', error.response.status);
      console.log('   Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('   Message:', error.message);
    }
  }
}

if (require.main === module) {
  testDifferentRecipient()
    .then(() => {
      console.log('\n✅ Different recipient test completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Different recipient test failed:', error);
      process.exit(1);
    });
}

module.exports = { testDifferentRecipient };
