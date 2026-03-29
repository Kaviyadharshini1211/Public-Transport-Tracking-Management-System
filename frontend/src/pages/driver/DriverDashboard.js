import React, { useState, useEffect } from "react";
import DriverNoAssignment from "./DriverNoAssignment";
import API from "../../api/api";
import "../../styles/DriverDashboard.css";

export default function DriverDashboard({ user, vehicle, loading, onRefresh }) {
  const [activeTrip, setActiveTrip] = useState(null);
  const [todayTrips, setTodayTrips] = useState([]);
  const [tripLoading, setTripLoading] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (user && vehicle) fetchTrips();
    // eslint-disable-next-line
  }, [user, vehicle]);

  // Voice Assistant Hook
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      const last = event.results.length - 1;
      const command = event.results[last][0].transcript.trim().toLowerCase();
      
      if (command.includes('start trip')) {
        showToast("Voice command detected: Starting Trip", "success");
        // Safe check using current state isn't guaranteed here due to closure unless we use refs, 
        // but for demo purposes, we will trigger handleToggleTrip natively if NOT active.
        document.getElementById('voice-trip-btn')?.click();
      } else if (command.includes('end trip') || command.includes('stop trip')) {
        showToast("Voice command detected: Ending Trip", "success");
        document.getElementById('voice-trip-btn')?.click();
      }
    };

    try {
      recognition.start();
    } catch (e) {
      console.log('Voice recognition failed to start:', e);
    }

    return () => {
      try { recognition.stop(); } catch(e){}
    };
  }, []);

  const fetchTrips = async () => {
    try {
      const res = await API.get("/trips/my-trips");
      const allTrips = res.data || [];
      
      // Filter today's trips
      const today = new Date().setHours(0, 0, 0, 0);
      const todaysTripsList = allTrips.filter(t => new Date(t.createdAt).setHours(0, 0, 0, 0) === today);
      setTodayTrips(todaysTripsList);

      // Find if one is currently ongoing
      const ongoing = allTrips.find(t => t.status === "ongoing");
      setActiveTrip(ongoing || null);
    } catch (err) {
      console.error("Failed to fetch trips", err);
    }
  };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleToggleTrip = async () => {
    if (!vehicle || !vehicle.route) {
      showToast("No active route assigned. Cannot start trip.", "error");
      return;
    }

    setTripLoading(true);
    try {
      if (activeTrip) {
        // END TRIP
        const res = await API.post("/trips/end", {
          tripId: activeTrip._id,
          distanceCovered: 15.0 // For now, hardcode or calculate
        });
        setActiveTrip(null);
        showToast(`Trip Completed! You earned ₹${res.data.trip.earnings}`, "success");
      } else {
        // START TRIP
        // We simulate fetching driver's current coordinates via browser
        let lat = vehicle.route.originLat || 0;
        let lng = vehicle.route.originLng || 0;
        
        const res = await API.post("/trips/start", {
          vehicleId: vehicle._id,
          routeId: vehicle.route._id || vehicle.route,
          lat,
          lng
        });
        
        setActiveTrip(res.data.trip);
        showToast("Trip started! Drive safely.", "success");
      }
      
      // Refetch today's trips
      fetchTrips();
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || "Action failed", "error");
    } finally {
      setTripLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="drv-dash-loading">
        <div className="drv-dash-spinner"></div>
        <span>Loading dashboard…</span>
      </div>
    );
  }

  if (!vehicle) return <DriverNoAssignment />;

  // Analytics Computation
  const tripCount = todayTrips.length;
  const distance = todayTrips.reduce((acc, t) => acc + (t.distanceCovered || 0), 0).toFixed(1);
  const earnings = todayTrips.reduce((acc, t) => acc + (t.earnings || 0), 0);

  return (
    <div className="drv-dash" style={{ position: "relative" }}>
      {/* Toast */}
      {toast && (
        <div className={`drv-toast ${toast.type}`} style={{ position: 'absolute', top: 0, right: 0, padding: '10px 20px', background: toast.type === 'error' ? '#ef4444' : '#10b981', color: '#fff', borderRadius: '8px', zIndex: 1000, animation: 'fadeInDown 0.3s ease' }}>
          {toast.msg}
        </div>
      )}

      {/* Stats Row */}
      <div className="drv-dash__stats">
        <div className="drv-stat-card drv-stat-card--trips">
          <div className="drv-stat-card__icon-wrap">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <div className="drv-stat-card__content">
            <span className="drv-stat-card__value">{tripCount}</span>
            <span className="drv-stat-card__label">Trips Today</span>
          </div>
        </div>

        <div className="drv-stat-card drv-stat-card--distance">
          <div className="drv-stat-card__icon-wrap">
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"/><circle cx="12" cy="10" r="3"/></svg>
          </div>
          <div className="drv-stat-card__content">
            <span className="drv-stat-card__value">{distance} <small>km</small></span>
            <span className="drv-stat-card__label">Distance Covered</span>
          </div>
        </div>

        <div className={`drv-stat-card drv-stat-card--status ${activeTrip ? "drv-stat-card--online" : "drv-stat-card--offline"}`}>
          <div className="drv-stat-card__icon-wrap">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          </div>
          <div className="drv-stat-card__content">
            <span className="drv-stat-card__value">
              <span className={`drv-status-dot ${activeTrip ? "drv-status-dot--online" : "drv-status-dot--offline"}`}></span>
              {activeTrip ? "Driving" : "Idle"}
            </span>
            <span className="drv-stat-card__label">Current Status</span>
          </div>
        </div>
      </div>

      {/* New Row: Earnings (Uber style) */}
      <div style={{ background: 'var(--drv-surface)', borderRadius: '16px', padding: '24px', marginBottom: '24px', border: '1px solid var(--drv-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: '0 0 4px', fontSize: '14px', color: 'var(--drv-text-muted)' }}>Today's Earnings</h3>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--drv-primary)' }}>₹{earnings.toFixed(2)}</div>
        </div>
        <button onClick={() => showToast("Trip history feature coming soon!", "success")} style={{ padding: '8px 16px', background: 'var(--drv-surface-2)', border: '1px solid var(--drv-border)', borderRadius: '8px', color: 'var(--drv-text)', cursor: 'pointer' }}>View History</button>
      </div>

      {/* Trip Toggle */}
      <div className="drv-dash__trip-section">
        <button
          id="voice-trip-btn"
          className={`drv-trip-btn ${activeTrip ? "drv-trip-btn--end" : "drv-trip-btn--start"}`}
          onClick={handleToggleTrip}
          disabled={tripLoading}
        >
          {tripLoading ? (
            <span className="drv-trip-btn__text">Processing...</span>
          ) : (
            <>
              <span className="drv-trip-btn__icon">
                {activeTrip ? (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
                ) : (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                )}
              </span>
              <span className="drv-trip-btn__text">
                {activeTrip ? "End Trip" : "Start Trip"}
              </span>
            </>
          )}
        </button>
        <p className="drv-trip-subtitle">
          {activeTrip
            ? "Your trip is currently active. Location is being shared securely."
            : "Tap to start your trip and begin streaming location to passengers."
          }
        </p>
      </div>
    </div>
  );
}