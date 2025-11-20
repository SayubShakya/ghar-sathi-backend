const express = require("express");
const {
  createPropertyType,
  getAllPropertyTypes,
  getPropertyTypeById,
  updatePropertyType,
  deletePropertyType,
} = require("../controllers/propertyTypeController");

const router = express.Router();

router.get("/", getAllPropertyTypes);
router.get("/:id", getPropertyTypeById);
router.post("/", createPropertyType);
router.patch("/:id", updatePropertyType);
router.delete("/:id", deletePropertyType);

module.exports = router;
