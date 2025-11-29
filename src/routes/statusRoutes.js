// Import Express to define routes for property/booking statuses
const express = require("express");
// Import controller functions that handle status CRUD operations
const {
  createStatus,
  getAllStatuses,
  getStatusById,
  updateStatus,
  deleteStatus,
} = require("../controllers/statusController");
// Import auth middleware to secure status routes for ADMIN only
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

// Create router instance for status routes
const router = express.Router();

// GET /api/statuses/ -> get all statuses (ADMIN only)
router.get("/", protect, authorizeRoles("ADMIN"), getAllStatuses);

// GET /api/statuses/:id -> get a single status by id (ADMIN only)
router.get("/:id", protect, authorizeRoles("ADMIN"), getStatusById);

// POST /api/statuses/ -> create a new status (ADMIN only)
router.post("/", protect, authorizeRoles("ADMIN"), createStatus);

// PATCH /api/statuses/:id -> update an existing status (ADMIN only)
router.patch("/:id", protect, authorizeRoles("ADMIN"), updateStatus);

// DELETE /api/statuses/:id -> delete a status (ADMIN only)
router.delete("/:id", protect, authorizeRoles("ADMIN"), deleteStatus);

// Export the router so it can be mounted under /api/statuses
module.exports = router;
