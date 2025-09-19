// routes/contracts.js - Smart contract interaction routes
const express = require('express');
const { blockchainService } = require('../services/blockchainService');
const { realtimeService } = require('../services/realtimeService');
const { authenticateWallet } = require('../middleware/auth');
const { validateAmount, validateWalletAddress } = require('../middleware/validation');
const router = express.Router();

// GET /api/contracts/info - Get contract information
router.get('/info', async (req, res) => {
  try {
    const contractInfo = await blockchainService.getContractInfo();
    
    res.json({
      success: true,
      data: contractInfo
    });
  } catch (error) {
    console.error('Get contract info error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch contract information',
      error: error.message
    });
  }
});

// GET /api/contracts/balance/:address - Get token balance for address
router.get('/balance/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    if (!blockchainService.isValidAddress(address)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid wallet address'
      });
    }
    
    const balance = await blockchainService.getTokenBalance(address);
    const exchangeRates = realtimeService.getExchangeRates();
    const usdValue = realtimeService.inrToUsd(balance);
    
    res.json({
      success: true,
      data: {
        address,
        balance: balance,
        balanceFormatted: balance.toLocaleString(),
        usdValue: usdValue,
        inrValue: balance.toFixed(2)
      }
    });
  } catch (error) {
    console.error('Get balance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch balance',
      error: error.message
    });
  }
});

// POST /api/contracts/validate-address - Validate wallet address
router.post('/validate-address', async (req, res) => {
  try {
    const { address } = req.body;
    
    if (!address) {
      return res.status(400).json({
        success: false,
        message: 'Address is required'
      });
    }
    
    const isValid = blockchainService.isValidAddress(address);
    
    let additionalInfo = {};
    if (isValid) {
      try {
        const balance = await blockchainService.getTokenBalance(address);
        additionalInfo = {
          hasBalance: balance > 0,
          balance: balance
        };
      } catch (error) {
        // Address is valid but balance check failed
        additionalInfo = {
          hasBalance: false,
          balance: 0
        };
      }
    }
    
    res.json({
      success: true,
      data: {
        address,
        isValid,
        ...additionalInfo
      }
    });
  } catch (error) {
    console.error('Validate address error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate address',
      error: error.message
    });
  }
});

// GET /api/contracts/transaction/:txHash - Get transaction details
router.get('/transaction/:txHash', async (req, res) => {
  try {
    const { txHash } = req.params;
    
    const transactionDetails = await blockchainService.getTransactionDetails(txHash);
    
    res.json({
      success: true,
      data: transactionDetails
    });
  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transaction details',
      error: error.message
    });
  }
});

// GET /api/contracts/stats - Get contract statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = realtimeService.getContractStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get contract stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch contract statistics',
      error: error.message
    });
  }
});

// POST /api/contracts/estimate-gas - Estimate gas for transaction
router.post('/estimate-gas', authenticateWallet, async (req, res) => {
  try {
    const { operation, amount, toAddress } = req.body;
    
    const gasEstimate = await blockchainService.estimateGas(operation, {
      to: toAddress,
      amount: amount,
      from: req.user.walletAddress
    });
    
    const exchangeRates = realtimeService.getExchangeRates();
    const estimatedCostUSD = realtimeService.inrToUsd(gasEstimate.estimatedCost);
    
    res.json({
      success: true,
      data: {
        operation,
        estimatedGas: gasEstimate.gasEstimate,
        gasPrice: gasEstimate.gasPrice,
        estimatedCost: gasEstimate.estimatedCost,
        estimatedCostUSD: estimatedCostUSD
      }
    });
  } catch (error) {
    console.error('Estimate gas error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to estimate gas',
      error: error.message
    });
  }
});

// GET /api/contracts/events - Get recent contract events
router.get('/events', async (req, res) => {
  try {
    const { limit = 50, offset = 0, eventType } = req.query;
    
    const events = await blockchainService.getRecentEvents(eventType || 'Transfer');
    
    const paginatedEvents = events.slice(offset, offset + parseInt(limit));
    
    res.json({
      success: true,
      data: {
        events: paginatedEvents,
        pagination: {
          total: events.length,
          limit: parseInt(limit),
          offset: parseInt(offset)
        }
      }
    });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch contract events',
      error: error.message
    });
  }
});

module.exports = router;
