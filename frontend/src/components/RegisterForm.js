import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api";
import "../styles/RegisterForm.css";

const RegisterForm = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState(""); // ✅ NEW
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    // ✅ Basic frontend validation
    if (!/^[6-9]\d{9}$/.test(phone)) {
      setError("Enter valid 10-digit Indian mobile number");
      return;
    }

    setLoading(true);

    try {
      await API.post("/auth/register", {
        name,
        email,
        password,
        phone, // ✅ Send phone to backend
      });

      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <h1 className="register-title">Create Account</h1>
        <p className="register-subtitle">Join us today</p>

        <form onSubmit={handleRegister} className="register-form">

          {/* NAME */}
          <div className="form-group">
            <label htmlFor="name" className="form-label">Name</label>
            <input
              id="name"
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              required
            />
          </div>

          {/* EMAIL */}
          <div className="form-group">
            <label htmlFor="email" className="form-label">Email</label>
            <input
              id="email"
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>

          {/* PHONE */}
          <div className="form-group">
            <label htmlFor="phone" className="form-label">Phone Number</label>
            <div style={{ display: "flex" }}>
              <span
                style={{
                  padding: "10px",
                  background: "#eee",
                  border: "1px solid #ccc",
                  borderRight: "none",
                  display: "flex",
                  alignItems: "center"
                }}
              >
                +91
              </span>
              <input
                id="phone"
                type="tel"
                className="form-input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter 10-digit number"
                maxLength={10}
                required
                style={{ borderLeft: "none" }}
              />
            </div>
          </div>

          {/* PASSWORD */}
          <div className="form-group">
            <label htmlFor="password" className="form-label">Password</label>
            <input
              id="password"
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a password"
              required
            />
          </div>

          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="submit-button"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Registering...
              </>
            ) : (
              "Register"
            )}
          </button>
        </form>

        <div className="login-link">
          Already have an account?{" "}
          <button
            type="button"
            className="link-button"
            onClick={() => navigate("/login")}
          >
            Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;
