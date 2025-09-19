// services/paymentService.js - Real payment gateway integration for ArbiRupee
const crypto = require('crypto');

class PaymentService {
  constructor() {
    // Payment gateway configurations
    this.razorpayKeyId = process.env.RAZORPAY_KEY_ID;
    this.razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;
    this.razorpayWebhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    
    // Initialize payment gateway client
    this.razorpay = null;
    this.initialized = false;
  }

  async initialize() {
    try {
      if (!this.razorpayKeyId || !this.razorpayKeySecret) {
        throw new Error('Payment gateway credentials not configured');
      }

      // Initialize Razorpay (or other payment gateway)
      const Razorpay = require('razorpay');
      this.razorpay = new Razorpay({
        key_id: this.razorpayKeyId,
        key_secret: this.razorpayKeySecret
      });

      this.initialized = true;
      console.log('✅ Payment Service initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Payment Service initialization failed:', error);
      this.initialized = false;
      return false;
    }
  }

  // Create payment order for INR deposit
  async createDepositOrder(userWalletAddress, amount, transactionId) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      if (!this.razorpay) {
        throw new Error('Payment gateway not initialized');
      }

      // Validate amount (minimum ₹100, maximum ₹100,000)
      if (amount < 100 || amount > 100000) {
        throw new Error('Invalid amount. Must be between ₹100 and ₹100,000');
      }

      const orderId = `order_${transactionId}_${Date.now()}`;
      
      const orderOptions = {
        amount: amount * 100, // Convert to paise
        currency: 'INR',
        receipt: transactionId,
        notes: {
          userWalletAddress,
          transactionId,
          purpose: 'arbINR_deposit'
        }
      };

      const order = await this.razorpay.orders.create(orderOptions);

      console.log(`💳 Payment order created: ${orderId} - ₹${amount} for ${userWalletAddress}`);

      return {
        success: true,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt,
        status: order.status,
        createdAt: new Date(order.created_at * 1000)
      };

    } catch (error) {
      console.error('❌ Create payment order error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Verify payment signature
  verifyPaymentSignature(orderId, paymentId, signature) {
    try {
      if (!this.razorpayKeySecret) {
        throw new Error('Payment gateway secret not configured');
      }

      const generatedSignature = crypto
        .createHmac('sha256', this.razorpayKeySecret)
        .update(orderId + '|' + paymentId)
        .digest('hex');

      const isValid = generatedSignature === signature;

      return {
        success: true,
        isValid,
        message: isValid ? 'Payment signature verified' : 'Invalid payment signature'
      };

    } catch (error) {
      console.error('❌ Verify payment signature error:', error);
      return {
        success: false,
        isValid: false,
        error: error.message
      };
    }
  }

  // Fetch payment details
  async getPaymentDetails(paymentId) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const payment = await this.razorpay.payments.fetch(paymentId);

      return {
        success: true,
        paymentId: payment.id,
        orderId: payment.order_id,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        method: payment.method,
        bank: payment.bank,
        wallet: payment.wallet,
        vpa: payment.vpa,
        email: payment.email,
        contact: payment.contact,
        captured: payment.captured,
        createdAt: new Date(payment.created_at * 1000),
        fee: payment.fee,
        tax: payment.tax,
        description: payment.description,
        notes: payment.notes
      };

    } catch (error) {
      console.error('❌ Get payment details error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Capture payment
  async capturePayment(paymentId, amount) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const captureOptions = {
        amount: amount * 100 // Convert to paise
      };

      const capture = await this.razorpay.payments.capture(paymentId, captureOptions.amount);

      return {
        success: true,
        paymentId: capture.id,
        amount: capture.amount,
        currency: capture.currency,
        captured: capture.captured,
        status: capture.status
      };

    } catch (error) {
      console.error('❌ Capture payment error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Process webhook
  async processWebhook(body, signature) {
    try {
      if (!this.razorpayWebhookSecret) {
        throw new Error('Webhook secret not configured');
      }

      // Verify webhook signature
      const generatedSignature = crypto
        .createHmac('sha256', this.razorpayWebhookSecret)
        .update(body)
        .digest('hex');

      if (generatedSignature !== signature) {
        throw new Error('Invalid webhook signature');
      }

      const webhookData = JSON.parse(body);
      const eventType = webhookData.event;

      console.log(`🔔 Webhook received: ${eventType}`);

      switch (eventType) {
        case 'payment.captured':
          return await this.handlePaymentCaptured(webhookData);
        case 'payment.failed':
          return await this.handlePaymentFailed(webhookData);
        case 'order.paid':
          return await this.handleOrderPaid(webhookData);
        default:
          return {
            success: true,
            message: `Webhook event ${eventType} received but not processed`
          };
      }

    } catch (error) {
      console.error('❌ Process webhook error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Handle payment captured webhook
  async handlePaymentCaptured(webhookData) {
    try {
      const payment = webhookData.payload.payment.entity;
      const order = webhookData.payload.order.entity;

      console.log(`💰 Payment captured: ${payment.id} - ₹${payment.amount / 100}`);

      // Here you would:
      // 1. Find the transaction in your database
      // 2. Update transaction status
      // 3. Mint arbINR tokens
      // 4. Send confirmation to user

      return {
        success: true,
        message: 'Payment captured webhook processed',
        paymentId: payment.id,
        amount: payment.amount
      };

    } catch (error) {
      console.error('❌ Handle payment captured error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Handle payment failed webhook
  async handlePaymentFailed(webhookData) {
    try {
      const payment = webhookData.payload.payment.entity;

      console.log(`❌ Payment failed: ${payment.id}`);

      // Here you would:
      // 1. Find the transaction in your database
      // 2. Update transaction status to failed
      // 3. Send failure notification to user

      return {
        success: true,
        message: 'Payment failed webhook processed',
        paymentId: payment.id
      };

    } catch (error) {
      console.error('❌ Handle payment failed error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Handle order paid webhook
  async handleOrderPaid(webhookData) {
    try {
      const order = webhookData.payload.order.entity;

      console.log(`✅ Order paid: ${order.id}`);

      // Here you would:
      // 1. Find the transaction in your database
      // 2. Update transaction status
      // 3. Process the deposit

      return {
        success: true,
        message: 'Order paid webhook processed',
        orderId: order.id
      };

    } catch (error) {
      console.error('❌ Handle order paid error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Refund payment
  async refundPayment(paymentId, amount, notes = '') {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const refundOptions = {
        amount: amount * 100, // Convert to paise
        notes: {
          reason: notes || 'User requested refund'
        }
      };

      const refund = await this.razorpay.payments.refund(paymentId, refundOptions);

      console.log(`🔄 Refund processed: ${refund.id} - ₹${refund.amount / 100}`);

      return {
        success: true,
        refundId: refund.id,
        paymentId: refund.payment_id,
        amount: refund.amount,
        status: refund.status,
        createdAt: new Date(refund.created_at * 1000)
      };

    } catch (error) {
      console.error('❌ Refund payment error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get transaction history for a payment
  async getTransactionHistory(paymentId) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const transfers = await this.razorpay.payments.fetch(paymentId).transfers();

      return {
        success: true,
        transfers: transfers.items
      };

    } catch (error) {
      console.error('❌ Get transaction history error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Create singleton instance
const paymentService = new PaymentService();

module.exports = {
  paymentService
};
