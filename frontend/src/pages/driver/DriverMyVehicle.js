import React, { useEffect, useState } from "react";
import API from "../../api/api";
import "../../styles/DriverMyVehicle.css";

export default function DriverMyVehicle() {
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem("user"));

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

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">🚗</div>
        <p className="empty-state-text">No vehicle assigned.</p>
      </div>
    );
  }

  return (
    <div className="my-vehicle-container">
      <h2 className="vehicle-header">My Vehicle</h2>
      
      <div className="vehicle-card">
        <div className="vehicle-info-grid">
          <div className="info-item">
            <span className="info-label">Vehicle No:</span>
            <span className="info-value">{vehicle.regNumber}</span>
          </div>

          <div className="info-item">
            <span className="info-label">Model:</span>
            <span className="info-value">{vehicle.model}</span>
          </div>

          <div className="info-item full-width">
            <span className="info-label">Route:</span>
            <span className="info-value route-path">
              {vehicle.route?.origin} 
              <span className="route-arrow">→</span> 
              {vehicle.route?.destination}
            </span>
          </div>

          <div className="info-item">
            <span className="info-label">Status:</span>
            <span className={`status-badge status-${vehicle.status?.toLowerCase()}`}>
              {vehicle.status}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}