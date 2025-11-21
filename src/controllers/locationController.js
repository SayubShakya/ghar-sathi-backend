const Location = require("../models/locationModel");

const parseCoordinate = (value, label) => {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  const num = Number(value);
  if (!Number.isFinite(num)) {
    throw new Error(`${label} must be a valid number`);
  }
  return num;
};

// Create location
const createLocation = async (req, res) => {
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

    if (!street_address || !city) {
      return res.status(400).json({
        error: "street_address and city are required",
      });
    }

    const lat = parseCoordinate(latitude, "Latitude");
    const lon = parseCoordinate(longitude, "Longitude");
    if (lat === undefined || lon === undefined) {
      return res.status(400).json({
        error: "latitude and longitude are required",
      });
    }

    const location = await Location.create({
      street_address: street_address.trim(),
      area_name: area_name?.trim?.() ? area_name.trim() : area_name,
      city: city.trim(),
      postal_code: postal_code?.trim?.() ? postal_code.trim() : postal_code,
      latitude: lat,
      longitude: lon,
      is_active,
    });

    res.status(201).json({
      message: "Location created successfully",
      location,
    });
  } catch (error) {
    console.error("Error creating location:", error);
    if (error.message?.includes("Latitude") || error.message?.includes("Longitude")) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: "Server error" });
  }
};

// Get all locations
const getAllLocations = async (req, res) => {
  try {
    const includeInactive = req.query.includeInactive === "true";
    const filter = includeInactive ? {} : { is_active: true };
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const safePage = page < 1 ? 1 : page;
    const safeLimit = limit < 1 ? 10 : limit;
    const skip = (safePage - 1) * safeLimit;

    const [total, locations] = await Promise.all([
      Location.countDocuments(filter),
      Location.find(filter).sort({ created_date: -1 }).skip(skip).limit(safeLimit),
    ]);

    const totalPages = Math.ceil(total / safeLimit) || 1;

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
const getLocationById = async (req, res) => {
  try {
    const includeInactive = req.query.includeInactive === "true";
    const filter = { _id: req.params.id };
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

    const updates = {};

    if (street_address) updates.street_address = street_address.trim();
    if (area_name !== undefined) {
      updates.area_name = area_name?.trim?.() ? area_name.trim() : area_name;
    }
    if (city) updates.city = city.trim();
    if (postal_code !== undefined) {
      updates.postal_code = postal_code?.trim?.() ? postal_code.trim() : postal_code;
    }
    if (latitude !== undefined) updates.latitude = parseCoordinate(latitude, "Latitude");
    if (longitude !== undefined) updates.longitude = parseCoordinate(longitude, "Longitude");
    if (typeof is_active === "boolean") updates.is_active = is_active;

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
    if (error.message?.includes("Latitude") || error.message?.includes("Longitude")) {
      return res.status(400).json({ error: error.message });
    }
    if (error.name === "ValidationError") {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: "Server error" });
  }
};

// Soft delete
const deleteLocation = async (req, res) => {
  try {
    const location = await Location.findById(req.params.id);

    if (!location) {
      return res.status(404).json({ error: "Location not found" });
    }

    if (!location.is_active) {
      return res.status(200).json({ message: "Location already inactive" });
    }

    location.is_active = false;
    await location.save();

    res.status(200).json({ message: "Location soft-deleted successfully" });
  } catch (error) {
    console.error("Error deleting location:", error);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = {
  createLocation,
  getAllLocations,
  getLocationById,
  updateLocation,
  deleteLocation,
};
