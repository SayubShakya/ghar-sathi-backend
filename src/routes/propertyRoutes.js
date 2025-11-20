const express = require("express");
const {
  createProperty,
  getAllProperties,
  getPropertyById,
  updateProperty,
  deleteProperty,
} = require("../controllers/propertyController");

const router = express.Router();

router.get("/", getAllProperties);
router.get("/:id", getPropertyById);
router.post("/", createProperty);
router.patch("/:id", updateProperty);
router.delete("/:id", deleteProperty);

module.exports = router;
