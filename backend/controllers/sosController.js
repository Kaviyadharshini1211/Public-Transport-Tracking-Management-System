const SOSAlert = require("../models/SOSAlert");

// POST /api/sos -> Create an explicit alert & globally emit
exports.createSOS = async (req, res) => {
  try {
    const { driverId, driverName, location, message } = req.body;
    
    // Validate basics
    if (!driverId || !location || typeof location.lat !== 'number') {
      return res.status(400).json({ message: "Invalid SOS payload" });
    }

    const newSOS = await SOSAlert.create({
      driverId,
      driverName: driverName || "Unknown Driver",
      location,
      message: message || "Driver triggered SOS protocol"
    });

    // Broadcast globally via Socket IO
    const io = req.app.get("io");
    if (io) {
      io.emit("sos_alert", newSOS);
    }

    res.status(201).json({ success: true, alert: newSOS });
  } catch (error) {
    console.error("SOS generation error:", error);
    res.status(500).json({ message: "Failed to broadcast SOS" });
  }
};

// GET /api/sos -> Retrieve admin-level history table
exports.getAllSOS = async (req, res) => {
  try {
    const alerts = await SOSAlert.find().sort({ createdAt: -1 });
    res.status(200).json(alerts);
  } catch (error) {
    console.error("SOS fetch error:", error);
    res.status(500).json({ message: "Failed to fetch SOS history" });
  }
};

// PATCH /api/sos/:id -> Resolve the issue
exports.resolveSOS = async (req, res) => {
  try {
    const alertId = req.params.id;
    const alert = await SOSAlert.findByIdAndUpdate(
      alertId, 
      { status: "resolved" },
      { new: true }
    );

    if (!alert) {
      return res.status(404).json({ message: "SOS Alert not found" });
    }

    // Broadcast the resolution globally so dashboards dynamically adapt
    const io = req.app.get("io");
    if (io) {
      io.emit("sos_resolved", alert);
    }

    res.status(200).json({ success: true, alert });
  } catch (error) {
    console.error("SOS resolution error:", error);
    res.status(500).json({ message: "Failed to resolve SOS" });
  }
};
