const axios = require("axios");
const Route = require("../models/Route");
const Vehicle = require("../models/Vehicle");
const Booking = require("../models/Booking");

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_MODEL = process.env.GROQ_MODEL || "llama-3.1-8b-instant";

const SYSTEM_PROMPT = `
You are PT Tracker Assistant for a public transport booking and tracking app.
Your job:
- Help users with booking, cancellations, live tracking, fares, seats, payments, tickets, and account issues.
- Give clear, practical, short steps.
- If missing details, ask a focused follow-up question.
- Never claim actions are completed unless the user confirms.
- Keep tone friendly and professional.
- Never invent departure time slots, seat package names, or prices.
- If timing/package data is not in system context, explicitly say it is not available and guide user to booking flow.
- Never ask for or collect password, card details, OTP, or sensitive payment credentials.
`.trim();

const normalise = (value) => String(value || "").trim().toLowerCase();

// ─── Time helpers (mirrors Book.js generateMockTimes) ────────────────────────
const generateMockTimes = (vehicleId, distanceKm, avgSpeed) => {
  const charCode = vehicleId ? String(vehicleId).charCodeAt(String(vehicleId).length - 1) : 0;
  const startHour = 6 + (charCode % 15); // 6 AM – 8 PM

  const dist = distanceKm || 300;
  const speed = avgSpeed || 50;
  const durationHours = dist / speed;
  const durationH = Math.floor(durationHours);
  const durationM = Math.round((durationHours - durationH) * 60);

  const endHour = startHour + durationH + Math.floor(durationM / 60);
  const endMin = (Math.round(durationM / 5) * 5) % 60;

  const formatAmPm = (h, m) => {
    const period = h >= 12 && h < 24 ? "PM" : "AM";
    let hr = h % 12;
    if (hr === 0) hr = 12;
    return `${hr.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")} ${period}`;
  };

  // 24-h numeric for sorting
  const departureSortKey = startHour * 60; // minutes since midnight

  return {
    departureTime: formatAmPm(startHour, 0),
    eta: formatAmPm(endHour, endMin),
    durationText: `${durationH}h ${durationM}m`,
    departureSortKey,
  };
};

const extractTripQuery = (text) => {
  const input = String(text || "").trim();
  if (!input) return null;

  // Pattern 1: explicitly uses "from X to Y"
  const explicitFromTo = input.match(/\bfrom\s+([a-zA-Z\s]+?)\s+to\s+([a-zA-Z\s]+)/i);
  if (explicitFromTo) {
    return { from: explicitFromTo[1].trim(), to: explicitFromTo[2].trim() };
  }

  // Pattern 2: "between X and Y"
  const between = input.match(/\bbetween\s+([a-zA-Z\s]+?)\s+and\s+([a-zA-Z\s]+)/i);
  if (between) {
    return { from: between[1].trim(), to: between[2].trim() };
  }

  // Pattern 3: implicit "X to Y" with conversational padding removed
  let stripped = input.replace(/^(?:i want a bus|i want to go|i need a bus|show me buses|show me|find me|buses|bus|route|early options for the|options for the|the|any options for|search for|look for|can u tell me any early options for|early options for)\s+/i, '').trim();
  stripped = stripped.replace(/\s+(?:route|bus|buses|options)$/i, '').trim();

  const implicitTo = stripped.match(/^([a-zA-Z\s]+?)\s+to\s+([a-zA-Z\s]+)$/i);
  if (implicitTo) {
    return { from: implicitTo[1].trim(), to: implicitTo[2].trim() };
  }

  return null;
};

const parseDateToISO = (rawText) => {
  const text = String(rawText || "");
  // DD/MM/YYYY or DD-MM-YYYY
  const dmy = text.match(/\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})\b/);
  if (dmy) {
    let day = Number(dmy[1]);
    let month = Number(dmy[2]);
    let year = Number(dmy[3]);
    if (year < 100) year += 2000;
    if (day < 1 || day > 31 || month < 1 || month > 12) return null;
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }
  // YYYY-MM-DD (already ISO)
  const iso = text.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (iso) return iso[0];
  return null;
};

