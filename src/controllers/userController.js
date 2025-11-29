// src/controllers/userController.js
// This controller handles CRUD operations for users (for admin and self-management).

// Import the User model for database access
const User = require("../models/userModel");
// Import bcryptjs to hash passwords when updating a user
const bcrypt = require("bcryptjs");
// Helper to format user data together with role information
const formatUserWithRole = require("../utils/formatUserWithRole");

// Get all users
// Supports pagination and optional inclusion of inactive (soft-deleted) users.
const getAllUsers = async (req, res) => {
  try {
    // Check query flag to decide whether to include inactive users
    const includeInactive = req.query.includeInactive === "true";
    // Build filter: either all users or only active ones
    const filter = includeInactive ? {} : { is_active: true };

    // Parse pagination parameters from query string
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    // Ensure page and limit are at least 1
    const safePage = page < 1 ? 1 : page;
    const safeLimit = limit < 1 ? 10 : limit;
    // Number of documents to skip based on page
    const skip = (safePage - 1) * safeLimit;

    // Run count and query in parallel for efficiency
    const [total, users] = await Promise.all([
      // Count total users matching filter
      User.countDocuments(filter),
      // Fetch users, sorted by newest first, with pagination and role populated
      User.find(filter)
        .sort({ created_date: -1 })
        .skip(skip)
        .limit(safeLimit)
        .populate("role_id", "name"),
    ]);

    // Convert user documents to formatted plain objects including role
    const formattedUsers = users.map(formatUserWithRole);
    // Calculate total number of pages
    const totalPages = Math.ceil(total / safeLimit) || 1;

    // Send paginated list of users
    res.status(200).json({
      data: formattedUsers,
      page: safePage,
      limit: safeLimit,
      total,
      totalPages,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Get single user by ID
// Allows optionally including inactive users using query flag.
const getUserById = async (req, res) => {
  try {
    const includeInactive = req.query.includeInactive === "true";
    // Base filter: match by _id from the route parameter
    const filter = { _id: req.params.id };
    // If not including inactive, require is_active = true
    if (!includeInactive) {
      filter.is_active = true;
    }

    // Find user and populate role name
    const user = await User.findOne(filter).populate("role_id", "name");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Return formatted user with role info
    res.status(200).json(formatUserWithRole(user));
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Update user by ID
// Supports updating profile fields, role, active flag, and password.
const updateUser = async (req, res) => {
  try {
    // Destructure allowed fields from request body
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

    // Object to hold fields to update
    const updates = {};

    // Only set fields that are provided
    if (first_name) updates.first_name = first_name.trim();
    if (last_name) updates.last_name = last_name.trim();
    if (email_address) updates.email_address = email_address.toLowerCase().trim();
    if (phone_number !== undefined)
      updates.phone_number = phone_number?.trim?.()
        ? phone_number.trim()
        : phone_number;
    if (role_id) updates.role_id = role_id;
    if (profile_picture_image !== undefined) {
      updates.profile_picture_image = profile_picture_image?.trim?.()
        ? profile_picture_image.trim()
        : profile_picture_image;
    }
    if (typeof is_active === "boolean") updates.is_active = is_active;

    // If password is provided, hash it before saving
    if (password) {
      const salt = await bcrypt.genSalt(10);
      updates.password_hash = await bcrypt.hash(password, salt);
    }

    // Find user by ID and apply the updates atomically
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate("role_id", "name");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Respond with updated user info
    res.status(200).json({
      message: "User updated successfully",
      user: formatUserWithRole(user),
    });
  } catch (error) {
    console.error("Error updating user:", error);
    // Handle validation errors separately with 400 status
    if (error.name === "ValidationError") {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: "Server error" });
  }
};

// Delete user by ID (soft delete)
// Instead of removing from the database, it marks user as inactive.
const deleteUser = async (req, res) => {
  try {
    // Find user by ID
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // If already inactive, simply return a message
    if (!user.is_active) {
      return res.status(200).json({ message: "User already inactive" });
    }

    // Mark user as inactive and save
    user.is_active = false;
    await user.save();

    res.status(200).json({ message: "User soft-deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Export all user-related controller functions
module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
};
