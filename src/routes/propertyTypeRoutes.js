// Import Express to define property-type-related routes
const express = require("express");
// Import controller functions that handle CRUD for property types
const {
  createPropertyType,
  getAllPropertyTypes,
  getPropertyTypeById,
  updatePropertyType,
  deletePropertyType,
} = require("../controllers/propertyTypeController");
// Import auth middleware to secure routes and enforce ADMIN role
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

// Create router instance for property type routes
const router = express.Router();

// GET /api/property-types/ -> get all property types (ADMIN only)
router.get("/", protect, authorizeRoles("ADMIN", "LANDLORD"), getAllPropertyTypes);

// GET /api/property-types/:id -> get a single property type by id (ADMIN only)
router.get("/:id", protect, authorizeRoles("ADMIN"), getPropertyTypeById);

// POST /api/property-types/ -> create a new property type (ADMIN only)
router.post("/", protect, authorizeRoles("ADMIN"), createPropertyType);

// PATCH /api/property-types/:id -> update an existing property type (ADMIN only)
router.patch("/:id", protect, authorizeRoles("ADMIN"), updatePropertyType);

// DELETE /api/property-types/:id -> delete a property type (ADMIN only)
router.delete("/:id", protect, authorizeRoles("ADMIN"), deletePropertyType);

// Export the router so it can be mounted under /api/property-types
module.exports = router;
