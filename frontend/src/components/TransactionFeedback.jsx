import React from "react";
import { CheckCircle2, AlertTriangle, ExternalLink, Hash, Layers } from "lucide-react";

export default function TransactionFeedback({ receipt, error, onClear, onViewExplorer }) {
  if (!receipt && !error) return null;

  if (error) {
    return (
      <div className="alert alert-danger" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
          <AlertTriangle size={20} style={{ minWidth: 20, marginTop: 2 }} />
          <div>
            <strong>Transaction Reverted / Failed:</strong>
            <div style={{ marginTop: "0.25rem", wordBreak: "break-all" }}>{error}</div>
          </div>
        </div>
        {onClear && (
          <button className="btn btn-secondary btn-sm" onClick={onClear}>
            Dismiss
          </button>
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
