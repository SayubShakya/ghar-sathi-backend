// src/controllers/authController.js
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const config = require("../configs/config");
const formatUserWithRole = require("../utils/formatUserWithRole");

// Register a new user
const register = async (req, res, next) => {
  try {
    const {
      first_name,
      last_name,
      email_address,
      password,
      phone_number,
      role_id,
      profile_picture_image,
    } = req.body;

    if (!first_name || !last_name || !email_address || !password || !role_id) {
      const error = new Error('first_name, last_name, email_address, password and role_id are required');
      error.statusCode = 400;
      throw error;
    }

    const normalizedEmail = email_address.toLowerCase().trim();

    const existingUser = await User.findOne({ email_address: normalizedEmail });
    if (existingUser) {
      const error = new Error('User already exists');
      error.statusCode = 400;
      throw error;
    }

    const user = new User({
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      email_address: normalizedEmail,
      password_hash: password,
      phone_number: phone_number ? phone_number.trim() : undefined,
      role_id,
      profile_picture_image: profile_picture_image?.trim?.() ? profile_picture_image.trim() : profile_picture_image,
    });

    await user.save();

    await user.populate("role_id", "name");

    res.status(201).json({
      message: "User registered successfully",
      user: formatUserWithRole(user),
    });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};

// User login
const login = async (req, res) => {
  try {
    const { email_address, password } = req.body;

    if (!email_address || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const normalizedEmail = email_address.toLowerCase().trim();

    // Find user by email (case-insensitive) and include password field
    const user = await User.findOne({ email_address: normalizedEmail }).select('+password_hash');
    if (!user) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    await user.populate("role_id", "name");

    // Generate JWT token
    const token = jwt.sign({ id: user._id }, config.JWT_SECRET, {
      expiresIn: config.JWT_EXPIRATION,
    });

    res.status(200).json({
      message: "Login successful",
      token,
      user: formatUserWithRole(user),
    });
  } catch (error) {
    console.error("Error logging in user:", error);
    res.status(500).json({ error: "Server error. Please try again later." });
  }
};

// Separate token generation API using email and password
const generateTokenWithCredentials = async (req, res) => {
  try {
    const { email_address, password } = req.body;

    if (!email_address || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const normalizedEmail = email_address.toLowerCase().trim();

    const user = await User.findOne({ email_address: normalizedEmail }).select(
      "+password_hash"
    );

    if (!user || !user.is_active) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const roleId = user.role_id?.toString?.() || user.role_id;

    const payload = {
      user_id: user._id.toString(),
      role_id: roleId,
    };

    const token = jwt.sign(payload, config.JWT_SECRET, {
      expiresIn: config.JWT_EXPIRATION,
    });

    res.status(200).json({
      user_id: payload.user_id,
      role_id: payload.role_id,
      token,
    });
  } catch (error) {
    console.error("Error generating token with credentials:", error);
    res.status(500).json({ error: "Server error. Please try again later." });
  }
};

module.exports = {
  register,
  login,
  generateTokenWithCredentials,
};