const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;

const validator = require("validator");

exports.register = async (req, res) => {
  try {
    let { name, email, password, phone } = req.body;

    // 🔴 Check required fields
    if (!name || !email || !password || !phone) {
      return res.status(400).json({
        message: "All fields including phone are required",
      });
    }

    // 🔴 Validate email
    if (!validator.isEmail(email)) {
      return res.status(400).json({
        message: "Invalid email format",
      });
    }

    // 🔵 Clean phone input
    phone = phone.replace(/\s+/g, ""); // remove spaces

    // Remove +91 if user entered it
    if (phone.startsWith("+91")) {
      phone = phone.slice(3);
    }

    // Remove leading 0 if user entered 0XXXXXXXXXX
    if (phone.startsWith("0")) {
      phone = phone.slice(1);
    }

    // 🔴 Validate 10-digit Indian number
    if (!/^[6-9]\d{9}$/.test(phone)) {
      return res.status(400).json({
        message: "Invalid Indian phone number",
      });
    }

    // 🔵 Force E.164 format
    phone = `+91${phone}`;

    // 🔴 Check if email exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    // 🔵 Create user
    const user = await User.create({
      name,
      email,
      password,
      phone,
      role: "passenger",
    });

    // 🔐 Generate JWT
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
      token,
    });

  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Server error" });
  }
};


// ------------------ LOGIN (ALL ROLES) ------------------
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      token,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ------------------ GOOGLE LOGIN (PASSENGER ONLY) ------------------
exports.generateTokenAndRedirect = (req, res) => {
  const token = jwt.sign(
    { id: req.user._id, role: req.user.role },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

  const redirectURL = `${process.env.FRONTEND_URL}/auth/success?token=${token}`;
  return res.redirect(redirectURL);
};

// ------------------ GET LOGGED IN USER ------------------
exports.getMe = async (req, res) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");

  if (!req.user)
    return res.status(401).json({ message: "User not found" });

  res.status(200).json({ user: req.user });
};

// ------------------ ADMIN: LIST USERS BY ROLE ------------------
exports.listUsers = async (req, res) => {
  try {
    const { role } = req.query;
    const query = role ? { role } : {};

    const users = await User.find(query).select("-password");

    res.json(users);
  } catch (err) {
    console.error("List users error:", err);
    res.status(500).json({ message: "Failed to fetch users" });
  }
};
