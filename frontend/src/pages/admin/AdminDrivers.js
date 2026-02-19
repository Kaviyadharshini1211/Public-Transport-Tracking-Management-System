import React, { useEffect, useState } from "react";
import API from "../../api/api";
import "../../styles/AdminDrivers.css";

export default function AdminDrivers() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        const response = await API.get("/auth/list-users?role=driver");
        setDrivers(response.data);
      } catch (error) {
        console.error("Error fetching drivers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDrivers();
  }, []);

  if (loading) {
    return (
      <div className="drivers-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="drivers-container">
      <h1 className="drivers-header">Drivers</h1>

      {drivers.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">👨‍✈️</div>
          <p className="empty-state-text">No drivers available</p>
        </div>
      ) : (
        <div className="drivers-grid">
          {drivers.map((d) => (
            <div key={d._id} className="driver-card">
              <div className="card-content">
                <h2 className="driver-name">{d.name}</h2>
                <p className="driver-email">{d.email}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}