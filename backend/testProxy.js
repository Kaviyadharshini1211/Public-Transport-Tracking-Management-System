const axios = require('axios');
const mongoose = require('mongoose');
const Route = require('./models/Route');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const routes = await Route.find();
  let fail = 0;
  for (const r of routes) {
    if (!r.stops || r.stops.length === 0) continue;
    const coords = r.stops.map(s => `${s.lng},${s.lat}`).join(';');
    try {
      const url = `http://localhost:5000/api/local-buses/osrm-route?coords=${encodeURIComponent(coords)}`;
      const res = await axios.get(url);
      if(res.data.code !== 'Ok') {
        console.log('Fail:', r.name, res.data.code);
        fail++;
      }
    } catch(e) {
      console.log('Error:', r.name, e.response?.data || e.message);
      fail++;
    }
  }
  console.log('Done. Failed:', fail);
  process.exit(0);
});
