import React from "react";
import { HARDHAT_ACCOUNTS } from "../services/blockchain";
import { X, Check, Shield, User, Wallet } from "lucide-react";

export default function RoleSwitcherModal({
  isOpen,
  onClose,
  currentAccountIndex,
  onSelectAccount,
  authMode,
  setAuthMode,
  metaMaskAddress,
  onConnectMetaMask,
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <User size={20} color="var(--primary)" />
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700 }}>Switch Active Stakeholder</h3>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-light)" }}
          >
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
            Select a verified stakeholder persona to sign smart-contract transactions. This simulates actual
            multi-party supply chain interactions on your local blockchain without requiring manual account switching in MetaMask.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {HARDHAT_ACCOUNTS.map((acc, idx) => {
              const isSelected = authMode === "simulated" && currentAccountIndex === idx;
              return (
                <div
                  key={acc.address}
                  onClick={() => {
                    setAuthMode("simulated");
                    onSelectAccount(idx);
                    onClose();
                  }}
                  style={{
                    padding: "0.85rem 1rem",
                    borderRadius: "var(--radius-sm)",
                    border: isSelected ? "2px solid var(--primary)" : "1px solid var(--border-color)",
                    background: isSelected ? "var(--primary-light)" : "var(--bg-card)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    transition: "var(--transition)",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span className={`role-badge ${acc.role.toLowerCase()}`}>
                        {acc.role}
                      </span>
                      <strong style={{ fontSize: "0.9rem" }}>{acc.name}</strong>
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-light)", marginTop: "0.25rem" }}>
                      {acc.description}
                    </div>
                    <div className="mono" style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
                      {acc.address}
                    </div>
                  </div>
                  {isSelected && <Check size={20} color="var(--primary)" />}
                </div>
              );
            })}
          </div>

          <div style={{ margin: "1.5rem 0 1rem", borderTop: "1px solid var(--border-color)", paddingTop: "1rem" }}>
            <h4 style={{ fontSize: "0.9rem", fontWeight: 600, marginBottom: "0.5rem" }}>
              MetaMask Extension Mode
            </h4>
            <p style={{ fontSize: "0.8rem", color: "var(--text-light)", marginBottom: "0.75rem" }}>
              Connect your installed MetaMask browser wallet to sign transactions directly:
            </p>
            <button
              className="btn btn-secondary"
              style={{ width: "100%", justifyContent: "center" }}
              onClick={() => {
                onConnectMetaMask();
                onClose();
              }}
            >
              <Wallet size={16} />
              {metaMaskAddress
                ? `Connected: ${metaMaskAddress.substring(0, 6)}...${metaMaskAddress.substring(38)}`
                : "Connect MetaMask Wallet"}
            </button>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
