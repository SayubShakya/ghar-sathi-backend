// Import Express to create a router for authentication-related routes
const express = require("express");
// Import controller functions that handle auth logic (register, login, token)
const { register, login, generateTokenWithCredentials } = require("../controllers/authController");

// Create a new router instance for auth routes
const router = express.Router();

// Authentication routes
// POST /api/auth/register -> register a new user
router.post("/register", register);
// POST /api/auth/login -> login an existing user and return a JWT
router.post("/login", login);
// POST /api/auth/token -> generate a token using email and password
router.post("/token", generateTokenWithCredentials);

// Export the router so it can be mounted in index.js under /api/auth
module.exports = router;