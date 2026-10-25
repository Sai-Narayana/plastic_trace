// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title PlasticWasteTraceability
 * @notice Academic Prototype for Blockchain-Based Plastic Waste Traceability
 * @dev Records lifecycle claims across Collectors, Collection Centers, Recyclers, and Manufacturers.
 *      Physical recycling and mass verification remain real-world physical responsibilities.
 */
contract PlasticWasteTraceability {
    // -------------------------------------------------------------
    // Enums
    // -------------------------------------------------------------

    enum Role {
        None,             // 0: Unregistered / Public
        Admin,            // 1: System Administrator / Auditor
        Collector,        // 2: Waste Collector
        CollectionCenter, // 3: Aggregation & Sorting Center
        Recycler,         // 4: Processing & Mechanical/Chemical Recycler
        Manufacturer      // 5: Consumer Goods / Packaging Manufacturer
    }

    enum BatchStatus {
        Registered,       // 0: Batch registered by collector
        InTransit,        // 1: Custodian initiated transfer, awaiting recipient confirmation
        Received,         // 2: Recipient confirmed receipt
        Processed,        // 3: Recycler recorded processing, mass-balance verified
        Completed         // 4: Recycled material received by manufacturer / end of lifecycle
    }

    enum EventType {
        Registration,
        TransferInitiated,
        ReceiptConfirmed,
        ProcessingRecorded,
        Completed
    }

    // -------------------------------------------------------------
    // Structs
    // -------------------------------------------------------------

    struct LifecycleRecord {
        EventType eventType;
        address actor;
        address recipient;
        uint256 quantity;        // in kg
        uint256 timestamp;
        string location;
        string notes;
        string details;          // metadata or mass-balance summary
    }

    struct Batch {
        string batchId;
        string plasticType;      // e.g. PET, HDPE, LDPE, PP, Other
        uint256 initialQuantity; // in kg
        uint256 currentQuantity; // in kg
        uint256 recycledOutput;  // in kg
        uint256 residualWaste;   // in kg
        string collectionLocation;
        address collector;
        address currentCustodian;
        address pendingRecipient;
        BatchStatus status;
        uint256 registrationTimestamp;
        uint256 lastUpdatedTimestamp;
        bool exists;
    }

    // -------------------------------------------------------------
    // State Variables
    // -------------------------------------------------------------

    address public admin;
    mapping(address => Role) public roles;
    address[] public registeredStakeholders;

    // Batches
    mapping(string => Batch) private batches;
    mapping(string => LifecycleRecord[]) private batchHistories;
    string[] private allBatchIds;

    // -------------------------------------------------------------
    // Events
    // -------------------------------------------------------------

    event StakeholderRoleUpdated(
        address indexed stakeholder,
        Role previousRole,
        Role newRole,
        address indexed updatedBy,
        uint256 timestamp
    );

    event BatchRegistered(
        string indexed batchId,
        string plasticType,
        uint256 quantity,
        address indexed collector,
        string location,
        uint256 timestamp
    );

    event TransferInitiated(
        string indexed batchId,
        address indexed sender,
        address indexed recipient,
        uint256 quantity,
        string location,
        string notes,
        uint256 timestamp
    );

    event BatchReceived(
        string indexed batchId,
        address indexed recipient,
        uint256 quantity,
        string location,
        string notes,
        uint256 timestamp
    );

    event ProcessingRecorded(
        string indexed batchId,
        address indexed recycler,
        uint256 quantityProcessed,
        uint256 recycledOutput,
        uint256 residualWaste,
        string location,
        string notes,
        uint256 timestamp
    );

    // -------------------------------------------------------------
    // Modifiers
    // -------------------------------------------------------------

    modifier onlyAdmin() {
        require(msg.sender == admin, "PlasticTrace: Caller is not the admin");
        _;
    }

    modifier onlyAuthorizedCollector() {
        require(
            roles[msg.sender] == Role.Collector || msg.sender == admin,
            "PlasticTrace: Caller is not an authorized Collector"
        );
        _;
    }

    modifier onlyAuthorizedRecycler() {
        require(
            roles[msg.sender] == Role.Recycler || msg.sender == admin,
            "PlasticTrace: Caller is not an authorized Recycler"
        );
        _;
    }

    // -------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------

    constructor() {
        admin = msg.sender;
        roles[msg.sender] = Role.Admin;
        registeredStakeholders.push(msg.sender);

        emit StakeholderRoleUpdated(
            msg.sender,
            Role.None,
            Role.Admin,
            msg.sender,
            block.timestamp
        );
    }

    // -------------------------------------------------------------
    // Stakeholder Management
    // -------------------------------------------------------------

    /**
     * @notice Admin assigns or updates stakeholder role for an address
     */
    function setStakeholderRole(address _stakeholder, Role _role) external onlyAdmin {
        require(_stakeholder != address(0), "PlasticTrace: Invalid stakeholder address");
        Role prevRole = roles[_stakeholder];
        if (prevRole == Role.None && _role != Role.None) {
            registeredStakeholders.push(_stakeholder);
        }
        roles[_stakeholder] = _role;
        emit StakeholderRoleUpdated(_stakeholder, prevRole, _role, msg.sender, block.timestamp);
    }

    function getStakeholderRole(address _stakeholder) external view returns (Role) {
        return roles[_stakeholder];
    }

    function isAuthorizedStakeholder(address _stakeholder, Role _requiredRole) external view returns (bool) {
        return roles[_stakeholder] == _requiredRole || roles[_stakeholder] == Role.Admin;
    }

    function getAllStakeholders() external view returns (address[] memory) {
        return registeredStakeholders;
    }

    // -------------------------------------------------------------
    // Batch Lifecycle Functions
    // -------------------------------------------------------------

    /**
     * @notice Register a newly collected plastic waste batch.
     * @param _batchId Unique identifier for the batch (e.g., PL-1001)
     * @param _plasticType Standard resin type (PET, HDPE, LDPE, PP, Other)
     * @param _quantity Mass in kg (> 0)
     * @param _location City or collection facility
     */
    function registerBatch(
        string memory _batchId,
        string memory _plasticType,
        uint256 _quantity,
        string memory _location
    ) external onlyAuthorizedCollector {
        require(bytes(_batchId).length > 0, "PlasticTrace: Batch ID cannot be empty");
        require(bytes(_plasticType).length > 0, "PlasticTrace: Plastic type cannot be empty");
        require(_quantity > 0, "PlasticTrace: Quantity must be greater than zero");
        require(!batches[_batchId].exists, "PlasticTrace: Batch ID already exists");

        Batch storage batch = batches[_batchId];
        batch.batchId = _batchId;
        batch.plasticType = _plasticType;
        batch.initialQuantity = _quantity;
        batch.currentQuantity = _quantity;
        batch.recycledOutput = 0;
        batch.residualWaste = 0;
        batch.collectionLocation = _location;
        batch.collector = msg.sender;
        batch.currentCustodian = msg.sender;
        batch.pendingRecipient = address(0);
        batch.status = BatchStatus.Registered;
        batch.registrationTimestamp = block.timestamp;
        batch.lastUpdatedTimestamp = block.timestamp;
        batch.exists = true;

        allBatchIds.push(_batchId);

        // Record on-chain immutable audit event
        batchHistories[_batchId].push(LifecycleRecord({
            eventType: EventType.Registration,
            actor: msg.sender,
            recipient: address(0),
            quantity: _quantity,
            timestamp: block.timestamp,
            location: _location,
            notes: "Batch registered by authorized collector",
            details: string(abi.encodePacked("Resin: ", _plasticType, " | Initial: ", _uintToString(_quantity), " kg"))
        }));

        emit BatchRegistered(_batchId, _plasticType, _quantity, msg.sender, _location, block.timestamp);
    }

    /**
     * @notice Initiate transfer of a batch to the next stakeholder.
     * @dev Puts batch into InTransit status. Recipient must confirm receipt.
     */
    function initiateTransfer(
        string memory _batchId,
        address _recipient,
        uint256 _quantity,
        string memory _location,
        string memory _notes
    ) external {
        require(batches[_batchId].exists, "PlasticTrace: Batch does not exist");
        Batch storage batch = batches[_batchId];

        require(msg.sender == batch.currentCustodian, "PlasticTrace: Caller is not the current custodian");
        require(batch.status != BatchStatus.InTransit, "PlasticTrace: Batch is already in transit");
        require(_recipient != address(0), "PlasticTrace: Invalid recipient address");
        require(_recipient != msg.sender, "PlasticTrace: Cannot transfer to current custodian");
        require(_quantity > 0 && _quantity <= batch.currentQuantity, "PlasticTrace: Invalid transfer quantity");

        // Validate recipient has an authorized role
        Role recipientRole = roles[_recipient];
        require(
            recipientRole != Role.None,
            "PlasticTrace: Recipient must be an authorized stakeholder"
        );

        // Role-flow validation:
        // Collector -> CollectionCenter / Recycler
        // CollectionCenter -> Recycler
        // Recycler -> Manufacturer
        Role senderRole = roles[msg.sender];
        if (senderRole == Role.Collector) {
            require(
                recipientRole == Role.CollectionCenter || recipientRole == Role.Recycler || recipientRole == Role.Admin,
                "PlasticTrace: Collector can only transfer to Collection Center, Recycler, or Admin"
            );
        } else if (senderRole == Role.CollectionCenter) {
            require(
                recipientRole == Role.Recycler || recipientRole == Role.Admin,
                "PlasticTrace: Collection Center can only transfer to Recycler or Admin"
            );
        } else if (senderRole == Role.Recycler) {
            require(
                recipientRole == Role.Manufacturer || recipientRole == Role.Admin,
                "PlasticTrace: Recycler can only transfer to Manufacturer or Admin"
            );
        }

        batch.pendingRecipient = _recipient;
        batch.status = BatchStatus.InTransit;
        batch.lastUpdatedTimestamp = block.timestamp;

        batchHistories[_batchId].push(LifecycleRecord({
            eventType: EventType.TransferInitiated,
            actor: msg.sender,
            recipient: _recipient,
            quantity: _quantity,
            timestamp: block.timestamp,
            location: _location,
            notes: bytes(_notes).length > 0 ? _notes : "Transfer initiated",
            details: string(abi.encodePacked("In transit to: ", _addressToString(_recipient)))
        }));

        emit TransferInitiated(_batchId, msg.sender, _recipient, _quantity, _location, _notes, block.timestamp);
    }

    /**
     * @notice Confirm receipt of a batch by the designated recipient.
     */
    function confirmReceipt(
        string memory _batchId,
        string memory _location,
        string memory _notes
    ) external {
        require(batches[_batchId].exists, "PlasticTrace: Batch does not exist");
        Batch storage batch = batches[_batchId];

        require(batch.status == BatchStatus.InTransit, "PlasticTrace: Batch is not currently in transit");
        require(msg.sender == batch.pendingRecipient, "PlasticTrace: Caller is not the designated recipient");

        batch.currentCustodian = msg.sender;
        batch.pendingRecipient = address(0);
        batch.lastUpdatedTimestamp = block.timestamp;

        // If received by Manufacturer and already processed, marks completion of recycling cycle
        bool isManufacturer = roles[msg.sender] == Role.Manufacturer;
        if (isManufacturer && batch.recycledOutput > 0) {
            batch.status = BatchStatus.Completed;
        } else {
            batch.status = BatchStatus.Received;
        }

        batchHistories[_batchId].push(LifecycleRecord({
            eventType: batch.status == BatchStatus.Completed ? EventType.Completed : EventType.ReceiptConfirmed,
            actor: msg.sender,
            recipient: address(0),
            quantity: batch.currentQuantity,
            timestamp: block.timestamp,
            location: _location,
            notes: bytes(_notes).length > 0 ? _notes : "Receipt confirmed",
            details: batch.status == BatchStatus.Completed
                ? "Delivered to Manufacturer for re-production"
                : "Custody accepted at facility"
        }));

        emit BatchReceived(_batchId, msg.sender, batch.currentQuantity, _location, _notes, block.timestamp);
    }

    /**
     * @notice Record plastic processing (sorting, washing, shredding, extrusion, pelletization).
     * @dev Enforces mass-balance conservation: quantityProcessed == recycledOutput + residualWaste.
     *      Physical reality check: claim represents recorded facility measurements.
     */
    function recordProcessing(
        string memory _batchId,
        uint256 _quantityProcessed,
        uint256 _recycledOutput,
        uint256 _residualWaste,
        string memory _location,
        string memory _notes
    ) external onlyAuthorizedRecycler {
        require(batches[_batchId].exists, "PlasticTrace: Batch does not exist");
        Batch storage batch = batches[_batchId];

        require(msg.sender == batch.currentCustodian, "PlasticTrace: Caller is not the current custodian");
        require(
            batch.status == BatchStatus.Received || batch.status == BatchStatus.Registered,
            "PlasticTrace: Batch must be in Received or Registered status to process"
        );
        require(_quantityProcessed > 0, "PlasticTrace: Processed quantity must be greater than zero");
        require(_quantityProcessed <= batch.currentQuantity, "PlasticTrace: Processed quantity exceeds current batch quantity");

        // Strict mass-balance equation
        require(
            _quantityProcessed == _recycledOutput + _residualWaste,
            "PlasticTrace: Mass balance mismatch (quantityProcessed must equal recycledOutput + residualWaste)"
        );

        batch.recycledOutput += _recycledOutput;
        batch.residualWaste += _residualWaste;
        // Remaining usable material ready for downstream supply chain
        batch.currentQuantity = _recycledOutput;
        batch.status = BatchStatus.Processed;
        batch.lastUpdatedTimestamp = block.timestamp;

        string memory summary = string(
            abi.encodePacked(
                "Processed: ", _uintToString(_quantityProcessed),
                " kg | Recycled Output: ", _uintToString(_recycledOutput),
                " kg | Residual: ", _uintToString(_residualWaste), " kg"
            )
        );

        batchHistories[_batchId].push(LifecycleRecord({
            eventType: EventType.ProcessingRecorded,
            actor: msg.sender,
            recipient: address(0),
            quantity: _quantityProcessed,
            timestamp: block.timestamp,
            location: _location,
            notes: bytes(_notes).length > 0 ? _notes : "Processing completed",
            details: summary
        }));

        emit ProcessingRecorded(
            _batchId,
            msg.sender,
            _quantityProcessed,
            _recycledOutput,
            _residualWaste,
            _location,
            _notes,
            block.timestamp
        );
    }

    // -------------------------------------------------------------
    // View Functions
    // -------------------------------------------------------------

    function getBatch(string memory _batchId) external view returns (Batch memory) {
        require(batches[_batchId].exists, "PlasticTrace: Batch does not exist");
        return batches[_batchId];
    }

    function getBatchHistory(string memory _batchId) external view returns (LifecycleRecord[] memory) {
        require(batches[_batchId].exists, "PlasticTrace: Batch does not exist");
        return batchHistories[_batchId];
    }

    function getAllBatchIds() external view returns (string[] memory) {
        return allBatchIds;
    }

    function getBatchCount() external view returns (uint256) {
        return allBatchIds.length;
    }

    /**
     * @notice Aggregates global system statistics for the dashboard
     */
    function getSystemMetrics() external view returns (
        uint256 totalBatches,
        uint256 totalInputQuantity,
        uint256 totalInTransit,
        uint256 totalProcessed,
        uint256 totalRecycledOutput,
        uint256 totalResidualWaste
    ) {
        totalBatches = allBatchIds.length;
        for (uint256 i = 0; i < allBatchIds.length; i++) {
            Batch storage b = batches[allBatchIds[i]];
            totalInputQuantity += b.initialQuantity;
            if (b.status == BatchStatus.InTransit) {
                totalInTransit++;
            }
            if (b.status == BatchStatus.Processed || b.status == BatchStatus.Completed) {
                totalProcessed++;
            }
            totalRecycledOutput += b.recycledOutput;
            totalResidualWaste += b.residualWaste;
        }
    }

    // -------------------------------------------------------------
    // Internal Helper Utilities
    // -------------------------------------------------------------

    function _uintToString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }

    function _addressToString(address _addr) internal pure returns (string memory) {
        bytes32 value = bytes32(uint256(uint160(_addr)));
        bytes memory alphabet = "0123456789abcdef";
        bytes memory str = new bytes(42);
        str[0] = "0";
        str[1] = "x";
        for (uint256 i = 0; i < 20; i++) {
            str[2 + i * 2] = alphabet[uint8(value[i + 12] >> 4)];
            str[3 + i * 2] = alphabet[uint8(value[i + 12] & 0x0f)];
        }
        return string(str);
    }
}
