import { ethers } from "ethers";
import contractData from "../contracts/contractData.json";

const RPC_URL = "http://127.0.0.1:8545";
const CONTRACT_ADDRESS = contractData.contractAddress;
const CONTRACT_ABI = contractData.abi;

export const HARDHAT_ACCOUNTS = [
  {
    address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    role: "Admin",
    roleId: 1,
    name: "System Administrator / Auditor",
    privateKey: "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
    description: "Assigns authorized roles, audits full blockchain lifecycle",
  },
  {
    address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    role: "Collector",
    roleId: 2,
    name: "GreenCollect Waste Services",
    privateKey: "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
    description: "Registers initial plastic waste batches, ships to Collection Centers",
  },
  {
    address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    role: "CollectionCenter",
    roleId: 3,
    name: "City EcoSorting Hub",
    privateKey: "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a",
    description: "Receives collected batches, sorts resins, transfers to Recyclers",
  },
  {
    address: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
    role: "Recycler",
    roleId: 4,
    name: "PureCycle Polymers",
    privateKey: "0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6",
    description: "Receives plastic batches, validates mass-balance, records recycled output",
  },
  {
    address: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
    role: "Manufacturer",
    roleId: 5,
    name: "EcoPackaging Ltd",
    privateKey: "0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a",
    description: "Receives recycled material for remanufacturing into sustainable packaging",
  },
  {
    address: "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc",
    role: "None",
    roleId: 0,
    name: "Public / Unauthorized Account",
    privateKey: "0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba",
    description: "Used to demonstrate on-chain rejection of unauthorized operations",
  },
];

export const ROLE_NAMES = {
  0: "None",
  1: "Admin",
  2: "Collector",
  3: "CollectionCenter",
  4: "Recycler",
  5: "Manufacturer",
};

export const STATUS_NAMES = {
  0: "Registered",
  1: "InTransit",
  2: "Received",
  3: "Processed",
  4: "Completed",
};

export const EVENT_TYPE_NAMES = {
  0: "Registration",
  1: "TransferInitiated",
  2: "ReceiptConfirmed",
  3: "ProcessingRecorded",
  4: "Completed",
};

/**
 * Get read-only JSON-RPC provider connected to local Hardhat node
 */
export function getJsonRpcProvider() {
  return new ethers.JsonRpcProvider(RPC_URL);
}

/**
 * Get signer: either connected MetaMask account or local Hardhat private key signer
 */
export async function getSigner(authMode = "simulated", accountIndex = 1) {
  if (authMode === "metamask" && window.ethereum) {
    const browserProvider = new ethers.BrowserProvider(window.ethereum);
    return await browserProvider.getSigner();
  }

  // Simulated mode: returns actual signer using local Hardhat private key
  const provider = getJsonRpcProvider();
  const acc = HARDHAT_ACCOUNTS[accountIndex] || HARDHAT_ACCOUNTS[1];
  return new ethers.Wallet(acc.privateKey, provider);
}

/**
 * Get Contract instance with signer or provider
 */
export function getContractInstance(signerOrProvider) {
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signerOrProvider);
}

/**
 * Test node connectivity and fetch latest block
 */
export async function checkBlockchainStatus() {
  try {
    const provider = getJsonRpcProvider();
    const network = await provider.getNetwork();
    const blockNumber = await provider.getBlockNumber();
    return {
      connected: true,
      chainId: Number(network.chainId),
      blockNumber,
      contractAddress: CONTRACT_ADDRESS,
    };
  } catch (err) {
    return {
      connected: false,
      error: err.message,
      contractAddress: CONTRACT_ADDRESS,
    };
  }
}

/**
 * Fetch global system metrics calculated from smart contract
 */
export async function fetchSystemMetrics() {
  const provider = getJsonRpcProvider();
  const contract = getContractInstance(provider);
  const metrics = await contract.getSystemMetrics();

  return {
    totalBatches: Number(metrics[0]),
    totalInputQuantity: Number(metrics[1]),
    totalInTransit: Number(metrics[2]),
    totalProcessed: Number(metrics[3]),
    totalRecycledOutput: Number(metrics[4]),
    totalResidualWaste: Number(metrics[5]),
  };
}

/**
 * Fetch all batches
 */
export async function fetchAllBatches() {
  const provider = getJsonRpcProvider();
  const contract = getContractInstance(provider);
  const batchIds = await contract.getAllBatchIds();

  const batches = [];
  for (let id of batchIds) {
    try {
      const b = await contract.getBatch(id);
      batches.push({
        batchId: b.batchId,
        plasticType: b.plasticType,
        initialQuantity: Number(b.initialQuantity),
        currentQuantity: Number(b.currentQuantity),
        recycledOutput: Number(b.recycledOutput),
        residualWaste: Number(b.residualWaste),
        collectionLocation: b.collectionLocation,
        collector: b.collector,
        currentCustodian: b.currentCustodian,
        pendingRecipient: b.pendingRecipient,
        status: Number(b.status),
        statusName: STATUS_NAMES[Number(b.status)],
        registrationTimestamp: Number(b.registrationTimestamp),
        lastUpdatedTimestamp: Number(b.lastUpdatedTimestamp),
        exists: b.exists,
      });
    } catch (e) {
      console.warn(`Could not fetch batch ${id}:`, e);
    }
  }

  // Sort newest first
  return batches.sort((a, b) => b.registrationTimestamp - a.registrationTimestamp);
}

