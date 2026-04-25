// src/pages/MyBookings.jsx
import React, { useEffect, useState } from "react";
import {
  Typography,
  Card,
  CardContent,
  Button,
} from "@mui/material";

import DirectionsBusIcon from "@mui/icons-material/DirectionsBus";
import RouteIcon from "@mui/icons-material/Route";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import EventSeatIcon from "@mui/icons-material/EventSeat";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";

import API from "../api/api";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import BookingAlertToggle from "../components/BookingAlertToggle";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";
import ConfirmationModal from "../components/ConfirmationModal";

import "../styles/MyBooking.css";

export default function MyBookings() {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [modalConfig, setModalConfig] = useState({ isOpen: false, bookingId: null });



  const navigate = useNavigate();

  const fetchBookings = () => {
    if (!user?._id && !user?.id) {
      setLoading(false);
      return;
    }

    API.get(`/bookings/user/${user?._id || user?.id}`)
      .then((res) => {
        setBookings(res.data);
        setLoading(false);
      })

      .catch((err) => {
        console.error(err);
        setLoading(false);
        toast.error("Failed to load bookings");
      });
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancelClick = (id) => {
    setModalConfig({ isOpen: true, bookingId: id });
  };

  const handleConfirmCancel = async () => {
    setCancelLoading(true);
    try {
      await API.put(`/bookings/cancel/${modalConfig.bookingId}`);
      toast.success("Booking cancelled successfully!");
      fetchBookings(); // Refresh list
    } catch (err) {
      console.error("Cancel error:", err);
      toast.error(err.response?.data?.message || "Failed to cancel booking");
    } finally {
      setCancelLoading(false);
      setModalConfig({ isOpen: false, bookingId: null });
    }
  };


  // User not logged in
  if (!user) {
    return (
      <div className="my-bookings-container">
        <EmptyState
          icon="🔒"
          title="Please Login"
          message="You need to be logged in to view your bookings"
          actionText="Go to Login"
          onAction={() => navigate("/login")}
        />
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="my-bookings-container">
        <LoadingSpinner fullscreen={true} size="lg" />
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

        <EmptyState
          icon="🎫"
          title="No Bookings Yet"
          message="You haven't made any bookings. Start by searching for buses!"
          actionText="Book a Ticket"
          onAction={() => navigate("/book")}
        />
      </div>
    );
  }

  // Display bookings
  return (
    <>
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
          <Card key={booking._id} className={`booking-card ${booking.status === 'Cancelled' ? 'cancelled' : ''}`}>
            <CardContent className="booking-card-content">
              
              <div className="ticket-top">
                <div className="booking-header">
                  <Typography className="booking-id">
                    #{booking._id.slice(-8).toUpperCase()}
                  </Typography>
                  <Typography className={`booking-status status-${booking.status.toLowerCase()}`}>
                    {booking.status}
                  </Typography>
                </div>

                <div className="booking-detail">
                  <DirectionsBusIcon className="detail-icon" />
                  <div className="detail-content">
                    <Typography className="detail-label">Vehicle & Route</Typography>
                    <Typography className="detail-text">
                      {booking.routeId?.name || (booking.vehicleId?.regNumber || "Bus Service")}
                    </Typography>
                  </div>
                </div>

                <div className="booking-detail">
                  <LocationOnIcon className="detail-icon" />
                  <div className="detail-content">
                    <Typography className="detail-label">Boarding Point</Typography>
                    <Typography className="detail-text">
                      {booking.boardingStop?.name || "Standard Stop"}
                    </Typography>
                  </div>
                </div>

                <div className="booking-detail">
                  <EventSeatIcon className="detail-icon" />
                  <div className="detail-content">
                    <Typography className="detail-label">Seats Selection</Typography>
                    <div className="seats-info">
                      {booking.seatNumbers?.length > 0 ? (
                        booking.seatNumbers.map((seat, idx) => (
                          <span key={idx} className="seat-chip">
                            {seat}
                          </span>
                        ))
                      ) : (
                        <Typography className="detail-text">
                          {booking.seats} Seats
                        </Typography>
                      )}
                    </div>
                  </div>
                </div>

                <div className="fare-info">
                  <Typography className="fare-label">Total Fare Paid</Typography>
                  <Typography className="fare-amount">
                    ₹{booking.totalFare}
                  </Typography>
                </div>
              </div>

              <div className="ticket-divider"></div>

              <div className="ticket-bottom">
                <div className="booking-alerts" style={{ marginBottom: '1rem' }}>
                  <Typography className="detail-label" style={{ marginBottom: '0.5rem' }}>Live ETA Alerts</Typography>
                  <BookingAlertToggle booking={booking} />
                </div>

                <div className="booking-actions">
                  <Button
                    variant="contained"
                    className="track-button"
                    onClick={() =>
                      navigate(
                        `/track/${booking.vehicleId?._id}?bookingId=${booking._id}`
                      )
                    }
                    disabled={!booking.vehicleId?._id || booking.status === 'Cancelled'}
                  >
                    Track Bus
                  </Button>
                  
                  {booking.status === 'Confirmed' && (
                    <Button
                      variant="outlined"
                      className="cancel-button"
                      onClick={() => handleCancelClick(booking._id)}
                      disabled={cancelLoading}
                      style={{ marginTop: '0.5rem', width: '100%', borderColor: '#f87171', color: '#f87171' }}
                    >
                      Cancel Booking
                    </Button>
                  )}
                </div>
              </div>

            </CardContent>
          </Card>
        ))}
      </div>
    </div>

    <ConfirmationModal 
      isOpen={modalConfig.isOpen}
      onClose={() => setModalConfig({ isOpen: false, bookingId: null })}
      onConfirm={handleConfirmCancel}
      title="Cancel Booking?"
      message="Are you sure you want to cancel this booking? This action cannot be undone."
      confirmText="Yes, Cancel"
      loading={cancelLoading}
    />
    </>

  );
}
