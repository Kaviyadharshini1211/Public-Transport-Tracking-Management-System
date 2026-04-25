const cron = require("node-cron");
const nodemailer = require("nodemailer");
const Booking = require("../models/Booking");

// ---------------- EMAIL TRANSPORTER ----------------
let transporter = null;
if (process.env.MAIL_USER && process.env.MAIL_PASS) {
  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });
} else {
  console.warn("⚠️ [ETA Job] Email credentials missing. Email alerts will be skipped.");
}

// ---------------- HAVERSINE DISTANCE ----------------
const distance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
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
// Runs every 1 minute
cron.schedule("*/1 * * * *", async () => {
  console.log("🚀 Running ETA Email Job");

  try {
    const bookings = await Booking.find({
      emailAlerts: true,
      etaAlertSent: false,
    })
      .populate("userId", "email name")
      .populate("vehicleId", "currentLocation driverName lastSeenAt regNumber")
      .populate("routeId", "avgSpeedKmph");

    for (const booking of bookings) {
      // ------------ VALIDATE EMAIL ------------
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

      const stop = booking.boardingStop;

      // ------------ VALIDATE VEHICLE LOCATION ------------
      const busLoc = booking?.vehicleId?.currentLocation;
      const lastSeen = booking?.vehicleId?.lastSeenAt;

      if (
        !busLoc ||
        !busLoc.lat ||
        !busLoc.lng ||
        !lastSeen ||
        Date.now() - new Date(lastSeen).getTime() > 5 * 60 * 1000
      ) {
        console.log("❌ Skipping (bus offline/stale):", booking._id);
        continue;
      }

      // ------------ CALCULATE ETA ------------
      const km = distance(busLoc.lat, busLoc.lng, stop.lat, stop.lng);
      const speed = booking.routeId?.avgSpeedKmph || 50;
      const minutes = (km / speed) * 60;

      // Only alert when <= 10 minutes
      if (minutes > 10) {
        console.log("⏳ ETA more than 10 min — skipping");
        continue;
      }

      const etaText = formatETA(minutes);

      // ------------ SEND EMAIL ------------
      if (transporter) {
        await transporter.sendMail({
          from: process.env.MAIL_USER,
          to: email,
          subject: "Bus Arriving Soon 🚍",
          html: `
            <h2>Live ETA Alert</h2>
            <p>Hello <strong>${booking.userId.name}</strong>,</p>

            <p>Your bus is approximately <strong>${etaText}</strong> away from your boarding stop:</p>

            <h3>${stop.name}</h3>

            <p><b>Vehicle:</b> ${booking.vehicleId?.regNumber || "N/A"}</p>
            <p><b>Driver:</b> ${booking.vehicleId?.driverName || "N/A"}</p>
            <p><b>Last Updated:</b> ${new Date(
              booking.vehicleId.lastSeenAt
            ).toLocaleTimeString()}</p>

            <br/>
            <small>This is an automated ETA notification.</small>
          `,
        });

        // Mark alert sent (prevent spam)
        booking.etaAlertSent = true;
        await booking.save();

        console.log("📩 Sent ETA email to:", email);
      } else {
        console.log("ℹ️ Skipping email alert for", email, "(Transporter not configured)");
      }
    }
  } catch (err) {
    console.error("❌ Cron job error:", err);
  }
});