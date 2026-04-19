const mongoose = require("mongoose");

const tripSchema = new mongoose.Schema({
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle", required: true },
  routeId: { type: mongoose.Schema.Types.ObjectId, ref: "Route", required: true },
  status: { type: String, enum: ["scheduled", "ongoing", "completed", "cancelled"], default: "scheduled" },
  
  startTime: { type: Date, default: null },
  endTime: { type: Date, default: null },
  
  distanceCovered: { type: Number, default: 0 }, // in km
  earnings: { type: Number, default: 0 },        // calculated upon completion
  
  startLocation: {
    lat: Number,
    lng: Number
  },
  endLocation: {
    lat: Number,
    lng: Number
  },
  
  // Track continuous locations during the trip (optional, can grow large)
  path: [{
    lat: Number,
    lng: Number,
    timestamp: { type: Date, default: Date.now },
    speed: { type: Number, default: 0 } // in km/h
  }],

  // Passenger count or load details
  passengerCount: { type: Number, default: 0 }

}, { timestamps: true });

module.exports = mongoose.model("Trip", tripSchema);
