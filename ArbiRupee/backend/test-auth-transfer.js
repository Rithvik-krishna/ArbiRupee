const axios = require('axios');

async function testAuthTransfer() {
  console.log('🔐 Testing Transfer with Authentication...');
  
  try {
    const baseURL = 'http://localhost:5000';
    const walletAddress = '0x5CD1f65706607c9C2C9150b7e0649Ab474BA982F';
    
    // First, try to get a token or check if we need to authenticate
    console.log('🔑 Checking authentication...');
    
    // Test with wallet address in headers
    const transferData = {
      toAddress: walletAddress,
      amount: 0.1,
      type: 'transfer'
    };
    
    console.log('📤 Sending transfer request with wallet address...');
    
    const response = await axios.post(`${baseURL}/api/transactions/transfer`, transferData, {
      headers: {
        'Content-Type': 'application/json',
        'x-wallet-address': walletAddress
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
      
      if (error.response.status === 401) {
        console.log('\n💡 Authentication Issue:');
        console.log('   The API requires proper authentication.');
        console.log('   Make sure your frontend is:');
        console.log('   1. Connected to MetaMask');
        console.log('   2. Sending wallet address in headers');
        console.log('   3. Including proper JWT token if required');
      }
    } else {
      console.log('   Message:', error.message);
    }
  }
}

if (require.main === module) {
  testAuthTransfer()
    .then(() => {
      console.log('\n✅ Auth test completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Auth test failed:', error);
      process.exit(1);
    });
}

module.exports = { testAuthTransfer };
