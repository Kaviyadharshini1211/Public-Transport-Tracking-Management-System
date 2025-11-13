// src/pages/ConfirmBooking.jsx
import React from "react";
import { Container, Typography, Card, CardContent, Button } from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import API from "../api/api";

export default function ConfirmBooking() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "null");

  if (!state) return <Container><Typography>No booking data. Start from /book</Typography></Container>;

  const { vehicle, routeId, seatNumbers = [], totalFare, boardingStop } = state;

  const handleConfirm = async () => {
    if (!user) return navigate("/login");
    try {
      const payload = {
        userId: user._id,
        vehicleId: vehicle._id,
        routeId,
        seats: seatNumbers.length,
        seatNumbers,
        totalFare,
        boardingStop, // send boarding stop object {name, lat, lng}
      };
      const res = await API.post("/bookings", payload);
      // success -> redirect to My Bookings
      navigate("/bookings");
    } catch (err) {
      console.error("Booking failed", err);
      alert("Booking failed");
    }
  };

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>Confirm Booking</Typography>

      <Card>
        <CardContent>
          <Typography>Vehicle: {vehicle.regNumber} — {vehicle.model}</Typography>
          <Typography>Driver: {vehicle.driverName || "N/A"}</Typography>
          <Typography>Route ID: {routeId}</Typography>
          <Typography>Boarding Stop: {boardingStop ? boardingStop.name : "—"}</Typography>
          <Typography>Seats: {seatNumbers.join(", ")}</Typography>
          <Typography>Total Fare: ₹{totalFare}</Typography>
          <Button variant="contained" sx={{ mt: 2 }} onClick={handleConfirm}>Pay & Book (Simulated)</Button>
        </CardContent>
      </Card>
    </Container>
  );
}
