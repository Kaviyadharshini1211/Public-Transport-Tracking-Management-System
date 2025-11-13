// backend/models/Booking.js
const mongoose = require("mongoose");

const boardingStopSchema = new mongoose.Schema({
  name: { type: String },
  lat: { type: Number },
  lng: { type: Number },
}, { _id: false });

const bookingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    routeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Route",
      required: true,
    },
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      required: true,
    },
    seats: {
      type: Number,
      required: true
    },
    // Array of seat identifiers chosen by passenger (optional)
    seatNumbers: {
      type: [String],
      default: []
    },
    // passenger's chosen boarding stop (object w/ coords)
    boardingStop: {
      type: boardingStopSchema,
      default: null
    },
    totalFare: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: ["Confirmed", "Cancelled"],
      default: "Confirmed",
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Booking", bookingSchema);
