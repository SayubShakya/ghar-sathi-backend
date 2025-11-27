const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const config = require("../configs/config");

const normalizeRoleName = (roleName) => (roleName || "").trim().toUpperCase();

const attachRoleFlags = (req, user) => {
  const rawRoleName = user?.role_id && typeof user.role_id === "object" ? user.role_id.name : null;
  const roleName = normalizeRoleName(rawRoleName);

  req.user = user;
  req.userRoleName = roleName;
  req.userRoleId = user?.role_id && typeof user.role_id === "object" ? user.role_id._id : user.role_id;
  req.isAdmin = roleName === "ADMIN" || roleName === "SUPER_ADMIN";
  req.isSuperAdmin = roleName === "SUPER_ADMIN";
  req.isLandlord = roleName === "LANDLORD";
  req.isRoomSeeker = roleName === "ROOM_SEEKER";
};

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
console.log({decoded});

    const user = await User.findById(decoded.id)
    .populate("role_id", "name");
//  console.log('👤 User found:', user ? 'YES' : 'NO');
//     console.log('🔓 User active:', user?.is_active);   
    //  if (!user || !user.is_active) {
    //   return res.status(401).json({ error: "Not authorized, user not found or inactive" });
    //   // console.log("user not found in database");
    // }
 
    attachRoleFlags(req, user);

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(500).json({ error: "Server error during authentication" });
  }
};

const authorizeRoles = (...allowedRoles) => {
  const normalizedAllowed = allowedRoles.map(normalizeRoleName);

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authorized" });
    }

    if (req.isAdmin) {
      return next();
    }

    const userRole = req.userRoleName;

    if (!normalizedAllowed.includes(userRole)) {
      return res.status(403).json({ error: "Forbidden: insufficient permissions" });
    }

    next();
  };
};

module.exports = {
  protect,
  authorizeRoles,
};