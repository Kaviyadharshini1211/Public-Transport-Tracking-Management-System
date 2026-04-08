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
    const { id } = req.body;
    const query = { userId: req.user.id, read: false };
    if (id) query._id = id;

    await Notification.updateMany(
      query,
      { $set: { read: true } }
    );
    res.json({ message: id ? "Notification marked as read" : "All notifications marked as read" });
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

// @desc    Clear all notifications for a user
// @route   DELETE /api/notifications/clear
// @access  Private
exports.clearNotifications = async (req, res) => {
  try {
    await Notification.deleteMany({ userId: req.user.id });
    res.json({ message: "All notifications cleared" });
  } catch (err) {
    console.error("Error clearing notifications:", err);
    res.status(500).json({ message: "Failed to clear notifications" });
  }
};

