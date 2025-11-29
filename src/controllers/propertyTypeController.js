// src/controllers/propertyTypeController.js
// This controller manages CRUD operations for property types (e.g., ROOM, FLAT).

// Import PropertyType model for database operations
const PropertyType = require("../models/propertyTypeModel");

// Create property type
// Reads name and is_active from the body, validates, and saves a new record.
const createPropertyType = async (req, res) => {
  try {
    const { name, is_active } = req.body;

    // Name is required and must not be just spaces
    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Property type name is required" });
    }

    // Create new PropertyType document
    const propertyType = await PropertyType.create({
      name: name.trim(),
      is_active,
    });

    // Respond with the created property type
    res.status(201).json({
      message: "Property type created successfully",
      propertyType,
    });
  } catch (error) {
    console.error("Error creating property type:", error);
    // Handle duplicate key error for unique name
    if (error.code === 11000) {
      return res.status(400).json({ error: "Property type name must be unique" });
    }
    res.status(500).json({ error: "Server error" });
  }
};

// Get all property types
// Supports pagination and optional inclusion of inactive records.
const getAllPropertyTypes = async (req, res) => {
  try {
    const includeInactive = req.query.includeInactive === "true";
    // Filter only active records unless explicitly including inactive
    const filter = includeInactive ? {} : { is_active: true };
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const safePage = page < 1 ? 1 : page;
    const safeLimit = limit < 1 ? 10 : limit;
    const skip = (safePage - 1) * safeLimit;

    // Count total and fetch a page of property types in parallel
    const [total, propertyTypes] = await Promise.all([
      PropertyType.countDocuments(filter),
      PropertyType.find(filter).sort({ created_date: -1 }).skip(skip).limit(safeLimit),
    ]);

    const totalPages = Math.ceil(total / safeLimit) || 1;

    // Respond with paginated property types
    res.status(200).json({
      data: propertyTypes,
      page: safePage,
      limit: safeLimit,
      total,
      totalPages,
    });
  } catch (error) {
    console.error("Error fetching property types:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Get property type by ID
// Returns a single property type, optionally including inactive ones.
const getPropertyTypeById = async (req, res) => {
  try {
    const includeInactive = req.query.includeInactive === "true";
    const filter = { _id: req.params.id };
    // If not including inactive, require is_active = true
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
// Allows changing the name and active status of a property type.
const updatePropertyType = async (req, res) => {
  try {
    const { name, is_active } = req.body;
    const updates = {};

    // Only update fields if they are provided
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
    // Handle duplicate name conflict
    if (error.code === 11000) {
      return res.status(400).json({ error: "Property type name must be unique" });
    }
    // Handle mongoose validation errors
    if (error.name === "ValidationError") {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: "Server error" });
  }
};

// Soft delete property type
// Marks a property type as inactive instead of removing it from database.
const deletePropertyType = async (req, res) => {
  try {
    const propertyType = await PropertyType.findById(req.params.id);

    if (!propertyType) {
      return res.status(404).json({ error: "Property type not found" });
    }

    // If already inactive, just return a message
    if (!propertyType.is_active) {
      return res.status(200).json({ message: "Property type already inactive" });
    }

    // Mark as inactive and save
    propertyType.is_active = false;
    await propertyType.save();

    res.status(200).json({ message: "Property type soft-deleted successfully" });
  } catch (error) {
    console.error("Error deleting property type:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Export all property-type related controller functions
module.exports = {
  createPropertyType,
  getAllPropertyTypes,
  getPropertyTypeById,
  updatePropertyType,
  deletePropertyType,
};
