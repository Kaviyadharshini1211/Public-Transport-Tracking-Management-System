const cron = require("node-cron");
const Booking = require("../models/Booking");
const sendSMS = require("../services/smsService");

// ---------------- HAVERSINE ----------------
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

// Normalise Indian phone numbers to E.164
const toE164 = (phone) => {
  if (!phone) return null;
  let p = phone.trim();
  if (/^[6-9]\d{9}$/.test(p)) return `+91${p}`;           // 9876543210 → +919876543210
  if (/^0[6-9]\d{9}$/.test(p)) return `+91${p.slice(1)}`; // 09876543210 → +919876543210
  if (p.startsWith("+")) return p;                         // already E.164
  return null; // unrecognised format — skip
};

// ---------------- CRON ----------------
cron.schedule("*/1 * * * *", async () => {
  console.log("📱 Running ETA SMS Job");

  try {
    const bookings = await Booking.find({
      etaSmsSent: false,    // only send once per booking
      status: "Confirmed",  // only active bookings
    })
      .populate("userId", "phone name")
      .populate("vehicleId", "currentLocation driverName lastSeenAt regNumber")
      .populate("routeId", "avgSpeedKmph");

    for (const booking of bookings) {
      const rawPhone = booking?.userId?.phone;
      const e164Phone = toE164(rawPhone);

      if (!e164Phone) continue;
      if (!booking.boardingStop) continue;

      const stop = booking.boardingStop;
      const busLoc = booking?.vehicleId?.currentLocation;
      const lastSeen = booking?.vehicleId?.lastSeenAt;

      if (
        !busLoc ||
        !busLoc.lat ||
        !busLoc.lng ||
        !lastSeen ||
        Date.now() - new Date(lastSeen).getTime() > 5 * 60 * 1000
      ) {
        console.log(`[SMS Job] Skipping ${booking._id}: Bus offline/stale.`);
        continue;
      }

      const km = distance(busLoc.lat, busLoc.lng, stop.lat, stop.lng);
      const speed = booking.routeId?.avgSpeedKmph || 50;
      const minutes = (km / speed) * 60;

      if (minutes > 10) {
        console.log(`[SMS Job] ${booking._id}: Bus is ${Math.round(minutes)} min away. Skipping.`);
        continue;
      }

      // SEND SMS
      await sendSMS(
        e164Phone,
        `⏰ Bus arriving in ~${Math.round(minutes)} min!\nStop: ${stop.name}\nVehicle: ${booking.vehicleId?.regNumber || "N/A"}\nBe ready at your stop! 🚌`
      );

      booking.etaSmsSent = true;
      await booking.save();

      console.log("📩 Sent ETA SMS to:", e164Phone);
    }
  } catch (err) {
    console.error("SMS Cron Error:", err);
  }
});