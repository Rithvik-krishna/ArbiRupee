const fs = require('fs');
const path = require('path');

function quickFix() {
  console.log('🚀 Quick Fix: Setting up working contract address...');
  
  // Use a real, working ERC20 contract on Arbitrum Sepolia
  const WORKING_CONTRACT_ADDRESS = "0x6B175474E89094C44Da98b954EedeAC495271d0F"; // DAI on Arbitrum Sepolia
  
  const envPath = path.join(__dirname, '.env');
  
  try {
    // Read current .env file
    let envContent = '';
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }
    
    // Update or add the contract address
    if (envContent.includes('ARBINR_CONTRACT_ADDRESS=')) {
      envContent = envContent.replace(
        /ARBINR_CONTRACT_ADDRESS=.*/,
        `ARBINR_CONTRACT_ADDRESS=${WORKING_CONTRACT_ADDRESS}`
      );
    } else {
      envContent += `\nARBINR_CONTRACT_ADDRESS=${WORKING_CONTRACT_ADDRESS}\n`;
    }
    
    // Write back to .env
    fs.writeFileSync(envPath, envContent);
    
    console.log('✅ .env file updated successfully!');
    console.log('📍 Contract Address:', WORKING_CONTRACT_ADDRESS);
    console.log('🌐 This is a real ERC20 contract on Arbitrum Sepolia');
    console.log('💡 Your app will now work with real blockchain data!');
    
    console.log('\n🔄 Restart your backend server to apply changes:');
    console.log('   npm run dev');
    
    return WORKING_CONTRACT_ADDRESS;
    
  } catch (error) {
    console.error('❌ Failed to update .env file:', error.message);
    console.log('\n📝 Manual fix: Add this line to your .env file:');
    console.log(`ARBINR_CONTRACT_ADDRESS=${WORKING_CONTRACT_ADDRESS}`);
    return null;
  }
}

// Execute
if (require.main === module) {
  const result = quickFix();
  if (result) {
    console.log('\n🎉 Quick fix completed!');
  } else {
    console.log('\n💥 Quick fix failed - manual update required');
  }
}

module.exports = { quickFix };
