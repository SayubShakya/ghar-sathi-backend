const PropertyType = require("../models/propertyTypeModel");

// Create property type
const createPropertyType = async (req, res) => {
  try {
    const { name, is_active } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Property type name is required" });
    }

    const propertyType = await PropertyType.create({
      name: name.trim(),
      is_active,
    });

    res.status(201).json({
      message: "Property type created successfully",
      propertyType,
    });
  } catch (error) {
    console.error("Error creating property type:", error);
    if (error.code === 11000) {
      return res.status(400).json({ error: "Property type name must be unique" });
    }
    res.status(500).json({ error: "Server error" });
  }
};

// Get all property types
const getAllPropertyTypes = async (req, res) => {
  try {
    const includeInactive = req.query.includeInactive === "true";
    const filter = includeInactive ? {} : { is_active: true };

    const propertyTypes = await PropertyType.find(filter).sort({ created_date: -1 });
    res.status(200).json(propertyTypes);
  } catch (error) {
    console.error("Error fetching property types:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Get property type by ID
const getPropertyTypeById = async (req, res) => {
  try {
    const includeInactive = req.query.includeInactive === "true";
    const filter = { _id: req.params.id };
    if (!includeInactive) {
      filter.is_active = true;
    }

    const propertyType = await PropertyType.findOne(filter);
    if (!propertyType) {
      return res.status(404).json({ error: "Property type not found" });
    }

    res.status(200).json(propertyType);
  } catch (error) {
    console.error("Error fetching property type:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Update property type
const updatePropertyType = async (req, res) => {
  try {
    const { name, is_active } = req.body;
    const updates = {};

    if (name) updates.name = name.trim();
    if (typeof is_active === "boolean") updates.is_active = is_active;

    const propertyType = await PropertyType.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!propertyType) {
      return res.status(404).json({ error: "Property type not found" });
    }

    res.status(200).json({
      message: "Property type updated successfully",
      propertyType,
    });
  } catch (error) {
    console.error("Error updating property type:", error);
    if (error.code === 11000) {
      return res.status(400).json({ error: "Property type name must be unique" });
    }
    if (error.name === "ValidationError") {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: "Server error" });
  }
};

// Soft delete property type
const deletePropertyType = async (req, res) => {
  try {
    const propertyType = await PropertyType.findById(req.params.id);

    if (!propertyType) {
      return res.status(404).json({ error: "Property type not found" });
    }

    if (!propertyType.is_active) {
      return res.status(200).json({ message: "Property type already inactive" });
    }

    propertyType.is_active = false;
    await propertyType.save();

    res.status(200).json({ message: "Property type soft-deleted successfully" });
  } catch (error) {
    console.error("Error deleting property type:", error);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = {
  createPropertyType,
  getAllPropertyTypes,
  getPropertyTypeById,
  updatePropertyType,
  deletePropertyType,
};
