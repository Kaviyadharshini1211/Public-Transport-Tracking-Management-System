const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("../models/User");
const Route = require("../models/Route");
const Vehicle = require("../models/Vehicle");
const Booking = require("../models/Booking");

// Import modular seeds
const seedUsers = require("./seedUsers");
const seedIntercity = require("./seedIntercity");
const seedLocal = require("./seedLocal");

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

async function masterSeed() {
  try {
    console.log("🚀 STARTING MASTER SEED PROCESS...");
    await mongoose.connect(MONGO_URI);
    console.log("🔗 Connected to MongoDB.");

    console.log("🧹 Wiping database...");
    await User.deleteMany({});
    await Route.deleteMany({});
    await Vehicle.deleteMany({});
    await Booking.deleteMany({});
    console.log("✅ Database cleared.");

    // Run modular seeds in order
    await seedUsers();
    await seedIntercity();
    await seedLocal();

    console.log("\n✨ MASTER SEED COMPLETE! ✨");
    console.log("-----------------------------------------");
    console.log("Admin: admin@pt.com / admin123");
    console.log("Intercity Driver: driver@pt.com / driver123");
    console.log("Local Driver 1: ldriver1@pt.com / driver123");
    console.log("-----------------------------------------");

    process.exit(0);
  } catch (error) {
    console.error("❌ MASTER SEED FAILED:", error);
    process.exit(1);
  }
}

masterSeed();
