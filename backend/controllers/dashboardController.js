const Vehicle = require("../models/Vehicle");
const Booking = require("../models/Booking");


exports.getDashboardStats = async (req, res) => {
  try {
    const totalVehicles = await Vehicle.countDocuments();
    const totalTrips = await Trip.countDocuments();
    const activeTrips = await Trip.countDocuments({ status: "active" });
    const totalBookings = await Booking.countDocuments();

    const recentTrips = await Trip.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("vehicleId", "vehicleNumber type");

    res.json({
      stats: {
        totalVehicles,
        totalTrips,
        activeTrips,
        totalBookings,
      },
      recentTrips,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
