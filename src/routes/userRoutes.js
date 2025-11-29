const express = require("express");
const { 
  getAllUsers, 
  getUserById, 
  updateUser, 
  deleteUser 
} = require("../controllers/userController");
const { protect, authorizeRoles, allowSelfOrRoles } = require("../middleware/authMiddleware");

const router = express.Router();

// User routes
router.get("/", protect, authorizeRoles("ADMIN"), getAllUsers);
router.get("/:id", protect, allowSelfOrRoles("ADMIN", "LANDLORD", "ROOM_SEEKER"), getUserById);
router.patch("/:id", protect, allowSelfOrRoles("ADMIN", "LANDLORD", "ROOM_SEEKER"), updateUser);
router.delete("/:id", protect, authorizeRoles("ADMIN"), deleteUser);

module.exports = router;
