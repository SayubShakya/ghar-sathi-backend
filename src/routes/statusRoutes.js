const express = require("express");
const {
  createStatus,
  getAllStatuses,
  getStatusById,
  updateStatus,
  deleteStatus,
} = require("../controllers/statusController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, authorizeRoles("ADMIN"), getAllStatuses);
router.get("/:id", protect, authorizeRoles("ADMIN"), getStatusById);
router.post("/", protect, authorizeRoles("ADMIN"), createStatus);
router.patch("/:id", protect, authorizeRoles("ADMIN"), updateStatus);
router.delete("/:id", protect, authorizeRoles("ADMIN"), deleteStatus);

module.exports = router;
