const express = require("express");
const router  = express.Router();

const {
  getLiveBuses,
  getETAForStop,
  getLocalRoutes,
  updateLocalTracking,
  stopLocalTracking,
  getFleetStats,
} = require("../controllers/localBusController");

const { protect, authorize } = require("../middleware/authMiddleware");

// ── Public (no auth) ─────────────────────────────────────────────────────────
router.get("/live",                   getLiveBuses);
router.get("/routes",                 getLocalRoutes);
router.get("/eta/:routeId/:stopIndex", getETAForStop);

// ── Driver (must be logged in) ───────────────────────────────────────────────
router.post("/:vehicleId/tracking",          protect, updateLocalTracking);
router.patch("/:vehicleId/tracking/stop",    protect, stopLocalTracking);

// ── Admin only ───────────────────────────────────────────────────────────────
router.get("/stats", protect, authorize("admin"), getFleetStats);

module.exports = router;