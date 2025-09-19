// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title ArbINRRewards
 * @dev NFT contract for gamification and rewards in ArbiRupee ecosystem
 * @notice Users earn NFT badges for various activities and milestones
 */
contract ArbINRRewards is ERC721, Ownable, Pausable {
    using Counters for Counters.Counter;
    using Strings for uint256;

    // Events
    event BadgeMinted(address indexed to, uint256 tokenId, BadgeType badgeType);
    event BadgeTypeAdded(BadgeType badgeType, string name, string description, string imageUri);
    event UserMilestoneReached(address indexed user, MilestoneType milestone, uint256 value);

    // Enums
    enum BadgeType {
        FIRST_DEPOSIT,      // 0: First deposit made
        DEPOSIT_1K,         // 1: Deposited ₹1,000+
        DEPOSIT_10K,        // 2: Deposited ₹10,000+
        DEPOSIT_100K,       // 3: Deposited ₹100,000+
        FIRST_SWAP,         // 4: First Uniswap swap
        SWAP_1K,            // 5: Swapped ₹1,000+
        SWAP_10K,           // 6: Swapped ₹10,000+
        FIRST_LEND,         // 7: First Aave lending
        LEND_5K,            // 8: Lent ₹5,000+
        LEND_25K,           // 9: Lent ₹25,000+
        LIQUIDITY_PROVIDER, // 10: Provided liquidity to Uniswap
        POWER_USER,         // 11: 50+ transactions
        WHALE,              // 12: ₹500,000+ total volume
        EARLY_ADOPTER,      // 13: Joined in first month
        LOYAL_CUSTOMER      // 14: 100+ days active
    }

    enum MilestoneType {
        TOTAL_DEPOSITS,
        TOTAL_SWAPS,
        TOTAL_LENDING,
        TOTAL_TRANSACTIONS,
        DAYS_ACTIVE
    }

    // Structs
    struct BadgeInfo {
        string name;
        string description;
        string imageUri;
        bool active;
    }

    struct UserStats {
        uint256 totalDeposits;
        uint256 totalSwaps;
        uint256 totalLending;
        uint256 totalTransactions;
        uint256 daysActive;
        uint256 firstActivityDate;
        mapping(BadgeType => bool) badgesEarned;
    }

    // State variables
    Counters.Counter private _tokenIdCounter;
    mapping(BadgeType => BadgeInfo) public badgeTypes;
    mapping(address => UserStats) public userStats;
    mapping(uint256 => BadgeType) public tokenToBadgeType;
    mapping(address => uint256[]) public userBadges;
    
    string public baseTokenURI;
    uint256 public constant MAX_BADGES_PER_USER = 50;

    // Modifiers
    modifier onlyAuthorized() {
        require(
            msg.sender == owner() || 
            msg.sender == authorizedMinter,
            "ArbINRRewards: Not authorized"
        );
        _;
    }

    // Authorized minter (MintBurnController or other contracts)
    address public authorizedMinter;

    constructor() ERC721("ArbINR Rewards", "ARBINR-BADGE") {
        _initializeBadgeTypes();
    }

    /**
     * @dev Initialize default badge types
     */
    function _initializeBadgeTypes() private {
        badgeTypes[BadgeType.FIRST_DEPOSIT] = BadgeInfo(
            "First Deposit",
            "Welcome to ArbiRupee! You made your first deposit.",
            "https://api.arbirupee.com/badges/first-deposit.png",
            true
        );
        
        badgeTypes[BadgeType.DEPOSIT_1K] = BadgeInfo(
            "Deposit Explorer",
            "You've deposited over ₹1,000 to ArbiRupee.",
            "https://api.arbirupee.com/badges/deposit-1k.png",
            true
        );
        
        badgeTypes[BadgeType.DEPOSIT_10K] = BadgeInfo(
            "Deposit Champion",
            "You've deposited over ₹10,000 to ArbiRupee.",
            "https://api.arbirupee.com/badges/deposit-10k.png",
            true
        );
        
        badgeTypes[BadgeType.DEPOSIT_100K] = BadgeInfo(
            "Deposit Legend",
            "You've deposited over ₹100,000 to ArbiRupee.",
            "https://api.arbirupee.com/badges/deposit-100k.png",
            true
        );
        
        badgeTypes[BadgeType.FIRST_SWAP] = BadgeInfo(
            "DeFi Explorer",
            "You made your first swap on Uniswap!",
            "https://api.arbirupee.com/badges/first-swap.png",
            true
        );
        
        badgeTypes[BadgeType.SWAP_1K] = BadgeInfo(
            "Swap Trader",
            "You've swapped over ₹1,000 on Uniswap.",
            "https://api.arbirupee.com/badges/swap-1k.png",
            true
        );
        
        badgeTypes[BadgeType.SWAP_10K] = BadgeInfo(
            "Swap Master",
            "You've swapped over ₹10,000 on Uniswap.",
            "https://api.arbirupee.com/badges/swap-10k.png",
            true
        );
        
        badgeTypes[BadgeType.FIRST_LEND] = BadgeInfo(
            "Lending Pioneer",
            "You started lending on Aave!",
            "https://api.arbirupee.com/badges/first-lend.png",
            true
        );
        
        badgeTypes[BadgeType.LEND_5K] = BadgeInfo(
            "Lending Enthusiast",
            "You've lent over ₹5,000 on Aave.",
            "https://api.arbirupee.com/badges/lend-5k.png",
            true
        );
        
        badgeTypes[BadgeType.LEND_25K] = BadgeInfo(
            "Lending Expert",
            "You've lent over ₹25,000 on Aave.",
            "https://api.arbirupee.com/badges/lend-25k.png",
            true
        );
        
        badgeTypes[BadgeType.LIQUIDITY_PROVIDER] = BadgeInfo(
            "Liquidity Provider",
            "You provided liquidity to Uniswap pools.",
            "https://api.arbirupee.com/badges/liquidity-provider.png",
            true
        );
        
        badgeTypes[BadgeType.POWER_USER] = BadgeInfo(
            "Power User",
            "You've made 50+ transactions on ArbiRupee.",
            "https://api.arbirupee.com/badges/power-user.png",
            true
        );
        
        badgeTypes[BadgeType.WHALE] = BadgeInfo(
            "Whale",
            "You've transacted over ₹500,000 total volume.",
            "https://api.arbirupee.com/badges/whale.png",
            true
        );
        
        badgeTypes[BadgeType.EARLY_ADOPTER] = BadgeInfo(
            "Early Adopter",
            "You joined ArbiRupee in the first month.",
            "https://api.arbirupee.com/badges/early-adopter.png",
            true
        );
        
        badgeTypes[BadgeType.LOYAL_CUSTOMER] = BadgeInfo(
            "Loyal Customer",
            "You've been active for 100+ days.",
            "https://api.arbirupee.com/badges/loyal-customer.png",
            true
        );
    }

    /**
     * @dev Mint a badge to a user
     * @param to Address to mint badge to
     * @param badgeType Type of badge to mint
     */
    function mintBadge(address to, BadgeType badgeType) external onlyAuthorized {
        require(to != address(0), "ArbINRRewards: Cannot mint to zero address");
        require(badgeTypes[badgeType].active, "ArbINRRewards: Badge type not active");
        require(!userStats[to].badgesEarned[badgeType], "ArbINRRewards: Badge already earned");
        require(userBadges[to].length < MAX_BADGES_PER_USER, "ArbINRRewards: Max badges reached");

        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();

        _safeMint(to, tokenId);
        tokenToBadgeType[tokenId] = badgeType;
        userStats[to].badgesEarned[badgeType] = true;
        userBadges[to].push(tokenId);

        emit BadgeMinted(to, tokenId, badgeType);
    }

    /**
     * @dev Update user statistics and check for milestone badges
     * @param user Address to update
     * @param milestone Type of milestone
     * @param value New value
     */
    function updateUserStats(
        address user,
        MilestoneType milestone,
        uint256 value
    ) external onlyAuthorized {
        require(user != address(0), "ArbINRRewards: Invalid user address");

        UserStats storage stats = userStats[user];
        
        // Set first activity date if not set
        if (stats.firstActivityDate == 0) {
            stats.firstActivityDate = block.timestamp;
        }

        // Update the specific milestone
        if (milestone == MilestoneType.TOTAL_DEPOSITS) {
            stats.totalDeposits = value;
        } else if (milestone == MilestoneType.TOTAL_SWAPS) {
            stats.totalSwaps = value;
        } else if (milestone == MilestoneType.TOTAL_LENDING) {
            stats.totalLending = value;
        } else if (milestone == MilestoneType.TOTAL_TRANSACTIONS) {
            stats.totalTransactions = value;
        } else if (milestone == MilestoneType.DAYS_ACTIVE) {
            stats.daysActive = value;
        }

        // Check for milestone badges
        _checkMilestoneBadges(user, milestone, value);

        emit UserMilestoneReached(user, milestone, value);
    }

    /**
     * @dev Check and award milestone badges
     * @param user Address to check
     * @param milestone Type of milestone
     * @param value Current value
     */
    function _checkMilestoneBadges(
        address user,
        MilestoneType milestone,
        uint256 value
    ) private {
        UserStats storage stats = userStats[user];

        if (milestone == MilestoneType.TOTAL_DEPOSITS) {
            if (value >= 100000 && !stats.badgesEarned[BadgeType.DEPOSIT_1K]) {
                mintBadge(user, BadgeType.DEPOSIT_1K);
            }
            if (value >= 1000000 && !stats.badgesEarned[BadgeType.DEPOSIT_10K]) {
                mintBadge(user, BadgeType.DEPOSIT_10K);
            }
            if (value >= 10000000 && !stats.badgesEarned[BadgeType.DEPOSIT_100K]) {
                mintBadge(user, BadgeType.DEPOSIT_100K);
            }
        } else if (milestone == MilestoneType.TOTAL_SWAPS) {
            if (value >= 100000 && !stats.badgesEarned[BadgeType.SWAP_1K]) {
                mintBadge(user, BadgeType.SWAP_1K);
            }
            if (value >= 1000000 && !stats.badgesEarned[BadgeType.SWAP_10K]) {
                mintBadge(user, BadgeType.SWAP_10K);
            }
        } else if (milestone == MilestoneType.TOTAL_LENDING) {
            if (value >= 500000 && !stats.badgesEarned[BadgeType.LEND_5K]) {
                mintBadge(user, BadgeType.LEND_5K);
            }
            if (value >= 2500000 && !stats.badgesEarned[BadgeType.LEND_25K]) {
                mintBadge(user, BadgeType.LEND_25K);
            }
        } else if (milestone == MilestoneType.TOTAL_TRANSACTIONS) {
            if (value >= 50 && !stats.badgesEarned[BadgeType.POWER_USER]) {
                mintBadge(user, BadgeType.POWER_USER);
            }
        } else if (milestone == MilestoneType.DAYS_ACTIVE) {
            if (value >= 100 && !stats.badgesEarned[BadgeType.LOYAL_CUSTOMER]) {
                mintBadge(user, BadgeType.LOYAL_CUSTOMER);
            }
        }
    }

    /**
     * @dev Set authorized minter address
     * @param minter Address to authorize
     */
    function setAuthorizedMinter(address minter) external onlyOwner {
        authorizedMinter = minter;
    }

    /**
     * @dev Add or update a badge type
     * @param badgeType Type of badge
     * @param name Name of the badge
     * @param description Description of the badge
     * @param imageUri URI for the badge image
     */
    function addBadgeType(
        BadgeType badgeType,
        string memory name,
        string memory description,
        string memory imageUri
    ) external onlyOwner {
        badgeTypes[badgeType] = BadgeInfo(name, description, imageUri, true);
        emit BadgeTypeAdded(badgeType, name, description, imageUri);
    }

    /**
     * @dev Get user's badge information
     * @param user Address to check
     * @return badgeIds Array of badge token IDs
     * @return badgeTypes_ Array of badge types
     */
    function getUserBadges(address user) external view returns (
        uint256[] memory badgeIds,
        BadgeType[] memory badgeTypes_
    ) {
        uint256[] memory badges = userBadges[user];
        badgeIds = badges;
        badgeTypes_ = new BadgeType[](badges.length);
        
        for (uint256 i = 0; i < badges.length; i++) {
            badgeTypes_[i] = tokenToBadgeType[badges[i]];
        }
    }

    /**
     * @dev Get badge information by token ID
     * @param tokenId Token ID to check
     * @return badgeType Type of badge
     * @return name Name of the badge
     * @return description Description of the badge
     * @return imageUri URI for the badge image
     */
    function getBadgeInfo(uint256 tokenId) external view returns (
        BadgeType badgeType,
        string memory name,
        string memory description,
        string memory imageUri
    ) {
        require(_exists(tokenId), "ArbINRRewards: Token does not exist");
        badgeType = tokenToBadgeType[tokenId];
        BadgeInfo memory info = badgeTypes[badgeType];
        return (badgeType, info.name, info.description, info.imageUri);
    }

    /**
     * @dev Override tokenURI to return badge metadata
     * @param tokenId Token ID
     * @return Token metadata URI
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "ArbINRRewards: Token does not exist");
        
        BadgeType badgeType = tokenToBadgeType[tokenId];
        BadgeInfo memory info = badgeTypes[badgeType];
        
        return string(abi.encodePacked(
            '{"name":"', info.name, '",',
            '"description":"', info.description, '",',
            '"image":"', info.imageUri, '",',
            '"attributes":[',
            '{"trait_type":"Badge Type","value":"', uint256(badgeType).toString(), '"}',
            ']}'
        ));
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
