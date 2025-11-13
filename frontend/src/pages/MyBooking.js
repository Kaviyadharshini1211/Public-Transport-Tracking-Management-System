// src/pages/MyBookings.jsx
import React, { useEffect, useState } from "react";
import {
  Typography,
  Card,
  CardContent,
  Button,
  CircularProgress,
} from "@mui/material";

import DirectionsBusIcon from "@mui/icons-material/DirectionsBus";
import RouteIcon from "@mui/icons-material/Route";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import EventSeatIcon from "@mui/icons-material/EventSeat";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import ConfirmationNumberIcon from "@mui/icons-material/ConfirmationNumber";

import API from "../api/api";
import { useNavigate } from "react-router-dom";
import BookingAlertToggle from "../components/BookingAlertToggle";

import "../styles/MyBooking.css";

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  // Read user ONCE (outside state)
  const user = JSON.parse(localStorage.getItem("user") || "null");

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    API.get(`/bookings/user/${user._id}`)
      .then((res) => {
        setBookings(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });

  }, []); // <--- FIXED: Removed `user` to stop infinite requests

  // User not logged in
  if (!user) {
    return (
      <div className="my-bookings-container">
        <div className="login-prompt">
          <AccountCircleIcon className="login-icon" />
          <Typography variant="h5" className="empty-title">
            Please Login
          </Typography>
          <Typography className="empty-subtitle">
            You need to be logged in to view your bookings
          </Typography>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="my-bookings-container">
        <div className="loading-container">
          <CircularProgress size={60} />
        </div>
      </div>
    );
  }

  // Empty bookings state
  if (bookings.length === 0) {
    return (
      <div className="my-bookings-container">
        <div className="bookings-header">
          <Typography variant="h4" className="bookings-title">
            My Bookings
          </Typography>
          <Typography className="bookings-subtitle">
            View and track all your bus bookings
          </Typography>
        </div>

        <div className="empty-state">
          <ConfirmationNumberIcon className="empty-icon" />
          <Typography variant="h5" className="empty-title">
            No Bookings Yet
          </Typography>
          <Typography className="empty-subtitle">
            You haven't made any bookings. Start by searching for buses!
          </Typography>
        </div>
      </div>
    );
  }

  // Display bookings
  return (
    <div className="my-bookings-container">
      <div className="bookings-header">
        <Typography variant="h4" className="bookings-title">
          My Bookings
        </Typography>
        <Typography className="bookings-subtitle">
          {bookings.length} {bookings.length === 1 ? "booking" : "bookings"} found
        </Typography>
      </div>

      <div className="bookings-grid">
        {bookings.map((booking) => (
          <Card key={booking._id} className="booking-card">
            <CardContent className="booking-card-content">

              {/* Header */}
              <div className="booking-header">
                <Typography className="booking-id">
                  #{booking._id.slice(-8).toUpperCase()}
                </Typography>
                <Typography className="booking-status">Confirmed</Typography>
              </div>

              {/* Vehicle */}
              <div className="booking-detail">
                <DirectionsBusIcon className="detail-icon" />
                <div className="detail-content">
                  <Typography className="detail-label">Vehicle</Typography>
                  <Typography className="detail-text">
                    {booking.vehicleId?.regNumber || "Not Available"}
                  </Typography>
                </div>
              </div>

              {/* Route */}
              <div className="booking-detail">
                <RouteIcon className="detail-icon" />
                <div className="detail-content">
                  <Typography className="detail-label">Route</Typography>
                  <Typography className="detail-text">
                    {booking.routeId?.name || "Not Available"}
                  </Typography>
                </div>
              </div>

              {/* Boarding Stop */}
              <div className="booking-detail">
                <LocationOnIcon className="detail-icon" />
                <div className="detail-content">
                  <Typography className="detail-label">Boarding Stop</Typography>
                  <Typography className="detail-text">
                    {booking.boardingStop?.name || "Not Specified"}
                  </Typography>
                </div>
              </div>

              {/* Seats */}
              <div className="booking-detail">
                <EventSeatIcon className="detail-icon" />
                <div className="detail-content">
                  <Typography className="detail-label">Seats</Typography>
                  <div className="seats-info">
                    {booking.seatNumbers?.length > 0 ? (
                      booking.seatNumbers.map((seat, idx) => (
                        <span key={idx} className="seat-chip">
                          {seat}
                        </span>
                      ))
                    ) : (
                      <Typography className="detail-text">
                        {booking.seats}
                      </Typography>
                    )}
                  </div>
                </div>
              </div>

              {/* Fare */}
              <div className="fare-info">
                <Typography className="fare-label">Total Fare</Typography>
                <Typography className="fare-amount">
                  ₹{booking.totalFare}
                </Typography>
              </div>

              {/* ⭐ Email Alert Toggle */}
              <div style={{ marginTop: 10 }}>
                <Typography className="detail-label">Email Alerts</Typography>
                <BookingAlertToggle booking={booking} />
              </div>

              {/* Track Button */}
              <Button
                variant="contained"
                className="track-button"
                onClick={() =>
                  navigate(
                    `/track/${booking.vehicleId?._id}?bookingId=${booking._id}`
                  )
                }
                disabled={!booking.vehicleId?._id}
              >
                Track Bus
              </Button>

            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
