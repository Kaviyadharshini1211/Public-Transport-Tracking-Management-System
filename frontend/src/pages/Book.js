// src/pages/Book.jsx
import React, { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Select,
  MenuItem,
  Card,
  CardContent,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
} from "@mui/material";
import API from "../api/api";
import SeatMap from "../components/SeatMap";
import { useNavigate } from "react-router-dom";

export default function Book() {
  const [routes, setRoutes] = useState([]);
  const [routeId, setRouteId] = useState("");
  const [vehicles, setVehicles] = useState([]);
  const [openSeatDialog, setOpenSeatDialog] = useState(false);
  const [activeVehicle, setActiveVehicle] = useState(null);
  const [reservedSeats, setReservedSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [farePerSeat, setFarePerSeat] = useState(200); // default fare
  const [boardingStopIndex, setBoardingStopIndex] = useState(""); // index in route.stops

  const navigate = useNavigate();

  useEffect(() => {
    API.get("/routes").then(r => setRoutes(r.data)).catch(console.error);
  }, []);

  useEffect(() => {
    if (!routeId) return setVehicles([]);
    API.get(`/vehicles/by-route/${routeId}`)
      .then(res => setVehicles(res.data))
      .catch(console.error);

    // reset boarding stop when route changes
    setBoardingStopIndex("");
  }, [routeId]);

  const openSeatMap = async (vehicle) => {
    try {
      const res = await API.get(`/bookings/vehicle/${vehicle._id}`);
      const bookedSeatNums = (res.data || []).flatMap(b => b.seatNumbers || []);
      setReservedSeats(bookedSeatNums);
    } catch (err) {
      setReservedSeats([]);
    }
    setActiveVehicle(vehicle);
    setSelectedSeats([]);
    setOpenSeatDialog(true);
  };

  const toggleSeat = (num) => {
    setSelectedSeats(prev => prev.includes(num) ? prev.filter(s => s !== num) : [...prev, num]);
  };

  const confirmSelection = () => {
    setOpenSeatDialog(false);

    // find boardingStop object from route
    const routeObj = routes.find(r => r._id === routeId);
    const boardingStop = routeObj?.stops?.[boardingStopIndex] || null;

    navigate("/book/confirm", {
      state: {
        vehicle: activeVehicle,
        routeId,
        seatNumbers: selectedSeats,
        totalFare: selectedSeats.length * farePerSeat,
        boardingStop,
      }
    });
  };

  const routeObj = routes.find(r => r._id === routeId);

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>Book a Ticket</Typography>

      <Typography>Select Route</Typography>
      <Select fullWidth value={routeId} onChange={(e) => setRouteId(e.target.value)} sx={{ mb: 2 }}>
        <MenuItem value="">-- choose route --</MenuItem>
        {routes.map(r => <MenuItem key={r._id} value={r._id}>{r.name}</MenuItem>)}
      </Select>

      {/* Boarding stop selector (shows when a route is selected) */}
      {routeObj && (
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Boarding Stop</InputLabel>
          <Select
            value={boardingStopIndex}
            label="Boarding Stop"
            onChange={(e) => setBoardingStopIndex(e.target.value)}
          >
            <MenuItem value="">-- choose boarding stop --</MenuItem>
            {routeObj.stops?.map((s, idx) => (
              <MenuItem key={idx} value={idx}>
                {s.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      <Grid container spacing={2}>
        {vehicles.map(v => (
          <Grid item xs={12} md={6} key={v._id}>
            <Card>
              <CardContent>
                <Typography variant="h6">{v.regNumber} — {v.model}</Typography>
                <Typography>Driver: {v.driverName || "N/A"}</Typography>
                <Typography>Capacity: {v.capacity}</Typography>
                <Typography>Route: {v.route?.name}</Typography>
                <Button sx={{ mt: 1 }} variant="contained" onClick={() => openSeatMap(v)}>Select Seats</Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={openSeatDialog} onClose={() => setOpenSeatDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Select seats for {activeVehicle?.regNumber}</DialogTitle>
        <DialogContent>
          <SeatMap capacity={activeVehicle?.capacity || 40} reserved={reservedSeats} selected={selectedSeats} onToggle={toggleSeat} />
          <Typography sx={{ mt: 2 }}>Selected: {selectedSeats.join(", ") || "none"}</Typography>
          <TextField label="Fare per seat" type="number" value={farePerSeat} onChange={(e) => setFarePerSeat(Number(e.target.value))} sx={{ mt: 2 }} fullWidth />
          <Typography sx={{ mt: 1 }}>Total: ₹{selectedSeats.length * farePerSeat}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenSeatDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={confirmSelection} disabled={selectedSeats.length === 0 || boardingStopIndex === ""}>Confirm</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
