import React, { useState } from "react";
import { Tabs, Tab, Box } from "@mui/material";

import DriverDashboard from "./DriverDashboard";
import DriverMyVehicle from "./DriverMyVehicle";
import DriverTracking from "./DriverTracking";

export default function DriverLayout() {
  const user = JSON.parse(localStorage.getItem("user"));

  if (!user || user.role !== "driver")
    return <h2 style={{ padding: 20 }}>Access denied. Driver login required.</h2>;

  const [tab, setTab] = useState(0);

  return (
    <Box sx={{ width: "100%", padding: 3 }}>
      <Tabs
        value={tab}
        onChange={(e, v) => setTab(v)}
        textColor="primary"
        indicatorColor="primary"
        sx={{ mb: 3 }}
      >
        <Tab label="Dashboard" />
        <Tab label="My Vehicle" />
        <Tab label="Live Tracking" />
      </Tabs>

      {tab === 0 && <DriverDashboard />}
      {tab === 1 && <DriverMyVehicle />}
      {tab === 2 && <DriverTracking />}
    </Box>
  );
}
