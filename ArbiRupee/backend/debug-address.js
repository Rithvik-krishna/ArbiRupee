const { ethers } = require('ethers');

function debugAddress() {
  console.log('🔍 Debugging Address Validation...');
  
  const addresses = [
    '0x5CD1f65706607c9C2C9150b7e0649Ab474BA982F',
    '0x742d35Cc6634C0532925a3b8D7389c7abb1F1c1e',
    '0x01f5ad6db84a292148f61f9553c780cf7d86bea9'
  ];
  
  addresses.forEach((address, index) => {
    const isValid = ethers.isAddress(address);
    console.log(`Address ${index + 1}: ${address}`);
    console.log(`  Valid: ${isValid}`);
    console.log(`  Checksum: ${ethers.getAddress(address)}`);
    console.log('');
  });
  
  // Test the specific validation
  const recipientAddress = '0x742d35Cc6634C0532925a3b8D7389c7abb1F1c1e';
  console.log('Testing specific validation:');
  console.log('  Address:', recipientAddress);
  console.log('  ethers.isAddress():', ethers.isAddress(recipientAddress));
  
  if (!ethers.isAddress(recipientAddress)) {
    console.log('❌ Address validation failed!');
  } else {
    console.log('✅ Address validation passed!');
  }
}

if (require.main === module) {
  debugAddress();
}

module.exports = { debugAddress };
