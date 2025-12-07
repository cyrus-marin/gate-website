// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./APIRegistry.sol";

/**
 * @title PaymentEscrow
 * @notice Escrow contract for x402 API payments on Monad
 * @dev Holds consumer deposits and releases payments to providers after API usage
 */
contract PaymentEscrow {
    APIRegistry public registry;

    struct Deposit {
        uint256 amount;
        uint256 allowance; // Remaining allowance for API calls
        uint256 timestamp;
    }

    // Consumer -> Service -> Deposit
    mapping(address => mapping(bytes32 => Deposit)) public deposits;
    
    // Provider balances (withdrawable revenue)
    mapping(address => uint256) public providerBalances;

    // Events
    event DepositMade(
        address indexed consumer,
        bytes32 indexed serviceId,
        uint256 amount
    );

    event PaymentProcessed(
        address indexed consumer,
        bytes32 indexed serviceId,
        address indexed provider,
        uint256 amount,
        uint256 requests
    );

    event Withdrawal(address indexed provider, uint256 amount);

    event RefundIssued(
        address indexed consumer,
        bytes32 indexed serviceId,
        uint256 amount
    );

    // Errors
    error InsufficientDeposit();
    error InsufficientBalance();
    error TransferFailed();

    constructor(address _registry) {
        registry = APIRegistry(_registry);
    }

    /**
     * @notice Deposit funds for API usage
     * @param serviceId Service to deposit for
     */
    function deposit(bytes32 serviceId) external payable {
        require(msg.value > 0, "Must deposit positive amount");

        Deposit storage dep = deposits[msg.sender][serviceId];
        dep.amount += msg.value;
        dep.allowance += msg.value;
        dep.timestamp = block.timestamp;

        emit DepositMade(msg.sender, serviceId, msg.value);
    }

    /**
     * @notice Process payment for API usage
     * @param consumer Address that made the API call
     * @param serviceId Service that was used
     * @param cost Cost of the API call in wei
     * @param requests Number of requests made
     */
    function processPayment(
        address consumer,
        bytes32 serviceId,
        uint256 cost,
        uint256 requests
    ) external {
        // TODO: Add access control - only x402 Gateway should call this
        Deposit storage dep = deposits[consumer][serviceId];
        
        if (dep.allowance < cost) revert InsufficientDeposit();

        dep.allowance -= cost;

        // Get provider address from registry
        APIRegistry.Service memory service = registry.getService(serviceId);
        address provider = service.provider;

        // Credit provider balance
        providerBalances[provider] += cost;

        // Record revenue in registry
        registry.recordRevenue(serviceId, cost, requests);

        emit PaymentProcessed(consumer, serviceId, provider, cost, requests);
    }

    /**
     * @notice Check if consumer has sufficient allowance
     * @param consumer Consumer address
     * @param serviceId Service ID
     * @param cost Required amount
     */
    function checkAllowance(
        address consumer,
        bytes32 serviceId,
        uint256 cost
    ) external view returns (bool) {
        return deposits[consumer][serviceId].allowance >= cost;
    }

    /**
     * @notice Get consumer's deposit info
     * @param consumer Consumer address
     * @param serviceId Service ID
     */
    function getDeposit(
        address consumer,
        bytes32 serviceId
    ) external view returns (Deposit memory) {
        return deposits[consumer][serviceId];
    }

    /**
     * @notice Provider withdraws earned revenue
     */
    function withdraw() external {
        uint256 balance = providerBalances[msg.sender];
        if (balance == 0) revert InsufficientBalance();

        providerBalances[msg.sender] = 0;

        (bool success, ) = msg.sender.call{value: balance}("");
        if (!success) revert TransferFailed();

        emit Withdrawal(msg.sender, balance);
    }

    /**
     * @notice Consumer requests refund of unused deposit
     * @param serviceId Service to refund from
     */
    function refund(bytes32 serviceId) external {
        Deposit storage dep = deposits[msg.sender][serviceId];
        uint256 refundAmount = dep.allowance;

        if (refundAmount == 0) revert InsufficientBalance();

        dep.allowance = 0;

        (bool success, ) = msg.sender.call{value: refundAmount}("");
        if (!success) revert TransferFailed();

        emit RefundIssued(msg.sender, serviceId, refundAmount);
    }

    /**
     * @notice Get provider's withdrawable balance
     */
    function getProviderBalance(address provider) external view returns (uint256) {
        return providerBalances[provider];
    }

    // Receive function to accept ETH
    receive() external payable {}
}
