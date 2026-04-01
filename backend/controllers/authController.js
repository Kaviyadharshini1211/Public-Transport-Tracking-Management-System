const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;

// ------------------ REGISTER (PASSENGER ONLY) ------------------
exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "User already exists" });

    // Allow role for admin-created accounts (driver), default to passenger
    const allowedRoles = ["passenger", "driver"];
    const assignedRole = allowedRoles.includes(role) ? role : "passenger";

    const user = await User.create({
      name,
      email,
      password,
      role: assignedRole,
    });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      token,
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  console.log(`[Auth] Login attempt for: ${email}`);

  try {
    const user = await User.findOne({ email });
    if (!user) {
      console.warn(`[Auth] User not found: ${email}`);
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.warn(`[Auth] Passwords do not match for: ${email}`);
      return res.status(401).json({ message: "Invalid email or password" });
    }

    console.log(`[Auth] Login successful: ${email} (${user.role})`);

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
