import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api";
import "../styles/LoginForm.css";
import LoadingSpinner from "./LoadingSpinner";

const LoginForm = ({ setUser }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState("passenger");

  const navigate = useNavigate();
  const backendURL = process.env.REACT_APP_API_URL;

  const handleGoogleLogin = () => {
    if (role !== "passenger") {
      setError("Google login is only available for passengers.");
      return;
    }
    window.location.href = `${backendURL}/auth/google`;
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await API.post("/auth/login", { email, password });
      const user = res.data.user;

      // Ensure role matches selected role
      if (user.role !== role) {
        setError(`Invalid role. You are registered as: ${user.role}`);
        setLoading(false);
        return;
      }

      setUser(user);
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("token", res.data.token);

      // Show success briefly before redirect
      setTimeout(() => {
        // Redirect based on role
        if (user.role === "admin") navigate("/admin");
        else if (user.role === "driver") navigate("/driver");
        else navigate("/dashboard");
      }, 500);

    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">

        <h1 className="login-title">
          Welcome Back! 👋
        </h1>
        <p className="login-subtitle">
          Login as {role.charAt(0).toUpperCase() + role.slice(1)}
        </p>

        {/* ROLE SELECTOR */}
        <div className="role-switcher">
          <button
            type="button"
            className={role === "passenger" ? "active-role" : ""}
            onClick={() => setRole("passenger")}
            aria-pressed={role === "passenger"}
          >
            🚶 Passenger
          </button>
          <button
            type="button"
            className={role === "driver" ? "active-role" : ""}
            onClick={() => setRole("driver")}
            aria-pressed={role === "driver"}
          >
            🚗 Driver
          </button>
          <button
            type="button"
            className={role === "admin" ? "active-role" : ""}
            onClick={() => setRole("admin")}
            aria-pressed={role === "admin"}
          >
            👨‍💼 Admin
          </button>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label htmlFor="email" className="form-label">Email Address</label>
            <input
              id="email"
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              autoComplete="email"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">Password</label>
            <div className="password-input-wrapper">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
                disabled={loading}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={togglePasswordVisibility}
                aria-label={showPassword ? "Hide password" : "Show password"}
                disabled={loading}
              >
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
          </div>

          {error && (
            <div className="error-message" role="alert">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? (
              <>
                <LoadingSpinner size="sm" color="white" />
                <span style={{ marginLeft: '8px' }}>Logging in...</span>
              </>
            ) : (
              "Login"
            )}
          </button>
        </form>

        {/* GOOGLE LOGIN FOR PASSENGERS ONLY */}
        {role === "passenger" && (
          <div className="google-login-container">
            <div className="divider">
              <span>or</span>
            </div>
            <button 
              type="button"
              className="google-login-btn" 
              onClick={handleGoogleLogin}
              disabled={loading}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                <path d="M9.003 18c2.43 0 4.467-.806 5.956-2.18L12.05 13.56c-.806.54-1.836.86-3.047.86-2.344 0-4.328-1.584-5.036-3.711H.96v2.332C2.44 15.983 5.485 18 9.003 18z" fill="#34A853"/>
                <path d="M3.964 10.712c-.18-.54-.282-1.117-.282-1.71 0-.593.102-1.17.282-1.71V4.96H.957C.347 6.175 0 7.55 0 9.002c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9.003 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.464.891 11.426 0 9.003 0 5.485 0 2.44 2.017.96 4.958L3.967 7.29c.708-2.127 2.692-3.71 5.036-3.71z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>
          </div>
        )}

        <div className="register-link">
          New {role === "passenger" ? "Passenger" : "User"}?{" "}
          <button 
            type="button" 
            className="link-button" 
            onClick={() => navigate("/register")}
            disabled={loading}
          >
            Register here
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
