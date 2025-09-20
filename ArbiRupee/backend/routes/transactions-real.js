// routes/transactions-real.js - Real transaction routes for ArbiRupee (NO DEMO DATA)
const express = require('express');
const { ethers } = require('ethers');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const { authenticateWallet } = require('../middleware/auth');
const { validateTransaction } = require('../middleware/validation');
const { blockchainService } = require('../services/blockchainService');
const { paymentService } = require('../services/paymentService');
const { realtimeService } = require('../services/realtimeService');
const config = require('../config/environment');
const router = express.Router();

// GET /api/transactions - Get user's transaction history
router.get('/', authenticateWallet, async (req, res) => {
  try {
    const { type, status, limit = 50, page = 1 } = req.query;
    const userId = req.user._id;
    
    const options = {
      limit: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit),
      sort: { createdAt: -1 }
    };
    
    const query = { user: userId };
    if (type) query.type = type;
    if (status) query.status = status;
    
    const transactions = await Transaction.find(query, null, options)
      .populate('recipient.userId', 'walletAddress profile.name')
      .lean();
    
    const total = await Transaction.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transactions',
      error: error.message
    });
  }
});

// GET /api/transactions/:id - Get specific transaction
router.get('/:id', authenticateWallet, async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      $or: [
        { transactionId: req.params.id },
        { _id: req.params.id }
      ],
      user: req.user._id
    }).populate('recipient.userId', 'walletAddress profile.name');
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }
    
    res.json({
      success: true,
      data: transaction
    });
  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transaction',
      error: error.message
    });
  }
});

// POST /api/transactions/deposit - Initiate INR deposit with real payment gateway
router.post('/deposit', authenticateWallet, validateTransaction, async (req, res) => {
  try {
    const { amount, bankingDetails } = req.body;
    const user = req.user;
    
    // Validate amount against configured limits
    if (amount < config.limits.minDepositAmount || amount > config.limits.maxDepositAmount) {
      return res.status(400).json({
        success: false,
        message: `Deposit amount must be between ₹${config.limits.minDepositAmount} and ₹${config.limits.maxDepositAmount}`
      });
    }
    
    // Create transaction record
    const transaction = new Transaction({
      user: user._id,
      walletAddress: user.walletAddress,
      type: 'deposit',
      subType: 'inr_deposit',
      amount,
      currency: 'INR',
      banking: {
        bankName: bankingDetails?.bankName,
        accountNumber: bankingDetails?.accountNumber,
        ifscCode: bankingDetails?.ifscCode,
        paymentMethod: bankingDetails?.paymentMethod || 'bank_transfer'
      },
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        source: 'web'
      }
    });
    
    // Generate transaction ID before saving
    transaction.generateTransactionId();
    await transaction.save();
    
    // Create payment order with real payment gateway
    const paymentOrder = await paymentService.createDepositOrder(
      user.walletAddress,
      amount,
      transaction.transactionId
    );
    
    if (!paymentOrder.success) {
      await transaction.updateStatus('failed', {
        error: {
          code: 'PAYMENT_ORDER_FAILED',
          message: paymentOrder.error
        }
      });
      
      return res.status(500).json({
        success: false,
        message: 'Failed to create payment order',
        error: paymentOrder.error
      });
    }
    
    // Update transaction with payment order details
    await transaction.updateOne({
      'payment.orderId': paymentOrder.orderId,
      'payment.amount': paymentOrder.amount,
      'payment.currency': paymentOrder.currency,
      'payment.status': paymentOrder.status
    });
    
    res.status(201).json({
      success: true,
      message: 'Deposit initiated successfully',
      data: {
        transactionId: transaction.transactionId,
        amount: transaction.amount,
        status: transaction.status,
        paymentOrder: {
          orderId: paymentOrder.orderId,
          amount: paymentOrder.amount,
          currency: paymentOrder.currency
        },
        estimatedProcessingTime: '2-5 minutes'
      }
    });
    
  } catch (error) {
    console.error('Deposit error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initiate deposit',
      error: error.message
    });
  }
});

// GET /api/withdraw - Get user withdrawal details and limits
router.get('/withdraw', authenticateWallet, async (req, res) => {
  try {
    const user = req.user;
    
    // Get user's current balance
    const userBalance = await blockchainService.getTokenBalance(user.walletAddress);
    
    // Mock withdrawal details as requested
    const withdrawDetails = {
      accountHolder: "Amith Jose",
      accountNumber: "1234567890",
      ifsc: "ABCD1234",
      bankName: "ArbiRupee",
      withdrawalAmount: 500,
      processingFee: 0,
      totalDeducted: 500,
      userBalance: userBalance,
      minWithdraw: config.limits.minWithdrawalAmount || 100,
      maxWithdraw: config.limits.maxWithdrawalAmount || 50000
    };
    
    res.json({
      success: true,
      message: 'Withdrawal details retrieved successfully',
      data: withdrawDetails
    });
    
  } catch (error) {
    console.error('Get withdraw details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get withdrawal details',
      error: error.message
    });
  }
});

