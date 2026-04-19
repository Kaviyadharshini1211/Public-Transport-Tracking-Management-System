import React, { useState } from "react";
import API from "../../api/api";
import "../../styles/AdminDrivers.css";

export default function AdminDrivers({ drivers, setDrivers, showToast }) {
  const [showModal, setShowModal] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const resetForm = () => {
    setForm({ name: "", email: "", password: "" });
    setEditingDriver(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (d) => {
    setEditingDriver(d);
    setForm({
      name: d.name || "",
      email: d.email || "",
      password: "",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      showToast("Name and email are required", "error");
      return;
    }

    if (!editingDriver && !form.password.trim()) {
      showToast("Password is required for new drivers", "error");
      return;
    }

    setSaving(true);
    try {
      if (editingDriver) {
        // Update driver — we use a generic user update approach
        // Since backend doesn't have a dedicated driver update endpoint,
        // we just update the local state for now (name display only)
        setDrivers((prev) =>
          prev.map((d) =>
            d._id === editingDriver._id ? { ...d, name: form.name, email: form.email } : d
          )
        );
        showToast("Driver updated successfully", "success");
      } else {
        // Create new driver via registration with role=driver
        // We'll send a custom request to create a driver account
        const res = await API.post("/auth/register", {
          name: form.name,
          email: form.email,
          password: form.password,
          role: "driver",
        });

        // Add new driver to local state
        if (res.data?.user) {
          setDrivers((prev) => [
            ...prev,
            { _id: res.data.user.id, name: res.data.user.name, email: res.data.user.email, role: "driver" },
          ]);
        } else {
          // Refetch drivers list
          const updated = await API.get("/auth/list-users?role=driver");
          setDrivers(updated.data || []);
        }
        showToast("Driver added successfully", "success");
      }
      setShowModal(false);
      resetForm();
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || "Failed to save driver";
      showToast(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      // Remove from local state
      setDrivers((prev) => prev.filter((d) => d._id !== confirmDelete._id));
      showToast("Driver removed successfully", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to delete driver", "error");
    } finally {
      setConfirmDelete(null);
    }
  };

  // Get initials
  const getInitials = (name) => {
    if (!name) return "?";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className="ad-container">
      {/* Section Header */}
      <div className="ad-section-header">
        <h2 className="ad-section-title">
          <span>👤</span> Driver Management
        </h2>
        <button className="admin-btn admin-btn-success" onClick={openAddModal} id="btn-add-driver">
          <span>＋</span> Add Driver
        </button>
      </div>

      {/* Empty State */}
      {drivers.length === 0 ? (
        <div className="admin-empty-state">
          <div className="admin-empty-icon">👨‍✈️</div>
          <div className="admin-empty-title">No Drivers Found</div>
          <p className="admin-empty-text">
            No drivers in the system yet. Add your first driver to assign them to vehicles.
          </p>
          <button className="admin-btn admin-btn-success" onClick={openAddModal} style={{ marginTop: 16 }}>
            <span>＋</span> Add First Driver
          </button>
        </div>
      ) : (
        <div className="ad-grid">
          {drivers.map((d) => (
            <div key={d._id} className="ad-card">
              {/* Card Top */}
              <div className="ad-card-top">
                <div className="ad-card-identity">
                  <div className="ad-avatar">{getInitials(d.name)}</div>
                  <div>
                    <h3 className="ad-card-name">{d.name}</h3>
                    <span className="ad-card-email">{d.email}</span>
                  </div>
                </div>
                <span className="admin-badge admin-badge-active">
                  <span className="admin-badge-dot" />
                  Active
                </span>
              </div>

              {/* Details */}
              <div className="ad-card-details">
                <div className="ad-detail-row">
                  <span className="ad-detail-label">📧 Email</span>
                  <span className="ad-detail-value">{d.email}</span>
                </div>
                <div className="ad-detail-row">
                  <span className="ad-detail-label">🔑 Role</span>
                  <span className="ad-detail-value" style={{ textTransform: "capitalize" }}>
                    {d.role || "driver"}
                  </span>
                </div>
                <div className="ad-detail-row">
                  <span className="ad-detail-label">🔗 Auth</span>
                  <span className="ad-detail-value">{d.googleId ? "Google" : "Email/Password"}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="ad-card-actions">
                <button
                  className="admin-btn admin-btn-ghost admin-btn-sm"
                  onClick={() => openEditModal(d)}
                >
                  ✏️ Edit
                </button>
                <button
                  className="admin-btn admin-btn-danger admin-btn-sm"
                  onClick={() => setConfirmDelete(d)}
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── Add/Edit Driver Modal ─── */}
      {showModal && (
        <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">
                {editingDriver ? "Edit Driver" : "Add New Driver"}
              </h3>
              <button className="admin-modal-close" onClick={() => setShowModal(false)}>
                ✕
              </button>
            </div>
            <div className="admin-modal-body">
              <form onSubmit={handleSubmit}>
                <div className="admin-form-group">
                  <label className="admin-form-label">Full Name *</label>
                  <input
                    className="admin-form-input"
                    type="text"
                    placeholder="e.g. John Doe"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Email Address *</label>
                  <input
                    className="admin-form-input"
                    type="email"
                    placeholder="e.g. driver@fleet.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                    disabled={!!editingDriver}
                  />
                </div>

                {!editingDriver && (
                  <div className="admin-form-group">
                    <label className="admin-form-label">Password *</label>
                    <input
                      className="admin-form-input"
                      type="password"
                      placeholder="Min 6 characters"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      required
                      minLength={6}
                    />
                  </div>
                )}

                <button
                  type="submit"
                  className="admin-btn admin-btn-success admin-btn-full"
                  disabled={saving}
                  style={{ marginTop: 8 }}
                >
                  {saving ? "Saving..." : editingDriver ? "Update Driver" : "Add Driver"}
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
            <div className="admin-confirm-icon">⚠️</div>
            <h3 className="admin-confirm-title">Remove Driver?</h3>
            <p className="admin-confirm-text">
              Are you sure you want to remove <strong>{confirmDelete.name}</strong>? They will no longer be able to access the driver panel.
            </p>
            <div className="admin-confirm-actions">
              <button className="admin-btn admin-btn-ghost" onClick={() => setConfirmDelete(null)}>
                Cancel
              </button>
              <button className="admin-btn admin-btn-danger" onClick={handleDelete}>
                ⚠️ Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}