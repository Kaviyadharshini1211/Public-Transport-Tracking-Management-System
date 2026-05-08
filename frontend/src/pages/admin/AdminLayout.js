import React, { useState, useEffect, useMemo, useRef } from "react";
import { io } from "socket.io-client";
import { toast } from "react-hot-toast";

import API from "../../api/api";
import CrowdWidget from "../../components/CrowdWidget";
import "../../styles/AdminLayout.css";
import AdminVehicles from "./AdminVehicles";
import AdminDrivers from "./AdminDrivers";
import AdminRoutes from "./AdminRoutes";
import AdminAssignDriver from "./AdminAssignDriver";
import AdminSOSHistory from "./AdminSOSHistory";

const SOSAlertMessage = ({ driverName, message, lat, lng }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
    <h3 style={{ margin: 0, color: '#ef4444', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '6px' }}>
      🚨 SOS Alert
    </h3>
    <div style={{ fontWeight: 'bold', color: '#fff', fontSize: '15px' }}>{driverName}</div>
    <div style={{ fontSize: '13px', color: '#e2e8f0', marginBottom: '4px' }}>{message}</div>
    {lat !== 0 && (
      <a 
        href={`https://www.google.com/maps?q=${lat},${lng}`} 
        target="_blank" rel="noopener noreferrer"
        style={{ padding: '8px', background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', color: '#fca5a5', textAlign: 'center', borderRadius: '6px', textDecoration: 'none', fontSize: '13px', fontWeight: 'bold', transition: 'all 0.2s' }}
      >
        📍 View Location
      </a>
    )}
  </div>
);

const CROWD_LEVEL_CONFIG = [
  { label: "Empty",       color: "#6b7280", bg: "rgba(107,114,128,0.12)",  icon: "😴" },
  { label: "Low",         color: "#10b981", bg: "rgba(16,185,129,0.12)",   icon: "😊" },
  { label: "Moderate",    color: "#f59e0b", bg: "rgba(245,158,11,0.12)",   icon: "😐" },
  { label: "Crowded",     color: "#ef4444", bg: "rgba(239,68,68,0.12)",    icon: "😰" },
  { label: "Overcrowded", color: "#dc2626", bg: "rgba(220,38,38,0.18)",    icon: "🚨" },
];

const TAB_CONFIG = [
  { key: "vehicles",  label: "Vehicles",         icon: "🚐" },
  { key: "drivers",   label: "Drivers",           icon: "👤" },
  { key: "routes",    label: "Routes",            icon: "🗺️" },
  { key: "assign",    label: "Assign Driver",     icon: "🔗" },
  { key: "sos",       label: "Emergencies",       icon: "🚨" },
  { key: "crowd",     label: "AI Crowd Intel",    icon: "🤖" },
];

export default function AdminDashboard() {
  const [tab, setTab] = useState(0);
  const [search, setSearch] = useState("");
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loadedTabs, setLoadedTabs] = useState({});
  const [vehiclesLoading, setVehiclesLoading] = useState(false);
  const [driversLoading, setDriversLoading] = useState(false);
  const [routesLoading, setRoutesLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);
  const [sosCount, setSosCount] = useState(0);
  const [latestSosEvent, setLatestSosEvent] = useState(null);

  // ── Crowd Intelligence state ──────────────────────────────────────────────
  const [crowdData, setCrowdData] = useState([]);
  const [crowdLoading, setCrowdLoading] = useState(false);
  const [spareBuses, setSpareBuses] = useState([]);
  const [deployModal, setDeployModal] = useState(null); // { routeId, routeName }
  const [selectedSpare, setSelectedSpare] = useState("");
  const [deploying, setDeploying] = useState(false);
  const crowdPollRef = useRef(null);
  const [deployedLog, setDeployedLog] = useState([]); // { routeName, time }

  
  // Modal states
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  
  // Dropdown state
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Get admin info from localStorage
  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || {};
    } catch {
      return {};
    }
  }, []);

  // Fetch all data on mount
  useEffect(() => {
    // Load data for the default tab (Vehicles) on mount
    fetchVehicles();
    fetchDrivers(); // Drivers are small ref data needed by other tabs too

    // Connect to global Socket.IO backend (Strip /api off URL)
    const baseServerUrl = (process.env.REACT_APP_API_URL || "").replace("/api", "");
    const socket = io(baseServerUrl);

    socket.on("sos_alert", (payload) => {
      console.warn("🚨 EMERGENCY SOS RECEIVED:", payload);
      setSosCount(prev => prev + 1);
      setLatestSosEvent(Date.now());

      // Play soft beep sound
      try {
        const audio = new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg");
        audio.volume = 0.5;
        audio.play().catch(() => {});
      } catch (e) {}

      // Fire slick custom toast
      toast.error(
        (t) => (
          <SOSAlertMessage 
            driverName={payload.driverName} 
            message={payload.message}
            lat={payload.coordinates?.lat} 
            lng={payload.coordinates?.lng} 
          />
        ), 
        {
          duration: Infinity,
          position: "top-right",
          style: { 
            background: "#1e1e2f", 
            color: "#fff",
            borderLeft: "5px solid #ef4444",
            padding: "16px",
            minWidth: "350px"
          }
        }
      );
    });

    socket.on("sos_resolved", (payload) => {
      // Just update the timestamp to re-render the child History table
      setLatestSosEvent(Date.now());
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const fetchVehicles = async () => {
    if (vehiclesLoading) return;
    setVehiclesLoading(true);
    try {
      const res = await API.get("/vehicles");
      setVehicles(res.data || []);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      showToast("Failed to load vehicles", "error");
    } finally {
      setVehiclesLoading(false);
    }
  };

  const fetchDrivers = async () => {
    if (driversLoading) return;
    setDriversLoading(true);
    try {
      const res = await API.get("/auth/list-users?role=driver");
      setDrivers(res.data || []);
    } catch (error) {
      console.error("Error fetching drivers:", error);
      showToast("Failed to load drivers", "error");
    } finally {
      setDriversLoading(false);
    }
  };

  const fetchRoutes = async () => {
    if (routesLoading) return;
    setRoutesLoading(true);
    try {
      const res = await API.get("/routes");
      setRoutes(res.data || []);
    } catch (error) {
      console.error("Error fetching routes:", error);
      showToast("Failed to load routes", "error");
    } finally {
      setRoutesLoading(false);
    }
  };

  const fetchCrowdStatus = async () => {
    setCrowdLoading(true);
    try {
      const [crowdRes, spareRes] = await Promise.all([
        API.get("/local-buses/crowd-status"),
        API.get("/local-buses/spare-buses"),
      ]);
      setCrowdData(crowdRes.data || []);
      setSpareBuses(spareRes.data || []);
    } catch (err) {
      console.error("Crowd fetch error:", err);
    } finally {
      setCrowdLoading(false);
    }
  };

  const handleDeploySpareBus = async () => {
    if (!selectedSpare || !deployModal) return;
    setDeploying(true);
    try {
      await API.post(`/local-buses/deploy-spare/${deployModal.routeId}`, {
        vehicleId: selectedSpare,
        reason: `Admin deployed extra bus to ${deployModal.routeName} due to high crowd prediction.`,
      });
      showToast(`Extra bus deployed to ${deployModal.routeName}!`, "success");
      setDeployedLog(prev => [...prev, { routeName: deployModal.routeName, time: new Date().toISOString() }]);
      setDeployModal(null);
      setSelectedSpare("");
      fetchCrowdStatus(); // refresh
    } catch (err) {
      showToast("Failed to deploy bus", "error");
    } finally {
      setDeploying(false);
    }
  };

  // Lazy load per tab when tab changes
  useEffect(() => {
    if (tab === 0 && !loadedTabs[0]) {
      fetchVehicles();
      setLoadedTabs(p => ({ ...p, 0: true }));
    }
    if (tab === 1 && !loadedTabs[1]) {
      if (!drivers.length) fetchDrivers();
      setLoadedTabs(p => ({ ...p, 1: true }));
    }
    if (tab === 2 && !loadedTabs[2]) {
      fetchRoutes();
      setLoadedTabs(p => ({ ...p, 2: true }));
    }
    if (tab === 3 && !loadedTabs[3]) {
      if (!vehicles.length) fetchVehicles();
      if (!drivers.length) fetchDrivers();
      setLoadedTabs(p => ({ ...p, 3: true }));
    }
    if (tab === 5) {
      fetchCrowdStatus();
      clearInterval(crowdPollRef.current);
      crowdPollRef.current = setInterval(fetchCrowdStatus, 60000); // refresh every 60s
    } else {
      clearInterval(crowdPollRef.current);
    }
    // eslint-disable-next-line
  }, [tab]);

  // Internal Toast helper
  const showToast = (message, type = "info") => {
    setToastMsg({ message, type });
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Stat calculations
  const activeTracking = vehicles.filter((v) => v.isTracking).length;

  // Filter data based on search
  const filteredVehicles = useMemo(() => {
    if (!search.trim()) return vehicles;
    const q = search.toLowerCase();
    return vehicles.filter(
      (v) =>
        v.regNumber?.toLowerCase().includes(q) ||
        v.model?.toLowerCase().includes(q) ||
        v.driverName?.toLowerCase().includes(q) ||
        v.route?.name?.toLowerCase().includes(q)
    );
  }, [vehicles, search]);

  const filteredDrivers = useMemo(() => {
    if (!search.trim()) return drivers;
    const q = search.toLowerCase();
    return drivers.filter(
      (d) =>
        d.name?.toLowerCase().includes(q) ||
        d.email?.toLowerCase().includes(q)
    );
  }, [drivers, search]);

  const filteredRoutes = useMemo(() => {
    if (!search.trim()) return routes;
    const q = search.toLowerCase();
    return routes.filter(
      (r) =>
        r.name?.toLowerCase().includes(q) ||
        r.origin?.toLowerCase().includes(q) ||
        r.destination?.toLowerCase().includes(q)
    );
  }, [routes, search]);

  // Tab counts
  const tabCounts = [vehicles.length, drivers.length, routes.length, vehicles.length, sosCount > 0 ? sosCount : "-", crowdData.filter(c => c.recommendation === "HIGH_CROWD").length || ""];

  // Inline skeleton for loading states
  const skeletonGrid = (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 18 }}>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="admin-skeleton skeleton-card" />
      ))}
    </div>
  );

  // Render tab content
  const renderTabContent = () => {
    switch (tab) {
      case 0:
        if (vehiclesLoading && !vehicles.length) return skeletonGrid;
        return (
          <AdminVehicles
            vehicles={filteredVehicles}
            setVehicles={setVehicles}
            drivers={drivers}
            routes={routes}
            showToast={showToast}
            search={search}
          />
        );
      case 1:
        if (driversLoading && !drivers.length) return skeletonGrid;
        return (
          <AdminDrivers
            drivers={filteredDrivers}
            setDrivers={setDrivers}
            showToast={showToast}
            search={search}
          />
        );
      case 2:
        if (routesLoading && !routes.length) return skeletonGrid;
        return (
          <AdminRoutes
            routes={filteredRoutes}
            setRoutes={setRoutes}
            showToast={showToast}
            search={search}
          />
        );
      case 3:
        if ((vehiclesLoading && !vehicles.length) || (driversLoading && !drivers.length)) return skeletonGrid;
        return (
          <AdminAssignDriver
            vehicles={filteredVehicles}
            setVehicles={setVehicles}
            drivers={drivers}
            showToast={showToast}
          />
        );
      case 4:
        return (
          <AdminSOSHistory
            search={search}
            latestSosEvent={latestSosEvent}
            showToast={showToast}
          />
        );
      case 5: {
        // ── AI CROWD INTELLIGENCE TAB ─────────────────────────────────────────────
        const highCrowdRoutes = crowdData.filter(c => c.recommendation === "HIGH_CROWD");
        return (
          <div>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 20, color: "var(--admin-text)" }}>🤖 AI Crowd Intelligence</h2>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--admin-text-muted)" }}>
                  Real-time crowd predictions powered by Gradient Boosting ML model. Refreshes every 60s.
                </p>
              </div>
              <button
                onClick={fetchCrowdStatus}
                disabled={crowdLoading}
                style={{ padding: "8px 16px", background: "var(--admin-primary)", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}
              >
                {crowdLoading ? "⏳ Loading..." : "🔄 Refresh Now"}
              </button>
            </div>

            {/* Alert banner for high-crowd routes */}
            {highCrowdRoutes.length > 0 && (
              <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.4)", borderRadius: 12, padding: "14px 20px", marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 22 }}>🚨</span>
                <div>
                  <div style={{ fontWeight: 700, color: "#ef4444", fontSize: 14 }}>High Crowd Alert — {highCrowdRoutes.length} route(s) need extra buses!</div>
                  <div style={{ fontSize: 12, color: "var(--admin-text-muted)", marginTop: 2 }}>
                    {highCrowdRoutes.map(r => r.route.name).join(" · ")}
                  </div>
                </div>
              </div>
            )}

            {/* Crowd cards grid */}
            {crowdLoading && crowdData.length === 0 ? skeletonGrid : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
                {crowdData.map((item) => {
                  const lvl = item.prediction?.crowd_level ?? 1;
                  const cfg = CROWD_LEVEL_CONFIG[Math.min(lvl, 4)];
                  const capRatio = item.prediction?.capacity_ratio ?? 0;
                  const capPct = Math.min(Math.round(capRatio * 100), 100);
                  const passengerEst = item.prediction?.estimated_passengers ?? 0;
                  const confidence = item.prediction?.confidence ?? 0;
                  const isHigh = item.recommendation === "HIGH_CROWD";

                  return (
                    <div
                      key={item.route._id}
                      style={{ background: "var(--admin-surface)", border: `1px solid ${isHigh ? cfg.color : "var(--admin-border)"}`, borderRadius: 14, padding: 20, position: "relative", overflow: "hidden", transition: "box-shadow 0.2s" }}
                    >
                      {/* Colored accent bar */}
                      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: cfg.color }} />

                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 14, color: "var(--admin-text)", marginBottom: 2 }}>{item.route.name}</div>
                          {item.route.origin && item.route.destination && (
                            <div style={{ fontSize: 11, color: "var(--admin-text-muted)" }}>{item.route.origin} → {item.route.destination}</div>
                          )}
                        </div>
                        <span style={{ background: cfg.bg, color: cfg.color, fontWeight: 700, fontSize: 12, padding: "4px 10px", borderRadius: 20, display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                          {cfg.icon} {cfg.label}
                        </span>
                      </div>

                      {/* Capacity bar */}
                      <div style={{ marginBottom: 14 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--admin-text-muted)", marginBottom: 4 }}>
                          <span>Capacity Usage</span>
                          <span style={{ fontWeight: 700, color: cfg.color }}>{capPct}%</span>
                        </div>
                        <div style={{ height: 6, background: "var(--admin-border)", borderRadius: 3, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${capPct}%`, background: cfg.color, borderRadius: 3, transition: "width 0.5s" }} />
                        </div>
                      </div>

                      {/* Stats row */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
                        <div style={{ textAlign: "center", background: "var(--admin-surface-2)", padding: "8px 4px", borderRadius: 8 }}>
                          <div style={{ fontSize: 18, fontWeight: 800, color: cfg.color }}>{passengerEst}</div>
                          <div style={{ fontSize: 10, color: "var(--admin-text-muted)" }}>Passengers</div>
                        </div>
                        <div style={{ textAlign: "center", background: "var(--admin-surface-2)", padding: "8px 4px", borderRadius: 8 }}>
                          <div style={{ fontSize: 18, fontWeight: 800, color: "var(--admin-text)" }}>{item.activeBuses}</div>
                          <div style={{ fontSize: 10, color: "var(--admin-text-muted)" }}>Active Buses</div>
                        </div>
                        <div style={{ textAlign: "center", background: "var(--admin-surface-2)", padding: "8px 4px", borderRadius: 8 }}>
                          <div style={{ fontSize: 18, fontWeight: 800, color: "#3b82f6" }}>{Math.round(confidence * 100)}%</div>
                          <div style={{ fontSize: 10, color: "var(--admin-text-muted)" }}>AI Confidence</div>
                        </div>
                      </div>

                      {/* Deploy button only for high/crowded */}
                      {(isHigh || item.recommendation === "MODERATE") && (
                        <button
                          onClick={() => { setDeployModal({ routeId: item.route._id, routeName: item.route.name }); setSelectedSpare(""); }}
                          style={{ width: "100%", padding: "9px 0", background: isHigh ? "#ef4444" : "var(--admin-primary)", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                        >
                          🚌 Deploy Extra Bus
                        </button>
                      )}
                    </div>
                  );
                })}

                {crowdData.length === 0 && !crowdLoading && (
                  <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "60px 20px", color: "var(--admin-text-muted)" }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>🤖</div>
                    <p>No local routes found. Ensure local buses are seeded and running.</p>
                  </div>
                )}
              </div>
            )}

            {/* Deploy Modal */}
            {deployModal && (
              <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setDeployModal(null)}>
                <div style={{ background: "var(--admin-surface)", borderRadius: 16, padding: 28, width: 400, border: "1px solid var(--admin-border)" }} onClick={e => e.stopPropagation()}>
                  <h3 style={{ margin: "0 0 6px", color: "var(--admin-text)" }}>🚌 Deploy Extra Bus</h3>
                  <p style={{ fontSize: 13, color: "var(--admin-text-muted)", marginBottom: 20 }}>Route: <strong>{deployModal.routeName}</strong></p>

                  {spareBuses.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "20px 0", color: "var(--admin-text-muted)", fontSize: 13 }}>No spare buses available right now.</div>
                  ) : (
                    <>
                      <label style={{ fontSize: 13, fontWeight: 600, color: "var(--admin-text-muted)", display: "block", marginBottom: 6 }}>Select Spare Bus</label>
                      <select
                        value={selectedSpare}
                        onChange={e => setSelectedSpare(e.target.value)}
                        style={{ width: "100%", padding: "10px 12px", background: "var(--admin-surface-2)", border: "1px solid var(--admin-border)", borderRadius: 8, color: "var(--admin-text)", fontSize: 14, marginBottom: 20 }}
                      >
                        <option value="">-- Choose a bus --</option>
                        {spareBuses.map(b => (
                          <option key={b._id} value={b._id}>{b.regNumber} — {b.model || "Bus"} (cap: {b.capacity || "N/A"})</option>
                        ))}
                      </select>
                      <div style={{ display: "flex", gap: 10 }}>
                        <button onClick={() => setDeployModal(null)} style={{ flex: 1, padding: "10px", background: "var(--admin-surface-2)", border: "1px solid var(--admin-border)", borderRadius: 8, color: "var(--admin-text)", cursor: "pointer", fontWeight: 600 }}>Cancel</button>
                        <button onClick={handleDeploySpareBus} disabled={!selectedSpare || deploying} style={{ flex: 1, padding: "10px", background: "#ef4444", color: "white", border: "none", borderRadius: 8, cursor: selectedSpare ? "pointer" : "not-allowed", fontWeight: 600, opacity: selectedSpare ? 1 : 0.5 }}>
                          {deploying ? "Deploying..." : "🚀 Deploy Now"}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      }
      default:
        return null;
    }
  };

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    window.dispatchEvent(new Event("userChanged"));
    window.location.href = "/";
  };

  return (
    <div className="admin-layout-wrapper">
      <div className="admin-container">
        
        {/* ─── Top Bar ─── */}
        <div className="admin-topbar">
          <div className="admin-topbar-left">
            <div className="admin-logo-icon">PT</div>
            <div className="admin-logo-text">
              <span className="admin-logo-title">PT Tracker</span>
              <span className="admin-logo-subtitle">Admin Portal</span>
            </div>
          </div>
          <div className="admin-topbar-right">
            <a href="/vehicles" className="admin-tab" style={{marginRight: '8px', padding: '6px 12px'}}>Public Map</a>
            
            <div className="admin-dropdown-container" ref={dropdownRef}>
              <div 
                className="admin-profile-chip" 
                onClick={() => { setDropdownOpen(!dropdownOpen); setSosCount(0); }}
                style={{ cursor: 'pointer', paddingRight: '12px', position: 'relative' }}
              >
                {sosCount > 0 && (
                  <span style={{ position: 'absolute', top: -4, right: -4, width: 14, height: 14, background: '#ef4444', borderRadius: '50%', border: '2px solid var(--admin-base)', display: 'block', animation: 'sos-pulse 1.5s infinite' }}></span>
                )}
                <div className="admin-avatar">{user?.name ? user.name.charAt(0).toUpperCase() : "A"}</div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span className="admin-profile-name">System Admin</span>
                </div>
                <span style={{ 
                  fontSize: '10px', 
                  marginLeft: '4px', 
                  color: 'var(--admin-text-muted)',
                  transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', 
                  transition: 'transform 0.2s' 
                }}>▼</span>
              </div>

              {dropdownOpen && (
                <div className="admin-dropdown-menu">
                  <div className="admin-dropdown-header">
                    <div className="admin-dropdown-name">{user?.name || "Administrator"}</div>
                    <div className="admin-dropdown-email">{user?.email || "admin@system.com"}</div>
                  </div>
                  <button className="admin-dropdown-item" onClick={() => { setDropdownOpen(false); setShowProfileModal(true); }}>
                    <span>👤</span> My Profile
                  </button>
                  <button className="admin-dropdown-item" onClick={() => { setDropdownOpen(false); setShowSettingsModal(true); }}>
                    <span>⚙️</span> Settings
                  </button>
                  <div className="admin-dropdown-divider"></div>
                  <button className="admin-dropdown-item danger" onClick={handleLogout}>
                    <span>🚪</span> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ─── Dashboard Header + Search ─── */}
        <div className="admin-header">
          <div className="admin-header-content">
            <div className="admin-header-top">
              <div>
                <h1 className="admin-title">
                  Fleet <span className="admin-title-accent">Dashboard</span>
                </h1>
                <p className="admin-subtitle">
                  Manage your vehicles, drivers, routes and assignments.
                </p>
              </div>
              <div className="admin-search-wrapper">
                <span className="admin-search-icon">🔍</span>
                <input
                  type="text"
                  className="admin-search-input"
                  placeholder={`Search ${TAB_CONFIG[tab].label.toLowerCase()}...`}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  id="admin-search"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ─── Stats Grid ─── */}
        <div className="admin-stats-grid">
          {(vehiclesLoading && !vehicles.length) ? (
            [1, 2, 3, 4].map((i) => (
              <div key={i} className="admin-skeleton skeleton-stat" />
            ))
          ) : (
            <>
              <div className="admin-stat-card stat-vehicles">
                <div className="stat-card-header">
                  <div className="stat-icon-wrap">🚐</div>
                </div>
                <div className="stat-number">{vehicles.length}</div>
                <div className="stat-label">Vehicles</div>
              </div>

              <div className="admin-stat-card stat-drivers">
                <div className="stat-card-header">
                  <div className="stat-icon-wrap">👤</div>
                </div>
                <div className="stat-number">{drivers.length}</div>
                <div className="stat-label">Drivers</div>
              </div>

              <div className="admin-stat-card stat-routes">
                <div className="stat-card-header">
                  <div className="stat-icon-wrap">🗺️</div>
                </div>
                <div className="stat-number">{routes.length}</div>
                <div className="stat-label">Routes</div>
              </div>

              <div className="admin-stat-card stat-tracking">
                <div className="stat-card-header">
                  <div className="stat-icon-wrap">📡</div>
                </div>
                <div className="stat-number">{activeTracking}</div>
                <div className="stat-label">Live Units</div>
              </div>
            </>
          )}
        </div>

        {/* ─── AI Crowd Widget (always visible) ─── */}
        <CrowdWidget role="admin" compact={false} deployedLog={deployedLog} />

        {/* ─── Live City Bus Map (full width) ─── */}
        <div style={{
          borderRadius: 16, overflow: 'hidden', marginBottom: 24,
          border: '1px solid rgba(255,255,255,0.07)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
        }}>
          <div style={{ background: '#1a1d2e', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <span style={{ fontSize: 18 }}>🗺️</span>
            <span style={{ fontWeight: 700, fontSize: 14, color: '#f1f5f9' }}>Live City Bus Map</span>
            <a href="/local-buses/map" target="_blank" rel="noopener noreferrer" style={{ marginLeft: 'auto', fontSize: 12, color: '#6366f1', textDecoration: 'none', fontWeight: 600 }}>Open Full Screen ↗</a>
          </div>
          <iframe
            src="/local-buses/map"
            title="Live City Bus Map"
            style={{ width: '100%', height: 520, border: 'none', display: 'block' }}
          />
        </div>

        {/* ─── Tab Navigation ─── */}
        <div className="tabs-wrapper">
          {TAB_CONFIG.map((item, idx) => (
            <button
              key={item.key}
              className={`admin-tab ${tab === idx ? "active" : ""}`}
              onClick={() => {
                setTab(idx);
                setSearch("");
              }}
              id={`admin-tab-${item.key}`}
            >
              <span className="admin-tab-icon">{item.icon}</span>
              {item.label}
              <span className="admin-tab-count">{tabCounts[idx]}</span>
            </button>
          ))}
        </div>

        {/* ─── Tab Content ─── */}
        <div className="tab-content" key={tab}>
          {renderTabContent()}
        </div>
      </div>

      {/* ─── Profile Modal ─── */}
      {showProfileModal && (
        <div className="admin-modal-overlay" onClick={() => setShowProfileModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">My Profile</h3>
              <button className="admin-modal-close" onClick={() => setShowProfileModal(false)}>✕</button>
            </div>
            <div className="admin-modal-body" style={{ textAlign: 'center', padding: '20px' }}>
              <div className="admin-profile-chip" style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--admin-primary), var(--admin-primary-dark))', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', margin: '0 auto 16px', border: 'none' }}>
                {user?.name ? user.name.charAt(0).toUpperCase() : "A"}
              </div>
              <h2 style={{ fontSize: '18px', margin: '0 0 4px', color: 'var(--admin-text)' }}>{user?.name || "System Admin"}</h2>
              <p style={{ color: 'var(--admin-text-muted)', fontSize: '14px', margin: '0 0 24px' }}>{user?.email || "admin@system.com"}</p>
              
              <div style={{ background: 'var(--admin-surface-2)', borderRadius: '12px', padding: '16px', textAlign: 'left', border: '1px solid var(--admin-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ color: 'var(--admin-text-muted)', fontSize: '13px' }}>Role</span>
                  <span style={{ fontWeight: '600', color: 'var(--admin-text)', fontSize: '13px', textTransform: 'capitalize' }}>{user?.role || "Admin"}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ color: 'var(--admin-text-muted)', fontSize: '13px' }}>Access Level</span>
                  <span style={{ fontWeight: '600', color: 'var(--admin-text)', fontSize: '13px' }}>Full System Access</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--admin-text-muted)', fontSize: '13px' }}>Auth Method</span>
                  <span style={{ fontWeight: '600', color: 'var(--admin-text)', fontSize: '13px' }}>Email / Password</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Settings Modal ─── */}
      {showSettingsModal && (
        <div className="admin-modal-overlay" onClick={() => setShowSettingsModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">System Settings</h3>
              <button className="admin-modal-close" onClick={() => setShowSettingsModal(false)}>✕</button>
            </div>
            <div className="admin-modal-body">
              <p style={{ color: 'var(--admin-text-muted)', fontSize: '14px', marginBottom: '20px' }}>
                Configure global tracking behavior and admin preferences.
              </p>
              
              <div className="admin-form-group">
                <label className="admin-form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  Enable Email Notifications
                  <input type="checkbox" defaultChecked style={{ accentColor: 'var(--admin-primary)', width: '16px', height: '16px' }} />
                </label>
                <p style={{ fontSize: '12px', color: 'var(--admin-text-muted)', marginTop: '4px' }}>Receive alerts when drivers complete their routes.</p>
              </div>

              <div className="admin-form-group" style={{ marginTop: '20px' }}>
                <label className="admin-form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  Auto-Refresh Dashboard
                  <input type="checkbox" defaultChecked style={{ accentColor: 'var(--admin-primary)', width: '16px', height: '16px' }} />
                </label>
                <p style={{ fontSize: '12px', color: 'var(--admin-text-muted)', marginTop: '4px' }}>Automatically fetch fleet updates every 30 seconds.</p>
              </div>

              <div className="admin-form-group" style={{ marginTop: '20px' }}>
                <label className="admin-form-label">Theme Preference</label>
                <select className="admin-form-input" defaultValue="system">
                  <option value="system">System Default</option>
                  <option value="light">Light Mode</option>
                  <option value="dark">Dark Mode</option>
                </select>
              </div>

              <button className="admin-btn admin-btn-success admin-btn-full" style={{ marginTop: '24px' }} onClick={() => { showToast("Settings updated successfully", "success"); setShowSettingsModal(false); }}>
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── REAL-TIME SOS TOAST OVERLAY ─── */}
      {/* Hot-toast handles rendering globally from App.js, but we can add a local one for layout-specific overrides if needed */}



      {/* ─── Standard Internal Toast Notification ─── */}
      {toastMsg && (
        <div className={`admin-toast ${toastMsg.type}`}>
          <span>
            {toastMsg.type === "success" ? "✅" : toastMsg.type === "error" ? "❌" : "ℹ️"}
          </span>
          {toastMsg.message}
        </div>
      )}
    </div>
  );
}