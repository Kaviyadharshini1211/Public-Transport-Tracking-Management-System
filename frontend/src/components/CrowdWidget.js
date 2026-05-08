import React, { useState, useEffect, useRef } from "react";
import API from "../api/api";

const LEVEL_CFG = [
  { label: "Empty",       color: "#6b7280", bg: "rgba(107,114,128,0.13)", icon: "😴", bar: "#6b7280" },
  { label: "Low",         color: "#10b981", bg: "rgba(16,185,129,0.13)",  icon: "😊", bar: "#10b981" },
  { label: "Moderate",    color: "#f59e0b", bg: "rgba(245,158,11,0.13)",  icon: "😐", bar: "#f59e0b" },
  { label: "High",        color: "#ef4444", bg: "rgba(239,68,68,0.13)",   icon: "😰", bar: "#ef4444" },
  { label: "Overcrowded", color: "#dc2626", bg: "rgba(220,38,38,0.18)",   icon: "🚨", bar: "#dc2626" },
];

/**
 * CrowdWidget
 * - role: "passenger" | "driver" | "admin"
 * - compact: show a minimal 2-column strip instead of full cards (for driver/passenger)
 * - deployedLog: array of {routeName, time} events shown to admin only
 */
export default function CrowdWidget({ role = "passenger", compact = false, deployedLog = [] }) {
  const [crowdData, setCrowdData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(!compact); // compact starts collapsed
  const pollRef = useRef(null);

  const fetch = async () => {
    try {
      const res = await API.get("/local-buses/crowd-status");
      setCrowdData(res.data || []);
    } catch {
      /* silent — AI may be offline */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch();
    pollRef.current = setInterval(fetch, 60000);
    return () => clearInterval(pollRef.current);
  }, []);

  const highCount = crowdData.filter(c => c.recommendation === "HIGH_CROWD").length;

  /* ── compact mode header (driver / passenger) ───────────── */
  const header = (
    <div
      onClick={() => compact && setOpen(o => !o)}
      style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: compact ? "12px 16px" : "16px 20px",
        cursor: compact ? "pointer" : "default",
        borderBottom: open ? "1px solid rgba(255,255,255,0.07)" : "none",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 20 }}>🤖</span>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: "#f1f5f9" }}>AI Crowd Prediction</div>
          <div style={{ fontSize: 11, color: "#64748b" }}>
            {loading ? "Loading…" : `${crowdData.length} route${crowdData.length !== 1 ? "s" : ""} monitored`}
          </div>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {highCount > 0 && (
          <span style={{
            background: "rgba(239,68,68,0.18)", color: "#ef4444",
            fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 20,
            border: "1px solid rgba(239,68,68,0.35)",
          }}>
            🚨 {highCount} HIGH
          </span>
        )}
        {compact && (
          <span style={{ color: "#64748b", fontSize: 12 }}>{open ? "▲" : "▼"}</span>
        )}
      </div>
    </div>
  );

  /* ── body ───────────────────────────────────────────────── */
  const body = open && (
    <div style={{ padding: compact ? "12px 16px" : "0 20px 20px" }}>
      {loading && crowdData.length === 0 ? (
        <div style={{ textAlign: "center", padding: "20px 0", color: "#64748b", fontSize: 13 }}>
          Loading crowd data…
        </div>
      ) : crowdData.length === 0 ? (
        <div style={{ textAlign: "center", padding: "16px 0", color: "#64748b", fontSize: 13 }}>
          No crowd data available. Is the AI service running?
        </div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: compact ? "1fr 1fr" : "repeat(auto-fill, minmax(260px, 1fr))",
          gap: compact ? 8 : 12,
        }}>
          {crowdData.map(item => {
            const lvl = Math.min(item.prediction?.crowd_level ?? 1, 4);
            const cfg = LEVEL_CFG[lvl];
            const capPct = Math.min(Math.round((item.prediction?.capacity_ratio ?? 0) * 100), 100);
            const passengers = item.prediction?.estimated_passengers ?? 0;
            const isHigh = item.recommendation === "HIGH_CROWD";

            return (
              <div key={item.route._id} style={{
                background: "rgba(255,255,255,0.04)",
                border: `1px solid ${isHigh ? cfg.color + "66" : "rgba(255,255,255,0.07)"}`,
                borderRadius: 10, padding: compact ? "10px 12px" : "14px",
                position: "relative", overflow: "hidden",
              }}>
                {/* accent top bar */}
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: cfg.color }} />

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: compact ? 11 : 12, fontWeight: 700, color: "#e2e8f0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {item.route.name}
                  </span>
                  <span style={{ fontSize: compact ? 14 : 16 }}>{cfg.icon}</span>
                </div>

                <div style={{ fontSize: compact ? 10 : 11, color: cfg.color, fontWeight: 700, marginBottom: 5 }}>
                  {cfg.label} — {passengers} pax ({capPct}%)
                </div>

                {/* capacity bar */}
                <div style={{ height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 3 }}>
                  <div style={{ height: "100%", width: `${capPct}%`, background: cfg.color, borderRadius: 3, transition: "width 0.5s" }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Admin deployed bus log */}
      {role === "admin" && deployedLog.length > 0 && (
        <div style={{ marginTop: 16, borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            📋 Recent Bus Deployments
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {deployedLog.slice(-5).reverse().map((d, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)",
                borderRadius: 8, padding: "7px 12px", fontSize: 12,
              }}>
                <span style={{ color: "#d1fae5" }}>🚌 Extra bus → <strong>{d.routeName}</strong></span>
                <span style={{ color: "#64748b" }}>{new Date(d.time).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div style={{
      background: "#1a1d2e",
      border: `1px solid ${highCount > 0 ? "rgba(239,68,68,0.35)" : "rgba(255,255,255,0.08)"}`,
      borderRadius: 14,
      overflow: "hidden",
      marginBottom: compact ? 16 : 24,
      boxShadow: highCount > 0 ? "0 0 0 1px rgba(239,68,68,0.15)" : "none",
    }}>
      {header}
      {body}
    </div>
  );
}
