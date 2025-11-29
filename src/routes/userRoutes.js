// Import Express to create a router for user-related routes
const express = require("express");
// Import controller functions that handle user operations
const { 
  getAllUsers, 
  getUserById, 
  updateUser, 
  deleteUser 
} = require("../controllers/userController");
// Import authentication and authorization middleware
// protect -> checks JWT and attaches user
// authorizeRoles -> allows only specific roles
// allowSelfOrRoles -> allows either the same user or specific roles
const { protect, authorizeRoles, allowSelfOrRoles } = require("../middleware/authMiddleware");

// Create a new router instance for user routes
const router = express.Router();

// User routes
// GET /api/users/ -> get a paginated list of users, only accessible by ADMIN
router.get("/", protect, authorizeRoles("ADMIN"), getAllUsers);

// GET /api/users/:id -> get a single user by id
// Accessible by: the user themself, ADMIN, LANDLORD, or ROOM_SEEKER (based on token)
router.get("/:id", protect, allowSelfOrRoles("ADMIN", "LANDLORD", "ROOM_SEEKER"), getUserById);

// PATCH /api/users/:id -> update user details
// Accessible by: the user themself, ADMIN, LANDLORD, or ROOM_SEEKER
router.patch("/:id", protect, allowSelfOrRoles("ADMIN", "LANDLORD", "ROOM_SEEKER"), updateUser);

// DELETE /api/users/:id -> soft delete (deactivate) a user
// Only ADMIN can delete users
router.delete("/:id", protect, authorizeRoles("ADMIN"), deleteUser);

// Export the router so it can be used in index.js under /api/users
module.exports = router;
