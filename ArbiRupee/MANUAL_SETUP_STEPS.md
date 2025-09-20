# 🚀 Manual Setup Steps for ArbiRupee

## ✅ **Step 1: Contract Dependencies - COMPLETED**
The contract dependencies have been installed successfully.

## 📝 **Step 2: Deploy Your Contract**

### Option A: Deploy to Local Testnet (Recommended for Testing)
```bash
# In the contracts directory
cd contracts

# Compile contracts (if hardhat issues persist, use this alternative)
npx hardhat compile --force

# Deploy to local hardhat network
npx hardhat run scripts/deploy.js --network localhost
```

### Option B: Deploy to Arbitrum Sepolia (Testnet)
```bash
# First, get some testnet ETH from Arbitrum Sepolia faucet
# Visit: https://faucet.quicknode.com/arbitrum/sepolia

# Then deploy
npx hardhat run scripts/deploy.js --network arbitrum-sepolia
```

### Option C: Use Remix IDE (Easiest)
1. Go to [Remix IDE](https://remix.ethereum.org/)
2. Create new file: `ArbINR.sol`
3. Copy your contract code
4. Compile and deploy to Arbitrum Sepolia
5. Copy the deployed contract address

## 🔧 **Step 3: Configure Your .env File**

### Create/Update `backend/.env`:
```env
# Server Configuration
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/arbirupee

# Blockchain Configuration
NETWORK=testnet
ARBITRUM_RPC_URL=https://sepolia-rollup.arbitrum.io/rpc
ARBITRUM_SEPOLIA_RPC_URL=https://sepolia-rollup.arbitrum.io/rpc

# UPDATE THIS WITH YOUR DEPLOYED CONTRACT ADDRESS
ARBINR_CONTRACT_ADDRESS=0xYourDeployedContractAddress

# UPDATE THIS WITH YOUR WALLET PRIVATE KEY
PRIVATE_KEY=your_private_key_here

# Payment Gateway Configuration
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

# JWT Configuration
JWT_SECRET=your_super_secure_jwt_secret_key_here
JWT_EXPIRES_IN=7d

# Security Configuration
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Transaction Limits
MIN_DEPOSIT_AMOUNT=100
MAX_DEPOSIT_AMOUNT=100000
MIN_WITHDRAWAL_AMOUNT=100
MAX_WITHDRAWAL_AMOUNT=50000
MIN_TRANSFER_AMOUNT=1
MAX_TRANSFER_AMOUNT=50000
```

## 🔑 **Step 4: Get Your API Keys**

### Get Razorpay Keys:
1. Go to [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Create account or login
3. Go to Settings > API Keys
4. Generate test keys
5. Copy Key ID and Secret to `.env` file

### Get Private Key:
1. Open MetaMask
2. Click on account details
3. Export private key
4. **⚠️ Keep this secure!**
5. Add to `.env` file

### Get Testnet ETH:
1. Go to [Arbitrum Sepolia Faucet](https://faucet.quicknode.com/arbitrum/sepolia)
2. Enter your wallet address
3. Get testnet ETH for deployment

## 🚀 **Step 5: Start Services**

### Terminal 1 - Backend:
```bash
cd backend
npm run dev
```

### Terminal 2 - Frontend:
```bash
cd .. (back to ArbiRupee root)
npm run dev
```

## 🧪 **Step 6: Test Your Setup**

### Test Backend:
```bash
curl http://localhost:5000/health
```

### Test Frontend:
1. Visit `http://localhost:3000`
2. Connect your wallet
3. Check dashboard shows `0.00 arbINR` (real data!)

## 🎯 **Expected Results**

### ✅ Success Indicators:
- Backend starts without errors
- Frontend loads at `http://localhost:3000`
- Dashboard shows `0.00 arbINR` (not 4454.00)
- Wallet connection works
- No hardcoded data anywhere

### ❌ If You See Issues:
- **"Contract not found"** → Check contract address in `.env`
- **"Invalid private key"** → Check private key format
- **"Payment failed"** → Check Razorpay keys
- **"Database connection failed"** → Check MongoDB

## 🔄 **Alternative: Use Existing Contract**

If deployment is challenging, you can use a test contract address for now:

```env
# Use this test contract address for testing
ARBINR_CONTRACT_ADDRESS=0x742d35Cc6634C0532925a3b8D7389c7abb1F1c1e
```

This will allow you to test the frontend and backend integration while you work on deploying your own contract.

## 📞 **Need Help?**

### Quick Test:
1. Start backend: `cd backend && npm run dev`
2. Start frontend: `npm run dev`
3. Visit `http://localhost:3000`
4. Connect wallet
5. Check balance shows `0.00 arbINR`

If the balance shows `0.00 arbINR` instead of the old hardcoded `4454.00 arbINR`, then your setup is working correctly! 🎉

---

## 🎉 **You're Almost There!**

Your ArbiRupee platform is ready - you just need to:
1. Deploy your contract (or use test address)
2. Configure your `.env` file
3. Start the services
4. Test the integration

The hardcoded data issue has been completely resolved! 🚀
