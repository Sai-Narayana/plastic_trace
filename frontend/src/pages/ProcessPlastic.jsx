import React, { useState, useEffect } from "react";
import { recordProcessing } from "../services/blockchain";
import TransactionFeedback from "../components/TransactionFeedback";
import { Recycle, Scale, CheckCircle2, AlertTriangle, ShieldAlert, Info, Sparkles } from "lucide-react";

export default function ProcessPlastic({
  currentAccount,
  signer,
  batches,
  onRefresh,
  onNavigate,
  onSelectBatch,
}) {
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [processedQty, setProcessedQty] = useState("");
  const [recycledOutput, setRecycledOutput] = useState("");
  const [residualWaste, setResidualWaste] = useState("");
  const [facilityLocation, setFacilityLocation] = useState("PureCycle Extrusion Facility - Bay 2");
  const [processNotes, setProcessNotes] = useState("Shredded, washed, hot-air dried, and pelletized into rPET");
  const [loading, setLoading] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [error, setError] = useState(null);

  // Filter batches in recycler's custody that can be processed
  const recyclableBatches = batches.filter((b) => {
    const isCustodian = b.currentCustodian.toLowerCase() === currentAccount.address.toLowerCase();
    const canProcess = b.statusName === "Received" || b.statusName === "Registered";
    return isCustodian && canProcess;
  });

  const handleSelectBatch = (bId) => {
    setSelectedBatchId(bId);
    const b = batches.find((x) => x.batchId === bId);
    if (b) {
      const q = b.currentQuantity;
      setProcessedQty(q.toString());
      // Default 80% recycled, 20% residual for quick demonstration
      const defRecycled = Math.floor(q * 0.8);
      const defResidual = q - defRecycled;
      setRecycledOutput(defRecycled.toString());
      setResidualWaste(defResidual.toString());
    }
  };

  const pQty = Number(processedQty) || 0;
  const rOut = Number(recycledOutput) || 0;
  const resWaste = Number(residualWaste) || 0;
  const massSum = rOut + resWaste;
  const isMassBalanced = pQty > 0 && pQty === massSum;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setReceipt(null);

    if (!selectedBatchId) {
      setError("Please select a batch in your custody to process.");
      return;
    }

    if (pQty <= 0) {
      setError("Quantity processed must be greater than zero.");
      return;
    }

    const b = batches.find((x) => x.batchId === selectedBatchId);
    if (b && pQty > b.currentQuantity) {
      setError(`Quantity processed (${pQty} kg) exceeds available batch quantity (${b.currentQuantity} kg).`);
      return;
    }

    if (!isMassBalanced) {
      setError(
        `Mass-Balance Conservation Error: Quantity Processed (${pQty} kg) must strictly equal Recycled Output (${rOut} kg) + Residual Waste (${resWaste} kg) = ${massSum} kg.`
      );
      return;
    }

    if (currentAccount.role !== "Recycler" && currentAccount.role !== "Admin") {
      setError(
        `Access Denied: You are acting as "${currentAccount.role}". Only authorized Recyclers or Admin can execute processing on-chain.`
      );
      return;
    }

    setLoading(true);
    try {
      const txReceipt = await recordProcessing(
        signer,
        selectedBatchId,
        pQty,
        rOut,
        resWaste,
        facilityLocation,
        processNotes
      );
      setReceipt(txReceipt);
      onRefresh();
    } catch (err) {
      console.error("Processing error:", err);
      const reason = err.reason || err.message || "Processing transaction reverted";
      setError(reason);
    } finally {
      setLoading(false);
    }
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

      {currentAccount.role !== "Recycler" && currentAccount.role !== "Admin" && (
        <div className="alert alert-warning">
          <ShieldAlert size={20} />
          <div>
            <strong>Role Check:</strong> You are currently acting as{" "}
            <strong>{currentAccount.name} ({currentAccount.role})</strong>. The smart contract requires an authorized{" "}
            <strong>Recycler</strong> role to call <code>recordProcessing</code>. Please switch to Recycler via the top-right button.
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            <Recycle size={20} color="#7e22ce" />
            Plastic Reprocessing & Mass-Balance Record
          </h3>
          <span style={{ fontSize: "0.8rem", color: "var(--text-light)" }}>
            Smart Contract: <code>recordProcessing(...)</code>
          </span>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Select Plastic Waste Batch</label>
            <select
              className="form-select mono"
              value={selectedBatchId}
              onChange={(e) => handleSelectBatch(e.target.value)}
              required
            >
              <option value="">-- Choose a batch in Recycler custody --</option>
              {batches.map((b) => {
                const isCustodian = b.currentCustodian.toLowerCase() === currentAccount.address.toLowerCase();
                const canProcess = b.statusName === "Received" || b.statusName === "Registered";
                return (
                  <option key={b.batchId} value={b.batchId}>
                    {b.batchId} ({b.plasticType}) - {b.currentQuantity} kg - Status: {b.statusName} {isCustodian && canProcess ? "[Ready to Process]" : `[Custodian: ${b.currentCustodian.substring(0, 6)}...]`}
                  </option>
                );
              })}
            </select>
            <div className="form-help">
              Batches must be in <code>Received</code> status and owned by your recycler address.
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Total Quantity Processed (Kilograms)</label>
            <input
              type="number"
              min="1"
              step="1"
              className="form-input"
              placeholder="100"
              value={processedQty}
              onChange={(e) => setProcessedQty(e.target.value)}
              required
            />
            <div className="form-help">Total input mass fed into shredders and extrusion machinery.</div>
          </div>

          {/* Mass-Balance Interactive Calculator */}
          <div
            style={{
              background: isMassBalanced ? "var(--primary-light)" : "var(--amber-light)",
              border: isMassBalanced ? "1px solid var(--primary-border)" : "1px solid var(--amber-border)",
              borderRadius: "var(--radius-sm)",
              padding: "1rem",
              marginBottom: "1.25rem",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 600, fontSize: "0.875rem" }}>
                <Scale size={18} color={isMassBalanced ? "var(--primary)" : "var(--amber)"} />
                <span>Mass-Balance Conservation Check</span>
              </div>
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  padding: "0.2rem 0.6rem",
                  borderRadius: "12px",
                  background: isMassBalanced ? "var(--primary)" : "var(--amber)",
                  color: "#ffffff",
                }}
              >
                {isMassBalanced ? "BALANCED (Conservation Verified)" : `MISMATCH: ${pQty - massSum} kg difference`}
              </span>
            </div>

            <div className="grid-cols-2">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: "0.8rem" }}>
                  Usable Recycled Output (kg)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  className="form-input"
                  placeholder="80"
                  value={recycledOutput}
                  onChange={(e) => setRecycledOutput(e.target.value)}
                  required
                />
                <div className="form-help">Food-grade flakes, pellets, or regrind.</div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: "0.8rem" }}>
                  Residual / Rejected Waste (kg)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  className="form-input"
                  placeholder="20"
                  value={residualWaste}
                  onChange={(e) => setResidualWaste(e.target.value)}
                  required
                />
                <div className="form-help">Labels, adhesives, non-target polymer tailings.</div>
              </div>
            </div>

            <div style={{ marginTop: "0.75rem", fontSize: "0.75rem", color: "var(--text-muted)" }}>
              Equation: <code>{pQty || 0} kg [Processed] = {rOut || 0} kg [Recycled] + {resWaste || 0} kg [Residual]</code>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Facility & Extrusion Line Location</label>
            <input
              type="text"
              className="form-input"
              value={facilityLocation}
              onChange={(e) => setFacilityLocation(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Processing Notes & Quality Specifications</label>
            <textarea
              rows="2"
              className="form-textarea"
              value={processNotes}
              onChange={(e) => setProcessNotes(e.target.value)}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1.5rem" }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !isMassBalanced}
            >
              <Recycle size={16} />
              {loading ? "Recording Processing..." : "Record Processing On-Chain"}
            </button>
          </div>
        </form>
      </div>

      <div className="card" style={{ background: "var(--bg-subtle)" }}>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <Info size={18} color="var(--text-light)" style={{ minWidth: 18, marginTop: 2 }} />
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
            <strong style={{ color: "var(--text-main)" }}>Academic Integrity & Physical Reality Check:</strong>
            <p style={{ marginTop: "0.25rem" }}>
              This module records <strong>authorized digital claims</strong> about physical recycling events. The smart contract validates numerical mass conservation to prevent double-counting or fictitious recycling certificates. Independent physical auditing and laboratory testing verify the actual material properties.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
