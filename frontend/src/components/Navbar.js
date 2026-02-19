import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import "../styles/Navbar.css";

const Navbar = ({ user, setUser }) => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("darkMode");
    return saved === "true";
  });

  // Apply dark mode on mount and when it changes
  useEffect(() => {
    if (darkMode) {
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.setAttribute("data-theme", "light");
    }
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

  // Add scroll detection for glass effect
  useEffect(() => {
    const handleScroll = () => {
      const navbar = document.querySelector('.navbar');
      if (window.scrollY > 10) {
        navbar?.classList.add('scrolled');
      } else {
        navbar?.classList.remove('scrolled');
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
    navigate("/");
    setMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  // Close mobile menu when clicking a link
  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <nav className={`navbar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
      <div className="navbar-container">
        {/* Logo — Stronger branding */}
        <NavLink to="/" className="navbar-logo" onClick={closeMobileMenu}>
          <span className="logo-mark">PT</span>
          <span className="logo-text">Tracker</span>
        </NavLink>

        {/* Mobile Toggle */}
        <button 
          className={`navbar-mobile-toggle ${mobileMenuOpen ? 'active' : ''}`} 
          onClick={toggleMobileMenu}
          aria-label="Toggle navigation"
          aria-expanded={mobileMenuOpen}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <div className={`navbar-menu ${mobileMenuOpen ? 'mobile-open' : ''}`}>

          {/* Dark Mode Toggle */}
          <button 
            className="dark-mode-toggle"
            onClick={toggleDarkMode}
            aria-label="Toggle dark mode"
            title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {darkMode ? '☀️' : '🌙'}
          </button>

          {/* Public Links */}
          <NavLink 
            to="/" 
            className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}
            onClick={closeMobileMenu}
            end
          >
            Home
          </NavLink>

          <NavLink 
            to="/about" 
            className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}
            onClick={closeMobileMenu}
          >
            About
          </NavLink>

          <NavLink 
            to="/contact" 
            className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}
            onClick={closeMobileMenu}
          >
            Contact
          </NavLink>

          {/* Not Logged In - Show Sign Up CTA */}
          {!user && (
            <NavLink 
              to="/signup" 
              className="navbar-cta-btn"
              onClick={closeMobileMenu}
            >
              Sign Up
            </NavLink>
          )}

          {/* Passenger Menu */}
          {user && user.role === "passenger" && (
            <>
              <NavLink 
                to="/book" 
                className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}
                onClick={closeMobileMenu}
              >
                Book Ticket
              </NavLink>
              <NavLink 
                to="/bookings" 
                className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}
                onClick={closeMobileMenu}
              >
                My Bookings
              </NavLink>
              <NavLink 
                to="/dashboard" 
                className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}
                onClick={closeMobileMenu}
              >
                Dashboard
              </NavLink>

              {/* User Info */}
              <div className="navbar-user-info">
                <span className="navbar-user-avatar">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'P'}
                </span>
                <span className="navbar-user-name">{user.name || 'Passenger'}</span>
              </div>

              <button onClick={handleLogout} className="navbar-button">
                Logout
              </button>
            </>
          )}

          {/* Driver Menu */}
          {user && user.role === "driver" && (
            <>
              <NavLink 
                to="/driver" 
                className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}
                onClick={closeMobileMenu}
              >
                Driver Panel
              </NavLink>

              {/* User Info */}
              <div className="navbar-user-info">
                <span className="navbar-user-avatar">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'D'}
                </span>
                <span className="navbar-user-name">{user.name || 'Driver'}</span>
              </div>

              <button onClick={handleLogout} className="navbar-button">
                Logout
              </button>
            </>
          )}

          {/* Admin Menu */}
          {user && user.role === "admin" && (
            <>
              <NavLink 
                to="/admin" 
                className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}
                onClick={closeMobileMenu}
              >
                Admin Panel
              </NavLink>

              {/* User Info */}
              <div className="navbar-user-info">
                <span className="navbar-user-avatar">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'A'}
                </span>
                <span className="navbar-user-name">{user.name || 'Admin'}</span>
              </div>

              <button onClick={handleLogout} className="navbar-button">
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
