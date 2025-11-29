// Import Express to define routes for booking operations
const express = require("express");
// Import controller functions that handle booking CRUD and queries
const {
  createBooking,
  getAllBookings,
  getBookingById,
  updateBooking,
  deleteBooking,
} = require("../controllers/bookingController");
// Import auth middleware to secure booking routes
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

// Create router instance for booking routes
const router = express.Router();

// GET /api/bookings/ -> get list of bookings
// Any authenticated user can see bookings (you can explain business rule in viva)
router.get("/", protect, getAllBookings);

// GET /api/bookings/:id -> get a single booking by id
router.get("/:id", protect, getBookingById);

// POST /api/bookings/ -> create a new booking
// Only ROOM_SEEKER role can create bookings
router.post("/", protect, authorizeRoles("ROOM_SEEKER"), createBooking);

// PATCH /api/bookings/:id -> update an existing booking
// Only ROOM_SEEKER role can update their bookings
router.patch("/:id", protect, authorizeRoles("ROOM_SEEKER"), updateBooking);

// DELETE /api/bookings/:id -> delete a booking
// Only ROOM_SEEKER role can delete their bookings
router.delete("/:id", protect, authorizeRoles("ROOM_SEEKER"), deleteBooking);

// Export the router so it can be mounted under /api/bookings
module.exports = router;
