import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import '../styles/Auth.css';

const API_URL = process.env.REACT_APP_API_URL;

const Auth = ({ setUser }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState(location.pathname !== '/register');
  const [role, setRole] = useState('passenger');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Allow only numbers in phone
    if (name === 'phone' && !/^\d*$/.test(value)) return;

    setFormData({ ...formData, [name]: value });
    setError('');
  };

  const validateRegister = () => {
    const { name, email, phone, password, confirmPassword } = formData;

    if (!name || !email || !phone || !password || !confirmPassword) {
      return "All fields are required";
    }

    if (!/^[A-Za-z ]{3,}$/.test(name)) {
      return "Name must be at least 3 characters";
    }

    if (!/^[6-9]\d{9}$/.test(phone)) {
      return "Enter valid 10-digit Indian mobile number";
    }

    if (password.length < 6) {
      return "Password must be at least 6 characters";
    }

    if (password !== confirmPassword) {
      return "Passwords do not match";
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const response = await axios.post(`${API_URL}/api/auth/login`, {
          email: formData.email,
          password: formData.password,
          role
        });

        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        setUser(response.data.user);
        window.dispatchEvent(new Event('userChanged'));

        if (role === 'admin') navigate('/admin');
        else if (role === 'driver') navigate('/driver');
        else navigate('/dashboard');

      } else {
        const validationError = validateRegister();
        if (validationError) {
          setError(validationError);
          setLoading(false);
          return;
        }

        const response = await axios.post(`${API_URL}/api/auth/register`, {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
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
    window.location.href = `${API_URL}/api/auth/google`;
  };

  return (
    <div className="auth-container">
      <div className="auth-card liquid-glass-card">

        {/* Tabs */}
        <div className="auth-tabs">
          <button
            className={`auth-tab ${isLogin ? 'active' : ''}`}
            onClick={() => { setIsLogin(true); setError(''); }}
          >
            Login
          </button>
          <button
            className={`auth-tab ${!isLogin ? 'active' : ''}`}
            onClick={() => { setIsLogin(false); setError(''); }}
          >
            Register
          </button>
        </div>

        <h1 className="auth-title">
          {isLogin ? 'Welcome Back 👋' : 'Create Account 🚀'}
        </h1>

        <p className="auth-subtitle">
          {isLogin
            ? `Login as ${role.charAt(0).toUpperCase() + role.slice(1)}`
            : 'Join PT Tracker today'}
        </p>

        {/* Role Switcher */}
        <div className="role-switcher">
          <button className={role === 'passenger' ? 'active' : ''} onClick={() => setRole('passenger')}>🚶 Passenger</button>
          <button className={role === 'driver' ? 'active' : ''} onClick={() => setRole('driver')}>🚗 Driver</button>
          <button className={role === 'admin' ? 'active' : ''} onClick={() => setRole('admin')}>👨‍💼 Admin</button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">

          {!isLogin && (
            <>
              <div className="form-group">
                <label>Full Name</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Enter your name" />
              </div>

              <div className="form-group">
                <label>Phone Number</label>
                <div className="phone-wrapper">
                  <span className="country-code">+91</span>
                  <input type="tel" name="phone" value={formData.phone} onChange={handleChange} maxLength="10" placeholder="Enter 10-digit number" />
                </div>
              </div>
            </>
          )}

          <div className="form-group">
            <label>Email Address</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Enter your email" required />
          </div>

          <div className="form-group password-wrapper">
            <label>Password</label>
            <input type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleChange} placeholder="Enter your password" required />
            <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? "🙈" : "👁"}
            </button>
          </div>

          {!isLogin && (
            <div className="form-group password-wrapper">
              <label>Confirm Password</label>
              <input type={showConfirm ? "text" : "password"} name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="Confirm password" />
              <button type="button" className="password-toggle" onClick={() => setShowConfirm(!showConfirm)}>
                {showConfirm ? "🙈" : "👁"}
              </button>
            </div>
          )}

          {error && <div className="error-message">⚠️ {error}</div>}

          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? "Please wait..." : isLogin ? "Login" : "Create Account"}
          </button>
        </form>

        <div className="google-login-container">
          <button onClick={handleGoogleLogin} className="google-login-btn">
            Continue with Google
          </button>
        </div>

      </div>
    </div>
  );
};

export default Auth;
