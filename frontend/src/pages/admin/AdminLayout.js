import React, { useState, useEffect, useMemo, useRef } from "react";
import API from "../../api/api";
import "../../styles/AdminLayout.css";

import AdminVehicles from "./AdminVehicles";
import AdminDrivers from "./AdminDrivers";
import AdminRoutes from "./AdminRoutes";
import AdminAssignDriver from "./AdminAssignDriver";

const TAB_CONFIG = [
  { key: "vehicles", label: "Vehicles", icon: "🚐" },
  { key: "drivers", label: "Drivers", icon: "👤" },
  { key: "routes", label: "Routes", icon: "🗺️" },
  { key: "assign", label: "Assign Driver", icon: "🔗" },
];

export default function AdminDashboard() {
  const [tab, setTab] = useState(0);
  const [search, setSearch] = useState("");
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  
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
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [vehiclesRes, driversRes, routesRes] = await Promise.all([
        API.get("/vehicles"),
        API.get("/auth/list-users?role=driver"),
        API.get("/routes"),
      ]);
      setVehicles(vehiclesRes.data || []);
      setDrivers(driversRes.data || []);
      setRoutes(routesRes.data || []);
    } catch (error) {
      console.error("Error fetching admin data:", error);
      showToast("Failed to load data", "error");
    } finally {
      setLoading(false);
    }
  };

  // Toast helper
  const showToast = (message, type = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
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
        v.driverName?.toLowerCase().includes(q)
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
  const tabCounts = [vehicles.length, drivers.length, routes.length, vehicles.length];

  // Render tab content
  const renderTabContent = () => {
    if (loading) {
      return (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 18 }}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="admin-skeleton skeleton-card" />
          ))}
        </div>
      );
    }

    switch (tab) {
      case 0:
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
        return (
          <AdminDrivers
            drivers={filteredDrivers}
            setDrivers={setDrivers}
            showToast={showToast}
            search={search}
          />
        );
      case 2:
        return (
          <AdminRoutes
            routes={filteredRoutes}
            setRoutes={setRoutes}
            showToast={showToast}
            search={search}
          />
        );
      case 3:
        return (
          <AdminAssignDriver
            vehicles={filteredVehicles}
            setVehicles={setVehicles}
            drivers={drivers}
            showToast={showToast}
          />
        );
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
                onClick={() => setDropdownOpen(!dropdownOpen)}
                style={{ cursor: 'pointer', paddingRight: '12px' }}
              >
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
          {loading ? (
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

      {/* ─── Toast Notification ─── */}
      {toast && (
        <div className={`admin-toast ${toast.type}`}>
          <span>
            {toast.type === "success" ? "✅" : toast.type === "error" ? "❌" : "ℹ️"}
          </span>
          {toast.message}
        </div>
      )}
    </div>
  );
}