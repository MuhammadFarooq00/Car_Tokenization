// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

// ============ Interfaces ============
interface ICarShares {
    function carExists(uint256 carId) external view returns (bool);
    function globalFeeBps() external view returns (uint96);
    function owner() external view returns (address);
}
/**
 * @title Marketplace
 * @notice P2P secondary market for trading car shares
 * @dev Fixed-price listings with partial fill support
 */
contract Marketplace is ERC1155Holder, ReentrancyGuard {
    // ============ Structs ============

    struct Listing {
        address seller;
        uint256 carId;
        uint256 amount;
        uint256 pricePerShare;
        bool active;
    }

    // ============ State Variables ============

    /// @notice Reference to the CarShares contract
    ICarShares public immutable carShares;

    /// @notice Basis points denominator
    uint256 private constant BPS_DENOMINATOR = 10000;

    /// @notice Counter for listing IDs
    uint256 public nextListingId = 1;

    /// @notice Mapping from listingId to Listing
    mapping(uint256 => Listing) public listings;

    /// @notice Mapping from seller => carId => listingId (one active listing per user per car)
    mapping(address => mapping(uint256 => uint256)) public activeListings;

    // ============ Events ============

    event ListingCreated(
        uint256 indexed listingId,
        address indexed seller,
        uint256 indexed carId,
        uint256 amount,
        uint256 pricePerShare
    );

    event ListingFilled(
        uint256 indexed listingId,
        address indexed buyer,
        uint256 amount,
        uint256 totalCost,
        uint256 fee
    );

    event ListingClosed(uint256 indexed listingId);

    event ListingCancelled(uint256 indexed listingId, uint256 remainingAmount);

    // ============ Errors ============

    error InvalidCarId();
    error InvalidAmount();
    error InvalidPrice();
    error InsufficientPayment();
    error ListingNotActive();
    error OnlySeller();
    error ExistingActiveListing();
    error InsufficientListingAmount();
    error TransferFailed();

    // ============ Constructor ============

    /**
     * @notice Initialize marketplace with CarShares contract reference
     * @param _carShares Address of the CarShares contract
     */
    constructor(address _carShares) {
        carShares = ICarShares(_carShares);
    }

    // ============ Listing Management ============

    /**
     * @notice Create a new listing for car shares
     * @param carId The car ID to list
     * @param amount Number of shares to list
     * @param pricePerShare Price per share in wei
     * @return listingId The ID of the created listing
     */
    function createListing(
        uint256 carId,
        uint256 amount,
        uint256 pricePerShare
    ) external nonReentrant returns (uint256 listingId) {
        // Validate inputs
        if (!carShares.carExists(carId)) revert InvalidCarId();
        if (amount == 0) revert InvalidAmount();
        if (pricePerShare == 0) revert InvalidPrice();

        // Check for existing active listing
        uint256 existingListingId = activeListings[msg.sender][carId];
        if (existingListingId != 0 && listings[existingListingId].active) {
            revert ExistingActiveListing();
        }

        listingId = nextListingId++;

        // Create listing
        listings[listingId] = Listing({
            seller: msg.sender,
            carId: carId,
            amount: amount,
            pricePerShare: pricePerShare,
            active: true
        });

        activeListings[msg.sender][carId] = listingId;

        // Transfer tokens to marketplace (locks them)
        require(
            IERC1155(address(carShares)).balanceOf(msg.sender, carId) >= amount,
            "Insufficient shares"
        );
        require(
            IERC1155(address(carShares)).isApprovedForAll(
                msg.sender,
                address(this)
            ),
            "Not approved"
        );
        IERC1155(address(carShares)).safeTransferFrom(
            msg.sender,
            address(this),
            carId,
            amount,
            ""
        );

        emit ListingCreated(
            listingId,
            msg.sender,
            carId,
            amount,
            pricePerShare
        );
    }

    /**
     * @notice Buy shares from a listing (supports partial fills)
     * @param listingId The listing ID to buy from
     * @param amount Number of shares to buy
     */
    function buyFromListing(
        uint256 listingId,
        uint256 amount
    ) external payable nonReentrant {
        Listing storage listing = listings[listingId];

        // Validate listing
        if (!listing.active) revert ListingNotActive();
        if (amount == 0 || amount > listing.amount)
            revert InsufficientListingAmount();

        // Calculate costs
        uint256 totalCost = amount * listing.pricePerShare;
        uint96 feeBps = carShares.globalFeeBps();
        uint256 fee = (totalCost * feeBps) / BPS_DENOMINATOR;
        uint256 requiredPayment = totalCost + fee;

        if (msg.value < requiredPayment) revert InsufficientPayment();

        // Update listing
        listing.amount -= amount;

        // Close listing if fully filled
        if (listing.amount == 0) {
            listing.active = false;
            delete activeListings[listing.seller][listing.carId];
            emit ListingClosed(listingId);
        }

        // Transfer shares to buyer
        IERC1155(address(carShares)).safeTransferFrom(
            address(this),
            msg.sender,
            listing.carId,
            amount,
            ""
        );

        // Send payment to seller
        (bool sellerSuccess, ) = listing.seller.call{value: totalCost}("");
        if (!sellerSuccess) revert TransferFailed();

        // Send fee to platform owner
        address feeRecipient = carShares.owner();
        (bool feeSuccess, ) = feeRecipient.call{value: fee}("");
        if (!feeSuccess) revert TransferFailed();

        // Refund excess payment
        if (msg.value > requiredPayment) {
            (bool refundSuccess, ) = msg.sender.call{
                value: msg.value - requiredPayment
            }("");
            if (!refundSuccess) revert TransferFailed();
        }

        emit ListingFilled(listingId, msg.sender, amount, totalCost, fee);
    }

    /**
     * @notice Cancel an active listing
     * @param listingId The listing ID to cancel
     */
    function cancelListing(uint256 listingId) external nonReentrant {
        Listing storage listing = listings[listingId];

        // Validate
        if (listing.seller != msg.sender) revert OnlySeller();
        if (!listing.active) revert ListingNotActive();

        uint256 remainingAmount = listing.amount;

        // Update state
        listing.active = false;
        listing.amount = 0;
        delete activeListings[msg.sender][listing.carId];

        // Return shares to seller
        IERC1155(address(carShares)).safeTransferFrom(
            address(this),
            msg.sender,
            listing.carId,
            remainingAmount,
            ""
        );

        emit ListingCancelled(listingId, remainingAmount);
    }

    // ============ View Functions ============

    /**
     * @notice Get complete listing details
     * @param listingId The listing ID
     * @return Listing struct
     */
    function getListing(
        uint256 listingId
    ) external view returns (Listing memory) {
        return listings[listingId];
    }

    /**
     * @notice Get active listing ID for a seller and car
     * @param seller The seller address
     * @param carId The car ID
     * @return The active listing ID (0 if none)
     */
    function getActiveListing(
        address seller,
        uint256 carId
    ) external view returns (uint256) {
        return activeListings[seller][carId];
    }

    /**
     * @notice Check if a listing is active
     * @param listingId The listing ID
     * @return Whether the listing is active
     */
    function isListingActive(uint256 listingId) external view returns (bool) {
        return listings[listingId].active;
    }

    /**
     * @notice Calculate total cost for buying from a listing
     * @param listingId The listing ID
     * @param amount Number of shares to buy
     * @return totalCost The base cost
     * @return fee The platform fee
     * @return totalRequired The total payment required
     */
    function calculateCost(
        uint256 listingId,
        uint256 amount
    )
        external
        view
        returns (uint256 totalCost, uint256 fee, uint256 totalRequired)
    {
        Listing memory listing = listings[listingId];

        totalCost = amount * listing.pricePerShare;
        uint96 feeBps = carShares.globalFeeBps();
        fee = (totalCost * feeBps) / BPS_DENOMINATOR;
        totalRequired = totalCost + fee;
    }
}
