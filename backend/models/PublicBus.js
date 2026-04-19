const mongoose = require("mongoose");

const publicBusSchema = new mongoose.Schema({
  busNumber: String,
  routeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Route"
  },
  status: {
    type: String,
    enum: ["running", "idle"],
    default: "running"
  }
});

module.exports = mongoose.model("PublicBus", publicBusSchema);