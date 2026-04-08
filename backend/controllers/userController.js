const User = require("../models/User");

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      user.phone = req.body.phone || user.phone;
      user.address = req.body.address || user.address;

      if (req.body.password) {
        user.password = req.body.password;
      }

      const updatedUser = await user.save();

      res.json({
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        address: updatedUser.address,
        role: updatedUser.role,
        settings: updatedUser.settings
      });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({ message: err.message || "Failed to update profile" });
  }
};

// @desc    Update user settings
// @route   PUT /api/users/settings
// @access  Private
exports.updateSettings = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (user) {
      user.settings = { ...user.settings.toObject(), ...req.body };
      await user.save();
      res.json(user.settings);
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (err) {
    console.error("Update settings error:", err);
    res.status(500).json({ message: "Failed to update settings" });
  }
};

// @desc    Get user favorites
// @route   GET /api/users/favorites
// @access  Private
exports.getFavorites = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('favorites');
    res.json(user.favorites);
  } catch (err) {
    console.error("Get favorites error:", err);
    res.status(500).json({ message: "Failed to fetch favorites" });
  }
};

// @desc    Toggle route favorite
// @route   POST /api/users/favorites/:routeId
// @access  Private
exports.toggleFavorite = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const { routeId } = req.params;

    const index = user.favorites.indexOf(routeId);
    if (index === -1) {
      user.favorites.push(routeId);
    } else {
      user.favorites.splice(index, 1);
    }

    await user.save();
    res.json({ success: true, favorites: user.favorites });
  } catch (err) {
    console.error("Toggle favorite error:", err);
    res.status(500).json({ message: "Failed to update favorites" });
  }
};
