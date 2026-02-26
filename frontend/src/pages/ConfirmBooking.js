// src/pages/ConfirmBooking.jsx
import React, { useState } from "react";
import { Container, Typography, Card, CardContent, Button, Box, Divider, CircularProgress } from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import { 
  CheckCircle, 
  DirectionsBus, 
  Person, 
  EventSeat, 
  AccountBalanceWallet,
  LocationOn,
  Route as RouteIcon
} from "@mui/icons-material";
import API from "../api/api";
import "../styles/ConfirmBooking.css";

export default function ConfirmBooking() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const [loading, setLoading] = useState(false);

  if (!state) {
    return (
      <Container className="confirm-booking-container">
        <Box className="error-message">
          <Typography variant="h5">No booking data found</Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            Please start from the booking page
          </Typography>
          <Button 
            variant="contained" 
            sx={{ mt: 2 }} 
            onClick={() => navigate("/book")}
          >
            Go to Booking
          </Button>
        </Box>
      </Container>
    );
  }

  const { vehicle, routeId, seatNumbers = [], totalFare, boardingStop } = state;

  const handleConfirm = async () => {
    if (!user) return navigate("/login");
    
    setLoading(true);
    try {
      const payload = {
        userId: user?._id || user?.id,
        vehicleId: vehicle._id,
        routeId,
        seats: seatNumbers.length,
        seatNumbers,
        totalFare,
        boardingStop,
      };
      const res = await API.post("/bookings", payload);
      navigate("/bookings");
    } catch (err) {
      console.error("Booking failed", err);
      alert("Booking failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="confirm-booking-container">
      <Box className="confirm-header">
        <CheckCircle className="confirm-icon" />
        <Typography variant="h4" className="confirm-title">
          Confirm Your Booking
        </Typography>
        <Typography variant="body2" className="confirm-subtitle">
          Review your booking details before confirming
        </Typography>
      </Box>

      <Card className="booking-details-card">
        <CardContent>
          {/* Vehicle Information */}
          <Box className="detail-section">
            <Box className="section-header">
              <DirectionsBus className="section-icon" />
              <Typography variant="h6" className="section-title">
                Vehicle Details
              </Typography>
            </Box>
            <Box className="detail-row">
              <Typography className="detail-label">Registration</Typography>
              <Typography className="detail-value">{vehicle.regNumber}</Typography>
            </Box>
            <Box className="detail-row">
              <Typography className="detail-label">Model</Typography>
              <Typography className="detail-value">{vehicle.model}</Typography>
            </Box>
          </Box>

          <Divider className="section-divider" />

          {/* Driver Information */}
          <Box className="detail-section">
            <Box className="section-header">
              <Person className="section-icon" />
              <Typography variant="h6" className="section-title">
                Driver Information
              </Typography>
            </Box>
            <Box className="detail-row">
              <Typography className="detail-label">Driver Name</Typography>
              <Typography className="detail-value">
                {vehicle.driverName || "Not Assigned"}
              </Typography>
            </Box>
          </Box>

          <Divider className="section-divider" />

          {/* Route Information */}
          <Box className="detail-section">
            <Box className="section-header">
              <RouteIcon className="section-icon" />
              <Typography variant="h6" className="section-title">
                Route Details
              </Typography>
            </Box>
            <Box className="detail-row">
              <Typography className="detail-label">Route ID</Typography>
              <Typography className="detail-value">{routeId}</Typography>
            </Box>
            <Box className="detail-row">
              <Typography className="detail-label">Boarding Point</Typography>
              <Typography className="detail-value boarding-stop">
                <LocationOn sx={{ fontSize: 18, mr: 0.5 }} />
                {boardingStop ? boardingStop.name : "Not Selected"}
              </Typography>
            </Box>
          </Box>

          <Divider className="section-divider" />

          {/* Seat Information */}
          <Box className="detail-section">
            <Box className="section-header">
              <EventSeat className="section-icon" />
              <Typography variant="h6" className="section-title">
                Seat Selection
              </Typography>
            </Box>
            <Box className="seats-display">
              {seatNumbers.map((seat) => (
                <Box key={seat} className="seat-badge">
                  {seat}
                </Box>
              ))}
            </Box>
            <Typography className="seat-count">
              {seatNumbers.length} {seatNumbers.length === 1 ? "seat" : "seats"} selected
            </Typography>
          </Box>

          <Divider className="section-divider" />

          {/* Fare Summary */}
          <Box className="detail-section fare-section">
            <Box className="section-header">
              <AccountBalanceWallet className="section-icon" />
              <Typography variant="h6" className="section-title">
                Fare Summary
              </Typography>
            </Box>
            <Box className="fare-breakdown">
              <Box className="fare-row">
                <Typography className="fare-label">
                  Base Fare ({seatNumbers.length} × ₹{(totalFare / seatNumbers.length).toFixed(2)})
                </Typography>
                <Typography className="fare-amount">₹{totalFare}</Typography>
              </Box>
              <Box className="fare-row">
                <Typography className="fare-label">Service Tax</Typography>
                <Typography className="fare-amount">₹0</Typography>
              </Box>
              <Divider sx={{ my: 1.5 }} />
              <Box className="fare-row total-fare">
                <Typography className="fare-label total">Total Amount</Typography>
                <Typography className="fare-amount total">₹{totalFare}</Typography>
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Box className="action-buttons">
        <Button 
          variant="outlined" 
          className="cancel-button"
          onClick={() => navigate(-1)}
          disabled={loading}
        >
          Go Back
        </Button>
        <Button 
          variant="contained" 
          className="confirm-button"
          onClick={handleConfirm}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : <CheckCircle />}
        >
          {loading ? "Processing..." : "Confirm & Pay"}
        </Button>
      </Box>

      {/* Payment Note */}
      <Box className="payment-note">
        <Typography variant="caption">
          * This is a simulated payment. No actual charges will be made.
        </Typography>
      </Box>
    </Container>
  );
}