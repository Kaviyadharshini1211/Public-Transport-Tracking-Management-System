// src/pages/MyBookings.jsx
import React, { useEffect, useState } from "react";
import {
  Typography,
  Card,
  CardContent,
  Button,
} from "@mui/material";

import DirectionsBusIcon from "@mui/icons-material/DirectionsBus";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import EventSeatIcon from "@mui/icons-material/EventSeat";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";

import API from "../api/api";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import jsPDF from "jspdf";
import QRCode from "qrcode";
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

  const handleDownloadTicket = async (booking) => {
    try {
      const cleanPdfText = (value) =>
        String(value ?? "")
          .replace(/[^\x20-\x7E]/g, " ")
          .replace(/\s+/g, " ")
          .trim();

      const ticketNumber = booking._id.slice(-8).toUpperCase();
      const passengerName = booking.userId?.name || user?.name || "Passenger";
      const passengerPhone = booking.userId?.phone || user?.phone || "Not provided";
      const seatText = booking.seatNumbers?.length
        ? booking.seatNumbers.join(", ")
        : `${booking.seats} seat(s)`;
      const qrPayload = JSON.stringify({
        bookingId: booking._id,
        ticketNumber,
        route: booking.routeId?.name || "N/A",
        vehicle: booking.vehicleId?.regNumber || "N/A",
        passengerName,
        passengerPhone,
        seats: seatText,
        status: booking.status,
      });

      const qrDataUrl = await QRCode.toDataURL(qrPayload, { width: 240, margin: 1 });
      const doc = new jsPDF();

      doc.setFillColor(216, 78, 85);
      doc.rect(0, 0, 210, 24, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.text("PUBLIC TRANSPORT E-TICKET", 14, 15);
      doc.setFontSize(10);
      doc.text("Safe Travel | Verified Boarding", 14, 21);

      doc.setTextColor(33, 33, 33);
      doc.setFontSize(11);
      doc.text(`Ticket No: ${cleanPdfText(ticketNumber)}`, 14, 36);
      doc.text(`Booking ID: ${cleanPdfText(booking._id)}`, 14, 44);
      doc.text(`Passenger: ${cleanPdfText(passengerName)}`, 14, 52);
      doc.text(`Phone: ${cleanPdfText(passengerPhone)}`, 14, 60);
      doc.text(`Status: ${cleanPdfText(booking.status)}`, 14, 68);
      doc.text(`Route: ${cleanPdfText(booking.routeId?.name || "N/A")}`, 14, 76);
      doc.text(`Vehicle: ${cleanPdfText(booking.vehicleId?.regNumber || "N/A")}`, 14, 84);
      doc.text(`Boarding: ${cleanPdfText(booking.boardingStop?.name || "N/A")}`, 14, 92);
      doc.text(`Seats: ${cleanPdfText(seatText)}`, 14, 100);
      doc.text(`Fare Paid: INR ${cleanPdfText(booking.totalFare ?? "0")}`, 14, 108);
      doc.text(
        `Journey Date: ${cleanPdfText(
          booking.journeyDate ? new Date(booking.journeyDate).toLocaleDateString() : "N/A"
        )}`,
        14,
        116
      );

      doc.addImage(qrDataUrl, "PNG", 142, 38, 52, 52);
      doc.setFontSize(9);
      doc.text("Scan for ticket verification", 140, 95);

      doc.save(`ticket-${ticketNumber}.pdf`);
      toast.success("Ticket PDF downloaded");
    } catch (err) {
      console.error("Ticket download error:", err);
      toast.error("Failed to download ticket");
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
                  <AccountCircleIcon className="detail-icon" />
                  <div className="detail-content">
                    <Typography className="detail-label">Passenger</Typography>
                    <Typography className="detail-text">
                      {booking.userId?.name || user?.name || "Passenger"} | {booking.userId?.phone || user?.phone || "Phone N/A"}
                    </Typography>
                  </div>
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
                    variant="outlined"
                    className="download-ticket-button"
                    onClick={() => handleDownloadTicket(booking)}
                    style={{ marginBottom: "0.5rem", width: "100%" }}
                  >
                    Download Beautiful Ticket PDF
                  </Button>

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
