const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const deploymentPath = path.join(__dirname, "../deployment.json");
  if (!fs.existsSync(deploymentPath)) {
    console.error("Please run deploy.js first!");
    process.exit(1);
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  const contractAddress = deployment.contractAddress;

  const [admin, collector, collectionCenter, recycler, manufacturer] = await hre.ethers.getSigners();
  const PlasticWasteTraceability = await hre.ethers.getContractFactory("PlasticWasteTraceability");
  const contract = PlasticWasteTraceability.attach(contractAddress);

  console.log("==================================================");
  console.log("Seeding Demonstration Scenario for PL-1001...");
  console.log("Contract:", contractAddress);

  // Check if PL-1001 already exists
  try {
    const existing = await contract.getBatch("PL-1001");
    if (existing.exists) {
      console.log("Batch PL-1001 already exists on-chain. Skipping seed.");
      return;
    }
  } catch (err) {
    // doesn't exist yet, proceed
  }

  // Step 1: Collector registers PL-1001
  console.log("Step 1: Collector registering batch PL-1001 (100 kg PET at Vijayawada Collection Center)...");
  let tx = await contract.connect(collector).registerBatch("PL-1001", "PET", 100, "Vijayawada Collection Center");
  let receipt = await tx.wait();
  console.log(`✓ Confirmed in block ${receipt.blockNumber}, tx: ${receipt.hash}`);

  // Step 2: Collector initiates transfer to Collection Center
  console.log("Step 2: Collector initiating transfer to City EcoSorting Hub...");
  tx = await contract.connect(collector).initiateTransfer(
    "PL-1001",
    collectionCenter.address,
    100,
    "Transit Route A-12",
    "Dispatched via GreenLogistics EV truck"
  );
  receipt = await tx.wait();
  console.log(`✓ Confirmed in block ${receipt.blockNumber}, tx: ${receipt.hash}`);

  // Step 3: Collection Center confirms receipt
  console.log("Step 3: Collection Center confirming receipt...");
  tx = await contract.connect(collectionCenter).confirmReceipt(
    "PL-1001",
    "City EcoSorting Hub, Warehouse 4",
    "Received 100 kg PET bottles in good sorted condition"
  );
  receipt = await tx.wait();
  console.log(`✓ Confirmed in block ${receipt.blockNumber}, tx: ${receipt.hash}`);

  // Step 4: Collection Center transfers to Recycler
  console.log("Step 4: Collection Center transferring to PureCycle Polymers...");
  tx = await contract.connect(collectionCenter).initiateTransfer(
    "PL-1001",
    recycler.address,
    100,
    "Regional Transit Hub",
    "Baled PET plastic sent for mechanical recycling"
  );
  receipt = await tx.wait();
  console.log(`✓ Confirmed in block ${receipt.blockNumber}, tx: ${receipt.hash}`);

  // Recycler confirms receipt
  console.log("Recycler confirming receipt...");
  tx = await contract.connect(recycler).confirmReceipt(
    "PL-1001",
    "PureCycle Facility - Processing Bay 2",
    "Material weighed and cleared for shredding & extrusion"
  );
  receipt = await tx.wait();
  console.log(`✓ Confirmed in block ${receipt.blockNumber}, tx: ${receipt.hash}`);

  // Step 5: Recycler records processing (100 kg processed -> 80 kg recycled rPET pellets, 20 kg residual)
  console.log("Step 5: Recycler recording processing (100kg processed = 80kg rPET pellets + 20kg residual)...");
  tx = await contract.connect(recycler).recordProcessing(
    "PL-1001",
    100,
    80,
    20,
    "PureCycle Extrusion Line 1",
    "Washed, shredded, pelletized into food-grade rPET flakes"
  );
  receipt = await tx.wait();
  console.log(`✓ Confirmed in block ${receipt.blockNumber}, tx: ${receipt.hash}`);

  // Seed another registered batch for variety: PL-1002 (HDPE)
  console.log("\nSeeding additional batch PL-1002 (HDPE, 250 kg at Guntur Hub)...");
  tx = await contract.connect(collector).registerBatch("PL-1002", "HDPE", 250, "Guntur Waste Recovery Hub");
  receipt = await tx.wait();
  console.log(`✓ Confirmed in block ${receipt.blockNumber}, tx: ${receipt.hash}`);

  // Seed another batch in transit: PL-1003 (PP)
  console.log("Seeding additional batch PL-1003 (PP, 150 kg in transit)...");
  tx = await contract.connect(collector).registerBatch("PL-1003", "PP", 150, "Tirupati Sorting Yard");
  await tx.wait();
  tx = await contract.connect(collector).initiateTransfer(
    "PL-1003",
    collectionCenter.address,
    150,
    "National Highway 16",
    "En route to sorting facility"
  );
  receipt = await tx.wait();
  console.log(`✓ Confirmed in block ${receipt.blockNumber}, tx: ${receipt.hash}`);

  console.log("\nDemonstration seed data successfully written to local blockchain!");
  console.log("==================================================");
}

main().catch((error) => {
  console.error("Seeding failed:", error);
  process.exitCode = 1;
});
