const mongoose = require("mongoose");

const sosAlertSchema = new mongoose.Schema({
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  driverName: { type: String, required: true },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  status: { type: String, enum: ["active", "resolved"], default: "active" },
  message: { type: String, default: "Emergency Response Requested" }
}, { timestamps: true });

module.exports = mongoose.model("SOSAlert", sosAlertSchema);
