// src/controllers/locationController.js
// This controller manages CRUD operations for locations (street, city, coordinates).

// Import Location model for database operations
const Location = require("../models/locationModel");

// Helper function to safely parse a coordinate from string/number to Number
// Throws an error if the value is not a valid number.
const parseCoordinate = (value, label) => {
  // If coordinate is not provided, return undefined (caller can handle)
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  // Convert to number
  const num = Number(value);
  // If NaN or not finite, throw a validation-style error
  if (!Number.isFinite(num)) {
    throw new Error(`${label} must be a valid number`);
  }
  return num;
};

// Create location
// Reads location fields from body, validates, normalizes, and saves a new record.
const createLocation = async (req, res) => {
  try {
    // Destructure fields from the request body
    const {
      street_address,
      area_name,
      city,
      postal_code,
      latitude,
      longitude,
      is_active,
    } = req.body;

    // City is mandatory
    if (!city) {
      return res.status(400).json({
        error: "city is required",
      });
    }

    // Parse latitude and longitude as numbers
    const lat = parseCoordinate(latitude, "Latitude");
    const lon = parseCoordinate(longitude, "Longitude");
    // If either coordinate is missing, reject the request
    if (lat === undefined || lon === undefined) {
      return res.status(400).json({
        error: "latitude and longitude are required",
      });
    }

    // Normalize optional string fields (trim or set to null)
    const normalizedStreet = street_address?.trim?.() || null;
    const normalizedPostal = postal_code?.trim?.() || null;

    // Create new Location document
    const location = await Location.create({
      street_address: normalizedStreet,
      area_name: area_name?.trim?.() ? area_name.trim() : area_name,
      city: city.trim(),
      postal_code: normalizedPostal,
      latitude: lat,
      longitude: lon,
      is_active,
    });

    // Respond with created location
    res.status(201).json({
      message: "Location created successfully",
      location,
    });
  } catch (error) {
    console.error("Error creating location:", error);
    // If parsing of coordinates failed, send 400 with the error message
    if (error.message?.includes("Latitude") || error.message?.includes("Longitude")) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: "Server error" });
  }
};

// Get all locations
// Supports optional inclusion of inactive locations and pagination.
const getAllLocations = async (req, res) => {
  try {
    const includeInactive = req.query.includeInactive === "true";
    // If not including inactive, filter by is_active = true
    const filter = includeInactive ? {} : { is_active: true };

    // Pagination parameters
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const safePage = page < 1 ? 1 : page;
    const safeLimit = limit < 1 ? 10 : limit;
    const skip = (safePage - 1) * safeLimit;

    // Run count and query at the same time
    const [total, locations] = await Promise.all([
      Location.countDocuments(filter),
      Location.find(filter).sort({ created_date: -1 }).skip(skip).limit(safeLimit),
    ]);

    const totalPages = Math.ceil(total / safeLimit) || 1;

    // Return paginated list of locations
    res.status(200).json({
      data: locations,
      page: safePage,
      limit: safeLimit,
      total,
      totalPages,
    });
  } catch (error) {
    console.error("Error fetching locations:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Get single location
// Fetches a specific location by its ID, with optional inactive inclusion.
const getLocationById = async (req, res) => {
  try {
    const includeInactive = req.query.includeInactive === "true";
    // Base filter for specific _id
    const filter = { _id: req.params.id };
    // If not including inactive, require is_active = true
    if (!includeInactive) {
      filter.is_active = true;
    }

    const location = await Location.findOne(filter);
    if (!location) {
      return res.status(404).json({ error: "Location not found" });
    }

    res.status(200).json(location);
  } catch (error) {
    console.error("Error fetching location:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Update location
// Allows updating any subset of fields, with coordinate parsing and validation.
const updateLocation = async (req, res) => {
  try {
    const {
      street_address,
      area_name,
      city,
      postal_code,
      latitude,
      longitude,
      is_active,
    } = req.body;

    // Build an updates object only with fields that are provided
    const updates = {};

    if (street_address !== undefined) {
      const normalizedStreet = street_address?.trim?.() || null;
      updates.street_address = normalizedStreet;
    }
    if (area_name !== undefined) {
      updates.area_name = area_name?.trim?.() ? area_name.trim() : area_name;
    }
    if (city !== undefined) {
      updates.city = city.trim();
    }
    if (postal_code !== undefined) {
      const normalizedPostal = postal_code?.trim?.() || null;
      updates.postal_code = normalizedPostal;
    }
    // Parse and validate coordinates only if provided
    if (latitude !== undefined) updates.latitude = parseCoordinate(latitude, "Latitude");
    if (longitude !== undefined) updates.longitude = parseCoordinate(longitude, "Longitude");
    if (typeof is_active === "boolean") updates.is_active = is_active;

    // Apply the updates and enforce validation rules
    const location = await Location.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!location) {
      return res.status(404).json({ error: "Location not found" });
    }

    res.status(200).json({
      message: "Location updated successfully",
      location,
    });
  } catch (error) {
    console.error("Error updating location:", error);
    // If coordinate parsing failed, send 400
    if (error.message?.includes("Latitude") || error.message?.includes("Longitude")) {
      return res.status(400).json({ error: error.message });
    }
    // Handle mongoose validation errors separately
    if (error.name === "ValidationError") {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: "Server error" });
  }
};

// Soft delete
// Marks a location as inactive instead of removing it from database.
const deleteLocation = async (req, res) => {
  try {
    // Find location by ID
    const location = await Location.findById(req.params.id);

    if (!location) {
      return res.status(404).json({ error: "Location not found" });
    }

    // If already inactive, do not change anything
    if (!location.is_active) {
      return res.status(200).json({ message: "Location already inactive" });
    }

    // Mark location as inactive and save
    location.is_active = false;
    await location.save();

    res.status(200).json({ message: "Location soft-deleted successfully" });
  } catch (error) {
    console.error("Error deleting location:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Export all location-related controller functions
module.exports = {
  createLocation,
  getAllLocations,
  getLocationById,
  updateLocation,
  deleteLocation,
};
