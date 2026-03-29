const Trip = require("../models/Trip");
const Vehicle = require("../models/Vehicle");

// Get active or simulated future trips for a driver
exports.getDriverTrips = async (req, res) => {
  try {
    const userId = req.user.id;
    const trips = await Trip.find({ driverId: userId })
      .populate("vehicleId", "regNumber model")
      .populate("routeId", "origin destination distance stops")
      .sort({ createdAt: -1 });
    
    res.json(trips);
  } catch (err) {
    console.error("Error fetching trips:", err);
    res.status(500).json({ message: "Failed to fetch trips" });
  }
};

// Start Trip (also hooks into geofencing or standard button press)
exports.startTrip = async (req, res) => {
  try {
    const { vehicleId, routeId, lat, lng } = req.body;
    
    let trip = await Trip.findOne({ driverId: req.user.id, vehicleId, status: "scheduled" });
    
    if (!trip) {
      // Create ad-hoc trip if none scheduled
      trip = new Trip({
        driverId: req.user.id,
        vehicleId,
        routeId,
        status: "ongoing",
        startTime: Date.now(),
        startLocation: { lat, lng },
        path: [{ lat, lng, timestamp: Date.now() }]
      });
    } else {
      trip.status = "ongoing";
      trip.startTime = Date.now();
      trip.startLocation = { lat, lng };
      trip.path.push({ lat, lng, timestamp: Date.now() });
    }
    
    await trip.save();
    
    // Also update Vehicle
    await Vehicle.findByIdAndUpdate(vehicleId, { isTracking: true });

    res.status(200).json({ message: "Trip started successfully", trip });
  } catch (err) {
    console.error("Start Trip error:", err);
    res.status(500).json({ message: "Failed to start trip" });
  }
};

// End Trip (calculate earnings)
exports.endTrip = async (req, res) => {
  try {
    const { tripId, lat, lng, distanceCovered } = req.body;
    
    const trip = await Trip.findOne({ _id: tripId, driverId: req.user.id });
    if (!trip) return res.status(404).json({ message: "Trip not found" });

    trip.status = "completed";
    trip.endTime = Date.now();
    trip.endLocation = { lat, lng };
    trip.distanceCovered = distanceCovered || trip.distanceCovered || 15.5; // fallback
    
    // Basic calculation for earnings (e.g., $2 per km)
    trip.earnings = trip.distanceCovered * 2;
    
    if (lat && lng) {
      trip.path.push({ lat, lng, timestamp: Date.now() });
    }

    await trip.save();

    // Turn off tracking on Vehicle
    await Vehicle.findByIdAndUpdate(trip.vehicleId, { isTracking: false });

    res.status(200).json({ message: "Trip ended successfully", trip });
  } catch (err) {
    console.error("End Trip error:", err);
    res.status(500).json({ message: "Failed to end trip" });
  }
};

// Simple hook for socket integration to push path arrays
exports.updateTripLocation = async (tripId, lat, lng, speed) => {
  try {
    await Trip.findByIdAndUpdate(tripId, {
      $push: { path: { lat, lng, timestamp: Date.now(), speed } }
    });
  } catch (err) {
    console.error("Failed to append location to trip:", err);
  }
};
