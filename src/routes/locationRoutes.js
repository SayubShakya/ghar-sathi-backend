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

router.get("/", protect, authorizeRoles("ADMIN"), getAllLocations);
router.get("/:id", protect, authorizeRoles("ADMIN"), getLocationById);
router.post("/", protect, authorizeRoles("ADMIN"), createLocation);
router.patch("/:id", protect, authorizeRoles("ADMIN"), updateLocation);
router.delete("/:id", protect, authorizeRoles("ADMIN"), deleteLocation);

module.exports = router;
