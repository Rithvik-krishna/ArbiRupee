const axios = require('axios');

async function testAPITransfer() {
  console.log('🌐 Testing Transfer API...');
  
  try {
    const baseURL = 'http://localhost:5000';
    const walletAddress = '0x5CD1f65706607c9C2C9150b7e0649Ab474BA982F';
    
    // Test data
    const transferData = {
      toAddress: walletAddress, // Transfer to self
      amount: 0.1,
      type: 'transfer'
    };
    
    console.log('📤 Sending transfer request...');
    console.log('   To:', transferData.toAddress);
    console.log('   Amount:', transferData.amount, 'arbINR');
    
    const response = await axios.post(`${baseURL}/api/transactions/transfer`, transferData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.JWT_TOKEN || 'test-token'}`
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
  testAPITransfer()
    .then(() => {
      console.log('\n✅ API test completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 API test failed:', error);
      process.exit(1);
    });
}

module.exports = { testAPITransfer };
