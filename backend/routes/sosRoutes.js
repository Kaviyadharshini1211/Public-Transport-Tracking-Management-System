const express = require("express");
const { createSOS, getAllSOS, resolveSOS } = require("../controllers/sosController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Driver-level public SOS trigger
router.post("/", createSOS);

// Admin-level queries & actions
router.use(protect);
router.get("/", getAllSOS);
router.patch("/:id", resolveSOS);

module.exports = router;
