import React from "react";
import { useNavigate } from "react-router-dom";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: "calc(100vh - 80px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: "6rem", marginBottom: "1rem", opacity: 0.8 }}>
        🚌💨
      </div>
      <h1
        style={{
          fontSize: "clamp(3rem, 8vw, 6rem)",
          fontWeight: 800,
          background: "linear-gradient(135deg, #d84e55, #f06268)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          margin: "0 0 0.5rem 0",
          lineHeight: 1.1,
        }}
      >
        404
      </h1>
      <p
        style={{
          fontSize: "1.5rem",
          fontWeight: 600,
          color: "var(--color-text-primary)",
          margin: "0 0 0.75rem 0",
        }}
      >
        Page Not Found
      </p>
      <p
        style={{
          fontSize: "1rem",
          color: "var(--color-text-secondary)",
          maxWidth: "400px",
          lineHeight: 1.6,
          margin: "0 0 2rem 0",
        }}
      >
        Looks like this bus took a wrong turn. The page you're looking for
        doesn't exist or has been moved.
      </p>
      <button
        onClick={() => navigate("/")}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.5rem",
          padding: "0.875rem 2rem",
          background: "linear-gradient(135deg, #d84e55, #f06268)",
          color: "white",
          border: "none",
          borderRadius: "1rem",
          fontSize: "1rem",
          fontWeight: 600,
          fontFamily: "var(--font-primary)",
          cursor: "pointer",
          boxShadow: "0 8px 24px rgba(216, 78, 85, 0.25)",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          textDecoration: "none",
        }}
        onMouseEnter={(e) => {
          e.target.style.transform = "translateY(-2px)";
          e.target.style.boxShadow =
            "0 12px 32px rgba(216, 78, 85, 0.35)";
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = "translateY(0)";
          e.target.style.boxShadow =
            "0 8px 24px rgba(216, 78, 85, 0.25)";
        }}
      >
        ← Go Home
      </button>
    </div>
  );
};

export default NotFound;
