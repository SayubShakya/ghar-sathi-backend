const express = require("express");
const { 
  getAllUsers, 
  getUserById, 
  updateUser, 
  deleteUser 
} = require("../controllers/userController");

const router = express.Router();

// User routes
router.get("/", getAllUsers);
router.get("/:id", getUserById);
router.patch("/:id", updateUser);
router.delete("/:id", deleteUser);

module.exports = router;
