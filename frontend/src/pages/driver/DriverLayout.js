import React, { useState } from "react";
import DriverDashboard from "./DriverDashboard";
import DriverMyVehicle from "./DriverMyVehicle";
import DriverTracking from "./DriverTracking";
import "../../styles/DriverLayout.css";

export default function DriverLayout() {
  const user = JSON.parse(localStorage.getItem("user"));

  if (!user || user.role !== "driver") {
    return (
      <div className="access-denied">
        <h2>Access denied. Driver login required.</h2>
      </div>
    );
  }

  const [tab, setTab] = useState(0);

  return (
    <div className="driver-layout-container">
      <div className="driver-tabs">
        <button
          className={`tab-button ${tab === 0 ? "active" : ""}`}
          onClick={() => setTab(0)}
        >
          Dashboard
        </button>
        <button
          className={`tab-button ${tab === 1 ? "active" : ""}`}
          onClick={() => setTab(1)}
        >
          My Vehicle
        </button>
        <button
          className={`tab-button ${tab === 2 ? "active" : ""}`}
          onClick={() => setTab(2)}
        >
          Live Tracking
        </button>
      </div>

      <div className="tab-content">
        {tab === 0 && <DriverDashboard />}
        {tab === 1 && <DriverMyVehicle />}
        {tab === 2 && <DriverTracking />}
      </div>
    </div>
  );
}