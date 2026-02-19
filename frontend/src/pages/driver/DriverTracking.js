import React, { useEffect, useState } from "react";
import API from "../../api/api";
import "../../styles/DriverTracking.css";

export default function DriverTracking() {
  const [vehicle, setVehicle] = useState(null);
  const [tracking, setTracking] = useState(false);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem("user"));

  const load = async () => {
    try {
      setLoading(true);
      const res = await API.get("/vehicles");
      const my = res.data.find(v => v.driverName === user.email);
      setVehicle(my || null);
    } catch (error) {
      console.error("Error loading vehicle:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">🚗</div>
        <p className="empty-state-text">No vehicle assigned.</p>
      </div>
    );
  }

  const startTracking = () => {
    setTracking(true);

    const id = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;

        await API.post(`/vehicles/${vehicle._id}/tracking`, {
          lat: latitude,
          lng: longitude,
        });
      },
      (err) => console.error(err),
      { enableHighAccuracy: true }
    );

    localStorage.setItem("driver_watch_id", id);
  };

  const stopTracking = async () => {
    setTracking(false);
    const id = localStorage.getItem("driver_watch_id");
    if (id) navigator.geolocation.clearWatch(id);

    await API.patch(`/vehicles/${vehicle._id}/tracking/stop`);
  };

  return (
    <div className="driver-tracking-container">
      <h2 className="tracking-header">Live Tracking</h2>

      <div className="tracking-controls">
        {!tracking ? (
          <button onClick={startTracking} className="tracking-button start-button">
            ▶ Start Sharing Location
          </button>
        ) : (
          <button onClick={stopTracking} className="tracking-button stop-button">
            ■ Stop Tracking
          </button>
        )}
      </div>
    </div>
  );
}