const parsePassengers = (rawText) => {
  const text = String(rawText || "").toLowerCase();
  const explicit = text.match(/\b(\d+)\s*passenger/);
  if (explicit) return Math.max(1, Number(explicit[1]));
  const numberOnly = text.match(/\b(\d+)\b/);
  if (numberOnly && Number(numberOnly[1]) > 0 && Number(numberOnly[1]) <= 10) {
    return Number(numberOnly[1]);
  }
  return null;
};

// ─── Route / matching helpers ─────────────────────────────────────────────────
const findDirectionalMatch = (route, fromNeedle, toNeedle) => {
  const sequence = [route.origin, ...(route.stops || []).map((s) => s.name), route.destination]
    .map(normalise)
    .filter(Boolean);

  const fromIndices = sequence.map((v, i) => (v.includes(fromNeedle) ? i : -1)).filter((i) => i >= 0);
  const toIndices = sequence.map((v, i) => (v.includes(toNeedle) ? i : -1)).filter((i) => i >= 0);

  if (!fromIndices.length || !toIndices.length) return false;
  return Math.min(...fromIndices) < Math.min(...toIndices);
};

// ─── Regex intent matchers ───────────────────────────────────────────────────
const BOOKING_HELP_RE = /how\s+do\s+i\s+book|book\s+a\s+ticket|how\s+to\s+book/i;
const TRACK_HELP_RE = /how\s+can\s+i\s+track|track\s+my\s+booked\s+bus|track\s+bus/i;
const CANCEL_HELP_RE = /how\s+do\s+i\s+cancel|cancel\s+booking|cancel\s+ticket/i;
const BOOKING_INTENT_RE = /\b(book|booking|reserve|reservation)\b/i;
const BOOKING_FLOW_RE =
  /\b(boarding|dropping|drop|seat|seats|economy|premium|deluxe|payment|pay|netbanking|wallet|upi|credit|debit|card|password|otp|email|phone)\b/i;
const AUTO_BOOK_RE = /\b(select seats for me|choose seats for me|book for me|auto book|do it for me)\b/i;
const REG_NUMBER_RE = /\b[A-Z]{2}\s*\d{2}\s*[A-Z]\s*\d{4}\b/i;
const BUS_DETAILS_RE = /\b(details|info|information|route|fare|price|seats|seat|departure|arrival)\b/i;
const EARLIEST_RE = /\b(earliest|morning|first\s+bus|early|first\s+departure|ealry|6\s*am|7\s*am)\b/i;

// ─── Bus card builder ─────────────────────────────────────────────────────────
const buildBusCard = (vehicleDoc, fallbackFrom, fallbackTo) => {
  const route = vehicleDoc?.route || {};
  const distanceKm = route?.distanceKm || 300;
  const avgSpeed = route?.avgSpeedKmph || 50;
  const times = generateMockTimes(vehicleDoc?._id, distanceKm, avgSpeed);

  return {
    vehicleId: vehicleDoc?._id,
    routeId: route?._id || null,
    regNumber: vehicleDoc?.regNumber || "N/A",
    model: vehicleDoc?.model || "Bus",
    type: route?.type || (vehicleDoc?.type === "local" ? "INTRACITY" : "INTERCITY"),
    routeName: route?.name || route?.routeName || `${route?.origin || ""} to ${route?.destination || ""}`.trim(),
    from: route?.origin || fallbackFrom || "N/A",
    to: route?.destination || fallbackTo || "N/A",
    seats: vehicleDoc?.capacity || 0,
    liveTracking: Boolean(vehicleDoc?.isTracking),
    departureTime: times.departureTime,
    eta: times.eta,
    durationText: times.durationText,
    departureSortKey: times.departureSortKey,
    estimatedFare: Math.round(distanceKm * 2),
    bookingLink: `/book?from=${encodeURIComponent(route?.origin || fallbackFrom || "")}&to=${encodeURIComponent(
      route?.destination || fallbackTo || ""
    )}`,
  };
};

