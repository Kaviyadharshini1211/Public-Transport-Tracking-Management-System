import React, { useEffect, useState } from "react";
import API from "../../api/api";
import "../../styles/AdminVehicles.css";

export default function AdminVehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const response = await API.get("/vehicles");
        setVehicles(response.data);
      } catch (error) {
        console.error("Error fetching vehicles:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVehicles();
  }, []);

  if (loading) {
    return (
      <div className="vehicles-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="vehicles-container">
      <h1 className="vehicles-header">🚐 Fleet Management</h1>

      {vehicles.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🚗</div>
          <p className="empty-state-text">No vehicles in the fleet</p>
        </div>
      ) : (
        <div className="vehicles-grid">
          {vehicles.map((v) => {
            const driver = v.driverName?.includes("@") 
              ? v.driverName 
              : "Unassigned";
            const hasRoute = v.route?.name;
            const status = v.status || "active";

            return (
              <div key={v._id} className="vehicle-card">
                <div className="card-content">
                  {/* Header Section */}
                  <div className="card-header">
                    <h2 className="vehicle-reg-number">{v.regNumber}</h2>
                    <span className="status-badge">
                      {status.toUpperCase()}
                    </span>
                  </div>

                  {/* Vehicle Details */}
                  <div className="vehicle-details">
                    <div className="detail-row">
                      <span className="detail-icon">🚙</span>
                      <span className="detail-label">Model:</span>
                      <span className="detail-value">{v.model}</span>
                    </div>

                    <div className="detail-row">
                      <span className="detail-icon">👥</span>
                      <span className="detail-label">Capacity:</span>
                      <span className="detail-value">{v.capacity}</span>
                    </div>

                    <div className="detail-row">
                      <span className="detail-icon">👤</span>
                      <span className="detail-label">Driver:</span>
                      <span 
                        className={`detail-value ${
                          driver === "Unassigned" ? "unassigned" : ""
                        }`}
                      >
                        {driver}
                      </span>
                    </div>

                    <div className="detail-row">
                      <span className="detail-icon">📍</span>
                      <span className="detail-label">Route:</span>
                      <span 
                        className={`detail-value ${
                          hasRoute ? "route-assigned" : "unassigned"
                        }`}
                      >
                        {hasRoute || "Not Assigned"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}