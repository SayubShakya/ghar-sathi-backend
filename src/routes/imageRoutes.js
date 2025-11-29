// Import Express to define routes for image upload and retrieval
const express = require("express");
// Import multer to handle multipart/form-data file uploads
const multer = require("multer");
// Import path to safely build filesystem paths
const path = require("path");
// Import controller functions for handling image upload and retrieval
const { uploadImage, getImageById } = require("../controllers/imageController");
// Import auth middleware to secure routes
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

// Create router instance for image routes
const router = express.Router();

// Directory where uploaded image files will be stored
const uploadDir = path.join(__dirname, "..", "..", "uploads");

// Configure multer disk storage for uploaded files
const storage = multer.diskStorage({
  // Set destination folder for uploaded files
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  // Control how the uploaded file will be named on disk
  filename: function (req, file, cb) {
    // Create a unique suffix using current timestamp and random number
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    // Final file name format: <uniqueSuffix>-<originalName>
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

// Create a multer instance using the defined storage configuration
const upload = multer({ storage });

// POST /api/images/upload-image -> upload a new image file
// Only LANDLORD role can upload images
// upload.single("image") -> expects a single file field named "image" in the form-data
router.post(
  "/upload-image",
  protect,
  authorizeRoles("LANDLORD"),
  upload.single("image"),
  uploadImage
);

// GET /api/images/:id -> get image metadata + URL by database id
router.get("/:id", protect, getImageById);

// Export the router so it can be mounted under /api/images
module.exports = router;
