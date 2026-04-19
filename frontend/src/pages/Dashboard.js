import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api";
import "../styles/Dashboard.css";

const Dashboard = ({ user }) => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [initializing, setInitializing] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [stats, setStats] = useState({ totalTrips: 0, activeBookings: 0, totalSpent: 0 });

  useEffect(() => {
    if (user) {
      setCurrentUser(user);
      setInitializing(false);
      return;
    }
    try {
      const stored = localStorage.getItem("user");
      if (stored) setCurrentUser(JSON.parse(stored));
    } catch {}
    setInitializing(false);
  }, [user]);

  // Redirect non-passengers to their dedicated dashboards
  useEffect(() => {
    if (!initializing && currentUser) {
      if (currentUser.role === "admin") {
        navigate("/admin", { replace: true });
        return;
      }
      if (currentUser.role === "driver") {
        navigate("/driver", { replace: true });
        return;
      }
    }
    if (!initializing && !currentUser) {
      navigate("/login", { replace: true });
    }
  }, [initializing, currentUser, navigate]);

  // Fetch passenger bookings
  useEffect(() => {
    if (!currentUser || currentUser.role !== "passenger") return;
    const fetchBookings = async () => {
      try {
        setLoadingBookings(true);
        const res = await API.get(`/bookings/user/${currentUser._id || currentUser.id}`);
        const data = res.data || [];
        setBookings(data);
        setStats({
          totalTrips: data.length,
          activeBookings: data.filter(b => b.status !== "cancelled").length,
          totalSpent: data.reduce((acc, b) => acc + (b.totalFare || 0), 0),
        });
      } catch (err) {
        console.error("Error fetching bookings:", err);
      } finally {
        setLoadingBookings(false);
      }
    };
    fetchBookings();
  }, [currentUser]);

  if (initializing) {
    return (
      <div className="dash-page">
        <div className="dash-loading">
          <div className="dash-loading-spinner"></div>
          <span>Loading dashboard…</span>
        </div>
      </div>
    );
  }

  if (!currentUser || currentUser.role !== "passenger") return null;

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good Morning";
    if (h < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const recentBookings = bookings.slice(0, 3);

  return (
    <div className="dash-page">
      <div className="dash-container">
        {/* ===== HEADER ===== */}
        <div className="dash-header">
          <div className="dash-header__left">
            <div className="dash-header__avatar">
              {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : "U"}
            </div>
            <div className="dash-header__info">
              <h1 className="dash-header__greeting">
                {greeting()}, {currentUser.name?.split(" ")[0] || "Traveller"}! 👋
              </h1>
              <p className="dash-header__subtitle">
                Here's your travel overview
              </p>
            </div>
          </div>
          <div className="dash-header__badge">
            <span className="dash-badge dash-badge--passenger">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              Passenger
            </span>
          </div>
        </div>

        {/* ===== STAT CARDS ===== */}
        <div className="dash-stats">
          <div className="dash-stat-card dash-stat-card--trips">
            <div className="dash-stat-card__icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
              </svg>
            </div>
            <div className="dash-stat-card__content">
              <span className="dash-stat-card__value">{stats.totalTrips}</span>
              <span className="dash-stat-card__label">Total Trips</span>
            </div>
          </div>

          <div className="dash-stat-card dash-stat-card--active">
            <div className="dash-stat-card__icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <div className="dash-stat-card__content">
              <span className="dash-stat-card__value">{stats.activeBookings}</span>
              <span className="dash-stat-card__label">Active Bookings</span>
            </div>
          </div>

          <div className="dash-stat-card dash-stat-card--spent">
            <div className="dash-stat-card__icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
            </div>
            <div className="dash-stat-card__content">
              <span className="dash-stat-card__value">₹{stats.totalSpent}</span>
              <span className="dash-stat-card__label">Total Spent</span>
            </div>
          </div>
        </div>

        {/* ===== QUICK ACTIONS ===== */}
        <div className="dash-section">
          <h2 className="dash-section__title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            Quick Actions
          </h2>
          <div className="dash-actions">
            <button className="dash-action-card" onClick={() => navigate("/book")}>
              <div className="dash-action-card__icon dash-action-card__icon--book">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="2"/>
                  <path d="M2 10h20"/>
                  <path d="M12 4v16"/>
                </svg>
              </div>
              <span className="dash-action-card__title">Book Ticket</span>
              <span className="dash-action-card__desc">Search & book bus tickets</span>
              <span className="dash-action-card__arrow">→</span>
            </button>

            <button className="dash-action-card" onClick={() => navigate("/vehicles")}>
              <div className="dash-action-card__icon dash-action-card__icon--track">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="10" r="3"/><path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7z"/>
                </svg>
              </div>
              <span className="dash-action-card__title">Track Bus</span>
              <span className="dash-action-card__desc">Live bus locations</span>
              <span className="dash-action-card__arrow">→</span>
            </button>

            <button className="dash-action-card" onClick={() => navigate("/bookings")}>
              <div className="dash-action-card__icon dash-action-card__icon--bookings">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
                </svg>
              </div>
              <span className="dash-action-card__title">My Bookings</span>
              <span className="dash-action-card__desc">View booking history</span>
              <span className="dash-action-card__arrow">→</span>
            </button>

            <button className="dash-action-card" onClick={() => navigate("/contact")}>
              <div className="dash-action-card__icon dash-action-card__icon--help">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
              <span className="dash-action-card__title">Help & Support</span>
              <span className="dash-action-card__desc">Contact us anytime</span>
              <span className="dash-action-card__arrow">→</span>
            </button>
          </div>
        </div>

        {/* ===== RECENT BOOKINGS ===== */}
        <div className="dash-section">
          <div className="dash-section__header">
            <h2 className="dash-section__title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              Recent Bookings
            </h2>
            {bookings.length > 3 && (
              <button className="dash-section__view-all" onClick={() => navigate("/bookings")}>
                View All →
              </button>
            )}
          </div>

          {loadingBookings ? (
            <div className="dash-bookings-loading">
              <div className="dash-skeleton-card"></div>
              <div className="dash-skeleton-card"></div>
              <div className="dash-skeleton-card"></div>
            </div>
          ) : recentBookings.length === 0 ? (
            <div className="dash-empty-state">
              <div className="dash-empty-state__icon">🎫</div>
              <h3 className="dash-empty-state__title">No Bookings Yet</h3>
              <p className="dash-empty-state__text">Book your first bus ticket to get started!</p>
              <button className="dash-empty-state__btn" onClick={() => navigate("/book")}>
                Book Now
              </button>
            </div>
          ) : (
            <div className="dash-bookings-list">
              {recentBookings.map((booking) => (
                <div key={booking._id} className="dash-booking-card">
                  <div className="dash-booking-card__left">
                    <div className="dash-booking-card__icon">🚍</div>
                    <div className="dash-booking-card__info">
                      <span className="dash-booking-card__route">
                        {booking.routeId?.name || booking.vehicleId?.regNumber || "Bus Ticket"}
                      </span>
                      <span className="dash-booking-card__meta">
                        {booking.vehicleId?.regNumber && `${booking.vehicleId.regNumber} • `}
                        {booking.seatNumbers?.length > 0
                          ? `Seat${booking.seatNumbers.length > 1 ? "s" : ""}: ${booking.seatNumbers.join(", ")}`
                          : `${booking.seats || 1} seat(s)`}
                      </span>
                      <span className="dash-booking-card__id">
                        #{booking._id.slice(-8).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="dash-booking-card__right">
                    <span className="dash-booking-card__fare">₹{booking.totalFare}</span>
                    <span className="dash-booking-card__status dash-booking-card__status--confirmed">
                      Confirmed
                    </span>
                    {booking.vehicleId?._id && (
                      <button
                        className="dash-booking-card__track-btn"
                        onClick={() => navigate(`/track/${booking.vehicleId._id}?bookingId=${booking._id}`)}
                      >
                        Track
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
