/**
 * ETA Email Alert Job
 *
 * Runs every 60 seconds.
 * For each booking with emailAlerts=true AND etaAlertSent=false,
 * checks if the bus is within 10 minutes of the boarding stop.
 * If so, sends ONE email then sets etaAlertSent=true — preventing any further emails (no spam).
 */
const cron = require("node-cron");
const Booking = require("../models/Booking");
const sendEmail = require("../services/emailService");

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
  if (min <= 0) return "Arriving now";
  const hrs = Math.floor(min / 60);
  const mins = Math.round(min % 60);
  return hrs > 0 ? `${hrs}h ${mins}m` : `${mins} min`;
};

// ---------------- BUILD EMAIL HTML ----------------
const buildEmailHtml = (booking, etaText) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f8fafc; margin: 0; padding: 0; }
    .wrapper { max-width: 520px; margin: 32px auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #3b82f6, #7c3aed); padding: 28px 32px; text-align: center; }
    .header h1 { margin: 0; color: white; font-size: 22px; }
    .header p { margin: 6px 0 0; color: rgba(255,255,255,0.85); font-size: 13px; }
    .body { padding: 28px 32px; }
    .eta-badge { background: #eff6ff; border: 2px solid #3b82f6; border-radius: 12px; padding: 16px 20px; text-align: center; margin: 20px 0; }
    .eta-badge .eta-time { font-size: 32px; font-weight: 800; color: #1d4ed8; }
    .eta-badge .eta-label { font-size: 13px; color: #64748b; margin-top: 4px; }
    .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
    .info-row:last-child { border-bottom: none; }
    .info-label { color: #64748b; }
    .info-value { color: #0f172a; font-weight: 600; }
    .footer { background: #f8fafc; padding: 16px 32px; text-align: center; font-size: 12px; color: #94a3b8; }
    .bus-icon { font-size: 40px; display: block; margin: 0 auto 8px; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <span class="bus-icon">🚍</span>
      <h1>Your Bus Is Almost Here!</h1>
      <p>Live ETA Alert from PT Tracker</p>
    </div>
    <div class="body">
      <p>Hello <strong>${booking.userId.name}</strong>,</p>
      <p>Your bus is approaching your boarding stop. Get ready!</p>
      
      <div class="eta-badge">
        <div class="eta-time">${etaText}</div>
        <div class="eta-label">Estimated arrival at your stop</div>
      </div>

      <div class="info-row">
        <span class="info-label">📍 Boarding Stop</span>
        <span class="info-value">${booking.boardingStop.name}</span>
      </div>
      <div class="info-row">
        <span class="info-label">🚌 Vehicle</span>
        <span class="info-value">${booking.vehicleId?.regNumber || "N/A"}</span>
      </div>
      <div class="info-row">
        <span class="info-label">👤 Driver</span>
        <span class="info-value">${booking.vehicleId?.driverName || "N/A"}</span>
      </div>
      <div class="info-row">
        <span class="info-label">🕐 Last GPS Update</span>
        <span class="info-value">${new Date(booking.vehicleId.lastSeenAt).toLocaleTimeString()}</span>
      </div>
    </div>
    <div class="footer">
      This is a one-time automated alert. You will not receive another email for this booking.<br/>
      PT Tracker — Public Transport Tracking System
    </div>
  </div>
</body>
</html>
`;

// ---------------- CRON JOB (runs every 60 seconds) ----------------
cron.schedule("*/1 * * * *", async () => {
  try {
    // Only fetch bookings that HAVEN'T had an alert sent yet
    const bookings = await Booking.find({
      emailAlerts: true,
      status: "Confirmed",
      etaAlertSent: false,
    })
      .populate("userId", "email name")
      .populate("vehicleId", "currentLocation driverName lastSeenAt regNumber")
      .populate("routeId", "avgSpeedKmph");

    if (bookings.length === 0) return;

    console.log(`📬 ETA Job: checking ${bookings.length} booking(s)...`);

    for (const booking of bookings) {
      // ── Validate email
      const email = booking?.userId?.email;
      if (!email || !email.includes("@")) {
        console.log("⚠ Skipping (invalid email):", booking._id);
        continue;
      }

      // ── Validate boarding stop
      if (!booking.boardingStop?.lat || !booking.boardingStop?.lng) {
        console.log("⚠ Skipping (no boarding stop):", booking._id);
        continue;
      }

      // ── Validate vehicle location (must be live in last 5 min)
      const busLoc = booking?.vehicleId?.currentLocation;
      const lastSeen = booking?.vehicleId?.lastSeenAt;
      if (
        !busLoc?.lat ||
        !busLoc?.lng ||
        !lastSeen ||
        Date.now() - new Date(lastSeen).getTime() > 5 * 60 * 1000
      ) {
        console.log("⚠ Skipping (bus offline/stale):", booking._id);
        continue;
      }

      // ── Calculate ETA
      const km = distance(
        busLoc.lat,
        busLoc.lng,
        booking.boardingStop.lat,
        booking.boardingStop.lng
      );
      const speed = booking.routeId?.avgSpeedKmph || 50;
      const minutes = (km / speed) * 60;

      // Only alert when bus is ≤ 10 minutes away
      if (minutes > 10) {
        continue; // silent skip — not yet close enough
      }

      const etaText = formatETA(minutes);

      // ── Send email (one-shot)
      await sendEmail(
        email,
        `🚍 Bus Arriving in ${etaText} — ${booking.boardingStop.name}`,
        buildEmailHtml(booking, etaText)
      );

      // ── Mark as sent to prevent any future alerts for this booking
      booking.etaAlertSent = true;
      await booking.save();

      console.log(`✅ ETA alert sent to ${email} (booking ${booking._id})`);
    }
  } catch (err) {
    console.error("❌ ETA email job error:", err.message);
  }
});