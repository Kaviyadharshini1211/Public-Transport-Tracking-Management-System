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
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [triggeringPanic, setTriggeringPanic] = useState(false);

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

  const fetchNotifications = async () => {
    try {
      const res = await API.get("/notifications");
      setNotifications(res.data || []);
    } catch(err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const handlePanic = async () => {
    if (triggeringPanic) return;
    // Engage silent SOS (removed window.confirm for instant trigger)
    setTriggeringPanic(true);
    
    const broadcastSOS = async (lat, lng, reason) => {
      try {
        await API.post("/sos", {
          driverId: user._id || user.id,
          driverName: user.name || "Driver",
          location: { lat, lng },
          message: reason
        });
        // Feedback toast replacing console logs
        alert("🚨 EMERGENCY SOS BROADCASTED TO ADMIN 🚨");
      } catch (err) {
        console.error("SOS transmission failed", err);
        alert("⚠️ Failed to transmit SOS! Attempt another channel.");
      } finally {
        setTriggeringPanic(false);
      }
    };

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => broadcastSOS(pos.coords.latitude, pos.coords.longitude, "Driver triggered silent SOS (GPS Tracked)"),
        (err) => broadcastSOS(0, 0, "Driver triggered silent SOS (GPS Denied/Failed)")
      );
    } else {
      broadcastSOS(0, 0, "Driver triggered silent SOS (No GPS Support)");
    }
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

          <div className="drv-header__right" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button 
              onClick={handlePanic}
              className={`drv-header__panic ${triggeringPanic ? 'drv-header__panic--active' : ''}`}
              title="Emergency SOS"
              style={{ background: '#ef4444', border: 'none', color: '#fff', padding: '8px 12px', borderRadius: '8px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', transition: 'all 0.3s' }}
            >
              <span>🚨</span> {triggeringPanic ? 'Sending...' : 'SOS'}
            </button>

            <div style={{ position: 'relative' }}>
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                style={{ background: 'var(--drv-surface-2)', border: '1px solid var(--drv-border)', width: '40px', height: '40px', borderRadius: '50%', color: 'var(--drv-text)', cursor: 'pointer', position: 'relative' }}
              >
                🔔
                {notifications.filter(n => !n.read).length > 0 && (
                  <span style={{ position: 'absolute', top: '-2px', right: '-2px', background: '#ef4444', color: '#fff', fontSize: '10px', padding: '2px 6px', borderRadius: '10px', fontWeight: 'bold' }}>
                    {notifications.filter(n => !n.read).length}
                  </span>
                )}
              </button>
              
              {showNotifications && (
                <div style={{ position: 'absolute', top: '50px', right: '0', width: '320px', background: 'var(--drv-surface)', border: '1px solid var(--drv-border)', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', zIndex: 100, overflow: 'hidden' }}>
                  <div style={{ padding: '16px', borderBottom: '1px solid var(--drv-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: '14px' }}>Notifications</h3>
                    <button style={{ background: 'none', border: 'none', color: 'var(--drv-primary)', fontSize: '12px', cursor: 'pointer' }} onClick={async () => { await API.put("/notifications/read"); fetchNotifications(); }}>Mark all read</button>
                  </div>
                  <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {notifications.length === 0 ? (
                      <div style={{ padding: '24px', textAlign: 'center', color: 'var(--drv-text-muted)', fontSize: '13px' }}>No notifications</div>
                    ) : notifications.map(n => (
                      <div key={n._id} style={{ padding: '12px 16px', borderBottom: '1px solid var(--drv-border)', background: n.read ? 'transparent' : 'var(--drv-surface-2)' }}>
                        <div style={{ fontSize: '13px', fontWeight: n.read ? 'normal' : 'bold', color: 'var(--drv-text)', marginBottom: '4px' }}>{n.title}</div>
                        <div style={{ fontSize: '12px', color: 'var(--drv-text-muted)' }}>{n.message}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button className="drv-header__logout" onClick={handleLogout} title="Logout" style={{ background: 'var(--drv-surface-2)', border: '1px solid var(--drv-border)', width: '40px', height: '40px', borderRadius: '50%', color: 'var(--drv-text)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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