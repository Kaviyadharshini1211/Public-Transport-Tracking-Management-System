import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import API from '../api/api';
import '../styles/Auth.css';

const Auth = ({ setUser }) => {
  const location = useLocation();
  const isSignupRoute = location.pathname === '/register' || location.pathname === '/signup';
  const [isLogin, setIsLogin] = useState(!isSignupRoute);
  const [role, setRole] = useState('passenger');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  // Sync tab state when route changes externally
  useEffect(() => {
    const isSignup = location.pathname === '/register' || location.pathname === '/signup';
    setIsLogin(!isSignup);
  }, [location.pathname]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  // Route user to correct dashboard based on their ACTUAL role from backend
  const navigateByRole = (userRole) => {
    if (userRole === 'admin') navigate('/admin');
    else if (userRole === 'driver') navigate('/driver');
    else navigate('/dashboard');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        // Login: only email + password — NO role from frontend
        const response = await API.post('/auth/login', {
          email: formData.email,
          password: formData.password,
        });

        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        setUser(response.data.user);
        window.dispatchEvent(new Event('userChanged'));

        // Use BACKEND role for routing — never trust frontend selection
        navigateByRole(response.data.user.role);
      } else {
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }

        // Registration: backend ignores role and always sets 'passenger'
        const response = await API.post('/auth/register', {
          name: formData.name,
          email: formData.email,
          password: formData.password,
        });

        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        setUser(response.data.user);
        window.dispatchEvent(new Event('userChanged'));
        navigateByRole(response.data.user.role);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    const backendUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    window.location.href = `${backendUrl}/auth/google`;
  };

  const switchTab = (toLogin) => {
    setIsLogin(toLogin);
    setError('');
    setFormData({ name: '', email: '', password: '', confirmPassword: '' });
    navigate(toLogin ? '/login' : '/register', { replace: true });
  };

  return (
    <div className="auth-page">
      {/* ==================== LEFT PANEL ==================== */}
      <div className="auth-left">
        {/* Animated abstract shapes */}
        <div className="auth-left__shapes">
          <div className="auth-shape auth-shape--1"></div>
          <div className="auth-shape auth-shape--2"></div>
          <div className="auth-shape auth-shape--3"></div>
          <div className="auth-shape auth-shape--4"></div>
          <div className="auth-shape auth-shape--5"></div>
        </div>

        {/* Floating icons */}
        <div className="auth-left__floaters">
          <div className="auth-floater auth-floater--bus">🚍</div>
          <div className="auth-floater auth-floater--ticket">🎫</div>
          <div className="auth-floater auth-floater--map">📍</div>
          <div className="auth-floater auth-floater--clock">⏱️</div>
        </div>

        <div className="auth-left__content">
          <div className="auth-left__logo">
            <span className="auth-left__logo-mark">PT</span>
            <span className="auth-left__logo-text">Tracker</span>
          </div>

          <h1 className="auth-left__heading">
            Smart Travel<br />Starts Here <span className="auth-left__emoji">🚍</span>
          </h1>

          <p className="auth-left__subtext">
            Track buses, book tickets, and travel smarter with real-time updates.
          </p>

          {/* Feature pills */}
          <div className="auth-left__features">
            <div className="auth-left__feature">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <span>Real-time Tracking</span>
            </div>
            <div className="auth-left__feature">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <span>Smart Booking</span>
            </div>
            <div className="auth-left__feature">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <span>Instant Alerts</span>
            </div>
          </div>
        </div>

        {/* Road illustration at bottom */}
        <div className="auth-left__road">
          <svg viewBox="0 0 600 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="auth-road-svg">
            <path d="M0 40 Q150 10 300 40 Q450 70 600 40" stroke="rgba(255,255,255,0.2)" strokeWidth="3" strokeDasharray="12 8" fill="none"/>
            <path d="M0 55 Q150 25 300 55 Q450 85 600 55" stroke="rgba(255,255,255,0.1)" strokeWidth="2" fill="none"/>
          </svg>
        </div>
      </div>

      {/* ==================== RIGHT PANEL ==================== */}
      <div className="auth-right">
        <div className="auth-card">
          {/* Tab Switcher */}
          <div className="auth-tabs">
            <div
              className="auth-tab-indicator"
              style={{ transform: isLogin ? 'translateX(0)' : 'translateX(100%)' }}
            />
            <button
              className={`auth-tab ${isLogin ? 'active' : ''}`}
              onClick={() => switchTab(true)}
              type="button"
            >
              Login
            </button>
            <button
              className={`auth-tab ${!isLogin ? 'active' : ''}`}
              onClick={() => switchTab(false)}
              type="button"
            >
              Sign Up
            </button>
          </div>

          {/* Dynamic Header */}
          <div className="auth-header">
            <h2 className="auth-title" key={isLogin ? 'login' : 'signup'}>
              {isLogin ? 'Welcome Back 👋' : 'Create Account 🚀'}
            </h2>
            <p className="auth-subtitle">
              {isLogin
                ? 'Login to continue your journey'
                : 'Join us and start tracking smarter'}
            </p>
          </div>

          {/* Role Selector — Only shown on Sign Up (login uses backend role) */}
          {!isLogin && (
            <div className="auth-role-info">
              <div className="auth-role-notice">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
                </svg>
                <span>You'll be registered as a Passenger. Admin and Driver roles are assigned by administrators.</span>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="auth-form" autoComplete="off">
            {/* Name — Sign Up only */}
            {!isLogin && (
              <div className="auth-field">
                <label className="auth-label" htmlFor="auth-name">Full Name</label>
                <div className="auth-input-wrapper">
                  <span className="auth-input-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                  </span>
                  <input
                    id="auth-name"
                    type="text"
                    name="name"
                    className="auth-input"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    required
                    disabled={loading}
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div className="auth-field">
              <label className="auth-label" htmlFor="auth-email">Email Address</label>
              <div className="auth-input-wrapper">
                <span className="auth-input-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2"/>
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                  </svg>
                </span>
                <input
                  id="auth-email"
                  type="email"
                  name="email"
                  className="auth-input"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  required
                  autoComplete="email"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password */}
            <div className="auth-field">
              <label className="auth-label" htmlFor="auth-password">Password</label>
              <div className="auth-input-wrapper">
                <span className="auth-input-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </span>
                <input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  className="auth-input auth-input--has-toggle"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  required
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  disabled={loading}
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password — Sign Up only */}
            {!isLogin && (
              <div className="auth-field">
                <label className="auth-label" htmlFor="auth-confirm-password">Confirm Password</label>
                <div className="auth-input-wrapper">
                  <span className="auth-input-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </span>
                  <input
                    id="auth-confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    className="auth-input auth-input--has-toggle"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm your password"
                    required
                    autoComplete="new-password"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="auth-password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="auth-error" role="alert">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? (
                <>
                  <span className="auth-spinner"></span>
                  <span>Please wait...</span>
                </>
              ) : (
                isLogin ? 'Login' : 'Create Account'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="auth-divider">
            <span>OR continue with</span>
          </div>

          {/* Google Login */}
          <button
            type="button"
            className="auth-google-btn"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
              <path d="M9.003 18c2.43 0 4.467-.806 5.956-2.18L12.05 13.56c-.806.54-1.836.86-3.047.86-2.344 0-4.328-1.584-5.036-3.711H.96v2.332C2.44 15.983 5.485 18 9.003 18z" fill="#34A853"/>
              <path d="M3.964 10.712c-.18-.54-.282-1.117-.282-1.71 0-.593.102-1.17.282-1.71V4.96H.957C.347 6.175 0 7.55 0 9.002c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9.003 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.464.891 11.426 0 9.003 0 5.485 0 2.44 2.017.96 4.958L3.967 7.29c.708-2.127 2.692-3.71 5.036-3.71z" fill="#EA4335"/>
            </svg>
            <span>Continue with Google</span>
          </button>

          {/* Switch Link */}
          <div className="auth-switch">
            {isLogin ? (
              <p>
                Don't have an account?{' '}
                <button type="button" className="auth-switch-link" onClick={() => switchTab(false)}>
                  Sign Up
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <button type="button" className="auth-switch-link" onClick={() => switchTab(true)}>
                  Login
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
