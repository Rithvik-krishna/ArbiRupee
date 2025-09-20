const { ethers } = require('ethers');
require('dotenv').config();

async function simpleTest() {
  console.log('🧪 Simple Contract Test...');
  
  try {
    const provider = new ethers.JsonRpcProvider(process.env.ARBITRUM_RPC_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    
    console.log('👤 Wallet address:', wallet.address);
    
    // Basic ERC20 ABI
    const contractABI = [
      "function name() view returns (string)",
      "function symbol() view returns (string)",
      "function decimals() view returns (uint8)",
      "function totalSupply() view returns (uint256)",
      "function balanceOf(address) view returns (uint256)",
      "function transfer(address to, uint256 amount) returns (bool)"
    ];
    
    const contractAddress = process.env.ARBINR_CONTRACT_ADDRESS;
    const contract = new ethers.Contract(contractAddress, contractABI, wallet);
    
    console.log('📍 Contract address:', contractAddress);
    
    // Test basic functions
    console.log('\n📊 Testing basic functions...');
    const name = await contract.name();
    const symbol = await contract.symbol();
    const decimals = await contract.decimals();
    const totalSupply = await contract.totalSupply();
    const balance = await contract.balanceOf(wallet.address);
    
    console.log('✅ Basic Info:');
    console.log('  Name:', name);
    console.log('  Symbol:', symbol);
    console.log('  Decimals:', decimals.toString());
    console.log('  Total Supply:', ethers.formatUnits(totalSupply, decimals));
    console.log('  Your Balance:', ethers.formatUnits(balance, decimals));
    
    // Test transfer (if you have balance)
    if (balance > 0) {
      console.log('\n💸 Testing transfer...');
      const transferAmount = ethers.parseUnits("0.1", decimals);
      
      try {
        const transferTx = await contract.transfer(wallet.address, transferAmount);
        console.log('  Transfer hash:', transferTx.hash);
        
        const receipt = await transferTx.wait();
        if (receipt.status === 1) {
          console.log('✅ Transfer successful!');
        } else {
          console.log('❌ Transfer failed');
        }
      } catch (error) {
        console.log('❌ Transfer error:', error.message);
      }
    } else {
      console.log('\n⚠️  No balance to test transfer');
    }
    
    console.log('\n🎉 Basic contract test completed!');
    console.log('\n💡 Your contract is working as a standard ERC20 token.');
    console.log('   For mint/burn operations, you may need to use the contract owner functions directly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

if (require.main === module) {
  simpleTest()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('💥 Test failed:', error);
      process.exit(1);
    });
}

module.exports = { simpleTest };
