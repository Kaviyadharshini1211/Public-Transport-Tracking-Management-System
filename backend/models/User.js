/**
 * User Model
 * Represents passengers, drivers, and admins.
 * Supports both email/password and Google OAuth authentication.
 */
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },

  email: { type: String, required: true, unique: true },

  phone: {
    type: String,
    required: function () {
      // Google OAuth users may complete phone later.
      return !this.googleId;
    },
    trim: true,
    validate: {
      validator: function (v) {
        if (!v) return !this.googleId;
        return /^(\+91)?[6-9]\d{9}$/.test(v);
      },
      message: (props) => `${props.value} is not a valid phone number!`,
    },
  },

  // Password required for normal accounts AND driver accounts
  password: {
    type: String,
    required: function () {
      return !this.googleId;
    },
  },

  googleId: {
    type: String,
    default: null,
  },

  role: {
    type: String,
    enum: ["admin", "passenger", "driver"],
    default: "passenger",
  },

  address: {
    type: String,
    default: "",
  },

  favorites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Route'
  }],

  settings: {
    emailNotifications: { type: Boolean, default: true },
    pushNotifications: { type: Boolean, default: true },
    darkMode: { type: Boolean, default: false }
  }
});

// Hash password
userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);

  next();
});

// Compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
