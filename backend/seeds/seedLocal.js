const Route = require("../models/Route");
const Vehicle = require("../models/Vehicle");

const seedLocal = async () => {
  console.log("🚌 Seeding ALL Local City Buses...");

  const cityRoutes = [
    {
      name: "Chandigarh City — Sector 17 ⇄ Sector 43 ISBT",
      origin: "Sector 17, Chandigarh",
      destination: "Sector 43 ISBT, Chandigarh",
      distanceKm: 8, avgSpeedKmph: 22, type: "INTRACITY",
      stops: [
        { name: "Sector 17 Bus Stand",     lat: 30.7414, lng: 76.7784 },
        { name: "Sector 22 Chowk",         lat: 30.7280, lng: 76.7784 },
        { name: "Sector 35 Market",        lat: 30.7215, lng: 76.7736 },
        { name: "Sector 34A",              lat: 30.7180, lng: 76.7780 },
        { name: "Sector 43 Bus Terminal",  lat: 30.7082, lng: 76.7923 },
      ]
    },
    {
      name: "Delhi — Kashmiri Gate ⇄ Nehru Place",
      origin: "Kashmiri Gate ISBT, Delhi",
      destination: "Nehru Place, Delhi",
      distanceKm: 18, avgSpeedKmph: 18, type: "INTRACITY",
      stops: [
        { name: "Kashmiri Gate ISBT",  lat: 28.6678, lng: 77.2279 },
        { name: "Lal Qila",            lat: 28.6562, lng: 77.2410 },
        { name: "ITO",                  lat: 28.6284, lng: 77.2418 },
        { name: "Pragati Maidan",      lat: 28.6189, lng: 77.2496 },
        { name: "Khan Market",         lat: 28.6005, lng: 77.2274 },
        { name: "AIIMS",               lat: 28.5672, lng: 77.2100 },
        { name: "Nehru Place",         lat: 28.5491, lng: 77.2516 },
      ]
    },
    {
      name: "Mumbai — CSMT ⇄ Bandra Station",
      origin: "CSMT, Mumbai",
      destination: "Bandra Station, Mumbai",
      distanceKm: 16, avgSpeedKmph: 15, type: "INTRACITY",
      stops: [
        { name: "CSMT Bus Stop",       lat: 18.9398, lng: 72.8355 },
        { name: "Churchgate",          lat: 18.9322, lng: 72.8264 },
        { name: "Marine Lines",        lat: 18.9440, lng: 72.8239 },
        { name: "Grant Road",          lat: 18.9644, lng: 72.8189 },
        { name: "Dadar TT",            lat: 19.0178, lng: 72.8436 },
        { name: "Mahim",               lat: 19.0375, lng: 72.8406 },
        { name: "Bandra Station",      lat: 19.0544, lng: 72.8402 },
      ]
    },
    {
      name: "Bangalore — Majestic ⇄ Electronic City",
      origin: "Majestic, Bangalore",
      destination: "Electronic City, Bangalore",
      distanceKm: 22, avgSpeedKmph: 20, type: "INTRACITY",
      stops: [
        { name: "Majestic KSRTC",         lat: 12.9774, lng: 77.5713 },
        { name: "Town Hall",              lat: 12.9659, lng: 77.5855 },
        { name: "Lalbagh",               lat: 12.9507, lng: 77.5848 },
        { name: "Jayanagar 4th Block",   lat: 12.9302, lng: 77.5833 },
        { name: "BTM Layout",            lat: 12.9165, lng: 77.6101 },
        { name: "Silk Board",            lat: 12.9174, lng: 77.6228 },
        { name: "Electronic City",       lat: 12.8399, lng: 77.6770 },
      ]
    },
    {
      name: "Chennai — CMBT ⇄ Marina Beach",
      origin: "CMBT, Chennai",
      destination: "Marina Beach, Chennai",
      distanceKm: 15, avgSpeedKmph: 18, type: "INTRACITY",
      stops: [
        { name: "CMBT Bus Terminus",       lat: 13.0682, lng: 80.2078 },
        { name: "Anna Nagar Tower",        lat: 13.0844, lng: 80.2114 },
        { name: "Kilpauk",                 lat: 13.0825, lng: 80.2443 },
        { name: "Egmore",                  lat: 13.0784, lng: 80.2590 },
        { name: "Central Station",         lat: 13.0827, lng: 80.2707 },
        { name: "Marina Beach",            lat: 13.0500, lng: 80.2824 },
      ]
    },
    {
      name: "Hyderabad — Secunderabad ⇄ Hitech City",
      origin: "Secunderabad Station",
      destination: "Hitech City",
      distanceKm: 18, avgSpeedKmph: 22, type: "INTRACITY",
      stops: [
        { name: "Secunderabad Station",    lat: 17.4337, lng: 78.5016 },
        { name: "Begumpet",                lat: 17.4435, lng: 78.4611 },
        { name: "Ameerpet",                lat: 17.4363, lng: 78.4449 },
        { name: "Jubilee Hills Check Post",lat: 17.4300, lng: 78.4093 },
        { name: "Madhapur",                lat: 17.4483, lng: 78.3915 },
        { name: "Hitech City",             lat: 17.4435, lng: 78.3772 },
      ]
    },
    {
      routeNumber: "21G",
      routeName: "Broadway - Tambaram",
      name: "Broadway ⇄ Tambaram (Route 21G)",
      type: "INTRACITY",
      stops: [
        { name: "Broadway", lat: 13.0827, lng: 80.2707, order: 1 },
        { name: "Egmore", lat: 13.0732, lng: 80.2609, order: 2 },
        { name: "Guindy", lat: 13.0067, lng: 80.2206, order: 3 },
        { name: "Tambaram", lat: 12.9249, lng: 80.1275, order: 4 }
      ]
    },
    {
      routeNumber: "5E",
      routeName: "Parrys - Adyar",
      name: "Parrys ⇄ Adyar (Route 5E)",
      type: "INTRACITY",
      stops: [
        { name: "Parrys", lat: 13.0878, lng: 80.2785, order: 1 },
        { name: "Triplicane", lat: 13.0588, lng: 80.2756, order: 2 },
        { name: "Mylapore", lat: 13.0339, lng: 80.2619, order: 3 },
        { name: "Adyar", lat: 13.0067, lng: 80.2573, order: 4 }
      ]
    },
    {
      routeNumber: "47A",
      routeName: "T Nagar - Besant Nagar",
      name: "T Nagar ⇄ Besant Nagar (Route 47A)",
      type: "INTRACITY",
      stops: [
        { name: "T Nagar", lat: 13.0418, lng: 80.2341, order: 1 },
        { name: "Saidapet", lat: 13.0237, lng: 80.2209, order: 2 },
        { name: "Adyar", lat: 13.0067, lng: 80.2573, order: 3 },
        { name: "Besant Nagar", lat: 13.0003, lng: 80.2667, order: 4 }
      ]
    }
  ];

  const createdRoutes = await Route.insertMany(cityRoutes);

  const localBuses = [
    // Chandigarh (Idx 0)
    { regNumber: "CH01Z0001", model: "Tata StarBus Ultra", capacity: 52, rIdx: 0, dEmail: "ldriver1@pt.com" },
    { regNumber: "CH01Z0002", model: "Eicher Skyline Pro", capacity: 45, rIdx: 0, dEmail: null },
    { regNumber: "CH01Z0003", model: "Ashok Leyland Viking", capacity: 60, rIdx: 0, dEmail: null },
    // Delhi (Idx 1)
    { regNumber: "DL01Z0004", model: "Tata Marcopolo", capacity: 70, rIdx: 1, dEmail: "ldriver2@pt.com" },
    { regNumber: "DL01Z0005", model: "JBM Ecolife Electric", capacity: 65, rIdx: 1, dEmail: null },
    { regNumber: "DL01Z0006", model: "Volvo B7R City", capacity: 60, rIdx: 1, dEmail: null },
    // Mumbai (Idx 2)
    { regNumber: "MH01Z0007", model: "BEST Tata LPO", capacity: 72, rIdx: 2, dEmail: "ldriver3@pt.com" },
    { regNumber: "MH01Z0008", model: "BEST Ashok Leyland", capacity: 68, rIdx: 2, dEmail: null },
    { regNumber: "MH01Z0009", model: "BEST JBM Ecolife", capacity: 72, rIdx: 2, dEmail: null },
    // Bangalore (Idx 3)
    { regNumber: "KA01Z0010", model: "BMTC Volvo B9R", capacity: 55, rIdx: 3, dEmail: "ldriver4@pt.com" },
    { regNumber: "KA01Z0011", model: "BMTC Tata StarBus", capacity: 60, rIdx: 3, dEmail: null },
    { regNumber: "KA01Z0012", model: "BMTC Eicher Skyline", capacity: 52, rIdx: 3, dEmail: null },
    // Chennai (Idx 4)
    { regNumber: "TN01Z0013", model: "MTC Ashok Leyland", capacity: 65, rIdx: 4, dEmail: null },
    { regNumber: "TN01Z0014", model: "MTC Tata StarBus", capacity: 60, rIdx: 4, dEmail: null },
    { regNumber: "TN01Z0015", model: "MTC Eicher Skyline", capacity: 50, rIdx: 4, dEmail: null },
    // Hyderabad (Idx 5)
    { regNumber: "TS09Z0016", model: "TSRTC Volvo 8400", capacity: 55, rIdx: 5, dEmail: null },
    { regNumber: "TS09Z0017", model: "TSRTC Tata Marcopolo", capacity: 62, rIdx: 5, dEmail: null },
    { regNumber: "TS09Z0018", model: "TSRTC Ashok Leyland", capacity: 58, rIdx: 5, dEmail: null },
  ];

  const vehicles = localBuses.map((b) => ({
    regNumber: b.regNumber,
    model: b.model,
    capacity: b.capacity,
    type: "local",
    route: createdRoutes[b.rIdx]._id,
    driverName: b.dEmail || null,
    status: "active",
    isTracking: false,
    lastSeenAt: new Date()
  }));

  await Vehicle.insertMany(vehicles);
  console.log(`✅ ${createdRoutes.length} City routes and ${localBuses.length} public buses seeded.`);
};

module.exports = seedLocal;
