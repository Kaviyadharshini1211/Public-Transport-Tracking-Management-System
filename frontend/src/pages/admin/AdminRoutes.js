import React, { useState } from "react";
import API from "../../api/api";
import "../../styles/AdminRoutes.css";

export default function AdminRoutes({ routes, setRoutes, showToast }) {
  const [showModal, setShowModal] = useState(false);
  const [editingRoute, setEditingRoute] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [form, setForm] = useState({
    name: "",
    origin: "",
    destination: "",
    distanceKm: "",
    avgSpeedKmph: "50",
  });

  const resetForm = () => {
    setForm({ name: "", origin: "", destination: "", distanceKm: "", avgSpeedKmph: "50" });
    setEditingRoute(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (r) => {
    setEditingRoute(r);
    setForm({
      name: r.name || "",
      origin: r.origin || "",
      destination: r.destination || "",
      distanceKm: r.distanceKm || "",
      avgSpeedKmph: r.avgSpeedKmph || "50",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.origin.trim() || !form.destination.trim()) {
      showToast("Name, origin and destination are required", "error");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        distanceKm: Number(form.distanceKm) || undefined,
        avgSpeedKmph: Number(form.avgSpeedKmph) || 50,
      };

      if (editingRoute) {
        const res = await API.put(`/routes/${editingRoute._id}`, payload);
        setRoutes((prev) =>
          prev.map((r) => (r._id === editingRoute._id ? res.data : r))
        );
        showToast("Route updated successfully", "success");
      } else {
        const res = await API.post("/routes", payload);
        setRoutes((prev) => [...prev, res.data]);
        showToast("Route added successfully", "success");
      }
      setShowModal(false);
      resetForm();
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || "Failed to save route";
      showToast(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await API.delete(`/routes/${confirmDelete._id}`);
      setRoutes((prev) => prev.filter((r) => r._id !== confirmDelete._id));
      showToast("Route deleted successfully", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to delete route", "error");
    } finally {
      setConfirmDelete(null);
    }
  };

  return (
    <div className="ar-container">
      {/* Section Header */}
      <div className="ar-section-header">
        <h2 className="ar-section-title">
          <span>🗺️</span> Route Management
        </h2>
        <button className="admin-btn admin-btn-primary" onClick={openAddModal} id="btn-add-route">
          <span>＋</span> Add Route
        </button>
      </div>

      {/* Empty State */}
      {routes.length === 0 ? (
        <div className="admin-empty-state">
          <div className="admin-empty-icon">🛤️</div>
          <div className="admin-empty-title">No Routes Found</div>
          <p className="admin-empty-text">
            No routes configured yet. Create your first route to connect origins and destinations.
          </p>
          <button className="admin-btn admin-btn-primary" onClick={openAddModal} style={{ marginTop: 16 }}>
            <span>＋</span> Create First Route
          </button>
        </div>
      ) : (
        <div className="ar-grid">
          {routes.map((r) => (
            <div key={r._id} className="ar-card">
              {/* Card Top */}
              <div className="ar-card-top">
                <div className="ar-card-identity">
                  <div className="ar-card-icon">🛤️</div>
                  <div>
                    <h3 className="ar-card-name">{r.name}</h3>
                    <span className="ar-card-distance">
                      📏 {r.distanceKm ? `${r.distanceKm} km` : "Distance N/A"}
                    </span>
                  </div>
                </div>
                <span className="admin-badge admin-badge-active">
                  <span className="admin-badge-dot" />
                  Active
                </span>
              </div>

              {/* Route Path */}
              <div className="ar-route-path">
                <div className="ar-route-point">
                  <span className="ar-route-label">From</span>
                  <div className="ar-route-dot origin" />
                  <span className="ar-route-place">{r.origin}</span>
                </div>
                <div className="ar-route-line">
                  <span className="ar-route-line-arrow">→</span>
                </div>
                <div className="ar-route-point">
                  <span className="ar-route-label">To</span>
                  <div className="ar-route-dot destination" />
                  <span className="ar-route-place">{r.destination}</span>
                </div>
              </div>

              {/* Stats */}
              <div className="ar-card-stats">
                <div className="ar-stat-item">
                  <span className="ar-stat-label">Avg Speed</span>
                  <span className="ar-stat-value">{r.avgSpeedKmph || 50} km/h</span>
                </div>
                <div className="ar-stat-item">
                  <span className="ar-stat-label">Stops</span>
                  <span className="ar-stat-value">{r.stops?.length || 0}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="ar-card-actions">
                <button
                  className="admin-btn admin-btn-ghost admin-btn-sm"
                  onClick={() => openEditModal(r)}
                >
                  ✏️ Edit
                </button>
                <button
                  className="admin-btn admin-btn-danger admin-btn-sm"
                  onClick={() => setConfirmDelete(r)}
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── Add/Edit Modal ─── */}
      {showModal && (
        <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">
                {editingRoute ? "Edit Route" : "Add New Route"}
              </h3>
              <button className="admin-modal-close" onClick={() => setShowModal(false)}>
                ✕
              </button>
            </div>
            <div className="admin-modal-body">
              <form onSubmit={handleSubmit}>
                <div className="admin-form-group">
                  <label className="admin-form-label">Route Name *</label>
                  <input
                    className="admin-form-input"
                    type="text"
                    placeholder="e.g. City Express Line"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>

                <div className="admin-form-row">
                  <div className="admin-form-group">
                    <label className="admin-form-label">Origin *</label>
                    <input
                      className="admin-form-input"
                      type="text"
                      placeholder="e.g. Downtown Terminal"
                      value={form.origin}
                      onChange={(e) => setForm({ ...form, origin: e.target.value })}
                      required
                    />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Destination *</label>
                    <input
                      className="admin-form-input"
                      type="text"
                      placeholder="e.g. Airport"
                      value={form.destination}
                      onChange={(e) => setForm({ ...form, destination: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="admin-form-row">
                  <div className="admin-form-group">
                    <label className="admin-form-label">Distance (km)</label>
                    <input
                      className="admin-form-input"
                      type="number"
                      placeholder="e.g. 25"
                      value={form.distanceKm}
                      onChange={(e) => setForm({ ...form, distanceKm: e.target.value })}
                    />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Avg Speed (km/h)</label>
                    <input
                      className="admin-form-input"
                      type="number"
                      placeholder="e.g. 50"
                      value={form.avgSpeedKmph}
                      onChange={(e) => setForm({ ...form, avgSpeedKmph: e.target.value })}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="admin-btn admin-btn-primary admin-btn-full"
                  disabled={saving}
                  style={{ marginTop: 8 }}
                >
                  {saving ? "Saving..." : editingRoute ? "Update Route" : "Create Route"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ─── Delete Confirmation ─── */}
      {confirmDelete && (
        <div className="admin-confirm-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="admin-confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="admin-confirm-icon">🗺️</div>
            <h3 className="admin-confirm-title">Delete Route?</h3>
            <p className="admin-confirm-text">
              Are you sure you want to delete <strong>{confirmDelete.name}</strong>? Vehicles on this route will be affected.
            </p>
            <div className="admin-confirm-actions">
              <button className="admin-btn admin-btn-ghost" onClick={() => setConfirmDelete(null)}>
                Cancel
              </button>
              <button className="admin-btn admin-btn-danger" onClick={handleDelete}>
                🗑️ Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}