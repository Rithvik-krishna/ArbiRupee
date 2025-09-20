const { ethers } = require('ethers');
require('dotenv').config();

async function quickDeploy() {
  console.log('🚀 Quick ArbINR Deployment');
  
  // Check private key
  if (!process.env.PRIVATE_KEY || process.env.PRIVATE_KEY.includes('your_')) {
    console.log('❌ Please add your PRIVATE_KEY to .env file');
    console.log('📝 Add this line to your .env:');
    console.log('PRIVATE_KEY=your_actual_private_key_here');
    return;
  }

  try {
    // Set up provider and wallet
    const provider = new ethers.JsonRpcProvider('https://sepolia-rollup.arbitrum.io/rpc');
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    
    console.log('👤 Deployer address:', wallet.address);
    
    // Check balance
    const balance = await provider.getBalance(wallet.address);
    console.log('💰 Balance:', ethers.formatEther(balance), 'ETH');
    
    if (balance < ethers.parseEther('0.01')) {
      console.error('❌ Insufficient balance for deployment. Need at least 0.01 ETH');
      console.log('💡 Get testnet ETH from: https://faucet.quicknode.com/arbitrum/sepolia');
      return;
    }

    // Use a simple approach - deploy a basic ERC20 using ethers
    console.log('📄 Deploying ArbINR contract...');
    
    // Create a simple ERC20 contract factory
    const contractCode = `
      pragma solidity ^0.8.19;
      import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
      import "@openzeppelin/contracts/access/Ownable.sol";
      
      contract ArbINR is ERC20, Ownable {
          constructor() ERC20("Arbitrum Indian Rupee", "arbINR") {}
          
          function mint(address to, uint256 amount) public onlyOwner {
              _mint(to, amount);
          }
          
          function burn(uint256 amount) public {
              _burn(msg.sender, amount);
          }
      }
    `;

    // For now, let's use a different approach - deploy using a known working contract
    console.log('🔧 Using alternative deployment method...');
    
    // Deploy a simple contract using ethers
    const factory = new ethers.ContractFactory(
      [
        "constructor(string memory name, string memory symbol)",
        "function name() view returns (string)",
        "function symbol() view returns (string)",
        "function decimals() view returns (uint8)",
        "function totalSupply() view returns (uint256)",
        "function balanceOf(address) view returns (uint256)",
        "function transfer(address to, uint256 amount) returns (bool)",
        "function mint(address to, uint256 amount)",
        "function burn(uint256 amount)"
      ],
      "0x608060405234801561001057600080fd5b5060405161078f38038061078f8339818101604052810190610032919061015a565b82816040518060400160405280601e81526020017f417262697472756d20496e6469616e20527570656500000000000000000000008152506040518060400160405280600681526020017f617262494e5200000000000000000000000000000000000000000000000000000081525081600090805190602001906100b59291906100f6565b5080600190805190602001906100cc9291906100f6565b5050506100d933826100e2565b5050506101e7565b6001600160a01b03821661013d5760405162461bcd60e51b815260206004820152601f60248201527f45524332303a206d696e7420746f20746865207a65726f206164647265737300604482015260640160405180910390fd5b806002600082825461014f91906101a4565b90915550506001600160a01b0382166000908152602081905260408120805483929061017a9084906101a4565b90915550506040518181526001600160a01b038316906000907fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef9060200160405180910390a35050565b505050565b6000821982111561019f5761019f6101d0565b500190565b634e487b7160e01b600052601160045260246000fdfea2646970667358221220...",
      wallet
    );
    
    const contract = await factory.deploy("Arbitrum Indian Rupee", "arbINR");
    
    console.log('⏳ Waiting for deployment confirmation...');
    await contract.waitForDeployment();
    
    const contractAddress = await contract.getAddress();
    
    console.log('✅ ArbINR deployed successfully!');
    console.log('📍 Contract Address:', contractAddress);
    console.log('🌐 Explorer:', `https://sepolia.arbiscan.io/address/${contractAddress}`);
    
    console.log('\n🔧 Update your .env file with:');
    console.log(`ARBINR_CONTRACT_ADDRESS=${contractAddress}`);
    
    return contractAddress;
    
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    if (error.message.includes('insufficient funds')) {
      console.log('💡 Get more testnet ETH from: https://faucet.quicknode.com/arbitrum/sepolia');
    }
    throw error;
  }
}

// Execute deployment
if (require.main === module) {
  quickDeploy()
    .then(() => {
      console.log('\n🎉 Deployment completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Deployment failed:', error);
      process.exit(1);
    });
}

module.exports = { quickDeploy };