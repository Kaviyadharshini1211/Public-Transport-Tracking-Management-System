// src/pages/MyBookings.jsx
import React, { useEffect, useState } from "react";
import { Container, Typography, Card, CardContent, Button, Grid } from "@mui/material";
import API from "../api/api";
import { useNavigate } from "react-router-dom";

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "null");

  useEffect(() => {
    if (!user) return;
    API.get(`/bookings/user/${user._id}`).then(res => setBookings(res.data)).catch(console.error);
  }, [user]);

  if (!user) return <Container sx={{ mt: 4 }}><Typography>Please login</Typography></Container>;

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>My Bookings</Typography>

      <Grid container spacing={2}>
        {bookings.map(b => (
          <Grid item xs={12} md={6} key={b._id}>
            <Card>
              <CardContent>
                <Typography>Booking ID: {b._id}</Typography>
                <Typography>Vehicle: {b.vehicleId?.regNumber || "—"}</Typography>
                <Typography>Route: {b.routeId?.name || "—"}</Typography>
                <Typography>Boarding Stop: {b.boardingStop?.name || "—"}</Typography>
                <Typography>Seats: {b.seatNumbers?.join(", ") || b.seats}</Typography>
                <Typography>Fare: ₹{b.totalFare}</Typography>
                <Button sx={{ mt: 1, mr:1 }} onClick={() => navigate(`/track/${b.vehicleId?._id}?bookingId=${b._id}`)}>Track Bus</Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}
