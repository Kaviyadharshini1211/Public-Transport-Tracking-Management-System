const mongoose = require("mongoose");
const User = require("../models/User");

const seedUsers = async () => {
  console.log("👤 Seeding Admin & Passenger Users...");
  
  // Wipe all existing users to start fresh
  await User.deleteMany({});
  
  // 1. Admin
  await User.create({
    name: "System Admin",
    email: "admin@pt.com",
    password: "admin123",
    role: "admin",
    phone: "9999999999"
  });

  // Drivers are now seeded dynamically via seedAssignments.js

  console.log("✅ All Users seeded successfully.");
};

module.exports = seedUsers;
