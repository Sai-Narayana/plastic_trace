import React, { useState, useEffect } from "react";
import { fetchBatch, fetchBatchHistory } from "../services/blockchain";
import {
  Search,
  Package,
  Clock,
  MapPin,
  User,
  ShieldCheck,
  ArrowRight,
  Truck,
  Recycle,
  CheckCircle2,
  AlertCircle,
  Hash,
} from "lucide-react";

export default function BatchTracking({ selectedBatchId, batches, onSelectBatch }) {
  const [searchInput, setSearchInput] = useState(selectedBatchId || "");
  const [currentBatch, setCurrentBatch] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Sync if selectedBatchId prop changes from parent
  useEffect(() => {
    if (selectedBatchId) {
      setSearchInput(selectedBatchId);
      loadBatchData(selectedBatchId);
    } else if (batches.length > 0 && !currentBatch) {
      setSearchInput(batches[0].batchId);
      loadBatchData(batches[0].batchId);
    }
  }, [selectedBatchId, batches]);

  const loadBatchData = async (batchId) => {
    if (!batchId) return;
    setLoading(true);
    setError(null);
    try {
      const b = await fetchBatch(batchId.trim().toUpperCase());
      const h = await fetchBatchHistory(batchId.trim().toUpperCase());
      setCurrentBatch(b);
      setHistory(h);
      if (onSelectBatch) onSelectBatch(batchId.trim().toUpperCase());
    } catch (err) {
      console.error("Batch tracking error:", err);
      setCurrentBatch(null);
      setHistory([]);
      setError(`Batch ID "${batchId}" not found on the blockchain. Please verify the ID.`);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      loadBatchData(searchInput.trim());
    }
  };

  return (
    <div>
      {/* Search Header */}
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <form onSubmit={handleSearch} style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <div style={{ position: "relative", flex: 1 }}>
            <Search
              size={18}
              style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-light)" }}
            />
            <input
              type="text"
              className="form-input mono"
              style={{ paddingLeft: "2.5rem" }}
              placeholder="Search by Batch ID (e.g. PL-1001, PL-1002)..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Searching..." : "Track Batch"}
          </button>
        </form>

        {/* Quick select pills */}
        {batches.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.75rem", flexWrap: "wrap" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--text-light)" }}>Quick Select:</span>
            {batches.map((b) => (
              <button
                key={b.batchId}
                type="button"
                className={`btn btn-sm ${currentBatch?.batchId === b.batchId ? "btn-primary" : "btn-secondary"}`}
                style={{ padding: "0.2rem 0.5rem", fontSize: "0.75rem" }}
                onClick={() => {
                  setSearchInput(b.batchId);
                  loadBatchData(b.batchId);
                }}
              >
                {b.batchId} ({b.plasticType})
              </button>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="alert alert-danger">
          <AlertCircle size={20} />
          <div>{error}</div>
        </div>
      )}

      {currentBatch && (
        <>
          {/* Batch Summary Card */}
          <div className="card" style={{ marginBottom: "1.5rem" }}>
            <div className="card-header">
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <h2 className="card-title mono" style={{ fontSize: "1.3rem", color: "var(--primary)" }}>
                  {currentBatch.batchId}
                </h2>
                <span className={`status-badge ${currentBatch.statusName.toLowerCase()}`}>
                  {currentBatch.statusName}
                </span>
                <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-muted)", background: "var(--bg-subtle)", padding: "0.2rem 0.6rem", borderRadius: "4px" }}>
                  Resin: {currentBatch.plasticType}
                </span>
              </div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-light)", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                <Clock size={14} /> Registered: {new Date(currentBatch.registrationTimestamp * 1000).toLocaleString()}
              </div>
            </div>

            <div className="grid-cols-4">
              <div style={{ background: "var(--bg-subtle)", padding: "1rem", borderRadius: "var(--radius-sm)" }}>
                <div className="stat-label">Initial Collected Mass</div>
                <div style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--text-main)", marginTop: "0.2rem" }}>
                  {currentBatch.initialQuantity} kg
                </div>
              </div>

              <div style={{ background: "var(--bg-subtle)", padding: "1rem", borderRadius: "var(--radius-sm)" }}>
                <div className="stat-label">Current Available Mass</div>
                <div style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--primary)", marginTop: "0.2rem" }}>
                  {currentBatch.currentQuantity} kg
                </div>
              </div>

              <div style={{ background: "var(--bg-subtle)", padding: "1rem", borderRadius: "var(--radius-sm)" }}>
                <div className="stat-label">Recycled Output</div>
                <div style={{ fontSize: "1.3rem", fontWeight: 700, color: "#7e22ce", marginTop: "0.2rem" }}>
                  {currentBatch.recycledOutput} kg
                </div>
              </div>

              <div style={{ background: "var(--bg-subtle)", padding: "1rem", borderRadius: "var(--radius-sm)" }}>
                <div className="stat-label">Residual Waste</div>
                <div style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--text-muted)", marginTop: "0.2rem" }}>
                  {currentBatch.residualWaste} kg
                </div>
              </div>
            </div>

            <div style={{ marginTop: "1.25rem", paddingTop: "1rem", borderTop: "1px solid var(--border-color)", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-light)", textTransform: "uppercase" }}>Current Custodian</div>
                <div className="mono" style={{ fontSize: "0.85rem", fontWeight: 600, marginTop: "0.2rem", wordBreak: "break-all" }}>
                  {currentBatch.currentCustodian}
                </div>
              </div>

              <div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-light)", textTransform: "uppercase" }}>Collection Location</div>
                <div style={{ fontSize: "0.85rem", fontWeight: 600, marginTop: "0.2rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                  <MapPin size={14} color="var(--primary)" /> {currentBatch.collectionLocation}
                </div>
              </div>
            </div>

            {currentBatch.pendingRecipient !== "0x0000000000000000000000000000000000000000" && (
              <div className="alert alert-warning" style={{ marginTop: "1rem", marginBottom: 0 }}>
                <Truck size={18} />
                <div>
                  <strong>Batch In Transit:</strong> Designated recipient awaiting custody acceptance:{" "}
                  <span className="mono">{currentBatch.pendingRecipient}</span>
                </div>
              </div>
            )}
          </div>

          {/* Chronological Lifecycle Timeline */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">
                <Clock size={20} color="var(--primary)" />
                On-Chain Lifecycle Audit Trail
              </h3>
              <span style={{ fontSize: "0.8rem", color: "var(--text-light)" }}>
                {history.length} Immutable Event{history.length === 1 ? "" : "s"} Recorded
              </span>
            </div>

            <div className="timeline-list">
              {history.map((record, index) => {
                let badgeColor = "var(--primary)";
                let icon = <CheckCircle2 size={12} />;
                if (record.eventTypeName === "TransferInitiated") {
                  badgeColor = "var(--amber)";
                  icon = <Truck size={12} />;
                } else if (record.eventTypeName === "ProcessingRecorded") {
                  badgeColor = "#7e22ce";
                  icon = <Recycle size={12} />;
                }

                return (
                  <div key={index} className="timeline-item">
                    <div className="timeline-node" style={{ borderColor: badgeColor, color: badgeColor }}>
                      {icon}
                    </div>
                    <div className="timeline-card">
                      <div className="timeline-card-header">
                        <span className="timeline-title" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <span>Step {index + 1}: {record.eventTypeName.replace(/([A-Z])/g, " $1").trim()}</span>
                          <span style={{ fontSize: "0.75rem", background: "var(--bg-card)", padding: "0.15rem 0.5rem", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
                            {record.quantity} kg
                          </span>
                        </span>
                        <span className="timeline-time">
                          {new Date(record.timestamp * 1000).toLocaleString()}
                        </span>
                      </div>

                      <div className="timeline-details">
                        <strong>Notes:</strong> {record.notes || "Recorded on blockchain"}
                      </div>
                      {record.details && (
                        <div style={{ fontSize: "0.8rem", color: "var(--text-light)", marginTop: "0.2rem" }}>
                          <strong>Details:</strong> {record.details}
                        </div>
                      )}

                      <div className="timeline-meta">
                        <div>
                          <strong>Actor (Signer):</strong>{" "}
                          <span className="mono">{record.actor.substring(0, 10)}...{record.actor.substring(36)}</span>
                        </div>
                        {record.recipient && record.recipient !== "0x0000000000000000000000000000000000000000" && (
                          <div>
                            <strong>Recipient:</strong>{" "}
                            <span className="mono">{record.recipient.substring(0, 10)}...{record.recipient.substring(36)}</span>
                          </div>
                        )}
                        {record.location && (
                          <div style={{ display: "flex", alignItems: "center", gap: "0.2rem" }}>
                            <MapPin size={12} /> {record.location}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
