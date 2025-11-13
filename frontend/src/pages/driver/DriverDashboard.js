import React, { useEffect, useState } from "react";
import API from "../../api/api";
import DriverNoAssignment from "./DriverNoAssignment";

export default function DriverDashboard() {
  const [vehicle, setVehicle] = useState(null);
  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    const load = async () => {
      const res = await API.get("/vehicles");
      const my = res.data.find(v => v.driverName === user.email);
      setVehicle(my || null);
    };
    load();
  }, []);

  if (!vehicle) return <DriverNoAssignment />;

  return (
    <div style={{ padding: 20 }}>
      <h1>Driver Dashboard</h1>
      <p>Welcome, {user.name}</p>

      <h3>Your Assigned Vehicle</h3>
      <p><strong>Vehicle No:</strong> {vehicle.regNumber}</p>
      <p><strong>Route:</strong> {vehicle.route?.start} → {vehicle.route?.end}</p>
    </div>
  );
}
