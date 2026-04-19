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

// ---------------- CRON ----------------
cron.schedule("*/1 * * * *", async () => {
  console.log("📱 Running ETA SMS Job");

  try {
    const bookings = await Booking.find({
      emailAlerts: true,
      etaSmsSent: false,
    })
      .populate("userId", "phone name")
      .populate("vehicleId", "currentLocation driverName lastSeenAt regNumber")
      .populate("routeId", "avgSpeedKmph");

    for (const booking of bookings) {
      const phone = booking?.userId?.phone;

      if (!phone) continue;
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
        continue;
      }

      const km = distance(busLoc.lat, busLoc.lng, stop.lat, stop.lng);
      const speed = booking.routeId?.avgSpeedKmph || 50;
      const minutes = (km / speed) * 60;

      if (minutes > 10) continue;

      // SEND SMS
      await sendSMS(
        phone,
        `Bus arriving in ${Math.round(minutes)} minutes.
Stop: ${stop.name}
Vehicle: ${booking.vehicleId?.regNumber || "N/A"}`
      );

      booking.etaSmsSent = true;
      await booking.save();

      console.log("📩 Sent ETA SMS to:", phone);
    }
  } catch (err) {
    console.error("SMS Cron Error:", err);
  }
});