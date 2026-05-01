import React, { useState, useMemo, useCallback } from "react";
import API from "../../api/api";
import "../../styles/AdminAssignDriver.css";

const PAGE_SIZE = 20;

export default function AdminAssignDriver({ vehicles, setVehicles, drivers, showToast }) {
  const [savingId, setSavingId] = useState(null);
  const [filterType, setFilterType] = useState("all");
  const [isAutoAssigning, setIsAutoAssigning] = useState(false);
  const [page, setPage] = useState(1);

  // Apply local filters
  const displayVehicles = useMemo(() => {
    const filtered = filterType === "all" ? vehicles : vehicles.filter(v => v.type === filterType);
    return filtered;
  }, [vehicles, filterType]);

  // Paginated slice
  const totalPages = Math.ceil(displayVehicles.length / PAGE_SIZE);
  const pagedVehicles = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return displayVehicles.slice(start, start + PAGE_SIZE);
  }, [displayVehicles, page]);

  // Reset page when filter changes
  const handleFilterChange = (e) => {
    setFilterType(e.target.value);
    setPage(1);
  };

  // Stats
  const assignedCount = vehicles.filter((v) => v.driverName).length;
  const unassignedCount = vehicles.length - assignedCount;

  // Assign or unassign driver
  const assignDriver = useCallback(async (vehicleId, email) => {
    setSavingId(vehicleId);
    try {
      await API.put(`/vehicles/${vehicleId}`, { driverName: email || null });
      setVehicles((prev) =>
        prev.map((v) => v._id === vehicleId ? { ...v, driverName: email || null } : v)
      );
      showToast(email ? "Driver assigned successfully" : "Driver unassigned", "success");
    } catch (error) {
      console.error("Error assigning driver:", error);
      showToast("Failed to assign driver. Please try again.", "error");
    } finally {
      setSavingId(null);
    }
  }, [setVehicles, showToast]);

  // Auto Assign via AI
  const handleAutoAssign = async () => {
    setIsAutoAssigning(true);
    try {
      showToast("Requesting AI for optimal driver assignment...", "info");
      const res = await API.post("/vehicles/auto-assign", {}, { timeout: 120000 });
      if (res.data && res.data.assignments) {
        setVehicles((prev) => {
          const newVehicles = [...prev];
          res.data.assignments.forEach(match => {
            const vIndex = newVehicles.findIndex(v => v._id === match.vehicle_id);
            if (vIndex !== -1) {
              newVehicles[vIndex] = { ...newVehicles[vIndex], driverName: match.driver_id };
            }
          });
          return newVehicles;
        });
        showToast(`AI successfully mapped ${res.data.assignments.length} drivers!`, "success");
      }
    } catch (error) {
      console.error("Auto assign error:", error);
      showToast(error.response?.data?.message || "Failed to auto-assign drivers.", "error");
    } finally {
      setIsAutoAssigning(false);
    }
  };

  const getDriver = useCallback((email) => drivers.find((d) => d.email === email), [drivers]);

  const getInitials = (name) => {
    if (!name) return "?";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className="aad-container">
      {/* Section Header */}
      <div className="aad-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <h2 className="aad-section-title">
          <span>🔗</span> Driver Assignments
        </h2>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div className="aad-filter-group" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '14px', color: 'var(--admin-text-muted)', fontWeight: 600 }}>Filter:</span>
            <select
              value={filterType}
              onChange={handleFilterChange}
              style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--admin-border)', background: 'var(--admin-surface)', color: 'var(--admin-text)', outline: 'none', cursor: 'pointer' }}
            >
              <option value="all">All Vehicles</option>
              <option value="long-haul">Intercity</option>
              <option value="local">Intracity</option>
            </select>
          </div>

          <button
            onClick={handleAutoAssign}
            disabled={isAutoAssigning}
            style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)', color: 'white', fontWeight: 'bold', cursor: isAutoAssigning ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px', opacity: isAutoAssigning ? 0.7 : 1 }}
          >
            {isAutoAssigning ? "🤖 Optimizing..." : "🤖 Auto-Assign (AI)"}
          </button>

          <div className="aad-summary">
            <div className="aad-summary-item">
              ✅ <span className="aad-summary-count">{assignedCount}</span> Assigned
            </div>
            <div className="aad-summary-item">
              ⚠️ <span className="aad-summary-count">{unassignedCount}</span> Unassigned
            </div>
          </div>
        </div>
      </div>

      {/* Pagination Info */}
      {displayVehicles.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 4px', marginBottom: '8px', fontSize: '13px', color: 'var(--admin-text-muted)' }}>
          <span>
            Showing <strong style={{ color: 'var(--admin-text)' }}>{(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, displayVehicles.length)}</strong> of <strong style={{ color: 'var(--admin-text)' }}>{displayVehicles.length}</strong> vehicles
          </span>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--admin-border)', background: page === 1 ? 'transparent' : 'var(--admin-surface)', color: 'var(--admin-text)', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.4 : 1 }}
            >
              ← Prev
            </button>
            {(() => {
              const pageNums = [...new Set([1, totalPages, page - 1, page, page + 1].filter(p => p >= 1 && p <= totalPages))].sort((a, b) => a - b);
              return pageNums.map((pNum, idx) => (
                <React.Fragment key={pNum}>
                  {idx > 0 && pageNums[idx - 1] < pNum - 1 && (
                    <span style={{ color: 'var(--admin-text-muted)', alignSelf: 'center' }}>…</span>
                  )}
                  <button
                    onClick={() => setPage(pNum)}
                    style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--admin-border)', background: pNum === page ? 'linear-gradient(135deg, #8b5cf6, #3b82f6)' : 'var(--admin-surface)', color: pNum === page ? 'white' : 'var(--admin-text)', cursor: 'pointer', fontWeight: pNum === page ? 'bold' : 'normal' }}
                  >
                    {pNum}
                  </button>
                </React.Fragment>
              ));
            })()}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--admin-border)', background: page === totalPages ? 'transparent' : 'var(--admin-surface)', color: 'var(--admin-text)', cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.4 : 1 }}
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {displayVehicles.length === 0 ? (
        <div className="admin-empty-state">
          <div className="admin-empty-icon">🚙</div>
          <div className="admin-empty-title">No Vehicles Found</div>
          <p className="admin-empty-text">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="aad-grid">
          {pagedVehicles.map((v) => {
            const isAssigned = !!v.driverName;
            const driver = isAssigned ? getDriver(v.driverName) : null;
            const driverName = driver?.name || v.driverName;
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
                  <span className={`admin-badge ${isAssigned ? "admin-badge-assigned" : "admin-badge-unassigned"}`}>
                    <span className="admin-badge-dot" />
                    {isAssigned ? "Assigned" : "Unassigned"}
                  </span>
                </div>

                {/* Route Context */}
                <div style={{ marginTop: '12px', padding: '10px', background: 'rgba(0,0,0,0.03)', borderRadius: '6px', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ fontWeight: 600, color: 'var(--admin-text)' }}>📍 {v.route?.name || 'Unassigned Route'}</div>
                  <div style={{ color: 'var(--admin-text-muted)' }}>
                    <strong style={{ color: v.type === 'local' ? '#3b82f6' : '#8b5cf6' }}>
                      {v.type === 'local' ? 'INTRACITY' : 'INTERCITY'}
                    </strong>
                  </div>
                </div>

                {/* Current Assignment */}
                <div className="aad-current-assignment">
                  <div className="aad-assignment-label">Current Driver</div>
                  {isAssigned ? (
                    <div className="aad-assignment-driver">
                      <div className="aad-driver-avatar">{getInitials(driverName)}</div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span className="aad-driver-name">{driverName}</span>
                        {driver?.baseLocation?.city && (
                          <span style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>
                            🏠 {driver.baseLocation.city}
                          </span>
                        )}
                      </div>
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
                        {d.name}{d.baseLocation?.city ? ` — ${d.baseLocation.city}` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {isSaving && (
                  <div className="aad-saving">
                    <div className="aad-saving-dot" />
                    Updating...
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Bottom Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '24px' }}>
          <button
            onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo(0, 0); }}
            disabled={page === 1}
            style={{ padding: '8px 20px', borderRadius: '8px', border: '1px solid var(--admin-border)', background: 'var(--admin-surface)', color: 'var(--admin-text)', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.4 : 1 }}
          >
            ← Previous
          </button>
          <span style={{ padding: '8px 16px', color: 'var(--admin-text-muted)', fontSize: '14px', alignSelf: 'center' }}>
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => { setPage(p => Math.min(totalPages, p + 1)); window.scrollTo(0, 0); }}
            disabled={page === totalPages}
            style={{ padding: '8px 20px', borderRadius: '8px', border: '1px solid var(--admin-border)', background: 'var(--admin-surface)', color: 'var(--admin-text)', cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.4 : 1 }}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}