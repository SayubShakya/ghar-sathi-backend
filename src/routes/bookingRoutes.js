const express = require("express");
const {
  createBooking,
  getAllBookings,
  getBookingById,
  updateBooking,
  deleteBooking,
} = require("../controllers/bookingController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, getAllBookings);
router.get("/:id", protect, getBookingById);
router.post("/", protect, authorizeRoles("ROOM_SEEKER"), createBooking);
router.patch("/:id", protect, authorizeRoles("ROOM_SEEKER"), updateBooking);
router.delete("/:id", protect, authorizeRoles("ROOM_SEEKER"), deleteBooking);

module.exports = router;
