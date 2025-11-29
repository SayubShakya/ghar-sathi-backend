// Middleware for authentication and role-based authorization

// Import jsonwebtoken to work with JWT tokens
const jwt = require("jsonwebtoken");
// Import User model to look up users by ID from the database
const User = require("../models/userModel");
// Import configuration (contains JWT secret and other settings)
const config = require("../configs/config");

// Helper to normalize role names (e.g., "admin" -> "ADMIN")
const normalizeRoleName = (roleName) => (roleName || "").trim().toUpperCase();

// Attach user and role-related flags to the request object
const attachRoleFlags = (req, user) => {
  // Handle missing user defensively so we never crash auth middleware
  if (!user) {
    // No user means no role information and no permissions
    req.user = null;
    req.userRoleName = null;
    req.userRoleId = null;
    req.isAdmin = false;
    req.isSuperAdmin = false;
    req.isLandlord = false;
    req.isRoomSeeker = false;
    return;
  }

  // Get role name either from populated role object or raw role_id value
  const rawRoleName =
    user.role_id && typeof user.role_id === "object" ? user.role_id.name : null;
  // Normalize the role name for consistent comparison
  const roleName = normalizeRoleName(rawRoleName);

  // Store user and role information on the request object for later use
  req.user = user;
  req.userRoleName = roleName;
  req.userRoleId =
    user.role_id && typeof user.role_id === "object" ? user.role_id._id : user.role_id;
  // Convenience boolean flags for different role checks
  req.isAdmin = roleName === "ADMIN" || roleName === "SUPER_ADMIN";
  req.isSuperAdmin = roleName === "SUPER_ADMIN";
  req.isLandlord = roleName === "LANDLORD";
  req.isRoomSeeker = roleName === "ROOM_SEEKER";
};

// Protect middleware: verifies JWT token and loads the user
const protect = async (req, res, next) => {
  try {
    // Read Authorization header (expected format: "Bearer <token>")
    const authHeader = req.headers.authorization || "";
    // Split by space and take the second part as the token
    const [, token] = authHeader.split(" ");

    // If no token is present, block access
    if (!token) {
      return res.status(401).json({ error: "Not authorized, token missing" });
    }

    let decoded;
    try {
      // Verify the token using the JWT secret from config
      decoded = jwt.verify(token, config.JWT_SECRET);
    } catch (err) {
      // If verification fails, token is invalid
      return res.status(401).json({ error: "Not authorized, token invalid" });
    }
    console.log({ decoded });

    // Your JWT payload uses user_id (and role_id), not id
    const userId = decoded.id || decoded.user_id;
    if (!userId) {
      // If token does not contain a user id, consider it unauthorized
      return res
        .status(401)
        .json({ error: "Not authorized, user id missing in token" });
    }

    // Look up the user in the database and populate role name
    const user = await User.findById(userId).populate("role_id", "name");
    if (!user) {
      // If user no longer exists, block access
      return res
        .status(401)
        .json({ error: "Not authorized, user not found" });
    }

    // Attach user and role flags to the request for later middleware/routes
    attachRoleFlags(req, user);

    // Allow request to continue to the next middleware/route handler
    next();
  } catch (error) {
    // Catch any unexpected errors in the middleware
    console.error("Auth middleware error:", error);
    return res.status(500).json({ error: "Server error during authentication" });
  }
};

// authorizeRoles: allow only specific roles to access a route
const authorizeRoles = (...allowedRoles) => {
  // Normalize all allowed roles to uppercase for comparison
  const normalizedAllowed = allowedRoles.map(normalizeRoleName);

  // Return actual middleware function
  return (req, res, next) => {
    // If user is not set on request, they are not authenticated
    if (!req.user) {
      return res.status(401).json({ error: "Not authorized" });
    }

    // Admin and Super Admin can always proceed
    if (req.isAdmin) {
      return next();
    }

    // Check if the user's role is in the allowed roles
    const userRole = req.userRoleName;

    if (!normalizedAllowed.includes(userRole)) {
      return res.status(403).json({ error: "Forbidden: insufficient permissions" });
    }

    // If checks pass, continue to the route handler
    next();
  };
};

// allowSelfOrRoles: allow user if they are the same as :id OR have one of the roles
const allowSelfOrRoles = (...allowedRoles) => {
  // Normalize allowed roles
  const normalizedAllowed = allowedRoles.map(normalizeRoleName);

  // Return actual middleware function
  return (req, res, next) => {
    // Require authentication
    if (!req.user) {
      return res.status(401).json({ error: "Not authorized" });
    }

    // Admin (and super admin) can always access
    if (req.isAdmin) {
      return next();
    }

    // Get id from route parameter and current logged-in user id
    const paramId = req.params && req.params.id ? req.params.id.toString() : null;
    const currentUserId =
      req.user && req.user._id ? req.user._id.toString() : null;

    // If the user is accessing their own resource (e.g., /users/:id where id matches)
    if (paramId && currentUserId && paramId === currentUserId) {
      return next();
    }

    // Otherwise, check if their role is in the allowed roles
    const userRole = req.userRoleName;

    if (!normalizedAllowed.length || normalizedAllowed.includes(userRole)) {
      return next();
    }

    // If neither self nor allowed role, deny access
    return res.status(403).json({ error: "Forbidden: insufficient permissions" });
  };
};

// Export middleware functions to be used in routes
module.exports = {
  protect,
  authorizeRoles,
  allowSelfOrRoles,
};