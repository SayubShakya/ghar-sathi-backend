const express = require("express");
const { 
  register, 
  login, 
  getAllUsers, 
  getUserById, 
  updateUser, 
  deleteUser 
} = require("../controllers/authController");

const router = express.Router();

// Public routes
router.post("/register", register);
router.post("/login", login);

// Protected routes
router.get("/users", getAllUsers);
router.get("/users/:id", getUserById);
router.patch("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);

module.exports = router;