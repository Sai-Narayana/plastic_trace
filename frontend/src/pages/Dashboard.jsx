import React from "react";
import {
  Package,
  Scale,
  Truck,
  Recycle,
  Sparkles,
  Trash2,
  TrendingUp,
  PlusCircle,
  ArrowRight,
  Search,
  CheckCircle2,
} from "lucide-react";

export default function Dashboard({
  metrics,
  batches,
  onNavigate,
  onSelectBatch,
  onSeedDemo,
  isSeeding,
}) {
  // Compute resin distribution
  const resinCounts = batches.reduce((acc, b) => {
    acc[b.plasticType] = (acc[b.plasticType] || 0) + b.initialQuantity;
    return acc;
  }, {});

  const totalResinQty = Object.values(resinCounts).reduce((a, b) => a + b, 0) || 1;

  // Compute status counts
  const statusCounts = batches.reduce((acc, b) => {
    acc[b.statusName] = (acc[b.statusName] || 0) + 1;
    return acc;
  }, {});

  // Recycling efficiency %
  const totalProcessedOrResidue = metrics.totalRecycledOutput + metrics.totalResidualWaste;
  const recoveryRate = totalProcessedOrResidue > 0
    ? ((metrics.totalRecycledOutput / totalProcessedOrResidue) * 100).toFixed(1)
    : "0.0";

  return (
    <div>
      {/* Banner if no batches yet */}
      {batches.length === 0 && (
        <div className="alert alert-info" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <strong>Welcome to PlasticTrace!</strong>
            <p style={{ marginTop: "0.2rem" }}>
              Your local blockchain is connected, but no batches have been registered yet. You can register your first batch or load the demonstration PET scenario (PL-1001) with one click.
            </p>
          </div>
          <button
            className="btn btn-primary btn-sm"
            onClick={onSeedDemo}
            disabled={isSeeding}
          >
            <Sparkles size={16} />
            {isSeeding ? "Seeding Blockchain..." : "Load Demo Scenario"}
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid-cols-4" style={{ marginBottom: "1.5rem" }}>
        <div className="stat-card">
          <div>
            <div className="stat-label">Total Batches</div>
            <div className="stat-value">{metrics.totalBatches}</div>
            <div className="stat-sub">Across 5 Stakeholders</div>
          </div>
          <div className="stat-icon" style={{ background: "#e0f2fe", color: "#0284c7" }}>
            <Package size={24} />
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-label">Collected Input</div>
            <div className="stat-value">{metrics.totalInputQuantity} <span style={{ fontSize: "1rem" }}>kg</span></div>
            <div className="stat-sub">Aggregated Plastic Waste</div>
          </div>
          <div className="stat-icon" style={{ background: "#ecfdf5", color: "var(--primary)" }}>
            <Scale size={24} />
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-label">In Transit</div>
            <div className="stat-value">{metrics.totalInTransit}</div>
            <div className="stat-sub">Pending Receipt</div>
          </div>
          <div className="stat-icon" style={{ background: "#fef3c7", color: "var(--amber)" }}>
            <Truck size={24} />
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-label">Recycled Output</div>
            <div className="stat-value">{metrics.totalRecycledOutput} <span style={{ fontSize: "1rem" }}>kg</span></div>
            <div className="stat-sub">Usable Secondary Flakes/Pellets</div>
          </div>
          <div className="stat-icon" style={{ background: "#f3e8ff", color: "#7e22ce" }}>
            <Recycle size={24} />
          </div>
        </div>
      </div>

      {/* Secondary Metrics Bar */}
      <div className="grid-cols-3" style={{ marginBottom: "1.5rem" }}>
        <div className="card" style={{ padding: "1.25rem", margin: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div className="stat-label">Residual Waste</div>
              <div style={{ fontSize: "1.4rem", fontWeight: 700, color: "var(--text-main)" }}>
                {metrics.totalResidualWaste} kg
              </div>
              <div className="stat-sub">Non-recyclable tailings recorded</div>
            </div>
            <Trash2 size={24} color="var(--text-light)" />
          </div>
        </div>

        <div className="card" style={{ padding: "1.25rem", margin: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div className="stat-label">Reprocessing Yield</div>
              <div style={{ fontSize: "1.4rem", fontWeight: 700, color: "var(--primary)" }}>
                {recoveryRate}%
              </div>
              <div className="stat-sub">Mass-balance conservation ratio</div>
            </div>
            <TrendingUp size={24} color="var(--primary)" />
          </div>
        </div>

        <div className="card" style={{ padding: "1.25rem", margin: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div className="stat-label">Completed Cycles</div>
              <div style={{ fontSize: "1.4rem", fontWeight: 700, color: "var(--teal)" }}>
                {statusCounts["Completed"] || 0}
              </div>
              <div className="stat-sub">Delivered to manufacturers</div>
            </div>
            <CheckCircle2 size={24} color="var(--teal)" />
          </div>
        </div>
      </div>

      {/* Analytics Breakdown & Quick Actions */}
      <div className="grid-cols-2" style={{ marginBottom: "1.5rem" }}>
        {/* Resin Distribution */}
        <div className="card" style={{ margin: 0 }}>
          <div className="card-header">
            <h3 className="card-title">Resin Type Breakdown</h3>
            <span style={{ fontSize: "0.8rem", color: "var(--text-light)" }}>Recorded mass in kg</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
            {["PET", "HDPE", "LDPE", "PP", "Other"].map((type) => {
              const qty = resinCounts[type] || 0;
              const pct = ((qty / totalResinQty) * 100).toFixed(1);
              return (
                <div key={type}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "0.25rem" }}>
                    <span style={{ fontWeight: 600 }}>{type}</span>
                    <span style={{ color: "var(--text-muted)" }}>{qty} kg ({pct}%)</span>
                  </div>
                  <div style={{ width: "100%", height: "8px", background: "var(--bg-subtle)", borderRadius: "4px", overflow: "hidden" }}>
                    <div
                      style={{
                        width: `${pct}%`,
                        height: "100%",
                        background: type === "PET" ? "var(--primary)" : type === "HDPE" ? "var(--teal)" : "#6366f1",
                        borderRadius: "4px",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Actions & Viva Navigator */}
        <div className="card" style={{ margin: 0, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div className="card-header">
              <h3 className="card-title">Traceability Actions</h3>
              <span style={{ fontSize: "0.8rem", color: "var(--text-light)" }}>Interactive Workflows</span>
            </div>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
              Execute authentic transactions across the recycling lifecycle:
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <button
                className="btn btn-secondary"
                style={{ justifyContent: "flex-start", padding: "0.75rem" }}
                onClick={() => onNavigate("register")}
              >
                <PlusCircle size={16} color="var(--primary)" />
                <span style={{ fontSize: "0.85rem" }}>Register Batch</span>
              </button>
              <button
                className="btn btn-secondary"
                style={{ justifyContent: "flex-start", padding: "0.75rem" }}
                onClick={() => onNavigate("transfer")}
              >
                <Truck size={16} color="var(--amber)" />
                <span style={{ fontSize: "0.85rem" }}>Transfer / Receive</span>
              </button>
              <button
                className="btn btn-secondary"
                style={{ justifyContent: "flex-start", padding: "0.75rem" }}
                onClick={() => onNavigate("process")}
              >
                <Recycle size={16} color="#7e22ce" />
                <span style={{ fontSize: "0.85rem" }}>Process Plastic</span>
              </button>
              <button
                className="btn btn-secondary"
                style={{ justifyContent: "flex-start", padding: "0.75rem" }}
                onClick={() => onNavigate("tracking")}
              >
                <Search size={16} color="var(--teal)" />
                <span style={{ fontSize: "0.85rem" }}>Track Batch</span>
              </button>
            </div>
          </div>

          <div style={{ marginTop: "1.25rem", padding: "0.85rem", background: "var(--bg-subtle)", borderRadius: "var(--radius-sm)" }}>
            <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-main)" }}>
              🎓 Technical Viva Tip:
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
              Every quantity and transfer you record here is mined into local Hardhat blocks. You can switch personas using the top-right button to demonstrate authorized vs unauthorized access.
            </div>
          </div>
        </div>
      </div>

      {/* Recent Batches Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Recent Waste Batches on Blockchain</h3>
          <span style={{ fontSize: "0.8rem", color: "var(--text-light)" }}>
            Showing {batches.length} registered batches
          </span>
        </div>

        {batches.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2.5rem 1rem", color: "var(--text-light)" }}>
            <Package size={40} style={{ opacity: 0.3, marginBottom: "0.5rem" }} />
            <div>No batches recorded on this blockchain yet.</div>
            <div style={{ fontSize: "0.8rem", marginTop: "0.25rem" }}>
              Click "Register Batch" or "Load Demo Scenario" above.
            </div>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Batch ID</th>
                  <th>Resin</th>
                  <th>Initial Qty</th>
                  <th>Current Qty</th>
                  <th>Status</th>
                  <th>Custodian</th>
                  <th>Location</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {batches.map((b) => (
                  <tr key={b.batchId}>
                    <td>
                      <strong className="mono" style={{ color: "var(--primary)" }}>
                        {b.batchId}
                      </strong>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, fontSize: "0.8rem" }}>{b.plasticType}</span>
                    </td>
                    <td>{b.initialQuantity} kg</td>
                    <td>
                      <strong>{b.currentQuantity} kg</strong>
                    </td>
                    <td>
                      <span className={`status-badge ${b.statusName.toLowerCase()}`}>
                        {b.statusName}
                      </span>
                    </td>
                    <td>
                      <span className="mono" style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        {b.currentCustodian.substring(0, 6)}...{b.currentCustodian.substring(38)}
                      </span>
                    </td>
                    <td style={{ fontSize: "0.8rem" }}>{b.collectionLocation}</td>
                    <td>
                      <button
                        className="btn btn-outline-primary btn-sm"
                        onClick={() => {
                          onSelectBatch(b.batchId);
                          onNavigate("tracking");
                        }}
                      >
                        Track <ArrowRight size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
