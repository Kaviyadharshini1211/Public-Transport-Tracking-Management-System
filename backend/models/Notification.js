const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // The recipient (driver or admin)
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { 
    type: String, 
    enum: ["assignment", "route_change", "emergency", "system", "earnings"], 
    default: "system" 
  },
  read: { type: Boolean, default: false },
  
  // Optional linkage to related entities
  relatedTripId: { type: mongoose.Schema.Types.ObjectId, ref: "Trip", default: null },
  relatedVehicleId: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle", default: null }

}, { timestamps: true });

module.exports = mongoose.model("Notification", notificationSchema);
