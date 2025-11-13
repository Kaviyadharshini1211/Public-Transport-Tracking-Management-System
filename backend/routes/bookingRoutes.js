// backend/routes/bookingRoutes.js
const express = require("express");
const router = express.Router();

const {
  createBooking,
  getUserBookings,
  getBooking,
  getBookingsByVehicle
} = require("../controllers/bookingController");

// public (or protect with auth middleware if desired)
router.post("/", createBooking);

// user bookings
router.get("/user/:userId", getUserBookings);

// vehicle bookings (for seat-blocking)
router.get("/vehicle/:vehicleId", getBookingsByVehicle);

// single booking
router.get("/:id", getBooking);

module.exports = router;
