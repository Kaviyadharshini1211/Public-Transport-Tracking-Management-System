import React, { useEffect, useState } from "react";
import API from "../../api/api";
import DriverNoAssignment from "./DriverNoAssignment";
import "../../styles/DriverDashboard.css";

export default function DriverDashboard() {
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await API.get("/vehicles");
        const my = res.data.find(v => v.driverName === user.email);
        setVehicle(my || null);
      } catch (error) {
        console.error("Error loading vehicle:", error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!vehicle) return <DriverNoAssignment />;

  return (
    <div className="driver-dashboard-container">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Driver Dashboard</h1>
        <p className="welcome-text">Welcome, <span className="user-name">{user.name}</span></p>
      </div>

      <div className="dashboard-content">
        <div className="assigned-vehicle-section">
          <h3 className="section-title">Your Assigned Vehicle</h3>
          
          <div className="vehicle-details-card">
            <div className="vehicle-icon">🚗</div>
            
            <div className="vehicle-details">
              <div className="detail-row">
                <span className="detail-label">Vehicle Number</span>
                <span className="detail-value vehicle-number">{vehicle.regNumber}</span>
              </div>

              <div className="detail-row route-detail">
                <span className="detail-label">Assigned Route</span>
                <div className="route-display">
                  <span className="route-location origin">{vehicle.route?.origin}</span>
                  <span className="route-arrow">→</span>
                  <span className="route-location destination">{vehicle.route?.destination}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="quick-stats">
          <div className="stat-card">
            <div className="stat-icon">📍</div>
            <div className="stat-info">
              <span className="stat-label">Current Status</span>
              <span className="stat-value">On Route</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">⏰</div>
            <div className="stat-info">
              <span className="stat-label">Shift Status</span>
              <span className="stat-value">Active</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-info">
              <span className="stat-label">Vehicle Status</span>
              <span className="stat-value">{vehicle.status || "Active"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}