const express = require("express");
const {
  createProperty,
  getAllProperties,
  getPropertyById,
  updateProperty,
  deleteProperty,
} = require("../controllers/propertyController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, getAllProperties);
router.get("/:id", protect, getPropertyById);
router.post("/", protect, authorizeRoles("LANDLORD"), createProperty);
router.patch("/:id", protect, authorizeRoles("LANDLORD"), updateProperty);
router.delete("/:id", protect, authorizeRoles("LANDLORD"), deleteProperty);

module.exports = router;
