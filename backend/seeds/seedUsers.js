const mongoose = require("mongoose");
const User = require("../models/User");

const seedUsers = async () => {
  console.log("👤 Seeding ALL System Users...");
  
  // 1. Admin
  await User.create({
    name: "System Admin",
    email: "admin@pt.com",
    password: "admin123",
    role: "admin",
    phone: "0000000000"
  });

  // 2. Main Intercity Driver
  await User.create({
    name: "John Intercity",
    email: "driver@pt.com",
    password: "driver123",
    role: "driver",
    phone: "9999999999"
  });

  // 3. General Drivers (from driverseed.js)
  const generalDrivers = [
    { name: "Driver One",   email: "driver1@pt.com", password: "driver123", phone: "9876543210" },
    { name: "Driver Two",   email: "driver2@pt.com", password: "driver123", phone: "9876543211" },
    { name: "Driver Three", email: "driver3@pt.com", password: "driver123", phone: "9876543212" },
  ];

  for (const d of generalDrivers) {
    await User.create({ ...d, role: "driver" });
  }

  // 4. Local City Drivers (from publicvehicleseed.js)
  const localDrivers = [
    { name: "Ramesh Verma",   email: "ldriver1@pt.com", password: "driver123", phone: "9811111111" },
    { name: "Suresh Nair",    email: "ldriver2@pt.com", password: "driver123", phone: "9822222222" },
    { name: "Priya Sharma",   email: "ldriver3@pt.com", password: "driver123", phone: "9833333333" },
    { name: "Anil Pillai",    email: "ldriver4@pt.com", password: "driver123", phone: "9844444444" },
    { name: "Muthu Kumar",    email: "ldriver5@pt.com", password: "driver123", phone: "9855555555" },
    { name: "Ravi Teja",      email: "ldriver6@pt.com", password: "driver123", phone: "9866666666" },
  ];

  for (const d of localDrivers) {
    await User.create({ ...d, role: "driver" });
  }

  console.log("✅ All Users seeded successfully.");
};

module.exports = seedUsers;
