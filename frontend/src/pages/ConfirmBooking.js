import React, { useState } from "react";
import { 
  Container, Typography, Card, CardContent, Button, Box, Divider, 
  CircularProgress, Dialog, DialogContent, Grid, Chip 
} from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import { 
  CheckCircle, 
  ArrowForward,
  LocationOn,
  EventSeat,
  DirectionsBus,
  Schedule
} from "@mui/icons-material";
import API from "../api/api";
import "../styles/ConfirmBooking.css";

export default function ConfirmBooking() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const [loading, setLoading] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);

  if (!state) {
    return (
      <Container className="confirm-booking-container">
        <Box className="error-message">
          <Typography variant="h5">No booking data found</Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            Please start from the booking page
          </Typography>
          <Button variant="contained" sx={{ mt: 2 }} onClick={() => navigate("/book")}>
            Go to Booking
          </Button>
        </Box>
      </Container>
    );
  }

  const { vehicle, routeId, seatNumbers = [], totalFare, boardingStop, droppingStop, date } = state;
  const fromCity = vehicle?.route?.origin || "Source"; 
  const toCity = vehicle?.route?.destination || "Destination";

  const handleConfirm = async () => {
    if (!user) return navigate("/login");
    
    setLoading(true);
    try {
      const payload = {
        userId: user.id || user._id,
        vehicleId: vehicle._id,
        routeId,
        seats: seatNumbers.length,
        seatNumbers,
        totalFare,
        boardingStop,
      };
      await API.post("/bookings", payload);
      setSuccessOpen(true);
    } catch (err) {
      console.error("Booking failed", err);
      alert("Booking failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessClose = () => {
    setSuccessOpen(false);
    navigate("/bookings"); // Note: Assuming /bookings or similar route exists for past bookings.
  };

  return (
    <Container className="checkout-container" maxWidth="lg">
      
      {/* Checkout Header */}
      <Box className="checkout-header">
        <Typography variant="h4" className="checkout-title">Review & Pay</Typography>
        <Typography variant="body2" className="checkout-subtitle">Secure your premium bus tickets</Typography>
      </Box>

      <Grid container spacing={4}>
        
        {/* Left Column - Journey Details */}
        <Grid item xs={12} md={8}>
          <Card className="checkout-card journey-card">
            <CardContent>
              
              {/* Route & Date Header */}
              <Box className="journey-header">
                <Box className="route-tags">
                  <Typography className="city-tag">{boardingStop?.name || fromCity}</Typography>
                  <ArrowForward className="route-arrow" />
                  <Typography className="city-tag">{droppingStop?.name || toCity}</Typography>
                </Box>
                <Typography className="journey-date">
                  <Schedule fontSize="small" /> 
                  {date || new Date().toISOString().split('T')[0]}
                </Typography>
              </Box>

              <Divider className="soft-divider" />

              {/* Vehicle Compact Bar */}
              <Box className="vehicle-compact-bar">
                <DirectionsBus className="vehicle-icon" />
                <Box>
                  <Typography className="vehicle-model">{vehicle.model}</Typography>
                  <Typography className="vehicle-reg">{vehicle.regNumber} • AC Seater/Sleeper</Typography>
                </Box>
              </Box>

              <Divider className="soft-divider" />

              {/* Boarding / Dropping Journey Line */}
              <Box className="journey-timeline">
                <Box className="timeline-stop">
                  <LocationOn color="primary" fontSize="small" />
                  <Box>
                    <Typography className="stop-label">Boarding Point</Typography>
                    <Typography className="stop-name">{boardingStop?.name || "Pending"}</Typography>
                  </Box>
                </Box>
                <Box className="timeline-dots">
                  <span className="dot"></span>
                  <span className="dot"></span>
                  <span className="dot"></span>
                </Box>
                <Box className="timeline-stop">
                  <LocationOn color="error" fontSize="small" />
                  <Box>
                    <Typography className="stop-label">Dropping Point</Typography>
                    <Typography className="stop-name">{droppingStop?.name || "Pending"}</Typography>
                  </Box>
                </Box>
              </Box>

              <Divider className="soft-divider" />

              {/* Seat Compact View */}
              <Box className="seats-compact-view">
                <Box className="seats-header">
                  <EventSeat className="seats-icon" />
                  <Typography className="seats-title">Selected Seats ({seatNumbers.length})</Typography>
                </Box>
                <Box className="seats-chip-container">
                  {seatNumbers.map((seat) => (
                    <Chip key={seat} label={seat} className="seat-chip" color="primary" variant="outlined" />
                  ))}
                </Box>
              </Box>

            </CardContent>
          </Card>
        </Grid>

        {/* Right Column - Fare Summary & Payment */}
        <Grid item xs={12} md={4}>
          <Box className="sticky-summary">
            <Card className="checkout-card fare-card">
              <CardContent>
                <Typography className="fare-title">Fare Summary</Typography>
                
                <Box className="fare-row">
                  <Typography className="fare-label">Base Fare ({seatNumbers.length} seats)</Typography>
                  <Typography className="fare-value">₹{totalFare}</Typography>
                </Box>
                
                <Box className="fare-row">
                  <Typography className="fare-label">Taxes & Fees</Typography>
                  <Typography className="fare-value green-text">Included</Typography>
                </Box>
                
                <Divider sx={{ my: 2 }} />
                
                <Box className="fare-row total-row">
                  <Typography className="fare-label total">Total Amount</Typography>
                  <Typography className="fare-value total">₹{totalFare}</Typography>
                </Box>
              </CardContent>
            </Card>

            {/* Desktop & Sticky Mobile CTA */}
            <Box className="payment-action-wrapper">
              <Button 
                variant="contained" 
                className="premium-pay-btn"
                onClick={handleConfirm}
                disabled={loading}
                fullWidth
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : (
                  <>
                    Pay ₹{totalFare} <ArrowForward className="btn-arrow" />
                  </>
                )}
              </Button>
              <Typography className="secure-payment-note">
                🔒 Safe and secure automated payment
              </Typography>
            </Box>

          </Box>
        </Grid>
      </Grid>

      {/* Success Popup */}
      <Dialog
        open={successOpen}
        onClose={handleSuccessClose}
        PaperProps={{
          sx: {
            borderRadius: "20px",
            padding: "32px",
            textAlign: "center",
            minWidth: "360px",
            background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
            boxShadow: "0 20px 50px rgba(34, 197, 94, 0.2)"
          },
        }}
      >
        <DialogContent sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
          <CheckCircle sx={{ fontSize: 80, color: "#22c55e", animation: "popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)" }} />
          <Typography variant="h4" sx={{ fontWeight: 800, color: "#166534", mt: 1 }}>
            Booking Confirmed!
          </Typography>
          <Typography variant="body1" sx={{ color: "#15803d", fontWeight: 500, mb: 1 }}>
            Your {seatNumbers.length} seats have been successfully reserved. Have a premium journey!
          </Typography>
          <Button
            variant="contained"
            onClick={handleSuccessClose}
            sx={{
              mt: 2,
              borderRadius: "12px",
              textTransform: "none",
              fontWeight: 700,
              fontSize: "1.1rem",
              width: '100%',
              py: 1.5,
              background: "linear-gradient(135deg, #22c55e, #16a34a)",
              boxShadow: "0 8px 20px rgba(34, 197, 94, 0.3)",
              "&:hover": { background: "linear-gradient(135deg, #16a34a, #15803d)" },
            }}
          >
            View My Bookings
          </Button>
        </DialogContent>
      </Dialog>
    </Container>
  );
}