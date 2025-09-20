'use client';

import { motion } from 'framer-motion';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useBalance } from 'wagmi';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { 
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowsRightLeftIcon,
  ChartBarIcon,
  TrophyIcon,
  EyeIcon,
  EyeSlashIcon,
  PlusIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import ArbiRupeeLogo from '@/components/ArbiRupeeLogo';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

interface Transaction {
  id: string;
  type: 'deposit' | 'withdraw' | 'transfer';
  amount: string;
  status: 'pending' | 'completed' | 'failed';
  timestamp: Date | string | null;
  from?: string;
  to?: string;
}

export default function Dashboard() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [arbINRBalance, setArbINRBalance] = useState(0);
  const [isBalanceLoading, setIsBalanceLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [usdValue, setUsdValue] = useState('0.00');
  const [inrValue, setInrValue] = useState('0');
  const [totalEarned, setTotalEarned] = useState('0.00');
  const [rewardsPoints, setRewardsPoints] = useState(0);
  const [isDataLoading, setIsDataLoading] = useState(true);

  useEffect(() => {
    if (!isConnected) {
      router.push('/');
    } else {
      setIsDataLoading(true);
      fetchUserBalance();
      fetchTransactions();
      fetchUserStats();
    }
  }, [isConnected, router, address]);

  const fetchUserBalance = async () => {
    try {
      setIsBalanceLoading(true);
      const response = await fetch(`http://localhost:5000/api/contracts/balance/${address}`);
      if (response.ok) {
        const data = await response.json();
        setArbINRBalance(data.data.balance);
        setInrValue(data.data.balance.toFixed(2));
        setUsdValue(data.data.usdValue || '0.00');
      }
    } catch (error) {
      console.error('Failed to fetch balance:', error);
      setArbINRBalance(0);
      setInrValue('0');
      setUsdValue('0.00');
    } finally {
      setIsBalanceLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/transactions?limit=5`, {
        headers: {
          'x-wallet-address': address || '',
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data.transactions) {
          // Transform transactions to ensure proper timestamp handling
          const transformedTransactions = data.data.transactions.map((tx: any) => ({
            ...tx,
            timestamp: tx.timestamp || tx.createdAt || new Date().toISOString()
          }));
          setTransactions(transformedTransactions);
        } else {
          setTransactions([]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
      setTransactions([]);
    }
  };

  const fetchUserStats = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/transactions/user/stats`, {
        headers: {
          'x-wallet-address': address || '',
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data.userStats) {
          setTotalEarned(data.data.userStats.totalEarned || '0.00');
          setRewardsPoints(data.data.userStats.rewardsPoints || 0);
        }
      }
    } catch (error) {
      console.error('Failed to fetch user stats:', error);
      setTotalEarned('0.00');
      setRewardsPoints(0);
    } finally {
      setIsDataLoading(false);
    }
  };

  useEffect(() => {
    if (!isConnected) {
      router.push('/');
    }
  }, [isConnected, router]);

  if (!isConnected) {
    return null;
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="w-4 h-4 text-green-500" />;
      case 'pending':
        return <ClockIcon className="w-4 h-4 text-yellow-500" />;
      case 'failed':
        return <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <ArrowDownIcon className="w-4 h-4 text-green-500" />;
      case 'withdraw':
        return <ArrowUpIcon className="w-4 h-4 text-red-500" />;
      case 'transfer':
        return <ArrowsRightLeftIcon className="w-4 h-4 text-blue-500" />;
      default:
        return null;
    }
  };

  const formatAddress = (addr: string | undefined) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const formatTime = (date: Date | string | undefined | null) => {
    if (!date) {
      return 'Unknown';
    }
    
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(dateObj.getTime())) {
        return 'Invalid date';
      }
      
      const now = new Date();
      const diff = now.getTime() - dateObj.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor(diff / (1000 * 60));
      
      if (hours > 0) {
        return `${hours}h ago`;
      } else if (minutes > 0) {
        return `${minutes}m ago`;
      } else {
        return 'Just now';
      }
    } catch (error) {
      return 'Invalid date';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900">
      {/* Navigation */}
      <nav className="flex items-center justify-between p-6 mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center space-x-2 cursor-pointer"
          onClick={() => router.push('/')}
        >
          <ArbiRupeeLogo variant="icon" width={32} height={32} />
          <span className="text-2xl font-bold text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text">
            ArbiRupee
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center space-x-4"
        >
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {formatAddress(address)}
          </div>
          <ConnectButton showBalance={false} />
        </motion.div>
      </nav>

      <div className="px-6 py-8 mx-auto max-w-7xl">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="mb-2 text-3xl font-bold text-gray-900 md:text-4xl dark:text-white">
            Welcome to Your Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your arbINR balance and explore DeFi opportunities
          </p>
        </motion.div>

        {/* Balance Cards */}
        <motion.div
          className="grid gap-6 mb-8 md:grid-cols-3"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          {/* Main Balance Card */}
          <motion.div
            variants={fadeInUp}
            className="p-6 border shadow-lg md:col-span-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border-white/20"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="mb-1 text-lg font-semibold text-gray-700 dark:text-gray-300">
                  Wallet Balance
                </h3>
                <div className="flex items-center space-x-2">
                  {balanceVisible ? (
                    <div className="text-3xl font-bold text-gray-900 md:text-4xl dark:text-white">
                      {isBalanceLoading ? (
                        <div className="animate-pulse">•••••</div>
                      ) : (
                        <>
                          {arbINRBalance.toFixed(2)} <span className="text-lg text-blue-600">arbINR</span>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="text-3xl font-bold text-gray-900 md:text-4xl dark:text-white">
                      ••••• <span className="text-lg text-blue-600">arbINR</span>
                    </div>
                  )}
                  <button
                    onClick={() => setBalanceVisible(!balanceVisible)}
                    className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    {balanceVisible ? (
                      <EyeSlashIcon className="w-5 h-5" />
                    ) : (
                      <EyeIcon className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {balanceVisible && (
                  <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    ≈ ₹{inrValue} INR • ${usdValue} USD
                  </div>
                )}
              </div>
              <ArbiRupeeLogo variant="icon" width={48} height={48} />
            </div>
            
            <div className="grid grid-cols-3 gap-4 mt-6">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push('/deposit')}
                className="flex flex-col items-center p-4 transition-colors bg-green-50 dark:bg-green-900/20 rounded-xl hover:bg-green-100 dark:hover:bg-green-900/30"
              >
                <ArrowDownIcon className="w-5 h-5 mb-2 text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium text-green-700 dark:text-green-300">Deposit</span>
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push('/withdraw')}
                className="flex flex-col items-center p-4 transition-colors bg-red-50 dark:bg-red-900/20 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30"
              >
                <ArrowUpIcon className="w-5 h-5 mb-2 text-red-600 dark:text-red-400" />
                <span className="text-sm font-medium text-red-700 dark:text-red-300">Withdraw</span>
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push('/transfer')}
                className="flex flex-col items-center p-4 transition-colors bg-blue-50 dark:bg-blue-900/20 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/30"
              >
                <ArrowsRightLeftIcon className="w-5 h-5 mb-2 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Transfer</span>
              </motion.button>
            </div>
          </motion.div>

          {/* Quick Stats */}
          <motion.div
            variants={fadeInUp}
            className="space-y-4"
          >
            <div className="p-6 border shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Earned</h4>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {isDataLoading ? '•••••' : `₹${totalEarned}`}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">From DeFi activities</p>
                </div>
                <ChartBarIcon className="w-8 h-8 text-green-500" />
              </div>
            </div>
            
            <div className="p-6 border shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Rewards Points</h4>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {isDataLoading ? '•••••' : rewardsPoints.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {rewardsPoints >= 1000 ? 'Gold tier' : rewardsPoints >= 500 ? 'Silver tier' : 'Bronze tier'}
                  </p>
                </div>
                <TrophyIcon className="w-8 h-8 text-purple-500" />
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* DeFi Integration */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <h2 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">DeFi Opportunities</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="p-6 border shadow-lg cursor-pointer bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border-white/20"
              onClick={() => router.push('/defi/uniswap')}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                    Uniswap Pool
                  </h3>
                  <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">
                    Provide liquidity to arbINR/USDC pool
                  </p>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    12.5% APY
                  </div>
                </div>
                <div className="flex items-center justify-center w-12 h-12 bg-pink-100 dark:bg-pink-900/20 rounded-xl">
                  <PlusIcon className="w-6 h-6 text-pink-600 dark:text-pink-400" />
                </div>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Your Position: ₹0 • Available: ₹{inrValue}
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="p-6 border shadow-lg cursor-pointer bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border-white/20"
              onClick={() => router.push('/defi/aave')}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                    Aave Lending
                  </h3>
                  <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">
                    Lend your arbINR and earn interest
                  </p>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    8.7% APY
                  </div>
                </div>
                <div className="flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-xl">
                  <ChartBarIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Your Position: ₹0 • Available: ₹{inrValue}
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Recent Transactions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Recent Activity</h2>
            <button className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
              View All
            </button>
          </div>
          
          <div className="overflow-hidden border shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border-white/20">
            {transactions.map((tx, index) => (
              <motion.div
                key={tx.id || `tx-${index}-${tx.type}-${tx.amount}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
                className="flex items-center justify-between p-4 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-700/50"
              >
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-full dark:bg-gray-700">
                    {getTypeIcon(tx.type)}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium text-gray-900 capitalize dark:text-white">
                        {tx.type}
                      </h4>
                      {getStatusIcon(tx.status)}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {tx.type === 'transfer' && tx.to && `To ${formatAddress(tx.to)}`}
                      {tx.type === 'deposit' && 'From Bank Account'}
                      {tx.type === 'withdraw' && 'To Bank Account'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${
                    tx.type === 'deposit' ? 'text-green-600 dark:text-green-400' : 
                    tx.type === 'withdraw' ? 'text-red-600 dark:text-red-400' : 
                    'text-blue-600 dark:text-blue-400'
                  }`}>
                    {tx.type === 'deposit' ? '+' : '-'}{tx.amount} arbINR
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {formatTime(tx.timestamp)}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
