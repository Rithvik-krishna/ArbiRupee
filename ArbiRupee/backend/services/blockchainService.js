// services/blockchainService.js - Real blockchain integration for ArbiRupee
const { ethers } = require('ethers');

// Real ArbINR contract ABI (update with actual deployed contract ABI)
const arbINRABI = [
  "function mint(address to, uint256 amount) external",
  "function burn(address from, uint256 amount) external", 
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function balanceOf(address account) external view returns (uint256)",
  "function totalSupply() external view returns (uint256)",
  "function decimals() external view returns (uint8)",
  "function name() external view returns (string)",
  "function symbol() external view returns (string)",
  "function owner() external view returns (address)",
  "function paused() external view returns (bool)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Mint(address indexed to, uint256 amount)",
  "event Burn(address indexed from, uint256 amount)"
];

class BlockchainService {
  constructor() {
    // Blockchain configuration
    this.arbitrumRpcUrl = process.env.ARBITRUM_RPC_URL || 'https://arb1.arbitrum.io/rpc';
    this.arbitrumSepoliaRpcUrl = process.env.ARBITRUM_SEPOLIA_RPC_URL || 'https://sepolia-rollup.arbitrum.io/rpc';
    this.privateKey = process.env.PRIVATE_KEY;
    this.arbINRContractAddress = process.env.ARBINR_CONTRACT_ADDRESS;
    
    // Initialize blockchain connections
    this.provider = null;
    this.wallet = null;
    this.arbINRContract = null;
    this.initialized = false;
    this.network = process.env.NETWORK || 'mainnet'; // mainnet or testnet
  }

  async initialize() {
    try {
      if (!this.arbINRContractAddress) {
        throw new Error('ArbINR contract address not configured');
      }

      if (!this.privateKey) {
        throw new Error('Private key not configured');
      }

      // Initialize provider based on network
      const rpcUrl = this.network === 'mainnet' ? this.arbitrumRpcUrl : this.arbitrumSepoliaRpcUrl;
      this.provider = new ethers.JsonRpcProvider(rpcUrl);
      
      // Initialize wallet
      this.wallet = new ethers.Wallet(this.privateKey, this.provider);
      
      // Initialize contract
      this.arbINRContract = new ethers.Contract(
        this.arbINRContractAddress,
        arbINRABI,
        this.wallet
      );

      // Verify contract connection
      const contractName = await this.arbINRContract.name();
      const contractSymbol = await this.arbINRContract.symbol();
      const contractDecimals = await this.arbINRContract.decimals();

      this.initialized = true;
      console.log(`✅ Blockchain Service initialized successfully`);
      console.log(`📄 Contract: ${contractName} (${contractSymbol}) - ${contractDecimals} decimals`);
      console.log(`🌐 Network: ${this.network}`);
      console.log(`📍 Contract Address: ${this.arbINRContractAddress}`);
      console.log(`👤 Wallet Address: ${this.wallet.address}`);

      return true;
    } catch (error) {
      console.error('❌ Blockchain Service initialization failed:', error);
      this.initialized = false;
      return false;
    }
  }

  // Get real token balance from blockchain
  async getTokenBalance(walletAddress) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      if (!ethers.isAddress(walletAddress)) {
        throw new Error('Invalid wallet address');
      }

      const balance = await this.arbINRContract.balanceOf(walletAddress);
      const decimals = await this.arbINRContract.decimals();
      const formattedBalance = parseFloat(ethers.formatUnits(balance, decimals));

