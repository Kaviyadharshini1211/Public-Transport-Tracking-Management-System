import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import DriverDashboard from "./DriverDashboard";
import DriverMyVehicle from "./DriverMyVehicle";
import DriverTracking from "./DriverTracking";
import API from "../../api/api";
import "../../styles/DriverLayout.css";

const TABS = [
  { id: "dashboard", label: "Dashboard", icon: "📊" },
  { id: "vehicle", label: "My Vehicle", icon: "🚌" },
  { id: "tracking", label: "Live Tracking", icon: "📍" },
];

export default function DriverLayout() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [vehicle, setVehicle] = useState(null);
  const [loadingVehicle, setLoadingVehicle] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Load user from localStorage
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("user"));
      if (!stored || stored.role !== "driver") {
        navigate("/login", { replace: true });
        return;
      }
      setUser(stored);
    } catch {
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  // Fetch assigned vehicle
  const fetchVehicle = useCallback(async () => {
    if (!user) return;
    try {
      setLoadingVehicle(true);
      const res = await API.get("/vehicles");
      const myVehicle = res.data.find(
        (v) => v.driverName === user.email || v.driverName === user.name
      );
      setVehicle(myVehicle || null);
    } catch (err) {
      console.error("Error loading vehicle:", err);
      setVehicle(null);
    } finally {
      setLoadingVehicle(false);
    }
  }, [user]);

  useEffect(() => {
    fetchVehicle();
  }, [fetchVehicle]);

  // Close mobile menu when tab changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [activeTab]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileMenuOpen]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    window.dispatchEvent(new Event("userChanged"));
    navigate("/");
  };

  if (!user) return null;

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good Morning";
    if (h < 17) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <div className="drv-layout">
      {/* ===== TOP HEADER BAR ===== */}
      <header className="drv-header">
        <div className="drv-header__inner">
          <div className="drv-header__left">
            <div className="drv-header__avatar">
              {user.name ? user.name.charAt(0).toUpperCase() : "D"}
            </div>
            <div className="drv-header__info">
              <span className="drv-header__greeting">{greeting()}</span>
              <h2 className="drv-header__name">{user.name || "Driver"}</h2>
            </div>
          </div>

          <div className="drv-header__right">
            <span className="drv-header__role-badge">
              <span className="drv-badge-dot"></span>
              Driver
            </span>
            <button className="drv-header__logout" onClick={handleLogout} title="Logout">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* ===== TAB NAVIGATION ===== */}
      <nav className="drv-tabs">
        <div className="drv-tabs__inner">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`drv-tab ${activeTab === tab.id ? "drv-tab--active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="drv-tab__icon">{tab.icon}</span>
              <span className="drv-tab__label">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* ===== MOBILE BOTTOM NAV ===== */}
      <nav className="drv-bottom-nav">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`drv-bottom-nav__item ${activeTab === tab.id ? "drv-bottom-nav__item--active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="drv-bottom-nav__icon">{tab.icon}</span>
            <span className="drv-bottom-nav__label">{tab.label}</span>
          </button>
        ))}
      </nav>

      {/* ===== TAB CONTENT ===== */}
      <main className="drv-content">
        {activeTab === "dashboard" && (
          <DriverDashboard
            user={user}
            vehicle={vehicle}
            loading={loadingVehicle}
            onRefresh={fetchVehicle}
          />
        )}
        {activeTab === "vehicle" && (
          <DriverMyVehicle
            vehicle={vehicle}
            loading={loadingVehicle}
            onRefresh={fetchVehicle}
          />
        )}
        {activeTab === "tracking" && (
          <DriverTracking
            vehicle={vehicle}
            loading={loadingVehicle}
          />
        )}
      </main>
    </div>
  );
}