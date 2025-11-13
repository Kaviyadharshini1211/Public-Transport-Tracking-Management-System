import React, { useEffect, useState } from "react";
import API from "../../api/api";
import "../../styles/AdminAssignDriver.css";

export default function AdminAssignDriver() {
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch vehicles + drivers
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [vehiclesRes, driversRes] = await Promise.all([
          API.get("/vehicles"),
          API.get("/auth/list-users?role=driver")
        ]);
        setVehicles(vehiclesRes.data);
        setDrivers(driversRes.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Assign or unassign driver
  const assignDriver = async (vehicleId, email) => {
    try {
      await API.put(`/vehicles/${vehicleId}`, { driverName: email || null });

      // Update UI instantly
      setVehicles((prev) =>
        prev.map((v) =>
          v._id === vehicleId ? { ...v, driverName: email || null } : v
        )
      );
    } catch (error) {
      console.error("Error assigning driver:", error);
      alert("Failed to assign driver. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="assign-driver-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="assign-driver-container">
      <h1 className="page-header">🚗 Assign Drivers to Vehicles</h1>

      {vehicles.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🚙</div>
          <p className="empty-state-text">No vehicles available</p>
        </div>
      ) : (
        <div className="vehicles-grid">
          {vehicles.map((v) => {
            const driver = v.driverName ? v.driverName : "Unassigned";
            const isAssigned = driver !== "Unassigned";

            return (
              <div key={v._id} className="vehicle-card">
                <div className="card-content">
                  {/* Top Row */}
                  <div className="card-header">
                    <h2 className="vehicle-reg">{v.regNumber}</h2>
                    <span
                      className={`status-chip ${
                        isAssigned ? "status-assigned" : "status-unassigned"
                      }`}
                    >
                      {isAssigned ? "✓ Assigned" : "○ Unassigned"}
                    </span>
                  </div>

                  {/* Vehicle Info */}
                  <div className="vehicle-info">
                    <div className="info-row">
                      <span className="info-label">Driver:</span>
                      <span>{driver}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Model:</span>
                      <span>{v.model}</span>
                    </div>
                  </div>

                  {/* Assign / Unassign Dropdown */}
                  <div className="driver-select">
                    <select
                      value={v.driverName || ""}
                      onChange={(e) => assignDriver(v._id, e.target.value)}
                    >
                      <option value="">🚫 Unassign Driver</option>
                      {drivers.map((d) => (
                        <option key={d._id} value={d.email}>
                          {d.name} ({d.email})
                        </option>
                      ))}
                    </select>
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