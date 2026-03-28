import React, { useState, useEffect, useMemo } from "react";
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

export default function AdminLayout() {
  const [tab, setTab] = useState(0);
  const [search, setSearch] = useState("");
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

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

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.dispatchEvent(new Event("userChanged"));
    window.location.href = "/";
  };

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

  return (
    <div className="admin-layout-wrapper">
      <div className="admin-container">
        {/* ─── Top Bar ─── */}
        <div className="admin-topbar">
          <div className="admin-topbar-left">
            <div className="admin-logo-icon">🚌</div>
            <div className="admin-logo-text">
              <span className="admin-logo-title">FleetCommand</span>
              <span className="admin-logo-subtitle">Admin Console</span>
            </div>
          </div>
          <div className="admin-topbar-right">
            <div className="admin-profile-chip">
              <div className="admin-avatar">
                {(user.name || "A").charAt(0).toUpperCase()}
              </div>
              <span className="admin-profile-name">{user.name || "Admin"}</span>
            </div>
            <button className="admin-logout-btn" onClick={handleLogout}>
              <span>⏻</span> Logout
            </button>
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
                  Manage your vehicles, drivers, routes and assignments — all in one place.
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
                  <span className="stat-trend neutral">Fleet</span>
                </div>
                <div className="stat-number">{vehicles.length}</div>
                <div className="stat-label">Total Vehicles</div>
              </div>

              <div className="admin-stat-card stat-drivers">
                <div className="stat-card-header">
                  <div className="stat-icon-wrap">👤</div>
                  <span className="stat-trend up">↑ Active</span>
                </div>
                <div className="stat-number">{drivers.length}</div>
                <div className="stat-label">Total Drivers</div>
              </div>

              <div className="admin-stat-card stat-routes">
                <div className="stat-card-header">
                  <div className="stat-icon-wrap">🗺️</div>
                  <span className="stat-trend neutral">Coverage</span>
                </div>
                <div className="stat-number">{routes.length}</div>
                <div className="stat-label">Total Routes</div>
              </div>

              <div className="admin-stat-card stat-tracking">
                <div className="stat-card-header">
                  <div className="stat-icon-wrap">📡</div>
                  <span className="stat-trend up">↑ Live</span>
                </div>
                <div className="stat-number">{activeTracking}</div>
                <div className="stat-label">Active Tracking</div>
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