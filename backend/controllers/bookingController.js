const Booking = require("../models/Booking");
const Vehicle = require("../models/Vehicle");
const Route = require("../models/Route");
const sendSMS = require("../services/smsService");

// ==============================
// Create Booking
// ==============================
exports.createBooking = async (req, res) => {
  try {
    const {
      userId,
      vehicleId,
      routeId,
      seats,
      seatNumbers = [],
      totalFare,
      boardingStop,
    } = req.body;

    console.log("BOOKING BODY:", req.body); // 🔍 debug (remove later if needed)

    // ✅ Basic validation
    if (!userId || !vehicleId || !routeId) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (!seatNumbers || seatNumbers.length === 0) {
      return res.status(400).json({ message: "No seats selected" });
    }

    if (seats == null) {
      return res.status(400).json({ message: "Seats count missing" });
    }

    // ✅ Check vehicle exists
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    // ✅ Check route exists
    const route = await Route.findById(routeId);
    if (!route) {
      return res.status(404).json({ message: "Route not found" });
    }

    // ✅ Create booking
    const booking = await Booking.create({
      userId,
      vehicleId,
      routeId,
      seats,
      seatNumbers,
      totalFare,
      boardingStop: boardingStop || null,
      emailAlerts: false,
    });

    // ✅ Populate response
    const populated = await Booking.findById(booking._id)
      .populate("userId", "-password")
      .populate("vehicleId")
      .populate("routeId");

    // ==============================
    // SEND SMS
    // ==============================
    if (populated.userId?.phone) {
      await sendSMS(
        populated.userId.phone,
        `Booking Confirmed!
Route: ${populated.routeId?.name}
Vehicle: ${populated.vehicleId?.vehicleNumber}
Seats: ${seatNumbers.join(", ")}
Boarding Stop: ${boardingStop?.name || "N/A"}
Thank you for choosing our service!`
      );
    }

    res.status(201).json(populated);

  } catch (err) {
    console.error("createBooking error:", err);
    res.status(500).json({ message: "Failed to create booking" });
  }
};

// ==============================
// User bookings
// ==============================
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

// ==============================
// Get single booking
// ==============================
exports.getBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("routeId")
      .populate("vehicleId")
      .populate("userId", "-password");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.json(booking);
  } catch (err) {
    console.error("getBooking error:", err);
    res.status(500).json({ message: "Failed to fetch booking" });
  }
};

// ==============================
// Get bookings by vehicle (seat map)
// ==============================
exports.getBookingsByVehicle = async (req, res) => {
  try {
    const bookings = await Booking.find({
      vehicleId: req.params.vehicleId,
      status: "Confirmed",
    })
      .select("seatNumbers seats boardingStop userId emailAlerts")
      .populate("userId", "name email");

    res.json(bookings);
  } catch (err) {
    console.error("getBookingsByVehicle error:", err);
    res.status(500).json({ message: "Failed to fetch vehicle bookings" });
  }
};

// ==============================
// Toggle Email Alerts
// ==============================
exports.toggleEmailAlerts = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    booking.emailAlerts = !booking.emailAlerts;
    await booking.save();

    res.json({
      success: true,
      emailAlerts: booking.emailAlerts,
    });
  } catch (err) {
    console.error("toggleEmailAlerts error:", err);
    res.status(500).json({ message: "Failed to toggle alerts" });
  }
};
