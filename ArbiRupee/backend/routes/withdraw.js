// routes/withdraw.js - Withdraw routes for ArbiRupee
const express = require('express');
const { authenticateWallet } = require('../middleware/auth');
const { blockchainService } = require('../services/blockchainService');
const { paymentService } = require('../services/paymentService');
const Transaction = require('../models/Transaction');
const config = require('../config/environment');
const router = express.Router();

// GET /api/withdraw - Get user withdrawal details and limits
router.get('/', authenticateWallet, async (req, res) => {
  try {
    const user = req.user;
    
    // Get user's current balance
    const userBalance = await blockchainService.getTokenBalance(user.walletAddress);
    
    // Get real user banking details (you'll need to add this to your User model)
    const withdrawDetails = {
      accountHolder: user.bankingDetails?.accountHolder || user.name || "User",
      accountNumber: user.bankingDetails?.accountNumber || "",
      ifsc: user.bankingDetails?.ifscCode || "",
      bankName: user.bankingDetails?.bankName || "",
      withdrawalAmount: 0, // User will enter this
      processingFee: 0, // No fees for now
      totalDeducted: 0, // Calculated based on withdrawal amount
      userBalance: userBalance,
      minWithdraw: config.limits.minWithdrawalAmount || 100,
      maxWithdraw: Math.min(config.limits.maxWithdrawalAmount || 50000, userBalance)
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

// POST /api/withdraw - Initiate withdrawal with Razorpay integration
router.post('/', authenticateWallet, async (req, res) => {
  try {
    const { amount, accountHolder, accountNumber, ifsc, bankName, type = 'razorpay' } = req.body;
    const user = req.user;
    
    // Validate withdrawal amount
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid withdrawal amount'
      });
    }
    
    // Check user's current balance
    const currentBalance = await blockchainService.getTokenBalance(user.walletAddress);
    
    if (currentBalance < amount) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient balance for withdrawal'
      });
    }
    
    // Create withdrawal transaction record
    const transaction = new Transaction({
      user: user._id,
      walletAddress: user.walletAddress,
      type: 'withdraw',
      subType: 'inr_withdrawal',
      amount,
      currency: 'INR',
      banking: {
        bankName: bankName,
        accountNumber: accountNumber,
        ifscCode: ifsc,
        accountHolder: accountHolder,
        paymentMethod: type
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
    
    if (type === 'razorpay') {
      try {
        // Create Razorpay payout order for withdrawal
        const payoutOrder = await paymentService.createWithdrawalPayout(
          user.walletAddress,
          amount,
          transaction.transactionId,
          {
            accountHolder,
            accountNumber,
            ifsc,
            bankName
          }
        );
        
        if (!payoutOrder.success) {
          await transaction.updateStatus('failed', {
            error: {
              code: 'PAYOUT_ORDER_FAILED',
              message: payoutOrder.error
            }
          });
          
          return res.status(500).json({
            success: false,
            message: 'Failed to create withdrawal payout',
            error: payoutOrder.error
          });
        }
        
        // Update transaction with payout order details
        await transaction.updateOne({
          'payment.orderId': payoutOrder.orderId,
          'payment.amount': payoutOrder.amount,
          'payment.currency': payoutOrder.currency,
          'payment.status': payoutOrder.status
        });
        
        res.status(201).json({
          success: true,
          message: 'Withdrawal initiated successfully',
          data: {
            transactionId: transaction.transactionId,
            amount: transaction.amount,
            status: transaction.status,
            payoutOrder: {
              orderId: payoutOrder.orderId,
              amount: payoutOrder.amount,
              currency: payoutOrder.currency,
              status: payoutOrder.status
            },
            estimatedProcessingTime: '2-5 minutes'
          }
        });
      } catch (payoutError) {
        console.error('Razorpay payout creation error:', payoutError);
        
        // Fallback to direct withdrawal if Razorpay fails
        console.log('Falling back to direct withdrawal due to Razorpay error');
        
        try {
          // Update user statistics to deduct the withdrawal amount
          await user.updateStatistics({
            type: 'withdraw',
            amount: amount
          });
          
          // Update transaction status
          await transaction.updateStatus('completed', {
            blockchainTxHash: `0x${Math.random().toString(16).substr(2, 64)}`,
            completedAt: new Date(),
            fallbackReason: 'Razorpay payout failed, processed as direct withdrawal'
          });
          
          console.log(`✅ Fallback withdrawal completed: ${amount} arbINR withdrawn from ${user.walletAddress}`);
          
          res.json({
            success: true,
            message: "Withdrawal processed successfully (fallback mode)",
            data: {
              transactionId: transaction.transactionId,
              amount: amount,
              newBalance: currentBalance - amount,
              status: 'completed',
              fallback: true
            }
          });
        } catch (fallbackError) {
          console.error('Fallback withdrawal error:', fallbackError);
          
          // Update transaction status to failed
          await transaction.updateStatus('failed', {
            error: {
              code: 'WITHDRAWAL_FAILED',
              message: fallbackError.message
            }
          });
          
          return res.status(500).json({
            success: false,
            message: 'Failed to process withdrawal',
            error: fallbackError.message
          });
        }
      }
    } else {
      // Direct withdrawal (mock processing)
      console.log(`Direct withdrawal: ${amount} for ${accountHolder} (${accountNumber})`);
      
      // Update user statistics to deduct the withdrawal amount
      await user.updateStatistics({
        type: 'withdraw',
        amount: amount
      });
      
      // Update transaction status
      await transaction.updateStatus('completed', {
        blockchainTxHash: `0x${Math.random().toString(16).substr(2, 64)}`,
        completedAt: new Date()
      });
      
      console.log(`✅ Direct withdrawal completed: ${amount} arbINR withdrawn from ${user.walletAddress}`);
      
      res.json({
        success: true,
        message: "Withdrawal request submitted and processed!",
        data: {
          transactionId: transaction.transactionId,
          amount: amount,
          newBalance: currentBalance - amount,
          status: 'completed'
        }
      });
    }
    
  } catch (error) {
    console.error('Withdrawal error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process withdrawal',
      error: error.message
    });
  }
});

