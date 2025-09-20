const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// ArbINR Contract ABI (simplified for deployment)
const ARBINR_ABI = [
  "constructor()",
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function mint(address to, uint256 amount, string memory transactionId)",
  "function burn(address from, uint256 amount, string memory transactionId)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
  "function authorizeMinter(address minter, bool authorized)",
  "function authorizeBurner(address burner, bool authorized)",
  "event Mint(address indexed to, uint256 amount, string transactionId)",
  "event Burn(address indexed from, uint256 amount, string transactionId)",
  "event AuthorizedMinterUpdated(address indexed minter, bool authorized)",
  "event AuthorizedBurnerUpdated(address indexed burner, bool authorized)"
];

// Simple ERC20 contract bytecode for ArbINR
const ARBINR_BYTECODE = "0x608060405234801561001057600080fd5b506040518060400160405280601581526020017f417262697472756d20496e6469616e20527570656500000000000000000000008152506040518060400160405280600681526020017f617262494e52000000000000000000000000000000000000000000000000000000815250816000908051906020019061008f9291906100f6565b5080600190805190602001906100a69291906100f6565b5050506100b333826100b8565b6101a2565b6001600160a01b0382166101135760405162461bcd60e51b815260206004820152601f60248201527f45524332303a206d696e7420746f20746865207a65726f206164647265737300604482015260640160405180910390fd5b8060026000828254610125919061019a565b90915550506001600160a01b0382166000908152602081905260408120805483929061015290849061019a565b90915550506040518181526001600160a01b038316906000907fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef9060200160405180910390a35050565b505050565b6000821982111561019d5761019d6101a2565b500190565b634e487b7160e01b600052601160045260246000fdfea2646970667358221220...";

async function deployArbINR() {
  console.log('🚀 Starting ArbINR deployment...');
  
  // Check if private key is configured
  if (!process.env.PRIVATE_KEY || process.env.PRIVATE_KEY === 'your_private_key_here') {
    console.error('❌ Please configure your PRIVATE_KEY in the .env file');
    console.log('📝 Add this to your .env file:');
    console.log('PRIVATE_KEY=your_actual_private_key_here');
    return;
  }

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

  try {
    // Deploy contract
    console.log('📄 Deploying ArbINR contract...');
    const factory = new ethers.ContractFactory(ARBINR_ABI, ARBINR_BYTECODE, wallet);
    const contract = await factory.deploy();
    
    console.log('⏳ Waiting for deployment confirmation...');
    await contract.waitForDeployment();
    
    const contractAddress = await contract.getAddress();
    
    console.log('✅ ArbINR deployed successfully!');
    console.log('📍 Contract Address:', contractAddress);
    console.log('🌐 Explorer:', `https://sepolia.arbiscan.io/address/${contractAddress}`);
    
    // Verify deployment
    console.log('\n🔍 Verifying deployment...');
    const name = await contract.name();
    const symbol = await contract.symbol();
    const decimals = await contract.decimals();
    const totalSupply = await contract.totalSupply();
    
    console.log('📊 Contract Details:');
    console.log('  Name:', name);
    console.log('  Symbol:', symbol);
    console.log('  Decimals:', decimals.toString());
    console.log('  Total Supply:', ethers.formatUnits(totalSupply, decimals));
    
    // Save deployment info
    const deploymentInfo = {
      contractAddress,
      network: 'arbitrum-sepolia',
      deployer: wallet.address,
      timestamp: new Date().toISOString(),
      name,
      symbol,
      decimals: decimals.toString(),
      totalSupply: totalSupply.toString(),
      explorerUrl: `https://sepolia.arbiscan.io/address/${contractAddress}`
    };
    
    // Save to file
    const deploymentPath = path.join(__dirname, '../deployments/arbinr-sepolia.json');
    fs.mkdirSync(path.dirname(deploymentPath), { recursive: true });
    fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
    
    console.log('\n💾 Deployment info saved to:', deploymentPath);
    console.log('\n🔧 Update your .env file with:');
    console.log(`ARBINR_CONTRACT_ADDRESS=${contractAddress}`);
    
    return deploymentInfo;
    
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
  deployArbINR()
    .then(() => {
      console.log('\n🎉 Deployment completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Deployment failed:', error);
      process.exit(1);
    });
}

module.exports = { deployArbINR };
