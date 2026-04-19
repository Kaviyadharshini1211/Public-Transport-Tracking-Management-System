const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { 
  updateProfile, 
  updateSettings, 
  getFavorites, 
  toggleFavorite 
} = require("../controllers/userController");

const router = express.Router();

router.use(protect);

router.put("/profile", updateProfile);
router.put("/settings", updateSettings);
router.get("/favorites", getFavorites);
router.post("/favorites/:routeId", toggleFavorite);

module.exports = router;
