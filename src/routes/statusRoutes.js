const express = require("express");
const {
  createStatus,
  getAllStatuses,
  getStatusById,
  updateStatus,
  deleteStatus,
} = require("../controllers/statusController");

const router = express.Router();

router.get("/", getAllStatuses);
router.get("/:id", getStatusById);
router.post("/", createStatus);
router.patch("/:id", updateStatus);
router.delete("/:id", deleteStatus);

module.exports = router;
