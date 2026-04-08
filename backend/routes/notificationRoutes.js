const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { getNotifications, markAsRead, triggerEmergency, clearNotifications } = require("../controllers/notificationController");

const router = express.Router();

router.use(protect);

router.get("/", getNotifications);
router.put("/read", markAsRead);
router.delete("/clear", clearNotifications);
router.post("/emergency", triggerEmergency);


module.exports = router;
