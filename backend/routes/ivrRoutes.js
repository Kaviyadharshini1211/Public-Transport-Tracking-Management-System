/**
 * IVR Routes
 * Twilio Voice webhooks for the IVR bus-timing system.
 * All routes are public (no auth) — Twilio POSTs to these.
 *
 * Register in server.js:
 *   app.use("/api/ivr", require("./routes/ivrRoutes"));
 */
const express = require("express");
const router  = express.Router();
const ivr     = require("../controllers/ivrController");

// ── Entry point ─────────────────────────────────────────────
// Configure in Twilio Console → Voice → "A call comes in" webhook
// URL: https://your-backend.com/api/ivr/welcome
router.get( "/welcome", ivr.welcome);
router.post("/welcome", ivr.welcome); // Twilio may POST on redirect

// ── State → routes ──────────────────────────────────────────
router.post("/routes", ivr.listRoutes);

// ── Routes → stops ──────────────────────────────────────────
router.post("/stops", ivr.listStops);

// ── Stop → ETA info + SMS ───────────────────────────────────
router.post("/info", ivr.busInfo);

// ── Debug / health check ────────────────────────────────────
router.get("/test", ivr.test);

module.exports = router;
