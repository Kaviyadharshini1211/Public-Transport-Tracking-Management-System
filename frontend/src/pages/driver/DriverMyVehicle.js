import React from "react";
import "../../styles/DriverMyVehicle.css";

export default function DriverMyVehicle({ vehicle, loading, onRefresh }) {
  if (loading) {
    return (
      <div className="drv-vehicle-loading">
        <div className="drv-vehicle-spinner"></div>
        <span>Loading vehicle info…</span>
      </div>
    );
  }

  /* ===== EMPTY STATE ===== */
  if (!vehicle) {
    return (
      <div className="drv-vehicle-empty">
        <div className="drv-vehicle-empty__card">
          <div className="drv-vehicle-empty__illustration">
            <div className="drv-vehicle-empty__bus-icon">
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/>
                <path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/>
                <circle cx="7" cy="18" r="2"/><path d="M9 18h5"/><circle cx="16" cy="18" r="2"/>
              </svg>
            </div>
            <div className="drv-vehicle-empty__rings">
              <div className="drv-vehicle-empty__ring drv-vehicle-empty__ring--1"></div>
              <div className="drv-vehicle-empty__ring drv-vehicle-empty__ring--2"></div>
              <div className="drv-vehicle-empty__ring drv-vehicle-empty__ring--3"></div>
            </div>
          </div>
          <h2 className="drv-vehicle-empty__title">No Vehicle Assigned Yet</h2>
          <p className="drv-vehicle-empty__text">
            You haven't been assigned a vehicle by the administrator. Once assigned, your vehicle details will appear here.
          </p>
          <div className="drv-vehicle-empty__steps">
            <div className="drv-vehicle-empty__step">
              <span className="drv-vehicle-empty__step-num">1</span>
              <span>Contact your fleet administrator</span>
            </div>
            <div className="drv-vehicle-empty__step">
              <span className="drv-vehicle-empty__step-num">2</span>
              <span>Request a vehicle assignment</span>
            </div>
            <div className="drv-vehicle-empty__step">
              <span className="drv-vehicle-empty__step-num">3</span>
              <span>Start your trips once assigned</span>
            </div>
          </div>
          {onRefresh && (
            <button className="drv-vehicle-empty__refresh" onClick={onRefresh}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
              </svg>
              Refresh
            </button>
          )}
        </div>
      </div>
    );
  }

  /* ===== VEHICLE ASSIGNED ===== */
  return (
    <div className="drv-vehicle">
      <div className="drv-vehicle__card">
        {/* Header */}
        <div className="drv-vehicle__card-top">
          <div className="drv-vehicle__icon-wrap">
            <span className="drv-vehicle__icon">🚌</span>
          </div>
          <div className="drv-vehicle__header-info">
            <h2 className="drv-vehicle__reg">{vehicle.regNumber}</h2>
            <span className="drv-vehicle__model">{vehicle.model || "Bus"}</span>
          </div>
          <span className={`drv-vehicle__badge drv-vehicle__badge--${(vehicle.status || "active").toLowerCase()}`}>
            {vehicle.status || "Active"}
          </span>
        </div>

        {/* Details Grid */}
        <div className="drv-vehicle__details">
          <div className="drv-vehicle__detail-item">
            <div className="drv-vehicle__detail-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"/><circle cx="12" cy="10" r="3"/></svg>
            </div>
            <div className="drv-vehicle__detail-content">
              <span className="drv-vehicle__detail-label">Route</span>
              <span className="drv-vehicle__detail-value">
                {vehicle.route?.origin || "—"} → {vehicle.route?.destination || "—"}
              </span>
            </div>
          </div>

          <div className="drv-vehicle__detail-item">
            <div className="drv-vehicle__detail-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
            <div className="drv-vehicle__detail-content">
              <span className="drv-vehicle__detail-label">Capacity</span>
              <span className="drv-vehicle__detail-value">{vehicle.capacity || "—"} seats</span>
            </div>
          </div>

          <div className="drv-vehicle__detail-item">
            <div className="drv-vehicle__detail-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            </div>
            <div className="drv-vehicle__detail-content">
              <span className="drv-vehicle__detail-label">Assigned By</span>
              <span className="drv-vehicle__detail-value">Admin</span>
            </div>
          </div>

          {vehicle.route?.stops && vehicle.route.stops.length > 0 && (
            <div className="drv-vehicle__detail-item drv-vehicle__detail-item--full">
              <div className="drv-vehicle__detail-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              </div>
              <div className="drv-vehicle__detail-content">
                <span className="drv-vehicle__detail-label">Stops</span>
                <div className="drv-vehicle__stops">
                  {vehicle.route.stops.map((stop, i) => (
                    <span key={i} className="drv-vehicle__stop-chip">
                      {stop.name || stop}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Route Visual */}
        <div className="drv-vehicle__route-visual">
          <div className="drv-vehicle__route-line">
            <div className="drv-vehicle__route-dot drv-vehicle__route-dot--start"></div>
            <div className="drv-vehicle__route-bar"></div>
            <div className="drv-vehicle__route-dot drv-vehicle__route-dot--end"></div>
          </div>
          <div className="drv-vehicle__route-labels">
            <span>{vehicle.route?.origin || "Origin"}</span>
            <span>{vehicle.route?.destination || "Destination"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}