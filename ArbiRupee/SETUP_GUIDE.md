# 🚀 ArbiRupee Complete Setup Guide

## ✅ Step 1: Dependencies Installed
```bash
✅ npm install razorpay axios node-cron - COMPLETED
```

## 📝 Step 2: Environment Configuration

### Create `.env` file in `ArbiRupee/backend/` directory:

```env
# ArbiRupee Backend Environment Configuration
# Development/Testing Configuration

# Server Configuration
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/arbirupee

# Blockchain Configuration (Testnet for now)
NETWORK=testnet
ARBITRUM_RPC_URL=https://sepolia-rollup.arbitrum.io/rpc
ARBITRUM_SEPOLIA_RPC_URL=https://sepolia-rollup.arbitrum.io/rpc
ARBINR_CONTRACT_ADDRESS=0x742d35Cc6634C0532925a3b8D7389c7abb1F1c1e
PRIVATE_KEY=your_private_key_here

# Payment Gateway Configuration (Test keys)
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

### 🔧 Required Configuration Values:

#### **1. Blockchain Configuration:**
- **ARBINR_CONTRACT_ADDRESS**: Your deployed ArbINR contract address
- **PRIVATE_KEY**: Your wallet private key (for contract operations)
- **NETWORK**: `testnet` for testing, `mainnet` for production

#### **2. Payment Gateway (Razorpay):**
- **RAZORPAY_KEY_ID**: Your Razorpay test/live key ID
- **RAZORPAY_KEY_SECRET**: Your Razorpay test/live secret
- **RAZORPAY_WEBHOOK_SECRET**: Your webhook secret

#### **3. Database:**
- **MONGODB_URI**: MongoDB connection string

---

## 🏗️ Step 3: Deploy Smart Contract

### Option A: Deploy to Arbitrum Sepolia (Testnet)
```bash
cd ArbiRupee/contracts
npx hardhat compile
npx hardhat run scripts/deploy.js --network arbitrum-sepolia
```

### Option B: Deploy to Arbitrum Mainnet
```bash
cd ArbiRupee/contracts
npx hardhat run scripts/deploy.js --network arbitrum-mainnet
```

### Update Contract Address:
After deployment, update `ARBINR_CONTRACT_ADDRESS` in your `.env` file with the deployed contract address.

---

## 🚀 Step 4: Start Services

### Terminal 1 - Backend:
```bash
cd ArbiRupee/backend
npm run dev
```

### Terminal 2 - Frontend:
```bash
cd ArbiRupee
npm run dev
```

---

## 🧪 Step 5: Test Integration

### Test Backend Health:
```bash
curl http://localhost:5000/health
```

### Test Blockchain Connection:
```bash
curl http://localhost:5000/api/contracts/info
```

### Test Balance Query:
```bash
curl http://localhost:5000/api/contracts/balance/0xYourWalletAddress
```

---

## 🔑 Getting API Keys

### Razorpay Setup:
1. Go to [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Create account or login
3. Go to Settings > API Keys
4. Generate test keys
5. Copy Key ID and Secret to `.env` file

### MongoDB Setup:
1. Install MongoDB locally or use MongoDB Atlas
2. Create database named `arbirupee`
3. Update `MONGODB_URI` in `.env` file

### Blockchain Setup:
1. Get Arbitrum RPC URL from [Alchemy](https://www.alchemy.com/) or [Infura](https://infura.io/)
2. Deploy your ArbINR contract
3. Update contract address in `.env` file

---

## ⚠️ Important Notes

### For Testing:
- Use **testnet** configuration
- Use **test** Razorpay keys
- Use **test** wallet addresses

### For Production:
- Use **mainnet** configuration
- Use **live** Razorpay keys
- Use **production** database
- Enable **HTTPS**
- Set up **monitoring**

---

## 🎯 Expected Results

After setup, your dashboard should show:
- ✅ **Real Balance**: `0.00 arbINR` (if no tokens)
- ✅ **Real USD Value**: `$0.00 USD`
- ✅ **Real Transactions**: Empty list
- ✅ **No Hardcoded Data**: All data from real APIs

---

## 🆘 Troubleshooting

### Common Issues:
1. **"Contract not found"**: Check contract address
2. **"Invalid private key"**: Check private key format
3. **"Payment failed"**: Check Razorpay keys
4. **"Database connection failed"**: Check MongoDB URI

### Debug Commands:
```bash
# Check backend logs
cd ArbiRupee/backend && npm run dev

# Check frontend logs
cd ArbiRupee && npm run dev

# Test API endpoints
curl http://localhost:5000/health
```

---

## 📞 Next Steps

1. **Configure `.env`** with your real API keys
2. **Deploy contract** to Arbitrum
3. **Start services** and test
4. **Verify** no hardcoded data remains
5. **Test payment flow** end-to-end

Your ArbiRupee platform is now ready for real users and real transactions! 🚀
