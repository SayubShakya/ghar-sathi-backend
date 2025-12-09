// src/controllers/imageController.js
// This controller handles saving uploaded image metadata and fetching it by ID.

// Import ImageModel to interact with the images collection
const { ImageModel } = require("../models/imageModel");

// Upload image controller
// Assumes that Multer middleware has already processed the file and attached it to req.file
const uploadImage = async (req, res) => {
  try {
    // If Multer did not receive a file, return a 400 error
    const file = req.file || (Array.isArray(req.files) && req.files[0]);
    if (!file) {
      return res.status(400).json({ error: "Image file is required" });
    }

    // Extract path and filename from the uploaded file object
    const { path, filename } = file;

    // Save a new image document in MongoDB with path and filename
    const image = await ImageModel.create({ path, filename });

    // Return success response with the stored image record
    return res.status(201).json({
      message: "Image uploaded successfully",
      image_id: image.id,
      image,
    });
  } catch (error) {
    // On error, log and return a generic error message
    console.error("Error uploading image:", error);
    return res.status(500).json({ error: "Unable to upload image" });
  }
};

// Get image details by ID
// This does not send the actual file, only metadata and a URL to access it.
const getImageById = async (req, res) => {
  try {
    // Read id parameter from the URL
    const { id } = req.params;

    // Find image document in the database
    const image = await ImageModel.findById(id);
    // If not found or marked inactive, respond with 404
    if (!image || image.is_active === false) {
      return res.status(404).json({ error: "Image not found" });
    }

    // Build a URL for the file based on its filename and public uploads path
    const filename = image.filename;
    const url = filename ? `/uploads/${filename}` : null;

    // Return image metadata and URL
    return res.status(200).json({
      id: image.id,
      path: image.path,
      filename,
      url,
      is_active: image.is_active,
      created_date: image.created_date,
      updated_date: image.updated_date,
    });
  } catch (error) {
    console.error("Error fetching image:", error);
    return res.status(500).json({ error: "Unable to fetch image" });
  }
};

// Export image-related controller functions
module.exports = {
  uploadImage,
  getImageById,
};
