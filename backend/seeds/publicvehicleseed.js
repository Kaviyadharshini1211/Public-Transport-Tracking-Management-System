/**
 * backend/seeds/localBusSeed.js
 *
 * Seeds:
 *   • 4 realistic city bus routes (Chandigarh, Delhi, Mumbai, Bangalore)
 *   • 12 local buses spread across those routes
 *   • 4 driver users (role: driver) assigned to the buses
 *
 * Run:  node backend/seeds/localBusSeed.js
 */

const mongoose = require("mongoose");
const dotenv   = require("dotenv");
dotenv.config();

const Route   = require("../models/Route");
const Vehicle = require("../models/Vehicle");
const User    = require("../models/User");

// ─── City routes with real GPS stop coordinates ──────────────────────────────
const cityRoutes = [
  {
    name: "Chandigarh City — Sector 17 ⇄ Sector 43 ISBT",
    origin:      "Sector 17, Chandigarh",
    destination: "Sector 43 ISBT, Chandigarh",
    distanceKm:  8,
    avgSpeedKmph: 22,
    stops: [
      { name: "Sector 17 Bus Stand",     lat: 30.7414, lng: 76.7784 },
      { name: "Sector 22 Chowk",         lat: 30.7280, lng: 76.7784 },
      { name: "Sector 35 Market",        lat: 30.7215, lng: 76.7736 },
      { name: "Sector 34A",              lat: 30.7180, lng: 76.7780 },
      { name: "Sector 43 Bus Terminal",  lat: 30.7082, lng: 76.7923 },
    ],
  },
  {
    name: "Delhi — Kashmiri Gate ⇄ Nehru Place",
    origin:      "Kashmiri Gate ISBT, Delhi",
    destination: "Nehru Place, Delhi",
    distanceKm:  18,
    avgSpeedKmph: 18,
    stops: [
      { name: "Kashmiri Gate ISBT",  lat: 28.6678, lng: 77.2279 },
      { name: "Lal Qila",            lat: 28.6562, lng: 77.2410 },
      { name: "ITO",                  lat: 28.6284, lng: 77.2418 },
      { name: "Pragati Maidan",      lat: 28.6189, lng: 77.2496 },
      { name: "Khan Market",         lat: 28.6005, lng: 77.2274 },
      { name: "AIIMS",               lat: 28.5672, lng: 77.2100 },
      { name: "Nehru Place",         lat: 28.5491, lng: 77.2516 },
    ],
  },
  {
    name: "Mumbai — CSMT ⇄ Bandra Station",
    origin:      "CSMT, Mumbai",
    destination: "Bandra Station, Mumbai",
    distanceKm:  16,
    avgSpeedKmph: 15,
    stops: [
      { name: "CSMT Bus Stop",       lat: 18.9398, lng: 72.8355 },
      { name: "Churchgate",          lat: 18.9322, lng: 72.8264 },
      { name: "Marine Lines",        lat: 18.9440, lng: 72.8239 },
      { name: "Grant Road",          lat: 18.9644, lng: 72.8189 },
      { name: "Dadar TT",            lat: 19.0178, lng: 72.8436 },
      { name: "Mahim",               lat: 19.0375, lng: 72.8406 },
      { name: "Bandra Station",      lat: 19.0544, lng: 72.8402 },
    ],
  },
  {
    name: "Bangalore — Majestic ⇄ Electronic City",
    origin:      "Majestic, Bangalore",
    destination: "Electronic City, Bangalore",
    distanceKm:  22,
    avgSpeedKmph: 20,
    stops: [
      { name: "Majestic KSRTC",         lat: 12.9774, lng: 77.5713 },
      { name: "Town Hall",              lat: 12.9659, lng: 77.5855 },
      { name: "Lalbagh",               lat: 12.9507, lng: 77.5848 },
      { name: "Jayanagar 4th Block",   lat: 12.9302, lng: 77.5833 },
      { name: "BTM Layout",            lat: 12.9165, lng: 77.6101 },
      { name: "Silk Board",            lat: 12.9174, lng: 77.6228 },
      { name: "Electronic City",       lat: 12.8399, lng: 77.6770 },
    ],
  },
  {
    name: "Chennai — CMBT ⇄ Marina Beach",
    origin:      "CMBT, Chennai",
    destination: "Marina Beach, Chennai",
    distanceKm:  15,
    avgSpeedKmph: 18,
    stops: [
      { name: "CMBT Bus Terminus",       lat: 13.0682, lng: 80.2078 },
      { name: "Anna Nagar Tower",        lat: 13.0844, lng: 80.2114 },
      { name: "Kilpauk",                 lat: 13.0825, lng: 80.2443 },
      { name: "Egmore",                  lat: 13.0784, lng: 80.2590 },
      { name: "Central Station",         lat: 13.0827, lng: 80.2707 },
      { name: "Marina Beach",            lat: 13.0500, lng: 80.2824 },
    ],
  },
  {
    name: "Hyderabad — Secunderabad ⇄ Hitech City",
    origin:      "Secunderabad Station",
    destination: "Hitech City",
    distanceKm:  18,
    avgSpeedKmph: 22,
    stops: [
      { name: "Secunderabad Station",    lat: 17.4337, lng: 78.5016 },
      { name: "Begumpet",                lat: 17.4435, lng: 78.4611 },
      { name: "Ameerpet",                lat: 17.4363, lng: 78.4449 },
      { name: "Jubilee Hills Check Post",lat: 17.4300, lng: 78.4093 },
      { name: "Madhapur",                lat: 17.4483, lng: 78.3915 },
      { name: "Hitech City",             lat: 17.4435, lng: 78.3772 },
    ],
  },
];

