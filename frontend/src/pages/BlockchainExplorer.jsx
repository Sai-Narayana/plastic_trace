import React, { useState, useEffect } from "react";
import { fetchAllEvents, checkBlockchainStatus } from "../services/blockchain";
import { Blocks, Hash, Layers, ArrowUpRight, Clock, FileCode, CheckCircle2, Shield, RefreshCw } from "lucide-react";
import contractData from "../contracts/contractData.json";

export default function BlockchainExplorer({ onSelectBatch, onNavigate }) {
  const [events, setEvents] = useState([]);
  const [chainStatus, setChainStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const status = await checkBlockchainStatus();
      setChainStatus(status);
      const evs = await fetchAllEvents();
      setEvents(evs);
    } catch (e) {
      console.error("Explorer loading error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div>
      {/* Explorer Overview Header */}
      <div className="grid-cols-4" style={{ marginBottom: "1.5rem" }}>
        <div className="stat-card">
          <div>
            <div className="stat-label">Local EVM Status</div>
            <div className="stat-value" style={{ color: chainStatus?.connected ? "var(--primary)" : "var(--red)" }}>
              {chainStatus?.connected ? "ONLINE" : "OFFLINE"}
            </div>
            <div className="stat-sub">Hardhat Network (RPC :8545)</div>
          </div>
          <div className="stat-icon" style={{ background: chainStatus?.connected ? "var(--primary-light)" : "var(--red-light)", color: chainStatus?.connected ? "var(--primary)" : "var(--red)" }}>
            <Blocks size={24} />
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-label">Current Block Height</div>
            <div className="stat-value">#{chainStatus?.blockNumber ?? 0}</div>
            <div className="stat-sub">Mined on Chain ID 31337</div>
          </div>
          <div className="stat-icon" style={{ background: "#e0f2fe", color: "#0284c7" }}>
            <Layers size={24} />
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-label">Contract Events</div>
            <div className="stat-value">{events.length}</div>
            <div className="stat-sub">Mined Lifecycle Transitions</div>
          </div>
          <div className="stat-icon" style={{ background: "#f3e8ff", color: "#7e22ce" }}>
            <Hash size={24} />
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-label">Contract Address</div>
            <div className="mono" style={{ fontSize: "0.85rem", fontWeight: 700, marginTop: "0.4rem", wordBreak: "break-all" }}>
              {contractData.contractAddress.substring(0, 10)}...{contractData.contractAddress.substring(34)}
            </div>
            <div className="stat-sub">Solidity 0.8.24 Verified</div>
          </div>
          <div className="stat-icon" style={{ background: "#ecfdf5", color: "var(--teal)" }}>
            <FileCode size={24} />
          </div>
        </div>
      </div>

      {/* Events / Transactions Table */}
      <div className="card">
        <div className="card-header">
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <h3 className="card-title">Real Smart Contract Transactions & Events</h3>
            <button className="btn btn-secondary btn-sm" onClick={loadData} disabled={loading}>
              <RefreshCw size={12} className={loading ? "spin" : ""} />
            </button>
          </div>
          <span style={{ fontSize: "0.8rem", color: "var(--text-light)" }}>
            {events.length} logs found from genesis block
          </span>
        </div>

        {events.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2.5rem 1rem", color: "var(--text-light)" }}>
            <Hash size={36} style={{ opacity: 0.3, marginBottom: "0.5rem" }} />
            <div>No events recorded yet. Perform transactions or load demo seed data to populate.</div>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Block #</th>
                  <th>Event Name</th>
                  <th>Batch ID</th>
                  <th>Transaction Hash</th>
                  <th>Key Parameters</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {events.map((ev, idx) => {
                  const bId = ev.args?.batchId || "N/A";
                  let eventBadgeClass = "registered";
                  if (ev.eventName === "TransferInitiated") eventBadgeClass = "intransit";
                  if (ev.eventName === "BatchReceived") eventBadgeClass = "received";
                  if (ev.eventName === "ProcessingRecorded") eventBadgeClass = "processed";
                  if (ev.eventName === "StakeholderRoleUpdated") eventBadgeClass = "admin";

                  return (
                    <tr key={`${ev.transactionHash}-${idx}`}>
                      <td className="mono" style={{ fontWeight: 600 }}>
                        #{ev.blockNumber}
                      </td>
                      <td>
                        <span className={`status-badge ${eventBadgeClass}`}>
                          {ev.eventName}
                        </span>
                      </td>
                      <td>
                        {bId !== "N/A" ? (
                          <strong
                            className="mono"
                            style={{ color: "var(--primary)", cursor: "pointer" }}
                            onClick={() => {
                              onSelectBatch(bId);
                              onNavigate("tracking");
                            }}
                          >
                            {bId}
                          </strong>
                        ) : (
                          <span style={{ color: "var(--text-light)" }}>-</span>
                        )}
                      </td>
                      <td className="mono" style={{ fontSize: "0.75rem" }}>
                        {ev.transactionHash.substring(0, 14)}...{ev.transactionHash.substring(56)}
                      </td>
                      <td style={{ fontSize: "0.75rem", color: "var(--text-muted)", maxWidth: "280px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {ev.eventName === "BatchRegistered" && `Resin: ${ev.args[1]} | Qty: ${ev.args[2]} kg`}
                        {ev.eventName === "TransferInitiated" && `Sender: ${ev.args[1]?.substring(0, 6)}... | To: ${ev.args[2]?.substring(0, 6)}...`}
                        {ev.eventName === "BatchReceived" && `Recipient: ${ev.args[1]?.substring(0, 6)}... | Qty: ${ev.args[2]} kg`}
                        {ev.eventName === "ProcessingRecorded" && `Processed: ${ev.args[2]} kg | Recycled: ${ev.args[3]} kg | Residue: ${ev.args[4]} kg`}
                        {ev.eventName === "StakeholderRoleUpdated" && `Role: ${ev.args[2]} for ${ev.args[0]?.substring(0, 6)}...`}
                      </td>
                      <td>
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ padding: "0.2rem 0.5rem", fontSize: "0.75rem" }}
                          onClick={() => setSelectedEvent(ev)}
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inspect Event Modal */}
      {selectedEvent && (
        <div className="modal-overlay" onClick={() => setSelectedEvent(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: "1rem", fontWeight: 700 }}>
                Blockchain Event Detail: {selectedEvent.eventName}
              </h3>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setSelectedEvent(null)}
              >
                Close
              </button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: "1rem" }}>
                <div style={{ fontSize: "0.75rem", color: "var(--text-light)", textTransform: "uppercase" }}>Transaction Hash</div>
                <div className="mono" style={{ fontSize: "0.85rem", background: "var(--bg-subtle)", padding: "0.5rem", borderRadius: "4px", wordBreak: "break-all" }}>
                  {selectedEvent.transactionHash}
                </div>
              </div>

              <div className="grid-cols-2" style={{ marginBottom: "1rem" }}>
                <div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-light)", textTransform: "uppercase" }}>Block Height</div>
                  <div className="mono" style={{ fontSize: "0.9rem", fontWeight: 600 }}>
                    #{selectedEvent.blockNumber}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-light)", textTransform: "uppercase" }}>Network Chain ID</div>
                  <div className="mono" style={{ fontSize: "0.9rem", fontWeight: 600 }}>
                    31337 (Localhost Hardhat)
                  </div>
                </div>
              </div>

              <div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-light)", textTransform: "uppercase", marginBottom: "0.4rem" }}>
                  Decoded Event Parameters
                </div>
                <pre
                  style={{
                    background: "#0f172a",
                    color: "#f8fafc",
                    padding: "1rem",
                    borderRadius: "var(--radius-sm)",
                    fontSize: "0.75rem",
                    overflowX: "auto",
                  }}
                >
                  {JSON.stringify(
                    selectedEvent.args,
                    (key, value) => (typeof value === "bigint" ? value.toString() : value),
                    2
                  )}
                </pre>
              </div>
            </div>
            <div className="modal-footer">
              {selectedEvent.args?.batchId && (
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    onSelectBatch(selectedEvent.args.batchId);
                    onNavigate("tracking");
                    setSelectedEvent(null);
                  }}
                >
                  Track Batch {selectedEvent.args.batchId}
                </button>
              )}
              <button className="btn btn-secondary btn-sm" onClick={() => setSelectedEvent(null)}>
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
