import React from "react";
import "../../styles/DriverNoAssignment.css";

export default function DriverNoAssignment() {
  return (
    <div className="no-assignment-container">
      <div className="no-assignment-card">
        <div className="icon-container">
          <div className="icon-circle">
            <span className="icon">🚗</span>
          </div>
          <div className="icon-waves">
            <div className="wave wave-1"></div>
            <div className="wave wave-2"></div>
            <div className="wave wave-3"></div>
          </div>
        </div>
        
        <h2 className="no-assignment-title">No Vehicle Assigned Yet</h2>
        <p className="no-assignment-message">
          You haven't been assigned a vehicle yet. Please contact the administrator to get your vehicle assignment.
        </p>
        
        <div className="contact-info">
          <div className="info-item">
            <span className="info-icon">📧</span>
            <span className="info-text">Contact your administrator</span>
          </div>
          <div className="info-item">
            <span className="info-icon">⏰</span>
            <span className="info-text">Assignment pending</span>
          </div>
        </div>
      </div>
    </div>
  );
}