// ─── Driver users for local buses ────────────────────────────────────────────
const localDrivers = [
  { name: "Ramesh Verma",   email: "ldriver1@pt.com", password: "driver123", phone: "+919811111111" },
  { name: "Suresh Nair",    email: "ldriver2@pt.com", password: "driver123", phone: "+919822222222" },
  { name: "Priya Sharma",   email: "ldriver3@pt.com", password: "driver123", phone: "+919833333333" },
  { name: "Anil Pillai",    email: "ldriver4@pt.com", password: "driver123", phone: "+919844444444" },
  { name: "Muthu Kumar",    email: "ldriver5@pt.com", password: "driver123", phone: "+919855555555" },
  { name: "Ravi Teja",      email: "ldriver6@pt.com", password: "driver123", phone: "+919866666666" },
];

// ─── 18 local buses (3 per route) ────────────────────────────────────────────
// routeIndex maps to cityRoutes array above
const localBuses = [
  // Chandigarh route (0)
  { regNumber: "CH01Z0001", model: "Tata StarBus Ultra",     capacity: 52, routeIndex: 0, driverEmail: "ldriver1@pt.com" },
  { regNumber: "CH01Z0002", model: "Eicher Skyline Pro",     capacity: 45, routeIndex: 0, driverEmail: null },
  { regNumber: "CH01Z0003", model: "Ashok Leyland Viking",   capacity: 60, routeIndex: 0, driverEmail: null },

  // Delhi route (1)
  { regNumber: "DL01Z0004", model: "Tata Marcopolo",         capacity: 70, routeIndex: 1, driverEmail: "ldriver2@pt.com" },
  { regNumber: "DL01Z0005", model: "JBM Ecolife Electric",   capacity: 65, routeIndex: 1, driverEmail: null },
  { regNumber: "DL01Z0006", model: "Volvo B7R City",         capacity: 60, routeIndex: 1, driverEmail: null },

  // Mumbai route (2)
  { regNumber: "MH01Z0007", model: "BEST Tata LPO",          capacity: 72, routeIndex: 2, driverEmail: "ldriver3@pt.com" },
  { regNumber: "MH01Z0008", model: "BEST Ashok Leyland",     capacity: 68, routeIndex: 2, driverEmail: null },
  { regNumber: "MH01Z0009", model: "BEST JBM Ecolife",       capacity: 72, routeIndex: 2, driverEmail: null },

  // Bangalore route (3)
  { regNumber: "KA01Z0010", model: "BMTC Volvo B9R",         capacity: 55, routeIndex: 3, driverEmail: "ldriver4@pt.com" },
  { regNumber: "KA01Z0011", model: "BMTC Tata StarBus",      capacity: 60, routeIndex: 3, driverEmail: null },
  { regNumber: "KA01Z0012", model: "BMTC Eicher Skyline",    capacity: 52, routeIndex: 3, driverEmail: null },

  // Chennai route (4)
  { regNumber: "TN01Z0013", model: "MTC Ashok Leyland",      capacity: 65, routeIndex: 4, driverEmail: "ldriver5@pt.com" },
  { regNumber: "TN01Z0014", model: "MTC Tata StarBus",       capacity: 60, routeIndex: 4, driverEmail: null },
  { regNumber: "TN01Z0015", model: "MTC Eicher Skyline",     capacity: 50, routeIndex: 4, driverEmail: null },

  // Hyderabad route (5)
  { regNumber: "TS09Z0016", model: "TSRTC Volvo 8400",       capacity: 55, routeIndex: 5, driverEmail: "ldriver6@pt.com" },
  { regNumber: "TS09Z0017", model: "TSRTC Tata Marcopolo",   capacity: 62, routeIndex: 5, driverEmail: null },
  { regNumber: "TS09Z0018", model: "TSRTC Ashok Leyland",    capacity: 58, routeIndex: 5, driverEmail: null },
];

