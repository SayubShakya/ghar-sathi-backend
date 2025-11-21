const Property = require("../models/propertyModel");
const Location = require("../models/locationModel");
const PropertyType = require("../models/propertyTypeModel");
const User = require("../models/userModel");
const Status = require("../models/statusModel");

const getCurrentUserIdFromReq = (req) => {
  if (!req || !req.user || !req.user._id) {
    return null;
  }
  return req.user._id.toString();
};

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

const findStatusByName = async (name) => {
  const doc = await Status.findOne({ name: new RegExp("^" + name + "$", "i") }).select(
    "_id name"
  );
  if (!doc) {
    const error = new Error("Status '" + name + "' not found. Please seed it first.");
    error.statusCode = 500;
    throw error;
  }
  return doc;
};

const parseNumber = (value, label) => {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  const num = Number(value);
  if (!Number.isFinite(num)) {
    const error = new Error(`${label} must be a valid number`);
    error.statusCode = 400;
    throw error;
  }
  return num;
};

const toRadians = (deg) => (deg * Math.PI) / 180;

const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth radius in km
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
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
      user_id,
      property_types_id,
      is_active,
    } = req.body;

    const isAdmin = req.isAdmin;
    const currentUserId = getCurrentUserIdFromReq(req);
    const ownerId = isAdmin ? (user_id || currentUserId) : currentUserId;

    if (!property_title || !rent || !location_id || !ownerId || !property_types_id) {
      return res.status(400).json({
        error:
          "property_title, rent, location_id, user_id, and property_types_id are required",
      });
    }

    await Promise.all([
      validateObjectId(Location, location_id, "Location"),
      validateObjectId(User, ownerId, "User"),
      validateObjectId(PropertyType, property_types_id, "Property type"),
    ]);

    const availableStatus = await findStatusByName("AVAILABLE");

    const property = await Property.create({
      property_title: property_title.trim(),
      detailed_description: detailed_description?.trim?.()
        ? detailed_description.trim()
        : detailed_description,
      cover_image_url: cover_image_url?.trim?.() ? cover_image_url.trim() : cover_image_url,
      rent,
      location_id,
      status: availableStatus._id,
      user_id: ownerId,
      property_types_id,
      is_active,
    });

    await property.populate([
      { path: "location_id" },
      { path: "user_id", select: "first_name last_name email_address" },
      { path: "property_types_id" },
      { path: "status" },
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

    if (req.isLandlord && !req.isAdmin) {
      const currentUserId = getCurrentUserIdFromReq(req);
      if (!currentUserId) {
        return res.status(401).json({ error: "Not authorized" });
      }
      filter.user_id = currentUserId;
    }

    const minRent = parseNumber(req.query.minRent, "minRent");
    const maxRent = parseNumber(req.query.maxRent, "maxRent");

    if (minRent !== undefined || maxRent !== undefined) {
      filter.rent = {};
      if (minRent !== undefined) filter.rent.$gte = minRent;
      if (maxRent !== undefined) filter.rent.$lte = maxRent;
    }

    if (req.query.propertyTypeId) {
      filter.property_types_id = req.query.propertyTypeId;
    }

    if (req.query.status) {
      const statusDoc = await findStatusByName(req.query.status);
      filter.status = statusDoc._id;
    }

    const sortBy = (req.query.sortBy || "").toLowerCase();
    const sortOrder = (req.query.sortOrder || "desc").toLowerCase();
    const sortDirection = sortOrder === "asc" ? 1 : -1;

    let sort = { created_date: -1 };
    if (sortBy === "price") {
      sort = { rent: sortDirection };
    }

    const properties = await Property.find(filter)
      .populate({ path: "location_id" })
      .populate({ path: "user_id", select: "first_name last_name email_address" })
      .populate({ path: "property_types_id" })
      .populate({ path: "status" })
      .sort(sort);

    let results = properties.map((p) => p.toObject());

    const street = req.query.street?.trim?.();
    const area = req.query.area?.trim?.();
    const city = req.query.city?.trim?.();
    const postalCode = req.query.postalCode?.trim?.();

    if (street) {
      const streetLower = street.toLowerCase();
      results = results.filter((p) => {
        const loc = p.location_id;
        return (
          loc &&
          typeof loc.street_address === "string" &&
          loc.street_address.toLowerCase().includes(streetLower)
        );
      });
    }

    if (area) {
      const areaLower = area.toLowerCase();
      results = results.filter((p) => {
        const loc = p.location_id;
        return (
          loc &&
          typeof loc.area_name === "string" &&
          loc.area_name.toLowerCase().includes(areaLower)
        );
      });
    }

    if (city) {
      const cityLower = city.toLowerCase();
      results = results.filter((p) => {
        const loc = p.location_id;
        return (
          loc && typeof loc.city === "string" && loc.city.toLowerCase() === cityLower
        );
      });
    }

    if (postalCode) {
      const postalLower = postalCode.toLowerCase();
      results = results.filter((p) => {
        const loc = p.location_id;
        return (
          loc &&
          typeof loc.postal_code === "string" &&
          loc.postal_code.toLowerCase() === postalLower
        );
      });
    }

    const minLat = parseNumber(req.query.minLat, "minLat");
    const maxLat = parseNumber(req.query.maxLat, "maxLat");
    const minLon = parseNumber(req.query.minLon, "minLon");
    const maxLon = parseNumber(req.query.maxLon, "maxLon");

    if (
      minLat !== undefined ||
      maxLat !== undefined ||
      minLon !== undefined ||
      maxLon !== undefined
    ) {
      results = results.filter((p) => {
        const loc = p.location_id;
        if (!loc) return false;
        const { latitude, longitude } = loc;
        if (latitude === undefined || longitude === undefined) return false;
        if (minLat !== undefined && latitude < minLat) return false;
        if (maxLat !== undefined && latitude > maxLat) return false;
        if (minLon !== undefined && longitude < minLon) return false;
        if (maxLon !== undefined && longitude > maxLon) return false;
        return true;
      });
    }

    const centerLat = parseNumber(req.query.centerLat, "centerLat");
    const centerLon = parseNumber(req.query.centerLon, "centerLon");
    const radiusKm = parseNumber(req.query.radiusKm, "radiusKm");

    if (centerLat !== undefined && centerLon !== undefined) {
      results = results
        .map((p) => {
          const loc = p.location_id;
          if (!loc || loc.latitude === undefined || loc.longitude === undefined) {
            return p;
          }
          const distanceKm = calculateDistanceKm(
            centerLat,
            centerLon,
            loc.latitude,
            loc.longitude
          );
          return { ...p, distance_km: distanceKm };
        })
        .filter((p) => {
          if (radiusKm === undefined || p.distance_km === undefined) return true;
          return p.distance_km <= radiusKm;
        });

      if (sortBy === "distance") {
        results.sort((a, b) => {
          const aDist = a.distance_km ?? Number.POSITIVE_INFINITY;
          const bDist = b.distance_km ?? Number.POSITIVE_INFINITY;
          if (aDist === bDist) return 0;
          return aDist < bDist ? sortDirection * -1 : sortDirection;
        });
      }
    }

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const safePage = page < 1 ? 1 : page;
    const safeLimit = limit < 1 ? 10 : limit;
    const total = results.length;
    const totalPages = Math.ceil(total / safeLimit) || 1;
    const startIndex = (safePage - 1) * safeLimit;
    const paginatedResults = results.slice(startIndex, startIndex + safeLimit);

    res.status(200).json({
      data: paginatedResults,
      page: safePage,
      limit: safeLimit,
      total,
      totalPages,
    });
  } catch (error) {
    console.error("Error fetching properties:", error);
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    res.status(500).json({ error: "Server error" });
  }
};

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
      .populate({ path: "property_types_id" })
      .populate({ path: "status" });

    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }

    if (req.isLandlord && !req.isAdmin) {
      const currentUserId = getCurrentUserIdFromReq(req);
      if (!currentUserId) {
        return res.status(401).json({ error: "Not authorized" });
      }
      const ownerId =
        property.user_id && property.user_id._id
          ? property.user_id._id.toString()
          : property.user_id?.toString?.();
      if (!ownerId || ownerId !== currentUserId) {
        return res
          .status(403)
          .json({ error: "You are not allowed to access this property" });
      }
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
      user_id,
      property_types_id,
      is_active,
    } = req.body;

    const existingProperty = await Property.findById(req.params.id);

    if (!existingProperty) {
      return res.status(404).json({ error: "Property not found" });
    }

    if (!req.isAdmin) {
      const currentUserId = getCurrentUserIdFromReq(req);
      if (!currentUserId) {
        return res.status(401).json({ error: "Not authorized" });
      }
      const ownerId =
        existingProperty.user_id && existingProperty.user_id._id
          ? existingProperty.user_id._id.toString()
          : existingProperty.user_id?.toString?.();
      if (!ownerId || ownerId !== currentUserId) {
        return res
          .status(403)
          .json({ error: "You are not allowed to modify this property" });
      }
    }

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
    if (typeof is_active === "boolean") updates.is_active = is_active;

    const validationPromises = [];
    if (location_id) {
      validationPromises.push(validateObjectId(Location, location_id, "Location"));
      updates.location_id = location_id;
    }
    if (user_id && req.isAdmin) {
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
      .populate({ path: "property_types_id" })
      .populate({ path: "status" });

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

    if (!req.isAdmin) {
      const currentUserId = getCurrentUserIdFromReq(req);
      if (!currentUserId) {
        return res.status(401).json({ error: "Not authorized" });
      }
      const ownerId =
        property.user_id && property.user_id._id
          ? property.user_id._id.toString()
          : property.user_id?.toString?.();
      if (!ownerId || ownerId !== currentUserId) {
        return res
          .status(403)
          .json({ error: "You are not allowed to delete this property" });
      }
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