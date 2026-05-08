/**
 * IVR Controller
 * ──────────────────────────────────────────────────────────────
 * Handles Twilio Voice Webhook calls for the Interactive Voice
 * Response (IVR) system that lets callers enquire about the next
 * intracity (local) bus at any stop.
 *
 * Call flow:
 *   1. /api/ivr/welcome  → say welcome + list states
 *   2. /api/ivr/routes   → list intracity routes for chosen state
 *   3. /api/ivr/stops    → list stops for chosen route
 *   4. /api/ivr/info     → announce ETA + send SMS to caller
 *
 * All responses are TwiML (XML).  Session state is carried via
 * URL query-string parameters (stateless on the server side).
 */

const Route   = require("../models/Route");
const Vehicle = require("../models/Vehicle");
const sendSMS = require("../services/smsService");

// ── Haversine distance (km) ──────────────────────────────────
function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Normalise Indian phone to E.164
function toE164(phone) {
  if (!phone) return null;
  let p = String(phone).replace(/\s/g, "");
  if (/^[6-9]\d{9}$/.test(p))  return `+91${p}`;
  if (/^0[6-9]\d{9}$/.test(p)) return `+91${p.slice(1)}`;
  if (p.startsWith("+"))       return p;
  return null;
}

// ── Known states for intracity routes ───────────────────────
// We derive states from route.origin city names at runtime,
// but also keep a curated display list.
const KNOWN_STATES = [
  "Tamil Nadu",
  "Karnataka",
  "Maharashtra",
  "Telangana",
  "Kerala",
  "Delhi",
  "Gujarat",
  "West Bengal",
];

// Helper: build a TwiML <Response> string
const twiml = (inner) =>
  `<?xml version="1.0" encoding="UTF-8"?>
<Response>
${inner}
</Response>`;

// Helper: <Gather> element
const gather = (action, { numDigits = 1, timeout = 8 } = {}, inner) =>
  `<Gather numDigits="${numDigits}" action="${action}" method="POST" timeout="${timeout}">
${inner}
</Gather>
<Say>We did not receive your input. Please call again.</Say>
<Hangup/>`;

// Helper: <Say> with Google TTS (female, slower for IVR)
const say = (text) =>
  `<Say voice="Polly.Aditi" language="hi-IN">${text.replace(/&/g, "&amp;")}</Say>`;


// ────────────────────────────────────────────────────────────
// 1. GET /api/ivr/welcome
//    Entry point — Twilio calls this when someone dials in.
// ────────────────────────────────────────────────────────────
exports.welcome = async (req, res) => {
  // Fetch distinct states from intracity routes
  const routes = await Route.find({ type: "INTRACITY" }).select("origin");
  const stateSet = new Set();
  routes.forEach(r => {
    if (r.origin) stateSet.add(r.origin.split(",").pop().trim());
  });

  // Use known states that actually have routes, fall back to all if empty
  let states = KNOWN_STATES.filter(s =>
    routes.some(r => r.origin && r.origin.toLowerCase().includes(s.toLowerCase()))
  );
  if (states.length === 0) states = [...stateSet].slice(0, 9);

  const options = states
    .slice(0, 9)
    .map((s, i) => say(`Press ${i + 1} for ${s}.`))
    .join("\n");

  const stateList = states.slice(0, 9).join(",");

  const body = twiml(
    gather(`/api/ivr/routes?states=${encodeURIComponent(stateList)}`, { numDigits: 1, timeout: 10 },
      say("Welcome to the Public Transport Information System.") + "\n" +
      say("For intracity bus timings, please select your state.") + "\n" +
      options
    )
  );

  res.set("Content-Type", "text/xml");
  res.send(body);
};


