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

      // Alerts start disabled — user can enable from MyBookings
      emailAlerts: false,
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
    const routeName = populated.routeId?.name || "N/A";
    const regNum   = populated.vehicleId?.regNumber || "N/A";
    const seats_str = seatNumbers?.length > 0 ? seatNumbers.join(", ") : `${seats} seat(s)`;
    const stop     = boardingStop?.name || "N/A";
    const fare     = totalFare ? `₹${totalFare}` : "N/A";

    const smsBody = `✅ Booking Confirmed!
Route: ${routeName}
Vehicle: ${regNum}
Seats: ${seats_str}
Boarding: ${stop}
Fare: ${fare}
Have a safe journey! 🚌`;

    // SMS — normalise to E.164 (+91XXXXXXXXXX for Indian numbers)
    const rawPhone = populated.userId?.phone;
    if (rawPhone) {
      let e164Phone = rawPhone.trim();
      // If stored as 10-digit Indian number, prepend +91
      if (/^[6-9]\d{9}$/.test(e164Phone)) e164Phone = `+91${e164Phone}`;
      // If stored as 0XXXXXXXXXX, strip leading 0 and add +91
      if (/^0[6-9]\d{9}$/.test(e164Phone)) e164Phone = `+91${e164Phone.slice(1)}`;
      await sendSMS(e164Phone, smsBody);
    } else {
      console.warn(`[SMS] No phone on user ${populated.userId?._id} — skipping SMS`);
    }

    // Email — build confirmation HTML
    if (populated.userId?.email) {
      const confirmationHtml = `
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"/>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; background: #f8fafc; margin: 0; padding: 0; }
          .wrapper { max-width: 520px; margin: 32px auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
          .header { background: linear-gradient(135deg, #10b981, #3b82f6); padding: 28px 32px; text-align: center; }
          .header h1 { margin: 0; color: white; font-size: 22px; }
          .header p { margin: 6px 0 0; color: rgba(255,255,255,0.85); font-size: 13px; }
          .body { padding: 28px 32px; }
          .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
          .info-row:last-child { border-bottom: none; }
          .info-label { color: #64748b; }
          .info-value { color: #0f172a; font-weight: 600; }
          .footer { background: #f8fafc; padding: 16px 32px; text-align: center; font-size: 12px; color: #94a3b8; }
        </style>
        </head>
        <body>
          <div class="wrapper">
            <div class="header">
              <span style="font-size:40px;display:block;margin:0 auto 8px">🎟️</span>
              <h1>Booking Confirmed!</h1>
              <p>PT Tracker — Public Transport Tracking System</p>
            </div>
            <div class="body">
              <p>Hello <strong>${populated.userId.name || "Passenger"}</strong>,</p>
              <p>Your bus ticket has been booked successfully. Here are your details:</p>
              <div class="info-row"><span class="info-label">🛤️ Route</span><span class="info-value">${routeName}</span></div>
              <div class="info-row"><span class="info-label">🚌 Vehicle</span><span class="info-value">${regNum}</span></div>
              <div class="info-row"><span class="info-label">💺 Seats</span><span class="info-value">${seats_str}</span></div>
              <div class="info-row"><span class="info-label">📍 Boarding Stop</span><span class="info-value">${stop}</span></div>
              <div class="info-row"><span class="info-label">📅 Journey Date</span><span class="info-value">${journeyDate}</span></div>
              <div class="info-row"><span class="info-label">💰 Total Fare</span><span class="info-value">${fare}</span></div>
            </div>
            <div class="footer">Have a safe journey! 🚌<br/>PT Tracker — Public Transport Tracking System</div>
          </div>
        </body></html>`;

      await sendEmail(
        populated.userId.email,
        `✅ Booking Confirmed — ${routeName}`,
        confirmationHtml
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
