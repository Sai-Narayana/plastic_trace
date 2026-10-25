import React, { useState } from "react";
import { initiateTransfer, confirmReceipt, HARDHAT_ACCOUNTS } from "../services/blockchain";
import TransactionFeedback from "../components/TransactionFeedback";
import { ArrowLeftRight, Truck, CheckCircle2, ShieldCheck, AlertCircle, MapPin, User, ArrowRight, Sparkles } from "lucide-react";

export default function TransferReceive({
  currentAccount,
  signer,
  batches,
  onRefresh,
  onNavigate,
  onSelectBatch,
  onSwitchToAddress,
}) {
  const [activeTab, setActiveTab] = useState("transfer"); // 'transfer' | 'receive'
  const [loading, setLoading] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [error, setError] = useState(null);

  // Transfer Form State
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [transferQty, setTransferQty] = useState("");
  const [transitLocation, setTransitLocation] = useState("Transit Route A-12");
  const [transferNotes, setTransferNotes] = useState("Dispatched via logistics carrier");

  // Receive Form State
  const [receiveBatchId, setReceiveBatchId] = useState("");
  const [receiveLocation, setReceiveLocation] = useState("City Facility Bay 4");
  const [receiveNotes, setReceiveNotes] = useState("Material inspected and custody accepted");

  // Filter batches in user's custody
  const myBatchesInCustody = batches.filter(
    (b) => b.currentCustodian.toLowerCase() === currentAccount.address.toLowerCase() && b.statusName !== "InTransit"
  );

  // Filter batches waiting for user's receipt
  const pendingForMe = batches.filter(
    (b) => b.pendingRecipient.toLowerCase() === currentAccount.address.toLowerCase() && b.statusName === "InTransit"
  );

  // All in transit batches
  const allInTransit = batches.filter((b) => b.statusName === "InTransit");

  const handleBatchSelect = (bId) => {
    setSelectedBatchId(bId);
    const b = batches.find((x) => x.batchId === bId);
    if (b) {
      setTransferQty(b.currentQuantity.toString());
    }
  };

  const handleInitiateTransfer = async (e) => {
    e.preventDefault();
    setError(null);
    setReceipt(null);

    if (!selectedBatchId) {
      setError("Please select a batch to transfer.");
      return;
    }

    if (!recipientAddress) {
      setError("Please select or enter a recipient stakeholder address.");
      return;
    }

    const qty = Number(transferQty);
    if (!qty || qty <= 0) {
      setError("Transfer quantity must be greater than zero.");
      return;
    }

    const b = batches.find((x) => x.batchId === selectedBatchId);
    if (b && qty > b.currentQuantity) {
      setError(`Quantity (${qty} kg) exceeds available batch balance (${b.currentQuantity} kg).`);
      return;
    }

    setLoading(true);
    try {
      const res = await initiateTransfer(
        signer,
        selectedBatchId,
        recipientAddress,
        qty,
        transitLocation,
        transferNotes
      );
      setReceipt(res);
      onRefresh();
    } catch (err) {
      console.error("Transfer error:", err);
      const reason = err.reason || err.message || "Transfer transaction reverted";
      setError(reason);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReceipt = async (e) => {
    e.preventDefault();
    setError(null);
    setReceipt(null);

    if (!receiveBatchId) {
      setError("Please select a pending batch to confirm receipt.");
      return;
    }

    // Verify recipient before submitting to prevent revert
    const targetBatch = batches.find((b) => b.batchId === receiveBatchId);
    if (targetBatch && targetBatch.pendingRecipient.toLowerCase() !== currentAccount.address.toLowerCase()) {
      const recipientAcc = HARDHAT_ACCOUNTS.find(
        (a) => a.address.toLowerCase() === targetBatch.pendingRecipient.toLowerCase()
      );
      setError(
        `PlasticTrace: Caller is not the designated recipient. Batch ${receiveBatchId} was transferred to ${
          recipientAcc?.name || targetBatch.pendingRecipient
        }. You must switch to that persona to confirm receipt.`
      );
      return;
    }

    setLoading(true);
    try {
      const res = await confirmReceipt(
        signer,
        receiveBatchId,
        receiveLocation,
        receiveNotes
      );
      setReceipt(res);
      onRefresh();
    } catch (err) {
      console.error("Receive error:", err);
      const reason = err.reason || err.message || "Confirmation failed";
      setError(reason);
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchAndAccept = (targetBatch) => {
    setError(null);
    if (onSwitchToAddress) {
      onSwitchToAddress(targetBatch.pendingRecipient);
    }
    setReceiveBatchId(targetBatch.batchId);
    setActiveTab("receive");
  };

  return (
    <div style={{ maxWidth: "860px" }}>
      <TransactionFeedback
        receipt={receipt}
        error={error}
        onClear={() => {
          setReceipt(null);
          setError(null);
        }}
        onViewExplorer={() => onNavigate("explorer")}
      />

      <div className="tabs">
        <button
          className={`tab-btn ${activeTab === "transfer" ? "active" : ""}`}
          onClick={() => setActiveTab("transfer")}
        >
          <ArrowLeftRight size={16} style={{ display: "inline", marginRight: "6px" }} />
          1. Initiate Batch Transfer ({myBatchesInCustody.length} available)
        </button>
        <button
          className={`tab-btn ${activeTab === "receive" ? "active" : ""}`}
          onClick={() => setActiveTab("receive")}
        >
          <CheckCircle2 size={16} style={{ display: "inline", marginRight: "6px" }} />
          2. Confirm Receipt ({pendingForMe.length} pending for you)
        </button>
      </div>

      {activeTab === "transfer" && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <Truck size={20} color="var(--primary)" />
              Initiate Custody Transfer
            </h3>
            <span style={{ fontSize: "0.8rem", color: "var(--text-light)" }}>
              Caller: <strong>{currentAccount.name}</strong> ({currentAccount.role})
            </span>
          </div>

          <form onSubmit={handleInitiateTransfer}>
            <div className="form-group">
              <label className="form-label">Select Waste Batch</label>
              <select
                className="form-select mono"
                value={selectedBatchId}
                onChange={(e) => handleBatchSelect(e.target.value)}
                required
              >
                <option value="">-- Choose a batch in your custody --</option>
                {batches.map((b) => {
                  const isMine = b.currentCustodian.toLowerCase() === currentAccount.address.toLowerCase();
                  return (
                    <option key={b.batchId} value={b.batchId}>
                      {b.batchId} - {b.plasticType} ({b.currentQuantity} kg) - Status: {b.statusName} {isMine ? "[In Custody]" : `[Custodian: ${b.currentCustodian.substring(0, 6)}...]`}
                    </option>
                  );
                })}
              </select>
              <div className="form-help">
                Smart contract requires the caller to be the <code>currentCustodian</code> and the batch not in transit.
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Designated Recipient Stakeholder</label>
              <select
                className="form-select"
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
                required
              >
                <option value="">-- Select receiving stakeholder --</option>
                {HARDHAT_ACCOUNTS.filter((a) => a.address.toLowerCase() !== currentAccount.address.toLowerCase()).map((acc) => (
                  <option key={acc.address} value={acc.address}>
                    {acc.name} ({acc.role}) - {acc.address.substring(0, 8)}...
                  </option>
                ))}
              </select>
              <div className="form-help">
                Flow Rule: Collector ➔ Collection Center ➔ Recycler ➔ Manufacturer.
              </div>
            </div>

            <div className="grid-cols-2">
              <div className="form-group">
                <label className="form-label">Transfer Mass (Kilograms)</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  className="form-input"
                  placeholder="100"
                  value={transferQty}
                  onChange={(e) => setTransferQty(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Transit Waybill / Route Location</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Highway Route A-12, Checkpoint 3"
                  value={transitLocation}
                  onChange={(e) => setTransitLocation(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Transfer Dispatch Notes</label>
              <input
                type="text"
                className="form-input"
                placeholder="Dispatched via EV logistics truck with GPS tracking"
                value={transferNotes}
                onChange={(e) => setTransferNotes(e.target.value)}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1.5rem" }}>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                <Truck size={16} />
                {loading ? "Dispatching on Blockchain..." : "Dispatch Transfer"}
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === "receive" && (
        <div>
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">
                <CheckCircle2 size={20} color="var(--primary)" />
                Confirm Incoming Transfer Receipt
              </h3>
              <span style={{ fontSize: "0.8rem", color: "var(--text-light)" }}>
                Active Recipient: <strong>{currentAccount.name}</strong>
              </span>
            </div>

            {pendingForMe.length === 0 ? (
              <div style={{ textAlign: "center", padding: "2rem 1rem", color: "var(--text-light)" }}>
                <Truck size={36} style={{ opacity: 0.3, marginBottom: "0.5rem" }} />
                <div>No pending transfers currently assigned to your active wallet address.</div>
                {allInTransit.length > 0 && (
                  <div style={{ marginTop: "1rem", padding: "1rem", background: "var(--bg-subtle)", borderRadius: "var(--radius-sm)", textAlign: "left" }}>
                    <div style={{ fontWeight: 600, fontSize: "0.85rem", color: "var(--text-main)", marginBottom: "0.5rem" }}>
                      ⚡ In-Transit Batches Awaiting Acceptance by Other Stakeholders:
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      {allInTransit.map((b) => {
                        const targetAcc = HARDHAT_ACCOUNTS.find(
                          (a) => a.address.toLowerCase() === b.pendingRecipient.toLowerCase()
                        );
                        return (
                          <div
                            key={b.batchId}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              background: "#ffffff",
                              padding: "0.6rem 0.85rem",
                              borderRadius: "4px",
                              border: "1px solid var(--border-color)",
                            }}
                          >
                            <div>
                              <strong className="mono" style={{ color: "var(--primary)" }}>{b.batchId}</strong> ({b.plasticType}, {b.currentQuantity} kg)
                              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginLeft: "0.5rem" }}>
                                Waiting for: <strong>{targetAcc?.name || b.pendingRecipient.substring(0, 8)}</strong>
                              </span>
                            </div>
                            <button
                              type="button"
                              className="btn btn-primary btn-sm"
                              onClick={() => handleSwitchAndAccept(b)}
                            >
                              <Sparkles size={12} /> Switch to {targetAcc?.role || "Recipient"} & Accept
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={handleConfirmReceipt}>
                <div className="form-group">
                  <label className="form-label">Pending In-Transit Batches</label>
                  <select
                    className="form-select mono"
                    value={receiveBatchId}
                    onChange={(e) => setReceiveBatchId(e.target.value)}
                    required
                  >
                    <option value="">-- Choose incoming batch to accept --</option>
                    {pendingForMe.map((b) => (
                      <option key={b.batchId} value={b.batchId}>
                        {b.batchId} ({b.plasticType}) - {b.currentQuantity} kg from {b.currentCustodian.substring(0, 8)}...
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid-cols-2">
                  <div className="form-group">
                    <label className="form-label">Receiving Facility Location</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. City EcoSorting Hub, Warehouse Bay 4"
                      value={receiveLocation}
                      onChange={(e) => setReceiveLocation(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Inspection & Acceptance Notes</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Weighed, inspected, and accepted into custody"
                      value={receiveNotes}
                      onChange={(e) => setReceiveNotes(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1.5rem" }}>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    <CheckCircle2 size={16} />
                    {loading ? "Confirming Receipt..." : "Accept Custody On-Chain"}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Pending In-Transit Overview */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">All In-Transit Batches Across Network</h3>
              <span style={{ fontSize: "0.8rem", color: "var(--text-light)" }}>
                {allInTransit.length} Active Transfer{allInTransit.length === 1 ? "" : "s"}
              </span>
            </div>

            {allInTransit.length === 0 ? (
              <div style={{ textAlign: "center", padding: "1.5rem", color: "var(--text-light)", fontSize: "0.85rem" }}>
                No batches currently in transit on the blockchain.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Batch ID</th>
                      <th>Resin</th>
                      <th>Qty</th>
                      <th>Sender (Custodian)</th>
                      <th>Pending Recipient</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allInTransit.map((b) => {
                      const isPendingForMe = b.pendingRecipient.toLowerCase() === currentAccount.address.toLowerCase();
                      const targetAcc = HARDHAT_ACCOUNTS.find(
                        (a) => a.address.toLowerCase() === b.pendingRecipient.toLowerCase()
                      );
                      return (
                        <tr key={b.batchId}>
                          <td className="mono" style={{ fontWeight: 600, color: "var(--primary)" }}>
                            {b.batchId}
                          </td>
                          <td>{b.plasticType}</td>
                          <td>{b.currentQuantity} kg</td>
                          <td className="mono" style={{ fontSize: "0.75rem" }}>
                            {b.currentCustodian.substring(0, 6)}...{b.currentCustodian.substring(38)}
                          </td>
                          <td style={{ fontSize: "0.8rem" }}>
                            <strong>{targetAcc?.name || b.pendingRecipient.substring(0, 8)}</strong>
                            {isPendingForMe && <span className="status-badge received" style={{ marginLeft: "6px" }}>You</span>}
                          </td>
                          <td>
                            {isPendingForMe ? (
                              <button
                                className="btn btn-primary btn-sm"
                                onClick={() => {
                                  setReceiveBatchId(b.batchId);
                                  setActiveTab("receive");
                                }}
                              >
                                Accept Custody
                              </button>
                            ) : (
                              <button
                                className="btn btn-outline-primary btn-sm"
                                onClick={() => handleSwitchAndAccept(b)}
                                title={`Switch persona to ${targetAcc?.name} and confirm receipt`}
                              >
                                Switch to {targetAcc?.role || "Recipient"} & Accept
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
