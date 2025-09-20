#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 ArbiRupee Setup Script');
console.log('========================\n');

// Check if we're in the right directory
if (!fs.existsSync('package.json')) {
  console.error('❌ Please run this script from the ArbiRupee root directory');
  process.exit(1);
}

// Step 1: Install dependencies
console.log('📦 Step 1: Installing dependencies...');
try {
  console.log('  Installing backend dependencies...');
  execSync('cd backend && npm install', { stdio: 'inherit' });
  
  console.log('  Installing frontend dependencies...');
  execSync('npm install', { stdio: 'inherit' });
  
  console.log('  Installing contract dependencies...');
  execSync('cd contracts && npm install', { stdio: 'inherit' });
  
  console.log('✅ Dependencies installed successfully!\n');
} catch (error) {
  console.error('❌ Failed to install dependencies:', error.message);
  process.exit(1);
}

// Step 2: Check environment configuration
console.log('🔧 Step 2: Checking environment configuration...');
const envPath = path.join('backend', '.env');
const envExamplePath = path.join('backend', 'config', 'development.env');

if (!fs.existsSync(envPath)) {
  if (fs.existsSync(envExamplePath)) {
    console.log('  Creating .env file from template...');
    fs.copyFileSync(envExamplePath, envPath);
    console.log('✅ .env file created!');
  } else {
    console.log('⚠️  .env file not found. Please create it manually.');
  }
} else {
  console.log('✅ .env file exists');
}

// Step 3: Check MongoDB
console.log('\n🗄️  Step 3: Checking MongoDB...');
try {
  execSync('mongod --version', { stdio: 'pipe' });
  console.log('✅ MongoDB is installed');
} catch (error) {
  console.log('⚠️  MongoDB not found. Please install MongoDB or use MongoDB Atlas');
}

// Step 4: Check Node.js version
console.log('\n📋 Step 4: System requirements...');
const nodeVersion = process.version;
console.log(`  Node.js version: ${nodeVersion}`);

if (parseInt(nodeVersion.slice(1)) < 16) {
  console.log('⚠️  Node.js version 16+ recommended');
} else {
  console.log('✅ Node.js version is compatible');
}

// Step 5: Display next steps
console.log('\n🎯 Next Steps:');
console.log('==============');
console.log('1. Configure your .env file in backend/.env with:');
console.log('   - ARBINR_CONTRACT_ADDRESS (after deployment)');
console.log('   - PRIVATE_KEY (your wallet private key)');
console.log('   - RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET');
console.log('   - MONGODB_URI (if using external database)');
console.log('');
console.log('2. Deploy your smart contract:');
console.log('   cd contracts');
console.log('   npx hardhat run scripts/deploy.js --network arbitrum-sepolia');
console.log('');
console.log('3. Start the services:');
console.log('   # Terminal 1 - Backend');
console.log('   cd backend && npm run dev');
console.log('');
console.log('   # Terminal 2 - Frontend');
console.log('   npm run dev');
console.log('');
console.log('4. Test the integration:');
console.log('   - Visit http://localhost:3000');
console.log('   - Connect your wallet');
console.log('   - Check that balance shows 0.00 arbINR (real data!)');
console.log('');
console.log('📚 For detailed instructions, see SETUP_GUIDE.md');
console.log('');
console.log('🎉 Setup script completed! Your ArbiRupee platform is ready for configuration.');
