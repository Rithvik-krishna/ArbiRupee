const { ethers } = require('ethers');
require('dotenv').config();

async function authorizeWallet() {
  console.log('🔐 Authorizing wallet for mint/burn operations...');
  
  try {
    // Set up provider and wallet
    const provider = new ethers.JsonRpcProvider(process.env.ARBITRUM_RPC_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    
    console.log('👤 Wallet address:', wallet.address);
    
    // Contract ABI for authorization
    const contractABI = [
      "function owner() view returns (address)",
      "function authorizeMinter(address minter, bool authorized)",
      "function authorizeBurner(address burner, bool authorized)",
      "function authorizedMinters(address) view returns (bool)",
      "function authorizedBurners(address) view returns (bool)"
    ];
    
    const contractAddress = process.env.ARBINR_CONTRACT_ADDRESS;
    const contract = new ethers.Contract(contractAddress, contractABI, wallet);
    
    console.log('📍 Contract address:', contractAddress);
    
    // Check if wallet is owner
    const owner = await contract.owner();
    console.log('👑 Contract owner:', owner);
    
    if (owner.toLowerCase() !== wallet.address.toLowerCase()) {
      console.log('❌ Only the contract owner can authorize minters/burners');
      return;
    }
    
    // Authorize wallet as minter
    console.log('\n🏭 Authorizing wallet as minter...');
    try {
      const authMinterTx = await contract.authorizeMinter(wallet.address, true);
      console.log('  Transaction hash:', authMinterTx.hash);
      
      const authMinterReceipt = await authMinterTx.wait();
      if (authMinterReceipt.status === 1) {
        console.log('✅ Wallet authorized as minter!');
      } else {
        console.log('❌ Failed to authorize as minter');
      }
    } catch (error) {
      console.log('⚠️  Minter authorization error:', error.message);
    }
    
    // Authorize wallet as burner
    console.log('\n🔥 Authorizing wallet as burner...');
    try {
      const authBurnerTx = await contract.authorizeBurner(wallet.address, true);
      console.log('  Transaction hash:', authBurnerTx.hash);
      
      const authBurnerReceipt = await authBurnerTx.wait();
      if (authBurnerReceipt.status === 1) {
        console.log('✅ Wallet authorized as burner!');
      } else {
        console.log('❌ Failed to authorize as burner');
      }
    } catch (error) {
      console.log('⚠️  Burner authorization error:', error.message);
    }
    
    // Verify authorization
    console.log('\n🔍 Verifying authorization...');
    try {
      const isMinter = await contract.authorizedMinters(wallet.address);
      const isBurner = await contract.authorizedBurners(wallet.address);
      
      console.log('✅ Authorization Status:');
      console.log('  Can Mint:', isMinter);
      console.log('  Can Burn:', isBurner);
      
      if (isMinter && isBurner) {
        console.log('\n🎉 Wallet is now authorized for mint/burn operations!');
        console.log('   You can now test mint/burn operations.');
      } else {
        console.log('\n⚠️  Authorization incomplete. Some functions may not work.');
      }
    } catch (error) {
      console.log('⚠️  Could not verify authorization:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Authorization failed:', error.message);
  }
}

// Run the authorization
if (require.main === module) {
  authorizeWallet()
    .then(() => {
      console.log('\n✅ Authorization process completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Authorization failed:', error);
      process.exit(1);
    });
}

module.exports = { authorizeWallet };
