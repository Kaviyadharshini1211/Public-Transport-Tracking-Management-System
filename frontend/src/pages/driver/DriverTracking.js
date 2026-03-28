import React, { useEffect, useState, useRef, useCallback } from "react";
import API from "../../api/api";
import "../../styles/DriverTracking.css";

export default function DriverTracking({ vehicle, loading }) {
  const [tracking, setTracking] = useState(false);
  const [locationState, setLocationState] = useState("checking"); // checking | granted | denied | unavailable
  const [coords, setCoords] = useState(null);
  const [error, setError] = useState(null);
  const watchIdRef = useRef(null);

  // Check geolocation permission on mount
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationState("unavailable");
      return;
    }

    // Try navigator.permissions API (Chrome/Edge)
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions
        .query({ name: "geolocation" })
        .then((result) => {
          if (result.state === "granted") setLocationState("granted");
          else if (result.state === "denied") setLocationState("denied");
          else setLocationState("prompt");

          result.onchange = () => {
            if (result.state === "granted") setLocationState("granted");
            else if (result.state === "denied") setLocationState("denied");
            else setLocationState("prompt");
          };
        })
        .catch(() => setLocationState("prompt"));
    } else {
      // Fallback: try to get position
      navigator.geolocation.getCurrentPosition(
        () => setLocationState("granted"),
        (err) => {
          if (err.code === 1) setLocationState("denied");
          else setLocationState("prompt");
        },
        { timeout: 5000 }
      );
    }
  }, []);

  const startTracking = useCallback(async () => {
    if (!vehicle) return;
    setError(null);

    try {
      // Request current position first
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setLocationState("granted");
        },
        (err) => {
          if (err.code === 1) {
            setLocationState("denied");
            setError("Location permission denied. Please enable GPS.");
            return;
          }
          setError("Could not get location. Please try again.");
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );

      // Start watching
      const id = navigator.geolocation.watchPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          setCoords({ lat: latitude, lng: longitude });
          setLocationState("granted");

          try {
            await API.post(`/vehicles/${vehicle._id}/tracking`, {
              lat: latitude,
              lng: longitude,
            });
          } catch (apiErr) {
            console.error("Tracking API error:", apiErr);
          }
        },
        (err) => {
          console.error("Geolocation watch error:", err);
          if (err.code === 1) {
            setLocationState("denied");
            setError("Location permission was denied.");
            setTracking(false);
          } else {
            setError("Location temporarily unavailable.");
          }
        },
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
      );

      watchIdRef.current = id;
      setTracking(true);
    } catch (err) {
      setError("Failed to start tracking.");
    }
  }, [vehicle]);

  const stopTracking = useCallback(async () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    setTracking(false);

    if (vehicle) {
      try {
        await API.patch(`/vehicles/${vehicle._id}/tracking/stop`);
      } catch (err) {
        console.error("Stop tracking API error:", err);
      }
    }
  }, [vehicle]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const handleEnableLocation = () => {
    setLocationState("checking");
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationState("granted");
      },
      (err) => {
        if (err.code === 1) {
          setLocationState("denied");
          setError("Permission denied. Please enable location in browser settings.");
        } else {
          setLocationState("prompt");
          setError("Could not access location. Please try again.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  /* ===== LOADING STATE ===== */
  if (loading) {
    return (
      <div className="drv-tracking-loading">
        <div className="drv-tracking-spinner"></div>
        <span>Loading tracking…</span>
      </div>
    );
  }

  /* ===== NO VEHICLE STATE ===== */
  if (!vehicle) {
    return (
      <div className="drv-tracking-empty">
        <div className="drv-tracking-empty__icon">📡</div>
        <h3>No Vehicle Assigned</h3>
        <p>You need an assigned vehicle to start live tracking.</p>
      </div>
    );
  }

  /* ===== LOCATION DENIED / UNAVAILABLE STATE ===== */
  if (locationState === "denied" || locationState === "unavailable") {
    return (
      <div className="drv-tracking">
        <div className="drv-tracking__warning-card">
          <div className="drv-tracking__warning-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <h3 className="drv-tracking__warning-title">
            {locationState === "denied" ? "Location Permission Denied" : "Location Unavailable"}
          </h3>
          <p className="drv-tracking__warning-text">
            {locationState === "denied"
              ? "Location is OFF. Please enable GPS to start tracking. Go to your browser settings and allow location access."
              : "Your device does not support geolocation. Please try a different browser."
            }
          </p>
          {error && <p className="drv-tracking__error-msg">{error}</p>}
          {locationState === "denied" && (
            <button className="drv-tracking__enable-btn" onClick={handleEnableLocation}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              Enable Location
            </button>
          )}
        </div>
      </div>
    );
  }

  /* ===== MAIN TRACKING UI ===== */
  return (
    <div className="drv-tracking">
      {/* Map Placeholder */}
      <div className="drv-tracking__map-container">
        <div className="drv-tracking__map">
          {/* Simulated map background */}
          <div className="drv-tracking__map-bg">
            <div className="drv-tracking__map-grid"></div>
          </div>

          {/* Location pin */}
          {coords && (
            <div className="drv-tracking__map-pin">
              <div className="drv-tracking__map-pin-pulse"></div>
              <div className="drv-tracking__map-pin-dot">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"/>
                </svg>
              </div>
            </div>
          )}

          {/* Checking state overlay */}
          {locationState === "checking" && (
            <div className="drv-tracking__map-overlay">
              <div className="drv-tracking-spinner"></div>
              <span>Checking location…</span>
            </div>
          )}
        </div>

        {/* Coordinates display */}
        {coords && (
          <div className="drv-tracking__coords">
            <span className="drv-tracking__coord">
              <strong>Lat:</strong> {coords.lat.toFixed(6)}
            </span>
            <span className="drv-tracking__coord">
              <strong>Lng:</strong> {coords.lng.toFixed(6)}
            </span>
          </div>
        )}
      </div>

      {/* Tracking Controls */}
      <div className="drv-tracking__controls">
        {error && (
          <div className="drv-tracking__error-banner">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {error}
          </div>
        )}

        <div className="drv-tracking__status-row">
          <span className={`drv-tracking__status ${tracking ? "drv-tracking__status--active" : ""}`}>
            <span className={`drv-tracking__status-dot ${tracking ? "drv-tracking__status-dot--active" : ""}`}></span>
            {tracking ? "Sharing Location" : "Location Sharing Off"}
          </span>
          <span className="drv-tracking__vehicle-tag">
            🚌 {vehicle.regNumber}
          </span>
        </div>

        {!tracking ? (
          <button
            className="drv-tracking__btn drv-tracking__btn--start"
            onClick={startTracking}
            disabled={locationState === "checking"}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
            Start Sharing Location
          </button>
        ) : (
          <button className="drv-tracking__btn drv-tracking__btn--stop" onClick={stopTracking}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="6" width="12" height="12" rx="2"/>
            </svg>
            Stop Tracking
          </button>
        )}
      </div>
    </div>
  );
}