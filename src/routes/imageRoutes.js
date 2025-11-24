const express = require("express");
const multer = require("multer");
const path = require("path");
const { uploadImage, getImageById } = require("../controllers/imageController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

const router = express.Router();

const uploadDir = path.join(__dirname, "..", "..", "uploads");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

const upload = multer({ storage });

router.post(
  "/upload-image",
  protect,
  authorizeRoles("LANDLORD"),
  upload.single("image"),
  uploadImage
);

// Get image metadata + URL by id
router.get("/:id", protect, getImageById);

module.exports = router;
