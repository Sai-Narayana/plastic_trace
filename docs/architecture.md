# PlasticTrace — System Architecture & Design

## 1. Executive Summary & Objective

**PlasticTrace** is an academic blockchain prototype designed to solve the critical challenges of transparency, data tampering, and coordination across fragmented plastic recycling supply chains.

The platform provides a decentralized, immutable single source of truth for tracking plastic waste batches through every stage of their lifecycle:
1. **Collection** (Waste Collector)
2. **Aggregation & Sorting** (Collection Center)
3. **Processing & Recycling** (Recycler)
4. **End-use Manufacturing** (Manufacturer)

---

## 2. Layered Architecture

PlasticTrace is constructed using a decoupled, lightweight two-tier architecture (Client + Local Blockchain):

```
+-----------------------------------------------------------------------------------+
|                              PRESENTATION LAYER (React)                           |
|  - Dashboard & Analytics (Live on-chain metrics, status distribution)             |
|  - Batch Registration (Resin type, quantity, initial custody)                     |
|  - Custody Transfer & Confirmation Handshake                                      |
|  - Mechanical Recycling & Mass-Balance Conservation Module                        |
|  - Blockchain Explorer & Audit Trail Timeline                                     |
|  - Public Batch Verification Portal                                               |
+-----------------------------------------------------------------------------------+
                                        |
                 JSON-RPC / Ethers.js v6 (Browser Provider or Direct RPC)
                                        |
+-----------------------------------------------------------------------------------+
|                        SMART CONTRACT LAYER (Solidity 0.8.24)                     |
|                                                                                   |
|  Contract: PlasticWasteTraceability.sol                                           |
|  +-----------------------------------------------------------------------------+  |
|  | - Access Control & Stakeholder Registry (Admin, Collector, Center, Recycler)|  |
|  | - Batch State Machine (Registered -> InTransit -> Received -> Processed)    |  |
|  | - Physical Mass-Balance Validation (Processed = Recycled + Residual)        |  |
|  | - Immutable Audit Log (Appends LifecycleRecord[] per Batch ID)              |  |
|  | - Event Bus (BatchRegistered, TransferInitiated, BatchReceived, etc.)       |  |
|  +-----------------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------------+
                                        |
+-----------------------------------------------------------------------------------+
|                       INFRASTRUCTURE LAYER (Hardhat Node)                         |
|  - Local EVM Execution Environment (Chain ID: 31337)                              |
|  - Deterministic Signers & Funded Accounts (MetaMask Compatible)                  |
|  - Instant Block Finality & Zero External Gas Cost                                |
+-----------------------------------------------------------------------------------+
```

---

## 3. Data Model & Lifecycle State Machine

### Batch State Transition
A plastic batch adheres to a strict linear custodial handshake:

```
[ Unregistered ]
       │
       ▼ (registerBatch by authorized Collector)
[ Registered ] ── custodian: Collector
       │
       ▼ (initiateTransfer by custodian)
[ InTransit ] ── pendingRecipient: CollectionCenter / Recycler
       │
       ▼ (confirmReceipt by designated recipient)
[ Received ] ── custodian: CollectionCenter or Recycler
       │
       ├─────────────────────────────────────────────────┐
       ▼ (if custodian is Recycler: recordProcessing)     │ (transfer to Recycler)
[ Processed ] ── currentQuantity = recycledOutput         │
       │                                                 │
       ▼ (initiateTransfer to Manufacturer)              │
[ InTransit ]                                            │
       │                                                 │
       ▼ (confirmReceipt by Manufacturer)                │
[ Completed ] ── Material incorporated into new goods ◄──┘
```

### Mass-Balance Conservation Rule
When plastic arrives at a recycling facility, physical mass cannot be created or destroyed. The smart contract validates:

$$\text{Quantity Processed} = \text{Recycled Output} + \text{Residual Waste}$$

- If a recycler enters $100\text{ kg}$ processed, with $80\text{ kg}$ usable rPET pellets and $20\text{ kg}$ non-recyclable residue, the contract accepts the transaction.
- If the sum deviates (e.g., $100 \neq 70 + 20$), the transaction **reverts on-chain**, preventing accounting fraud or fictitious recycling claims.

---

## 4. Trust Model & Practical Realities

### What Blockchain Guarantees:
1. **Tamper Resistance:** Once a batch transfer or processing event is mined into a block, neither collectors nor recyclers can retroactively alter timestamps, quantities, or actor addresses.
2. **Accountability:** Every state change is cryptographically signed by the caller's private key.
3. **Auditability:** Independent certifiers and consumers can inspect the exact block, gas used, and event parameters.

### Physical Real-World Limitations :
- **Garbage In, Garbage Out (GIGO):** The blockchain guarantees the integrity of the *ledger*, not the *physical plastic*. If a rogue actor physically dumps waste in a river while claiming to have recycled it on-chain, the blockchain will faithfully record the fraudulent claim.
- **Physical Verification:** In production systems, physical IoT scales, RFID tags on bales, and chemical tracer technologies (such as markers used by IBM Plastic Bank or Asahi Kasei BLUE Plastics) must bridge the physical and digital domains.
