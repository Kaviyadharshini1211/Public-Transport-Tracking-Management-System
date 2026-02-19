const express = require("express");
const Vehicle = require("../models/Vehicle");

const {
  listVehicles,
  getVehicle,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  assignRoute,
  updateTracking,
  stopTracking
} = require("../controllers/vehicleController");

const router = express.Router();

// CRUD
router.get("/", listVehicles);
router.get("/:id", getVehicle);
router.post("/", createVehicle);
router.put("/:id", updateVehicle);
router.delete("/:id", deleteVehicle);

// Assign a route
router.patch("/:id/assign-route", assignRoute);
router.get("/by-route/:routeId", async (req, res) => {
  try {
    const list = await Vehicle.find({ route: req.params.routeId }).populate("route");
    res.json(list);
  } catch (err) {
    console.error("vehicles by-route error:", err);
    res.status(500).json({ message: "Failed to fetch vehicles for route" });
  }
});

// Tracking
router.post("/:id/tracking", updateTracking);
router.patch("/:id/tracking/stop", stopTracking);

module.exports = router;