// ────────────────────────────────────────────────────────────
// 2. POST /api/ivr/routes?states=Tamil Nadu,Karnataka,...
//    Called after caller presses a state digit.
// ────────────────────────────────────────────────────────────
exports.listRoutes = async (req, res) => {
  const states    = (req.query.states || "").split(",");
  const digit     = parseInt(req.body.Digits, 10);
  const stateIdx  = digit - 1;
  const stateName = states[stateIdx];

  if (!stateName || stateIdx < 0) {
    res.set("Content-Type", "text/xml");
    return res.send(twiml(
      say("Invalid selection. Please call again.") + "\n<Hangup/>"
    ));
  }

  // Fetch intracity routes for selected state
  const routes = await Route.find({ type: "INTRACITY" })
    .select("_id name origin destination")
    .lean();

  const stateRoutes = routes.filter(r =>
    r.origin && r.origin.toLowerCase().includes(stateName.toLowerCase())
  ).slice(0, 9);

  if (stateRoutes.length === 0) {
    res.set("Content-Type", "text/xml");
    return res.send(twiml(
      say(`Sorry, no routes found for ${stateName}. Please call again.`) + "\n<Hangup/>"
    ));
  }

  const options = stateRoutes
    .map((r, i) => say(`Press ${i + 1} for route ${r.name || `${r.origin} to ${r.destination}`}.`))
    .join("\n");

  const routeIds = stateRoutes.map(r => r._id.toString()).join(",");

  const body = twiml(
    gather(`/api/ivr/stops?routeIds=${encodeURIComponent(routeIds)}`, { numDigits: 1, timeout: 10 },
      say(`You selected ${stateName}.`) + "\n" +
      say("Please choose a route.") + "\n" +
      options
    )
  );

  res.set("Content-Type", "text/xml");
  res.send(body);
};


// ────────────────────────────────────────────────────────────
// 3. POST /api/ivr/stops?routeIds=id1,id2,...
//    Called after caller presses a route digit.
// ────────────────────────────────────────────────────────────
exports.listStops = async (req, res) => {
  const routeIds = (req.query.routeIds || "").split(",");
  const digit    = parseInt(req.body.Digits, 10);
  const routeId  = routeIds[digit - 1];

  if (!routeId || digit < 1) {
    res.set("Content-Type", "text/xml");
    return res.send(twiml(
      say("Invalid selection. Please call again.") + "\n<Hangup/>"
    ));
  }

  const route = await Route.findById(routeId).lean();
  if (!route || !route.stops || route.stops.length === 0) {
    res.set("Content-Type", "text/xml");
    return res.send(twiml(
      say("No stop information available for this route. Please call again.") + "\n<Hangup/>"
    ));
  }

  const stops = route.stops.sort((a, b) => (a.order || 0) - (b.order || 0)).slice(0, 9);

  const options = stops
    .map((s, i) => say(`Press ${i + 1} for ${s.name}.`))
    .join("\n");

  const body = twiml(
    gather(`/api/ivr/info?routeId=${routeId}`, { numDigits: 1, timeout: 10 },
      say(`Route: ${route.name || `${route.origin} to ${route.destination}`}.`) + "\n" +
      say("Please select your boarding stop.") + "\n" +
      options
    )
  );

  res.set("Content-Type", "text/xml");
  res.send(body);
};


