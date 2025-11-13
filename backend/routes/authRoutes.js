const express = require("express");
const passport = require("passport");

const router = express.Router();
const { register, login, generateTokenAndRedirect,getMe } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");


router.get("/me", protect, getMe);

// Normal Auth
router.post("/register", register);
router.post("/login", login);

// Google Auth (NO SESSIONS)
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,   // IMPORTANT
  })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: process.env.FRONTEND_URL + "/login",
    session: false,   // IMPORTANT
  }),
  generateTokenAndRedirect
);

module.exports = router;
