# PlasticTrace — System Diagrams & Visual Models

## 1. System Architecture Diagram

```mermaid
graph TD
    subgraph Users ["Supply Chain Stakeholders"]
        AdminUser["System Administrator / Auditor"]
        CollectorUser["Waste Collector"]
        CenterUser["Collection & Sorting Center"]
        RecyclerUser["Recycling Facility"]
        MfgUser["Product Manufacturer"]
        PublicUser["Public Verifier / Auditor"]
    end

    subgraph Frontend ["React Presentation Layer (Vite + Ethers.js)"]
        UI_Dash["Dashboard & KPIs"]
        UI_Reg["Batch Registration"]
        UI_Transfer["Custody Transfer & Receipt"]
        UI_Process["Mass-Balance Processing"]
        UI_Track["Timeline & Batch Tracking"]
        UI_Explorer["Blockchain Explorer"]
        UI_Verify["Public Verification"]
        RoleSwitcher["Active Stakeholder Switcher (Demo Wallet Simulation)"]
    end

    subgraph Web3 ["Web3 Provider Layer"]
        MetaMask["MetaMask (EIP-1193)"]
        LocalRPC["Hardhat JSON-RPC Provider (http://127.0.0.1:8545)"]
    end

    subgraph Blockchain ["Ethereum Virtual Machine (Hardhat Local Chain)"]
        SmartContract["PlasticWasteTraceability.sol"]
        subgraph Modules ["Contract Subsystems"]
            AccessCtrl["Role-Based Access Control"]
            BatchState["Batch State Machine"]
            MassBal["Mass-Balance Validation Engine"]
            AuditLog["Lifecycle Audit Array (LifecycleRecord[])"]
            Events["Contract Event Bus"]
        end
    end

    Users --> Frontend
    Frontend --> Web3
    Web3 --> Blockchain
    SmartContract --> Modules
```

---

## 2. End-to-End Batch Lifecycle Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor Collector as Waste Collector
    actor Center as Collection Center
    actor Recycler as Recycling Facility
    actor Mfg as Manufacturer
    participant Contract as PlasticWasteTraceability.sol
    participant Ledger as Blockchain Ledger (Events & Storage)

    %% Step 1: Registration
    Note over Collector, Contract: Stage 1: Registration & Initial Aggregation
    Collector->>Contract: registerBatch("PL-1001", "PET", 100 kg, "Vijayawada Center")
    Contract->>Contract: Validate role == Collector, ID unique, qty > 0
    Contract->>Ledger: Store batch (status = Registered, custodian = Collector)
    Contract->>Ledger: Emit BatchRegistered("PL-1001", "PET", 100, Collector)

    %% Step 2: Collector -> Collection Center Transfer
    Note over Collector, Center: Stage 2: Transfer to Collection Center
    Collector->>Contract: initiateTransfer("PL-1001", Center.address, 100 kg, "Route A", "Dispatched")
    Contract->>Contract: Validate caller == custodian, recipient role
    Contract->>Ledger: Set status = InTransit, pendingRecipient = Center.address
    Contract->>Ledger: Emit TransferInitiated("PL-1001", Collector, Center, 100 kg)

    %% Step 3: Receipt by Collection Center
    Center->>Contract: confirmReceipt("PL-1001", "EcoSorting Hub", "Weighed and verified")
    Contract->>Contract: Validate caller == pendingRecipient
    Contract->>Ledger: Set custodian = Center, status = Received
    Contract->>Ledger: Emit BatchReceived("PL-1001", Center, 100 kg)

    %% Step 4: Collection Center -> Recycler Transfer
    Note over Center, Recycler: Stage 3: Transfer to Mechanical Recycler
    Center->>Contract: initiateTransfer("PL-1001", Recycler.address, 100 kg, "Route B", "Baled PET")
    Contract->>Ledger: Set status = InTransit, pendingRecipient = Recycler.address
    Contract->>Ledger: Emit TransferInitiated("PL-1001", Center, Recycler, 100 kg)

    Recycler->>Contract: confirmReceipt("PL-1001", "PureCycle Facility", "Received for shredding")
    Contract->>Ledger: Set custodian = Recycler, status = Received
    Contract->>Ledger: Emit BatchReceived("PL-1001", Recycler, 100 kg)

    %% Step 5: Processing with Mass Balance
    Note over Recycler, Contract: Stage 4: Processing & Mass-Balance Conservation
    Recycler->>Contract: recordProcessing("PL-1001", 100 kg, 80 kg rPET, 20 kg residue, "Extrusion Line 1", "Pelletized")
    Contract->>Contract: Verify 100 kg == 80 kg (output) + 20 kg (residue)
    Contract->>Ledger: Set recycledOutput = 80, residual = 20, status = Processed
    Contract->>Ledger: Emit ProcessingRecorded("PL-1001", 100 kg, 80 kg, 20 kg)

    %% Step 6: Recycler -> Manufacturer Transfer
    Note over Recycler, Mfg: Stage 5: Supply of Recycled Pellets to Manufacturer
    Recycler->>Contract: initiateTransfer("PL-1001", Mfg.address, 80 kg, "Highway Logistics", "Food-grade rPET flakes")
    Contract->>Ledger: Set status = InTransit, pendingRecipient = Mfg.address
    Contract->>Ledger: Emit TransferInitiated("PL-1001", Recycler, Mfg, 80 kg)

    Mfg->>Contract: confirmReceipt("PL-1001", "EcoPackaging Factory", "Accepted for bottle manufacturing")
    Contract->>Ledger: Set custodian = Mfg, status = Completed
    Contract->>Ledger: Emit BatchReceived("PL-1001", Mfg, 80 kg)
```

---

## 3. Finite State Machine (Batch State Transitions)

```mermaid
stateDiagram-v2
    [*] --> Registered: registerBatch()<br/>[Caller: Collector]
    Registered --> InTransit: initiateTransfer()<br/>[Caller: Custodian]
    InTransit --> Received: confirmReceipt()<br/>[Caller: Pending Recipient]
    Received --> InTransit: initiateTransfer()<br/>[Transfer to next facility]
    Received --> Processed: recordProcessing()<br/>[Caller: Recycler, Mass Balance checked]
    Processed --> InTransit: initiateTransfer()<br/>[Transfer rPET to Manufacturer]
    InTransit --> Completed: confirmReceipt()<br/>[Caller: Manufacturer, Recycled Output > 0]
    Completed --> [*]
```
