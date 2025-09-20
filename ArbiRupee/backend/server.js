// server.js - Main server file for ArbiRupee Backend
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

// Import configuration
const config = require('./config/environment');

// Import services
const { blockchainService } = require('./services/blockchainService');
const { paymentService } = require('./services/paymentService');
const { realtimeService } = require('./services/realtimeService');

// Import routes
const authRoutes = require('./routes/auth');
const transactionRoutes = require('./routes/transactions-real'); // Use real transactions
const withdrawRoutes = require('./routes/withdraw'); // Separate withdraw routes
const userRoutes = require('./routes/users');
const contractRoutes = require('./routes/contracts');

const app = express();
const PORT = config.server.port;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: config.security.corsOrigins,
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.security.rateLimit.windowMs,
  max: config.security.rateLimit.max,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
if (config.server.nodeEnv !== 'production') {
  app.use(morgan('dev'));
}

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(config.database.uri, config.database.options);
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    console.log('❌ Database connection is required for production');
    process.exit(1);
  }
};

// Initialize services
const initializeServices = async () => {
  try {
    console.log('🚀 Initializing ArbiRupee services...');
    
    // Connect to database
    await connectDB();
    
    // Initialize blockchain service
    await blockchainService.initialize();
    
    // Initialize payment service
    await paymentService.initialize();
    
    // Initialize real-time service
    await realtimeService.initialize();
    
    console.log('✅ All services initialized successfully');
  } catch (error) {
    console.error('❌ Service initialization failed:', error.message);
    process.exit(1);
  }
};

// Initialize services
initializeServices();

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'ArbiRupee Backend is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/withdraw', withdrawRoutes); // Separate withdraw routes
app.use('/api/users', userRoutes);
app.use('/api/contracts', contractRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  
  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Internal server error',
    ...(process.env.NODE_ENV !== 'production' && { stack: error.stack })
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  mongoose.connection.close(() => {
    console.log('MongoDB connection closed.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  mongoose.connection.close().then(() => {
    console.log('MongoDB connection closed.');
    process.exit(0);
  }).catch(() => {
    process.exit(0);
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 ArbiRupee Backend server running on port ${PORT}`);
  console.log(`📱 Environment: ${config.server.nodeEnv}`);
  console.log(`🌐 CORS enabled for: ${config.security.corsOrigins.join(', ')}`);
  console.log(`🔗 Blockchain Network: ${config.blockchain.network}`);
  console.log(`💳 Payment Gateway: ${config.payment.razorpay.keyId ? 'Configured' : 'Not configured'}`);
});

module.exports = app;
