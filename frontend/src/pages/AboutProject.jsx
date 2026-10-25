import React from "react";
import {
  BookOpen,
  CheckCircle2,
  Globe2,
  Shield,
  Layers,
  Recycle,
  Building2,
  HelpCircle,
  ExternalLink,
  Code2,
  AlertCircle,
} from "lucide-react";

export default function AboutProject() {
  return (
    <div style={{ maxWidth: "920px" }}>
      {/* Hero Header */}
      <div className="card" style={{ background: "linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)", border: "1px solid var(--primary-border)" }}>
        <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              background: "var(--primary-light)",
              color: "var(--primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minWidth: "48px",
            }}
          >
            <Recycle size={28} />
          </div>
          <div>
            <h2 style={{ fontSize: "1.4rem", fontWeight: 700, color: "#064e3b" }}>
              PlasticTrace: Blockchain-Based Plastic Waste Traceability System
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: "0.25rem" }}>
              Academic Full-Stack Blockchain Prototype for Multi-Stakeholder Waste Management & Environmental Auditing
            </p>
          </div>
        </div>
      </div>

      {/* 1. Problem Statement & Proposed Solution */}
      <div className="grid-cols-2" style={{ marginBottom: "1.5rem" }}>
        <div className="card" style={{ margin: 0 }}>
          <h3 className="card-title" style={{ color: "#991b1b" }}>
            <AlertCircle size={18} color="#dc2626" />
            The Problem Statement
          </h3>
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.5rem", lineHeight: 1.6 }}>
            In conventional plastic recycling workflows, records are siloed across independent organizations: waste collectors, municipal sorting yards, mechanical recyclers, and brand manufacturers. This causes:
          </p>
          <ul style={{ paddingLeft: "1.2rem", fontSize: "0.825rem", color: "var(--text-muted)", marginTop: "0.5rem", lineHeight: 1.6 }}>
            <li>Inability to verify recycled content claims ("greenwashing").</li>
            <li>Discrepancies in batch weights and loss tracking between facilities.</li>
            <li>Vulnerability to centralized ledger tampering and backdating.</li>
            <li>Lack of a single, immutable chronological history for environmental audits.</li>
          </ul>
        </div>

        <div className="card" style={{ margin: 0 }}>
          <h3 className="card-title" style={{ color: "#065f46" }}>
            <CheckCircle2 size={18} color="var(--primary)" />
            The Proposed Solution
          </h3>
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.5rem", lineHeight: 1.6 }}>
            PlasticTrace implements a decentralized state machine on the Ethereum Virtual Machine (EVM) that:
          </p>
          <ul style={{ paddingLeft: "1.2rem", fontSize: "0.825rem", color: "var(--text-muted)", marginTop: "0.5rem", lineHeight: 1.6 }}>
            <li>Assigns a unique cryptographic Batch ID to every collected plastic lot.</li>
            <li>Enforces a two-phase transfer handshake (Dispatch ➔ Receipt Confirmation).</li>
            <li>Validates mass-balance conservation rules to prevent fake output claims.</li>
            <li>Maintains an unalterable chronological audit trail accessible to all parties.</li>
          </ul>
        </div>
      </div>

      {/* 2. UN Sustainable Development Goals (SDGs) */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            <Globe2 size={20} color="var(--primary)" />
            UN Sustainable Development Goal (SDG) Alignment
          </h3>
          <span style={{ fontSize: "0.8rem", color: "var(--text-light)" }}>United Nations Agenda 2030</span>
        </div>

        <div className="grid-cols-2" style={{ gap: "1rem" }}>
          <div style={{ background: "#fef3c7", border: "1px solid #fde68a", padding: "1rem", borderRadius: "var(--radius-sm)" }}>
            <strong style={{ color: "#92400e", fontSize: "0.95rem" }}>SDG 12: Responsible Consumption & Production</strong>
            <p style={{ fontSize: "0.8rem", color: "#78350f", marginTop: "0.35rem", lineHeight: 1.5 }}>
              <strong>Target 12.5:</strong> Substantially reduce waste generation through prevention, reduction, recycling, and reuse by verifying secondary material supplies for manufacturers.
            </p>
          </div>

          <div style={{ background: "#e0f2fe", border: "1px solid #bae6fd", padding: "1rem", borderRadius: "var(--radius-sm)" }}>
            <strong style={{ color: "#0369a1", fontSize: "0.95rem" }}>SDG 11: Sustainable Cities & Communities</strong>
            <p style={{ fontSize: "0.8rem", color: "#075985", marginTop: "0.35rem", lineHeight: 1.5 }}>
              <strong>Target 11.6:</strong> Reduce the adverse per capita environmental impact of cities, including municipal solid waste management through transparent collection tracking.
            </p>
          </div>
        </div>

        <div style={{ marginTop: "1rem", fontSize: "0.75rem", color: "var(--text-light)", fontStyle: "italic" }}>
          * Note for Viva: Potential indirect contributions to SDG 13 (Climate Action) and SDG 14 (Life Below Water) stem from reduced landfilling and ocean plastic leakage, but are indirect real-world outcomes rather than claims verified solely by software.
        </div>
      </div>

      {/* 3. Real-World Precedents & Industrial Context */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            <Building2 size={20} color="var(--teal)" />
            Real-World Industrial Precedents
          </h3>
          <span style={{ fontSize: "0.8rem", color: "var(--text-light)" }}>Case Studies & Industry Trials</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ padding: "0.85rem", background: "var(--bg-subtle)", borderRadius: "var(--radius-sm)" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <strong style={{ fontSize: "0.9rem" }}>1. IBM & Plastic Bank Initiative</strong>
              <a
                href="https://www.ibm.com/case-studies/plastic-bank-systems-linuxone"
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: "0.75rem", color: "var(--primary)", display: "flex", alignItems: "center", gap: "0.2rem", textDecoration: "none" }}
              >
                IBM Case Study <ExternalLink size={12} />
              </a>
            </div>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.3rem" }}>
              Plastic Bank uses private blockchain infrastructure (powered by IBM LinuxONE) to monetize ocean-bound plastic collection in developing nations. Collectors deposit waste at local branches in exchange for cryptographic tokens redeemable for basic necessities, preventing waste from entering waterways.
            </p>
          </div>

          <div style={{ padding: "0.85rem", background: "var(--bg-subtle)", borderRadius: "var(--radius-sm)" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <strong style={{ fontSize: "0.9rem" }}>2. Asahi Kasei & BLUE Plastics Consortium</strong>
              <a
                href="https://www.asahi-kasei.com/news/2022/e220706"
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: "0.75rem", color: "var(--primary)", display: "flex", alignItems: "center", gap: "0.2rem", textDecoration: "none" }}
              >
                Asahi Kasei Release <ExternalLink size={12} />
              </a>
            </div>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.3rem" }}>
              A major industrial trial in Japan tracking recycled resin across chemical and mechanical recycling plants using blockchain-based digital product passports, verifying certified recycled ratios in high-value automotive and electronic parts.
            </p>
          </div>
        </div>
      </div>

      {/* 4. Technical Architecture & Viva Defense Tips */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            <Code2 size={20} color="var(--primary)" />
            Technical Architecture & Viva Defense Reference
          </h3>
          <span style={{ fontSize: "0.8rem", color: "var(--text-light)" }}>Exam & Evaluation Guide</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "0.85rem" }}>
          <div>
            <strong>Why use Blockchain instead of a standard SQL database?</strong>
            <p style={{ color: "var(--text-muted)", marginTop: "0.2rem" }}>
              In a consortium of competing collectors, recyclers, and brand owners, no single company wants to trust another party's central database server. A central admin could retroactively modify batch weights or delete records during regulatory audits. Blockchain provides cryptographic non-repudiation and immutable transaction ordering.
            </p>
          </div>

          <div style={{ borderTop: "1px dashed var(--border-color)", paddingTop: "0.5rem" }}>
            <strong>What are the limitations of this prototype?</strong>
            <p style={{ color: "var(--text-muted)", marginTop: "0.2rem" }}>
              Blockchain solves ledger integrity, not physical reality (the "Oracle problem"). If a collector records 100 kg of PET but actually dumps 20 kg into landfill, the blockchain records the fraudulent claim. In future production systems, this gap is bridged using IoT weighbridges, QR/RFID barcodes, and chemical tracer analysis.
            </p>
          </div>

          <div style={{ borderTop: "1px dashed var(--border-color)", paddingTop: "0.5rem" }}>
            <strong>Technology Stack Summary:</strong>
            <p style={{ color: "var(--text-muted)", marginTop: "0.2rem" }}>
              Solidity 0.8.24 (Smart Contract), Hardhat (Local EVM Blockchain, Testing Suite), Ethers.js v6 (JSON-RPC & Wallet Connectivity), React 18 & Vite (Presentation Layer), Plain CSS (Clean sustainability UI).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
