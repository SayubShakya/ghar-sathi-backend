const express = require("express");
const {
  createRole,
  getAllRoles,
  getRoleById,
  updateRole,
  deleteRole,
} = require("../controllers/roleController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, authorizeRoles("ADMIN"), getAllRoles);
router.get("/:id", protect, authorizeRoles("ADMIN"), getRoleById);
router.post("/", protect, authorizeRoles("ADMIN"), createRole);
router.patch("/:id", protect, authorizeRoles("ADMIN"), updateRole);
router.delete("/:id", protect, authorizeRoles("ADMIN"), deleteRole);

module.exports = router;
