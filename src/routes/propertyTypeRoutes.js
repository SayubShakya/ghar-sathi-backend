const express = require("express");
const {
  createPropertyType,
  getAllPropertyTypes,
  getPropertyTypeById,
  updatePropertyType,
  deletePropertyType,
} = require("../controllers/propertyTypeController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, authorizeRoles("ADMIN"), getAllPropertyTypes);
router.get("/:id", protect, authorizeRoles("ADMIN"), getPropertyTypeById);
router.post("/", protect, authorizeRoles("ADMIN"), createPropertyType);
router.patch("/:id", protect, authorizeRoles("ADMIN"), updatePropertyType);
router.delete("/:id", protect, authorizeRoles("ADMIN"), deletePropertyType);

module.exports = router;
