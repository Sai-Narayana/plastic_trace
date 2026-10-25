const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PlasticWasteTraceability Smart Contract", function () {
  let contract;
  let admin, collector, collectionCenter, recycler, manufacturer, unauthorizedUser;

  // Role Enum definitions matching contract
  const Role = {
    None: 0,
    Admin: 1,
    Collector: 2,
    CollectionCenter: 3,
    Recycler: 4,
    Manufacturer: 5,
  };

  // Status Enum definitions matching contract
  const BatchStatus = {
    Registered: 0,
    InTransit: 1,
    Received: 2,
    Processed: 3,
    Completed: 4,
  };

  beforeEach(async function () {
    [admin, collector, collectionCenter, recycler, manufacturer, unauthorizedUser] =
      await ethers.getSigners();

    const Factory = await ethers.getContractFactory("PlasticWasteTraceability");
    contract = await Factory.deploy();
    await contract.waitForDeployment();

    // Assign stakeholder roles
    await contract.connect(admin).setStakeholderRole(collector.address, Role.Collector);
    await contract.connect(admin).setStakeholderRole(collectionCenter.address, Role.CollectionCenter);
    await contract.connect(admin).setStakeholderRole(recycler.address, Role.Recycler);
    await contract.connect(admin).setStakeholderRole(manufacturer.address, Role.Manufacturer);
  });

  describe("1. Stakeholder Role Management & Access Control", function () {
    it("Should correctly set admin on deployment", async function () {
      expect(await contract.admin()).to.equal(admin.address);
      expect(await contract.roles(admin.address)).to.equal(Role.Admin);
    });

    it("Should allow admin to assign stakeholder roles and emit StakeholderRoleUpdated", async function () {
      const newCollector = unauthorizedUser.address;
      await expect(contract.connect(admin).setStakeholderRole(newCollector, Role.Collector))
        .to.emit(contract, "StakeholderRoleUpdated")
        .withArgs(newCollector, Role.None, Role.Collector, admin.address, (await ethers.provider.getBlock("latest")).timestamp + 1);

      expect(await contract.roles(newCollector)).to.equal(Role.Collector);
    });

    it("Should reject role assignment by non-admin accounts", async function () {
      await expect(
        contract.connect(collector).setStakeholderRole(unauthorizedUser.address, Role.Recycler)
      ).to.be.revertedWith("PlasticTrace: Caller is not the admin");
    });

    it("Should reject role assignment for the zero address", async function () {
      await expect(
        contract.connect(admin).setStakeholderRole(ethers.ZeroAddress, Role.Collector)
      ).to.be.revertedWith("PlasticTrace: Invalid stakeholder address");
    });
  });

  describe("2. Batch Registration", function () {
    it("Should allow an authorized collector to register a new plastic batch and emit BatchRegistered", async function () {
      const tx = await contract
        .connect(collector)
        .registerBatch("PL-1001", "PET", 100, "Vijayawada Center");

      await expect(tx)
        .to.emit(contract, "BatchRegistered");

      const batch = await contract.getBatch("PL-1001");
      expect(batch.batchId).to.equal("PL-1001");
      expect(batch.plasticType).to.equal("PET");
      expect(batch.initialQuantity).to.equal(100n);
      expect(batch.currentQuantity).to.equal(100n);
      expect(batch.currentCustodian).to.equal(collector.address);
      expect(batch.status).to.equal(BatchStatus.Registered);
      expect(batch.exists).to.be.true;
    });

    it("Should reject registration with duplicate Batch ID", async function () {
      await contract.connect(collector).registerBatch("PL-1001", "PET", 100, "Vijayawada Center");

      await expect(
        contract.connect(collector).registerBatch("PL-1001", "HDPE", 50, "Guntur Center")
      ).to.be.revertedWith("PlasticTrace: Batch ID already exists");
    });

    it("Should reject registration from unauthorized stakeholders", async function () {
      await expect(
        contract.connect(unauthorizedUser).registerBatch("PL-9999", "PET", 100, "Unknown Site")
      ).to.be.revertedWith("PlasticTrace: Caller is not an authorized Collector");
    });

    it("Should reject registration with empty Batch ID or zero quantity", async function () {
      await expect(
        contract.connect(collector).registerBatch("", "PET", 100, "Vijayawada")
      ).to.be.revertedWith("PlasticTrace: Batch ID cannot be empty");

      await expect(
        contract.connect(collector).registerBatch("PL-ZERO", "PET", 0, "Vijayawada")
      ).to.be.revertedWith("PlasticTrace: Quantity must be greater than zero");
    });
  });

  describe("3. Batch Transfer & Custody Handover", function () {
    beforeEach(async function () {
      await contract.connect(collector).registerBatch("PL-1001", "PET", 100, "Vijayawada Center");
    });

    it("Should allow current custodian to initiate transfer and put batch in InTransit status", async function () {
      await expect(
        contract.connect(collector).initiateTransfer(
          "PL-1001",
          collectionCenter.address,
          100,
          "Highway Route 1",
          "Shipped by truck"
        )
      )
        .to.emit(contract, "TransferInitiated")
        .withArgs(
          "PL-1001",
          collector.address,
          collectionCenter.address,
          100n,
          "Highway Route 1",
          "Shipped by truck",
          await ethers.provider.getBlock("latest").then(b => b.timestamp + 1)
        );

      const batch = await contract.getBatch("PL-1001");
      expect(batch.status).to.equal(BatchStatus.InTransit);
      expect(batch.pendingRecipient).to.equal(collectionCenter.address);
      expect(batch.currentCustodian).to.equal(collector.address); // Still collector until confirmed
    });

    it("Should reject transfer if caller is not current custodian", async function () {
      await expect(
        contract.connect(unauthorizedUser).initiateTransfer(
          "PL-1001",
          collectionCenter.address,
          100,
          "Highway Route 1",
          "Notes"
        )
      ).to.be.revertedWith("PlasticTrace: Caller is not the current custodian");
    });

    it("Should reject transfer to unauthorized recipient or invalid role sequence", async function () {
      // Recipient with no role
      await expect(
        contract.connect(collector).initiateTransfer(
          "PL-1001",
          unauthorizedUser.address,
          100,
          "Highway Route 1",
          "Notes"
        )
      ).to.be.revertedWith("PlasticTrace: Recipient must be an authorized stakeholder");

      // Collector cannot transfer directly to Manufacturer
      await expect(
        contract.connect(collector).initiateTransfer(
          "PL-1001",
          manufacturer.address,
          100,
          "Highway Route 1",
          "Notes"
        )
      ).to.be.revertedWith("PlasticTrace: Collector can only transfer to Collection Center, Recycler, or Admin");
    });

    it("Should reject transfer when batch is already InTransit", async function () {
      await contract.connect(collector).initiateTransfer(
        "PL-1001",
        collectionCenter.address,
        100,
        "Route",
        "Truck 1"
      );

      await expect(
        contract.connect(collector).initiateTransfer(
          "PL-1001",
          collectionCenter.address,
          100,
          "Route",
          "Truck 2"
        )
      ).to.be.revertedWith("PlasticTrace: Batch is already in transit");
    });

    it("Should reject transfer quantity exceeding current batch quantity", async function () {
      await expect(
        contract.connect(collector).initiateTransfer(
          "PL-1001",
          collectionCenter.address,
          150, // exceeds 100
          "Route",
          "Overweight"
        )
      ).to.be.revertedWith("PlasticTrace: Invalid transfer quantity");
    });
  });

  describe("4. Receipt Confirmation", function () {
    beforeEach(async function () {
      await contract.connect(collector).registerBatch("PL-1001", "PET", 100, "Vijayawada Center");
      await contract.connect(collector).initiateTransfer(
        "PL-1001",
        collectionCenter.address,
        100,
        "Transit Route",
        "Dispatched"
      );
    });

    it("Should allow designated recipient to confirm receipt and update custodian", async function () {
      await expect(
        contract.connect(collectionCenter).confirmReceipt("PL-1001", "EcoSorting Hub", "Accepted")
      )
        .to.emit(contract, "BatchReceived")
        .withArgs(
          "PL-1001",
          collectionCenter.address,
          100n,
          "EcoSorting Hub",
          "Accepted",
          await ethers.provider.getBlock("latest").then(b => b.timestamp + 1)
        );

      const batch = await contract.getBatch("PL-1001");
      expect(batch.status).to.equal(BatchStatus.Received);
      expect(batch.currentCustodian).to.equal(collectionCenter.address);
      expect(batch.pendingRecipient).to.equal(ethers.ZeroAddress);
    });

    it("Should reject receipt confirmation by unauthorized stakeholder or wrong recipient", async function () {
      await expect(
        contract.connect(unauthorizedUser).confirmReceipt("PL-1001", "Fake Site", "Hijack attempt")
      ).to.be.revertedWith("PlasticTrace: Caller is not the designated recipient");

      await expect(
        contract.connect(recycler).confirmReceipt("PL-1001", "Recycler Site", "Premature")
      ).to.be.revertedWith("PlasticTrace: Caller is not the designated recipient");
    });

    it("Should reject receipt confirmation when batch is not InTransit", async function () {
      // First confirm it
      await contract.connect(collectionCenter).confirmReceipt("PL-1001", "EcoSorting Hub", "Accepted");

      // Try confirming again
      await expect(
        contract.connect(collectionCenter).confirmReceipt("PL-1001", "EcoSorting Hub", "Duplicate")
      ).to.be.revertedWith("PlasticTrace: Batch is not currently in transit");
    });
  });

  describe("5. Plastic Processing & Recycling Mass Balance", function () {
    beforeEach(async function () {
      // Full flow up to Recycler receipt
      await contract.connect(collector).registerBatch("PL-1001", "PET", 100, "Vijayawada");
      await contract.connect(collector).initiateTransfer(
        "PL-1001",
        collectionCenter.address,
        100,
        "Route 1",
        "Transfer 1"
      );
      await contract.connect(collectionCenter).confirmReceipt("PL-1001", "Collection Hub", "Received");

      await contract.connect(collectionCenter).initiateTransfer(
        "PL-1001",
        recycler.address,
        100,
        "Route 2",
        "Transfer to Recycler"
      );
      await contract.connect(recycler).confirmReceipt("PL-1001", "Recycling Plant", "Received at factory");
    });

    it("Should allow authorized recycler to record processing with valid mass-balance", async function () {
      // 100 kg processed = 80 kg recycled + 20 kg residual
      await expect(
        contract.connect(recycler).recordProcessing(
          "PL-1001",
          100,
          80,
          20,
          "Recycle Line 1",
          "Pelletized into rPET"
        )
      )
        .to.emit(contract, "ProcessingRecorded")
        .withArgs(
          "PL-1001",
          recycler.address,
          100n,
          80n,
          20n,
          "Recycle Line 1",
          "Pelletized into rPET",
          await ethers.provider.getBlock("latest").then(b => b.timestamp + 1)
        );

      const batch = await contract.getBatch("PL-1001");
      expect(batch.status).to.equal(BatchStatus.Processed);
      expect(batch.recycledOutput).to.equal(80n);
      expect(batch.residualWaste).to.equal(20n);
      expect(batch.currentQuantity).to.equal(80n); // usable material for manufacturer
    });

    it("Should reject processing if mass balance is violated (output + residual != processed)", async function () {
      // 100 kg processed != 70 kg recycled + 20 kg residual (violates conservation of mass)
      await expect(
        contract.connect(recycler).recordProcessing(
          "PL-1001",
          100,
          70,
          20, // Sum is 90 != 100
          "Recycle Line 1",
          "Discrepancy"
        )
      ).to.be.revertedWith("PlasticTrace: Mass balance mismatch (quantityProcessed must equal recycledOutput + residualWaste)");
    });

    it("Should reject processing if quantity exceeds available batch quantity", async function () {
      await expect(
        contract.connect(recycler).recordProcessing(
          "PL-1001",
          150, // exceeds available 100
          120,
          30,
          "Recycle Line 1",
          "Invalid"
        )
      ).to.be.revertedWith("PlasticTrace: Processed quantity exceeds current batch quantity");
    });

    it("Should reject processing by unauthorized non-recycler", async function () {
      await expect(
        contract.connect(unauthorizedUser).recordProcessing(
          "PL-1001",
          100,
          80,
          20,
          "Unknown",
          "Hack"
        )
      ).to.be.revertedWith("PlasticTrace: Caller is not an authorized Recycler");
    });
  });

  describe("6. Batch History & System Metrics", function () {
    it("Should maintain an immutable chronological audit trail of all lifecycle events", async function () {
      await contract.connect(collector).registerBatch("PL-1001", "PET", 100, "Vijayawada");
      await contract.connect(collector).initiateTransfer(
        "PL-1001",
        collectionCenter.address,
        100,
        "Transit 1",
        "Collector -> Center"
      );
      await contract.connect(collectionCenter).confirmReceipt("PL-1001", "Center Hub", "Center Received");
      await contract.connect(collectionCenter).initiateTransfer(
        "PL-1001",
        recycler.address,
        100,
        "Transit 2",
        "Center -> Recycler"
      );
      await contract.connect(recycler).confirmReceipt("PL-1001", "Recycler Bay", "Recycler Received");
      await contract.connect(recycler).recordProcessing("PL-1001", 100, 80, 20, "Bay 1", "Processed");

      const history = await contract.getBatchHistory("PL-1001");
      expect(history.length).to.equal(6);
      expect(history[0].eventType).to.equal(0); // Registration
      expect(history[1].eventType).to.equal(1); // TransferInitiated
      expect(history[2].eventType).to.equal(2); // ReceiptConfirmed
      expect(history[3].eventType).to.equal(1); // TransferInitiated
      expect(history[4].eventType).to.equal(2); // ReceiptConfirmed
      expect(history[5].eventType).to.equal(3); // ProcessingRecorded
    });

    it("Should accurately compute global system metrics across multiple batches", async function () {
      await contract.connect(collector).registerBatch("PL-1001", "PET", 100, "Vijayawada");
      await contract.connect(collector).registerBatch("PL-1002", "HDPE", 200, "Guntur");

      // Put PL-1002 in transit
      await contract.connect(collector).initiateTransfer(
        "PL-1002",
        collectionCenter.address,
        200,
        "Transit",
        "Dispatched"
      );

      const metrics = await contract.getSystemMetrics();
      expect(metrics.totalBatches).to.equal(2n);
      expect(metrics.totalInputQuantity).to.equal(300n);
      expect(metrics.totalInTransit).to.equal(1n);
      expect(metrics.totalProcessed).to.equal(0n);
    });

    it("Should list all registered batch IDs", async function () {
      await contract.connect(collector).registerBatch("PL-1001", "PET", 100, "Vijayawada");
      await contract.connect(collector).registerBatch("PL-1002", "HDPE", 200, "Guntur");

      const allIds = await contract.getAllBatchIds();
      expect(allIds).to.deep.equal(["PL-1001", "PL-1002"]);
      expect(await contract.getBatchCount()).to.equal(2n);
    });
  });
});
