import React, { useEffect, useState } from "react";
import API from "../../api/api";

export default function DriverMyVehicle() {
  const [vehicle, setVehicle] = useState(null);
  const user = JSON.parse(localStorage.getItem("user"));

  const load = async () => {
    const res = await API.get("/vehicles");
    const my = res.data.find(v => v.driverName === user.email);
    setVehicle(my || null);
  };

  useEffect(() => {
    load();
  }, []);

  if (!vehicle) return <h3 style={{ padding: 20 }}>No vehicle assigned.</h3>;

  return (
    <div style={{ padding: 20 }}>
      <h2>My Vehicle</h2>

      <p><strong>Vehicle No:</strong> {vehicle.regNumber}</p>
      <p><strong>Model:</strong> {vehicle.model}</p>
      <p><strong>Route:</strong> {vehicle.route?.start} → {vehicle.route?.end}</p>
      <p><strong>Status:</strong> {vehicle.status}</p>
    </div>
  );
}
