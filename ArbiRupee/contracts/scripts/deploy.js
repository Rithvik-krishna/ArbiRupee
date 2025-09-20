const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Starting ArbINR deployment...");

  // Get the contract factory
  const ArbINR = await ethers.getContractFactory("ArbINR");
  
  // Deploy the contract
  console.log("📄 Deploying ArbINR contract...");
  const arbINR = await ArbINR.deploy();
  
  // Wait for deployment to complete
  await arbINR.waitForDeployment();
  
  const contractAddress = await arbINR.getAddress();
  
  console.log("✅ ArbINR deployed successfully!");
  console.log("📍 Contract Address:", contractAddress);
  console.log("🌐 Network:", network.name);
  console.log("🔗 Explorer:", getExplorerUrl(network.name, contractAddress));
  
  // Verify deployment
  console.log("\n🔍 Verifying deployment...");
  const name = await arbINR.name();
  const symbol = await arbINR.symbol();
  const decimals = await arbINR.decimals();
  const totalSupply = await arbINR.totalSupply();
  
  console.log("📊 Contract Details:");
  console.log("  Name:", name);
  console.log("  Symbol:", symbol);
  console.log("  Decimals:", decimals.toString());
  console.log("  Total Supply:", ethers.formatUnits(totalSupply, decimals));
  
  // Save deployment info
  const deploymentInfo = {
    contractAddress,
    network: network.name,
    deployer: (await ethers.getSigners())[0].address,
    timestamp: new Date().toISOString(),
    name,
    symbol,
    decimals: decimals.toString(),
    totalSupply: totalSupply.toString()
  };
  
  console.log("\n💾 Deployment completed successfully!");
  console.log("🔧 Update your .env file with:");
  console.log(`ARBINR_CONTRACT_ADDRESS=${contractAddress}`);
  
  return deploymentInfo;
}

function getExplorerUrl(networkName, address) {
  const explorers = {
    'arbitrum-sepolia': `https://sepolia.arbiscan.io/address/${address}`,
    'arbitrum-one': `https://arbiscan.io/address/${address}`,
    'arbitrumSepolia': `https://sepolia.arbiscan.io/address/${address}`,
    'arbitrumOne': `https://arbiscan.io/address/${address}`,
  };
  
  return explorers[networkName] || `https://arbiscan.io/address/${address}`;
}

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
