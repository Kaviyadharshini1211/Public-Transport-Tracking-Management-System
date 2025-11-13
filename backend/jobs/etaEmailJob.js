const cron = require("node-cron");
const nodemailer = require("nodemailer");
const Booking = require("../models/Booking");
const Vehicle = require("../models/Vehicle");
const Route = require("../models/Route");
const User = require("../models/User");

// ---------------- EMAIL TRANSPORTER ----------------
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,     // your Gmail
    pass: process.env.MAIL_PASS,     // app password
  },
});

// ---------------- HAVERSINE ----------------
const distance = (lat1, lon1, lat2, lon2) => {
  var R = 6371;
  var dLat = ((lat2 - lat1) * Math.PI) / 180;
  var dLon = ((lon2 - lon1) * Math.PI) / 180;
  var a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// ---------------- FORMAT ETA ----------------
const formatETA = (min) => {
  if (min <= 0) return "Arriving";
  const hrs = Math.floor(min / 60);
  const mins = Math.round(min % 60);
  return hrs > 0 ? `${hrs}h ${mins}m` : `${mins} min`;
};

// ---------------- CRON JOB ----------------
// Runs every 5 minutes (adjust as needed)
cron.schedule("*/1440 * * * *", async () => {
  console.log("🚀 Running ETA Email Job");

  try {
    // Get all bookings with alerts enabled
    const bookings = await Booking.find({ emailAlerts: true })
      .populate("userId", "email name")                // MUST include email
      .populate("vehicleId", "currentLocation driverName lastSeenAt")
      .populate("routeId", "avgSpeedKmph stops");

    for (const booking of bookings) {
      // ------------ VALIDATE USER / EMAIL ------------
      const email = booking?.userId?.email;

      if (!email || typeof email !== "string" || !email.includes("@")) {
        console.log("❌ Skipping (invalid email):", booking._id);
        continue;
      }

      // ------------ VALIDATE BOARDING STOP ------------
      if (!booking.boardingStop) {
        console.log("❌ Skipping (no boarding stop):", booking._id);
        continue;
      }

      // ------------ VALIDATE VEHICLE LOCATION ------------
      const busLoc = booking?.vehicleId?.currentLocation;
      if (!busLoc || !busLoc.lat || !busLoc.lng) {
        console.log("❌ Skipping (bus offline):", booking._id);
        continue;
      }

      const stop = booking.boardingStop;

      // ------------ CALCULATE ETA ------------
      const km = distance(busLoc.lat, busLoc.lng, stop.lat, stop.lng);
      const speed = booking.routeId?.avgSpeedKmph || 50;
      const minutes = (km / speed) * 60;
      const etaText = formatETA(minutes);

      // ------------ SEND EMAIL ------------
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Your Bus ETA Update",
        html: `
          <h2>Live ETA Update</h2>
          <p>Hello <strong>${booking.userId.name}</strong>,</p>
          <p>Your bus is currently <strong>${etaText}</strong> away from your boarding stop:</p>
          <h3>${stop.name}</h3>

          <p><b>Driver:</b> ${booking.vehicleId.driverName || "N/A"}</p>
          <p><b>Last Updated:</b> ${new Date(
            booking.vehicleId.lastSeenAt
          ).toLocaleTimeString()}</p>

          <br/>
          <small>This is an automated ETA alert.</small>
        `,
      });

      console.log("📩 Sent ETA email to:", email);
    }
  } catch (err) {
    console.error("Cron job error:", err);
  }
});
