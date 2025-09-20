const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Verifying ArbINR contract...");

  const contractAddress = process.env.ARBINR_CONTRACT_ADDRESS;
  
  if (!contractAddress) {
    console.error("❌ ARBINR_CONTRACT_ADDRESS not found in environment variables");
    process.exit(1);
  }

  console.log("📍 Contract Address:", contractAddress);
  
  // Get the contract instance
  const ArbINR = await ethers.getContractFactory("ArbINR");
  const arbINR = ArbINR.attach(contractAddress);
  
  try {
    // Verify contract details
    const name = await arbINR.name();
    const symbol = await arbINR.symbol();
    const decimals = await arbINR.decimals();
    const totalSupply = await arbINR.totalSupply();
    const owner = await arbINR.owner();
    const paused = await arbINR.paused();
    
    console.log("✅ Contract verification successful!");
    console.log("📊 Contract Details:");
    console.log("  Name:", name);
    console.log("  Symbol:", symbol);
    console.log("  Decimals:", decimals.toString());
    console.log("  Total Supply:", ethers.formatUnits(totalSupply, decimals));
    console.log("  Owner:", owner);
    console.log("  Paused:", paused);
    
    // Test basic functionality
    console.log("\n🧪 Testing basic functionality...");
    
    // Check if deployer is authorized
    const deployer = (await ethers.getSigners())[0].address;
    const isAuthorizedMinter = await arbINR.authorizedMinters(deployer);
    const isAuthorizedBurner = await arbINR.authorizedBurners(deployer);
    
    console.log("  Deployer:", deployer);
    console.log("  Authorized Minter:", isAuthorizedMinter);
    console.log("  Authorized Burner:", isAuthorizedBurner);
    
    if (isAuthorizedMinter && isAuthorizedBurner) {
      console.log("✅ Deployer is properly authorized for minting and burning");
    } else {
      console.log("⚠️  Deployer authorization needs to be checked");
    }
    
  } catch (error) {
    console.error("❌ Contract verification failed:", error.message);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Verification failed:", error);
    process.exit(1);
  });
