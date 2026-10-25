import React, { useState } from "react";
import { registerBatch } from "../services/blockchain";
import TransactionFeedback from "../components/TransactionFeedback";
import { PlusCircle, Sparkles, ShieldAlert, CheckCircle, Info } from "lucide-react";

export default function RegisterBatch({
  currentAccount,
  signer,
  batches,
  onBatchRegistered,
  onNavigate,
}) {
  const [batchId, setBatchId] = useState("");
  const [plasticType, setPlasticType] = useState("PET");
  const [quantity, setQuantity] = useState("100");
  const [location, setLocation] = useState("Vijayawada Collection Center");
  const [loading, setLoading] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [error, setError] = useState(null);

  // Generate next unique Batch ID
  const handleAutoGenerateId = () => {
    let nextNum = 1001;
    while (batches.some((b) => b.batchId === `PL-${nextNum}`)) {
      nextNum++;
    }
    setBatchId(`PL-${nextNum}`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setReceipt(null);

    // Validation
    const trimmedId = batchId.trim().toUpperCase();
    if (!trimmedId) {
      setError("Please specify a valid Batch ID.");
      return;
    }

    if (batches.some((b) => b.batchId.toUpperCase() === trimmedId)) {
      setError(`Batch ID "${trimmedId}" already exists on the blockchain. Batch IDs must be strictly unique.`);
      return;
    }

    const numQty = Number(quantity);
    if (!numQty || numQty <= 0) {
      setError("Initial quantity must be a positive number greater than 0 kg.");
      return;
    }

    if (!location.trim()) {
      setError("Collection location is required.");
      return;
    }

    // Role check warning / defense
    const isCollectorOrAdmin = currentAccount.role === "Collector" || currentAccount.role === "Admin";
    if (!isCollectorOrAdmin) {
      setError(
        `Access Denied: Current persona is "${currentAccount.role}". Only authorized Collectors or Admin can register batches. Switch persona to Collector using the top-right button.`
      );
      return;
    }

    setLoading(true);
    try {
      const txReceipt = await registerBatch(
        signer,
        trimmedId,
        plasticType,
        numQty,
        location.trim()
      );
      setReceipt(txReceipt);
      onBatchRegistered();
    } catch (err) {
      console.error("Registration error:", err);
      const reason = err.reason || err.message || "Transaction failed";
      setError(reason);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "800px" }}>
      <TransactionFeedback
        receipt={receipt}
        error={error}
        onClear={() => {
          setReceipt(null);
          setError(null);
        }}
        onViewExplorer={() => onNavigate("explorer")}
      />

      {currentAccount.role !== "Collector" && currentAccount.role !== "Admin" && (
        <div className="alert alert-warning">
          <ShieldAlert size={20} />
          <div>
            <strong>Access Warning:</strong> You are currently acting as{" "}
            <strong>{currentAccount.name} ({currentAccount.role})</strong>. The smart contract requires an authorized{" "}
            <strong>Collector</strong> role to call <code>registerBatch</code>. Please switch persona via the top-right button to submit successfully.
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            <PlusCircle size={20} color="var(--primary)" />
            Waste Batch Registration Form
          </h3>
          <span style={{ fontSize: "0.8rem", color: "var(--text-light)" }}>
            Smart Contract: <code>registerBatch(...)</code>
          </span>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label className="form-label">Batch Identifier (Unique ID)</label>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleAutoGenerateId}
                style={{ padding: "0.2rem 0.5rem", fontSize: "0.75rem" }}
              >
                <Sparkles size={12} /> Auto-Generate
              </button>
            </div>
            <input
              type="text"
              className="form-input mono"
              placeholder="e.g. PL-1001"
              value={batchId}
              onChange={(e) => setBatchId(e.target.value)}
              required
            />
            <div className="form-help">
              Unique identifier tracked throughout the recycling lifecycle. Must not be a duplicate.
            </div>
          </div>

          <div className="grid-cols-2">
            <div className="form-group">
              <label className="form-label">Resin / Plastic Type</label>
              <select
                className="form-select"
                value={plasticType}
                onChange={(e) => setPlasticType(e.target.value)}
              >
                <option value="PET">PET (Polyethylene Terephthalate - Bottles, Trays)</option>
                <option value="HDPE">HDPE (High-Density Polyethylene - Milk Jugs, Shampoo)</option>
                <option value="LDPE">LDPE (Low-Density Polyethylene - Films, Bags)</option>
                <option value="PP">PP (Polypropylene - Caps, Tupperware)</option>
                <option value="Other">Other / Mixed Polymers</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Initial Collected Mass (Kilograms)</label>
              <input
                type="number"
                min="1"
                step="1"
                className="form-input"
                placeholder="100"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
              />
              <div className="form-help">Physical weight measured at recovery point.</div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Collection Location & Center</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Vijayawada Collection Center, Yard #2"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Signing Collector Address (On-Chain Custodian)</label>
            <input
              type="text"
              className="form-input mono"
              value={currentAccount.address}
              disabled
              style={{ background: "var(--bg-subtle)" }}
            />
            <div className="form-help">
              This wallet will be assigned initial custody and authorized to initiate transfer.
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1.5rem" }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setBatchId("");
                setQuantity("100");
                setLocation("Vijayawada Collection Center");
              }}
            >
              Reset
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              <PlusCircle size={16} />
              {loading ? "Confirming on Blockchain..." : "Register Batch On-Chain"}
            </button>
          </div>
        </form>
      </div>

      <div className="card" style={{ background: "var(--teal-light)", border: "1px solid var(--primary-border)" }}>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <Info size={20} color="var(--primary)" style={{ minWidth: 20, marginTop: 2 }} />
          <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
            <strong style={{ color: "var(--text-main)" }}>On-Chain Lifecycle Logic:</strong>
            <p style={{ marginTop: "0.25rem" }}>
              Upon successful mining, <code>PlasticWasteTraceability.sol</code> records the batch with status{" "}
              <code>Registered</code>, assigns custody to your Collector address, emits the <code>BatchRegistered</code>{" "}
              event, and appends the initial record to the immutable audit trail.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
