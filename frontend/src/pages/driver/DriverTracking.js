import React, { useEffect, useState } from "react";
import API from "../../api/api";

export default function DriverTracking() {
  const [vehicle, setVehicle] = useState(null);
  const [tracking, setTracking] = useState(false);
  const user = JSON.parse(localStorage.getItem("user"));

  const load = async () => {
    const res = await API.get("/vehicles");
    const my = res.data.find(v => v.driverName === user.email);
    setVehicle(my || null);
  };

  useEffect(() => {
    load();
  }, []);

  if (!vehicle)
    return <h3 style={{ padding: 20 }}>No vehicle assigned.</h3>;

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
    <div style={{ padding: 20 }}>
      <h2>Live Tracking</h2>

      {!tracking ? (
        <button
          onClick={startTracking}
          style={{ padding: "12px 20px", background: "green", color: "white" }}
        >
          ▶ Start Sharing Location
        </button>
      ) : (
        <button
          onClick={stopTracking}
          style={{ padding: "12px 20px", background: "red", color: "white" }}
        >
          ■ Stop Tracking
        </button>
      )}
    </div>
  );
}
