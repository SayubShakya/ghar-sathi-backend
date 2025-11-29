// src/controllers/authController.js
// This controller handles user authentication: register, login, and token generation.

// Import jsonwebtoken to create and verify JWT tokens
const jwt = require("jsonwebtoken");
// Import the User model for database operations on users
const User = require("../models/userModel");
// Import app configuration (JWT secret and expiration time)
const config = require("../configs/config");
// Helper function to format user data together with role info
const formatUserWithRole = require("../utils/formatUserWithRole");

// Register a new user
// This function reads user details from the request body, validates them,
// checks for duplicate email, saves the user, and returns the created user.
const register = async (req, res, next) => {
  try {
    // Destructure fields from the incoming request body
    const {
      first_name,
      last_name,
      email_address,
      password,
      phone_number,
      role_id,
      profile_picture_image,
    } = req.body;

    // Validate required fields
    if (!first_name || !last_name || !email_address || !password || !role_id) {
      const error = new Error(
        "first_name, last_name, email_address, password and role_id are required"
      );
      error.statusCode = 400;
      throw error;
    }

    // Normalize email (lowercase + remove spaces)
    const normalizedEmail = email_address.toLowerCase().trim();

    // Check if a user with the same email already exists
    const existingUser = await User.findOne({ email_address: normalizedEmail });
    if (existingUser) {
      const error = new Error("User already exists");
      error.statusCode = 400;
      throw error;
    }

    // Create a new User instance
    // Note: password_hash will be hashed by the pre-save hook in userModel
    const user = new User({
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      email_address: normalizedEmail,
      password_hash: password,
      phone_number: phone_number ? phone_number.trim() : undefined,
      role_id,
      profile_picture_image: profile_picture_image?.trim?.()
        ? profile_picture_image.trim()
        : profile_picture_image,
    });

    // Save the user to the database
    await user.save();

    // Load role information (only name field) into user.role_id
    await user.populate("role_id", "name");

    // Return success response with formatted user data
    res.status(201).json({
      message: "User registered successfully",
      user: formatUserWithRole(user),
    });
  } catch (error) {
    // If statusCode not set, treat as server error
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    // Forward error to the global error handler middleware
    next(error);
  }
};

// User login
// This function validates credentials, checks password, and returns a JWT token.
const login = async (req, res) => {
  try {
    // Extract credentials from request body
    const { email_address, password } = req.body;

    // Basic validation for email and password presence
    if (!email_address || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Normalize email
    const normalizedEmail = email_address.toLowerCase().trim();

    // Find user by email (case-insensitive) and explicitly select password_hash
    const user = await User.findOne({ email_address: normalizedEmail }).select(
      "+password_hash"
    );
    if (!user) {
      // If user is not found, return generic error (no hint which is wrong)
      return res.status(400).json({ error: "Invalid email or password" });
    }

    // Compare provided password with the stored hash
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    // Load role info for the logged-in user
    await user.populate("role_id", "name");

    // Generate JWT token containing user id as payload
    const token = jwt.sign({ id: user._id }, config.JWT_SECRET, {
      expiresIn: config.JWT_EXPIRATION,
    });

    // Send success response with token and formatted user info
    res.status(200).json({
      message: "Login successful",
      token,
      user: formatUserWithRole(user),
    });
  } catch (error) {
    // Log the error and return generic server error
    console.error("Error logging in user:", error);
    res.status(500).json({ error: "Server error. Please try again later." });
  }
};

// Separate token generation API using email and password
// This is similar to login but focuses on issuing a token and basic info only.
const generateTokenWithCredentials = async (req, res) => {
  try {
    // Extract email and password from request body
    const { email_address, password } = req.body;

    // Validate that both fields are present
    if (!email_address || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Normalize email
    const normalizedEmail = email_address.toLowerCase().trim();

    // Find user and explicitly include password_hash
    const user = await User.findOne({ email_address: normalizedEmail }).select(
      "+password_hash"
    );

    // If user not found or soft-deactivated, return 401 Unauthorized
    if (!user || !user.is_active) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Compare passwords
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Extract role id in string form (handle both ObjectId and raw value)
    const roleId = user.role_id?.toString?.() || user.role_id;

    // Payload that will be encoded in the JWT
    const payload = {
      user_id: user._id.toString(),
      role_id: roleId,
    };

    // Sign a new JWT using the configured secret and expiration
    const token = jwt.sign(payload, config.JWT_SECRET, {
      expiresIn: config.JWT_EXPIRATION,
    });

    // Respond with token and the IDs so the client can store them
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

// Export all authentication-related controller functions
module.exports = {
  register,
  login,
  generateTokenWithCredentials,
};