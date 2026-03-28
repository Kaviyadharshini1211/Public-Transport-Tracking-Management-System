import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api";
import { useToast, ToastContainer } from "../components/Toast";
import LoadingSpinner from "../components/LoadingSpinner";
import "../styles/Vehicles.css";

const Vehicles = ({ user }) => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toasts, addToast, removeToast } = useToast();

  const fetchVehicles = async () => {
    try {
      const res = await API.get("/vehicles");
      setVehicles(res.data || []);
    } catch (err) {
      console.error("Failed to fetch vehicles:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
    const iv = setInterval(fetchVehicles, 5000);
    return () => clearInterval(iv);
  }, []);

  const handleTrack = (vehicle) => {
    // Null check for location before navigating
    if (!vehicle.currentLocation || !vehicle.currentLocation.lat) {
      addToast({
        type: "warning",
        title: "Tracking Unavailable",
        message: "Live tracking is not available for this vehicle yet. The driver may not have started sharing location.",
        duration: 4000,
      });
      return;
    }
    navigate(`/track/${vehicle._id}`);
  };

  const handleBook = (vehicleId) => {
    if (user) {
      navigate(`/book`);
    } else {
      navigate("/login");
    }
  };

  if (loading) {
    return (
      <div className="vehicles-page">
        <div className="vehicles-loading">
          <LoadingSpinner size="lg" />
          <p className="vehicles-loading-text">Loading vehicles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="vehicles-page">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      <div className="vehicles-container">
        <h1 className="vehicles-title">🚍 Vehicles</h1>

        {/* Optional login banner for non-authenticated users */}
        {!user && (
          <div className="vehicles-login-banner">
            <span className="login-banner-icon">💡</span>
            <span className="login-banner-text">
              <strong>Tip:</strong> <a href="/login" className="login-banner-link">Login</a> to unlock booking, personalized alerts, and advanced tracking features.
            </span>
          </div>
        )}

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
              const hasLocation = location && location.lat;

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

                    {hasLocation ? (
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
                      <div className="vehicle-info-item vehicle-no-location">
                        <span className="no-location-icon">📡</span>
                        No live location yet
                      </div>
                    )}
                  </div>

                  <div className="vehicle-actions">
                    <button
                      className={`vehicle-btn vehicle-btn-primary ${!hasLocation ? "vehicle-btn-disabled" : ""}`}
                      onClick={() => handleTrack(v)}
                      title={hasLocation ? "Track this vehicle live" : "Location not available yet"}
                    >
                      {hasLocation ? "📍 Track" : "📡 Track"}
                    </button>
                    <button
                      className="vehicle-btn vehicle-btn-secondary"
                      onClick={() => handleBook(v._id)}
                    >
                      {user ? "🎫 Book" : "🔐 Login to Book"}
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
