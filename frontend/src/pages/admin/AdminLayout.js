// src/pages/AdminLayout.jsx
import React, { useState } from "react";
import { Tabs, Tab, Box, Container, Typography } from "@mui/material";
import { 
  DirectionsCar, 
  Person, 
  Route, 
  Assignment 
} from "@mui/icons-material";
import "../../styles/AdminLayout.css";

import AdminVehicles from "./AdminVehicles";
import AdminDrivers from "./AdminDrivers";
import AdminRoutes from "./AdminRoutes";
import AdminAssignDriver from "./AdminAssignDriver";

export default function AdminLayout() {
  const [tab, setTab] = useState(0);

  const tabConfig = [
    { label: "Vehicles", icon: <DirectionsCar />, component: <AdminVehicles /> },
    { label: "Drivers", icon: <Person />, component: <AdminDrivers /> },
    { label: "Routes", icon: <Route />, component: <AdminRoutes /> },
    { label: "Assign Driver", icon: <Assignment />, component: <AdminAssignDriver /> },
  ];

  return (
    <Box className="admin-layout-wrapper">
      <Container className="admin-container" maxWidth="xl">
        {/* Header */}
        <Box className="admin-header">
          <Typography className="admin-title" variant="h4">
            Admin Dashboard
          </Typography>
          <Typography className="admin-subtitle">
            Manage vehicles, drivers, routes and assignments
          </Typography>
        </Box>

        {/* Tabs Navigation */}
        <Box className="tabs-wrapper">
          <Tabs
            value={tab}
            onChange={(e, v) => setTab(v)}
            className="admin-tabs"
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
          >
            {tabConfig.map((item, idx) => (
              <Tab
                key={idx}
                className="admin-tab"
                icon={item.icon}
                label={item.label}
                iconPosition="start"
              />
            ))}
          </Tabs>
        </Box>

        {/* Tab Content */}
        <Box className="tab-content">
          {tabConfig[tab].component}
        </Box>
      </Container>
    </Box>
  );
}