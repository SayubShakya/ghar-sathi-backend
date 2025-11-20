const express = require("express");
const { 
  getAllUsers, 
  getUserById, 
  updateUser, 
  deleteUser 
} = require("../controllers/userController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

const router = express.Router();

// User routes
router.get("/", protect, authorizeRoles("ADMIN"), getAllUsers);
router.get("/:id", protect, authorizeRoles("ADMIN"), getUserById);
router.patch("/:id", protect, authorizeRoles("ADMIN"), updateUser);
router.delete("/:id", protect, authorizeRoles("ADMIN"), deleteUser);

module.exports = router;
