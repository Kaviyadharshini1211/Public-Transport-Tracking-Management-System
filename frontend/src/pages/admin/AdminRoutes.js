import React, { useEffect, useState } from "react";
import API from "../../api/api";
import "../../styles/AdminRoutes.css";

export default function AdminRoutes() {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        const response = await API.get("/routes");
        setRoutes(response.data);
      } catch (error) {
        console.error("Error fetching routes:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRoutes();
  }, []);

  if (loading) {
    return (
      <div className="routes-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="routes-container">
      <h1 className="routes-header">Routes</h1>

      {routes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🗺️</div>
          <p className="empty-state-text">No routes available</p>
        </div>
      ) : (
        <div className="routes-grid">
          {routes.map((r) => (
            <div key={r._id} className="route-card">
              <div className="card-content">
                <h2 className="route-name">{r.name}</h2>

                <div className="route-info">
                  <div className="route-path">
                    <span>{r.origin}</span>
                    <span className="route-arrow">→</span>
                    <span>{r.destination}</span>
                  </div>

                  <div className="info-row">
                    <span className="info-label">Distance:</span>
                    <span>{r.distanceKm} km</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}