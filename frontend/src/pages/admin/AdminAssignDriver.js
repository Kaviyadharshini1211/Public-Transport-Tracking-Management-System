import React, { useState } from "react";
import API from "../../api/api";
import "../../styles/AdminAssignDriver.css";

export default function AdminAssignDriver({ vehicles, setVehicles, drivers, showToast }) {
  const [savingId, setSavingId] = useState(null);

  // Calculate stats
  const assignedCount = vehicles.filter((v) => v.driverName).length;
  const unassignedCount = vehicles.length - assignedCount;

  // Assign or unassign driver
  const assignDriver = async (vehicleId, email) => {
    setSavingId(vehicleId);
    try {
      await API.put(`/vehicles/${vehicleId}`, { driverName: email || null });

      setVehicles((prev) =>
        prev.map((v) =>
          v._id === vehicleId ? { ...v, driverName: email || null } : v
        )
      );

      showToast(
        email ? "Driver assigned successfully" : "Driver unassigned",
        "success"
      );
    } catch (error) {
      console.error("Error assigning driver:", error);
      showToast("Failed to assign driver. Please try again.", "error");
    } finally {
      setSavingId(null);
    }
  };

  // Find driver name by email
  const getDriverName = (email) => {
    const driver = drivers.find((d) => d.email === email);
    return driver?.name || email;
  };

  // Get initials
  const getInitials = (name) => {
    if (!name) return "?";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className="aad-container">
      {/* Section Header */}
      <div className="aad-section-header">
        <h2 className="aad-section-title">
          <span>🔗</span> Driver Assignments
        </h2>
        <div className="aad-summary">
          <div className="aad-summary-item">
            ✅ <span className="aad-summary-count">{assignedCount}</span> Assigned
          </div>
          <div className="aad-summary-item">
            ⚠️ <span className="aad-summary-count">{unassignedCount}</span> Unassigned
          </div>
        </div>
      </div>

      {/* Empty State */}
      {vehicles.length === 0 ? (
        <div className="admin-empty-state">
          <div className="admin-empty-icon">🚙</div>
          <div className="admin-empty-title">No Vehicles Available</div>
          <p className="admin-empty-text">
            Add vehicles to your fleet first. Then you can assign drivers to them from this panel.
          </p>
        </div>
      ) : (
        <div className="aad-grid">
          {vehicles.map((v) => {
            const isAssigned = !!v.driverName;
            const driverName = isAssigned ? getDriverName(v.driverName) : null;
            const isSaving = savingId === v._id;

            return (
              <div key={v._id} className={`aad-card ${isAssigned ? "is-assigned" : "is-unassigned"}`}>
                {/* Card Top */}
                <div className="aad-card-top">
                  <div className="aad-card-identity">
                    <div className="aad-vehicle-icon">🚌</div>
                    <div>
                      <h3 className="aad-vehicle-reg">{v.regNumber}</h3>
                      <span className="aad-vehicle-model">{v.model}</span>
                    </div>
                  </div>
                  <span
                    className={`admin-badge ${isAssigned ? "admin-badge-assigned" : "admin-badge-unassigned"}`}
                  >
                    <span className="admin-badge-dot" />
                    {isAssigned ? "Assigned" : "Unassigned"}
                  </span>
                </div>

                {/* Current Assignment */}
                <div className="aad-current-assignment">
                  <div className="aad-assignment-label">Current Driver</div>
                  {isAssigned ? (
                    <div className="aad-assignment-driver">
                      <div className="aad-driver-avatar">
                        {getInitials(driverName)}
                      </div>
                      <span className="aad-driver-name">{driverName}</span>
                    </div>
                  ) : (
                    <span className="aad-no-driver">No driver assigned</span>
                  )}
                </div>

                {/* Driver Select */}
                <div className="aad-select-wrapper">
                  <label className="aad-select-label">
                    {isAssigned ? "Change Driver" : "Assign Driver"}
                  </label>
                  <select
                    className="aad-select"
                    value={v.driverName || ""}
                    onChange={(e) => assignDriver(v._id, e.target.value)}
                    disabled={isSaving}
                  >
                    <option value="">🚫 Unassign Driver</option>
                    {drivers.map((d) => (
                      <option key={d._id} value={d.email}>
                        {d.name} ({d.email})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Saving indicator */}
                {isSaving && (
                  <div className="aad-saving">
                    <div className="aad-saving-dot" />
                    Updating assignment...
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}