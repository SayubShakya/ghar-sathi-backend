// Import Express to define location-related routes
const express = require("express");
// Import controller functions for handling location CRUD operations
const {
  createLocation,
  getAllLocations,
  getLocationById,
  updateLocation,
  deleteLocation,
} = require("../controllers/locationController");
// Import auth middleware to protect routes and check roles
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

// Create router instance for locations
const router = express.Router();

// GET /api/locations/ -> get all locations
// Only ADMIN and LANDLORD roles can access
router.get("/", protect, authorizeRoles("ADMIN", "LANDLORD"), getAllLocations);

// GET /api/locations/:id -> get a single location by id
// Only ADMIN and LANDLORD roles can access
router.get("/:id", protect, authorizeRoles("ADMIN", "LANDLORD"), getLocationById);

// POST /api/locations/ -> create a new location
// Only ADMIN and LANDLORD roles can create locations
router.post("/", protect, authorizeRoles("ADMIN", "LANDLORD"), createLocation);

// PATCH /api/locations/:id -> update an existing location
// Only ADMIN and LANDLORD roles can update locations
router.patch("/:id", protect, authorizeRoles("ADMIN", "LANDLORD"), updateLocation);

// DELETE /api/locations/:id -> delete a location
// Only ADMIN and LANDLORD roles can delete locations
router.delete("/:id", protect, authorizeRoles("ADMIN", "LANDLORD"), deleteLocation);

// Export the router so it can be mounted under /api/locations
module.exports = router;
