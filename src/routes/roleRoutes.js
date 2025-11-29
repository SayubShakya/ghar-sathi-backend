// Import Express to define API routes
const express = require("express");
// Import controller functions that handle role CRUD operations
const {
  createRole,
  getAllRoles,
  getRoleById,
  updateRole,
  deleteRole,
} = require("../controllers/roleController");
// Import middleware for authentication and role-based authorization
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

// Create a router instance for role routes
const router = express.Router();

// GET /api/roles/ -> get all roles (public in this setup)
router.get("/", getAllRoles);

// GET /api/roles/:id -> get a specific role by its id (ADMIN only)
router.get("/:id", protect, authorizeRoles("ADMIN"), getRoleById);

// POST /api/roles/ -> create a new role (ADMIN only)
router.post("/", protect, authorizeRoles("ADMIN"), createRole);

// PATCH /api/roles/:id -> update an existing role (ADMIN only)
router.patch("/:id", protect, authorizeRoles("ADMIN"), updateRole);

// DELETE /api/roles/:id -> delete a role (ADMIN only)
router.delete("/:id", protect, authorizeRoles("ADMIN"), deleteRole);

// Export the router so it can be mounted under /api/roles
module.exports = router;
