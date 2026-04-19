import React, { useState, useEffect } from "react";
import API from "../../api/api";
import "../../styles/AdminLayout.css";

export default function AdminSOSHistory({ search, latestSosEvent, showToast }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchSOSHistory();
  }, []);

  // Real-time synchronization trigger passed down from AdminLayout web sockets
  useEffect(() => {
    if (latestSosEvent) {
      // Re-fetch optimally to ensure resolution statuses don't collide
      fetchSOSHistory();
    }
  }, [latestSosEvent]);

  const fetchSOSHistory = async () => {
    try {
      const res = await API.get("/sos");
      setAlerts(res.data);
    } catch (err) {
      console.error(err);
      if (showToast) showToast("Failed to load SOS history", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (id) => {
    try {
      await API.patch(`/sos/${id}`);
      // Optimistic visual update
      setAlerts(prev => prev.map(a => a._id === id ? { ...a, status: "resolved" } : a));
      if (showToast) showToast("SOS marked as resolved ✅", "success");
    } catch (err) {
      if (showToast) showToast("Failed to resolve SOS issue", "error");
    }
  };

  const filteredAlerts = alerts.filter(a => {
    // 1. Filter tabs
    if (filter === "active" && a.status !== "active") return false;
    if (filter === "resolved" && a.status !== "resolved") return false;
    
    // 2. Global search text
    if (search) {
      const q = search.toLowerCase();
      if (!a.driverName?.toLowerCase().includes(q) && !a.message?.toLowerCase().includes(q)) {
        return false;
      }
    }
    return true;
  });

  if (loading) {
    return <div className="admin-skeleton skeleton-card" style={{ height: 400, marginTop: '20px' }} />;
  }

  return (
    <div className="admin-sos-history" style={{ animation: 'fadeIn 0.3s ease-out' }}>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button 
          onClick={() => setFilter("all")} 
          className="admin-btn"
          style={{ background: filter === "all" ? 'var(--admin-primary)' : 'var(--admin-surface-2)', color: 'white', transition: 'all 0.2s' }}>
          All Alerts
        </button>
        <button 
          onClick={() => setFilter("active")} 
          className="admin-btn"
          style={{ background: filter === "active" ? '#ef4444' : 'var(--admin-surface-2)', color: 'white', transition: 'all 0.2s' }}>
          Active
        </button>
        <button 
          onClick={() => setFilter("resolved")} 
          className="admin-btn"
          style={{ background: filter === "resolved" ? '#10b981' : 'var(--admin-surface-2)', color: 'white', transition: 'all 0.2s' }}>
          Resolved
        </button>
      </div>

      <div style={{ background: 'var(--admin-surface)', borderRadius: '12px', border: '1px solid var(--admin-border)', overflow: 'hidden', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', color: 'var(--admin-text)' }}>
          <thead>
            <tr style={{ background: 'var(--admin-surface-2)', borderBottom: '2px solid var(--admin-border)', textAlign: 'left' }}>
              <th style={{ padding: '16px' }}>Time</th>
              <th style={{ padding: '16px' }}>Driver</th>
              <th style={{ padding: '16px' }}>Location</th>
              <th style={{ padding: '16px' }}>Emergency Message</th>
              <th style={{ padding: '16px' }}>Status</th>
              <th style={{ padding: '16px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAlerts.length === 0 && (
              <tr>
                <td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: 'var(--admin-text-muted)' }}>
                  No SOS alerts found matching your criteria.
                </td>
              </tr>
            )}
            {filteredAlerts.map(alert => (
              <tr key={alert._id} style={{ borderBottom: '1px solid var(--admin-border)', background: alert.status === 'active' ? 'rgba(239, 68, 68, 0.05)' : 'transparent' }}>
                <td style={{ padding: '16px', fontSize: '13px' }}>
                  {new Date(alert.createdAt).toLocaleString()}
                </td>
                <td style={{ padding: '16px', fontWeight: 'bold' }}>{alert.driverName}</td>
                <td style={{ padding: '16px' }}>
                  <a 
                    href={`https://www.google.com/maps?q=${alert.location?.lat},${alert.location?.lng}`}
                    target="_blank" rel="noopener noreferrer"
                    style={{ color: '#3b82f6', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', fontSize: '13px' }}
                  >
                    <span style={{ fontSize: '16px' }}>📍</span> Maps
                  </a>
                </td>
                <td style={{ padding: '16px', fontSize: '13px', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {alert.message}
                </td>
                <td style={{ padding: '16px' }}>
                  <span style={{ 
                    padding: '6px 12px', 
                    borderRadius: '20px', 
                    fontSize: '11px', 
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    background: alert.status === "active" ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                    color: alert.status === "active" ? '#fca5a5' : '#6ee7b7'
                  }}>
                    {alert.status}
                  </span>
                </td>
                <td style={{ padding: '16px' }}>
                  {alert.status === "active" ? (
                    <button 
                      onClick={() => handleResolve(alert._id)}
                      className="admin-btn"
                      style={{ background: '#10b981', color: 'white', padding: '6px 14px', fontSize: '12px', border: 'none', cursor: 'pointer', borderRadius: '6px', fontWeight: 'bold' }}
                    >
                      Resolve Issue
                    </button>
                  ) : (
                    <span style={{ color: 'var(--admin-text-muted)', fontSize: '13px', fontStyle: 'italic' }}>Resolved</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
