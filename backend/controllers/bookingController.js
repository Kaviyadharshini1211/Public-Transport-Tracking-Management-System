// backend/controllers/bookingController.js
const Booking = require("../models/Booking");
const Vehicle = require("../models/Vehicle");
const Route = require("../models/Route");
const User = require("../models/User");

// Create booking
exports.createBooking = async (req, res) => {
  try {
    const { userId, vehicleId, routeId, seats, seatNumbers = [], totalFare, boardingStop } = req.body;

    if (!userId || !vehicleId || !routeId || !seats) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // basic validation: ensure vehicle & route exist
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });

    const route = await Route.findById(routeId);
    if (!route) return res.status(404).json({ message: "Route not found" });

    // Create booking
    const booking = await Booking.create({
      userId,
      vehicleId,
      routeId,
      seats,
      seatNumbers,
      totalFare,
      boardingStop: boardingStop || null,
    });

    // optional: you can decrement vehicle available seats here (not implemented)
    // e.g. vehicle.availableSeats = (vehicle.availableSeats || vehicle.capacity) - seats; await vehicle.save();

    const populated = await Booking.findById(booking._id)
      .populate("userId", "-password")
      .populate("vehicleId")
      .populate("routeId");

    res.status(201).json(populated);
  } catch (err) {
    console.error("createBooking error:", err);
    res.status(500).json({ message: "Failed to create booking" });
  }
};

// Get bookings for a user
exports.getUserBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.params.userId })
      .populate("routeId")
      .populate("vehicleId")
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (err) {
    console.error("getUserBookings error:", err);
    res.status(500).json({ message: "Failed to fetch bookings" });
  }
};

// Get single booking
exports.getBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("routeId")
      .populate("vehicleId")
      .populate("userId", "-password");

    if (!booking) return res.status(404).json({ message: "Booking not found" });

    res.json(booking);
  } catch (err) {
    console.error("getBooking error:", err);
    res.status(500).json({ message: "Failed to fetch booking" });
  }
};

// Get bookings for a vehicle (used by seat-map to know reserved seats)
exports.getBookingsByVehicle = async (req, res) => {
  try {
    const vehicleId = req.params.vehicleId;
    const bookings = await Booking.find({ vehicleId, status: "Confirmed" })
      .select("seatNumbers seats boardingStop userId createdAt")
      .populate("userId", "name email")
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (err) {
    console.error("getBookingsByVehicle error:", err);
    res.status(500).json({ message: "Failed to fetch vehicle bookings" });
  }
};
