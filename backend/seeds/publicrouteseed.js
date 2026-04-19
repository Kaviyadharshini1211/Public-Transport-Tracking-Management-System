const mongoose = require("mongoose");
const Route = require("../models/Route");

require("dotenv").config();

mongoose.connect(process.env.MONGO_URI);

const publicRoutes = [
  {
    routeNumber: "21G",
    routeName: "Broadway - Tambaram",
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
    type: "INTRACITY",
    stops: [
      { name: "T Nagar", lat: 13.0418, lng: 80.2341, order: 1 },
      { name: "Saidapet", lat: 13.0237, lng: 80.2209, order: 2 },
      { name: "Adyar", lat: 13.0067, lng: 80.2573, order: 3 },
      { name: "Besant Nagar", lat: 13.0003, lng: 80.2667, order: 4 }
    ]
  }
];

async function seedPublicRoutes() {
  try {
    // Only delete intracity routes (safe)
    await Route.deleteMany({ type: "INTRACITY" });

    const inserted = await Route.insertMany(publicRoutes);

    console.log("✅ Public routes seeded:", inserted.length);
    process.exit();
  } catch (err) {
    console.error("❌ Error seeding public routes:", err);
    process.exit(1);
  }
}

seedPublicRoutes();