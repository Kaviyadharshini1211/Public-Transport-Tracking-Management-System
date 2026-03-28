import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Home.css";

/* ─── Counter Hook ─── */
function useCountUp(target, duration = 2000, startCounting) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!startCounting) return;
    let start = 0;
    const end = parseInt(target, 10);
    if (isNaN(end)) return;
    const increment = end / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration, startCounting]);
  return count;
}

/* ─── Intersection Observer Hook ─── */
function useInView(options = {}) {
  const ref = useRef(null);
  const [isInView, setIsInView] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsInView(true);
        observer.unobserve(node);
      }
    }, { threshold: 0.15, ...options });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return [ref, isInView];
}

/* ─── Stat Item ─── */
const StatItem = ({ value, suffix = "", label, icon, startCounting }) => {
  const count = useCountUp(value, 2000, startCounting);
  return (
    <div className="stat-item">
      <div className="stat-icon">{icon}</div>
      <div className="stat-number">{count.toLocaleString()}{suffix}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
};

const Home = ({ user }) => {
  const navigate = useNavigate();

  /* Scroll-triggered section refs */
  const [heroRef, heroVisible] = useInView();
  const [featuresRef, featuresVisible] = useInView();
  const [howRef, howVisible] = useInView();
  const [statsRef, statsVisible] = useInView();
  const [whyRef, whyVisible] = useInView();
  const [testimonialsRef, testimonialsVisible] = useInView();
  const [ctaRef, ctaVisible] = useInView();

  const features = [
    { icon: "📍", title: "Live Tracking", desc: "GPS-powered real-time location updates for every vehicle in the fleet." },
    { icon: "⏱️", title: "Smart ETA", desc: "AI-powered arrival predictions based on live traffic and route data." },
    { icon: "🎫", title: "Easy Booking", desc: "Book and pay for tickets seamlessly from any device, anywhere." },
    { icon: "🚦", title: "Fleet Management", desc: "Comprehensive dashboards for transit authorities and operators." },
    { icon: "🔔", title: "Instant Alerts", desc: "Real-time notifications for delays, arrivals, and schedule changes." },
    { icon: "🗺️", title: "Route Optimization", desc: "Smart routing algorithms that minimize travel time and fuel costs." },
  ];

  const steps = [
    { num: "01", icon: "🔍", title: "Search Route", desc: "Enter your pickup and destination to find available buses." },
    { num: "02", icon: "📡", title: "Track Vehicle", desc: "See your bus moving in real-time on a live map." },
    { num: "03", icon: "🎫", title: "Book Ticket", desc: "Reserve your seat and pay securely in seconds." },
    { num: "04", icon: "🎉", title: "Travel Stress-Free", desc: "Arrive on time with AI-powered ETA predictions." },
  ];

  const whyUs = [
    { icon: "⚡", title: "Blazing Fast", desc: "Our platform loads 3x faster than competitors with optimized real-time streams." },
    { icon: "🎯", title: "Real-Time Accuracy", desc: "GPS precision within 5 meters, refreshed every 3 seconds." },
    { icon: "🤖", title: "AI-Powered ETAs", desc: "Machine learning models trained on millions of data points for accurate predictions." },
    { icon: "🔒", title: "Secure Payments", desc: "Bank-grade encryption with multiple payment options and instant refunds." },
  ];

  const testimonials = [
    { name: "Priya Sharma", role: "Daily Commuter", quote: "PT Tracker completely changed how I commute. No more guessing when the bus will arrive — I plan my day around it!", rating: 5 },
    { name: "Rajesh Kumar", role: "Fleet Manager", quote: "Managing 200+ vehicles was a nightmare. PT Tracker's dashboard gives us real-time visibility and control over our entire fleet.", rating: 5 },
    { name: "Aisha Patel", role: "Student", quote: "The booking system is so easy! I save 20 minutes every morning by knowing exactly when to leave for the bus stop.", rating: 5 },
    { name: "Vikram Reddy", role: "Transport Authority", quote: "We've seen a 40% improvement in on-time performance since deploying PT Tracker across our city's transit network.", rating: 5 },
  ];

  return (
    <div className="home-container">
      {/* Animated Background Blobs */}
      <div className="home-bg-decor" aria-hidden="true">
        <div className="bg-blob blob-1"></div>
        <div className="bg-blob blob-2"></div>
        <div className="bg-blob blob-3"></div>
      </div>

      <div className="home-content">

        {/* ═══════════ HERO SECTION ═══════════ */}
        <section
          className={`home-hero ${heroVisible ? "visible" : ""}`}
          ref={heroRef}
          id="hero"
        >
          <div className="hero-text">
            <div className="hero-badge">
              <span className="badge-pulse"></span>
              <span>🚀 Real-time Transport Management</span>
            </div>

            <h1 className="home-title">
              <span className="title-line-1">Smart Public Transport,</span>
              <br />
              <span className="title-accent">Simplified 🚍</span>
            </h1>

            <p className="home-description">
              Track buses in real-time, plan your commute smarter, and never
              miss a ride with AI-powered arrival predictions. The future of
              public transport is here.
            </p>

            <div className="hero-actions">
              <button className="btn-primary" onClick={() => navigate("/vehicles")}>
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                  <circle cx="10" cy="10" r="3" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M10 2v3M10 15v3M2 10h3M15 10h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <span>Track Your Bus Live</span>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              {!user && (
                <button className="btn-secondary" onClick={() => navigate("/login")}>
                  <span>Login to Book Tickets</span>
                </button>
              )}
            </div>

            {/* Trust Indicators */}
            <div className="hero-trust">
              <div className="trust-avatars">
                <span className="trust-avatar" style={{background: '#d84e55'}}>P</span>
                <span className="trust-avatar" style={{background: '#3b82f6'}}>R</span>
                <span className="trust-avatar" style={{background: '#10b981'}}>A</span>
                <span className="trust-avatar" style={{background: '#f59e0b'}}>V</span>
              </div>
              <span className="trust-text">Trusted by <strong>10,000+</strong> commuters daily</span>
            </div>
          </div>

          {/* Hero Right — Dashboard Preview */}
          <div className="hero-visual" aria-hidden="true">
            <div className="hero-dashboard">
              {/* Dashboard mockup header */}
              <div className="dash-header">
                <div className="dash-dots">
                  <span></span><span></span><span></span>
                </div>
                <span className="dash-title">Live Dashboard</span>
              </div>

              {/* Dashboard content */}
              <div className="dash-body">
                {/* Map area */}
                <div className="dash-map">
                  <div className="map-route-line"></div>
                  <div className="map-pin map-pin-start">A</div>
                  <div className="map-pin map-pin-end">B</div>
                  <div className="map-bus-icon">🚌</div>
                </div>
              </div>
            </div>

            {/* Floating Cards */}
            <div className="floating-card card-eta">
              <div className="fc-icon">⏱️</div>
              <div className="fc-content">
                <div className="fc-label">ETA</div>
                <div className="fc-value">12 min</div>
              </div>
            </div>

            <div className="floating-card card-location">
              <div className="fc-icon">📍</div>
              <div className="fc-content">
                <div className="fc-label">Next Stop</div>
                <div className="fc-value">MG Road</div>
              </div>
            </div>

            <div className="floating-card card-alert">
              <div className="fc-icon">✅</div>
              <div className="fc-content">
                <div className="fc-label">Status</div>
                <div className="fc-value fc-success">On Time</div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════ FEATURES SECTION ═══════════ */}
        <section
          className={`home-section ${featuresVisible ? "visible" : ""}`}
          ref={featuresRef}
          id="features"
        >
          <div className="section-header">
            <span className="section-badge">Features</span>
            <h2 className="section-title">Everything You Need for Smarter Travel</h2>
            <p className="section-subtitle">
              Powerful tools designed for commuters, fleet managers, and transit authorities alike.
            </p>
          </div>

          <div className="features-grid">
            {features.map((f, i) => (
              <div className="feature-card" key={i} style={{ animationDelay: `${i * 80}ms` }}>
                <div className="feature-icon-wrapper">
                  <span className="feature-icon">{f.icon}</span>
                </div>
                <h3 className="feature-title">{f.title}</h3>
                <p className="feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ═══════════ HOW IT WORKS ═══════════ */}
        <section
          className={`home-section ${howVisible ? "visible" : ""}`}
          ref={howRef}
          id="how-it-works"
        >
          <div className="section-header">
            <span className="section-badge">How It Works</span>
            <h2 className="section-title">Get Moving in 4 Simple Steps</h2>
            <p className="section-subtitle">
              From searching a route to reaching your destination — it's that easy.
            </p>
          </div>

          <div className="steps-grid">
            {steps.map((s, i) => (
              <div className="step-card" key={i} style={{ animationDelay: `${i * 120}ms` }}>
                <div className="step-number">{s.num}</div>
                <div className="step-icon">{s.icon}</div>
                <h3 className="step-title">{s.title}</h3>
                <p className="step-desc">{s.desc}</p>
                {i < steps.length - 1 && <div className="step-connector" aria-hidden="true"></div>}
              </div>
            ))}
          </div>
        </section>

        {/* ═══════════ STATS SECTION ═══════════ */}
        <section
          className={`stats-section ${statsVisible ? "visible" : ""}`}
          ref={statsRef}
          id="stats"
        >
          <StatItem value={500} suffix="+" label="Daily Routes" icon="🛣️" startCounting={statsVisible} />
          <StatItem value={10000} suffix="+" label="Happy Travelers" icon="🧑‍🤝‍🧑" startCounting={statsVisible} />
          <StatItem value={99} suffix=".9%" label="Uptime" icon="⚡" startCounting={statsVisible} />
          <StatItem value={50} suffix="+" label="Cities Covered" icon="🏙️" startCounting={statsVisible} />
        </section>

        {/* ═══════════ WHY CHOOSE US ═══════════ */}
        <section
          className={`home-section ${whyVisible ? "visible" : ""}`}
          ref={whyRef}
          id="why-choose-us"
        >
          <div className="section-header">
            <span className="section-badge">Why PT Tracker</span>
            <h2 className="section-title">Built for the Future of Transit</h2>
            <p className="section-subtitle">
              We're not just another tracking app — we're redefining how cities move.
            </p>
          </div>

          <div className="why-grid">
            {whyUs.map((w, i) => (
              <div className="why-card" key={i} style={{ animationDelay: `${i * 100}ms` }}>
                <div className="why-icon">{w.icon}</div>
                <h3 className="why-title">{w.title}</h3>
                <p className="why-desc">{w.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ═══════════ TESTIMONIALS ═══════════ */}
        <section
          className={`home-section ${testimonialsVisible ? "visible" : ""}`}
          ref={testimonialsRef}
          id="testimonials"
        >
          <div className="section-header">
            <span className="section-badge">Testimonials</span>
            <h2 className="section-title">Loved by Thousands of Commuters</h2>
            <p className="section-subtitle">
              Don't just take our word for it — hear from our happy users.
            </p>
          </div>

          <div className="testimonials-grid">
            {testimonials.map((t, i) => (
              <div className="testimonial-card" key={i} style={{ animationDelay: `${i * 100}ms` }}>
                <div className="testimonial-stars">
                  {"★".repeat(t.rating)}
                </div>
                <p className="testimonial-quote">"{t.quote}"</p>
                <div className="testimonial-author">
                  <div className="testimonial-avatar">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <div className="testimonial-name">{t.name}</div>
                    <div className="testimonial-role">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ═══════════ TRACK / CTA SECTION ═══════════ */}
        <section
          className={`cta-section ${ctaVisible ? "visible" : ""}`}
          ref={ctaRef}
          id="track"
        >
          <div className="cta-content">
            <h2 className="cta-title">Track Your Bus in Real-Time</h2>
            <p className="cta-subtitle">
              Join thousands of smart commuters who never miss their ride.
              Start tracking for free — no account needed.
            </p>
            <div className="cta-actions">
              <button className="btn-cta-primary" onClick={() => navigate("/vehicles")}>
                Start Tracking Now
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              {!user && (
                <button className="btn-cta-ghost" onClick={() => navigate("/register")}>
                  Sign Up to Book Tickets
                </button>
              )}
              {user && (
                <button className="btn-cta-ghost" onClick={() => navigate("/book")}>
                  Book Tickets
                </button>
              )}
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};

export default Home;
