const Route = require("../models/Route");
const Vehicle = require("../models/Vehicle");
const User = require("../models/User");

const seedIntercity = async () => {
  console.log("🛣️ Seeding ALL Intercity Data with Return Routes...");

  const baseRoutes = [
    {
      name: "Jalandhar ⇄ Delhi",
      origin: "Jalandhar", destination: "Delhi",
      distanceKm: 375, avgSpeedKmph: 55, type: "INTERCITY",
      stops: [
        { name: "Jalandhar Bus Stand", lat: 31.3260, lng: 75.5762 },
        { name: "Phagwara", lat: 31.2070, lng: 75.7718 },
        { name: "Ludhiana ISBT", lat: 30.9010, lng: 75.8573 },
        { name: "Ambala", lat: 30.3752, lng: 76.7821 },
        { name: "Delhi Kashmiri Gate", lat: 28.6670, lng: 77.2280 }
      ]
    },
    {
      name: "Jalandhar ⇄ Chandigarh",
      origin: "Jalandhar", destination: "Chandigarh",
      distanceKm: 150, avgSpeedKmph: 50, type: "INTERCITY",
      stops: [
        { name: "Jalandhar Bus Stand", lat: 31.3260, lng: 75.5762 },
        { name: "Phagwara", lat: 31.2242, lng: 75.7710 },
        { name: "Kharar", lat: 30.7460, lng: 76.6300 },
        { name: "Chandigarh ISBT 43", lat: 30.7333, lng: 76.7794 }
      ]
    },
    {
      name: "Delhi ⇄ Amritsar",
      origin: "Delhi", destination: "Amritsar",
      distanceKm: 455, avgSpeedKmph: 60, type: "INTERCITY",
      stops: [
        { name: "Delhi ISBT", lat: 28.7041, lng: 77.1025 },
        { name: "Ambala", lat: 30.3752, lng: 76.7821 },
        { name: "Ludhiana", lat: 30.9010, lng: 75.8573 },
        { name: "Jalandhar", lat: 31.3260, lng: 75.5762 },
        { name: "Amritsar Bus Stand", lat: 31.6340, lng: 74.8723 }
      ]
    },
    {
      name: "Delhi ⇄ Jaipur",
      origin: "Delhi", destination: "Jaipur",
      distanceKm: 275, avgSpeedKmph: 60, type: "INTERCITY",
      stops: [
        { name: "Delhi ISBT", lat: 28.7041, lng: 77.1025 },
        { name: "Manesar", lat: 28.3546, lng: 76.9397 },
        { name: "Bhiwadi", lat: 28.2090, lng: 76.8606 },
        { name: "Dausa", lat: 26.9, lng: 76.33 },
        { name: "Jaipur Bus Stand", lat: 26.9124, lng: 75.7873 }
      ]
    },
    {
      name: "Delhi ⇄ Agra",
      origin: "Delhi", destination: "Agra",
      distanceKm: 233, avgSpeedKmph: 60, type: "INTERCITY",
      stops: [
        { name: "Delhi ISBT", lat: 28.7041, lng: 77.1025 },
        { name: "Faridabad", lat: 28.4089, lng: 77.3178 },
        { name: "Mathura", lat: 27.4924, lng: 77.6737 },
        { name: "Agra ISBT", lat: 27.1767, lng: 78.0081 }
      ]
    },
    {
      name: "Mumbai ⇄ Pune",
      origin: "Mumbai", destination: "Pune",
      distanceKm: 150, avgSpeedKmph: 65, type: "INTERCITY",
      stops: [
        { name: "Mumbai", lat: 19.0760, lng: 72.8777 },
        { name: "Lonavala", lat: 18.7546, lng: 73.4062 },
        { name: "Pune", lat: 18.5204, lng: 73.8567 }
      ]
    },
    {
      name: "Bangalore ⇄ Chennai",
      origin: "Bangalore", destination: "Chennai",
      distanceKm: 350, avgSpeedKmph: 65, type: "INTERCITY",
      stops: [
        { name: "Bangalore", lat: 12.9716, lng: 77.5946 },
        { name: "Krishnagiri", lat: 12.5266, lng: 78.2137 },
        { name: "Vellore", lat: 12.9165, lng: 79.1325 },
        { name: "Chennai", lat: 13.0827, lng: 80.2707 }
      ]
    }
  ];

  // Generate return routes automatically
  const allRoutes = [];
  baseRoutes.forEach(br => {
    allRoutes.push(br);
    allRoutes.push({
      ...br,
      name: `${br.destination} ⇄ ${br.origin}`,
      origin: br.destination,
      destination: br.origin,
      stops: [...br.stops].reverse()
    });
  });

  const createdRoutes = await Route.insertMany(allRoutes);

  // Seed many more vehicles to ensure coverage
  const vehiclesToCreate = [];
  for (let i = 0; i < createdRoutes.length; i++) {
    const route = createdRoutes[i];
    // Create at least 2 vehicles per route
    for (let j = 1; j <= 2; j++) {
      vehiclesToCreate.push({
        regNumber: `PB${10 + i}A${1000 + j}`,
        model: j === 1 ? "Volvo B11R Multi-Axle" : "Tata Starbus AC",
        capacity: j === 1 ? 50 : 42,
        type: "long-haul",
        route: route._id,
        driverName: `Driver ${i}${j}`,
        status: "active",
        lastSeenAt: new Date()
      });
    }
  }

  await Vehicle.insertMany(vehiclesToCreate);
  console.log(`✅ ${createdRoutes.length} Intercity routes and ${vehiclesToCreate.length} vehicles seeded.`);
};

module.exports = seedIntercity;
