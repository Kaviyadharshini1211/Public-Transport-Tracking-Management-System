import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Dashboard.css";

const Dashboard = ({ user }) => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    // 1️⃣ App provides user → use immediately
    if (user) {
      setCurrentUser(user);
      setInitializing(false);
      return;
    }

    // 2️⃣ fallback → get from localStorage
    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        setCurrentUser(JSON.parse(stored));
      }
    } catch {}

    setInitializing(false);
  }, [user]);

  // 3️⃣ If unauthenticated AFTER loading → go to login
  useEffect(() => {
    if (!initializing && !currentUser) {
      navigate("/login", { replace: true });
    }
  }, [initializing, currentUser, navigate]);

  // Show loading while figuring out if user exists
  if (initializing) {
    return (
      <div className="dashboard-container">
        <div className="loading-dashboard">
          <span className="loading-icon">⏳</span>
          Loading dashboard…
        </div>
      </div>
    );
  }

  // If redirect triggers, this won’t be visible
  if (!currentUser) return null;

  const role = currentUser.role || "passenger";

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        <div className="dashboard-header">
          <h1 className="dashboard-title">Dashboard</h1>
          <p className="dashboard-welcome">Welcome, {currentUser.name}!</p>
          <span className="dashboard-role">{role.toUpperCase()}</span>
        </div>

        {role === "admin" ? (
          <div className="dashboard-grid">
            <div className="dashboard-card">
              <div className="card-icon">🚍</div>
              <h2 className="card-title">Fleet Overview</h2>
              <p className="card-description">Manage vehicles and schedules.</p>
            </div>

            <div className="dashboard-card">
              <div className="card-icon">📊</div>
              <h2 className="card-title">Passenger Analytics</h2>
              <p className="card-description">
                Track passenger data and route performance.
              </p>
            </div>
          </div>
        ) : (
          <div className="dashboard-grid">
            <div className="dashboard-card dashboard-card-full">
              <div className="card-icon">📍</div>
              <h2 className="card-title">Live Vehicle Tracking</h2>
              <p className="card-description">
                See real-time bus/auto locations.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
