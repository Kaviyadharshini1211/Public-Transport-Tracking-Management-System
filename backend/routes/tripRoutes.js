const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { getDriverTrips, startTrip, endTrip } = require("../controllers/tripController");

const router = express.Router();

// All trip routes are protected
router.use(protect);

router.get("/my-trips", getDriverTrips);
router.post("/start", startTrip);
router.post("/end", endTrip);

module.exports = router;