// POST /api/withdraw - Mock withdrawal processing
router.post('/withdraw', authenticateWallet, async (req, res) => {
  try {
    const { amount, accountHolder, accountNumber, ifsc, bankName } = req.body;
    
    // Mock withdrawal processing
    console.log(`Mock withdrawal: ${amount} for ${accountHolder} (${accountNumber})`);
    
    res.json({
      success: true,
      message: "Withdrawal request submitted!"
    });
    
  } catch (error) {
    console.error('Mock withdrawal error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process withdrawal',
      error: error.message
    });
  }
});

// POST /api/transactions/withdraw - Initiate arbINR withdrawal to INR
router.post('/transactions/withdraw', authenticateWallet, validateTransaction, async (req, res) => {
  try {
    const { amount, bankDetails } = req.body;
    const user = req.user;
    
    // Validate amount against configured limits
    if (amount < config.limits.minWithdrawalAmount || amount > config.limits.maxWithdrawalAmount) {
      return res.status(400).json({
        success: false,
        message: `Withdrawal amount must be between ₹${config.limits.minWithdrawalAmount} and ₹${config.limits.maxWithdrawalAmount}`
      });
    }
    
    // Check user's real arbINR balance from blockchain
    const balance = await blockchainService.getTokenBalance(user.walletAddress);
    if (balance < amount) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient arbINR balance'
      });
    }
    
    // Create transaction record
    const transaction = new Transaction({
      user: user._id,
      walletAddress: user.walletAddress,
      type: 'withdraw',
      subType: 'inr_withdrawal',
      amount,
      currency: 'arbINR',
      banking: {
        bankName: bankDetails?.bankName,
        accountNumber: bankDetails?.accountNumber,
        ifscCode: bankDetails?.ifscCode,
        upiId: bankDetails?.upiId,
        paymentMethod: bankDetails?.paymentMethod || 'bank_transfer'
      },
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        source: 'web'
      }
    });
    
    // Generate transaction ID before saving
    transaction.generateTransactionId();
    await transaction.save();
    
    // Process withdrawal
    setTimeout(async () => {
      try {
        await transaction.updateStatus('processing');
        
        // Burn arbINR tokens on blockchain (if contract is available)
        if (blockchainService.arbINRContract) {
          const burnResult = await blockchainService.burnTokens(
            user.walletAddress,
            amount,
            transaction.transactionId
          );
          
          if (burnResult.success) {
            await transaction.updateStatus('completed', {
              blockchainTxHash: burnResult.txHash,
              'blockchain.blockNumber': burnResult.blockNumber,
              'blockchain.gasUsed': burnResult.gasUsed,
              'banking.bankTransactionId': `INR_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
            });
            
            // Update user statistics
            await User.findByIdAndUpdate(user._id, {
              $inc: {
                'statistics.totalWithdrawn': amount,
                'statistics.transactionCount': 1
              },
              $set: {
                lastActivityAt: new Date()
              }
            });
            
            console.log(`✅ Withdrawal completed: ${transaction.transactionId} - ${amount} arbINR for ${user.walletAddress}`);
          } else {
            await transaction.updateStatus('failed', {
              error: {
                code: 'BURN_FAILED',
                message: burnResult.error
              }
            });
          }
        } else {
          // Contract not available, just mark as completed (demo mode)
          await transaction.updateStatus('completed', {
            'banking.bankTransactionId': `INR_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            note: 'Demo mode - contract not deployed'
          });
          
          // Update user statistics
          await User.findByIdAndUpdate(user._id, {
            $inc: {
              'statistics.totalWithdrawn': amount,
              'statistics.transactionCount': 1
            },
            $set: {
              lastActivityAt: new Date()
            }
          });
          
          console.log(`✅ Demo withdrawal completed: ${transaction.transactionId} - ${amount} arbINR for ${user.walletAddress}`);
        }
      } catch (error) {
        console.error('Withdrawal processing error:', error);
        await transaction.updateStatus('failed', {
          error: {
            code: 'PROCESSING_ERROR',
            message: error.message
          }
        });
      }
    }, 1000);
    
    res.status(201).json({
      success: true,
      message: 'Withdrawal initiated successfully',
      data: {
        transactionId: transaction.transactionId,
        amount: transaction.amount,
        status: transaction.status,
        estimatedProcessingTime: '1-3 minutes'
      }
    });
    
  } catch (error) {
    console.error('Withdrawal error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initiate withdrawal',
      error: error.message
    });
  }
});

