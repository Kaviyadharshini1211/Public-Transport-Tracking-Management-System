const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const User = require("../models/User");
const Vehicle = require("../models/Vehicle");
const Route = require("../models/Route");

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI;

const firstNames = ["Aarav", "Vihaan", "Aditya", "Sai", "Arjun", "Raj", "Rahul", "Amit", "Vikram", "Suresh", "Ramesh", "Anil", "Sunil", "Prakash", "Ravi", "Manoj", "Sanjay", "Dinesh", "Rajesh", "Mukesh", "Vijay", "Ajay", "Karan", "Tarun", "Varun"];
const lastNames = ["Sharma", "Verma", "Gupta", "Kumar", "Singh", "Yadav", "Patil", "Desai", "Joshi", "Chauhan", "Rajput", "Nair", "Pillai", "Reddy", "Rao", "Das", "Bose", "Ghosh", "Mehta", "Shah", "Patel"];

function getRandomName() {
  const first = firstNames[Math.floor(Math.random() * firstNames.length)];
  const last = lastNames[Math.floor(Math.random() * lastNames.length)];
  return `${first} ${last}`;
}

async function seedAssignments() {
  try {
    console.log("🚀 STARTING DRIVER LOCATION SEEDING...");
    await mongoose.connect(MONGO_URI);
    console.log("🔗 Connected to MongoDB.");

    // 1. Delete all existing drivers
    console.log("🧹 Wiping old drivers...");
    await User.deleteMany({ role: "driver" });

    // 2. Add standard test drivers so that logins don't break for testers
    console.log("👨‍✈️ Re-creating primary test drivers...");
    const testDrivers = [
      { name: "John Intercity", email: "driver@pt.com", password: "driver123", role: "driver", phone: "9999999999", baseLocation: { lat: 28.7041, lng: 77.1025, city: "Delhi" } },
      { name: "Local Driver 1", email: "ldriver1@pt.com", password: "driver123", role: "driver", phone: "9811111111", baseLocation: { lat: 28.6678, lng: 77.2279, city: "Delhi" } },
      { name: "Local Driver 2", email: "ldriver2@pt.com", password: "driver123", role: "driver", phone: "9822222222", baseLocation: { lat: 19.0178, lng: 72.8436, city: "Mumbai" } },
    ];
    for (const d of testDrivers) {
      await User.create(d);
    }

    // 3. Fetch all vehicles and routes
    const vehicles = await Vehicle.find().populate("route");
    console.log(`🚌 Found ${vehicles.length} vehicles. Generating dynamic drivers...`);

    const newDrivers = [];
    let driverCounter = 100;

    for (let i = 0; i < vehicles.length; i++) {
      const v = vehicles[i];
      if (!v.route || !v.route.stops || v.route.stops.length === 0) continue;

      // Determine base location from route origin
      const originStop = v.route.stops[0];
      const city = v.route.origin || originStop.name.split(" ")[0]; // fallback
      
      // Add slight variance to lat/lng so they aren't all exactly on top of the bus stop
      const latOffset = (Math.random() - 0.5) * 0.05;
      const lngOffset = (Math.random() - 0.5) * 0.05;

      const name = getRandomName();
      const email = `driver${driverCounter}@pt.com`;
      const phone = `987${Math.floor(1000000 + Math.random() * 9000000)}`;

      const newDriver = {
        name,
        email,
        password: "driver123", // password hashing will be handled by pre-save or we can assume manual handling. wait, User.create triggers pre-save.
        role: "driver",
        phone,
        baseLocation: {
          lat: originStop.lat + latOffset,
          lng: originStop.lng + lngOffset,
          city: city
        }
      };

      // Create driver
      await User.create(newDriver);
      
      // Assign driver to vehicle
      v.driverName = email;
      await v.save();

      driverCounter++;
    }

    console.log(`✅ Generated ${driverCounter - 100} location-tagged drivers and mapped them to vehicles.`);
    
  } catch (error) {
    console.error("❌ SEED FAILED:", error);
    throw error;
  }
}

module.exports = seedAssignments;
