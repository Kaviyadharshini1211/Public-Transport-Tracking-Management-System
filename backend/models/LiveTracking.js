const mongoose = require("mongoose");

const liveTrackingSchema = new mongoose.Schema({
  busId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "PublicBus"
  },
  lat: Number,
  lng: Number,
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("LiveTracking", liveTrackingSchema);