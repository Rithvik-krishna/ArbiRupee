# Real Payment Gateway Setup Guide

## 🎯 **Removing Demo Mode and Setting Up Real Payment Gateway**

Your ArbiRupee platform has been updated to use **real payment gateway integration** instead of demo/mock data. Follow this guide to configure your real Razorpay payment gateway.

## 📋 **Prerequisites**

1. **Razorpay Account**: Sign up at [https://razorpay.com](https://razorpay.com)
2. **Business Verification**: Complete KYC and business verification
3. **API Keys**: Generate your Razorpay API keys

## 🔧 **Step 1: Get Razorpay API Keys**

### **1.1 Login to Razorpay Dashboard**
- Go to [https://dashboard.razorpay.com](https://dashboard.razorpay.com)
- Login with your Razorpay account

### **1.2 Generate API Keys**
- Navigate to **Settings** → **API Keys**
- Click **Generate Key**
- Copy your **Key ID** and **Key Secret**
- **Important**: Keep these keys secure and never share them publicly

## 🔧 **Step 2: Configure Environment Variables**

### **2.1 Create .env File**
Create a `.env` file in your `backend` directory:

```bash
# Copy the example file
cp backend/environment.example backend/.env
```

### **2.2 Update .env with Real Values**
```env
# Server Configuration
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/arbirupee

# Blockchain Configuration
NETWORK=mainnet
ARBITRUM_RPC_URL=https://arb1.arbitrum.io/rpc
ARBINR_CONTRACT_ADDRESS=0x742d35Cc6634C0532925a3b8D7389c7abb1F1c1e
PRIVATE_KEY=your_actual_private_key_here

# Payment Gateway Configuration (REAL VALUES)
RAZORPAY_KEY_ID=rzp_test_your_actual_key_id
RAZORPAY_KEY_SECRET=your_actual_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

# JWT Configuration
JWT_SECRET=your-super-secure-jwt-secret-key
JWT_EXPIRES_IN=7d

# Transaction Limits
MIN_DEPOSIT_AMOUNT=100
MAX_DEPOSIT_AMOUNT=100000
MIN_WITHDRAWAL_AMOUNT=100
MAX_WITHDRAWAL_AMOUNT=50000
```

## 🔧 **Step 3: Configure Webhooks (Optional but Recommended)**

### **3.1 Set Up Webhook Endpoint**
- In Razorpay Dashboard, go to **Settings** → **Webhooks**
- Add webhook URL: `https://yourdomain.com/api/webhooks/razorpay`
- Select events: `payment.captured`, `payment.failed`, `order.paid`
- Copy the webhook secret

### **3.2 Update Environment**
```env
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_from_dashboard
```

## 🔧 **Step 4: Update Frontend Configuration**

### **4.1 Update Razorpay Integration**
In your frontend, update the Razorpay configuration:

```javascript
// In your deposit page or payment component
const razorpayConfig = {
  key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, // Your public key
  amount: amount * 100, // Amount in paise
  currency: 'INR',
  name: 'ArbiRupee',
  description: 'arbINR Deposit',
  order_id: orderId, // From your backend
  handler: function (response) {
    // Handle successful payment
    console.log('Payment successful:', response);
  },
  prefill: {
    name: user.name,
    email: user.email,
    contact: user.phone
  },
  theme: {
    color: '#6366f1'
  }
};
```

### **4.2 Add Environment Variables to Frontend**
Create `.env.local` in your frontend directory:

```env
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_your_actual_key_id
```

## 🔧 **Step 5: Test the Integration**

### **5.1 Start the Backend**
```bash
cd backend
npm run dev
```

### **5.2 Test Payment Flow**
1. **Go to deposit page**: http://localhost:3000/deposit
2. **Enter amount**: ₹100 or more
3. **Click "Deposit"**: Should create real Razorpay order
4. **Complete payment**: Use Razorpay test cards
5. **Verify**: Check backend logs for real payment processing

### **5.3 Test Cards (Razorpay Test Mode)**
```
Card Number: 4111 1111 1111 1111
Expiry: Any future date
CVV: Any 3 digits
Name: Any name
```

## 🚨 **Important Security Notes**

### **🔒 Environment Variables**
- **Never commit** `.env` files to version control
- **Use different keys** for development and production
- **Rotate keys** regularly for security

### **🔒 API Key Security**
- **Key ID**: Can be public (used in frontend)
- **Key Secret**: Must be private (backend only)
- **Webhook Secret**: Must be private (backend only)

### **🔒 Production Checklist**
- [ ] Use production Razorpay keys
- [ ] Enable webhook signature verification
- [ ] Set up proper error handling
- [ ] Configure rate limiting
- [ ] Enable HTTPS
- [ ] Set up monitoring and logging

## 🎯 **What's Changed**

### **✅ Removed Demo Mode**
- ❌ **Demo payment orders** → ✅ **Real Razorpay orders**
- ❌ **Mock payment verification** → ✅ **Real signature verification**
- ❌ **Hardcoded withdrawal data** → ✅ **Real user banking details**
- ❌ **Simulated transactions** → ✅ **Real blockchain transactions**

### **✅ Real Payment Flow**
1. **User initiates deposit** → Creates real Razorpay order
2. **User completes payment** → Real payment processing
3. **Payment verification** → Real signature verification
4. **Token minting** → Real blockchain transaction
5. **Balance update** → Real-time balance reflection

### **✅ Real Withdrawal Flow**
1. **User enters amount** → Real balance validation
2. **Banking details** → Real user data (not hardcoded)
3. **Withdrawal processing** → Real balance deduction
4. **Transaction recording** → Real database updates

## 🚀 **Next Steps**

### **1. Configure Your Environment**
- Set up real Razorpay API keys
- Update your `.env` file
- Test the payment flow

### **2. Deploy Smart Contract**
- Deploy your ArbINR contract to Arbitrum
- Update `ARBINR_CONTRACT_ADDRESS` in `.env`
- Configure your private key

### **3. Production Deployment**
- Use production Razorpay keys
- Set up webhook endpoints
- Configure proper security measures

## 🆘 **Troubleshooting**

### **Common Issues**

#### **"Payment gateway not initialized"**
- Check if `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` are set
- Verify the keys are correct and active

#### **"Invalid payment signature"**
- Ensure webhook secret is configured correctly
- Check if payment ID and signature are being passed correctly

#### **"Insufficient balance"**
- Verify user has enough arbINR tokens
- Check blockchain connection and contract address

### **Support**
- **Razorpay Documentation**: [https://razorpay.com/docs](https://razorpay.com/docs)
- **Razorpay Support**: [https://razorpay.com/support](https://razorpay.com/support)

## 🎉 **Success!**

Once configured, your ArbiRupee platform will:
- ✅ **Process real payments** through Razorpay
- ✅ **Handle real withdrawals** with user banking details
- ✅ **Execute real blockchain transactions**
- ✅ **Provide real-time balance updates**
- ✅ **No more demo/mock data!**

**Your platform is now ready for real-world usage!** 🚀
