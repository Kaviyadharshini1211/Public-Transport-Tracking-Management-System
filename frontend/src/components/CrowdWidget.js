import React, { useState, useEffect, useRef } from "react";
import API from "../api/api";

const LEVEL_CFG = [
  { label: "Empty",       color: "#6b7280", icon: "😴" },
  { label: "Low",         color: "#10b981", icon: "😊" },
  { label: "Moderate",    color: "#f59e0b", icon: "😐" },
  { label: "High",        color: "#ef4444", icon: "😰" },
  { label: "Overcrowded", color: "#dc2626", icon: "🚨" },
];

/**
 * CrowdWidget
 * Props:
 *   role        — "passenger" | "driver" | "admin"
 *   compact     — collapsed header with toggle (for driver/passenger)
 *   routeId     — if set, only show crowd data for this one route (driver view)
 *   deployedLog — [{routeName, time}] shown to admin only
 */
export default function CrowdWidget({
  role = "passenger",
  compact = false,
  routeId = null,
  deployedLog = [],
}) {
  const [crowdData, setCrowdData]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [open, setOpen]             = useState(!compact);
  const pollRef                     = useRef(null);

  const loadData = async () => {
    try {
      // Admin uses the protected full endpoint; others use public summary
      const endpoint = role === "admin"
        ? "/local-buses/crowd-status"
        : "/local-buses/crowd-summary";
      const res = await API.get(endpoint);
      setCrowdData(res.data || []);
    } catch {
      /* silent — AI may be offline or network unavailable */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    pollRef.current = setInterval(loadData, 60000);
    return () => clearInterval(pollRef.current);
  }, [role]); // role is stable; loadData is defined inside component

  // Filter to driver's own route if routeId is provided
  const displayData = routeId
    ? crowdData.filter(
        c => c.route?._id === routeId || c.route?._id?.toString() === routeId?.toString()
      )
    : crowdData;

  const highCount  = displayData.filter(c => c.recommendation === "HIGH_CROWD").length;
  const myRoute    = displayData[0]; // for single-route driver view
  const isSingle   = routeId && displayData.length === 1;

  // ── DRIVER SINGLE-ROUTE CARD ─────────────────────────────
  // When a routeId is supplied and we have data, show a rich focused card
  if (isSingle && myRoute && open) {
    const lvl    = Math.min(myRoute.prediction?.crowd_level ?? 1, 4);
    const cfg    = LEVEL_CFG[lvl];
    const capPct = Math.min(Math.round((myRoute.prediction?.capacity_ratio ?? 0) * 100), 100);
    const pax    = myRoute.prediction?.estimated_passengers ?? 0;
    const isHigh = myRoute.recommendation === "HIGH_CROWD";

    return (
      <div style={{
        background: "#1a1d2e",
        border: `1px solid ${isHigh ? cfg.color + "55" : "rgba(255,255,255,0.08)"}`,
        borderRadius: 14, overflow: "hidden", marginBottom: 16,
        boxShadow: isHigh ? `0 0 0 1px ${cfg.color}22, 0 4px 20px ${cfg.color}18` : "none",
      }}>
        {/* Header */}
        <div
          onClick={() => compact && setOpen(false)}
          style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "14px 18px",
            cursor: compact ? "pointer" : "default",
            borderBottom: "1px solid rgba(255,255,255,0.07)",
            background: isHigh ? `linear-gradient(135deg, rgba(239,68,68,0.08), transparent)` : "transparent",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: `${cfg.color}22`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18, border: `1px solid ${cfg.color}44`,
            }}>
              {cfg.icon}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#f1f5f9" }}>
                🤖 AI Crowd — Your Route
              </div>
              <div style={{ fontSize: 11, color: "#64748b" }}>
                {myRoute.route?.name || "This Route"} · updates every min
              </div>
            </div>
          </div>
          <div style={{
            background: `${cfg.color}22`, color: cfg.color,
            fontSize: 12, fontWeight: 800, padding: "5px 12px",
            borderRadius: 20, border: `1px solid ${cfg.color}44`,
            textTransform: "uppercase", letterSpacing: "0.05em",
          }}>
            {cfg.label}
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: "16px 18px" }}>
          {/* Stats row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 14 }}>
            {[
              { label: "Passengers", value: pax, icon: "👥" },
              { label: "Capacity", value: `${capPct}%`, icon: "📊" },
              { label: "Active Buses", value: myRoute.activeBuses ?? "–", icon: "🚌" },
            ].map(stat => (
              <div key={stat.label} style={{
                background: "rgba(255,255,255,0.04)",
                borderRadius: 10, padding: "10px 12px",
                textAlign: "center", border: "1px solid rgba(255,255,255,0.06)",
              }}>
                <div style={{ fontSize: 18, marginBottom: 4 }}>{stat.icon}</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#f1f5f9" }}>{stat.value}</div>
                <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Capacity bar */}
          <div style={{ marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#64748b", marginBottom: 5 }}>
              <span>Capacity Load</span>
              <span style={{ color: cfg.color, fontWeight: 700 }}>{capPct}%</span>
            </div>
            <div style={{ height: 8, background: "rgba(255,255,255,0.06)", borderRadius: 4, overflow: "hidden" }}>
              <div style={{
                height: "100%", width: `${capPct}%`,
                background: `linear-gradient(90deg, ${cfg.color}, ${cfg.color}bb)`,
                borderRadius: 4, transition: "width 0.6s ease",
              }} />
            </div>
          </div>

          {/* High crowd warning */}
          {isHigh && (
            <div style={{
              marginTop: 12, padding: "10px 14px",
              background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)",
              borderRadius: 10, fontSize: 12, color: "#fca5a5", lineHeight: 1.5,
            }}>
              🚨 <strong>High crowd detected!</strong> Expect more passengers at upcoming stops.
              Maintain schedule and report to dispatch if support bus is needed.
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── COLLAPSED STATE (when compact + closed) ──────────────
  if (compact && !open) {
    return (
      <div
        onClick={() => setOpen(true)}
        style={{
          background: "#1a1d2e",
          border: `1px solid ${highCount > 0 ? "rgba(239,68,68,0.4)" : "rgba(255,255,255,0.08)"}`,
          borderRadius: 14, padding: "12px 16px", marginBottom: 16, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 18 }}>🤖</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#f1f5f9" }}>AI Crowd Prediction</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {highCount > 0 && (
            <span style={{
              background: "rgba(239,68,68,0.18)", color: "#ef4444",
              fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 20,
              border: "1px solid rgba(239,68,68,0.35)",
            }}>🚨 {highCount} HIGH</span>
          )}
          <span style={{ color: "#64748b", fontSize: 12 }}>▼</span>
        </div>
      </div>
    );
  }

  // ── MULTI-ROUTE VIEW (passenger / admin fallback) ────────
  return (
    <div style={{
      background: "#1a1d2e",
      border: `1px solid ${highCount > 0 ? "rgba(239,68,68,0.35)" : "rgba(255,255,255,0.08)"}`,
      borderRadius: 14, overflow: "hidden",
      marginBottom: compact ? 16 : 24,
      boxShadow: highCount > 0 ? "0 0 0 1px rgba(239,68,68,0.15)" : "none",
    }}>
      {/* Header */}
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
              {loading ? "Loading…" : `${displayData.length} route${displayData.length !== 1 ? "s" : ""} monitored`}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {highCount > 0 && (
            <span style={{
              background: "rgba(239,68,68,0.18)", color: "#ef4444",
              fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 20,
              border: "1px solid rgba(239,68,68,0.35)",
            }}>🚨 {highCount} HIGH</span>
          )}
          {compact && <span style={{ color: "#64748b", fontSize: 12 }}>▲</span>}
        </div>
      </div>

      {/* Body */}
      {open && (
        <div style={{ padding: compact ? "12px 16px" : "0 20px 20px" }}>
          {loading && displayData.length === 0 ? (
            <div style={{ textAlign: "center", padding: "20px 0", color: "#64748b", fontSize: 13 }}>Loading crowd data…</div>
          ) : displayData.length === 0 ? (
            <div style={{ textAlign: "center", padding: "16px 0", color: "#64748b", fontSize: 13 }}>
              No crowd data available. AI service may be offline.
            </div>
          ) : (
            <div style={{
              display: "grid",
              gridTemplateColumns: compact ? "1fr 1fr" : "repeat(auto-fill, minmax(260px, 1fr))",
              gap: compact ? 8 : 12,
            }}>
              {displayData.map(item => {
                const lvl    = Math.min(item.prediction?.crowd_level ?? 1, 4);
                const cfg    = LEVEL_CFG[lvl];
                const capPct = Math.min(Math.round((item.prediction?.capacity_ratio ?? 0) * 100), 100);
                const pax    = item.prediction?.estimated_passengers ?? 0;
                const isHigh = item.recommendation === "HIGH_CROWD";
                return (
                  <div key={item.route._id} style={{
                    background: "rgba(255,255,255,0.04)",
                    border: `1px solid ${isHigh ? cfg.color + "66" : "rgba(255,255,255,0.07)"}`,
                    borderRadius: 10, padding: compact ? "10px 12px" : "14px",
                    position: "relative", overflow: "hidden",
                  }}>
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: cfg.color }} />
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: compact ? 11 : 12, fontWeight: 700, color: "#e2e8f0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {item.route.name}
                      </span>
                      <span style={{ fontSize: compact ? 14 : 16 }}>{cfg.icon}</span>
                    </div>
                    <div style={{ fontSize: compact ? 10 : 11, color: cfg.color, fontWeight: 700, marginBottom: 5 }}>
                      {cfg.label} — {pax} pax ({capPct}%)
                    </div>
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
      )}
    </div>
  );
}