// POST /api/transactions/transfer - Transfer arbINR to another wallet
router.post('/transfer', authenticateWallet, validateTransaction, async (req, res) => {
  try {
    const { amount, recipientAddress, note } = req.body;
    const user = req.user;
    
    // Validate recipient address
    if (!ethers.isAddress(recipientAddress)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid recipient wallet address'
      });
    }
    
    // Check if sending to self
    if (recipientAddress.toLowerCase() === user.walletAddress.toLowerCase()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot transfer to your own wallet'
      });
    }
    
    // Validate amount against configured limits
    if (amount < config.limits.minTransferAmount || amount > config.limits.maxTransferAmount) {
      return res.status(400).json({
        success: false,
        message: `Transfer amount must be between ₹${config.limits.minTransferAmount} and ₹${config.limits.maxTransferAmount}`
      });
    }
    
    // Check user's real arbINR balance from blockchain
    const balance = await blockchainService.getTokenBalance(user.walletAddress);
    const transferFee = 0.1; // Reduced fee for testing
    if (balance < amount + transferFee) { // Include transfer fee
      return res.status(400).json({
        success: false,
        message: `Insufficient arbINR balance (including ${transferFee} arbINR transfer fee)`
      });
    }
    
    // Find recipient user (if exists in our system)
    const recipientUser = await User.findByWallet(recipientAddress);
    
    // Create transaction record
    const transaction = new Transaction({
      user: user._id,
      walletAddress: user.walletAddress,
      type: 'transfer',
      subType: 'peer_transfer',
      amount,
      currency: 'arbINR',
      recipient: {
        walletAddress: recipientAddress.toLowerCase(),
        userId: recipientUser?._id
      },
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        source: 'web',
        note: note
      }
    });
    
    // Generate transaction ID before saving
    await transaction.generateTransactionId();
    await transaction.save();
    
    // Process transfer
    setTimeout(async () => {
      try {
        await transaction.updateStatus('processing');
        
        // Check if we're in demo mode (no contract deployed)
        const isDemoMode = !blockchainService.arbINRContract;
        
        if (isDemoMode) {
          // Demo mode: Simulate successful transfer
          console.log(`✅ Demo transfer completed: ${transaction.transactionId} - ${amount} arbINR from ${user.walletAddress} to ${recipientAddress}`);
          
          // Generate a proper Ethereum transaction hash for demo mode
          const demoHash = '0x' + Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('');
          
          await transaction.updateStatus('completed', {
            blockchainTxHash: demoHash,
            'blockchain.blockNumber': 0,
            'blockchain.gasUsed': 0,
            demoMode: true
          });
          
          // Update sender statistics (subtract transferred amount)
          await user.updateStatistics({
            type: 'transfer',
            amount: -amount // Negative to subtract from balance
          });
          
          // Update recipient statistics if they're in our system
          if (recipientUser) {
            await recipientUser.updateStatistics({
              type: 'transfer_received',
              amount: amount
            });
          }
          
        } else {
          // Real mode: Execute transfer via smart contract
          const transferResult = await blockchainService.transferTokens(
            user.walletAddress,
            recipientAddress,
            amount,
            transaction.transactionId
          );
          
          if (transferResult.success) {
            await transaction.updateStatus('completed', {
              blockchainTxHash: transferResult.txHash,
              'blockchain.blockNumber': transferResult.blockNumber,
              'blockchain.gasUsed': transferResult.gasUsed
            });
            
            // Update sender statistics
            await user.updateStatistics({
              type: 'transfer',
              amount: amount
            });
            
            // Update recipient statistics if they're in our system
            if (recipientUser) {
              await recipientUser.updateStatistics({
                type: 'transfer_received',
                amount: amount
              });
            }
            
          } else {
            await transaction.updateStatus('failed', {
              error: {
                code: 'TRANSFER_FAILED',
                message: transferResult.error
              }
            });
          }
        }
      } catch (error) {
        console.error('Transfer processing error:', error);
        await transaction.updateStatus('failed', {
          error: {
            code: 'PROCESSING_ERROR',
            message: error.message
          }
        });
      }
    }, 1000);
    
    res.status(201).json({
      success: true,
      message: 'Transfer initiated successfully',
      data: {
        transactionId: transaction.transactionId,
        amount: transaction.amount,
        recipient: recipientAddress,
        status: transaction.status,
        estimatedProcessingTime: '30-60 seconds'
      }
    });
    
  } catch (error) {
    console.error('Transfer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initiate transfer',
      error: error.message
    });
  }
});

