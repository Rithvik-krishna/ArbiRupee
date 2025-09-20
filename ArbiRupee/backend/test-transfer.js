const { ethers } = require('ethers');
require('dotenv').config();

async function testTransfer() {
  console.log('💸 Testing arbINR Transfer...');
  
  try {
    const provider = new ethers.JsonRpcProvider(process.env.ARBITRUM_RPC_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    
    console.log('👤 Wallet address:', wallet.address);
    
    // Contract ABI
    const contractABI = [
      "function balanceOf(address) view returns (uint256)",
      "function decimals() view returns (uint8)",
      "function transfer(address to, uint256 amount) returns (bool)"
    ];
    
    const contractAddress = process.env.ARBINR_CONTRACT_ADDRESS;
    const contract = new ethers.Contract(contractAddress, contractABI, wallet);
    
    console.log('📍 Contract address:', contractAddress);
    
    // Check balances
    const decimals = await contract.decimals();
    const balance = await contract.balanceOf(wallet.address);
    const balanceFormatted = ethers.formatUnits(balance, decimals);
    
    console.log('💰 Current balance:', balanceFormatted, 'arbINR');
    
    if (balance === 0n) {
      console.log('❌ No arbINR to transfer!');
      return;
    }
    
    // Test transfer to self (small amount)
    const transferAmount = ethers.parseUnits("0.1", decimals);
    console.log('💸 Transferring 0.1 arbINR to self...');
    
    // Get gas price
    const feeData = await provider.getFeeData();
    console.log('⛽ Gas price:', ethers.formatUnits(feeData.gasPrice, 'gwei'), 'gwei');
    
    // Estimate gas
    try {
      const gasEstimate = await contract.transfer.estimateGas(wallet.address, transferAmount);
      console.log('⛽ Estimated gas:', gasEstimate.toString());
      
      // Calculate total cost
      const totalCost = gasEstimate * feeData.gasPrice;
      console.log('💰 Total gas cost:', ethers.formatEther(totalCost), 'ETH');
      
      // Check if we have enough ETH
      const ethBalance = await provider.getBalance(wallet.address);
      if (ethBalance < totalCost) {
        console.log('❌ Insufficient ETH for gas!');
        console.log('   Need:', ethers.formatEther(totalCost), 'ETH');
        console.log('   Have:', ethers.formatEther(ethBalance), 'ETH');
        return;
      }
      
      // Execute transfer
      console.log('🚀 Executing transfer...');
      const tx = await contract.transfer(wallet.address, transferAmount, {
        gasLimit: gasEstimate * 120n / 100n, // Add 20% buffer
        gasPrice: feeData.gasPrice
      });
      
      console.log('📝 Transaction hash:', tx.hash);
      console.log('⏳ Waiting for confirmation...');
      
      const receipt = await tx.wait();
      
      if (receipt.status === 1) {
        console.log('✅ Transfer successful!');
        console.log('   Block number:', receipt.blockNumber);
        console.log('   Gas used:', receipt.gasUsed.toString());
        
        // Check new balance
        const newBalance = await contract.balanceOf(wallet.address);
        const newBalanceFormatted = ethers.formatUnits(newBalance, decimals);
        console.log('💰 New balance:', newBalanceFormatted, 'arbINR');
      } else {
        console.log('❌ Transfer failed!');
      }
      
    } catch (error) {
      console.log('❌ Gas estimation failed:', error.message);
      
      // Try with fixed gas limit
      console.log('🔄 Trying with fixed gas limit...');
      try {
        const tx = await contract.transfer(wallet.address, transferAmount, {
          gasLimit: 100000n, // Fixed gas limit
          gasPrice: feeData.gasPrice
        });
        
        console.log('📝 Transaction hash:', tx.hash);
        const receipt = await tx.wait();
        
        if (receipt.status === 1) {
          console.log('✅ Transfer successful with fixed gas!');
        } else {
          console.log('❌ Transfer failed with fixed gas!');
        }
      } catch (error2) {
        console.log('❌ Fixed gas transfer also failed:', error2.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

if (require.main === module) {
  testTransfer()
    .then(() => {
      console.log('\n✅ Transfer test completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Transfer test failed:', error);
      process.exit(1);
    });
}

module.exports = { testTransfer };
