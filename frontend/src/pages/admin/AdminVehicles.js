import React, { useState } from "react";
import API from "../../api/api";
import "../../styles/AdminVehicles.css";

export default function AdminVehicles({ vehicles, setVehicles, drivers, routes, showToast }) {
  const [showModal, setShowModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [form, setForm] = useState({
    regNumber: "",
    model: "",
    capacity: "",
    status: "active",
    route: "",
    driverName: "",
  });

  const resetForm = () => {
    setForm({ regNumber: "", model: "", capacity: "", status: "active", route: "", driverName: "" });
    setEditingVehicle(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (v) => {
    setEditingVehicle(v);
    setForm({
      regNumber: v.regNumber || "",
      model: v.model || "",
      capacity: v.capacity || "",
      status: v.status || "active",
      route: v.route?._id || v.route || "",
      driverName: v.driverName || "",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.regNumber.trim() || !form.model.trim()) {
      showToast("Registration number and model are required", "error");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        capacity: Number(form.capacity) || 0,
        route: form.route || null,
        driverName: form.driverName || null,
      };

      if (editingVehicle) {
        const res = await API.put(`/vehicles/${editingVehicle._id}`, payload);
        setVehicles((prev) =>
          prev.map((v) => (v._id === editingVehicle._id ? res.data : v))
        );
        showToast("Vehicle updated successfully", "success");
      } else {
        const res = await API.post("/vehicles", payload);
        setVehicles((prev) => [...prev, res.data]);
        showToast("Vehicle added successfully", "success");
      }
      setShowModal(false);
      resetForm();
    } catch (err) {
      console.error(err);
      showToast("Failed to save vehicle", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await API.delete(`/vehicles/${confirmDelete._id}`);
      setVehicles((prev) => prev.filter((v) => v._id !== confirmDelete._id));
      showToast("Vehicle deleted successfully", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to delete vehicle", "error");
    } finally {
      setConfirmDelete(null);
    }
  };

  return (
    <div className="av-container">
      {/* Section Header */}
      <div className="av-section-header">
        <h2 className="av-section-title">
          <span>🚐</span> Fleet Management
        </h2>
        <div className="av-header-actions">
          <button className="admin-btn admin-btn-primary" onClick={openAddModal} id="btn-add-vehicle">
            <span>＋</span> Add Vehicle
          </button>
        </div>
      </div>

      {/* Empty State */}
      {vehicles.length === 0 ? (
        <div className="admin-empty-state">
          <div className="admin-empty-icon">🚗</div>
          <div className="admin-empty-title">No Vehicles Found</div>
          <p className="admin-empty-text">
            Your fleet is empty. Add your first vehicle to get started with fleet management.
          </p>
          <button className="admin-btn admin-btn-primary" onClick={openAddModal} style={{ marginTop: 16 }}>
            <span>＋</span> Add First Vehicle
          </button>
        </div>
      ) : (
        <div className="av-grid">
          {vehicles.map((v) => {
            const driverDisplay = v.driverName || "Unassigned";
            const routeName = v.route?.name || "Not Assigned";
            const isActive = (v.status || "active") === "active";

            return (
              <div key={v._id} className="av-card">
                {/* Card Top */}
                <div className="av-card-top">
                  <div className="av-card-identity">
                    <div className="av-card-icon">🚌</div>
                    <div>
                      <h3 className="av-card-title">{v.regNumber}</h3>
                      <span className="av-card-model">{v.model}</span>
                    </div>
                  </div>
                  <span className={`admin-badge ${isActive ? "admin-badge-active" : "admin-badge-inactive"}`}>
                    <span className="admin-badge-dot" />
                    {isActive ? "Active" : "Inactive"}
                  </span>
                </div>

                {/* Details */}
                <div className="av-card-details">
                  <div className="av-detail-item">
                    <span className="av-detail-label">Capacity</span>
                    <span className="av-detail-value">👥 {v.capacity || "—"} seats</span>
                  </div>
                  <div className="av-detail-item">
                    <span className="av-detail-label">Driver</span>
                    <span className={`av-detail-value ${driverDisplay === "Unassigned" ? "unassigned" : ""}`}>
                      {driverDisplay === "Unassigned" ? "⚠️" : "👤"} {driverDisplay}
                    </span>
                  </div>
                  <div className="av-detail-item">
                    <span className="av-detail-label">Route</span>
                    <span className={`av-detail-value ${routeName === "Not Assigned" ? "unassigned" : ""}`}>
                      📍 {routeName}
                    </span>
                  </div>
                  <div className="av-detail-item">
                    <span className="av-detail-label">Tracking</span>
                    <span className="av-detail-value">
                      {v.isTracking ? "🟢 Live" : "⚫ Off"}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="av-card-actions">
                  <button
                    className="admin-btn admin-btn-ghost admin-btn-sm"
                    onClick={() => openEditModal(v)}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    className="admin-btn admin-btn-danger admin-btn-sm"
                    onClick={() => setConfirmDelete(v)}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Add/Edit Modal ─── */}
      {showModal && (
        <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">
                {editingVehicle ? "Edit Vehicle" : "Add New Vehicle"}
              </h3>
              <button className="admin-modal-close" onClick={() => setShowModal(false)}>
                ✕
              </button>
            </div>
            <div className="admin-modal-body">
              <form onSubmit={handleSubmit}>
                <div className="admin-form-row">
                  <div className="admin-form-group">
                    <label className="admin-form-label">Reg. Number *</label>
                    <input
                      className="admin-form-input"
                      type="text"
                      placeholder="e.g. KA-01-AB-1234"
                      value={form.regNumber}
                      onChange={(e) => setForm({ ...form, regNumber: e.target.value })}
                      required
                    />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Model *</label>
                    <input
                      className="admin-form-input"
                      type="text"
                      placeholder="e.g. Tata Starbus"
                      value={form.model}
                      onChange={(e) => setForm({ ...form, model: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="admin-form-row">
                  <div className="admin-form-group">
                    <label className="admin-form-label">Capacity</label>
                    <input
                      className="admin-form-input"
                      type="number"
                      placeholder="e.g. 40"
                      value={form.capacity}
                      onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                    />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Status</label>
                    <div className="av-form-status-row">
                      {["active", "inactive"].map((s) => (
                        <div
                          key={s}
                          className={`av-status-option ${form.status === s ? "selected" : ""}`}
                          onClick={() => setForm({ ...form, status: s })}
                        >
                          {s === "active" ? "🟢" : "⚫"} {s.charAt(0).toUpperCase() + s.slice(1)}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Assign Route</label>
                  <select
                    className="admin-form-select"
                    value={form.route}
                    onChange={(e) => setForm({ ...form, route: e.target.value })}
                  >
                    <option value="">No Route Assigned</option>
                    {routes.map((r) => (
                      <option key={r._id} value={r._id}>
                        {r.name} ({r.origin} → {r.destination})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Assign Driver</label>
                  <select
                    className="admin-form-select"
                    value={form.driverName}
                    onChange={(e) => setForm({ ...form, driverName: e.target.value })}
                  >
                    <option value="">No Driver Assigned</option>
                    {drivers.map((d) => (
                      <option key={d._id} value={d.email}>
                        {d.name} ({d.email})
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  className="admin-btn admin-btn-primary admin-btn-full"
                  disabled={saving}
                  style={{ marginTop: 8 }}
                >
                  {saving ? "Saving..." : editingVehicle ? "Update Vehicle" : "Add Vehicle"}
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
            <div className="admin-confirm-icon">🗑️</div>
            <h3 className="admin-confirm-title">Delete Vehicle?</h3>
            <p className="admin-confirm-text">
              Are you sure you want to delete <strong>{confirmDelete.regNumber}</strong>? This action cannot be undone.
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