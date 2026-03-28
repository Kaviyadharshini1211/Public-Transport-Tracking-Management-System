import React, { useState } from "react";
import DriverNoAssignment from "./DriverNoAssignment";
import "../../styles/DriverDashboard.css";

export default function DriverDashboard({ user, vehicle, loading, onRefresh }) {
  const [tripActive, setTripActive] = useState(false);
  const [tripCount] = useState(Math.floor(Math.random() * 5) + 2); // Mock

  if (loading) {
    return (
      <div className="drv-dash-loading">
        <div className="drv-dash-spinner"></div>
        <span>Loading dashboard…</span>
      </div>
    );
  }

  if (!vehicle) return <DriverNoAssignment />;

  const toggleTrip = () => setTripActive(!tripActive);

  return (
    <div className="drv-dash">
      {/* Stats Row */}
      <div className="drv-dash__stats">
        {/* Stat: Total Trips */}
        <div className="drv-stat-card drv-stat-card--trips">
          <div className="drv-stat-card__icon-wrap">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <div className="drv-stat-card__content">
            <span className="drv-stat-card__value">{tripCount}</span>
            <span className="drv-stat-card__label">Trips Today</span>
          </div>
        </div>

        {/* Stat: Distance */}
        <div className="drv-stat-card drv-stat-card--distance">
          <div className="drv-stat-card__icon-wrap">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
          <div className="drv-stat-card__content">
            <span className="drv-stat-card__value">{(tripCount * 18.5).toFixed(0)} <small>km</small></span>
            <span className="drv-stat-card__label">Distance Covered</span>
          </div>
        </div>

        {/* Stat: Status */}
        <div className={`drv-stat-card drv-stat-card--status ${tripActive ? "drv-stat-card--online" : "drv-stat-card--offline"}`}>
          <div className="drv-stat-card__icon-wrap">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          <div className="drv-stat-card__content">
            <span className="drv-stat-card__value">
              <span className={`drv-status-dot ${tripActive ? "drv-status-dot--online" : "drv-status-dot--offline"}`}></span>
              {tripActive ? "Online" : "Offline"}
            </span>
            <span className="drv-stat-card__label">Current Status</span>
          </div>
        </div>
      </div>

      {/* Trip Toggle */}
      <div className="drv-dash__trip-section">
        <button
          className={`drv-trip-btn ${tripActive ? "drv-trip-btn--end" : "drv-trip-btn--start"}`}
          onClick={toggleTrip}
        >
          <span className="drv-trip-btn__icon">
            {tripActive ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            )}
          </span>
          <span className="drv-trip-btn__text">
            {tripActive ? "End Trip" : "Start Trip"}
          </span>
        </button>
        <p className="drv-trip-subtitle">
          {tripActive
            ? "Your trip is currently active. Location is being shared."
            : "Tap to start your trip and begin sharing your location."
          }
        </p>
      </div>

      {/* Vehicle Quick Info */}
      <div className="drv-dash__vehicle-card">
        <div className="drv-dash__vehicle-card-header">
          <span className="drv-dash__vehicle-icon">🚌</span>
          <div>
            <h3 className="drv-dash__vehicle-reg">{vehicle.regNumber}</h3>
            <span className="drv-dash__vehicle-model">{vehicle.model || "Bus"}</span>
          </div>
          <span className={`drv-dash__vehicle-status drv-dash__vehicle-status--${(vehicle.status || "active").toLowerCase()}`}>
            {vehicle.status || "Active"}
          </span>
        </div>
        <div className="drv-dash__vehicle-route">
          <div className="drv-route-visual">
            <div className="drv-route-visual__dot drv-route-visual__dot--start"></div>
            <div className="drv-route-visual__line"></div>
            <div className="drv-route-visual__dot drv-route-visual__dot--end"></div>
          </div>
          <div className="drv-route-labels">
            <span className="drv-route-labels__from">{vehicle.route?.origin || "Start"}</span>
            <span className="drv-route-labels__to">{vehicle.route?.destination || "End"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}