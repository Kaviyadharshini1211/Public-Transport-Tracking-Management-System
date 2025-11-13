const express = require("express");
const router = express.Router();

const {
  createBooking,
  getUserBookings,
  getBooking,
  getBookingsByVehicle,
  toggleEmailAlerts,
} = require("../controllers/bookingController");

// Create booking
router.post("/", createBooking);

// User bookings
router.get("/user/:userId", getUserBookings);

// Vehicle bookings for seat map
router.get("/vehicle/:vehicleId", getBookingsByVehicle);

// Get single booking
router.get("/:id", getBooking);

// ⭐ Toggle email alerts
router.put("/:id/toggle-alerts", toggleEmailAlerts);

module.exports = router;
