import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api";
import "../styles/Vehicles.css";

const Vehicles = ({ user }) => {
  const [vehicles, setVehicles] = useState([]);
  const navigate = useNavigate();

  const fetchVehicles = async () => {
    try {
      const res = await API.get("/vehicles");
      setVehicles(res.data || []);
    } catch (err) {
      console.error("Failed to fetch vehicles:", err);
    }
  };

  useEffect(() => {
    fetchVehicles();
    const iv = setInterval(fetchVehicles, 5000);
    return () => clearInterval(iv);
  }, []);

  if (!user)
    return (
      <div className="vehicles-page">
        <div className="vehicles-container">
          <div className="error-state">
            <span className="error-icon">🔒</span>
            <h2 className="error-title">Authentication Required</h2>
            <p className="error-message">
              Please log in to view and track vehicles in real-time.
            </p>
            <button
              className="error-action"
              onClick={() => navigate("/login")}
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );

  const handleTrack = (vehicleId) => {
    navigate(`/vehicles/${vehicleId}/track`);
  };

  const handleBook = (vehicleId) => {
    navigate(`/book/${vehicleId}`);
  };

  return (
    <div className="vehicles-page">
      <div className="vehicles-container">
        <h1 className="vehicles-title">🚍 Vehicles</h1>

        {vehicles.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">🚌</span>
            <h2 className="empty-title">No Vehicles Found</h2>
            <p className="empty-message">
              No vehicles are currently available. Check back later.
            </p>
          </div>
        ) : (
          <div className="vehicles-grid">
            {vehicles.map((v) => {
              const lastSeen =
                v.lastSeenAt && new Date(v.lastSeenAt).toLocaleString();
              const location = v.currentLocation;

              return (
                <div className="vehicle-card" key={v._id}>
                  <div className="vehicle-header">
                    <span className="vehicle-number">
                      {v.regNumber || v.vehicleNumber || "—"}
                    </span>
                    <span
                      className={`vehicle-status ${v.status === "active" ? "active" : "inactive"}`}
                    >
                      {v.status ? v.status.toUpperCase() : "UNKNOWN"}
                    </span>
                  </div>

                  <div className="vehicle-info">
                    <div className="vehicle-info-item">
                      <strong>Model:</strong> {v.model || v.type || "—"}
                    </div>
                    <div className="vehicle-info-item">
                      <strong>Capacity:</strong> {v.capacity ?? "—"}
                    </div>
                    <div className="vehicle-info-item">
                      <strong>Driver:</strong> {v.driverName || "Unassigned"}
                    </div>
                    <div className="vehicle-info-item">
                      <strong>Route:</strong> {v.route?.name || "Unassigned"}
                    </div>

                    {location ? (
                      <>
                        <div className="vehicle-info-item">
                          <strong>Location:</strong>{" "}
                          {Number(location.lat).toFixed(4)},{" "}
                          {Number(location.lng).toFixed(4)}
                        </div>
                        <div className="vehicle-info-item">
                          <strong>Last seen:</strong> {lastSeen}
                        </div>
                      </>
                    ) : (
                      <div className="vehicle-info-item">
                        No live location yet
                      </div>
                    )}
                  </div>

                  <div className="vehicle-actions">
                    <button
                      className="vehicle-btn vehicle-btn-primary"
                      onClick={() => handleTrack(v._id)}
                    >
                      Track
                    </button>
                    <button
                      className="vehicle-btn vehicle-btn-secondary"
                      onClick={() => handleBook(v._id)}
                    >
                      Book
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Vehicles;