// ────────────────────────────────────────────────────────────
// 4. POST /api/ivr/info?routeId=xxx
//    Called after caller presses a stop digit.
//    Computes ETA, reads it out, and SMSes the caller.
// ────────────────────────────────────────────────────────────
exports.busInfo = async (req, res) => {
  const { routeId } = req.query;
  const digit       = parseInt(req.body.Digits, 10);
  const callerPhone = req.body.From || ""; // Twilio provides caller number

  const route = await Route.findById(routeId).lean();
  if (!route || !route.stops) {
    res.set("Content-Type", "text/xml");
    return res.send(twiml(
      say("Route information not found. Please call again.") + "\n<Hangup/>"
    ));
  }

  const stops = route.stops.sort((a, b) => (a.order || 0) - (b.order || 0));
  const stopIdx = digit - 1;
  const stop = stops[stopIdx];

  if (!stop) {
    res.set("Content-Type", "text/xml");
    return res.send(twiml(
      say("Invalid stop selection. Please call again.") + "\n<Hangup/>"
    ));
  }

  // ── Find active local buses on this route ─────────────────
  const buses = await Vehicle.find({
    route: routeId,
    type: "local",
    isTracking: true,
  }).lean();

  let etaText  = "";
  let smsBusList = "";

  if (buses.length === 0) {
    etaText = `No active buses found on route ${route.name || `${route.origin} to ${route.destination}`} at this time.`;
    smsBusList = "No active buses currently on this route.";
  } else {
    // For each bus compute distance to this stop using haversine
    const eta = buses
      .filter(b => b.currentLocation?.lat && b.currentLocation?.lng)
      .map(bus => {
        const distKm  = haversine(
          bus.currentLocation.lat, bus.currentLocation.lng,
          stop.lat, stop.lng
        );
        const speedKmph = route.avgSpeedKmph || 25;
        const minutes   = Math.round((distKm / speedKmph) * 60);

        // Only include buses that haven't already passed the stop
        // (bus stop order < this stop = bus is behind)
        const busStopIdx = bus.nearestStopIndex ?? 0;
        const alreadyPassed = busStopIdx > stopIdx;

        return { bus, minutes, distKm, alreadyPassed };
      })
      .filter(e => !e.alreadyPassed && e.minutes >= 0)
      .sort((a, b) => a.minutes - b.minutes);

    if (eta.length === 0) {
      etaText = `All buses on this route have already passed ${stop.name}. Next service information is unavailable.`;
      smsBusList = `All buses have passed ${stop.name}.`;
    } else {
      const next = eta[0];
      const mins = next.minutes;

      if (mins <= 1) {
        etaText = `Bus ${next.bus.regNumber} is arriving NOW at ${stop.name}. Please be ready.`;
      } else {
        etaText = `The next bus ${next.bus.regNumber} will arrive at ${stop.name} in approximately ${mins} minutes.`;
      }

      smsBusList = eta.slice(0, 3).map((e, i) =>
        `${i + 1}. Bus ${e.bus.regNumber}: ~${e.minutes} min`
      ).join("\n");
    }
  }

  // ── Send SMS to caller ───────────────────────────────────
  const e164Phone = toE164(callerPhone);
  const smsBody =
    `🚌 PT Tracker IVR Info\n` +
    `Route: ${route.name || `${route.origin} to ${route.destination}`}\n` +
    `Stop: ${stop.name}\n\n` +
    `Upcoming buses:\n${smsBusList}\n\n` +
    `Next bus ETA is live. Safe travels! 🙏`;

  if (e164Phone) {
    sendSMS(e164Phone, smsBody).catch(err =>
      console.error("[IVR SMS Error]", err.message)
    );
  }

  // ── Respond with voice ───────────────────────────────────
  const body = twiml(
    say(`You selected stop: ${stop.name}.`) + "\n" +
    say(etaText) + "\n" +
    (e164Phone
      ? say("We have also sent this information to your registered mobile number as an S.M.S.")
      : "") + "\n" +
    say("Thank you for using the Public Transport Information System. Have a safe journey.") + "\n" +
    "<Hangup/>"
  );

  res.set("Content-Type", "text/xml");
  res.send(body);
};


// ────────────────────────────────────────────────────────────
// 5. GET /api/ivr/test  (debug route — no Twilio needed)
// ────────────────────────────────────────────────────────────
exports.test = async (req, res) => {
  const count = await Route.countDocuments({ type: "INTRACITY" });
  const buses  = await Vehicle.countDocuments({ type: "local", isTracking: true });
  res.json({
    status: "IVR ready",
    intracityRoutes: count,
    activeBuses: buses,
    twilioNumber: process.env.TWILIO_PHONE || "NOT SET",
    flow: [
      "GET /api/ivr/welcome → state menu",
      "POST /api/ivr/routes?states=... → route menu",
      "POST /api/ivr/stops?routeIds=... → stop menu",
      "POST /api/ivr/info?routeId=... → ETA + SMS",
    ],
  });
};
