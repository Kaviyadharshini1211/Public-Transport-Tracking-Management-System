import React, { useState, useEffect, useCallback } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import Vehicles from "./pages/Vehicles";
import Navbar from "./components/Navbar";
import NotFound from "./pages/NotFound";
import AuthSuccess from "./pages/AuthSuccess";
import ErrorBoundary from "./components/ErrorBoundary";
import Footer from "./components/Footer";

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
import Contact from "./pages/Contact";
import About from "./pages/About";
import LocalBusMap from "./pages/localBusMap";

// NEW PASSENGER PAGES
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Notifications from "./pages/Notifications";
import Favorites from "./pages/Favorites";
import ProtectedRoute from "./components/ProtectedRoute";

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
    <ErrorBoundary>
      <Router>
        <Toaster position="top-right" reverseOrder={false} />
        <Navbar user={user} setUser={setUser} />

        <Routes>

          {/* PUBLIC ROUTES */}
          <Route path="/" element={<Home user={user} />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/signup" element={<Auth setUser={setUser} />} />
          <Route path="/login" element={<Auth setUser={setUser} />} />
          <Route path="/register" element={<Auth setUser={setUser} />} />
          <Route path="/auth/success" element={<AuthSuccess />} />
          <Route path="/local-bus" element={<LocalBusMap />} />

          {/* PASSENGER DASHBOARD */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard user={user} /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
          <Route path="/favorites" element={<ProtectedRoute><Favorites /></ProtectedRoute>} />

          {/* VEHICLES (visible to non-admin too) */}
          <Route path="/vehicles" element={<Vehicles user={user} />} />

          {/* DRIVER MODULE */}
          <Route path="/driver" element={<DriverLayout />} />

          {/* BOOKING MODULE */}
          <Route path="/book" element={<ProtectedRoute><Book /></ProtectedRoute>} />
          <Route path="/book/confirm" element={<ProtectedRoute><ConfirmBooking /></ProtectedRoute>} />
          <Route path="/bookings" element={<ProtectedRoute><MyBookings /></ProtectedRoute>} />
          <Route path="/track/:vehicleId" element={<ProtectedRoute><Track /></ProtectedRoute>} />

          {/* ADMIN NESTED ROUTES */}
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
        <Footer />
      </Router>
    </ErrorBoundary>
  );
}

export default App;
