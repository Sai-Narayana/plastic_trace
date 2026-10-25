import React from "react";
import { UserCheck, Wallet, RefreshCw, KeyRound } from "lucide-react";
import contractData from "../contracts/contractData.json";

export default function Header({
  activeTab,
  currentAccount,
  authMode,
  metaMaskAddress,
  onOpenRoleModal,
  onRefreshData,
  isRefreshing,
}) {
  const titles = {
    dashboard: { title: "Traceability Dashboard", subtitle: "Real-time on-chain plastic recovery & recycling metrics" },
    register: { title: "Register Plastic Waste Batch", subtitle: "Record newly aggregated plastic waste at collection centers" },
    tracking: { title: "Batch Tracking & Audit Trail", subtitle: "Inspect complete lifecycle timeline, actors, and transaction proofs" },
    transfer: { title: "Custody Transfer & Receipt", subtitle: "Multi-party transfer handshake between supply chain participants" },
    process: { title: "Recycling & Mass-Balance Verification", subtitle: "Record mechanical reprocessing with strict mass conservation" },
    explorer: { title: "Blockchain Explorer", subtitle: "Inspect blocks, transactions, and event logs on local EVM" },
    verify: { title: "Public Batch Verification", subtitle: "Verify plastic origin, chain of custody, and environmental claims" },
    about: { title: "About PlasticTrace", subtitle: "Architecture, UN SDG alignment, and academic viva guide" },
  };

  const currentInfo = titles[activeTab] || titles.dashboard;

  return (
    <header className="top-header">
      <div className="header-title-block">
        <h1>{currentInfo.title}</h1>
        <p>{currentInfo.subtitle}</p>
      </div>

      <div className="header-actions">
        <button
          className="btn btn-secondary btn-sm"
          onClick={onRefreshData}
          disabled={isRefreshing}
          title="Refresh blockchain data"
        >
          <RefreshCw size={14} className={isRefreshing ? "spin" : ""} />
          <span>Refresh</span>
        </button>

        {/* Stakeholder Pill */}
        <div
          onClick={onOpenRoleModal}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.4rem 0.8rem",
            background: "var(--bg-subtle)",
            border: "1px solid var(--border-color)",
            borderRadius: "var(--radius-sm)",
            cursor: "pointer",
          }}
          title="Click to switch active stakeholder persona"
        >
          <span className={`role-badge ${currentAccount.role.toLowerCase()}`}>
            {currentAccount.role}
          </span>
          <div style={{ textAlign: "left" }}>
            <div style={{ fontSize: "0.8rem", fontWeight: 600 }}>{currentAccount.name}</div>
            <div className="mono" style={{ fontSize: "0.65rem", color: "var(--text-light)" }}>
              {authMode === "metamask" && metaMaskAddress
                ? `${metaMaskAddress.substring(0, 6)}...${metaMaskAddress.substring(38)} (MetaMask)`
                : `${currentAccount.address.substring(0, 6)}...${currentAccount.address.substring(38)}`}
            </div>
          </div>
          <KeyRound size={14} color="var(--text-light)" />
        </div>
      </div>
    </header>
  );
}
