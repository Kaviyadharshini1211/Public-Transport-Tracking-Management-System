const Vehicle = require("../models/Vehicle");
const Route = require("../models/Route");
const User = require("../models/User");
const axios = require("axios");

// ===============================
// GET all vehicles
// ===============================
exports.listVehicles = async (req, res) => {
  try {
    const vehicles = await Vehicle.find().populate("route");
    res.json(vehicles);
  } catch (err) {
    console.error("listVehicles error:", err);
    res.status(500).json({ message: "Failed to fetch vehicles" });
  }
};

// ===============================
// GET single vehicle
// ===============================
exports.getVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id).populate("route");
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });
    res.json(vehicle);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch vehicle" });
  }
};

// ===============================
// CREATE vehicle
// ===============================
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

// ===============================
// UPDATE vehicle
// ===============================
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

// ===============================
// DELETE vehicle
// ===============================
exports.deleteVehicle = async (req, res) => {
  try {
    await Vehicle.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error("deleteVehicle:", err);
    res.status(500).json({ message: "Failed to delete vehicle" });
  }
};

// ===============================
// ASSIGN ROUTE
// ===============================
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

// ===============================
// UPDATE TRACKING (USED BY BOTH)
// ===============================
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

// ===============================
// STOP TRACKING
// ===============================
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

// ===============================
// ALL TRACKED VEHICLES
// ===============================
exports.getTrackedVehicles = async (req, res) => {
  try {
    const vehicles = await Vehicle.find().populate("route");
    res.json(vehicles);
  } catch (err) {
    console.error("getTrackedVehicles:", err);
    res.status(500).json({ message: "Failed to fetch tracked vehicles" });
  }
};

// ===============================
// PUBLIC BUSES ONLY
// ===============================
exports.getPublicBuses = async (req, res) => {
  try {
    const buses = await Vehicle.find({ isPublic: true }).populate("route");
    res.json(buses);
  } catch (err) {
    console.error("getPublicBuses:", err);
    res.status(500).json({ message: "Failed to fetch public buses" });
  }
};

// ===============================
// INTERCITY BUSES ONLY
// ===============================
exports.getIntercityBuses = async (req, res) => {
  try {
    const buses = await Vehicle.find({ isPublic: false }).populate("route");
    res.json(buses);
  } catch (err) {
    console.error("getIntercityBuses:", err);
    res.status(500).json({ message: "Failed to fetch intercity buses" });
  }
};

// ===============================
// PREDICT ETA (AI PROXY)
// ===============================
exports.predictETA = async (req, res) => {
  try {
    const { distance_remaining_km, avg_speed_kmh, traffic_index, weather_condition, bus_type } = req.body;
    
    // Call Python FastAPI
    const aiUrl = process.env.AI_SERVICE_URL || "http://127.0.0.1:8000";
    const aiRes = await axios.post(`${aiUrl}/predict_eta`, {
      distance_remaining_km: parseFloat(distance_remaining_km) || 1,
      avg_speed_kmh: parseFloat(avg_speed_kmh) || 50,
      traffic_index: traffic_index || 5, // Default moderate traffic
      weather_condition: weather_condition || 0, // Clear
      bus_type: bus_type || 0
    });

    res.json(aiRes.data);
  } catch (err) {
    console.error("predictETA:", err.message);
    res.status(500).json({ message: "Failed to predict ETA using AI" });
  }
};

// ===============================
// AUTO-ASSIGN DRIVERS VIA AI
// ===============================
exports.autoAssignDrivers = async (req, res) => {
  try {
    // 1. Get all drivers (we assume 'baseLocation' is available)
    const drivers = await User.find({ role: "driver", baseLocation: { $exists: true } });
    if (!drivers.length) return res.status(400).json({ message: "No drivers available for assignment" });

    // 2. Get all vehicles that need assignments (you could filter by unassigned, here we do all for bulk optimization)
    const vehicles = await Vehicle.find().populate("route");
    if (!vehicles.length) return res.status(400).json({ message: "No vehicles available for assignment" });

    // 3. Format payload for AI Service
    const driverPayload = drivers.map(d => ({
      id: d.email, // using email to map back
      location: { lat: d.baseLocation.lat, lng: d.baseLocation.lng },
      experience_years: d.experience_years || Math.floor(Math.random() * 15) + 2 // Mock experience if not in DB
    }));

    const vehiclePayload = vehicles.map(v => {
      // Default to 0,0 if route origin is missing
      const lat = v.route?.stops?.[0]?.lat || 0;
      const lng = v.route?.stops?.[0]?.lng || 0;
      return {
        id: v._id.toString(),
        route_origin: { lat, lng },
        type: v.type === 'long-haul' ? 1 : 0
      };
    });

    // 4. Call AI Service
    const aiUrl = process.env.AI_SERVICE_URL || "http://127.0.0.1:8000";
    console.log(`🤖 Requesting AI assignment for ${driverPayload.length} drivers & ${vehiclePayload.length} vehicles...`);
    const aiRes = await axios.post(`${aiUrl}/optimize_assignments`, {
      drivers: driverPayload,
      vehicles: vehiclePayload
    });

    const { assignments, status } = aiRes.data;
    
    // 5. Update Database with AI mappings
    let updatedCount = 0;
    for (const match of assignments) {
      await Vehicle.findByIdAndUpdate(match.vehicle_id, {
        driverName: match.driver_id
      });
      updatedCount++;
    }

    res.json({
      message: `AI Assignment complete: ${updatedCount} drivers optimally mapped.`,
      assignments,
      status
    });
  } catch (err) {
    console.error("autoAssignDrivers Error:", err.message);
    res.status(500).json({ message: "AI Auto-Assignment failed" });
  }
};