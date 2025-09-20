const axios = require('axios');

async function testValidRecipient() {
  console.log('👥 Testing Transfer to Valid Recipient...');
  
  try {
    const baseURL = 'http://localhost:5000';
    const senderAddress = '0x5CD1f65706607c9C2C9150b7e0649Ab474BA982F';
    // Using a valid checksummed address (Arbitrum testnet)
    const recipientAddress = '0x742d35CC6634C0532925A3B8d7389C7AbB1f1c1e';
    
    const transferData = {
      recipientAddress: recipientAddress,
      amount: 0.5, // Small amount to test transfer (0.5 + 0.1 fee = 0.6 total, we have 1.0)
      note: 'Test transfer with valid address'
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
  testValidRecipient()
    .then(() => {
      console.log('\n✅ Valid recipient test completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Valid recipient test failed:', error);
      process.exit(1);
    });
}

module.exports = { testValidRecipient };
