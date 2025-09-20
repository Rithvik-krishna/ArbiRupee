// services/realtimeService.js - Real-time data service for ArbiRupee
const cron = require('node-cron');
const axios = require('axios');

class RealtimeService {
  constructor() {
    this.exchangeRates = {
      USD_INR: 83.0,
      lastUpdated: new Date()
    };
    
    this.contractStats = {
      totalSupply: '0',
      totalHolders: 0,
      totalTransactions: 0,
      marketCap: '0',
      volume24h: '0',
      lastUpdated: new Date()
    };

    this.initialized = false;
  }

  async initialize() {
    try {
      console.log('🔄 Initializing Real-time Service...');
      
      // Start background tasks
      this.startExchangeRateUpdates();
      this.startContractStatsUpdates();
      this.startTransactionMonitoring();
      
      this.initialized = true;
      console.log('✅ Real-time Service initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Real-time Service initialization failed:', error);
      return false;
    }
  }

  // Update exchange rates every 5 minutes
  startExchangeRateUpdates() {
    // Update immediately
    this.updateExchangeRates();
    
    // Schedule updates every 5 minutes
    cron.schedule('*/5 * * * *', () => {
      this.updateExchangeRates();
    });
  }

  async updateExchangeRates() {
    try {
      // Use a real exchange rate API (e.g., CoinGecko, Fixer.io, etc.)
      const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd,inr', {
        timeout: 10000
      });

