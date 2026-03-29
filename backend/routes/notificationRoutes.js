const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { getNotifications, markAsRead, triggerEmergency } = require("../controllers/notificationController");

const router = express.Router();

router.use(protect);

router.get("/", getNotifications);
router.put("/read", markAsRead);
router.post("/emergency", triggerEmergency);

module.exports = router;
