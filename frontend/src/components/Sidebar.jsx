import React from "react";
import {
  LayoutDashboard,
  PlusCircle,
  Search,
  ArrowLeftRight,
  Recycle,
  Blocks,
  ShieldCheck,
  Info,
  Leaf,
} from "lucide-react";

export default function Sidebar({ activeTab, setActiveTab, networkStatus }) {
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "register", label: "Register Batch", icon: PlusCircle },
    { id: "tracking", label: "Batch Tracking", icon: Search },
    { id: "transfer", label: "Transfer & Receive", icon: ArrowLeftRight },
    { id: "process", label: "Process Plastic", icon: Recycle },
    { id: "explorer", label: "Blockchain Explorer", icon: Blocks },
    { id: "verify", label: "Public Verification", icon: ShieldCheck },
    { id: "about", label: "About the Project", icon: Info },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-icon">
          <Leaf size={22} />
        </div>
        <div>
          <div className="brand-title">PlasticTrace</div>
          <div className="brand-subtitle">Waste Traceability</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              className={`nav-item ${isActive ? "active" : ""}`}
              onClick={() => setActiveTab(item.id)}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="network-status-badge">
          <span
            className={`status-dot ${networkStatus?.connected ? "" : "offline"}`}
          />
          <div>
            <div>{networkStatus?.connected ? "Hardhat Node Online" : "Node Offline"}</div>
            <div style={{ fontSize: "0.7rem", color: "var(--text-light)" }}>
              {networkStatus?.connected ? `Block #${networkStatus.blockNumber}` : "Check port 8545"}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
