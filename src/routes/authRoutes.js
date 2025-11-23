const express = require("express");
const { register, login, generateTokenWithCredentials } = require("../controllers/authController");

const router = express.Router();

// Authentication routes
router.post("/register", register);
router.post("/login", login);
router.post("/token", generateTokenWithCredentials);

module.exports = router;