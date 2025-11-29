// Import Express to define routes for property operations
const express = require("express");
// Import controller functions that handle property CRUD and queries
const {
  createProperty,
  getAllProperties,
  getPropertyById,
  updateProperty,
  deleteProperty,
} = require("../controllers/propertyController");
// Import auth middleware to secure property routes
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

// Create router instance for property routes
const router = express.Router();

// GET /api/properties/ -> get list of properties (with filters and pagination)
// Any authenticated user can view properties
router.get("/", protect, getAllProperties);

// GET /api/properties/:id -> get details of a single property by id
// Any authenticated user can view a specific property
router.get("/:id", protect, getPropertyById);

// POST /api/properties/ -> create a new property
// Only LANDLORD role (or admin through controller checks) can create properties
router.post("/", protect, authorizeRoles("LANDLORD"), createProperty);

// PATCH /api/properties/:id -> update an existing property
// Only LANDLORD role (and owner/admin logic in controller) can update
router.patch("/:id", protect, authorizeRoles("LANDLORD"), updateProperty);

// DELETE /api/properties/:id -> soft delete a property
// Only LANDLORD role (and owner/admin logic in controller) can delete
router.delete("/:id", protect, authorizeRoles("LANDLORD"), deleteProperty);

// Export the router so it can be mounted under /api/properties
module.exports = router;