      console.log(`💰 Real balance for ${walletAddress}: ${formattedBalance} arbINR`);
      return formattedBalance;

    } catch (error) {
      console.error('❌ Get token balance error:', error);
      throw new Error(`Failed to get token balance: ${error.message}`);
    }
  }

  // Mint tokens (real blockchain transaction)
  async mintTokens(toAddress, amount, transactionId) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      if (!ethers.isAddress(toAddress)) {
        throw new Error('Invalid recipient address');
      }

      const decimals = await this.arbINRContract.decimals();
      const amountInWei = ethers.parseUnits(amount.toString(), decimals);

      console.log(`🏭 Minting ${amount} arbINR to ${toAddress}...`);

      // Estimate gas
      const gasEstimate = await this.arbINRContract.mint.estimateGas(toAddress, amountInWei);
      const gasPrice = await this.provider.getFeeData();

      // Execute mint transaction
      const tx = await this.arbINRContract.mint(toAddress, amountInWei, {
        gasLimit: gasEstimate * 120n / 100n, // Add 20% buffer
        gasPrice: gasPrice.gasPrice
      });

      console.log(`⏳ Transaction submitted: ${tx.hash}`);

      // Wait for confirmation
      const receipt = await tx.wait();
      
      if (receipt.status === 1) {
        console.log(`✅ Mint successful - TxHash: ${tx.hash}, Block: ${receipt.blockNumber}`);
        
        return {
          success: true,
          txHash: tx.hash,
          blockNumber: receipt.blockNumber,
          gasUsed: receipt.gasUsed.toString(),
          gasPrice: tx.gasPrice?.toString(),
          amount: amount
        };
      } else {
        throw new Error('Transaction failed');
      }

    } catch (error) {
      console.error('❌ Mint tokens error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Burn tokens (real blockchain transaction)
  async burnTokens(fromAddress, amount, transactionId) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      if (!ethers.isAddress(fromAddress)) {
        throw new Error('Invalid address');
      }

      const decimals = await this.arbINRContract.decimals();
      const amountInWei = ethers.parseUnits(amount.toString(), decimals);

      console.log(`🔥 Burning ${amount} arbINR from ${fromAddress}...`);

      // Estimate gas
      const gasEstimate = await this.arbINRContract.burn.estimateGas(fromAddress, amountInWei);
      const gasPrice = await this.provider.getFeeData();

      // Execute burn transaction
      const tx = await this.arbINRContract.burn(fromAddress, amountInWei, {
        gasLimit: gasEstimate * 120n / 100n, // Add 20% buffer
        gasPrice: gasPrice.gasPrice
      });

      console.log(`⏳ Transaction submitted: ${tx.hash}`);

      // Wait for confirmation
      const receipt = await tx.wait();
      
      if (receipt.status === 1) {
        console.log(`✅ Burn successful - TxHash: ${tx.hash}, Block: ${receipt.blockNumber}`);
        
        return {
          success: true,
          txHash: tx.hash,
          blockNumber: receipt.blockNumber,
          gasUsed: receipt.gasUsed.toString(),
          gasPrice: tx.gasPrice?.toString(),
          amount: amount
        };
      } else {
        throw new Error('Transaction failed');
      }

    } catch (error) {
      console.error('❌ Burn tokens error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Transfer tokens (real blockchain transaction)
  async transferTokens(fromAddress, toAddress, amount, transactionId) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      if (!ethers.isAddress(fromAddress) || !ethers.isAddress(toAddress)) {
        throw new Error('Invalid address');
      }

      const decimals = await this.arbINRContract.decimals();
      const amountInWei = ethers.parseUnits(amount.toString(), decimals);

      console.log(`💸 Transferring ${amount} arbINR from ${fromAddress} to ${toAddress}...`);

      // For transfers, we need to use a different approach since we can't directly call transfer
      // from another address. This would typically be done through a user's wallet.
      // For now, we'll simulate this by checking if the fromAddress has sufficient balance
      const balance = await this.getTokenBalance(fromAddress);
      if (balance < amount) {
        throw new Error('Insufficient balance for transfer');
      }

      // In a real implementation, this would be handled by the user's wallet
      // For now, we'll return a success response indicating the transfer is ready
      return {
        success: true,
        message: 'Transfer initiated - requires user wallet signature',
        fromAddress,
        toAddress,
        amount,
        transactionId
      };

    } catch (error) {
      console.error('❌ Transfer tokens error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get contract information
  async getContractInfo() {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const name = await this.arbINRContract.name();
      const symbol = await this.arbINRContract.symbol();
      const decimals = await this.arbINRContract.decimals();
      const totalSupply = await this.arbINRContract.totalSupply();
      const owner = await this.arbINRContract.owner();
      const paused = await this.arbINRContract.paused();

      const network = await this.provider.getNetwork();

      return {
        address: this.arbINRContractAddress,
        name,
        symbol,
        decimals: decimals.toString(),
        totalSupply: ethers.formatUnits(totalSupply, decimals),
        owner,
        paused,
        network: network.name,
        chainId: network.chainId.toString()
      };

    } catch (error) {
      console.error('❌ Get contract info error:', error);
      throw new Error(`Failed to get contract information: ${error.message}`);
    }
  }

  // Get transaction details from blockchain
  async getTransactionDetails(txHash) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const tx = await this.provider.getTransaction(txHash);
      const receipt = await this.provider.getTransactionReceipt(txHash);

      if (!tx || !receipt) {
        throw new Error('Transaction not found');
      }

      return {
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value: tx.value.toString(),
        gasLimit: tx.gasLimit.toString(),
        gasPrice: tx.gasPrice?.toString(),
        nonce: tx.nonce,
        blockNumber: receipt.blockNumber,
        blockHash: receipt.blockHash,
        transactionIndex: receipt.index,
        gasUsed: receipt.gasUsed.toString(),
        status: receipt.status,
        logs: receipt.logs
      };

    } catch (error) {
      console.error('❌ Get transaction details error:', error);
      throw new Error(`Failed to get transaction details: ${error.message}`);
    }
  }

  // Get recent contract events
  async getRecentEvents(eventName = 'Transfer', fromBlock = 'latest', toBlock = 'latest') {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const filter = this.arbINRContract.filters[eventName]();
      const events = await this.arbINRContract.queryFilter(filter, fromBlock, toBlock);

      return events.map(event => ({
        transactionHash: event.transactionHash,
        blockNumber: event.blockNumber,
        logIndex: event.logIndex,
        event: eventName,
        args: event.args
      }));

    } catch (error) {
      console.error('❌ Get recent events error:', error);
      throw new Error(`Failed to get recent events: ${error.message}`);
    }
  }

  // Estimate gas for transaction
  async estimateGas(operation, params) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      let gasEstimate;
      const gasPrice = await this.provider.getFeeData();

      switch (operation) {
        case 'mint':
          gasEstimate = await this.arbINRContract.mint.estimateGas(params.to, params.amount);
          break;
        case 'burn':
          gasEstimate = await this.arbINRContract.burn.estimateGas(params.from, params.amount);
          break;
        case 'transfer':
          gasEstimate = await this.arbINRContract.transfer.estimateGas(params.to, params.amount);
          break;
        default:
          throw new Error('Unknown operation');
      }

      return {
        gasEstimate: gasEstimate.toString(),
        gasPrice: gasPrice.gasPrice?.toString(),
        estimatedCost: (gasEstimate * gasPrice.gasPrice).toString()
      };

    } catch (error) {
      console.error('❌ Estimate gas error:', error);
      throw new Error(`Failed to estimate gas: ${error.message}`);
    }
  }

  // Validate wallet address
  isValidAddress(address) {
    return ethers.isAddress(address);
  }

  // Convert amount to Wei
  toWei(amount, decimals = 18) {
    return ethers.parseUnits(amount.toString(), decimals);
  }

  // Convert Wei to Ether
  fromWei(amount, decimals = 18) {
    return ethers.formatUnits(amount, decimals);
  }
}

// Create singleton instance
const blockchainService = new BlockchainService();

module.exports = {
  blockchainService
};
