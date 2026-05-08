const Vehicle = require("../models/Vehicle");
const Route   = require("../models/Route");
const axios   = require("axios");

// ─── Haversine distance (km) ──────────────────────────────────────────────────
const haversine = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// ─── Find nearest stop index ─────────────────────────────────────────────────
const nearestStop = (lat, lng, stops) => {
  let minDist = Infinity;
  let idx = 0;
  stops.forEach((s, i) => {
    const d = haversine(lat, lng, s.lat, s.lng);
    if (d < minDist) { minDist = d; idx = i; }
  });
  return { index: idx, distanceKm: minDist };
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/local-buses/live?routeId=...
// Public — all currently-tracking local buses (optionally filtered by route)
// ─────────────────────────────────────────────────────────────────────────────
exports.getLiveBuses = async (req, res) => {
  try {
    const query = { type: "local", isTracking: true };
    if (req.query.routeId) query.route = req.query.routeId;

    const buses = await Vehicle.find(query)
      .populate("route", "name stops avgSpeedKmph origin destination")
      .select("regNumber model currentLocation lastSeenAt nearestStopIndex route driverName status capacity");

    const now = Date.now();
    const result = buses.map((b) => {
      const obj = b.toObject();
      // Mark stale if no ping in last 3 minutes
      obj.isStale = !b.lastSeenAt || now - new Date(b.lastSeenAt).getTime() > 3 * 60 * 1000;
      return obj;
    });

    res.json(result);
  } catch (err) {
    console.error("getLiveBuses:", err);
    res.status(500).json({ message: "Failed to fetch live buses" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/local-buses/routes
// Public — all routes that have at least one local bus assigned
// ─────────────────────────────────────────────────────────────────────────────
exports.getLocalRoutes = async (req, res) => {
  try {
    // unique route IDs used by local vehicles (regardless of tracking status)
    const routeIds = await Vehicle.find({ type: "local", route: { $ne: null } }).distinct("route");

    const routes = await Route.find({ _id: { $in: routeIds } });

    // count active buses per route
    const activeCounts = await Vehicle.aggregate([
      { $match: { type: "local", route: { $in: routeIds }, isTracking: true } },
      { $group: { _id: "$route", count: { $sum: 1 } } },
    ]);
    const countMap = {};
    activeCounts.forEach((c) => { countMap[c._id.toString()] = c.count; });

    const enriched = routes.map((r) => {
      const obj = r.toObject();
      // Normalise: seed uses "name", old schema used "routeName"
      if (!obj.name && obj.routeName) obj.name = obj.routeName;
      if (!obj.name) obj.name = `Route ${obj._id.toString().slice(-5)}`;
      obj.activeBusCount = countMap[obj._id.toString()] || 0;
      return obj;
    });

    res.json(enriched);
  } catch (err) {
    console.error("getLocalRoutes:", err);
    res.status(500).json({ message: "Failed to fetch local routes" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/local-buses/eta/:routeId/:stopIndex
// Public — ETA for every live bus on this route to the chosen stop
// ─────────────────────────────────────────────────────────────────────────────
exports.getETAForStop = async (req, res) => {
  try {
    const { routeId, stopIndex } = req.params;
    const targetIdx = parseInt(stopIndex, 10);

    const route = await Route.findById(routeId);
    if (!route) return res.status(404).json({ message: "Route not found" });
    if (!route.stops || targetIdx >= route.stops.length) {
      return res.status(400).json({ message: "Invalid stop index" });
    }

    const targetStop = route.stops[targetIdx];
    const avgSpeed   = route.avgSpeedKmph || 40;

    const buses = await Vehicle.find({
      type: "local",
      route: routeId,
      isTracking: true,
      currentLocation: { $ne: null },
    }).select("regNumber currentLocation lastSeenAt nearestStopIndex driverName");

    const now = Date.now();
    const activeBuses = buses.filter(b => b.lastSeenAt && (now - new Date(b.lastSeenAt).getTime() <= 3 * 60 * 1000));

    const arrivalPromises = activeBuses.map(async (bus) => {
      const { lat, lng } = bus.currentLocation;
      const distKm = haversine(lat, lng, targetStop.lat, targetStop.lng);
      
      let etaMin = 0;
      if (distKm > 0.15) {
        try {
          const currentHour = new Date().getHours();
          const aiUrl = process.env.AI_SERVICE_URL || "http://127.0.0.1:8000";
          const aiRes = await axios.post(`${aiUrl}/predict_eta`, {
            distance_remaining_km: distKm,
            avg_speed_kmh: avgSpeed,
            traffic_index: 5, // Default moderate traffic
            weather_condition: 0, // Clear weather
            time_of_day: currentHour,
            bus_type: 0 // Standard local bus
          });
          etaMin = Math.round(aiRes.data.estimated_minutes);
        } catch (e) {
          console.error("AI ETA prediction failed, using fallback:", e.message);
          etaMin = Math.round((distKm / avgSpeed) * 60);
        }
      }

      return {
        vehicleId:   bus._id,
        regNumber:   bus.regNumber,
        driverName:  bus.driverName || "—",
        etaMinutes:  etaMin,
        distanceKm:  parseFloat(distKm.toFixed(2)),
        status:      etaMin === 0 ? "arriving" : "en-route",
        lastSeenAt:  bus.lastSeenAt,
      };
    });

    const arrivals = await Promise.all(arrivalPromises);

    arrivals.sort((a, b) => a.etaMinutes - b.etaMinutes);

    res.json({
      stop:             { ...targetStop.toObject(), index: targetIdx },
      route:            { id: route._id, name: route.name },
      arrivals,
      totalBusesTracked: arrivals.length,
    });
  } catch (err) {
    console.error("getETAForStop:", err);
    res.status(500).json({ message: "Failed to calculate ETA" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/local-buses/:vehicleId/tracking
// Driver — send a GPS ping (called every few seconds from the driver screen)
// ─────────────────────────────────────────────────────────────────────────────
exports.updateLocalTracking = async (req, res) => {
  try {
    const { lat, lng } = req.body;
    const { vehicleId } = req.params;

    const vehicle = await Vehicle.findById(vehicleId).populate("route", "stops");
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });

    // find which stop the bus is nearest to
    let nearestStopIndex = null;
    if (vehicle.route?.stops?.length) {
      const { index } = nearestStop(lat, lng, vehicle.route.stops);
      nearestStopIndex = index;
    }

    await Vehicle.findByIdAndUpdate(vehicleId, {
      currentLocation: { lat, lng },
      lastSeenAt:      new Date(),
      isTracking:      true,
      nearestStopIndex,
    });

    res.json({ success: true, nearestStopIndex });
  } catch (err) {
    console.error("updateLocalTracking:", err);
    res.status(500).json({ message: "Failed to update tracking" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/local-buses/:vehicleId/tracking/stop
// Driver — end shift, mark bus offline
// ─────────────────────────────────────────────────────────────────────────────
exports.stopLocalTracking = async (req, res) => {
  try {
    const updated = await Vehicle.findByIdAndUpdate(
      req.params.vehicleId,
      { isTracking: false },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: "Vehicle not found" });
    res.json({ success: true });
  } catch (err) {
    console.error("stopLocalTracking:", err);
    res.status(500).json({ message: "Failed to stop tracking" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/local-buses/stats   (admin)
// ─────────────────────────────────────────────────────────────────────────────
exports.getFleetStats = async (req, res) => {
  try {
    const [total, active, assigned] = await Promise.all([
      Vehicle.countDocuments({ type: "local" }),
      Vehicle.countDocuments({ type: "local", isTracking: true }),
      Vehicle.countDocuments({ type: "local", route: { $ne: null } }),
    ]);

    const topRoutes = await Vehicle.aggregate([
      { $match: { type: "local", isTracking: true, route: { $ne: null } } },
      { $group: { _id: "$route", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $lookup: { from: "routes", localField: "_id", foreignField: "_id", as: "routeInfo" } },
      { $unwind: "$routeInfo" },
      { $project: { routeName: "$routeInfo.name", activeBuses: "$count" } },
    ]);

    res.json({ total, active, assigned, unassigned: total - assigned, topRoutes });
  } catch (err) {
    console.error("getFleetStats:", err);
    res.status(500).json({ message: "Failed to fetch fleet stats" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/local-buses/crowd-predict   (admin)
// Calls the AI crowd predictor for a specific route
// ─────────────────────────────────────────────────────────────────────────────
exports.predictCrowd = async (req, res) => {
  try {
    const { routeId, stop_index = 0, weather_condition = 0, traffic_index = 5, is_holiday = 0 } = req.body;

    const route = await Route.findById(routeId);
    if (!route) return res.status(404).json({ message: "Route not found" });

    const now = new Date();
    const hour_of_day = now.getHours();
    const day_of_week = now.getDay() === 0 ? 6 : now.getDay() - 1;
    const total_stops = route.stops?.length || 10;

    const busCount = await Vehicle.countDocuments({ type: "local", route: routeId, isTracking: true });
    const capacityAgg = await Vehicle.aggregate([
      { $match: { type: "local", route: route._id } },
      { $group: { _id: null, avgCap: { $avg: "$capacity" } } },
    ]);
    const bus_capacity = Math.round(capacityAgg[0]?.avgCap || 50);

    const aiUrl = process.env.AI_SERVICE_URL || "http://127.0.0.1:8000";
    const aiRes = await axios.post(`${aiUrl}/predict_crowd`, {
      hour_of_day, day_of_week, stop_index, total_stops,
      route_type: 0, bus_capacity, weather_condition, traffic_index, is_holiday,
    });

    const prediction = aiRes.data;
    res.json({
      route: { _id: route._id, name: route.name || route.routeName, origin: route.origin, destination: route.destination },
      activeBuses: busCount,
      prediction,
      recommendation: prediction.crowd_level >= 3 ? "HIGH_CROWD" : prediction.crowd_level >= 2 ? "MODERATE" : "NORMAL",
    });
  } catch (err) {
    console.error("predictCrowd:", err.message);
    res.status(500).json({ message: "Crowd prediction failed: " + err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/local-buses/crowd-status   (admin)
// Returns crowd predictions for ALL local routes at once
// ─────────────────────────────────────────────────────────────────────────────
exports.getCrowdStatus = async (req, res) => {
  try {
    const routeIds = await Vehicle.find({ type: "local", route: { $ne: null } }).distinct("route");
    const routes = await Route.find({ _id: { $in: routeIds } });
    const now = new Date();
    const hour_of_day = now.getHours();
    const day_of_week = now.getDay() === 0 ? 6 : now.getDay() - 1;
    const aiUrl = process.env.AI_SERVICE_URL || "http://127.0.0.1:8000";

    const results = await Promise.all(routes.map(async (route) => {
      try {
        const [busCount, totalBuses] = await Promise.all([
          Vehicle.countDocuments({ type: "local", route: route._id, isTracking: true }),
          Vehicle.countDocuments({ type: "local", route: route._id }),
        ]);
        const aiRes = await axios.post(`${aiUrl}/predict_crowd`, {
          hour_of_day, day_of_week,
          stop_index: Math.floor((route.stops?.length || 10) / 2),
          total_stops: route.stops?.length || 10,
          route_type: 0, bus_capacity: 50, weather_condition: 0, traffic_index: 5, is_holiday: 0,
        });
        const lvl = aiRes.data.crowd_level;
        return {
          route: { _id: route._id, name: route.name || route.routeName || `Route ${route._id.toString().slice(-5)}`, origin: route.origin, destination: route.destination },
          activeBuses: busCount, totalBuses,
          prediction: aiRes.data,
          recommendation: lvl >= 3 ? "HIGH_CROWD" : lvl >= 2 ? "MODERATE" : "NORMAL",
        };
      } catch (e) {
        return {
          route: { _id: route._id, name: route.name || `Route ${route._id.toString().slice(-5)}` },
          activeBuses: 0, totalBuses: 0, prediction: null, recommendation: "UNKNOWN", error: e.message,
        };
      }
    }));

    res.json(results);
  } catch (err) {
    console.error("getCrowdStatus:", err.message);
    res.status(500).json({ message: "Failed to fetch crowd status" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/local-buses/deploy-spare/:routeId   (admin)
// Assigns a spare bus to a crowded route and emits crowd_alert to drivers
// ─────────────────────────────────────────────────────────────────────────────
exports.deploySpareBus = async (req, res) => {
  try {
    const { routeId } = req.params;
    const { vehicleId, reason } = req.body;

    const route = await Route.findById(routeId);
    if (!route) return res.status(404).json({ message: "Route not found" });

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });

    vehicle.route = routeId;
    vehicle.status = "active";
    await vehicle.save();

    const io = req.app.get("io");
    if (io) {
      io.emit("crowd_alert", {
        routeId,
        routeName: route.name || route.routeName,
        vehicleId: vehicle._id,
        regNumber: vehicle.regNumber,
        driverName: vehicle.driverName || "Unassigned",
        message: reason || `High crowd on ${route.name || route.routeName}. Extra bus deployed — be prepared for higher passenger load.`,
        timestamp: new Date().toISOString(),
      });
    }

    res.json({
      success: true,
      message: `Bus ${vehicle.regNumber} deployed to ${route.name || route.routeName}`,
      vehicle,
      route,
    });
  } catch (err) {
    console.error("deploySpareBus:", err.message);
    res.status(500).json({ message: "Failed to deploy spare bus" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/local-buses/spare-buses   (admin)
// Unassigned local buses available for deployment
// ─────────────────────────────────────────────────────────────────────────────
exports.getSpareBuses = async (req, res) => {
  try {
    const spare = await Vehicle.find({
      type: "local",
      $or: [{ route: null }, { route: { $exists: false } }],
    }).select("regNumber model capacity driverName status");
    res.json(spare);
  } catch (err) {
    console.error("getSpareBuses:", err.message);
    res.status(500).json({ message: "Failed to fetch spare buses" });
  }
};