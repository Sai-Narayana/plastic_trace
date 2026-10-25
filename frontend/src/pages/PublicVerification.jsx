import React, { useState } from "react";
import { fetchBatch, fetchBatchHistory } from "../services/blockchain";
import { ShieldCheck, CheckCircle2, AlertCircle, Search, Award, FileText, Check, Lock, ExternalLink } from "lucide-react";

export default function PublicVerification({ batches, onSelectBatch, onNavigate }) {
  const [verifyId, setVerifyId] = useState("");
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!verifyId.trim()) return;

    setLoading(true);
    setSearched(true);
    setResult(null);
    setHistory([]);

    try {
      const b = await fetchBatch(verifyId.trim().toUpperCase());
      const h = await fetchBatchHistory(verifyId.trim().toUpperCase());
      setResult(b);
      setHistory(h);
    } catch (err) {
      console.warn("Batch verification check:", err);
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "860px" }}>
      {/* Search Bar */}
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <div className="card-header">
          <h3 className="card-title">
            <ShieldCheck size={20} color="var(--primary)" />
            Public Batch Provenance & Authenticity Verification
          </h3>
          <span style={{ fontSize: "0.8rem", color: "var(--text-light)" }}>
            Consumer & ESG Auditor Portal
          </span>
        </div>

        <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
          Verify whether plastic packaging claims originate from authentic, on-chain recorded recycling workflows.
        </p>

        <form onSubmit={handleVerify} style={{ display: "flex", gap: "0.75rem" }}>
          <input
            type="text"
            className="form-input mono"
            placeholder="Enter Batch ID (e.g. PL-1001)..."
            value={verifyId}
            onChange={(e) => setVerifyId(e.target.value)}
            required
          />
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Verifying..." : "Verify Batch"}
          </button>
        </form>

        {batches.length > 0 && (
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--text-light)" }}>Registered Batches:</span>
            {batches.map((b) => (
              <button
                key={b.batchId}
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ padding: "0.2rem 0.5rem", fontSize: "0.75rem" }}
                onClick={() => {
                  setVerifyId(b.batchId);
                }}
              >
                {b.batchId}
              </button>
            ))}
          </div>
        )}
      </div>

      {searched && !loading && !result && (
        <div className="alert alert-danger">
          <AlertCircle size={20} />
          <div>
            <strong>Verification Failed:</strong> Batch ID "{verifyId.toUpperCase()}" was not found on the configured blockchain ledger. No cryptographic chain of custody exists for this identifier.
          </div>
        </div>
      )}

      {result && (
        <div className="card" style={{ border: "2px solid var(--primary-border)" }}>
          {/* Certificate Header Banner */}
          <div
            style={{
              background: "var(--primary-light)",
              padding: "1.5rem",
              borderRadius: "var(--radius-sm)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1.5rem",
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Award size={28} color="var(--primary)" />
                <h2 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#064e3b" }}>
                  Cryptographic Traceability Certificate
                </h2>
              </div>
              <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                Authentic batch recorded on Ethereum Virtual Machine (EVM)
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <span className="status-badge completed" style={{ fontSize: "0.85rem", padding: "0.35rem 0.85rem" }}>
                <Check size={14} /> Verified On-Chain
              </span>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid-cols-2" style={{ marginBottom: "1.5rem" }}>
            <div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-light)", textTransform: "uppercase" }}>Batch ID</div>
              <div className="mono" style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--primary)", marginTop: "0.2rem" }}>
                {result.batchId}
              </div>
            </div>

            <div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-light)", textTransform: "uppercase" }}>Resin Polymer</div>
              <div style={{ fontSize: "1.1rem", fontWeight: 600, marginTop: "0.2rem" }}>
                {result.plasticType}
              </div>
            </div>

            <div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-light)", textTransform: "uppercase" }}>Current Lifecycle Status</div>
              <div style={{ marginTop: "0.3rem" }}>
                <span className={`status-badge ${result.statusName.toLowerCase()}`}>
                  {result.statusName}
                </span>
              </div>
            </div>

            <div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-light)", textTransform: "uppercase" }}>Total Lifecycle Events</div>
              <div style={{ fontSize: "1.1rem", fontWeight: 600, marginTop: "0.2rem" }}>
                {history.length} Confirmed Transitions
              </div>
            </div>
          </div>

          {/* Quantity Mass Breakdown */}
          <div style={{ background: "var(--bg-subtle)", padding: "1.25rem", borderRadius: "var(--radius-sm)", marginBottom: "1.5rem" }}>
            <h4 style={{ fontSize: "0.85rem", fontWeight: 700, marginBottom: "0.75rem", textTransform: "uppercase", letterSpacing: "0.03em" }}>
              Mass Balance Audit Summary
            </h4>
            <div className="grid-cols-3">
              <div>
                <span style={{ fontSize: "0.75rem", color: "var(--text-light)" }}>Initial Collected:</span>
                <div style={{ fontSize: "1.1rem", fontWeight: 700 }}>{result.initialQuantity} kg</div>
              </div>
              <div>
                <span style={{ fontSize: "0.75rem", color: "var(--text-light)" }}>Recycled Material (rPET):</span>
                <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--primary)" }}>{result.recycledOutput} kg</div>
              </div>
              <div>
                <span style={{ fontSize: "0.75rem", color: "var(--text-light)" }}>Residual Tailings:</span>
                <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-muted)" }}>{result.residualWaste} kg</div>
              </div>
            </div>
          </div>

          {/* Critical Distinction Notice (Viva Defense Point) */}
          <div className="alert alert-info" style={{ marginBottom: 0 }}>
            <Lock size={20} style={{ minWidth: 20 }} />
            <div>
              <strong style={{ display: "block", marginBottom: "0.2rem" }}>
                Academic Distinction: Record Integrity vs. Physical Verification
              </strong>
              <div style={{ fontSize: "0.8rem", lineHeight: 1.4 }}>
                <strong>Record Integrity:</strong> Proven cryptographically. The timestamps, custodian addresses, and lifecycle event claims are permanently sealed in smart contract storage and cannot be tampered with or overwritten.<br />
                <strong>Physical Verification:</strong> The blockchain ledger records authorized claims. It does not physically inspect polymers or prove physical delivery without complementary physical inspection, weighbridge IoT calibrations, and laboratory resin testing.
              </div>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1.25rem" }}>
            <button
              className="btn btn-primary"
              onClick={() => {
                onSelectBatch(result.batchId);
                onNavigate("tracking");
              }}
            >
              View Full Audit Timeline <ExternalLink size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
