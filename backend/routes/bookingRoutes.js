const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");

const {
  createBooking,
  getUserBookings,
  getBooking,
  getBookingsByVehicle,
  toggleEmailAlerts,
  checkActiveBooking,
  cancelBooking,
} = require("../controllers/bookingController");

// Create booking
router.post("/", createBooking);

// Cancel booking
router.put("/cancel/:id", protect, cancelBooking);


// Check active booking (MUST be before generic /:id)
router.get("/check-active/:userId/:vehicleId", checkActiveBooking);


// User bookings
router.get("/user/:userId", getUserBookings);

// Vehicle bookings for seat map
router.get("/vehicle/:vehicleId", getBookingsByVehicle);

// Get single booking
router.get("/:id", getBooking);

// Toggle email alerts
router.put("/:id/toggle-alerts", toggleEmailAlerts);

module.exports = router;
