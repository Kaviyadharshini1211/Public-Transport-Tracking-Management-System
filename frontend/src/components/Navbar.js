import React, { useState, useEffect, useCallback, useRef } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import "../styles/Navbar.css";

const Navbar = ({ user, setUser }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("hero");
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("darkMode");
    return saved === "true";
  });

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Apply dark mode on mount and when it changes
  useEffect(() => {
    if (darkMode) {
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.setAttribute("data-theme", "light");
    }
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

  // Scroll detection for sticky glass effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

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

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  // Smooth scroll to section on homepage with navbar offset
  const NAVBAR_HEIGHT = 80;

  const scrollToSection = useCallback((sectionId) => {
    closeMobileMenu();
    if (location.pathname !== "/") {
      navigate("/");
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) {
          const top = el.getBoundingClientRect().top + window.scrollY - NAVBAR_HEIGHT;
          window.scrollTo({ top, behavior: "smooth" });
        }
      }, 150);
    } else {
      const el = document.getElementById(sectionId);
      if (el) {
        const top = el.getBoundingClientRect().top + window.scrollY - NAVBAR_HEIGHT;
        window.scrollTo({ top, behavior: "smooth" });
      }
    }
  }, [location.pathname, navigate]);

  const isHomePage = location.pathname === "/";

  // Scroll-spy
  useEffect(() => {
    if (!isHomePage) {
      setActiveSection("");
      return;
    }

    const OFFSET = NAVBAR_HEIGHT + 20;
    const sectionIds = ["hero", "features", "how-it-works", "stats", "why-choose-us", "testimonials", "track"];

    const handleScroll = () => {
      let current = "hero";

      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (rect.top <= OFFSET) {
          current = id;
        }
      }

      setActiveSection(current);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isHomePage, location.pathname]);

  // Helper: get active class for scroll-based nav links
  const getSectionLinkClass = (sectionId) => {
    if (!isHomePage) return "navbar-link";
    return `navbar-link ${activeSection === sectionId ? "active" : ""}`;
  };

  // Early return if on standalone dashboard layouts that have their own custom headers
  if (location.pathname.startsWith('/admin') || location.pathname.startsWith('/driver')) {
    return null;
  }

  return (
    <>
      <nav className={`navbar ${scrolled ? "scrolled" : ""} ${mobileMenuOpen ? "mobile-open" : ""}`}>
        <div className="navbar-container">
          {/* Logo */}
          <NavLink
            to="/"
            className="navbar-logo"
            onClick={(e) => {
              if (isHomePage) {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: "smooth" });
              }
              closeMobileMenu();
            }}
          >
            <span className="logo-mark">PT</span>
            <span className="logo-text">Tracker</span>
          </NavLink>

          {/* Mobile Toggle — moved BEFORE nav content */}
          <button
            className={`navbar-mobile-toggle ${mobileMenuOpen ? "active" : ""}`}
            onClick={toggleMobileMenu}
            aria-label="Toggle navigation"
            aria-expanded={mobileMenuOpen}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>

          {/* Slide-in panel for mobile — contains BOTH center links + right actions */}
          <div className={`navbar-menu ${mobileMenuOpen ? "mobile-open" : ""}`}>
            {/* Center Nav Links — visible when NOT logged in */}
            {!user && (
              <div className="navbar-center">
                <button
                  className={getSectionLinkClass("hero")}
                  onClick={() => scrollToSection("hero")}
                  type="button"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: "6px"}}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                  Home
                </button>
                <button
                  className={getSectionLinkClass("features")}
                  onClick={() => scrollToSection("features")}
                  type="button"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: "6px"}}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                  Features
                </button>
                <button
                  className={getSectionLinkClass("how-it-works")}
                  onClick={() => scrollToSection("how-it-works")}
                  type="button"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: "6px"}}><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                  How It Works
                </button>
                <NavLink
                  to="/vehicles"
                  className={({ isActive }) => `navbar-link ${!isHomePage && isActive ? "active" : ""}`}
                  onClick={closeMobileMenu}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: "6px"}}><circle cx="12" cy="10" r="3"/><path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7z"/></svg>
                  Track Bus
                </NavLink>
                <NavLink
                  to="/contact"
                  className={({ isActive }) => `navbar-link ${!isHomePage && isActive ? "active" : ""}`}
                  onClick={closeMobileMenu}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: "6px"}}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                  Contact
                </NavLink>
              </div>
            )}

            {/* Logged-in menus — ROLE-BASED */}
            {user && (
              <div className="navbar-center">
                {/* ===== PASSENGER NAV ===== */}
                {user.role === "passenger" && (
                  <>
                    <NavLink
                      to="/"
                      className={({ isActive }) => `navbar-link ${isActive ? "active" : ""}`}
                      onClick={closeMobileMenu}
                      end
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: "6px"}}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                      Home
                    </NavLink>
                    <NavLink
                      to="/vehicles"
                      className={({ isActive }) => `navbar-link ${isActive ? "active" : ""}`}
                      onClick={closeMobileMenu}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: "6px"}}><circle cx="12" cy="10" r="3"/><path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7z"/></svg>
                      Track Bus
                    </NavLink>
                    <NavLink
                      to="/book"
                      className={({ isActive }) => `navbar-link ${isActive ? "active" : ""}`}
                      onClick={closeMobileMenu}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: "6px"}}><rect x="2" y="4" width="20" height="16" rx="2"></rect><path d="M2 10h20"></path><path d="M12 4v16"></path></svg>
                      Book Ticket
                    </NavLink>
                    <NavLink
                      to="/bookings"
                      className={({ isActive }) => `navbar-link ${isActive ? "active" : ""}`}
                      onClick={closeMobileMenu}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: "6px"}}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
                      My Bookings
                    </NavLink>
                    <NavLink
                      to="/dashboard"
                      className={({ isActive }) => `navbar-link ${isActive ? "active" : ""}`}
                      onClick={closeMobileMenu}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: "6px"}}><rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect></svg>
                      Dashboard
                    </NavLink>
                  </>
                )}

                {/* ===== DRIVER NAV ===== */}
                {user.role === "driver" && (
                  <>
                    <NavLink
                      to="/driver"
                      className={({ isActive }) => `navbar-link ${isActive ? "active" : ""}`}
                      onClick={closeMobileMenu}
                    >
                      Dashboard
                    </NavLink>
                    <NavLink
                      to="/vehicles"
                      className={({ isActive }) => `navbar-link ${isActive ? "active" : ""}`}
                      onClick={closeMobileMenu}
                    >
                      My Route
                    </NavLink>
                  </>
                )}

                {/* ===== ADMIN NAV ===== */}
                {user.role === "admin" && (
                  <>
                    <NavLink
                      to="/admin"
                      className={({ isActive }) => `navbar-link ${isActive ? "active" : ""}`}
                      onClick={closeMobileMenu}
                    >
                      Dashboard
                    </NavLink>
                    <NavLink
                      to="/vehicles"
                      className={({ isActive }) => `navbar-link ${isActive ? "active" : ""}`}
                      onClick={closeMobileMenu}
                    >
                      Track Buses
                    </NavLink>
                  </>
                )}
              </div>
            )}

            {/* Right Side — Auth + Dark Mode (inside menu panel for mobile) */}
            <div className="navbar-right">
              {/* Dark Mode Toggle */}
              <button
                className="dark-mode-toggle"
                onClick={toggleDarkMode}
                aria-label="Toggle dark mode"
                title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
              >
                {darkMode ? "☀️" : "🌙"}
              </button>

              {/* Not Logged In */}
              {!user && (
                <NavLink
                  to="/register"
                  className="navbar-cta-btn"
                  onClick={closeMobileMenu}
                >
                  Register
                </NavLink>
              )}

              {/* Logged In — Profile Dropdown */}
              {user && (
                <div className="passenger-dropdown-container" ref={dropdownRef}>
                  <div 
                    className="passenger-profile-chip" 
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                  >
                    <div className="navbar-user-avatar">
                      {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                    </div>
                    <span className="navbar-user-name">{user?.name || "User"}</span>
                    <span className={`dropdown-arrow ${dropdownOpen ? 'open' : ''}`}>▼</span>
                  </div>

                  {dropdownOpen && (
                    <div className="passenger-dropdown-menu">
                      <div className="passenger-dropdown-header">
                        <div className="passenger-dropdown-name">{user?.name || "Passenger"}</div>
                        <div className="passenger-dropdown-email">{user?.email || ""}</div>
                      </div>
                      <button className="passenger-dropdown-item" onClick={() => { setDropdownOpen(false); navigate("/profile"); closeMobileMenu(); }}>
                        <span>👤</span> My Profile
                      </button>
                      <button className="passenger-dropdown-item" onClick={() => { setDropdownOpen(false); navigate("/settings"); closeMobileMenu(); }}>
                        <span>⚙️</span> Settings
                      </button>
                      <button className="passenger-dropdown-item" onClick={() => { setDropdownOpen(false); navigate("/bookings"); closeMobileMenu(); }}>
                        <span>🎟️</span> My Bookings
                      </button>
                      <button className="passenger-dropdown-item" onClick={() => { setDropdownOpen(false); navigate("/notifications"); closeMobileMenu(); }}>
                        <span>🔔</span> Notifications
                      </button>
                      <button className="passenger-dropdown-item" onClick={() => { setDropdownOpen(false); navigate("/favorites"); closeMobileMenu(); }}>
                        <span>⭐</span> Favorite Routes
                      </button>
                      <div className="passenger-dropdown-divider"></div>
                      <button className="passenger-dropdown-item danger" onClick={handleLogout}>
                        <span>🚪</span> Logout
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile overlay backdrop */}
      {mobileMenuOpen && (
        <div className="navbar-backdrop" onClick={closeMobileMenu} />
      )}
    </>
  );
};

export default Navbar;