      if (response.data && response.data.ethereum) {
        const ethData = response.data.ethereum;
        this.exchangeRates = {
          USD_INR: ethData.inr / ethData.usd,
          ETH_USD: ethData.usd,
          ETH_INR: ethData.inr,
          lastUpdated: new Date()
        };

        console.log(`💱 Exchange rates updated: 1 USD = ₹${this.exchangeRates.USD_INR.toFixed(2)}`);
      }
    } catch (error) {
      console.error('❌ Failed to update exchange rates:', error.message);
      // Fallback to default rates if API fails
      this.exchangeRates = {
        USD_INR: 83.0,
        ETH_USD: 2000.0,
        ETH_INR: 166000.0,
        lastUpdated: new Date()
      };
    }
  }

  // Update contract statistics every 10 minutes
  startContractStatsUpdates() {
    // Update immediately
    this.updateContractStats();
    
    // Schedule updates every 10 minutes
    cron.schedule('*/10 * * * *', () => {
      this.updateContractStats();
    });
  }

  async updateContractStats() {
    try {
      const { blockchainService } = require('./blockchainService');
      
      // Initialize blockchain service if not already initialized
      if (!blockchainService.initialized) {
        await blockchainService.initialize();
      }
      
      if (blockchainService.initialized && blockchainService.arbINRContract) {
        const contractInfo = await blockchainService.getContractInfo();
        
        // Get additional stats from blockchain
        const totalSupply = contractInfo.totalSupply || '0';
        const marketCap = (parseFloat(totalSupply) * this.exchangeRates.USD_INR).toFixed(2);
        
        this.contractStats = {
          totalSupply,
          totalHolders: await this.getTotalHolders(),
          totalTransactions: await this.getTotalTransactions(),
          marketCap,
          volume24h: await this.get24hVolume(),
          price: {
            usd: (1 / this.exchangeRates.USD_INR).toFixed(6),
            inr: 1.0
          },
          lastUpdated: new Date()
        };

        console.log(`📊 Contract stats updated: ${totalSupply} arbINR, $${marketCap} market cap`);
      } else {
        // Fallback when contract is not available
        this.contractStats = {
          totalSupply: '0',
          totalHolders: 0,
          totalTransactions: 0,
          marketCap: '0',
          volume24h: '0',
          price: {
            usd: (1 / this.exchangeRates.USD_INR).toFixed(6),
            inr: 1.0
          },
          lastUpdated: new Date()
        };
        console.log('📊 Contract stats updated: 0 arbINR, $0.00 market cap');
      }
    } catch (error) {
      console.error('❌ Failed to update contract stats:', error.message);
      
      // Fallback on error
      this.contractStats = {
        totalSupply: '0',
        totalHolders: 0,
        totalTransactions: 0,
        marketCap: '0',
        volume24h: '0',
        price: {
          usd: (1 / this.exchangeRates.USD_INR).toFixed(6),
          inr: 1.0
        },
        lastUpdated: new Date()
      };
    }
  }

  // Monitor transactions in real-time
  startTransactionMonitoring() {
    // Check for new transactions every 30 seconds
    cron.schedule('*/30 * * * * *', () => {
      this.monitorNewTransactions();
    });
  }

  async monitorNewTransactions() {
    try {
      const { blockchainService } = require('./blockchainService');
      
      if (blockchainService.initialized) {
        // Get recent Transfer events
        const events = await blockchainService.getRecentEvents('Transfer', 'latest', 'latest');
        
        if (events.length > 0) {
          console.log(`🔔 Found ${events.length} new transaction(s)`);
          
          // Process new transactions
          for (const event of events) {
            await this.processNewTransaction(event);
          }
        }
      }
    } catch (error) {
      console.error('❌ Failed to monitor transactions:', error.message);
    }
  }

  async processNewTransaction(event) {
    try {
      // Here you would:
      // 1. Check if this transaction is already processed
      // 2. Update user balances in database
      // 3. Send real-time notifications
      // 4. Update transaction statistics
      
      console.log(`📝 Processing transaction: ${event.transactionHash}`);
      
      // Example: Update transaction count
      this.contractStats.totalTransactions++;
      
    } catch (error) {
      console.error('❌ Failed to process transaction:', error.message);
    }
  }

  // Get current exchange rates
  getExchangeRates() {
    return {
      ...this.exchangeRates,
      isStale: (Date.now() - this.exchangeRates.lastUpdated.getTime()) > 300000 // 5 minutes
    };
  }

  // Get current contract statistics
  getContractStats() {
    return {
      ...this.contractStats,
      isStale: (Date.now() - this.contractStats.lastUpdated.getTime()) > 600000 // 10 minutes
    };
  }

  // Get total number of holders (mock implementation - replace with real data)
  async getTotalHolders() {
    try {
      // In a real implementation, you would query the blockchain
      // or maintain a database of unique addresses
      return Math.floor(Math.random() * 1000) + 10000; // Mock data
    } catch (error) {
      return 0;
    }
  }

  // Get total number of transactions (mock implementation - replace with real data)
  async getTotalTransactions() {
    try {
      // In a real implementation, you would query transaction history
      return Math.floor(Math.random() * 10000) + 150000; // Mock data
    } catch (error) {
      return 0;
    }
  }

  // Get 24h volume (mock implementation - replace with real data)
  async get24hVolume() {
    try {
      // In a real implementation, you would calculate from recent transactions
      return (Math.random() * 1000000 + 2000000).toFixed(2); // Mock data
    } catch (error) {
      return '0';
    }
  }

  // Convert INR to USD
  inrToUsd(inrAmount) {
    return (inrAmount / this.exchangeRates.USD_INR).toFixed(2);
  }

  // Convert USD to INR
  usdToInr(usdAmount) {
    return (usdAmount * this.exchangeRates.USD_INR).toFixed(2);
  }

  // Get real-time price data
  getPriceData() {
    return {
      arbINR: {
        inr: 1.0,
        usd: (1 / this.exchangeRates.USD_INR).toFixed(6)
      },
      lastUpdated: this.exchangeRates.lastUpdated
    };
  }

  // Get market data
  getMarketData() {
    const stats = this.getContractStats();
    const rates = this.getExchangeRates();
    
    return {
      marketCap: {
        inr: stats.marketCap,
        usd: this.inrToUsd(stats.marketCap)
      },
      volume24h: {
        inr: stats.volume24h,
        usd: this.inrToUsd(stats.volume24h)
      },
      totalSupply: stats.totalSupply,
      totalHolders: stats.totalHolders,
      totalTransactions: stats.totalTransactions,
      price: stats.price,
      lastUpdated: stats.lastUpdated
    };
  }

  // WebSocket support for real-time updates (if needed)
  setupWebSocket(io) {
    // Broadcast updates to connected clients
    setInterval(() => {
      const marketData = this.getMarketData();
      const priceData = this.getPriceData();
      
      io.emit('marketUpdate', marketData);
      io.emit('priceUpdate', priceData);
    }, 30000); // Every 30 seconds
  }
}

// Create singleton instance
const realtimeService = new RealtimeService();

module.exports = {
  realtimeService
};
