// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";

/**
 * @title CarShares
 * @notice Main ERC-1155 contract for tokenized car ownership
 * @dev Each tokenId represents a unique car with fungible shares
 */
contract CarShares is ERC1155, Ownable, ReentrancyGuard {
    // ============ Structs ============

    struct CarConfig {
        address owner;
        uint256 totalSupply;
        uint256 remainingPublicSupply;
        uint256 pricePerShare;
        uint256 minPrimaryBuy;
        string metadataCID;
        bool primarySaleActive;
        uint256 sharesSold;
    }

    // ============ State Variables ============

    /// @notice Counter for car IDs
    uint256 public nextCarId = 1;

    /// @notice Platform fee in basis points (e.g., 250 = 2.5%)
    uint96 public globalFeeBps = 250; // Default 2.5%

    /// @notice Maximum fee limit (10%)
    uint96 public constant MAX_FEE_BPS = 1000;

    /// @notice Basis points denominator
    uint256 private constant BPS_DENOMINATOR = 10000;

    /// @notice Whether primary sales are globally paused
    bool public primarySalesPaused;

    /// @notice Accumulated platform fees
    uint256 public accumulatedFees;

    /// @notice Mapping from carId to car configuration
    mapping(uint256 => CarConfig) public cars;

    /// @notice ETH deposited by car owners for earnings distribution
    mapping(uint256 => uint256) public carEarningsBalance;

    // ============ Events ============

    event CarCreated(
        uint256 indexed carId,
        address indexed owner,
        uint256 totalSupply,
        uint256 publicSupply,
        uint256 pricePerShare,
        uint256 minPrimaryBuy,
        string metadataCID
    );

    event PrimaryPurchase(
        uint256 indexed carId,
        address indexed buyer,
        uint256 amount,
        uint256 totalCost,
        uint256 fee
    );

    event PriceUpdated(
        uint256 indexed carId,
        uint256 oldPrice,
        uint256 newPrice
    );

    event MetadataUpdated(uint256 indexed carId, string newMetadataCID);

    event PrimarySale(
        uint256 indexed carId,
        address indexed seller,
        uint256 amount
    );
    event PublicSupplyBurned(
        uint256 indexed carId,
        address indexed owner,
        uint256 burned,
        uint256 newTotalSupply
    );

    event GlobalFeeUpdated(uint96 oldFeeBps, uint96 newFeeBps);

    event PrimarySalesPaused(bool paused);

    event FeesWithdrawn(address indexed recipient, uint256 amount);

    event EarningsDeposited(uint256 indexed carId, address indexed depositor, uint256 amount);

    event EarningsDistributed(
        uint256 indexed carId,
        address indexed distributor,
        uint256 totalAmount,
        uint256 shareholderCount
    );

    // ============ Errors ============

    error InvalidCarId();
    error InsufficientPayment();
    error BelowMinimumPurchase();
    error InsufficientPublicSupply();
    error PrimarySalesPausedError();
    error OnlyCarOwner();
    error InvalidFee();
    error NoFeesToWithdraw();
    error TransferFailed();
    error InvalidPublicRatio();
    error InvalidTotalSupply();
    error InvalidPrice();
    error InvalidShareholderData();
    error NoEarningsToDistribute();
    error ShareSumMismatch();

    // ============ Constructor ============

    constructor() ERC1155("") Ownable(msg.sender) {}

    // ============ Car Creation ============

    /**
     * @notice Create a new car with tokenized shares
     * @param totalSupply Total number of shares for this car
     * @param publicRatioBps Percentage of shares for public sale (in basis points)
     * @param pricePerShare Initial price per share in wei
     * @param minPrimaryBuy Minimum shares required for primary purchase
     * @param metadataCID IPFS CID for car metadata
     * @return carId The ID of the newly created car
     */
    function createCar(
        uint256 totalSupply,
        uint256 publicRatioBps,
        uint256 pricePerShare,
        uint256 minPrimaryBuy,
        string calldata metadataCID
    ) external nonReentrant returns (uint256 carId) {
        if (totalSupply == 0) revert InvalidTotalSupply();
        if (publicRatioBps > BPS_DENOMINATOR) revert InvalidPublicRatio();
        if (pricePerShare == 0) revert InvalidPrice();

        carId = nextCarId++;

        // Calculate public and owner supplies
        uint256 publicSupply = (totalSupply * publicRatioBps) / BPS_DENOMINATOR;
        uint256 ownerSupply = totalSupply - publicSupply;

        // Store car configuration
        cars[carId] = CarConfig({
            owner: msg.sender,
            totalSupply: totalSupply,
            remainingPublicSupply: publicSupply,
            pricePerShare: pricePerShare,
            minPrimaryBuy: minPrimaryBuy,
            metadataCID: metadataCID,
            primarySaleActive: publicSupply > 0,
            sharesSold: 0
        });

        // Mint public supply to contract (for primary sales)
        if (publicSupply > 0) {
            _mint(address(this), carId, publicSupply, "");
        }

        // Mint owner supply to car owner
        if (ownerSupply > 0) {
            _mint(msg.sender, carId, ownerSupply, "");
        }

        emit CarCreated(
            carId,
            msg.sender,
            totalSupply,
            publicSupply,
            pricePerShare,
            minPrimaryBuy,
            metadataCID
        );
    }

    // ============ Primary Sale ============

    /**
     * @notice Purchase shares from primary sale
     * @param carId The car ID to purchase shares from
     * @param amount Number of shares to purchase
     */
    function buyPrimary(
        uint256 carId,
        uint256 amount
    ) external payable nonReentrant {
        if (primarySalesPaused) revert PrimarySalesPausedError();

        CarConfig storage car = cars[carId];

        if (car.totalSupply == 0) revert InvalidCarId();
        if (!car.primarySaleActive) revert InsufficientPublicSupply();
        if (amount < car.minPrimaryBuy) revert BelowMinimumPurchase();
        if (amount > car.remainingPublicSupply)
            revert InsufficientPublicSupply();

        // Calculate costs
        uint256 totalCost = amount * car.pricePerShare;
        uint256 fee = (totalCost * globalFeeBps) / BPS_DENOMINATOR;
        uint256 requiredPayment = totalCost + fee;

        if (msg.value < requiredPayment) revert InsufficientPayment();

        // Update state
        car.remainingPublicSupply -= amount;
        car.sharesSold += amount;
        if (car.remainingPublicSupply == 0) {
            car.primarySaleActive = false;
        }

        accumulatedFees += fee;

        // Transfer shares to buyer
        _safeTransferFrom(address(this), msg.sender, carId, amount, "");

        // Send payment to car owner
        uint256 ownerPayment = totalCost;
        (bool success, ) = car.owner.call{value: ownerPayment}("");
        if (!success) revert TransferFailed();

        // Refund excess payment
        if (msg.value > requiredPayment) {
            (bool refundSuccess, ) = msg.sender.call{
                value: msg.value - requiredPayment
            }("");
            if (!refundSuccess) revert TransferFailed();
        }

        emit PrimaryPurchase(carId, msg.sender, amount, totalCost, fee);
    }

    /**
     * @notice Update the metadata CID for a car
     * @param carId The car ID
     * @param newMetadataCID New IPFS CID
     */
    function updateMetadata(
        uint256 carId,
        string calldata newMetadataCID
    ) external {
        CarConfig storage car = cars[carId];

        if (car.owner != msg.sender) revert OnlyCarOwner();

        car.metadataCID = newMetadataCID;

        emit MetadataUpdated(carId, newMetadataCID);
    }

    /**
     * @notice Burn remaining unsold public supply and close the primary sale.
     * @dev Instead of transferring unsold shares to the owner, they are burned.
     *      totalSupply is decremented so it reflects only the actually circulating shares.
     *      Example: 100 total, 71 sold, 29 unsold → after burn: totalSupply = 71.
     * @param carId The car ID
     */
    function burnPublicSupply(uint256 carId) external nonReentrant {
        CarConfig storage car = cars[carId];

        if (car.owner != msg.sender) revert OnlyCarOwner();

        uint256 amount = car.remainingPublicSupply;
        if (amount == 0) revert InsufficientPublicSupply();

        // Update state — reduce totalSupply by burned amount
        car.remainingPublicSupply = 0;
        car.primarySaleActive = false;
        car.totalSupply -= amount;

        // Burn the unsold shares held by this contract
        _burn(address(this), carId, amount);

        emit PublicSupplyBurned(carId, msg.sender, amount, car.totalSupply);
    }

    // ============ Admin Functions ============

    /**
     * @notice Pause or unpause primary sales globally
     * @param paused Whether to pause primary sales
     */
    function pausePrimarySales(bool paused) external onlyOwner {
        primarySalesPaused = paused;
        emit PrimarySalesPaused(paused);
    }

    /**
     * @notice Update the global platform fee
     * @param newFeeBps New fee in basis points
     */
    function setGlobalFee(uint96 newFeeBps) external onlyOwner {
        if (newFeeBps > MAX_FEE_BPS) revert InvalidFee();

        uint96 oldFee = globalFeeBps;
        globalFeeBps = newFeeBps;

        emit GlobalFeeUpdated(oldFee, newFeeBps);
    }

    /**
     * @notice Withdraw accumulated platform fees
     */
    function withdrawFees() external onlyOwner nonReentrant {
        uint256 amount = accumulatedFees;
        if (amount == 0) revert NoFeesToWithdraw();

        accumulatedFees = 0;

        (bool success, ) = owner().call{value: amount}("");
        if (!success) revert TransferFailed();

        emit FeesWithdrawn(owner(), amount);
    }

    // ============ Earnings Distribution ============

    /**
     * @notice Deposit ETH earnings for a car to be distributed to shareholders
     * @param carId The car ID
     */
    function depositCarEarnings(uint256 carId) external payable nonReentrant {
        if (cars[carId].totalSupply == 0) revert InvalidCarId();
        if (cars[carId].owner != msg.sender) revert OnlyCarOwner();
        if (msg.value == 0) revert InsufficientPayment();

        carEarningsBalance[carId] += msg.value;

        emit EarningsDeposited(carId, msg.sender, msg.value);
    }

    /**
     * @notice Distribute ETH earnings proportionally to all shareholders
     * @param carId The car ID
     * @param shareholders Array of shareholder wallet addresses
     * @param shareAmounts Array of share amounts held by each shareholder (same order)
     * @param totalShares Total shares of this car (for validation)
     * @dev Car owner passes shareholder data from off-chain DB. Contract distributes
     *      ETH from carEarningsBalance proportional to each holder's shares.
     *      shareAmounts must sum to totalShares.
     */
    function distributeEarnings(
        uint256 carId,
        address[] calldata shareholders,
        uint256[] calldata shareAmounts,
        uint256 totalShares
    ) external nonReentrant {
        CarConfig storage car = cars[carId];
        if (car.totalSupply == 0) revert InvalidCarId();
        if (car.owner != msg.sender) revert OnlyCarOwner();
        if (shareholders.length == 0) revert InvalidShareholderData();
        if (shareholders.length != shareAmounts.length) revert InvalidShareholderData();

        uint256 totalToDistribute = carEarningsBalance[carId];
        if (totalToDistribute == 0) revert NoEarningsToDistribute();

        // Validate share amounts sum to totalShares
        uint256 shareSum;
        for (uint256 i = 0; i < shareAmounts.length; i++) {
            shareSum += shareAmounts[i];
        }
        if (shareSum != totalShares) revert ShareSumMismatch();

        // Clear balance before transfers (reentrancy protection)
        carEarningsBalance[carId] = 0;

        // Distribute proportionally
        uint256 distributed;
        for (uint256 i = 0; i < shareholders.length; i++) {
            if (shareAmounts[i] == 0) continue;
            uint256 holderAmount = (totalToDistribute * shareAmounts[i]) / totalShares;
            if (holderAmount == 0) continue;
            distributed += holderAmount;
            (bool success, ) = shareholders[i].call{value: holderAmount}("");
            if (!success) revert TransferFailed();
        }

        // Return any dust to owner due to integer division
        uint256 dust = totalToDistribute - distributed;
        if (dust > 0) {
            (bool ok, ) = msg.sender.call{value: dust}("");
            if (!ok) revert TransferFailed();
        }

        emit EarningsDistributed(carId, msg.sender, totalToDistribute, shareholders.length);
    }

    // ============ View Functions ============

    /**
     * @notice Get the metadata URI for a token
     * @param tokenId The car/token ID
     * @return The IPFS URI for the token metadata
     */
    function uri(uint256 tokenId) public view override returns (string memory) {
        CarConfig memory car = cars[tokenId];
        if (car.totalSupply == 0) revert InvalidCarId();

        return string(abi.encodePacked("ipfs://", car.metadataCID));
    }

    /**
     * @notice Check if a car exists
     * @param carId The car ID to check
     * @return Whether the car exists
     */
    function carExists(uint256 carId) external view returns (bool) {
        return cars[carId].totalSupply > 0;
    }

    /**
     * @notice Get complete car configuration
     * @param carId The car ID
     * @return Car configuration struct
     */
    function getCarConfig(
        uint256 carId
    ) external view returns (CarConfig memory) {
        return cars[carId];
    }

    function onERC1155Received(
        address operator,
        address from,
        uint256 id,
        uint256 value,
        bytes calldata data
    ) external returns (bytes4) {
        return IERC1155Receiver.onERC1155Received.selector;
    }

    function onERC1155BatchReceived(
        address operator,
        address from,
        uint256[] calldata ids,
        uint256[] calldata values,
        bytes calldata data
    ) external returns (bytes4) {
        return IERC1155Receiver.onERC1155BatchReceived.selector;
    }   
}