// ─── Bus search ───────────────────────────────────────────────────────────────
const searchBuses = async (from, to) => {
  const fromNeedle = normalise(from);
  const toNeedle = normalise(to);
  if (!fromNeedle || !toNeedle) return [];

  const routes = await Route.find().lean();
  const matchedRoutes = routes.filter((route) => findDirectionalMatch(route, fromNeedle, toNeedle));
  const routeIds = matchedRoutes.map((r) => r._id);

  const vehicles = await Vehicle.find({ route: { $in: routeIds }, status: "active" })
    .select("regNumber model type capacity route isTracking")
    .lean();

  const routeMap = new Map(matchedRoutes.map((r) => [String(r._id), r]));

  const cards = vehicles.slice(0, 10).map((vehicle) => {
    const route = routeMap.get(String(vehicle.route));
    return buildBusCard({ ...vehicle, route }, from, to);
  });

  // Default sort: earliest departure first
  cards.sort((a, b) => a.departureSortKey - b.departureSortKey);
  return cards;
};

// ─── Auto booking plan ────────────────────────────────────────────────────────
const findStopIndexByCity = (stops, cityNeedle) => {
  if (!Array.isArray(stops) || !stops.length || !cityNeedle) return -1;
  const needle = normalise(cityNeedle);
  return stops.findIndex((s) => normalise(s?.name).includes(needle));
};

const buildAutoBookingPlan = async ({ regNumber, date, passengers, from, to }) => {
  const vehicle = await Vehicle.findOne({ regNumber, status: "active" }).populate("route").lean();
  if (!vehicle || !vehicle.route) return null;

  const route = vehicle.route;
  const stops = route.stops || [];

  let boardingIdx = findStopIndexByCity(stops, from);
  let droppingIdx = findStopIndexByCity(stops, to);

  if (boardingIdx === -1) boardingIdx = 0;
  if (droppingIdx === -1) droppingIdx = Math.max(stops.length - 1, 0);
  if (droppingIdx <= boardingIdx && stops.length > 1) {
    droppingIdx = Math.min(stops.length - 1, boardingIdx + 1);
  }

  const boardingStop = stops[boardingIdx] || { name: route.origin || "Boarding Point" };
  const droppingStop = stops[droppingIdx] || { name: route.destination || "Dropping Point" };

  const booked = await Booking.find({
    vehicleId: vehicle._id,
    journeyDate: date,
    status: "Confirmed",
  })
    .select("seatNumbers")
    .lean();

  const reserved = new Set(
    booked.flatMap((b) => (b.seatNumbers || []).map((s) => Number(String(s).replace(/\D/g, "")))).filter(Boolean)
  );

  const capacity = vehicle.capacity || 40;
  const seatCount = Math.max(1, Math.min(passengers || 1, 6));
  const selectedSeats = [];
  for (let i = 1; i <= capacity && selectedSeats.length < seatCount; i += 1) {
    if (!reserved.has(i)) selectedSeats.push(String(i));
  }

  if (selectedSeats.length < seatCount) return null;

  const pricePerSeat = Math.round((route.distanceKm || 200) * 2);
  const totalFare = pricePerSeat * selectedSeats.length;

  return {
    vehicleCard: buildBusCard({ ...vehicle, route }, route.origin, route.destination),
    confirmPayload: {
      vehicle: {
        _id: vehicle._id,
        model: vehicle.model,
        regNumber: vehicle.regNumber,
        route: { origin: route.origin, destination: route.destination },
      },
      routeId: route._id,
      seatNumbers: selectedSeats,
      totalFare,
      boardingStop,
      droppingStop,
      date,
      passengers: selectedSeats.length,
      autoSelected: true,
    },
  };
};

