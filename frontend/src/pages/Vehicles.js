import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import * as vehicleService from "../api/vehicle";
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
      const data = await vehicleService.getVehicles();
      setVehicles(data || []);
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

  const [filter, setFilter] = useState("all");

  const filteredVehicles = vehicles.filter(v => {
    if (filter === "all") return true;
    if (filter === "intercity") return v.type === "long-haul";
    if (filter === "local") return v.type === "local";
    return true;
  });

  return (
    <div className="vehicles-page">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      <div className="vehicles-container">
        <header className="vehicles-header-section">
          <h1 className="vehicles-title">🚍 Fleet Management</h1>
          <p className="vehicles-subtitle">Real-time status and booking for our entire fleet.</p>
          
          <div className="vehicles-filter-bar">
            <button 
              className={`filter-btn ${filter === "all" ? "active" : ""}`}
              onClick={() => setFilter("all")}
            >
              All Vehicles
            </button>
            <button 
              className={`filter-btn ${filter === "intercity" ? "active" : ""}`}
              onClick={() => setFilter("intercity")}
            >
              Intercity (Luxury)
            </button>
            <button 
              className={`filter-btn ${filter === "local" ? "active" : ""}`}
              onClick={() => setFilter("local")}
            >
              Local (City Bus)
            </button>
          </div>
        </header>

        {filteredVehicles.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">🚌</span>
            <h2 className="empty-title">No {filter !== 'all' ? filter : ''} vehicles found</h2>
            <p className="empty-message">
              Try changing your filter or check back later.
            </p>
          </div>
        ) : (
          <div className="table-responsive premium-shadow">
            <table className="vehicles-table">
              <thead>
                <tr>
                  <th>Vehicle Info</th>
                  <th>Type</th>
                  <th>Route</th>
                  <th>Status</th>
                  <th>Live Tracking</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredVehicles.map((v) => {
                  const location = v.currentLocation;
                  const hasLocation = location && location.lat;
                  const isLocal = v.type === "local";

                  return (
                    <tr key={v._id}>
                      <td>
                        <div className="v-info-cell">
                          <span className="v-reg">{v.regNumber}</span>
                          <span className="v-model">{v.model}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`type-badge ${isLocal ? 'local' : 'long-haul'}`}>
                          {isLocal ? 'CITY BUS' : 'INTERCITY'}
                        </span>
                      </td>
                      <td>
                        <div className="v-route-cell">
                          <span className="v-route-name">{v.route?.name || "Unassigned"}</span>
                          <span className="v-driver">Driver: {v.driverName || "N/A"}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`status-pill ${v.status === "active" ? "active" : "inactive"}`}>
                          {v.status?.toUpperCase() || "OFFLINE"}
                        </span>
                      </td>
                      <td>
                        {hasLocation ? (
                          <div className="v-tracking-cell">
                            <span className="tracking-live">LIVE</span>
                            <span className="tracking-time">
                              {new Date(v.lastSeenAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        ) : (
                          <span className="tracking-none">Not Shared</span>
                        )}
                      </td>
                      <td>
                        <div className="v-actions-cell">
                          <button
                            className={`action-btn track ${!hasLocation ? "disabled" : ""}`}
                            onClick={() => handleTrack(v)}
                            disabled={!hasLocation}
                          >
                            Track
                          </button>
                          {!isLocal && (
                            <button
                              className="action-btn book"
                              onClick={() => handleBook(v._id)}
                            >
                              Book
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Vehicles;
