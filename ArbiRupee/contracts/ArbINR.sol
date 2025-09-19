// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title ArbINR
 * @dev ERC-20 token representing Indian Rupee on Arbitrum
 * @notice This token is pegged 1:1 with INR and can only be minted/burned by authorized contracts
 */
contract ArbINR is ERC20, Ownable, Pausable, ReentrancyGuard {
    // Events
    event Mint(address indexed to, uint256 amount, string transactionId);
    event Burn(address indexed from, uint256 amount, string transactionId);
    event AuthorizedMinterUpdated(address indexed minter, bool authorized);
    event AuthorizedBurnerUpdated(address indexed burner, bool authorized);

    // State variables
    mapping(address => bool) public authorizedMinters;
    mapping(address => bool) public authorizedBurners;
    uint256 public constant MAX_SUPPLY = 100_000_000 * 10**18; // 100M arbINR max supply
    uint256 public totalMinted;
    uint256 public totalBurned;

    // Modifiers
    modifier onlyAuthorizedMinter() {
        require(authorizedMinters[msg.sender], "ArbINR: Not authorized to mint");
        _;
    }

    modifier onlyAuthorizedBurner() {
        require(authorizedBurners[msg.sender], "ArbINR: Not authorized to burn");
        _;
    }

    constructor() ERC20("Arbitrum Indian Rupee", "arbINR") {
        // Set initial authorized addresses (will be updated after deployment)
        authorizedMinters[msg.sender] = true;
        authorizedBurners[msg.sender] = true;
    }

    /**
     * @dev Mint new arbINR tokens (only for authorized minters)
     * @param to Address to receive the tokens
     * @param amount Amount of tokens to mint (in wei)
     * @param transactionId Unique transaction identifier for tracking
     */
    function mint(
        address to,
        uint256 amount,
        string memory transactionId
    ) external onlyAuthorizedMinter whenNotPaused nonReentrant {
        require(to != address(0), "ArbINR: Cannot mint to zero address");
        require(amount > 0, "ArbINR: Amount must be greater than zero");
        require(
            totalSupply() + amount <= MAX_SUPPLY,
            "ArbINR: Would exceed max supply"
        );

        totalMinted += amount;
        _mint(to, amount);
        
        emit Mint(to, amount, transactionId);
    }

    /**
     * @dev Burn arbINR tokens (only for authorized burners)
     * @param from Address to burn tokens from
     * @param amount Amount of tokens to burn (in wei)
     * @param transactionId Unique transaction identifier for tracking
     */
    function burn(
        address from,
        uint256 amount,
        string memory transactionId
    ) external onlyAuthorizedBurner whenNotPaused nonReentrant {
        require(from != address(0), "ArbINR: Cannot burn from zero address");
        require(amount > 0, "ArbINR: Amount must be greater than zero");
        require(balanceOf(from) >= amount, "ArbINR: Insufficient balance");

        totalBurned += amount;
        _burn(from, amount);
        
        emit Burn(from, amount, transactionId);
    }

    /**
     * @dev Authorize a contract to mint tokens
     * @param minter Address to authorize for minting
     * @param authorized Whether to authorize or revoke authorization
     */
    function setAuthorizedMinter(address minter, bool authorized) external onlyOwner {
        authorizedMinters[minter] = authorized;
        emit AuthorizedMinterUpdated(minter, authorized);
    }

    /**
     * @dev Authorize a contract to burn tokens
     * @param burner Address to authorize for burning
     * @param authorized Whether to authorize or revoke authorization
     */
    function setAuthorizedBurner(address burner, bool authorized) external onlyOwner {
        authorizedBurners[burner] = authorized;
        emit AuthorizedBurnerUpdated(burner, authorized);
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

    /**
     * @dev Get token statistics
     * @return _totalSupply Current total supply
     * @return _totalMinted Total amount ever minted
     * @return _totalBurned Total amount ever burned
     * @return _maxSupply Maximum possible supply
     */
    function getTokenStats() external view returns (
        uint256 _totalSupply,
        uint256 _totalMinted,
        uint256 _totalBurned,
        uint256 _maxSupply
    ) {
        return (totalSupply(), totalMinted, totalBurned, MAX_SUPPLY);
    }

    /**
     * @dev Override decimals to match INR (2 decimal places)
     */
    function decimals() public view virtual override returns (uint8) {
        return 2;
    }
}
