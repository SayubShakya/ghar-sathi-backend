const express = require("express");
const {
  createLocation,
  getAllLocations,
  getLocationById,
  updateLocation,
  deleteLocation,
} = require("../controllers/locationController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, authorizeRoles("ADMIN", "LANDLORD"), getAllLocations);
router.get("/:id", protect, authorizeRoles("ADMIN", "LANDLORD"), getLocationById);
router.post("/", protect, authorizeRoles("ADMIN", "LANDLORD"), createLocation);
router.patch("/:id", protect, authorizeRoles("ADMIN", "LANDLORD"), updateLocation);
router.delete("/:id", protect, authorizeRoles("ADMIN", "LANDLORD"), deleteLocation);

module.exports = router;
