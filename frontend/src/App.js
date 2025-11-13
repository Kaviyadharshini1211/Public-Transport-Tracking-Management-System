import React, { useState, useEffect, useCallback } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import LoginForm from "./components/LoginForm";
import Vehicles from "./pages/Vehicles";
import Navbar from "./components/Navbar";
import NotFound from "./pages/NotFound";
import RegisterForm from "./components/RegisterForm";
import AuthSuccess from "./pages/AuthSuccess";

function App() {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // Keep user in sync with localStorage across tabs and redirects
  const syncUserFromStorage = useCallback(() => {
    try {
      const stored = localStorage.getItem("user");
      setUser(stored ? JSON.parse(stored) : null);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    // when localStorage changes (other tab or after redirect), update state
    window.addEventListener("storage", syncUserFromStorage);

    // when the tab becomes visible again (useful after redirect)
    const onVisibility = () => {
      if (!document.hidden) syncUserFromStorage();
    };
    document.addEventListener("visibilitychange", onVisibility);

    // custom event to allow other code to force-sync when they write localStorage
    window.addEventListener("userChanged", syncUserFromStorage);

    return () => {
      window.removeEventListener("storage", syncUserFromStorage);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("userChanged", syncUserFromStorage);
    };
  }, [syncUserFromStorage]);

  return (
    <Router>
      <Navbar user={user} setUser={setUser} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<LoginForm setUser={setUser} />} />
        <Route path="/register" element={<RegisterForm />} />

        {/* Google Auth Success Handler */}
        <Route path="/auth/success" element={<AuthSuccess />} />

        {/* Dashboard & other protected pages */}
        {/* Dashboard accepts prop but will also read from localStorage/fetch if needed */}
        <Route path="/dashboard" element={<Dashboard user={user} />} />
        <Route path="/vehicles" element={<Vehicles user={user} />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
