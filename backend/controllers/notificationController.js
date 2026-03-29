const Notification = require("../models/Notification");

exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(notifications);
  } catch (err) {
    console.error("Error fetching notifications:", err);
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user.id, read: false },
      { $set: { read: true } }
    );
    res.json({ message: "All notifications marked as read" });
  } catch (err) {
    console.error("Error updating notifications:", err);
    res.status(500).json({ message: "Failed to update notifications" });
  }
};

exports.triggerEmergency = async (req, res) => {
  try {
    const { lat, lng, reason } = req.body;
    
    // Simulate notifying admin
    const emergencyNote = await Notification.create({
      userId: req.user.id, // Who triggered it
      title: "🚨 EMERGENCY ALERT TRIGGERED",
      message: `Driver reported an emergency at coordinates [${lat}, ${lng}]. Reason: ${reason || "Panic Button Pressed"}`,
      type: "emergency"
    });

    res.status(201).json({ message: "Emergency signal broadcasted securely to Admin.", emergencyNote });
  } catch (err) {
    console.error("Emergency fail:", err);
    res.status(500).json({ message: "Emergency broadcast failed" });
  }
};
