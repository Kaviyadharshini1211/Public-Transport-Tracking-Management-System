const express = require("express");
const router = express.Router();

const {
  getLiveBuses,
  getETAForStop,
  getLocalRoutes,
  updateLocalTracking,
  stopLocalTracking,
  getFleetStats,
  predictCrowd,
  getCrowdStatus,
  deploySpareBus,
  getSpareBuses,
} = require("../controllers/localBusController");

const { protect, authorize } = require("../middleware/authMiddleware");

// ── Public (no auth) ─────────────────────────────────────────────────────────
router.get("/live", getLiveBuses);
router.get("/routes", getLocalRoutes);
router.get("/eta/:routeId/:stopIndex", getETAForStop);

// ── Driver (must be logged in) ───────────────────────────────────────────────
router.post("/:vehicleId/tracking", protect, updateLocalTracking);
router.patch("/:vehicleId/tracking/stop", protect, stopLocalTracking);

// ── Admin only ───────────────────────────────────────────────────────────────
router.get("/stats", protect, authorize("admin"), getFleetStats);
router.get("/crowd-status", protect, authorize("admin"), getCrowdStatus);
router.get("/spare-buses", protect, authorize("admin"), getSpareBuses);
router.post("/crowd-predict", protect, authorize("admin"), predictCrowd);
router.post("/deploy-spare/:routeId", protect, authorize("admin"), deploySpareBus);

module.exports = router;