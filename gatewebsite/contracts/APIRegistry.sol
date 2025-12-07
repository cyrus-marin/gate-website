// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title APIRegistry
 * @notice Core contract for Gate402 API registration on Monad
 * @dev Manages API service metadata, pricing, and provider information
 */
contract APIRegistry {
    struct Service {
        address provider;
        string name;
        string metadataURI; // IPFS hash pointing to OpenAPI spec
        uint256 ratePerRequest; // in wei (Monad's native token)
        string rateUnit; // "per_request", "per_1k_requests", "per_10k_requests"
        bool active;
        uint256 createdAt;
        uint256 totalRevenue;
        uint256 totalRequests;
    }

    struct Endpoint {
        bytes32 serviceId;
        string method; // GET, POST, PUT, DELETE, etc.
        string path;
        uint256 rate;
        string rateUnit;
    }

    // Storage
    mapping(bytes32 => Service) public services;
    mapping(bytes32 => Endpoint[]) public serviceEndpoints;
    mapping(address => bytes32[]) public providerServices;
    bytes32[] public allServiceIds;

    // Events
    event ServiceRegistered(
        bytes32 indexed serviceId,
        address indexed provider,
        string name,
        string metadataURI,
        uint256 timestamp
    );

    event ServiceUpdated(
        bytes32 indexed serviceId,
        string metadataURI,
        uint256 ratePerRequest
    );

    event ServiceDeactivated(bytes32 indexed serviceId);

    event RevenueRecorded(
        bytes32 indexed serviceId,
        uint256 amount,
        uint256 requests
    );

    // Errors
    error ServiceNotFound();
    error Unauthorized();
    error ServiceAlreadyExists();
    error InvalidRate();

    /**
     * @notice Register a new API service
     * @param name Service name
     * @param metadataURI IPFS hash containing OpenAPI spec
     * @param ratePerRequest Price per request in wei
     * @param rateUnit Unit type for pricing
     */
    function registerService(
        string memory name,
        string memory metadataURI,
        uint256 ratePerRequest,
        string memory rateUnit
    ) external returns (bytes32) {
        bytes32 serviceId = keccak256(
            abi.encodePacked(msg.sender, name, block.timestamp)
        );

        if (services[serviceId].provider != address(0)) {
            revert ServiceAlreadyExists();
        }

        services[serviceId] = Service({
            provider: msg.sender,
            name: name,
            metadataURI: metadataURI,
            ratePerRequest: ratePerRequest,
            rateUnit: rateUnit,
            active: true,
            createdAt: block.timestamp,
            totalRevenue: 0,
            totalRequests: 0
        });

        providerServices[msg.sender].push(serviceId);
        allServiceIds.push(serviceId);

        emit ServiceRegistered(
            serviceId,
            msg.sender,
            name,
            metadataURI,
            block.timestamp
        );

        return serviceId;
    }

    /**
     * @notice Add endpoints to a service
     * @param serviceId The service to add endpoints to
     * @param methods HTTP methods for each endpoint
     * @param paths URL paths for each endpoint
     * @param rates Pricing for each endpoint in wei
     * @param rateUnits Rate units for each endpoint
     */
    function addEndpoints(
        bytes32 serviceId,
        string[] memory methods,
        string[] memory paths,
        uint256[] memory rates,
        string[] memory rateUnits
    ) external {
        Service storage service = services[serviceId];
        if (service.provider != msg.sender) revert Unauthorized();

        require(
            methods.length == paths.length &&
            paths.length == rates.length &&
            rates.length == rateUnits.length,
            "Array length mismatch"
        );

        for (uint i = 0; i < methods.length; i++) {
            serviceEndpoints[serviceId].push(
                Endpoint({
                    serviceId: serviceId,
                    method: methods[i],
                    path: paths[i],
                    rate: rates[i],
                    rateUnit: rateUnits[i]
                })
            );
        }
    }

    /**
     * @notice Update service metadata
     * @param serviceId Service to update
     * @param metadataURI New IPFS hash
     * @param ratePerRequest New rate
     */
    function updateService(
        bytes32 serviceId,
        string memory metadataURI,
        uint256 ratePerRequest
    ) external {
        Service storage service = services[serviceId];
        if (service.provider != msg.sender) revert Unauthorized();

        service.metadataURI = metadataURI;
        service.ratePerRequest = ratePerRequest;

        emit ServiceUpdated(serviceId, metadataURI, ratePerRequest);
    }

    /**
     * @notice Deactivate a service
     * @param serviceId Service to deactivate
     */
    function deactivateService(bytes32 serviceId) external {
        Service storage service = services[serviceId];
        if (service.provider != msg.sender) revert Unauthorized();

        service.active = false;
        emit ServiceDeactivated(serviceId);
    }

    /**
     * @notice Record revenue and usage (called by PaymentEscrow)
     * @param serviceId Service that was used
     * @param amount Revenue amount in wei
     * @param requests Number of requests
     */
    function recordRevenue(
        bytes32 serviceId,
        uint256 amount,
        uint256 requests
    ) external {
        // TODO: Add access control - only PaymentEscrow contract should call this
        Service storage service = services[serviceId];
        if (service.provider == address(0)) revert ServiceNotFound();

        service.totalRevenue += amount;
        service.totalRequests += requests;

        emit RevenueRecorded(serviceId, amount, requests);
    }

    // View functions
    function getService(bytes32 serviceId) external view returns (Service memory) {
        return services[serviceId];
    }

    function getProviderServices(address provider) external view returns (bytes32[] memory) {
        return providerServices[provider];
    }

    function getAllServices() external view returns (bytes32[] memory) {
        return allServiceIds;
    }

    function getEndpoints(bytes32 serviceId) external view returns (Endpoint[] memory) {
        return serviceEndpoints[serviceId];
    }

    function getServiceCount() external view returns (uint256) {
        return allServiceIds.length;
    }
}
