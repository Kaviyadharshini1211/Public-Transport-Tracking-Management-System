const mongoose = require("mongoose");

const stopSchema = new mongoose.Schema({
  name: String,
  lat: Number,
  lng: Number,
  order: Number
});

const routeSchema = new mongoose.Schema({
  routeNumber: String,
  routeName: String,

  // Used by local bus routes (publicvehicleseed)
  name:        String,
  origin:      String,
  destination: String,
  distanceKm:  Number,
  avgSpeedKmph: { type: Number, default: 25 },

  type: {
    type: String,
    enum: ["INTERCITY", "INTRACITY"],
    default: "INTERCITY"
  },

  stops: [stopSchema]
});

module.exports = mongoose.model("Route", routeSchema);