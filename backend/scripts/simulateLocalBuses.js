const mongoose = require("mongoose");
const axios = require("axios");
const dotenv = require("dotenv");
const path = require("path");

// Load models
const Vehicle = require("../models/Vehicle");
const Route = require("../models/Route");

dotenv.config({ path: path.resolve(__dirname, "../.env") });
const MONGO_URI = process.env.MONGO_URI;

// Cache for OSRM routes so we don't spam the API
const routeGeometryCache = {};

// Keep track of where each bus is along its geometry array
// { vehicleId: { geoIndex: 0, direction: 1 } }
const busState = {};

async function fetchRouteGeometry(route) {
  if (routeGeometryCache[route._id]) {
    return routeGeometryCache[route._id];
  }

  const coords = route.stops.map((s) => `${s.lng},${s.lat}`).join(";");
  const url = `https://routing.openstreetmap.de/routed-car/route/v1/driving/${coords}?overview=full&geometries=geojson`;

  try {
    const res = await axios.get(url, { 
      timeout: 10000,
      headers: { "User-Agent": "PublicTransportSystem/1.0 (contact@pt.com)" }
    });
    if (res.data.code === "Ok" && res.data.routes[0]) {
      // GeoJSON returns [lng, lat]
      const geometry = res.data.routes[0].geometry.coordinates;
      routeGeometryCache[route._id] = geometry;
      return geometry;
    }
  } catch (err) {
    console.error(`OSRM error for route ${route.name}:`, err.message);
  }
  return null;
}

async function simulateBuses() {
  console.log("🚌 Starting Local Bus Simulator...");
  await mongoose.connect(MONGO_URI);
  console.log("🔗 Connected to DB.");

  setInterval(async () => {
    try {
      // Get all tracking local buses
      const buses = await Vehicle.find({ type: "local", isTracking: true }).populate("route");
      
      for (const bus of buses) {
        if (!bus.route || !bus.route.stops || bus.route.stops.length < 2) continue;

        const geometry = await fetchRouteGeometry(bus.route);
        if (!geometry || geometry.length === 0) continue;

        // Initialize state if not exists
        if (!busState[bus._id]) {
          // Start somewhere in the middle to make it look alive immediately
          const startIndex = Math.floor(Math.random() * geometry.length);
          busState[bus._id] = { geoIndex: startIndex, direction: 1 };
        }

        const state = busState[bus._id];

        // Move to next point
        state.geoIndex += state.direction;

        // Reverse direction at ends
        if (state.geoIndex >= geometry.length - 1) {
          state.geoIndex = geometry.length - 1;
          state.direction = -1; // Go back
        } else if (state.geoIndex <= 0) {
          state.geoIndex = 0;
          state.direction = 1; // Go forward
        }

        // Current location [lng, lat]
        const currentPos = geometry[state.geoIndex];
        
        bus.currentLocation = {
          lat: currentPos[1], // lat
          lng: currentPos[0]  // lng
        };
        bus.lastSeenAt = new Date();

        await bus.save();
      }
      
      process.stdout.write(`\r✅ Updated locations for ${buses.length} buses at ${new Date().toLocaleTimeString()}`);
    } catch (err) {
      console.error("\n❌ Simulation error:", err.message);
    }
  }, 5000); // Update every 5 seconds
}

simulateBuses();