// ─── Main handler ─────────────────────────────────────────────────────────────
exports.chatWithAssistant = async (req, res) => {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ message: "GROQ_API_KEY is not configured on server." });
    }

    const incomingMessages = Array.isArray(req.body.messages) ? req.body.messages : [];
    const userMessage = String(req.body.message || "").trim();

    // Booking context sent by frontend (persisted across turns)
    const clientContext = req.body.context || {};
    const ctxFrom = clientContext.from || null;
    const ctxTo = clientContext.to || null;
    const ctxDate = clientContext.date || null;
    const ctxPassengers = clientContext.passengers || null;

    if (!incomingMessages.length && !userMessage) {
      return res.status(400).json({ message: "Please provide a message." });
    }

    // ── Scoped reg-number extraction ──────────────────────────────────────────
    // Only look at the CURRENT message for a reg number (prevents stale context bleed).
    const currentRegMatch = userMessage.match(REG_NUMBER_RE);
    const requestedReg = currentRegMatch ? currentRegMatch[0].replace(/\s+/g, '').toUpperCase() : null;

    // For booking-intent we allow falling back to the very last user message that mentioned a reg.
    const historyText = incomingMessages.map((m) => m?.content || "").join(" ");
    const historyRegMatch = historyText.match(/\b([A-Z]{2}\s*\d{2}\s*[A-Z]\s*\d{4})\b/gi);
    const lastHistoryReg = historyRegMatch ? historyRegMatch[historyRegMatch.length - 1].replace(/\s+/g, '').toUpperCase() : null;

    // ── Parse current message ─────────────────────────────────────────────────
    let tripQuery = extractTripQuery(userMessage);
    const wantsEarliest = EARLIEST_RE.test(userMessage);
    
    // If they asked for the earliest but we didn't extract a new route, use the context route.
    if (!tripQuery && wantsEarliest && ctxFrom && ctxTo) {
      tripQuery = { from: ctxFrom, to: ctxTo };
    }

    const travelFrom = tripQuery?.from || ctxFrom || null;
    const travelTo = tripQuery?.to || ctxTo || null;
    const newDate = parseDateToISO(userMessage);
    const newPassengers = parsePassengers(userMessage);
    const travelDate = newDate || ctxDate || null;
    const passengers = newPassengers || ctxPassengers || null;

    const busResults = tripQuery ? await searchBuses(tripQuery.from, tripQuery.to) : [];

    // ─── Deterministic short-circuit responses ────────────────────────────────

    if (BOOKING_HELP_RE.test(userMessage)) {
      return res.status(200).json({
        reply:
          "To book a ticket: go to the Book Ticket page, search From/To, pick a bus, select seats, and complete payment on the confirm screen.",
        model: DEFAULT_MODEL,
        busResults: [],
        tripQuery: null,
      });
    }

    if (TRACK_HELP_RE.test(userMessage)) {
      return res.status(200).json({
        reply:
          "To track your booked bus: open My Bookings and tap Track Bus on a confirmed booking. Live location is available when tracking is active for that vehicle.",
        model: DEFAULT_MODEL,
        busResults: [],
        tripQuery: null,
      });
    }

    if (CANCEL_HELP_RE.test(userMessage)) {
      return res.status(200).json({
        reply:
          "To cancel: open My Bookings, choose a confirmed booking, and click Cancel Booking. Cancelled bookings cannot be undone.",
        model: DEFAULT_MODEL,
        busResults: [],
        tripQuery: null,
      });
    }

    // ─── Trip query: user wants buses for a route ─────────────────────────────
    if (tripQuery && !requestedReg && !newDate && !newPassengers) {
      let results = busResults; // already sorted earliest first

      // If user asked specifically for earliest, return only top 1
      if (wantsEarliest && results.length > 0) {
        results = [results[0]];
      }

      const reply = results.length
        ? `We have ${results.length} bus${results.length > 1 ? "es" : ""} available for ${tripQuery.from} to ${tripQuery.to}${
            wantsEarliest ? ` — showing the earliest departure (${results[0].departureTime})` : ""
          }. Tap "Book this bus" on any option below.`
        : `I could not find active buses for ${tripQuery.from} to ${tripQuery.to} right now. Try nearby cities or check back later.`;

      // Determine if we still need date/passengers for deep-link
      const needsBookingDetails = !travelDate || !passengers;

      return res.status(200).json({
        reply,
        model: DEFAULT_MODEL,
        busResults: results,
        tripQuery,
        needsBookingDetails,
        bookingContext: { from: tripQuery.from, to: tripQuery.to, date: travelDate, passengers },
      });
    }

    // ─── User provides date/passengers after seeing bus results ───────────────
    // Detect "I want to go on 25 May" / "2 passengers" without a new route query
    // (newDate and newPassengers are already parsed above)

    if (!tripQuery && (newDate || newPassengers) && (ctxFrom || ctxTo)) {
      const resolvedDate = newDate || ctxDate;
      const resolvedPassengers = newPassengers || ctxPassengers;
      const resolvedFrom = ctxFrom;
      const resolvedTo = ctxTo;

      if (resolvedDate && resolvedPassengers && resolvedFrom && resolvedTo) {
        // All booking details collected — navigate to booking page
        return res.status(200).json({
          reply: `Great! Opening the booking page for ${resolvedFrom} to ${resolvedTo} on ${resolvedDate} for ${resolvedPassengers} passenger${resolvedPassengers > 1 ? "s" : ""}. 🚌`,
          model: DEFAULT_MODEL,
          busResults: [],
          tripQuery: null,
          action: {
            type: "navigate_to_booking",
            params: {
              from: resolvedFrom,
              to: resolvedTo,
              date: resolvedDate,
              passengers: resolvedPassengers,
            },
          },
          bookingContext: { from: resolvedFrom, to: resolvedTo, date: resolvedDate, passengers: resolvedPassengers },
        });
      }

      // Partial update — still missing something
      const updatedCtx = {
        from: resolvedFrom,
        to: resolvedTo,
        date: resolvedDate,
        passengers: resolvedPassengers,
      };

      const missing = [];
      if (!resolvedDate) missing.push("departure date (DD/MM/YYYY)");
      if (!resolvedPassengers) missing.push("number of passengers");

      return res.status(200).json({
        reply: `Got it! Still need your ${missing.join(" and ")} to open the booking page.`,
        model: DEFAULT_MODEL,
        busResults: [],
        tripQuery: null,
        needsBookingDetails: true,
        bookingContext: updatedCtx,
      });
    }

    // ─── Booking intent with reg number from current message ──────────────────
    if (BOOKING_INTENT_RE.test(userMessage) && requestedReg) {
      const vehicle = await Vehicle.findOne({ regNumber: requestedReg, status: "active" })
        .populate("route")
        .lean();

      if (!vehicle) {
        return res.status(200).json({
          reply: `I could not find an active bus with number ${requestedReg}. Please check the bus number and try again.`,
          model: DEFAULT_MODEL,
          busResults: [],
          tripQuery: null,
        });
      }

      const busCard = buildBusCard(vehicle);
      const dateText = travelDate ? ` on ${travelDate}` : "";
      const paxText = passengers ? ` for ${passengers} passenger${passengers > 1 ? "s" : ""}` : "";

      return res.status(200).json({
        reply: `Found ${requestedReg}${dateText}${paxText}. Click "Book this bus" below to proceed.`,
        model: DEFAULT_MODEL,
        busResults: [busCard],
        tripQuery: null,
      });
    }

    // ─── Bus details lookup (current message only) ────────────────────────────
    if (requestedReg && (BUS_DETAILS_RE.test(userMessage) || !tripQuery)) {
      const vehicle = await Vehicle.findOne({ regNumber: requestedReg, status: "active" })
        .populate("route")
        .lean();

      if (!vehicle || !vehicle.route) {
        return res.status(200).json({
          reply: `I could not find active route details for ${requestedReg} in the database.`,
          model: DEFAULT_MODEL,
          busResults: [],
          tripQuery: null,
        });
      }

      const route = vehicle.route;
      const busCard = buildBusCard({ ...vehicle, route }, route.origin, route.destination);

      return res.status(200).json({
        reply:
          `${requestedReg} — Route: ${route.origin} → ${route.destination}, ` +
          `Seats: ${vehicle.capacity || 0}, Fare: ₹${busCard.estimatedFare}/seat, ` +
          `Departure: ${busCard.departureTime}, ETA: ${busCard.eta}. ` +
          `Tap "Book this bus" below to continue.`,
        model: DEFAULT_MODEL,
        busResults: [busCard],
        tripQuery: null,
      });
    }

    // ─── Auto-select seats and navigate to confirm payment ────────────────────
    const regToUse = requestedReg || lastHistoryReg;
    const autoBookIntent =
      AUTO_BOOK_RE.test(userMessage) ||
      (regToUse && travelDate && passengers && /^(yes|ok|okay|proceed|continue|let's go|lets go|book|choose|i want)\b/i.test(userMessage)) ||
      (requestedReg && newDate && newPassengers); // User provided everything at once

    if (autoBookIntent) {
      if (!regToUse || !travelDate || !passengers) {
        return res.status(200).json({
          reply:
            "I can auto-select everything for you. Please share bus number, date (DD/MM/YYYY), and passenger count in one message.",
          model: DEFAULT_MODEL,
          busResults: [],
          tripQuery: null,
        });
      }

      const plan = await buildAutoBookingPlan({
        regNumber: regToUse,
        date: travelDate,
        passengers,
        from: travelFrom,
        to: travelTo,
      });

      if (!plan) {
        return res.status(200).json({
          reply:
            "I could not auto-prepare this booking (bus unavailable or not enough seats). Please open the booking page and select manually.",
          model: DEFAULT_MODEL,
          busResults: [],
          tripQuery: null,
          action: { type: "navigate_to_booking", params: { from: travelFrom, to: travelTo } },
        });
      }

      return res.status(200).json({
        reply: `Done! I selected ${plan.confirmPayload.seatNumbers.length} seat(s) on ${regToUse} for ${travelDate}. Opening the confirm payment page now.`,
        model: DEFAULT_MODEL,
        busResults: [plan.vehicleCard],
        tripQuery: null,
        action: { type: "navigate_to_confirm", confirmPayload: plan.confirmPayload },
      });
    }

    // ─── Guardrail: no fake checkout in chat ───────────────────────────────────
    if (BOOKING_FLOW_RE.test(userMessage)) {
      return res.status(200).json({
        reply:
          'Please use the booking page for seat selection, boarding/dropping points, and payment. Click "Book this bus" on any result to get started.',
        model: DEFAULT_MODEL,
        busResults: [],
        tripQuery: null,
      });
    }

    // ─── Groq LLM fallback ────────────────────────────────────────────────────
    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...incomingMessages
        .filter((m) => m && typeof m.content === "string" && (m.role === "user" || m.role === "assistant"))
        .slice(-14)
        .map((m) => ({ role: m.role, content: m.content })),
    ];

    if (userMessage) {
      messages.push({ role: "user", content: userMessage });
    }

    const response = await axios.post(
      GROQ_API_URL,
      { model: DEFAULT_MODEL, messages, temperature: 0.4, max_tokens: 500 },
      {
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        timeout: 20000,
      }
    );

    const reply = response.data?.choices?.[0]?.message?.content?.trim();
    if (!reply) {
      return res.status(502).json({ message: "Assistant returned an empty response." });
    }

    return res.status(200).json({
      reply,
      model: response.data?.model || DEFAULT_MODEL,
      busResults: [],
      tripQuery: null,
    });
  } catch (err) {
    console.error("Chatbot error:", err.response?.data || err.message);
    return res.status(500).json({ message: "Unable to reach assistant right now. Please try again." });
  }
};
