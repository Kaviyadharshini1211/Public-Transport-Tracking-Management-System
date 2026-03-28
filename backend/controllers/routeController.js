const Route = require("../models/Route");
const { geocodePlace } = require("../utils/geocode");


// GET /api/routes
exports.listRoutes = async (req, res) => {
  try {
    const routes = await Route.find();
    res.json(routes);
  } catch (err) {
    console.error("listRoutes error:", err);
    res.status(500).json({ message: "Failed to fetch routes" });
  }
};

// GET /api/routes/:id
exports.getRoute = async (req, res) => {
  try {
    const route = await Route.findById(req.params.id);
    if (!route) return res.status(404).json({ message: "Route not found" });
    res.json(route);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch route" });
  }
};

// POST /api/routes
exports.createRoute = async (req, res) => {
  try {
    const { name, origin, destination, stops, avgSpeedKmph } = req.body;

    // 1. Geocode both origin & destination
    const originGeo = await geocodePlace(origin);
    const destGeo = await geocodePlace(destination);

    if (!originGeo || !destGeo) {
      return res.status(400).json({ message: "Invalid origin or destination." });
    }

    const newRoute = await Route.create({
      name,
      origin,
      destination,
      originLat: originGeo.lat,
      originLng: originGeo.lng,
      destinationLat: destGeo.lat,
      destinationLng: destGeo.lng,
      stops: stops || [],
      avgSpeedKmph: avgSpeedKmph || 50,
    });

    res.status(201).json(newRoute);
  } catch (err) {
    console.error("Route creation failed:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
// PUT /api/routes/:id
exports.updateRoute = async (req, res) => {
  try {
    const updated = await Route.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: "Route not found" });
    res.json(updated);
  } catch (err) {
    console.error("updateRoute:", err);
    res.status(500).json({ message: "Failed to update route" });
  }
};

// DELETE /api/routes/:id
exports.deleteRoute = async (req, res) => {
  try {
    await Route.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error("deleteRoute:", err);
    res.status(500).json({ message: "Failed to delete route" });
  }
};
