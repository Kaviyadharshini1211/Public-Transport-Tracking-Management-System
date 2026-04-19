import React from 'react';
import '../styles/Contact.css';

const Contact = () => {
  return (
    <div className="contact-container">
      <div className="contact-content">
        <h1 className="contact-title">Get in Touch</h1>
        <p className="contact-subtitle">
          Have questions? We'd love to hear from you.
        </p>

        <div className="contact-grid">
          <div className="contact-card liquid-glass-card">
            <div className="contact-icon">📧</div>
            <h3>Email Us</h3>
            <p>support@pttracker.com</p>
          </div>

          <div className="contact-card liquid-glass-card">
            <div className="contact-icon">📞</div>
            <h3>Call Us</h3>
            <p>+1 (555) 123-4567</p>
          </div>

          <div className="contact-card liquid-glass-card">
            <div className="contact-icon">📍</div>
            <h3>Visit Us</h3>
            <p>123 Transit Ave, City, State 12345</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