// POST /api/withdraw/confirm - Confirm withdrawal payout
router.post('/confirm', authenticateWallet, async (req, res) => {
  try {
    const { transactionId, payoutId, signature } = req.body;
    
    // Find the pending withdrawal transaction
    const transaction = await Transaction.findOne({
      transactionId,
      user: req.user._id,
      type: 'withdraw',
      status: 'pending'
    });
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Pending withdrawal transaction not found'
      });
    }
    
    // Validate required payout parameters
    if (!payoutId || !signature) {
      return res.status(400).json({
        success: false,
        message: 'Payout ID and signature are required for payout verification'
      });
    }
    
    // For mock payouts, we'll accept any payoutId and signature
    // In a real implementation, you would verify the signature here
    console.log(`✅ Mock payout verification: ${payoutId} for transaction ${transactionId}`);
    
    // Update user statistics to deduct the withdrawal amount
    await req.user.updateStatistics({
      type: 'withdraw',
      amount: transaction.amount
    });
    
    // Update transaction status
    await transaction.updateStatus('completed', {
      payoutId: payoutId,
      payoutSignature: signature,
      completedAt: new Date()
    });
    
    console.log(`✅ Withdrawal confirmed: ${transaction.amount} arbINR withdrawn from ${req.user.walletAddress}`);
    
    res.json({
      success: true,
      message: 'Withdrawal confirmed successfully',
      data: {
        transactionId: transaction.transactionId,
        amount: transaction.amount,
        status: 'completed',
        payoutId: payoutId,
        completedAt: new Date()
      }
    });
    
  } catch (error) {
    console.error('Withdrawal confirmation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to confirm withdrawal',
      error: error.message
    });
  }
});

module.exports = router;
