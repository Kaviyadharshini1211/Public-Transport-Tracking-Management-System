import React, { useState, useEffect, useCallback } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import LoginForm from "./components/LoginForm";
import RegisterForm from "./components/RegisterForm";
import Vehicles from "./pages/Vehicles";
import Navbar from "./components/Navbar";
import NotFound from "./pages/NotFound";
import AuthSuccess from "./pages/AuthSuccess";

// DRIVER MODULE (NEW)
import DriverLayout from "./pages/driver/DriverLayout";

// ADMIN MODULE
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminDrivers from "./pages/admin/AdminDrivers";
import AdminVehicles from "./pages/admin/AdminVehicles";
import AdminRoutes from "./pages/admin/AdminRoutes";
import AdminAssignDriver from "./pages/admin/AdminAssignDriver";

// BOOKING
import Book from "./pages/Book";
import ConfirmBooking from "./pages/ConfirmBooking";
import MyBookings from "./pages/MyBooking";
import Track from "./pages/Track";

function App() {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || null;
    } catch {
      return null;
    }
  });

  const syncUser = useCallback(() => {
    try {
      setUser(JSON.parse(localStorage.getItem("user")) || null);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    window.addEventListener("userChanged", syncUser);
    window.addEventListener("storage", syncUser);

    return () => {
      window.removeEventListener("userChanged", syncUser);
      window.removeEventListener("storage", syncUser);
    };
  }, [syncUser]);

  return (
    <Router>
      <Navbar user={user} setUser={setUser} />

      <Routes>

        {/* PUBLIC ROUTES */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<LoginForm setUser={setUser} />} />
        <Route path="/register" element={<RegisterForm />} />
        <Route path="/auth/success" element={<AuthSuccess />} />

        {/* PASSENGER DASHBOARD */}
        <Route path="/dashboard" element={<Dashboard user={user} />} />

        {/* VEHICLES (visible to non-admin too) */}
        <Route path="/vehicles" element={<Vehicles user={user} />} />

        {/* DRIVER MODULE */}
        <Route path="/driver" element={<DriverLayout />} />

        {/* BOOKING MODULE */}
        <Route path="/book" element={<Book />} />
        <Route path="/book/confirm" element={<ConfirmBooking />} />
        <Route path="/bookings" element={<MyBookings />} />
        <Route path="/track/:vehicleId" element={<Track />} />

        {/* ADMIN NESTED ROUTE */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="drivers" element={<AdminDrivers />} />
          <Route path="vehicles" element={<AdminVehicles />} />
          <Route path="routes" element={<AdminRoutes />} />
          <Route path="assign" element={<AdminAssignDriver />} />
        </Route>

        {/* FALLBACK */}
        <Route path="*" element={<NotFound />} />

      </Routes>
    </Router>
  );
}

export default App;
