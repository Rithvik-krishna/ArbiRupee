'use client';

import { motion } from 'framer-motion';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { 
  ArrowLeftIcon,
  ArrowUpIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import ArbiRupeeLogo from '@/components/ArbiRupeeLogo';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

interface WithdrawDetails {
  accountHolder: string;
  accountNumber: string;
  ifsc: string;
  bankName: string;
  withdrawalAmount: number;
  processingFee: number;
  totalDeducted: number;
  userBalance: number;
  minWithdraw: number;
  maxWithdraw: number;
}

export default function Withdraw() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Form, 2: Confirmation, 3: Success
  const [transactionId, setTransactionId] = useState('');
  const [withdrawDetails, setWithdrawDetails] = useState<WithdrawDetails | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(true);
  const [payoutOrder, setPayoutOrder] = useState<any>(null); // Added state for Razorpay payout

  useEffect(() => {
    if (!isConnected) {
      router.push('/');
    } else {
      fetchWithdrawDetails();
    }
  }, [isConnected, router, address]);

  const fetchWithdrawDetails = async () => {
    try {
      setIsLoadingDetails(true);
      const response = await fetch(`http://localhost:5000/api/withdraw`, {
        headers: {
          'x-wallet-address': address || '',
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setWithdrawDetails(data.data);
          // Pre-fill form with user's bank details
          setAccountHolder(data.data.accountHolder || '');
          setBankAccount(data.data.accountNumber || '');
          setIfscCode(data.data.ifsc || '');
          setBankName(data.data.bankName || '');
        } else {
          console.error('Invalid response structure:', data);
        }
      } else {
        console.error('Failed to fetch withdraw details');
      }
    } catch (error) {
      console.error('Failed to fetch withdraw details:', error);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9.]/g, '');
    setAmount(value);
  };

  const isValidAmount = () => {
    if (!withdrawDetails || !amount || amount.trim() === '') {
      console.log('Validation failed: No withdrawDetails or empty amount');
      return false;
    }
    
    const num = parseFloat(amount);
    const userBalance = withdrawDetails.userBalance || 0;
    const minWithdraw = withdrawDetails.minWithdraw || 100;
    const maxWithdraw = withdrawDetails.maxWithdraw || 50000;
    
    const isValid = num >= minWithdraw && 
                   num <= maxWithdraw && 
                   num <= userBalance && 
                   !isNaN(num) &&
                   num > 0;
    
    console.log('Amount validation:', {
      amount: amount,
      parsedAmount: num,
      userBalance,
      minWithdraw,
      maxWithdraw,
      isValid,
      checks: {
        isNumber: !isNaN(num),
        isPositive: num > 0,
        meetsMin: num >= minWithdraw,
        meetsMax: num <= maxWithdraw,
        withinBalance: num <= userBalance
      }
    });
    
    return isValid;
  };

  const isValidBankDetails = () => {
    const isValid = bankAccount.length >= 9 && 
                   ifscCode.length >= 11 && 
                   bankName.trim().length > 0 && 
                   accountHolder.trim().length > 0;
    
    console.log('Bank details validation:', {
      bankAccount: bankAccount,
      ifscCode: ifscCode,
      bankName: bankName,
      accountHolder: accountHolder,
      isValid,
      checks: {
        accountLength: bankAccount.length >= 9,
        ifscLength: ifscCode.length >= 11,
        bankNameValid: bankName.trim().length > 0,
        accountHolderValid: accountHolder.trim().length > 0
      }
    });
    
    return isValid;
  };

  const totalAmount = withdrawDetails ? parseFloat(amount) + (withdrawDetails.processingFee || 0) : 0;

  const handleInitiateWithdraw = async () => {
    console.log('handleInitiateWithdraw called with:', {
      amount,
      accountHolder,
      bankAccount,
      ifscCode,
      bankName,
      withdrawDetails,
      isValidAmount: isValidAmount(),
      isValidBankDetails: isValidBankDetails()
    });
    
    if (!isValidAmount() || !isValidBankDetails()) {
      console.log('Validation failed - not proceeding');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch('http://localhost:5000/api/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': address || ''
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          accountHolder,
          accountNumber: bankAccount,
          ifsc: ifscCode,
          bankName,
          type: 'razorpay' // Use Razorpay for withdrawals
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to initiate withdrawal');
      }

      const data = await response.json();
      console.log('Withdrawal response:', data);
      
      if (data.success) {
        setTransactionId(data.data?.transactionId || data.transactionId);
        setPayoutOrder(data.data?.payoutOrder);
        
        // Check if it's a fallback withdrawal (completed immediately)
        if (data.data?.fallback || data.data?.status === 'completed') {
          setStep(3); // Go directly to success step
          alert(data.message || 'Withdrawal processed successfully!');
        } else {
          setStep(2); // Go to confirmation step for Razorpay
        }
      } else {
        throw new Error(data.message || 'Withdrawal failed');
      }
    } catch (error) {
      console.error('Withdrawal initiation failed:', error);
      alert(`Failed to initiate withdrawal: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmWithdraw = async () => {
    setIsLoading(true);
    
    try {
      // The withdrawal is already being processed in the background by the backend
      // We just need to wait a bit and then show success
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Refresh the withdraw details to reflect the updated balance
      await fetchWithdrawDetails();
      
      setStep(3);
    } catch (error) {
      console.error('Withdrawal confirmation failed:', error);
      alert('Failed to process withdrawal. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmWithdrawal = async (payoutId: string, signature: string) => {
    setIsLoading(true);
    
    try {
      const response = await fetch(`http://localhost:5000/api/withdraw/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': address || ''
        },
        body: JSON.stringify({
          transactionId,
          payoutId,
          signature
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to confirm withdrawal');
      }

      const data = await response.json();
      console.log('Withdrawal confirmation response:', data);
      
      if (data.success) {
        setStep(3);
        alert('Withdrawal confirmed! Your funds are being processed.');
      } else {
        throw new Error(data.message || 'Withdrawal confirmation failed');
      }
    } catch (error) {
      console.error('Withdrawal confirmation failed:', error);
      alert(`Failed to confirm withdrawal: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Load Razorpay script
  useEffect(() => {
    const loadRazorpayScript = () => {
      return new Promise((resolve, reject) => {
        // Check if script is already loaded
        if (typeof (window as any).Razorpay !== 'undefined') {
          resolve(true);
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        script.onload = () => {
          console.log('Razorpay script loaded successfully');
          resolve(true);
        };
        script.onerror = () => {
          console.error('Failed to load Razorpay script');
          reject(new Error('Failed to load Razorpay script'));
        };
        document.head.appendChild(script);
      });
    };

    loadRazorpayScript().catch(error => {
      console.error('Error loading Razorpay script:', error);
    });
  }, []);

  if (!isConnected) {
    return null;
  }

  if (isLoadingDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-red-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading withdrawal details...</p>
        </div>
      </div>
    );
  }

  if (!withdrawDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-red-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">Failed to load withdrawal details. Please try again.</p>
          <button 
            onClick={fetchWithdrawDetails}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-red-900">
      {/* Navigation */}
      <nav className="flex justify-between items-center p-6 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center space-x-4"
        >
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center space-x-2"
        >
          <div className="w-8 h-8 bg-gradient-to-r from-red-600 to-orange-600 rounded-lg flex items-center justify-center">
            <ArbiRupeeLogo variant="icon" width={20} height={20} />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
            Withdraw arbINR
          </span>
        </motion.div>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-8">
        {step === 1 && (
          <motion.div {...fadeInUp} className="space-y-8">
            {/* Balance Display */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-200 dark:border-gray-700">
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Available Balance</p>
                <p className="text-3xl font-bold text-gray-800 dark:text-white">
                  {withdrawDetails.userBalance ? withdrawDetails.userBalance.toFixed(2) : '0.00'} <span className="text-lg">arbINR</span>
                </p>
              </div>
            </div>

            {/* Withdraw Form */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl border border-gray-200 dark:border-gray-700">
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                    Withdrawal Details
                  </h3>
                </div>

                {/* Amount Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Withdrawal Amount
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={amount}
                      onChange={handleAmountChange}
                      placeholder="Enter amount"
                      className="w-full px-4 py-3 pl-8 pr-16 text-lg border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <ArbiRupeeLogo variant="icon" width={20} height={20} className="absolute left-3 top-4 opacity-50" />
                    <span className="absolute right-3 top-4 text-sm text-gray-500">arbINR</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <span>Min: ₹{withdrawDetails.minWithdraw || 0}</span>
                    <span>Max: ₹{withdrawDetails.maxWithdraw || 0}</span>
                  </div>
                </div>

                {/* Bank Account Details */}
                <div className="space-y-4">
                  <h4 className="text-lg font-medium text-gray-800 dark:text-white">
                    Bank Account Details
                  </h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Account Holder Name
                    </label>
                    <input
                      type="text"
                      value={accountHolder}
                      onChange={(e) => setAccountHolder(e.target.value)}
                      placeholder="Enter account holder name"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Bank Account Number
                    </label>
                    <input
                      type="text"
                      value={bankAccount}
                      onChange={(e) => setBankAccount(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="Enter bank account number"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      IFSC Code
                    </label>
                    <input
                      type="text"
                      value={ifscCode}
                      onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                      placeholder="Enter IFSC code"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Bank Name
                    </label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="Enter bank name"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Fee Information */}
                {amount && (
                  <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-4">
                    <div className="flex items-start space-x-2">
                      <InformationCircleIcon className="w-5 h-5 text-orange-600 dark:text-orange-400 mt-0.5" />
                      <div className="text-sm text-orange-800 dark:text-orange-200">
                        <p className="font-medium">Transaction Summary</p>
                        <div className="mt-2 space-y-1">
                          <div className="flex justify-between">
                            <span>Withdrawal Amount:</span>
                            <span>₹{parseFloat(amount).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Processing Fee:</span>
                            <span>₹{withdrawDetails.processingFee || 0}</span>
                          </div>
                          <div className="flex justify-between font-semibold border-t border-orange-200 dark:border-orange-700 pt-1">
                            <span>Total Deducted:</span>
                            <span>₹{totalAmount.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Validation Status */}
                {amount && (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm">
                      <div className={`w-3 h-3 rounded-full ${isValidAmount() ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <span className={isValidAmount() ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                        {isValidAmount() ? 'Amount is valid' : 'Amount must be between ₹100-₹50,000 and within your balance'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <div className={`w-3 h-3 rounded-full ${isValidBankDetails() ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <span className={isValidBankDetails() ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                        {isValidBankDetails() ? 'Bank details are valid' : 'Please fill all bank details correctly'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Withdraw Button */}
                <motion.button
                  onClick={() => {
                    console.log('Button clicked - Validation status:', {
                      isValidAmount: isValidAmount(),
                      isValidBankDetails: isValidBankDetails(),
                      isLoading,
                      amount,
                      withdrawDetails
                    });
                    handleInitiateWithdraw();
                  }}
                  disabled={!isValidAmount() || !isValidBankDetails() || isLoading}
                  className={`w-full py-4 px-6 rounded-xl font-semibold text-lg shadow-lg transition-all duration-200 ${
                    !isValidAmount() || !isValidBankDetails() || isLoading
                      ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                      : 'bg-gradient-to-r from-red-600 to-orange-600 text-white hover:from-red-700 hover:to-orange-700'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Processing...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-2">
                      <ArrowUpIcon className="w-5 h-5" />
                      <span>Withdraw arbINR</span>
                    </div>
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div {...fadeInUp} className="space-y-8">
            {/* Confirmation */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl border border-gray-200 dark:border-gray-700">
              <div className="text-center space-y-6">
                <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center mx-auto">
                  <ExclamationTriangleIcon className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                </div>
                
                <div>
                  <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                    Confirm Withdrawal
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Your withdrawal will be processed through Razorpay
                  </p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 text-left">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Transaction ID:</span>
                      <span className="font-mono text-sm">{transactionId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Amount:</span>
                      <span className="font-semibold">₹{parseFloat(amount).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Processing Fee:</span>
                      <span>₹{withdrawDetails.processingFee || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Bank Account:</span>
                      <span className="font-mono text-sm">****{bankAccount.slice(-4)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">IFSC Code:</span>
                      <span className="font-mono text-sm">{ifscCode}</span>
                    </div>
                    <div className="flex justify-between border-t border-gray-200 dark:border-gray-600 pt-3 font-semibold">
                      <span>Total Deducted:</span>
                      <span>₹{totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Debug Info */}
                {payoutOrder && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4 text-sm">
                    <p className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">Debug Info:</p>
                    <p className="text-yellow-700 dark:text-yellow-300">Payout Order: {JSON.stringify(payoutOrder, null, 2)}</p>
                    <p className="text-yellow-700 dark:text-yellow-300">Razorpay Loaded: {typeof (window as any).Razorpay !== 'undefined' ? 'Yes' : 'No'}</p>
                  </div>
                )}

                <div className="flex space-x-4">
                  <motion.button
                    onClick={() => setStep(1)}
                    className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white py-3 px-6 rounded-xl font-semibold transition-colors hover:bg-gray-300 dark:hover:bg-gray-600"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Back
                  </motion.button>
                  <motion.button
                    onClick={() => {
                      console.log('Confirm withdrawal button clicked');
                      console.log('Payout order:', payoutOrder);
                      console.log('Razorpay available:', typeof (window as any).Razorpay !== 'undefined');
                      
                      if (!payoutOrder) {
                        alert('Payout order not available. Please try again.');
                        return;
                      }
                      
                      // For now, simulate successful payout confirmation
                      // In a real implementation, this would integrate with Razorpay's payout API
                      const mockPayoutId = `payout_${Date.now()}`;
                      const mockSignature = `signature_${Math.random().toString(36).substr(2, 9)}`;
                      
                      handleConfirmWithdrawal(mockPayoutId, mockSignature);
                    }}
                    disabled={isLoading || !payoutOrder}
                    className="flex-1 bg-gradient-to-r from-red-600 to-orange-600 text-white py-3 px-6 rounded-xl font-semibold shadow-lg disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 hover:from-red-700 hover:to-orange-700"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Processing...</span>
                      </div>
                    ) : (
                      "Confirm Withdrawal"
                    )}
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div {...fadeInUp} className="space-y-8">
            {/* Success */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl border border-gray-200 dark:border-gray-700">
              <div className="text-center space-y-6">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircleIcon className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                
                <div>
                  <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                    Withdrawal Submitted!
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Your withdrawal request has been submitted successfully
                  </p>
                </div>

                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6">
                  <div className="text-sm text-green-800 dark:text-green-200">
                    <p className="font-medium mb-2">What happens next?</p>
                    <ul className="space-y-1 text-left">
                      <li>• Your withdrawal is being processed</li>
                      <li>• Funds will be transferred to your bank account within 1-2 business days</li>
                      <li>• You&apos;ll receive a confirmation once the transfer is complete</li>
                      <li>• Transaction ID: <span className="font-mono">{transactionId}</span></li>
                    </ul>
                  </div>
                </div>

                <motion.button
                  onClick={() => router.push('/dashboard')}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-6 rounded-xl font-semibold shadow-lg transition-all duration-200 hover:from-blue-700 hover:to-indigo-700"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Back to Dashboard
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