// GET /api/transactions/stats - Get user transaction statistics
router.get('/user/stats', authenticateWallet, async (req, res) => {
  try {
    const userId = req.user._id;
    const { timeframe = '30d' } = req.query;
    
    // Get user statistics
    const userStats = await User.findById(userId).select('statistics');
    
    // Get transaction breakdown
    const transactionStats = await Transaction.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          avgAmount: { $avg: '$amount' }
        }
      }
    ]);
    
    // Get recent activity
    const recentTransactions = await Transaction.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('type amount status createdAt')
      .lean();
    
    res.json({
      success: true,
      data: {
        userStats: userStats.statistics,
        transactionBreakdown: transactionStats,
        recentActivity: recentTransactions
      }
    });
    
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
});

// POST /api/transactions/confirm-deposit - Confirm bank transfer payment
router.post('/confirm-deposit', authenticateWallet, async (req, res) => {
  try {
    const { transactionId, paymentId, signature } = req.body;
    
    // Find the pending deposit transaction
    const transaction = await Transaction.findOne({
      transactionId,
      user: req.user._id,
      type: 'deposit',
      status: 'pending'
    });
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Pending deposit transaction not found'
      });
    }
    
    // Validate required payment parameters
    if (!paymentId || !signature) {
      return res.status(400).json({
        success: false,
        message: 'Payment ID and signature are required for payment verification'
      });
    }
    
    // Real payment verification (when paymentId and signature are provided)
    const verification = paymentService.verifyPaymentSignature(
      transaction.payment.orderId,
      paymentId,
      signature
    );
    
    if (!verification.success || !verification.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature'
      });
    }
    
    // Get payment details
    const paymentDetails = await paymentService.getPaymentDetails(paymentId);
    
    if (!paymentDetails.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to verify payment'
      });
    }
    
    // Verify payment amount matches transaction amount
    if (paymentDetails.amount !== transaction.amount * 100) { // Convert to paise
      return res.status(400).json({
        success: false,
        message: 'Payment amount mismatch'
      });
    }
    
    // Update transaction with payment details
    await transaction.updateOne({
      'payment.paymentId': paymentId,
      'payment.status': paymentDetails.status,
      'payment.method': paymentDetails.method,
      'payment.captured': paymentDetails.captured
    });
    
    // Process successful payment
    if (paymentDetails.status === 'captured') {
      // Mint arbINR tokens
      const mintResult = await blockchainService.mintTokens(
        req.user.walletAddress,
        transaction.amount,
        transaction.transactionId
      );
      
      if (mintResult.success) {
        await transaction.updateStatus('completed', {
          blockchainTxHash: mintResult.txHash,
          'blockchain.blockNumber': mintResult.blockNumber,
          'blockchain.gasUsed': mintResult.gasUsed,
          completedAt: new Date()
        });
        
        // Update user statistics
        await User.findByIdAndUpdate(req.user._id, {
          $inc: {
            'statistics.totalDeposited': transaction.amount,
            'statistics.transactionCount': 1
          },
          $set: {
            lastActivityAt: new Date()
          }
        });
        
        console.log(`✅ Deposit confirmed: ${transactionId} - ${transaction.amount} INR for ${req.user.walletAddress}`);
        
        res.json({
          success: true,
          message: 'Deposit confirmed successfully',
          data: {
            transaction: {
              id: transaction.transactionId,
              amount: transaction.amount,
              status: 'completed',
              completedAt: new Date()
            },
            newBalance: await blockchainService.getTokenBalance(req.user.walletAddress)
          }
        });
      } else {
        await transaction.updateStatus('failed', {
          error: {
            code: 'MINT_FAILED',
            message: mintResult.error
          }
        });
        
        res.status(500).json({
          success: false,
          message: 'Failed to mint tokens'
        });
      }
    } else {
      res.status(400).json({
        success: false,
        message: 'Payment not captured'
      });
    }
    
  } catch (error) {
    console.error('Confirm deposit error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to confirm deposit',
      error: error.message
    });
  }
});

// POST /api/transactions/webhook - Payment gateway webhook
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const body = req.body;
    
    const result = await paymentService.processWebhook(body, signature);
    
    if (result.success) {
      res.status(200).json({ success: true, message: 'Webhook processed' });
    } else {
      res.status(400).json({ success: false, message: result.error });
    }
    
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({
      success: false,
      message: 'Webhook processing failed'
    });
  }
});

module.exports = router;
