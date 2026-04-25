const express = require("express");
const passport = require("passport");
const {
  register,
  login,
  getMe,
  generateTokenAndRedirect,
  listUsers,
  updatePhone,
} = require("../controllers/authController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Protected
router.get("/me", protect, getMe);
router.get("/list-users", protect, listUsers);

// Registration (passenger only)
router.post("/register", register);

// Login (all roles)
router.post("/login", login);
router.put("/update-phone", protect, updatePhone);

// Google Auth (passenger only)
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: process.env.FRONTEND_URL + "/login",
    session: false,
  }),
  generateTokenAndRedirect
);

module.exports = router;
