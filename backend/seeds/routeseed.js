// backend/seeds/seedRoutesAndVehicles.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import Route from "../models/Route.js";
import Vehicle from "../models/Vehicle.js";

dotenv.config();
const MONGO_URI = process.env.MONGO_URI ;

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
  },
  {
  name: "Mumbai ⇄ Pune Express",
  origin: "Mumbai",
  destination: "Pune",
  distanceKm: 150,
  avgSpeedKmph: 65,
  stops: [
    { name: "Mumbai", lat: 19.0760, lng: 72.8777 },
    { name: "Lonavala", lat: 18.7546, lng: 73.4062 },
    { name: "Pune", lat: 18.5204, lng: 73.8567 }
  ]
},

{
  name: "Bangalore ⇄ Chennai",
  origin: "Bangalore",
  destination: "Chennai",
  distanceKm: 350,
  avgSpeedKmph: 65,
  stops: [
    { name: "Bangalore", lat: 12.9716, lng: 77.5946 },
    { name: "Krishnagiri", lat: 12.5266, lng: 78.2137 },
    { name: "Vellore", lat: 12.9165, lng: 79.1325 },
    { name: "Chennai", lat: 13.0827, lng: 80.2707 }
  ]
},

{
  name: "Hyderabad ⇄ Bangalore",
  origin: "Hyderabad",
  destination: "Bangalore",
  distanceKm: 570,
  avgSpeedKmph: 65,
  stops: [
    { name: "Hyderabad", lat: 17.3850, lng: 78.4867 },
    { name: "Kurnool", lat: 15.8281, lng: 78.0373 },
    { name: "Anantapur", lat: 14.6819, lng: 77.6006 },
    { name: "Bangalore", lat: 12.9716, lng: 77.5946 }
  ]
},

{
  name: "Delhi ⇄ Lucknow",
  origin: "Delhi",
  destination: "Lucknow",
  distanceKm: 555,
  avgSpeedKmph: 60,
  stops: [
    { name: "Delhi", lat: 28.7041, lng: 77.1025 },
    { name: "Ghaziabad", lat: 28.6692, lng: 77.4538 },
    { name: "Kanpur", lat: 26.4499, lng: 80.3319 },
    { name: "Lucknow", lat: 26.8467, lng: 80.9462 }
  ]
},

{
  name: "Delhi ⇄ Varanasi",
  origin: "Delhi",
  destination: "Varanasi",
  distanceKm: 820,
  avgSpeedKmph: 60,
  stops: [
    { name: "Delhi", lat: 28.7041, lng: 77.1025 },
    { name: "Kanpur", lat: 26.4499, lng: 80.3319 },
    { name: "Prayagraj", lat: 25.4358, lng: 81.8463 },
    { name: "Varanasi", lat: 25.3176, lng: 82.9739 }
  ]
},

{
  name: "Kolkata ⇄ Bhubaneswar",
  origin: "Kolkata",
  destination: "Bhubaneswar",
  distanceKm: 440,
  avgSpeedKmph: 60,
  stops: [
    { name: "Kolkata", lat: 22.5726, lng: 88.3639 },
    { name: "Kharagpur", lat: 22.3460, lng: 87.2319 },
    { name: "Balasore", lat: 21.4942, lng: 86.9335 },
    { name: "Bhubaneswar", lat: 20.2961, lng: 85.8245 }
  ]
},

{
  name: "Ahmedabad ⇄ Surat",
  origin: "Ahmedabad",
  destination: "Surat",
  distanceKm: 270,
  avgSpeedKmph: 65,
  stops: [
    { name: "Ahmedabad", lat: 23.0225, lng: 72.5714 },
    { name: "Vadodara", lat: 22.3072, lng: 73.1812 },
    { name: "Bharuch", lat: 21.7051, lng: 72.9959 },
    { name: "Surat", lat: 21.1702, lng: 72.8311 }
  ]
},

{
  name: "Jaipur ⇄ Udaipur",
  origin: "Jaipur",
  destination: "Udaipur",
  distanceKm: 395,
  avgSpeedKmph: 60,
  stops: [
    { name: "Jaipur", lat: 26.9124, lng: 75.7873 },
    { name: "Ajmer", lat: 26.4499, lng: 74.6399 },
    { name: "Bhilwara", lat: 25.3463, lng: 74.6364 },
    { name: "Udaipur", lat: 24.5854, lng: 73.7125 }
  ]
},

{
  name: "Nagpur ⇄ Pune",
  origin: "Nagpur",
  destination: "Pune",
  distanceKm: 710,
  avgSpeedKmph: 65,
  stops: [
    { name: "Nagpur", lat: 21.1458, lng: 79.0882 },
    { name: "Amravati", lat: 20.9320, lng: 77.7523 },
    { name: "Aurangabad", lat: 19.8762, lng: 75.3433 },
    { name: "Pune", lat: 18.5204, lng: 73.8567 }
  ]
},

{
  name: "Bangalore ⇄ Hyderabad Express",
  origin: "Bangalore",
  destination: "Hyderabad",
  distanceKm: 570,
  avgSpeedKmph: 70,
  stops: [
    { name: "Bangalore", lat: 12.9716, lng: 77.5946 },
    { name: "Anantapur", lat: 14.6819, lng: 77.6006 },
    { name: "Kurnool", lat: 15.8281, lng: 78.0373 },
    { name: "Hyderabad", lat: 17.3850, lng: 78.4867 }
  ]
},

{
  name: "Chennai ⇄ Madurai",
  origin: "Chennai",
  destination: "Madurai",
  distanceKm: 460,
  avgSpeedKmph: 60,
  stops: [
    { name: "Chennai", lat: 13.0827, lng: 80.2707 },
    { name: "Trichy", lat: 10.7905, lng: 78.7047 },
    { name: "Dindigul", lat: 10.3673, lng: 77.9803 },
    { name: "Madurai", lat: 9.9252, lng: 78.1198 }
  ]
},

{
  name: "Kochi ⇄ Trivandrum",
  origin: "Kochi",
  destination: "Trivandrum",
  distanceKm: 205,
  avgSpeedKmph: 55,
  stops: [
    { name: "Kochi", lat: 9.9312, lng: 76.2673 },
    { name: "Alappuzha", lat: 9.4981, lng: 76.3388 },
    { name: "Kollam", lat: 8.8932, lng: 76.6141 },
    { name: "Trivandrum", lat: 8.5241, lng: 76.9366 }
  ]
},

{
  name: "Guwahati ⇄ Shillong",
  origin: "Guwahati",
  destination: "Shillong",
  distanceKm: 100,
  avgSpeedKmph: 40,
  stops: [
    { name: "Guwahati", lat: 26.1445, lng: 91.7362 },
    { name: "Nongpoh", lat: 25.9023, lng: 91.8769 },
    { name: "Shillong", lat: 25.5788, lng: 91.8933 }
  ]
},
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
