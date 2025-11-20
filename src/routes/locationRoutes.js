const express = require("express");
const {
  createLocation,
  getAllLocations,
  getLocationById,
  updateLocation,
  deleteLocation,
} = require("../controllers/locationController");

const router = express.Router();

router.get("/", getAllLocations);
router.get("/:id", getLocationById);
router.post("/", createLocation);
router.patch("/:id", updateLocation);
router.delete("/:id", deleteLocation);

module.exports = router;
