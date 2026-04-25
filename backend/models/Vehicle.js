/**
 * Vehicle Model
 * Represents both long-haul (intercity) and local (city) buses.
 * Tracks real-time location, assigned route, and nearest stop index.
 */
const mongoose = require("mongoose");

const locationSchema = new mongoose.Schema({
  lat: Number,
  lng: Number,
}, { _id: false });

const vehicleSchema = new mongoose.Schema({
  regNumber:  { type: String, required: true, unique: true },
  model:      String,
  capacity:   Number,
  route:      { type: mongoose.Schema.Types.ObjectId, ref: "Route", default: null },
  driverName: String,
  status:     { type: String, default: "active" },

  // "long-haul" = booked intercity buses (existing behaviour)
  //   "local"     = city route buses, no booking needed
  type: {
    type: String,
    enum: ["long-haul", "local"],
    default: "long-haul",
  },

  // Tracking (shared by both types)
  isTracking:       { type: Boolean, default: false },
  currentLocation:  { type: locationSchema, default: null },
  lastSeenAt:       { type: Date, default: null },

  // For local buses — index inside route.stops[] the bus is nearest to
  nearestStopIndex: { type: Number, default: null },

}, { timestamps: true });

module.exports = mongoose.model("Vehicle", vehicleSchema);