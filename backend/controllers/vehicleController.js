const Vehicle = require("../models/Vehicle");
const Route = require("../models/Route");

// GET all vehicles (populate route)
exports.listVehicles = async (req, res) => {
  try {
    const vehicles = await Vehicle.find().populate("route");
    res.json(vehicles);
  } catch (err) {
    console.error("listVehicles error:", err);
    res.status(500).json({ message: "Failed to fetch vehicles" });
  }
};

// GET single vehicle
exports.getVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id).populate("route");
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });
    res.json(vehicle);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch vehicle" });
  }
};

// POST create new vehicle
exports.createVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.create(req.body);
    const populated = await Vehicle.findById(vehicle._id).populate("route");
    res.status(201).json(populated);
  } catch (err) {
    console.error("createVehicle:", err);
    res.status(500).json({ message: "Failed to create vehicle" });
  }
};

// PUT update a vehicle
exports.updateVehicle = async (req, res) => {
  try {
    const updated = await Vehicle.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    }).populate("route");

    if (!updated) return res.status(404).json({ message: "Vehicle not found" });
    res.json(updated);
  } catch (err) {
    console.error("updateVehicle:", err);
    res.status(500).json({ message: "Failed to update vehicle" });
  }
};

// DELETE a vehicle
exports.deleteVehicle = async (req, res) => {
  try {
    await Vehicle.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error("deleteVehicle:", err);
    res.status(500).json({ message: "Failed to delete vehicle" });
  }
};

// Assign route to vehicle
exports.assignRoute = async (req, res) => {
  try {
    const { routeId } = req.body;

    const route = await Route.findById(routeId);
    if (!route) return res.status(404).json({ message: "Route not found" });

    const updated = await Vehicle.findByIdAndUpdate(
      req.params.id,
      { route: route._id },
      { new: true }
    ).populate("route");

    res.json(updated);
  } catch (err) {
    console.error("assignRoute:", err);
    res.status(500).json({ message: "Failed to assign route" });
  }
};

// Update tracking location
exports.updateTracking = async (req, res) => {
  try {
    const { lat, lng } = req.body;

    const updated = await Vehicle.findByIdAndUpdate(
      req.params.id,
      {
        currentLocation: { lat, lng },
        lastSeenAt: new Date(),
        isTracking: true,
      },
      { new: true }
    );

    res.json({ success: true, vehicle: updated });
  } catch (err) {
    console.error("updateTracking:", err);
    res.status(500).json({ message: "Failed to update tracking" });
  }
};

// Stop tracking
exports.stopTracking = async (req, res) => {
  try {
    const updated = await Vehicle.findByIdAndUpdate(
      req.params.id,
      { isTracking: false },
      { new: true }
    );

    res.json({ success: true, vehicle: updated });
  } catch (err) {
    console.error("stopTracking:", err);
    res.status(500).json({ message: "Failed to stop tracking" });
  }
};
