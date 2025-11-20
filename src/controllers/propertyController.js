const Property = require("../models/propertyModel");
const Location = require("../models/locationModel");
const PropertyType = require("../models/propertyTypeModel");
const User = require("../models/userModel");

const validateObjectId = async (Model, id, label) => {
  if (!id) {
    throw new Error(`${label} is required`);
  }

  const exists = await Model.exists({ _id: id });
  if (!exists) {
    const error = new Error(`${label} not found`);
    error.statusCode = 404;
    throw error;
  }
};

// Create property
const createProperty = async (req, res) => {
  try {
    const {
      property_title,
      detailed_description,
      cover_image_url,
      rent,
      location_id,
      status,
      user_id,
      property_types_id,
      is_active,
    } = req.body;

    if (!property_title || !rent || !location_id || !user_id || !property_types_id) {
      return res.status(400).json({
        error: "property_title, rent, location_id, user_id, and property_types_id are required",
      });
    }

    await Promise.all([
      validateObjectId(Location, location_id, "Location"),
      validateObjectId(User, user_id, "User"),
      validateObjectId(PropertyType, property_types_id, "Property type"),
    ]);

    const property = await Property.create({
      property_title: property_title.trim(),
      detailed_description: detailed_description?.trim?.()
        ? detailed_description.trim()
        : detailed_description,
      cover_image_url: cover_image_url?.trim?.() ? cover_image_url.trim() : cover_image_url,
      rent,
      location_id,
      status: status?.trim?.() ? status.trim() : undefined,
      user_id,
      property_types_id,
      is_active,
    });

    await property.populate([
      { path: "location_id" },
      { path: "user_id", select: "first_name last_name email_address" },
      { path: "property_types_id" },
    ]);

    res.status(201).json({
      message: "Property created successfully",
      property,
    });
  } catch (error) {
    console.error("Error creating property:", error);
    if (!error.statusCode) {
      if (error.name === "ValidationError") {
        return res.status(400).json({ error: error.message });
      }
      if (error.message?.includes("required")) {
        return res.status(400).json({ error: error.message });
      }
      error.statusCode = 500;
    }
    return res
      .status(error.statusCode)
      .json({ error: error.message || "Server error" });
  }
};

// Get all properties
const getAllProperties = async (req, res) => {
  try {
    const includeInactive = req.query.includeInactive === "true";
    const filter = includeInactive ? {} : { is_active: true };

    const properties = await Property.find(filter)
      .populate({ path: "location_id" })
      .populate({ path: "user_id", select: "first_name last_name email_address" })
      .populate({ path: "property_types_id" })
      .sort({ created_date: -1 });

    res.status(200).json(properties);
  } catch (error) {
    console.error("Error fetching properties:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Get property by ID
const getPropertyById = async (req, res) => {
  try {
    const includeInactive = req.query.includeInactive === "true";
    const filter = { _id: req.params.id };
    if (!includeInactive) {
      filter.is_active = true;
    }

    const property = await Property.findOne(filter)
      .populate({ path: "location_id" })
      .populate({ path: "user_id", select: "first_name last_name email_address" })
      .populate({ path: "property_types_id" });

    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }

    res.status(200).json(property);
  } catch (error) {
    console.error("Error fetching property:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Update property
const updateProperty = async (req, res) => {
  try {
    const {
      property_title,
      detailed_description,
      cover_image_url,
      rent,
      location_id,
      status,
      user_id,
      property_types_id,
      is_active,
    } = req.body;

    const updates = {};

    if (property_title) updates.property_title = property_title.trim();
    if (detailed_description !== undefined) {
      updates.detailed_description = detailed_description?.trim?.()
        ? detailed_description.trim()
        : detailed_description;
    }
    if (cover_image_url !== undefined) {
      updates.cover_image_url = cover_image_url?.trim?.() ? cover_image_url.trim() : cover_image_url;
    }
    if (rent !== undefined) updates.rent = rent;
    if (status !== undefined) updates.status = status?.trim?.() ? status.trim() : status;
    if (typeof is_active === "boolean") updates.is_active = is_active;

    const validationPromises = [];
    if (location_id) {
      validationPromises.push(validateObjectId(Location, location_id, "Location"));
      updates.location_id = location_id;
    }
    if (user_id) {
      validationPromises.push(validateObjectId(User, user_id, "User"));
      updates.user_id = user_id;
    }
    if (property_types_id) {
      validationPromises.push(
        validateObjectId(PropertyType, property_types_id, "Property type")
      );
      updates.property_types_id = property_types_id;
    }

    await Promise.all(validationPromises);

    const property = await Property.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    )
      .populate({ path: "location_id" })
      .populate({ path: "user_id", select: "first_name last_name email_address" })
      .populate({ path: "property_types_id" });

    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }

    res.status(200).json({
      message: "Property updated successfully",
      property,
    });
  } catch (error) {
    console.error("Error updating property:", error);
    if (error.name === "ValidationError") {
      return res.status(400).json({ error: error.message });
    }
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    res.status(error.statusCode).json({ error: error.message || "Server error" });
  }
};

// Soft delete property
const deleteProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }

    if (!property.is_active) {
      return res.status(200).json({ message: "Property already inactive" });
    }

    property.is_active = false;
    await property.save();

    res.status(200).json({ message: "Property soft-deleted successfully" });
  } catch (error) {
    console.error("Error deleting property:", error);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = {
  createProperty,
  getAllProperties,
  getPropertyById,
  updateProperty,
  deleteProperty,
};
