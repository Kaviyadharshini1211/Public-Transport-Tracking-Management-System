const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Route = require("./models/Route");
const Vehicle = require("./models/Vehicle");

dotenv.config();

async function checkData() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to DB");

  const routes = await Route.find();
  console.log(`Total Routes: ${routes.length}`);
  
  routes.forEach(r => {
    console.log(`- ${r.name} (${r._id}) | Origin: ${r.origin} | Dest: ${r.destination}`);
    console.log(`  Stops: ${r.stops.map(s => s.name).join(", ")}`);
  });

  const vehicles = await Vehicle.find();
  console.log(`Total Vehicles: ${vehicles.length}`);
  
  const unassigned = vehicles.filter(v => !v.route);
  console.log(`Unassigned Vehicles: ${unassigned.length}`);

  process.exit(0);
}

checkData();
