import React from 'react';
import '../styles/About.css';

const About = () => {
  return (
    <div className="about-container">
      <div className="about-content">
        <h1 className="about-title">About PT Tracker</h1>
        <p className="about-subtitle">
          Revolutionizing public transport with real-time tracking and smart management
        </p>

        <div className="about-grid">
          <div className="about-card liquid-glass-card">
            <h3>Our Mission</h3>
            <p>
              To make public transportation more accessible, reliable, and efficient through cutting-edge technology and real-time data.
            </p>
          </div>

          <div className="about-card liquid-glass-card">
            <h3>What We Do</h3>
            <p>
              We provide real-time vehicle tracking, AI-powered ETA predictions, and seamless booking experiences for modern commuters.
            </p>
          </div>

          <div className="about-card liquid-glass-card">
            <h3>Our Vision</h3>
            <p>
              A world where public transport is the preferred choice, powered by technology that makes every journey predictable and stress-free.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
