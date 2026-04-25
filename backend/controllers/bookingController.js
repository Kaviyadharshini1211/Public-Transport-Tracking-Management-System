const Booking = require("../models/Booking");
const Vehicle = require("../models/Vehicle");
const Route = require("../models/Route");
const sendSMS = require("../services/smsService");
const sendEmail = require("../services/emailService");

// Create Booking
exports.createBooking = async (req, res) => {
  try {
    const {
      userId,
      vehicleId,
      routeId,
      seats,
      journeyDate,
      seatNumbers = [],
      totalFare,
      boardingStop,
    } = req.body;

    // Basic validation
    if (!userId || !vehicleId || !routeId || !seats) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });

    const route = await Route.findById(routeId);
    if (!route) return res.status(404).json({ message: "Route not found" });

    const booking = await Booking.create({
      userId,
      vehicleId,
      routeId,
      seats,
      journeyDate,
      seatNumbers,
      totalFare,
      boardingStop: boardingStop || null,

      // Alerts enabled by default
      emailAlerts: true,
      etaAlertSent: false,
      etaSmsSent: false,
    });

    const populated = await Booking.findById(booking._id)
      .populate("userId", "-password")
      .populate("vehicleId")
      .populate("routeId");

    // ==============================
    // SEND SMS + EMAIL
    // ==============================
    const message = `Booking Confirmed!
Route: ${populated.routeId?.name}
Vehicle: ${populated.vehicleId?.regNumber}
Seats: ${seatNumbers.join(", ")}
Boarding Stop: ${boardingStop?.name || "N/A"}
Thank you for choosing our service!`;

    // SMS
    if (populated.userId?.phone) {
      await sendSMS(populated.userId.phone, message);
    }

    // Email
    if (populated.userId?.email) {
      await sendEmail(
        populated.userId.email,
        "Booking Confirmation",
        message
      );
    }

    res.status(201).json(populated);
  } catch (err) {
    console.error("createBooking error:", err);
    res.status(500).json({ message: "Failed to create booking" });
  }
};

// User bookings
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

// Get bookings by vehicle (used for seat map)
exports.getBookingsByVehicle = async (req, res) => {
  try {
    const filter = {
      vehicleId: req.params.vehicleId,
      status: "Confirmed",
    };

    if (req.query.date) {
      filter.journeyDate = req.query.date;
    }

    const bookings = await Booking.find(filter)
      .select("seatNumbers seats boardingStop userId emailAlerts")
      .populate("userId", "name email");

    res.json(bookings);
  } catch (err) {
    console.error("getBookingsByVehicle error:", err);
    res.status(500).json({ message: "Failed to fetch vehicle bookings" });
  }
};

// Toggle Email Alerts
exports.toggleEmailAlerts = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking)
      return res.status(404).json({ message: "Booking not found" });

    booking.emailAlerts = !booking.emailAlerts;

    // Reset ETA alert flag when toggled
    booking.etaAlertSent = false;

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

// Check if user has an active booking for a vehicle
exports.checkActiveBooking = async (req, res) => {
  try {
    const { userId, vehicleId } = req.params;

    const booking = await Booking.findOne({
      userId,
      vehicleId,
      status: "Confirmed",
    });

    res.json({ hasActiveBooking: !!booking });
  } catch (err) {
    console.error("checkActiveBooking error:", err);
    res.status(500).json({ message: "Failed to check booking status" });
  }
};

// Cancel Booking
exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Check ownership
    if (booking.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to cancel this booking" });
    }

    if (booking.status === "Cancelled") {
      return res.status(400).json({ message: "Booking is already cancelled" });
    }

    booking.status = "Cancelled";
    await booking.save();

    res.json({ success: true, message: "Booking cancelled successfully" });
  } catch (err) {
    console.error("cancelBooking error:", err);
    res.status(500).json({ message: "Failed to cancel booking" });
  }
};
