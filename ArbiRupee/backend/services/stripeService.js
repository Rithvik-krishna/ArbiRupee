const Stripe = require('stripe');
const config = require('../config/environment');

class StripeService {
  constructor() {
    this.stripe = null;
    this.initialized = false;
    this.initialize();
  }

  async initialize() {
    try {
      if (!config.stripe.secretKey || config.stripe.secretKey.includes('your_stripe_secret_key_here')) {
        console.log('⚠️ Stripe not configured - using demo mode');
        this.initialized = false;
        return;
      }

      this.stripe = new Stripe(config.stripe.secretKey);
      this.initialized = true;
      console.log('✅ Stripe Service initialized successfully');
    } catch (error) {
      console.error('❌ Stripe Service initialization failed:', error.message);
      this.initialized = false;
    }
  }

  async createPaymentIntent(amount, currency = 'inr', metadata = {}) {
    // Always use demo mode for now - hardcoded payments
    console.log('🎭 Creating demo Stripe payment intent for amount:', amount);
    const amountInPaise = Math.round(amount * 100);
    const paymentIntentId = `pi_demo_${Date.now()}_${amountInPaise}`;
    
    return {
      id: paymentIntentId,
      client_secret: `${paymentIntentId}_secret_demo`,
      amount: amountInPaise, // Convert to paise
      currency: currency.toLowerCase(),
      status: 'requires_payment_method',
      metadata: {
        ...metadata,
        originalAmount: amount,
        amountInPaise: amountInPaise
      }
    };

    // Real Stripe integration (commented out for demo mode)
    /*
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to paise
        currency: currency.toLowerCase(),
        metadata: {
          ...metadata,
          source: 'arbirupee'
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      return paymentIntent;
    } catch (error) {
      console.error('❌ Create payment intent error:', error);
      throw error;
    }
    */
  }

  async retrievePaymentIntent(paymentIntentId) {
    // Always use demo mode for now - hardcoded payments
    console.log('🎭 Retrieving demo Stripe payment intent:', paymentIntentId);
    
    // Extract amount from paymentIntentId (format: pi_demo_timestamp_amountInPaise)
    let amount = 12000; // Default amount (₹120 in paise)
    if (paymentIntentId.includes('_')) {
      const parts = paymentIntentId.split('_');
      if (parts.length >= 4) {
        // Extract amount from the last part of the ID
        const amountPart = parts[parts.length - 1];
        const parsedAmount = parseInt(amountPart);
        if (!isNaN(parsedAmount)) {
          amount = parsedAmount;
        }
      }
    }
    
    return {
      id: paymentIntentId,
      status: 'succeeded',
      amount: amount,
      currency: 'inr',
      metadata: {
        originalAmount: amount / 100,
        amountInPaise: amount
      },
      payment_method: {
        type: 'card'
      }
    };

    // Real Stripe integration (commented out for demo mode)
    /*
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
      return paymentIntent;
    } catch (error) {
      console.error('❌ Retrieve payment intent error:', error);
      throw error;
    }
    */
  }

  async confirmPaymentIntent(paymentIntentId, paymentMethodId) {
    // Always use demo mode for now - hardcoded payments
    console.log('🎭 Confirming demo Stripe payment intent:', paymentIntentId);
    return {
      id: paymentIntentId,
      status: 'succeeded',
      amount: 5000000,
      currency: 'inr'
    };

    // Real Stripe integration (commented out for demo mode)
    /*
    try {
      const paymentIntent = await this.stripe.paymentIntents.confirm(paymentIntentId, {
        payment_method: paymentMethodId,
      });

      return paymentIntent;
    } catch (error) {
      console.error('❌ Confirm payment intent error:', error);
      throw error;
    }
    */
  }

  async createRefund(paymentIntentId, amount = null) {
    if (!this.initialized) {
      // Demo mode - return mock refund
      return {
        id: `re_demo_${Date.now()}`,
        payment_intent: paymentIntentId,
        amount: amount || 5000000,
        currency: 'inr',
        status: 'succeeded'
      };
    }

    try {
      const refund = await this.stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount: amount, // If null, full refund
      });

      return refund;
    } catch (error) {
      console.error('❌ Create refund error:', error);
      throw error;
    }
  }

  verifyWebhookSignature(payload, signature) {
    if (!this.initialized) {
      // Demo mode - always return true
      return true;
    }

    try {
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        config.stripe.webhookSecret
      );
      return event;
    } catch (error) {
      console.error('❌ Webhook signature verification failed:', error.message);
      throw error;
    }
  }

  getPublishableKey() {
    // Always return demo key for hardcoded payments
    return 'pk_test_demo_key_hardcoded';
  }
}

module.exports = new StripeService();