// ─── Seed function ────────────────────────────────────────────────────────────
async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ Connected to MongoDB");

  // ── 1. Remove any existing local buses + their routes ──────────────────────
  const existingLocal = await Vehicle.find({ type: "local" });
  const existingRegNums = localBuses.map((b) => b.regNumber);
  await Vehicle.deleteMany({ regNumber: { $in: existingRegNums } });
  console.log(`🗑  Removed ${existingLocal.length} old local buses`);

  // Remove old local routes by name
  const routeNames = cityRoutes.map((r) => r.name);
  await Route.deleteMany({ name: { $in: routeNames } });
  console.log("🗑  Removed old local routes");

  // Remove old local drivers by email
  const driverEmails = localDrivers.map((d) => d.email);
  await User.deleteMany({ email: { $in: driverEmails } });
  console.log("🗑  Removed old local driver accounts");

  // ── 2. Create routes ────────────────────────────────────────────────────────
  const createdRoutes = await Route.insertMany(cityRoutes);
  console.log(`✅ Created ${createdRoutes.length} city routes`);

  // ── 3. Create driver users ──────────────────────────────────────────────────
  // Use create() one-by-one so the pre-save hook hashes passwords
  const createdDrivers = [];
  for (const d of localDrivers) {
    const user = await User.create({ ...d, role: "driver" });
    createdDrivers.push(user);
  }
  console.log(`✅ Created ${createdDrivers.length} local bus driver accounts`);

  // ── 4. Create buses ─────────────────────────────────────────────────────────
  const busesToInsert = localBuses.map((b) => ({
    regNumber:  b.regNumber,
    model:      b.model,
    capacity:   b.capacity,
    type:       "local",
    status:     "active",
    route:      createdRoutes[b.routeIndex]._id,
    driverName: b.driverEmail || null,   // stored as driver email (matches existing pattern)
    isTracking: false,
    currentLocation: null,
    lastSeenAt:      null,
    nearestStopIndex: null,
  }));

  await Vehicle.insertMany(busesToInsert);
  console.log(`✅ Created ${busesToInsert.length} local buses`);

  // ── 5. Summary ──────────────────────────────────────────────────────────────
  console.log("\n── Seed complete ──────────────────────────────────────");
  console.log("Routes created:");
  createdRoutes.forEach((r) => console.log(`   ${r.name}`));
  console.log("\nDriver logins:");
  localDrivers.forEach((d) => console.log(`   ${d.email}  /  ${d.password}`));
  console.log("\nBuses:");
  localBuses.forEach((b) =>
    console.log(`   ${b.regNumber}  → route[${b.routeIndex}]  driver: ${b.driverEmail || "unassigned"}`)
  );

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});