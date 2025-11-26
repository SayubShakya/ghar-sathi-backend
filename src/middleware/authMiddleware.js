const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const config = require("../configs/config");

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    const [, token] = authHeader.split(" ");

    if (!token) {
      return res.status(401).json({ error: "Not authorized, token missing" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, config.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: "Not authorized, token invalid" });
    }

    const user = await User.findById(decoded.id).populate("role_id", "name");
    if (!user) {
      return res.status(401).json({ error: "Not authorized, user not found" });
    }

    req.user = user; // Only attach user, no roles
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(500).json({ error: "Server error during authentication" });
  }
};

// Disable role checking completely
const authorizeRoles = () => (req, res, next) => next();

module.exports = {
  protect,
  authorizeRoles,
};
