const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

const seedUsers = require("./seedUsers");
const seedIntercity = require("./seedIntercity");
const seedLocal = require("./seedLocal");
const seedAssignments = require("./seedAssignments");

const Route = require("../models/Route");
const Vehicle = require("../models/Vehicle");
const User = require("../models/User");

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI;

async function runAllSeeds() {
  try {
    console.log("🚀 STARTING MASTER SEED PROCESS...");
    await mongoose.connect(MONGO_URI);
    console.log("🔗 Connected to MongoDB.");

    console.log("🧹 Wiping ALL routes and vehicles...");
    await Route.deleteMany({});
    await Vehicle.deleteMany({});
    
    // Seed Admins and Passengers
    await seedUsers();

    // Seed Routes and Vehicles (which will use the new state prefixes)
    await seedIntercity();
    await seedLocal();

    // Seed Drivers and Map them to the newly generated Vehicles based on geography
    await seedAssignments();

    console.log("\n✨ ALL SEEDS COMPLETED SUCCESSFULLY! ✨");
    process.exit(0);
  } catch (error) {
    console.error("❌ MASTER SEED FAILED:", error);
    process.exit(1);
  }
}

runAllSeeds();
