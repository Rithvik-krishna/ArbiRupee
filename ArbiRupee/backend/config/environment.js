// config/environment.js - Environment configuration for ArbiRupee
require('dotenv').config();

const config = {
  // Server Configuration
  server: {
    port: process.env.PORT || 5000,
    nodeEnv: process.env.NODE_ENV || 'development',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000'
  },

  // Database Configuration
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/arbirupee',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  },

  // Blockchain Configuration
  blockchain: {
    network: process.env.NETWORK || 'mainnet',
    arbitrumRpcUrl: process.env.ARBITRUM_RPC_URL || 'https://arb1.arbitrum.io/rpc',
    arbitrumSepoliaRpcUrl: process.env.ARBITRUM_SEPOLIA_RPC_URL || 'https://sepolia-rollup.arbitrum.io/rpc',
    arbINRContractAddress: process.env.ARBINR_CONTRACT_ADDRESS || null,
    privateKey: process.env.PRIVATE_KEY
  },

  // Payment Gateway Configuration
  payment: {
    razorpay: {
      keyId: process.env.RAZORPAY_KEY_ID,
      keySecret: process.env.RAZORPAY_KEY_SECRET,
      webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET
    }
  },

  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secure-jwt-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },

  // Security Configuration
  security: {
    corsOrigins: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['http://localhost:3000'],
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
      max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
    }
  },

  // Transaction Limits
  limits: {
    minDepositAmount: parseInt(process.env.MIN_DEPOSIT_AMOUNT) || 100,
    maxDepositAmount: parseInt(process.env.MAX_DEPOSIT_AMOUNT) || 100000,
    minWithdrawalAmount: parseInt(process.env.MIN_WITHDRAWAL_AMOUNT) || 100,
    maxWithdrawalAmount: parseInt(process.env.MAX_WITHDRAWAL_AMOUNT) || 50000,
    minTransferAmount: parseInt(process.env.MIN_TRANSFER_AMOUNT) || 0.1,
    maxTransferAmount: parseInt(process.env.MAX_TRANSFER_AMOUNT) || 50000
  },

  // External APIs
  apis: {
    coingecko: {
      apiKey: process.env.COINGECKO_API_KEY
    },
    fixer: {
      apiKey: process.env.FIXER_API_KEY
    }
  },

  // Feature Flags
  features: {
    enableDeposits: process.env.ENABLE_DEPOSITS !== 'false',
    enableWithdrawals: process.env.ENABLE_WITHDRAWALS !== 'false',
    enableTransfers: process.env.ENABLE_TRANSFERS !== 'false',
    enableDefiIntegration: process.env.ENABLE_DEFI_INTEGRATION !== 'false',
    enableNotifications: process.env.ENABLE_NOTIFICATIONS !== 'false',
    enableAnalytics: process.env.ENABLE_ANALYTICS !== 'false'
  }
};

// Validation
const validateConfig = () => {
  const errors = [];

  // Required blockchain configuration
  if (!config.blockchain.arbINRContractAddress) {
    errors.push('ARBINR_CONTRACT_ADDRESS is required');
  }

  if (!config.blockchain.privateKey) {
    errors.push('PRIVATE_KEY is required');
  }

  // Required payment configuration
  if (!config.payment.razorpay.keyId) {
    errors.push('RAZORPAY_KEY_ID is required');
  }

  if (!config.payment.razorpay.keySecret) {
    errors.push('RAZORPAY_KEY_SECRET is required');
  }

  if (errors.length > 0) {
    console.error('❌ Configuration validation failed:');
    errors.forEach(error => console.error(`  - ${error}`));
    console.error('\nPlease check your environment variables.');
    process.exit(1);
  }
};

// Validate configuration on startup
if (config.server.nodeEnv === 'production' || config.server.nodeEnv === 'development') {
  validateConfig();
}

module.exports = config;
