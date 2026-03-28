const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const User = require("../models/User");

async function seedDrivers() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("Connected to DB");

    // Remove OLD drivers
    await User.deleteMany({ role: "driver" });

    const drivers = [
      {
        name: "Driver One",
        email: "driver1@pt.com",
        password: "driver123",
        role: "driver",
      },
      {
        name: "Driver Two",
        email: "driver2@pt.com",
        password: "driver123",
        role: "driver",
      },
      {
        name: "Driver Three",
        email: "driver3@pt.com",
        password: "driver123",
        role: "driver",
      },
    ];

    // ❗ IMPORTANT: use create() one-by-one, so pre-save hook runs & password is hashed
    for (let d of drivers) {
      await User.create(d);
    }

    console.log("Drivers seeded successfully!");
    process.exit();

  } catch (err) {
    console.error("Error seeding drivers:", err);
    process.exit(1);
  }
}

seedDrivers();
