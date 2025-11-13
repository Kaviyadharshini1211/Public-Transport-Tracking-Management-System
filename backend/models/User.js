const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },

  email: { type: String, required: true, unique: true },

  // Password is required ONLY for normal accounts
  password: {
    type: String,
    required: function () {
      return !this.googleId; // password not required for Google users
    },
  },

  googleId: {
    type: String,
    default: null,
  },

  // Google users should never become admin
  role: {
    type: String,
    enum: ["admin", "passenger"],
    default: "passenger",
  },
});

// Hash password ONLY if it's a normal registration
userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);

  next();
});

// Compare password for normal login
userSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) return false; // for Google users
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
