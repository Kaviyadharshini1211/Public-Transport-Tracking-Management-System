// backend/seeds/seedRoutesAndVehicles.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import Route from "../models/Route.js";
import Vehicle from "../models/Vehicle.js";

dotenv.config();
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/ptdb";

// ===========================
// REALISTIC ROUTES DATA
// ===========================
const routes = [
  {
    name: "Jalandhar ⇄ Delhi (Via Ludhiana)",
    origin: "Jalandhar",
    destination: "Delhi",
    distanceKm: 375,
    avgSpeedKmph: 55,
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
    origin: "Jalandhar",
    destination: "Chandigarh",
    distanceKm: 150,
    avgSpeedKmph: 50,
    stops: [
      { name: "Jalandhar Bus Stand", lat: 31.3260, lng: 75.5762 },
      { name: "Phagwara", lat: 31.2242, lng: 75.7710 },
      { name: "Kharar", lat: 30.7460, lng: 76.6300 },
      { name: "Chandigarh ISBT 43", lat: 30.7333, lng: 76.7794 }
    ]
  },
  {
    name: "Delhi ⇄ Amritsar (Via Jalandhar)",
    origin: "Delhi",
    destination: "Amritsar",
    distanceKm: 455,
    avgSpeedKmph: 60,
    stops: [
      { name: "Delhi ISBT", lat: 28.7041, lng: 77.1025 },
      { name: "Ambala", lat: 30.3752, lng: 76.7821 },
      { name: "Ludhiana", lat: 30.9010, lng: 75.8573 },
      { name: "Jalandhar", lat: 31.3260, lng: 75.5762 },
      { name: "Amritsar Bus Stand", lat: 31.6340, lng: 74.8723 }
    ]
  },
  {
    name: "Chandigarh ⇄ Shimla",
    origin: "Chandigarh",
    destination: "Shimla",
    distanceKm: 112,
    avgSpeedKmph: 35,
    stops: [
      { name: "Chandigarh ISBT 43", lat: 30.7333, lng: 76.7794 },
      { name: "Kalka", lat: 30.8559, lng: 76.9369 },
      { name: "Dharampur", lat: 30.9230, lng: 77.0060 },
      { name: "Solan", lat: 30.9077, lng: 77.0971 },
      { name: "Shimla ISBT", lat: 31.1048, lng: 77.1734 }
    ]
  },
  {
    name: "Jalandhar ⇄ Pathankot",
    origin: "Jalandhar",
    destination: "Pathankot",
    distanceKm: 110,
    avgSpeedKmph: 50,
    stops: [
      { name: "Jalandhar", lat: 31.3260, lng: 75.5762 },
      { name: "Adampur", lat: 31.43, lng: 75.72 },
      { name: "Hoshiarpur", lat: 31.5324, lng: 75.9129 },
      { name: "Gurdaspur", lat: 32.0420, lng: 75.4050 },
      { name: "Pathankot ISBT", lat: 32.2643, lng: 75.6421 }
    ]
  },

  // ADD MORE ROUTES (15 MORE)
  {
    name: "Delhi ⇄ Jaipur",
    origin: "Delhi",
    destination: "Jaipur",
    distanceKm: 275,
    avgSpeedKmph: 60,
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
    origin: "Delhi",
    destination: "Agra",
    distanceKm: 233,
    avgSpeedKmph: 60,
    stops: [
      { name: "Delhi ISBT", lat: 28.7041, lng: 77.1025 },
      { name: "Faridabad", lat: 28.4089, lng: 77.3178 },
      { name: "Mathura", lat: 27.4924, lng: 77.6737 },
      { name: "Agra ISBT", lat: 27.1767, lng: 78.0081 }
    ]
  },

  {
    name: "Delhi ⇄ Chandigarh Express",
    origin: "Delhi",
    destination: "Chandigarh",
    distanceKm: 250,
    avgSpeedKmph: 65,
    stops: [
      { name: "Delhi ISBT", lat: 28.7041, lng: 77.1025 },
      { name: "Sonipat", lat: 28.9950, lng: 77.0110 },
      { name: "Kurukshetra", lat: 29.9695, lng: 76.8783 },
      { name: "Chandigarh ISBT 43", lat: 30.7333, lng: 76.7794 }
    ]
  },

  {
    name: "Chandigarh ⇄ Manali",
    origin: "Chandigarh",
    destination: "Manali",
    distanceKm: 300,
    avgSpeedKmph: 40,
    stops: [
      { name: "Chandigarh", lat: 30.7333, lng: 76.7794 },
      { name: "Bilaspur", lat: 31.33, lng: 76.75 },
      { name: "Mandi", lat: 31.5892, lng: 76.9182 },
      { name: "Kullu", lat: 31.9716, lng: 77.1093 },
      { name: "Manali", lat: 32.2432, lng: 77.1892 }
    ]
  },

  {
    name: "Delhi ⇄ Ludhiana",
    origin: "Delhi",
    destination: "Ludhiana",
    distanceKm: 310,
    avgSpeedKmph: 55,
    stops: [
      { name: "Delhi ISBT", lat: 28.7041, lng: 77.1025 },
      { name: "Panipat", lat: 29.39, lng: 76.97 },
      { name: "Ambala", lat: 30.3752, lng: 76.7821 },
      { name: "Ludhiana", lat: 30.9010, lng: 75.8573 }
    ]
  }
];

// ===========================
// SEED VEHICLES (10 buses)
// ===========================

const vehicles = [
  { regNumber: "PB10A1001", model: "Volvo B9R", capacity: 48, driverName: "Rajesh Kumar" },
  { regNumber: "PB10A2002", model: "Tata Starbus", capacity: 42, driverName: "Manjit Singh" },
  { regNumber: "PB10A3003", model: "Ashok Leyland AC", capacity: 45, driverName: "Harpreet Singh" },
  { regNumber: "PB10A4004", model: "Mercedes Benz MultiAxle", capacity: 50, driverName: "Satish Sharma" },
  { regNumber: "DL01B5005", model: "Eicher Skyline", capacity: 40, driverName: "Amit Kumar" },
  { regNumber: "DL01B6006", model: "Volvo 9400", capacity: 53, driverName: "Vikas Yadav" },
  { regNumber: "CH01C7007", model: "Tata LPO Bus", capacity: 36, driverName: "Sandeep" },
  { regNumber: "CH01C8008", model: "Volvo B11R", capacity: 52, driverName: "Navdeep" },
  { regNumber: "RJ14D9009", model: "Scania Metrolink", capacity: 49, driverName: "Yogesh" },
  { regNumber: "UP16E1010", model: "Bharat Benz", capacity: 43, driverName: "Arvind" }
];

// ===========================
// SEED FUNCTION
// ===========================

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log("Connected to Mongo");

  await Route.deleteMany({});
  await Vehicle.deleteMany({});

  const createdRoutes = await Route.insertMany(routes);

  // Assign vehicles to random routes
  const vehiclesToInsert = vehicles.map((v) => ({
    ...v,
    route: createdRoutes[Math.floor(Math.random() * createdRoutes.length)]._id
  }));

  await Vehicle.insertMany(vehiclesToInsert);

  console.log("Seed complete ✔");
  await mongoose.disconnect();
  process.exit(0);
}

seed();
