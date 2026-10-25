import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import RoleSwitcherModal from "./components/RoleSwitcherModal";
import Dashboard from "./pages/Dashboard";
import RegisterBatch from "./pages/RegisterBatch";
import BatchTracking from "./pages/BatchTracking";
import TransferReceive from "./pages/TransferReceive";
import ProcessPlastic from "./pages/ProcessPlastic";
import BlockchainExplorer from "./pages/BlockchainExplorer";
import PublicVerification from "./pages/PublicVerification";
import AboutProject from "./pages/AboutProject";

import {
  HARDHAT_ACCOUNTS,
  getSigner,
  fetchSystemMetrics,
  fetchAllBatches,
  checkBlockchainStatus,
  registerBatch,
  initiateTransfer,
  confirmReceipt,
  recordProcessing,
} from "./services/blockchain";

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [currentAccountIndex, setCurrentAccountIndex] = useState(1); // Default to Collector
  const [authMode, setAuthMode] = useState("simulated"); // "simulated" | "metamask"
  const [metaMaskAddress, setMetaMaskAddress] = useState("");
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);

  const [signer, setSigner] = useState(null);
  const [metrics, setMetrics] = useState({
    totalBatches: 0,
    totalInputQuantity: 0,
    totalInTransit: 0,
    totalProcessed: 0,
    totalRecycledOutput: 0,
    totalResidualWaste: 0,
  });
  const [batches, setBatches] = useState([]);
  const [networkStatus, setNetworkStatus] = useState({ connected: false });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  // Initialize and load blockchain data
  useEffect(() => {
    initSigner();
    refreshAllData();

    // Auto refresh every 15s
    const timer = setInterval(() => {
      refreshAllData(true);
    }, 15000);
    return () => clearInterval(timer);
  }, [authMode, currentAccountIndex]);

  const initSigner = async () => {
    try {
      const s = await getSigner(authMode, currentAccountIndex);
      setSigner(s);
    } catch (err) {
      console.warn("Could not init signer:", err);
    }
  };

  const refreshAllData = async (silent = false) => {
    if (!silent) setIsRefreshing(true);
    try {
      const status = await checkBlockchainStatus();
      setNetworkStatus(status);

      if (status.connected) {
        const [m, b] = await Promise.all([
          fetchSystemMetrics(),
          fetchAllBatches(),
        ]);
        setMetrics(m);
        setBatches(b);
      }
    } catch (err) {
      console.error("Error refreshing data:", err);
    } finally {
      if (!silent) setIsRefreshing(false);
    }
  };

  const handleConnectMetaMask = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        if (accounts.length > 0) {
          setMetaMaskAddress(accounts[0]);
          setAuthMode("metamask");
          await initSigner();
          await refreshAllData();
        }
      } catch (e) {
        alert("MetaMask connection rejected: " + e.message);
      }
    } else {
      alert("MetaMask extension is not detected in your browser. Using local Hardhat simulated accounts instead.");
    }
  };

  // Seed PET scenario (PL-1001) live on-chain
  const handleSeedDemo = async () => {
    setIsSeeding(true);
    try {
      // 1. Collector registers PL-1001
      const collectorSigner = await getSigner("simulated", 1);
      const centerSigner = await getSigner("simulated", 2);
      const recyclerSigner = await getSigner("simulated", 3);

      await registerBatch(
        collectorSigner,
        "PL-1001",
        "PET",
        100,
        "Vijayawada Collection Center"
      );

      // 2. Collector transfers to Collection Center
      await initiateTransfer(
        collectorSigner,
        "PL-1001",
        HARDHAT_ACCOUNTS[2].address,
        100,
        "Transit Route A-12",
        "Dispatched via GreenLogistics EV truck"
      );

      // 3. Collection Center receives
      await confirmReceipt(
        centerSigner,
        "PL-1001",
        "City EcoSorting Hub, Bay 4",
        "Received sorted and baled PET bottles"
      );

      // 4. Center transfers to Recycler
      await initiateTransfer(
        centerSigner,
        "PL-1001",
        HARDHAT_ACCOUNTS[3].address,
        100,
        "Regional Highway 16",
        "Sent to PureCycle Polymers"
      );

      // 5. Recycler receives
      await confirmReceipt(
        recyclerSigner,
        "PL-1001",
        "PureCycle Facility - Processing Line 1",
        "Inspected and cleared for shredding & pelletization"
      );

      // 6. Recycler processes
      await recordProcessing(
        recyclerSigner,
        "PL-1001",
        100,
        80,
        20,
        "PureCycle Extrusion Bay",
        "Washed, melted, and pelletized into food-grade rPET flakes"
      );

      // Also seed an in-transit batch PL-1002
      await registerBatch(
        collectorSigner,
        "PL-1002",
        "HDPE",
        250,
        "Guntur Waste Recovery Hub"
      );
      await initiateTransfer(
        collectorSigner,
        "PL-1002",
        HARDHAT_ACCOUNTS[2].address,
        250,
        "Highway Route 5",
        "En route to sorting facility"
      );

      await refreshAllData();
      alert("Demonstration scenario successfully executed on the blockchain! Batch PL-1001 is now tracked through all 5 lifecycle stages.");
    } catch (err) {
      console.error("Demo seeding failed:", err);
      alert("Seeding failed: " + (err.reason || err.message));
    } finally {
      setIsSeeding(false);
    }
  };

  const handleSwitchToAddress = async (targetAddress) => {
    const idx = HARDHAT_ACCOUNTS.findIndex(
      (a) => a.address.toLowerCase() === targetAddress.toLowerCase()
    );
    if (idx !== -1) {
      setAuthMode("simulated");
      setCurrentAccountIndex(idx);
      const newSigner = await getSigner("simulated", idx);
      setSigner(newSigner);
    }
  };

  const currentAccount = HARDHAT_ACCOUNTS[currentAccountIndex] || HARDHAT_ACCOUNTS[1];

  return (
    <div className="app-container">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        networkStatus={networkStatus}
      />

      <div className="main-wrapper">
        <Header
          activeTab={activeTab}
          currentAccount={currentAccount}
          authMode={authMode}
          metaMaskAddress={metaMaskAddress}
          onOpenRoleModal={() => setIsRoleModalOpen(true)}
          onRefreshData={() => refreshAllData(false)}
          isRefreshing={isRefreshing}
        />

        <main className="content-body">
          {activeTab === "dashboard" && (
            <Dashboard
              metrics={metrics}
              batches={batches}
              onNavigate={setActiveTab}
              onSelectBatch={setSelectedBatchId}
              onSeedDemo={handleSeedDemo}
              isSeeding={isSeeding}
            />
          )}

          {activeTab === "register" && (
            <RegisterBatch
              currentAccount={currentAccount}
              signer={signer}
              batches={batches}
              onBatchRegistered={() => refreshAllData(false)}
              onNavigate={setActiveTab}
            />
          )}

          {activeTab === "tracking" && (
            <BatchTracking
              selectedBatchId={selectedBatchId}
              batches={batches}
              onSelectBatch={setSelectedBatchId}
            />
          )}

          {activeTab === "transfer" && (
            <TransferReceive
              currentAccount={currentAccount}
              signer={signer}
              batches={batches}
              onRefresh={() => refreshAllData(false)}
              onNavigate={setActiveTab}
              onSelectBatch={setSelectedBatchId}
              onSwitchToAddress={handleSwitchToAddress}
            />
          )}

          {activeTab === "process" && (
            <ProcessPlastic
              currentAccount={currentAccount}
              signer={signer}
              batches={batches}
              onRefresh={() => refreshAllData(false)}
              onNavigate={setActiveTab}
              onSelectBatch={setSelectedBatchId}
              onSwitchToAddress={handleSwitchToAddress}
            />
          )}

          {activeTab === "explorer" && (
            <BlockchainExplorer
              onSelectBatch={setSelectedBatchId}
              onNavigate={setActiveTab}
            />
          )}

          {activeTab === "verify" && (
            <PublicVerification
              batches={batches}
              onSelectBatch={setSelectedBatchId}
              onNavigate={setActiveTab}
            />
          )}

          {activeTab === "about" && <AboutProject />}
        </main>
      </div>

      <RoleSwitcherModal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        currentAccountIndex={currentAccountIndex}
        onSelectAccount={setCurrentAccountIndex}
        authMode={authMode}
        setAuthMode={setAuthMode}
        metaMaskAddress={metaMaskAddress}
        onConnectMetaMask={handleConnectMetaMask}
      />
    </div>
  );
}
