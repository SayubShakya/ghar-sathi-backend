const { ImageModel } = require("../models/imageModel");

const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Image file is required" });
    }

    const { path, filename } = req.file;

    const image = await ImageModel.create({ path, filename });

    return res.status(201).json({
      message: "Image uploaded successfully",
      image_id: image.id,
      image,
    });
  } catch (error) {
    console.error("Error uploading image:", error);
    return res.status(500).json({ error: "Unable to upload image" });
  }
};

const getImageById = async (req, res) => {
  try {
    const { id } = req.params;

    const image = await ImageModel.findById(id);
    if (!image || image.is_active === false) {
      return res.status(404).json({ error: "Image not found" });
    }

    const filename = image.filename;
    const url = filename ? `/uploads/${filename}` : null;

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

module.exports = {
  uploadImage,
  getImageById,
};
