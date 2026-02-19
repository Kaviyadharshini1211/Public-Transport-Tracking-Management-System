// src/pages/Book.jsx
import React, { useEffect, useState } from "react";
import "../styles/Book.css"
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
  Box,
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
  const [farePerSeat, setFarePerSeat] = useState(200);
  const [boardingStopIndex, setBoardingStopIndex] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    API.get("/routes").then(r => setRoutes(r.data)).catch(console.error);
  }, []);

  useEffect(() => {
    if (!routeId) return setVehicles([]);
    API.get(`/vehicles/by-route/${routeId}`)
      .then(res => setVehicles(res.data))
      .catch(console.error);

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
    <Box className="book-page-wrapper">
      <Container className="book-container" sx={{ mt: 4 }}>
        <Typography className="book-title" variant="h4" gutterBottom>
          Book a Ticket
        </Typography>

        <Box className="form-section">
          <Typography className="form-label">Select Route</Typography>
          <Select 
            className="route-select"
            fullWidth 
            value={routeId} 
            onChange={(e) => setRouteId(e.target.value)} 
            sx={{ mb: 2 }}
          >
            <MenuItem value="">-- choose route --</MenuItem>
            {routes.map(r => <MenuItem key={r._id} value={r._id}>{r.name}</MenuItem>)}
          </Select>

          {routeObj && (
            <FormControl className="stop-select-form" fullWidth sx={{ mb: 2 }}>
              <InputLabel>Boarding Stop</InputLabel>
              <Select
                className="stop-select"
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
        </Box>

        <Grid container spacing={2}>
          {vehicles.map(v => (
            <Grid item xs={12} md={6} key={v._id}>
              <Card className="vehicle-card">
                <CardContent>
                  <Typography className="vehicle-title" variant="h6">
                    {v.regNumber} — {v.model}
                  </Typography>
                  <Typography className="vehicle-info">
                    Driver: {v.driverName || "N/A"}
                  </Typography>
                  <Typography className="vehicle-info">
                    Capacity: {v.capacity}
                  </Typography>
                  <Typography className="vehicle-info">
                    Route: {v.route?.name}
                  </Typography>
                  <Button 
                    className="select-seats-btn"
                    sx={{ mt: 1 }} 
                    variant="contained" 
                    onClick={() => openSeatMap(v)}
                  >
                    Select Seats
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Dialog 
          className="seat-dialog"
          open={openSeatDialog} 
          onClose={() => setOpenSeatDialog(false)} 
          maxWidth="sm" 
          fullWidth
        >
          <DialogTitle className="dialog-title">
            Select seats for {activeVehicle?.regNumber}
          </DialogTitle>
          <DialogContent className="dialog-content">
            <SeatMap 
              capacity={activeVehicle?.capacity || 40} 
              reserved={reservedSeats} 
              selected={selectedSeats} 
              onToggle={toggleSeat} 
            />
            <Typography className="selected-seats-text" sx={{ mt: 2 }}>
              Selected: {selectedSeats.join(", ") || "none"}
            </Typography>
            <TextField 
              className="fare-input"
              label="Fare per seat" 
              type="number" 
              value={farePerSeat} 
              onChange={(e) => setFarePerSeat(Number(e.target.value))} 
              sx={{ mt: 2 }} 
              fullWidth 
            />
            <Typography className="total-fare-text" sx={{ mt: 1 }}>
              Total: ₹{selectedSeats.length * farePerSeat}
            </Typography>
          </DialogContent>
          <DialogActions className="dialog-actions">
            <Button className="dialog-cancel-btn" onClick={() => setOpenSeatDialog(false)}>
              Cancel
            </Button>
            <Button 
              className="dialog-confirm-btn"
              variant="contained" 
              onClick={confirmSelection} 
              disabled={selectedSeats.length === 0 || boardingStopIndex === ""}
            >
              Confirm
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
}