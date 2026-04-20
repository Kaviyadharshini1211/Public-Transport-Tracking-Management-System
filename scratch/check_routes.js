const mongoose = require('mongoose');
const Route = require('../backend/models/Route');
require('dotenv').config({ path: '../backend/.env' });

async function check() {
  await mongoose.connect(process.env.MONGO_URI);
  const routes = await Route.find();
  console.log("Total routes:", routes.length);
  const intercity = routes.filter(r => r.type === "INTERCITY");
  console.log("Intercity routes:", intercity.length);
  for (let r of intercity.slice(0, 2)) {
    console.log("Route:", r.name || r.routeName, "Stops length:", r.stops?.length);
    if (r.stops && r.stops.length > 0) {
      console.log(" First stop:", r.stops[0].name);
    }
  }
  process.exit();
}
check();
