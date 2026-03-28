const mongoose = require("mongoose");

const boardingStopSchema = new mongoose.Schema(
  {
    name: String,
    lat: Number,
    lng: Number,
  },
  { _id: false }
);

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

    seats: { type: Number, required: true },

    seatNumbers: {
      type: [String],
      default: [],
    },

    boardingStop: {
      type: boardingStopSchema,
      default: null,
    },

    totalFare: { type: Number, required: true },

    status: {
      type: String,
      enum: ["Confirmed", "Cancelled"],
      default: "Confirmed",
    },

    // ⭐ NEW FIELD — User can toggle alerts ON/OFF
    emailAlerts: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Booking", bookingSchema);
