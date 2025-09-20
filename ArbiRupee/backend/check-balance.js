const { ethers } = require('ethers');
require('dotenv').config();

async function checkBalance() {
  console.log('💰 Checking wallet balance...');
  
  try {
    const provider = new ethers.JsonRpcProvider(process.env.ARBITRUM_RPC_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    
    console.log('👤 Wallet address:', wallet.address);
    
    // Check ETH balance
    const ethBalance = await provider.getBalance(wallet.address);
    const ethBalanceFormatted = ethers.formatEther(ethBalance);
    
    console.log('💎 ETH Balance:', ethBalanceFormatted, 'ETH');
    
    if (ethBalance < ethers.parseEther('0.001')) {
      console.log('❌ Insufficient ETH for gas fees!');
      console.log('💡 Get testnet ETH from:');
      console.log('   https://faucet.quicknode.com/arbitrum/sepolia');
      console.log('   https://sepoliafaucet.com/');
      console.log('   https://faucets.chain.link/arbitrum-sepolia');
    } else {
      console.log('✅ Sufficient ETH for transactions!');
    }
    
    // Check arbINR balance
    const contractABI = [
      "function balanceOf(address) view returns (uint256)",
      "function decimals() view returns (uint8)"
    ];
    
    const contract = new ethers.Contract(process.env.ARBINR_CONTRACT_ADDRESS, contractABI, provider);
    const arbINRBalance = await contract.balanceOf(wallet.address);
    const decimals = await contract.decimals();
    const arbINRBalanceFormatted = ethers.formatUnits(arbINRBalance, decimals);
    
    console.log('🪙 arbINR Balance:', arbINRBalanceFormatted, 'arbINR');
    
  } catch (error) {
    console.error('❌ Error checking balance:', error.message);
  }
}

if (require.main === module) {
  checkBalance()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('💥 Error:', error);
      process.exit(1);
    });
}

module.exports = { checkBalance };