/**
 * Fetch specific batch by ID
 */
export async function fetchBatch(batchId) {
  const provider = getJsonRpcProvider();
  const contract = getContractInstance(provider);
  const b = await contract.getBatch(batchId);
  return {
    batchId: b.batchId,
    plasticType: b.plasticType,
    initialQuantity: Number(b.initialQuantity),
    currentQuantity: Number(b.currentQuantity),
    recycledOutput: Number(b.recycledOutput),
    residualWaste: Number(b.residualWaste),
    collectionLocation: b.collectionLocation,
    collector: b.collector,
    currentCustodian: b.currentCustodian,
    pendingRecipient: b.pendingRecipient,
    status: Number(b.status),
    statusName: STATUS_NAMES[Number(b.status)],
    registrationTimestamp: Number(b.registrationTimestamp),
    lastUpdatedTimestamp: Number(b.lastUpdatedTimestamp),
    exists: b.exists,
  };
}

/**
 * Fetch batch history audit trail
 */
export async function fetchBatchHistory(batchId) {
  const provider = getJsonRpcProvider();
  const contract = getContractInstance(provider);
  const history = await contract.getBatchHistory(batchId);

  return history.map((record) => ({
    eventType: Number(record.eventType),
    eventTypeName: EVENT_TYPE_NAMES[Number(record.eventType)],
    actor: record.actor,
    recipient: record.recipient,
    quantity: Number(record.quantity),
    timestamp: Number(record.timestamp),
    location: record.location,
    notes: record.notes,
    details: record.details,
  }));
}

/**
 * Register a new batch
 */
export async function registerBatch(signer, batchId, plasticType, quantity, location) {
  const contract = getContractInstance(signer);
  const tx = await contract.registerBatch(batchId, plasticType, quantity, location);
  const receipt = await tx.wait();
  return receipt;
}

/**
 * Initiate transfer
 */
export async function initiateTransfer(signer, batchId, recipient, quantity, location, notes) {
  const contract = getContractInstance(signer);
  const tx = await contract.initiateTransfer(batchId, recipient, quantity, location, notes);
  const receipt = await tx.wait();
  return receipt;
}

/**
 * Confirm receipt
 */
export async function confirmReceipt(signer, batchId, location, notes) {
  const contract = getContractInstance(signer);
  const tx = await contract.confirmReceipt(batchId, location, notes);
  const receipt = await tx.wait();
  return receipt;
}

/**
 * Record processing (with mass balance)
 */
export async function recordProcessing(
  signer,
  batchId,
  quantityProcessed,
  recycledOutput,
  residualWaste,
  location,
  notes
) {
  const contract = getContractInstance(signer);
  const tx = await contract.recordProcessing(
    batchId,
    quantityProcessed,
    recycledOutput,
    residualWaste,
    location,
    notes
  );
  const receipt = await tx.wait();
  return receipt;
}

/**
 * Update stakeholder role (Admin only)
 */
export async function setStakeholderRole(signer, stakeholderAddress, roleId) {
  const contract = getContractInstance(signer);
  const tx = await contract.setStakeholderRole(stakeholderAddress, roleId);
  const receipt = await tx.wait();
  return receipt;
}

/**
 * Fetch all emitted smart contract events for the blockchain explorer
 */
export async function fetchAllEvents() {
  const provider = getJsonRpcProvider();
  const contract = getContractInstance(provider);
  const currentBlock = await provider.getBlockNumber();

  // Search from block 0 to current
  const filterList = [
    contract.filters.BatchRegistered(),
    contract.filters.TransferInitiated(),
    contract.filters.BatchReceived(),
    contract.filters.ProcessingRecorded(),
    contract.filters.StakeholderRoleUpdated(),
  ];

  const allEvents = [];
  for (let filter of filterList) {
    try {
      const events = await contract.queryFilter(filter, 0, currentBlock);
      allEvents.push(...events);
    } catch (e) {
      console.warn("Event query error:", e);
    }
  }

  // Format events
  const formatted = allEvents.map((ev) => {
    return {
      eventName: ev.fragment.name,
      blockNumber: ev.blockNumber,
      transactionHash: ev.transactionHash,
      args: ev.args,
    };
  });

  return formatted.sort((a, b) => b.blockNumber - a.blockNumber);
}
