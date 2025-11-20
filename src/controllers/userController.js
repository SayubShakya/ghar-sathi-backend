const User = require("../models/userModel");
const bcrypt = require("bcryptjs");
const formatUserWithRole = require("../utils/formatUserWithRole");

// Get all users
const getAllUsers = async (req, res) => {
  try {
    const includeInactive = req.query.includeInactive === "true";
    const filter = includeInactive ? {} : { is_active: true };

    const users = await User.find(filter)
      .sort({ created_date: -1 })
      .populate("role_id", "name");

    const formattedUsers = users.map(formatUserWithRole);

    res.status(200).json(formattedUsers);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Get single user by ID
const getUserById = async (req, res) => {
  try {
    const includeInactive = req.query.includeInactive === "true";
    const filter = { _id: req.params.id };
    if (!includeInactive) {
      filter.is_active = true;
    }

    const user = await User.findOne(filter).populate("role_id", "name");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(200).json(formatUserWithRole(user));
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Update user by ID
const updateUser = async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      email_address,
      password,
      phone_number,
      role_id,
      profile_picture_image,
      is_active,
    } = req.body;
    const updates = {};

    if (first_name) updates.first_name = first_name.trim();
    if (last_name) updates.last_name = last_name.trim();
    if (email_address) updates.email_address = email_address.toLowerCase().trim();
    if (phone_number !== undefined) updates.phone_number = phone_number?.trim?.() ? phone_number.trim() : phone_number;
    if (role_id) updates.role_id = role_id;
    if (profile_picture_image !== undefined) {
      updates.profile_picture_image = profile_picture_image?.trim?.()
        ? profile_picture_image.trim()
        : profile_picture_image;
    }
    if (typeof is_active === "boolean") updates.is_active = is_active;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      updates.password_hash = await bcrypt.hash(password, salt);
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate("role_id", "name");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({
      message: "User updated successfully",
      user: formatUserWithRole(user)
    });
  } catch (error) {
    console.error("Error updating user:", error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: "Server error" });
  }
};

// Delete user by ID
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!user.is_active) {
      return res.status(200).json({ message: "User already inactive" });
    }

    user.is_active = false;
    await user.save();

    res.status(200).json({ message: "User soft-deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser
};
