const mongoose = require("mongoose");
const locationSchema = new mongoose.Schema({
  lat: Number,
  lng: Number
}, { _id: false });

const vehicleSchema = new mongoose.Schema({
  regNumber: { type: String, required: true, unique: true },
  model: String,
  capacity: Number,
  route: { type: mongoose.Schema.Types.ObjectId, ref: "Route", default: null },
  driverName: String,
  status: { type: String, default: "active" },

  // tracking fields
  isTracking: { type: Boolean, default: false },
  currentLocation: { type: locationSchema, default: null },
  lastSeenAt: { type: Date, default: null }
  
}, { timestamps: true });

module.exports = mongoose.model("Vehicle", vehicleSchema);

