const { ethers } = require('ethers');
const config = require('./config/environment');

async function mintTestTokens() {
  try {
    console.log('🪙 Minting test tokens...');
    
    // Initialize provider and wallet
    const provider = new ethers.JsonRpcProvider(config.arbitrumRpcUrl);
    const wallet = new ethers.Wallet(config.privateKey, provider);
    
    console.log('👤 Wallet address:', wallet.address);
    
    // Check current balance
    const currentBalance = await provider.getBalance(wallet.address);
    console.log('💎 ETH Balance:', ethers.formatEther(currentBalance));
    
    // Check arbINR balance
    const arbINRContract = new ethers.Contract(
      config.arbINRContractAddress,
      [
        "function balanceOf(address account) external view returns (uint256)",
        "function mint(address to, uint256 amount, string memory transactionId) external"
      ],
      wallet
    );
    
    const currentArbINRBalance = await arbINRContract.balanceOf(wallet.address);
    console.log('🪙 Current arbINR Balance:', ethers.formatEther(currentArbINRBalance));
    
    // Mint 10 more arbINR tokens
    const mintAmount = ethers.parseEther('10');
    const transactionId = `test-mint-${Date.now()}`;
    
    console.log('📤 Minting 10 arbINR tokens...');
    const tx = await arbINRContract.mint(wallet.address, mintAmount, transactionId);
    console.log('⏳ Transaction hash:', tx.hash);
    
    console.log('⏳ Waiting for confirmation...');
    await tx.wait();
    
    // Check new balance
    const newBalance = await arbINRContract.balanceOf(wallet.address);
    console.log('✅ New arbINR Balance:', ethers.formatEther(newBalance));
    
  } catch (error) {
    console.error('❌ Error minting tokens:', error.message);
  }
}

mintTestTokens();
