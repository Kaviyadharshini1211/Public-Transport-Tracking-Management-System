const express = require("express");
const passport = require("passport");
const {
  register,
  login,
  getMe,
  generateTokenAndRedirect,
  listUsers
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
