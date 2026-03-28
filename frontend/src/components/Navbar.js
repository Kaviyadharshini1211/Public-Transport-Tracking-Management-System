import React, { useState, useEffect, useCallback } from "react";
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
                  Home
                </button>
                <button
                  className={getSectionLinkClass("features")}
                  onClick={() => scrollToSection("features")}
                  type="button"
                >
                  Features
                </button>
                <button
                  className={getSectionLinkClass("how-it-works")}
                  onClick={() => scrollToSection("how-it-works")}
                  type="button"
                >
                  How It Works
                </button>
                <button
                  className={getSectionLinkClass("track")}
                  onClick={() => scrollToSection("track")}
                  type="button"
                >
                  Track Bus
                </button>
                <NavLink
                  to="/contact"
                  className={({ isActive }) => `navbar-link ${!isHomePage && isActive ? "active" : ""}`}
                  onClick={closeMobileMenu}
                >
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
                      Home
                    </NavLink>
                    <NavLink
                      to="/vehicles"
                      className={({ isActive }) => `navbar-link ${isActive ? "active" : ""}`}
                      onClick={closeMobileMenu}
                    >
                      Track Bus
                    </NavLink>
                    <NavLink
                      to="/book"
                      className={({ isActive }) => `navbar-link ${isActive ? "active" : ""}`}
                      onClick={closeMobileMenu}
                    >
                      Book Ticket
                    </NavLink>
                    <NavLink
                      to="/bookings"
                      className={({ isActive }) => `navbar-link ${isActive ? "active" : ""}`}
                      onClick={closeMobileMenu}
                    >
                      My Bookings
                    </NavLink>
                    <NavLink
                      to="/dashboard"
                      className={({ isActive }) => `navbar-link ${isActive ? "active" : ""}`}
                      onClick={closeMobileMenu}
                    >
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

              {/* Logged In — User Info + Logout */}
              {user && (
                <>
                  <div className="navbar-user-info">
                    <span className="navbar-user-avatar">
                      {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                    </span>
                    <span className="navbar-user-name">{user.name || "User"}</span>
                  </div>
                  <button onClick={handleLogout} className="navbar-button">
                    Logout
                  </button>
                </>
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
