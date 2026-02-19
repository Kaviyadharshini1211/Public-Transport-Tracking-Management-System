import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Home.css";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      <div className="home-content">
        {/* Hero Section — No Glass */}
        <section className="home-hero">
          <div className="hero-text">
            <div className="hero-badge-simple">
              <span className="badge-dot"></span>
              <span>Real-time Transport Management</span>
            </div>

            <h1 className="home-title">
              <span className="title-light">Book Your Journey with</span>
              <br />
              <span className="title-accent">Confidence</span>
            </h1>

            <p className="home-description">
              Seamless travel with real-time vehicle tracking, AI-powered ETA
              predictions, and smart fleet management — built for modern public
              transport.
            </p>

            {/* CTA Buttons */}
            <div className="hero-actions">
              <button className="btn-primary" onClick={() => navigate("/book")}>
                <span>Book Tickets</span>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path
                    d="M7.5 15L12.5 10L7.5 5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              <button
                className="btn-ghost"
                onClick={() => navigate("/vehicles")}
              >
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                  <circle
                    cx="10"
                    cy="10"
                    r="3"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M10 2v3M10 15v3M2 10h3M15 10h3"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
                <span>Track Vehicles</span>
              </button>
            </div>
          </div>

          {/* Hero Illustration — Right Side */}
          <div className="hero-illustration" aria-hidden="true">
            <svg
              viewBox="0 0 480 400"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="hero-bus-svg"
            >
              {/* Road */}
              <rect
                x="0"
                y="310"
                width="480"
                height="4"
                rx="2"
                fill="#e5e7eb"
              />
              <rect
                x="40"
                y="310"
                width="30"
                height="4"
                rx="2"
                fill="#d1d5db"
              />
              <rect
                x="120"
                y="310"
                width="50"
                height="4"
                rx="2"
                fill="#d1d5db"
              />
              <rect
                x="220"
                y="310"
                width="30"
                height="4"
                rx="2"
                fill="#d1d5db"
              />
              <rect
                x="300"
                y="310"
                width="50"
                height="4"
                rx="2"
                fill="#d1d5db"
              />
              <rect
                x="400"
                y="310"
                width="30"
                height="4"
                rx="2"
                fill="#d1d5db"
              />

              {/* Bus Body */}
              <rect
                x="80"
                y="160"
                width="300"
                height="150"
                rx="16"
                fill="#d84e55"
              />
              <rect
                x="80"
                y="160"
                width="300"
                height="30"
                rx="16"
                fill="#b83e44"
              />
              <rect x="80" y="176" width="300" height="14" fill="#b83e44" />

              {/* Windows */}
              <rect
                x="110"
                y="200"
                width="45"
                height="50"
                rx="6"
                fill="#e8f4fd"
              />
              <rect
                x="170"
                y="200"
                width="45"
                height="50"
                rx="6"
                fill="#dbeafe"
              />
              <rect
                x="230"
                y="200"
                width="45"
                height="50"
                rx="6"
                fill="#e8f4fd"
              />
              <rect
                x="290"
                y="200"
                width="45"
                height="50"
                rx="6"
                fill="#dbeafe"
              />

              {/* Window shine */}
              <rect
                x="112"
                y="202"
                width="8"
                height="46"
                rx="3"
                fill="rgba(255,255,255,0.3)"
              />
              <rect
                x="172"
                y="202"
                width="8"
                height="46"
                rx="3"
                fill="rgba(255,255,255,0.3)"
              />
              <rect
                x="232"
                y="202"
                width="8"
                height="46"
                rx="3"
                fill="rgba(255,255,255,0.3)"
              />
              <rect
                x="292"
                y="202"
                width="8"
                height="46"
                rx="3"
                fill="rgba(255,255,255,0.3)"
              />

              {/* Front windshield */}
              <path
                d="M350 200 L380 200 Q386 200 386 206 L386 250 Q386 256 380 256 L350 256 Z"
                fill="#bfdbfe"
              />
              <rect
                x="352"
                y="202"
                width="6"
                height="52"
                rx="3"
                fill="rgba(255,255,255,0.3)"
              />

              {/* Door */}
              <rect
                x="345"
                y="260"
                width="30"
                height="50"
                rx="4"
                fill="#991b1b"
              />
              <rect
                x="358"
                y="268"
                width="4"
                height="34"
                rx="2"
                fill="#fca5a5"
              />

              {/* Headlight */}
              <circle cx="388" cy="280" r="8" fill="#fbbf24" />
              <circle cx="388" cy="280" r="5" fill="#fef3c7" />

              {/* Rear light */}
              <rect
                x="80"
                y="270"
                width="8"
                height="16"
                rx="4"
                fill="#ef4444"
              />

              {/* Wheels */}
              <circle cx="160" cy="310" r="24" fill="#374151" />
              <circle cx="160" cy="310" r="14" fill="#6b7280" />
              <circle cx="160" cy="310" r="6" fill="#9ca3af" />

              <circle cx="320" cy="310" r="24" fill="#374151" />
              <circle cx="320" cy="310" r="14" fill="#6b7280" />
              <circle cx="320" cy="310" r="6" fill="#9ca3af" />

              {/* Bus label */}
              <rect
                x="160"
                y="172"
                width="140"
                height="20"
                rx="4"
                fill="rgba(255,255,255,0.2)"
              />
              <text
                x="230"
                y="186"
                textAnchor="middle"
                fill="white"
                fontSize="11"
                fontWeight="700"
                fontFamily="Inter, sans-serif"
              >
                PT TRACKER
              </text>

              {/* Location pin */}
              <g transform="translate(220, 100)">
                <path
                  d="M20 0C11.16 0 4 7.16 4 16C4 28 20 44 20 44C20 44 36 28 36 16C36 7.16 28.84 0 20 0Z"
                  fill="#d84e55"
                />
                <circle cx="20" cy="16" r="7" fill="white" />
                <circle cx="20" cy="16" r="3" fill="#d84e55" />
                {/* Pulse rings */}
                <circle
                  cx="20"
                  cy="16"
                  r="22"
                  fill="none"
                  stroke="#d84e55"
                  strokeWidth="1.5"
                  opacity="0.2"
                >
                  <animate
                    attributeName="r"
                    from="22"
                    to="34"
                    dur="2s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    from="0.2"
                    to="0"
                    dur="2s"
                    repeatCount="indefinite"
                  />
                </circle>
              </g>

              {/* Small decorative elements */}
              <circle cx="60" cy="260" r="3" fill="#e5e7eb" />
              <circle cx="420" cy="200" r="4" fill="#e5e7eb" />
              <circle cx="440" cy="260" r="3" fill="#e5e7eb" />
            </svg>
          </div>
        </section>

        {/* Features Grid */}
        <section className="home-features">
          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <span className="feature-icon">📍</span>
            </div>
            <h3 className="feature-title">Live Tracking</h3>
            <p className="feature-desc">
              GPS-powered real-time location updates for every vehicle in the
              fleet.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <span className="feature-icon">⏱️</span>
            </div>
            <h3 className="feature-title">Smart ETA</h3>
            <p className="feature-desc">
              AI-powered arrival predictions based on live traffic and route
              data.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <span className="feature-icon">🎫</span>
            </div>
            <h3 className="feature-title">Easy Booking</h3>
            <p className="feature-desc">
              Book and pay for tickets seamlessly from any device.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <span className="feature-icon">🚦</span>
            </div>
            <h3 className="feature-title">Fleet Management</h3>
            <p className="feature-desc">
              Comprehensive dashboards for authorities and operators.
            </p>
          </div>
        </section>

        {/* Stats Section — Glass allowed here */}
        <section className="home-stats">
          <div className="stat-item">
            <div className="stat-number">500+</div>
            <div className="stat-label">Daily Routes</div>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-item">
            <div className="stat-number">10K+</div>
            <div className="stat-label">Happy Travelers</div>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-item">
            <div className="stat-number">99.9%</div>
            <div className="stat-label">Uptime</div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Home;
