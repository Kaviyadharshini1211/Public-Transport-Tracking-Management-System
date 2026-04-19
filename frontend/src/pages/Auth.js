import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import '../styles/Auth.css';

const API_URL = process.env.REACT_APP_API_URL;

const Auth = ({ setUser }) => {
  const location = useLocation();
  const [isLogin, setIsLogin] = useState(location.pathname !== '/register');
  const [role, setRole] = useState('passenger');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: ''
  });

  const [requirePhone, setRequirePhone] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // ✅ Detect Google login missing phone
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && !user.phone) {
      setRequirePhone(true);
    }
  }, []);

  const validatePhone = (phone) => /^[6-9]\d{9}$/.test(phone);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      // Only allow digits, max 10
      const digits = value.replace(/\D/g, '').slice(0, 10);
      setFormData({ ...formData, phone: digits });
      if (digits.length > 0 && !validatePhone(digits)) {
        setPhoneError('Enter a valid 10-digit Indian mobile number (starts with 6–9)');
      } else {
        setPhoneError('');
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // CASE 1: Google user adding phone
      if (requirePhone) {
        if (!validatePhone(formData.phone)) {
          setPhoneError('Enter a valid 10-digit Indian mobile number (starts with 6–9)');
          setLoading(false);
          return;
        }
        const token = localStorage.getItem('token');
        const fullPhone = `+91${formData.phone}`;

        await axios.put(
          `${API_URL}/auth/update-phone`,
          { phone: fullPhone },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const user = JSON.parse(localStorage.getItem('user'));
        user.phone = fullPhone;
        localStorage.setItem('user', JSON.stringify(user));

        window.dispatchEvent(new Event('userChanged'));
        setRequirePhone(false);
        navigate('/dashboard');
        return;
      }

      if (isLogin) {
        // Login
        const response = await axios.post(`${API_URL}/auth/login`, {
          email: formData.email,
          password: formData.password,
          role
        });

        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        setUser(response.data.user);
        window.dispatchEvent(new Event('userChanged'));

        // Force phone if missing
        if (!response.data.user.phone) {
          setRequirePhone(true);
          setLoading(false);
          return;
        }

        if (role === 'admin') navigate('/admin');
        else if (role === 'driver') navigate('/driver');
        else navigate('/dashboard');

      } else {
        // Register
        if (!formData.phone) {
          setPhoneError('Phone number is required');
          setLoading(false);
          return;
        }

        if (!validatePhone(formData.phone)) {
          setPhoneError('Enter a valid 10-digit Indian mobile number (starts with 6–9)');
          setLoading(false);
          return;
        }

        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }

        const response = await axios.post(`${API_URL}/auth/register`, {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          phone: `+91${formData.phone}`,
          role
        });

        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        setUser(response.data.user);
        window.dispatchEvent(new Event('userChanged'));

        navigate('/dashboard');
      }

    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${API_URL}/auth/google`;
  };

  return (
    <div className="auth-container">
      <div className="auth-card liquid-glass-card">

        {/* PHONE ONLY MODE (Google OAuth users) */}
        {requirePhone ? (
          <form onSubmit={handleSubmit} className="auth-form">
            <h2 className="auth-title">Complete Your Profile</h2>
            <p className="auth-subtitle">Please add your phone number to continue</p>

            <div className="form-group">
              <label>Phone Number</label>
              <div className="phone-input-wrapper">
                <span className="phone-prefix">+91</span>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="10-digit mobile number"
                  maxLength={10}
                  required
                />
              </div>
              {phoneError && (
                <p className="phone-error-text">⚠️ {phoneError}</p>
              )}
            </div>

            {error && (
              <div className="error-message">
                <span className="error-icon">⚠️</span>
                {error}
              </div>
            )}

            <button type="submit" className="submit-button" disabled={loading}>
              {loading ? <span className="spinner"></span> : null}
              {loading ? 'Saving...' : 'Save Phone'}
            </button>
          </form>
        ) : (
          <>
            {/* ORIGINAL UI (UNCHANGED) */}

            <div className="auth-tabs">
              <button
                className={`auth-tab ${isLogin ? 'active' : ''}`}
                onClick={() => {
                  setIsLogin(true);
                  setError('');
                }}
              >
                Login
              </button>
              <button
                className={`auth-tab ${!isLogin ? 'active' : ''}`}
                onClick={() => {
                  setIsLogin(false);
                  setError('');
                }}
              >
                Register
              </button>
            </div>

            <h1 className="auth-title">
              {isLogin ? 'Welcome Back! 👋' : 'Create Account 🚀'}
            </h1>

            <p className="auth-subtitle">
              {isLogin
                ? `Login as ${role.charAt(0).toUpperCase() + role.slice(1)}`
                : 'Join us today'}
            </p>

            <div className="role-switcher">
              <button className={role === 'passenger' ? 'active' : ''} onClick={() => setRole('passenger')}>
                🚶 Passenger
              </button>
              <button className={role === 'driver' ? 'active' : ''} onClick={() => setRole('driver')}>
                🚗 Driver
              </button>
              <button className={role === 'admin' ? 'active' : ''} onClick={() => setRole('admin')}>
                👨‍💼 Admin
              </button>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">

              {!isLogin && (
                <>
                  <div className="form-group">
                    <label>Full Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Enter your name"
                      required
                    />
                  </div>

                  {/* PHONE FIELD */}
                  <div className="form-group">
                    <label>Phone Number</label>
                    <div className="phone-input-wrapper">
                      <span className="phone-prefix">+91</span>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="10-digit mobile number"
                        maxLength={10}
                        required
                      />
                    </div>
                    {phoneError && (
                      <p className="phone-error-text">⚠️ {phoneError}</p>
                    )}
                  </div>
                </>
              )}

              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  required
                />
              </div>

              {!isLogin && (
                <div className="form-group">
                  <label>Confirm Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm your password"
                    required
                  />
                </div>
              )}

              {error && (
                <div className="error-message">
                  <span className="error-icon">⚠️</span>
                  {error}
                </div>
              )}

              <button type="submit" className="submit-button" disabled={loading}>
                {loading ? <span className="spinner"></span> : null}
                {loading ? 'Please wait...' : isLogin ? 'Login' : 'Create Account'}
              </button>

            </form>

            <div className="google-login-container">
              <button onClick={handleGoogleLogin} className="google-login-btn">
                <span className="google-icon">G</span>
                Continue with Google
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
};

export default Auth;