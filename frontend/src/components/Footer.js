import React from "react";
import { Link } from "react-router-dom";
import "../styles/Footer.css";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="site-footer">
      {/* Gradient accent bar */}
      <div className="footer-accent" />

      <div className="footer-container">
        {/* Brand Column */}
        <div className="footer-brand">
          <Link to="/" className="footer-logo">
            <span className="footer-logo-mark">PT</span>
            <span className="footer-logo-text">Tracker</span>
          </Link>
          <p className="footer-tagline">
            Real-time public transport tracking &amp; smart fleet management for modern cities.
          </p>
        </div>

        {/* Quick Links */}
        <div className="footer-column">
          <h4 className="footer-heading">Quick Links</h4>
          <ul className="footer-links">
            <li><Link to="/">Home</Link></li>
            <li><Link to="/book">Book Ticket</Link></li>
            <li><Link to="/bookings">My Bookings</Link></li>
            <li><Link to="/dashboard">Dashboard</Link></li>
          </ul>
        </div>

        {/* Company */}
        <div className="footer-column">
          <h4 className="footer-heading">Company</h4>
          <ul className="footer-links">
            <li><Link to="/about">About Us</Link></li>
            <li><Link to="/contact">Contact</Link></li>
          </ul>
        </div>

        {/* Contact Info */}
        <div className="footer-column">
          <h4 className="footer-heading">Get in Touch</h4>
          <ul className="footer-links footer-contact">
            <li>
              <span className="footer-contact-icon">📧</span>
              <span>support@pttracker.com</span>
            </li>
            <li>
              <span className="footer-contact-icon">📞</span>
              <span>+91 98765 43210</span>
            </li>
            <li>
              <span className="footer-contact-icon">📍</span>
              <span>Bangalore, India</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="footer-bottom">
        <p>© {currentYear} PT Tracker. All rights reserved.</p>
        <p className="footer-credit">Built with ❤️ for smarter public transport</p>
      </div>
    </footer>
  );
};

export default Footer;
