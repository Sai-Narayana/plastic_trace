const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [admin, collector, collectionCenter, recycler, manufacturer, otherUser] = await hre.ethers.getSigners();

  console.log("==================================================");
  console.log("Deploying PlasticWasteTraceability contract...");
  console.log("Admin / Deployer address:", admin.address);

  const PlasticWasteTraceability = await hre.ethers.getContractFactory("PlasticWasteTraceability");
  const contract = await PlasticWasteTraceability.deploy();
  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  console.log("PlasticWasteTraceability deployed to:", contractAddress);

  // Authorize initial stakeholder roles for demonstration
  // Role enum: 0: None, 1: Admin, 2: Collector, 3: CollectionCenter, 4: Recycler, 5: Manufacturer
  console.log("\nConfiguring initial stakeholder roles on local blockchain:");

  let tx = await contract.setStakeholderRole(collector.address, 2); // Collector
  await tx.wait();
  console.log(`- Collector: ${collector.address} (Account #1)`);

  tx = await contract.setStakeholderRole(collectionCenter.address, 3); // Collection Center
  await tx.wait();
  console.log(`- Collection Center: ${collectionCenter.address} (Account #2)`);

  tx = await contract.setStakeholderRole(recycler.address, 4); // Recycler
  await tx.wait();
  console.log(`- Recycler: ${recycler.address} (Account #3)`);

  tx = await contract.setStakeholderRole(manufacturer.address, 5); // Manufacturer
  await tx.wait();
  console.log(`- Manufacturer: ${manufacturer.address} (Account #4)`);

  // Export contract artifact and addresses for frontend
  const artifactPath = path.join(__dirname, "../artifacts/contracts/PlasticWasteTraceability.sol/PlasticWasteTraceability.json");
  let artifactAbi = [];
  if (fs.existsSync(artifactPath)) {
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    artifactAbi = artifact.abi;
  }

  const deploymentData = {
    network: "localhost",
    chainId: 31337,
    contractAddress: contractAddress,
    deployedAt: new Date().toISOString(),
    stakeholders: {
      admin: { address: admin.address, role: "Admin", roleId: 1, label: "System Admin / Auditor" },
      collector: { address: collector.address, role: "Collector", roleId: 2, label: "GreenCollect Services" },
      collectionCenter: { address: collectionCenter.address, role: "CollectionCenter", roleId: 3, label: "City EcoSorting Hub" },
      recycler: { address: recycler.address, role: "Recycler", roleId: 4, label: "PureCycle Polymers" },
      manufacturer: { address: manufacturer.address, role: "Manufacturer", roleId: 5, label: "EcoPackaging Ltd" },
      unauthorized: { address: otherUser.address, role: "None", roleId: 0, label: "Public / Unauthorized" },
    },
    abi: artifactAbi,
  };

  // Save to blockchain folder
  fs.writeFileSync(
    path.join(__dirname, "../deployment.json"),
    JSON.stringify(deploymentData, null, 2)
  );

  // Also save to frontend contracts directory if it exists or create it
  const frontendContractsDir = path.join(__dirname, "../../frontend/src/contracts");
  if (!fs.existsSync(frontendContractsDir)) {
    fs.mkdirSync(frontendContractsDir, { recursive: true });
  }
  fs.writeFileSync(
    path.join(frontendContractsDir, "contractData.json"),
    JSON.stringify(deploymentData, null, 2)
  );

  console.log("Deployment configuration saved to deployment.json & frontend contractData.json");
  console.log("==================================================");
}

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exitCode = 1;
});
