// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./ArbINR.sol";

/**
 * @title MintBurnController
 * @dev Controller contract for minting and burning arbINR tokens
 * @notice This contract handles the fiat-to-crypto on-ramp and off-ramp logic
 */
contract MintBurnController is Ownable, Pausable, ReentrancyGuard {
    // Events
    event DepositProcessed(
        address indexed user,
        uint256 amount,
        string transactionId,
        string bankReference
    );
    event WithdrawalProcessed(
        address indexed user,
        uint256 amount,
        string transactionId,
        string bankReference
    );
    event KycVerified(address indexed user, bool verified);
    event AmlChecked(address indexed user, bool passed);

    // State variables
    ArbINR public arbINR;
    mapping(address => bool) public kycVerified;
    mapping(address => bool) public amlPassed;
    mapping(string => bool) public processedTransactions;
    mapping(address => uint256) public userDepositLimits;
    mapping(address => uint256) public userWithdrawalLimits;
    
    uint256 public constant DAILY_DEPOSIT_LIMIT = 100_000 * 10**2; // ₹100,000 per day
    uint256 public constant DAILY_WITHDRAWAL_LIMIT = 50_000 * 10**2; // ₹50,000 per day
    uint256 public constant MIN_DEPOSIT = 100 * 10**2; // ₹100 minimum
    uint256 public constant MIN_WITHDRAWAL = 50 * 10**2; // ₹50 minimum

    // Modifiers
    modifier onlyKycVerified(address user) {
        require(kycVerified[user], "MintBurnController: KYC not verified");
        _;
    }

    modifier onlyAmlPassed(address user) {
        require(amlPassed[user], "MintBurnController: AML check failed");
        _;
    }

    modifier validTransaction(string memory transactionId) {
        require(!processedTransactions[transactionId], "MintBurnController: Transaction already processed");
        _;
    }

    constructor(address _arbINR) {
        arbINR = ArbINR(_arbINR);
    }

    /**
     * @dev Process INR deposit and mint arbINR tokens
     * @param user Address to receive the tokens
     * @param amount Amount of INR deposited (in paise, e.g., 10000 = ₹100.00)
     * @param transactionId Unique transaction identifier
     * @param bankReference Bank transaction reference
     */
    function processDeposit(
        address user,
        uint256 amount,
        string memory transactionId,
        string memory bankReference
    ) external onlyOwner whenNotPaused nonReentrant validTransaction(transactionId) {
        require(user != address(0), "MintBurnController: Invalid user address");
        require(amount >= MIN_DEPOSIT, "MintBurnController: Amount below minimum");
        require(
            amount <= userDepositLimits[user] || userDepositLimits[user] == 0,
            "MintBurnController: Exceeds daily deposit limit"
        );

        // Mark transaction as processed
        processedTransactions[transactionId] = true;

        // Update user's daily limit (simplified - in production, use time-based tracking)
        if (userDepositLimits[user] > 0) {
            userDepositLimits[user] -= amount;
        }

        // Mint arbINR tokens
        arbINR.mint(user, amount, transactionId);

        emit DepositProcessed(user, amount, transactionId, bankReference);
    }

    /**
     * @dev Process arbINR withdrawal and burn tokens
     * @param user Address to burn tokens from
     * @param amount Amount of arbINR to withdraw (in paise)
     * @param transactionId Unique transaction identifier
     * @param bankReference Bank account for withdrawal
     */
    function processWithdrawal(
        address user,
        uint256 amount,
        string memory transactionId,
        string memory bankReference
    ) external onlyOwner whenNotPaused nonReentrant validTransaction(transactionId) {
        require(user != address(0), "MintBurnController: Invalid user address");
        require(amount >= MIN_WITHDRAWAL, "MintBurnController: Amount below minimum");
        require(
            amount <= userWithdrawalLimits[user] || userWithdrawalLimits[user] == 0,
            "MintBurnController: Exceeds daily withdrawal limit"
        );
        require(arbINR.balanceOf(user) >= amount, "MintBurnController: Insufficient balance");

        // Mark transaction as processed
        processedTransactions[transactionId] = true;

        // Update user's daily limit (simplified - in production, use time-based tracking)
        if (userWithdrawalLimits[user] > 0) {
            userWithdrawalLimits[user] -= amount;
        }

        // Burn arbINR tokens
        arbINR.burn(user, amount, transactionId);

        emit WithdrawalProcessed(user, amount, transactionId, bankReference);
    }

    /**
     * @dev Verify KYC for a user
     * @param user Address to verify
     * @param verified Whether KYC is verified
     */
    function setKycVerified(address user, bool verified) external onlyOwner {
        kycVerified[user] = verified;
        emit KycVerified(user, verified);
    }

    /**
     * @dev Set AML check result for a user
     * @param user Address to check
     * @param passed Whether AML check passed
     */
    function setAmlPassed(address user, bool passed) external onlyOwner {
        amlPassed[user] = passed;
        emit AmlChecked(user, passed);
    }

    /**
     * @dev Set daily deposit limit for a user
     * @param user Address to set limit for
     * @param limit Daily deposit limit in paise
     */
    function setUserDepositLimit(address user, uint256 limit) external onlyOwner {
        userDepositLimits[user] = limit;
    }

    /**
     * @dev Set daily withdrawal limit for a user
     * @param user Address to set limit for
     * @param limit Daily withdrawal limit in paise
     */
    function setUserWithdrawalLimit(address user, uint256 limit) external onlyOwner {
        userWithdrawalLimits[user] = limit;
    }

    /**
     * @dev Get user compliance status
     * @param user Address to check
     * @return kyc Whether KYC is verified
     * @return aml Whether AML check passed
     * @return depositLimit Remaining daily deposit limit
     * @return withdrawalLimit Remaining daily withdrawal limit
     */
    function getUserCompliance(address user) external view returns (
        bool kyc,
        bool aml,
        uint256 depositLimit,
        uint256 withdrawalLimit
    ) {
        return (
            kycVerified[user],
            amlPassed[user],
            userDepositLimits[user],
            userWithdrawalLimits[user]
        );
    }

    /**
     * @dev Pause the contract in case of emergency
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause the contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }
}
