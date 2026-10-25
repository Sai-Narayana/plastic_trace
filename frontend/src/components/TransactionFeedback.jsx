import React from "react";
import { CheckCircle2, AlertTriangle, ExternalLink, Hash, Layers, HelpCircle, ArrowRight } from "lucide-react";

export default function TransactionFeedback({ receipt, error, onClear, onViewExplorer }) {
  if (!receipt && !error) return null;

  if (error) {
    const isWrongRecipient = typeof error === "string" && error.includes("Caller is not the designated recipient");
    const isDuplicate = typeof error === "string" && error.includes("Batch ID already exists");
    const isUnauthorizedCollector = typeof error === "string" && error.includes("Caller is not an authorized Collector");
    const isMassBalance = typeof error === "string" && error.includes("Mass balance mismatch");

    return (
      <div className="alert alert-danger" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", width: "100%" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
            <AlertTriangle size={20} style={{ minWidth: 20, marginTop: 2, color: "var(--red)" }} />
            <div>
              <strong style={{ fontSize: "0.95rem" }}>Smart Contract Reverted / Failed:</strong>
              <div style={{ marginTop: "0.25rem", wordBreak: "break-all", fontFamily: "ui-monospace, monospace", fontSize: "0.85rem" }}>
                {error}
              </div>
            </div>
          </div>
          {onClear && (
            <button className="btn btn-secondary btn-sm" onClick={onClear} style={{ alignSelf: "flex-start" }}>
              Dismiss
            </button>
          )}
        </div>

        {/* Viva & Troubleshooting Hints */}
        {isWrongRecipient && (
          <div
            style={{
              background: "#ffffff",
              border: "1px solid var(--red-border)",
              borderRadius: "var(--radius-sm)",
              padding: "0.75rem 1rem",
              marginTop: "0.35rem",
              fontSize: "0.825rem",
              color: "#7f1d1d",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontWeight: 700, marginBottom: "0.25rem" }}>
              <HelpCircle size={15} />
              <span>Why did this transaction revert? (Access Control Enforcement)</span>
            </div>
            <div>
              In <code>PlasticWasteTraceability.sol</code>, line <code>require(msg.sender == batch.pendingRecipient)</code> strictly prevents unauthorized actors or the original sender from confirming delivery.
            </div>
            <div style={{ marginTop: "0.4rem", fontWeight: 600 }}>
              👉 Solution: Click the persona pill in the top-right header and switch your active stakeholder to the intended recipient (e.g. <em>City EcoSorting Hub</em> or <em>PureCycle Polymers</em>).
            </div>
          </div>
        )}

        {isDuplicate && (
          <div style={{ background: "#ffffff", border: "1px solid var(--red-border)", borderRadius: "var(--radius-sm)", padding: "0.6rem 0.85rem", fontSize: "0.8rem", color: "#7f1d1d" }}>
            💡 <strong>Batch ID Collision:</strong> Every plastic lot must have a unique identifier. Generate or enter a new Batch ID (e.g. <code>PL-1004</code>).
          </div>
        )}

        {isUnauthorizedCollector && (
          <div style={{ background: "#ffffff", border: "1px solid var(--red-border)", borderRadius: "var(--radius-sm)", padding: "0.6rem 0.85rem", fontSize: "0.8rem", color: "#7f1d1d" }}>
            💡 <strong>Role Restriction:</strong> Only authorized <strong>Collectors</strong> or Admin can register batches. Switch your active persona to <strong>GreenCollect Waste Services (Collector)</strong>.
          </div>
        )}

        {isMassBalance && (
          <div style={{ background: "#ffffff", border: "1px solid var(--red-border)", borderRadius: "var(--radius-sm)", padding: "0.6rem 0.85rem", fontSize: "0.8rem", color: "#7f1d1d" }}>
            💡 <strong>Mass Conservation Law:</strong> The contract enforces <code>Quantity Processed == Recycled Output + Residual Waste</code>. Verify that your numbers balance out.
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="alert alert-success" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
        <CheckCircle2 size={22} style={{ minWidth: 22, marginTop: 2, color: "var(--primary)" }} />
        <div>
          <strong style={{ fontSize: "0.95rem" }}>Transaction Confirmed on Blockchain!</strong>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", marginTop: "0.4rem", fontSize: "0.8rem" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
              <Hash size={14} /> Tx: <span className="mono">{receipt.hash.substring(0, 16)}...{receipt.hash.substring(58)}</span>
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
              <Layers size={14} /> Block: <span className="mono">#{receipt.blockNumber}</span>
            </span>
            <span>
              Gas Used: <span className="mono">{receipt.gasUsed ? receipt.gasUsed.toString() : "N/A"}</span>
            </span>
          </div>
        </div>
      </div>
      <div style={{ display: "flex", gap: "0.5rem" }}>
        {onViewExplorer && (
          <button className="btn btn-primary btn-sm" onClick={onViewExplorer}>
            Inspect in Explorer
          </button>
        )}
        {onClear && (
          <button className="btn btn-secondary btn-sm" onClick={onClear}>
            Dismiss
          </button>
        )}
      </div>
    </div>
  );
}
