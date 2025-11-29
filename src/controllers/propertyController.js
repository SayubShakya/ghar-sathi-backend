// Import required models and DTOs
const Property = require("../models/propertyModel"); // Property model
const Location = require("../models/locationModel"); // Location model
const PropertyType = require("../models/propertyTypeModel"); // Property type model
const User = require("../models/userModel"); // User model
const Status = require("../models/statusModel"); // Status model
const { ImageModel } = require("../models/imageModel"); // Image model

// Import Data Transfer Object for property response
const { PropertyResponseDTO } = require("../dto/propertyDto");

// Helper function to extract current user ID from request
function getCurrentUserIdFromReq(req) {
  // Check if request, user, and user ID exist
  if (!req || !req.user || !req.user._id) {
    return null; // Return null if any is missing
  }
  return req.user._id.toString(); // Convert ObjectId to string and return
}

// Helper function to validate if an ID exists in database
async function validateObjectId(Model, id, label) {
  if (!id) {
    throw new Error(`${label} is required`); // Throw error if ID is missing
  }

  // Check if document with this ID exists in database
  const exists = await Model.exists({ _id: id });
  if (!exists) {
    const error = new Error(`${label} not found`); // Create error if not found
    error.statusCode = 404; // Set HTTP status code
    throw error; // Throw the error
  }
}

// Helper function to find status by name (case-insensitive)
async function findStatusByName(name) {
  // Find status with case-insensitive matching
  const doc = await Status.findOne({ name: new RegExp("^" + name + "$", "i") }).select(
    "_id name" // Only select ID and name fields
  );
  if (!doc) {
    // If status not found, create informative error
    const error = new Error("Status '" + name + "' not found. Please seed it first.");
    error.statusCode = 500; // Internal server error
    throw error;
  }
  return doc; // Return found status document
}

// Helper function to parse and validate numbers
function parseNumber(value, label) {
  // Check if value is undefined, null, or empty string
  if (value === undefined || value === null || value === "") {
    return undefined; // Return undefined for empty values
  }

  const num = Number(value); // Convert to number
  if (!Number.isFinite(num)) {
    // Check if it's a valid finite number
    const error = new Error(`${label} must be a valid number`);
    error.statusCode = 400; // Bad request
    throw error;
  }
  return num; // Return parsed number
}

// Helper function to convert degrees to radians
function toRadians(deg) {
  return (deg * Math.PI) / 180; // Mathematical conversion formula
}

// Helper function to calculate distance between two coordinates using Haversine formula
function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1); // Convert latitude difference to radians
  const dLon = toRadians(lon2 - lon1); // Convert longitude difference to radians

  // Haversine formula calculation
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Return distance in kilometers
}

// Create property controller function
async function createProperty(req, res) {
  try {
    // Extract all required fields from request body
    const {
      property_title,
      detailed_description,
      image_id,
      rent,
      location_id: bodyLocationId,
      location,
      user_id,
      property_types_id,
      is_active,
    } = req.body;

    const isAdmin = req.isAdmin; // Check if user is admin
    const currentUserId = getCurrentUserIdFromReq(req); // Get current user ID
    const ownerId = isAdmin ? (user_id || currentUserId) : currentUserId; // Determine owner ID

    const hasNestedLocation = !!location; // Check if location object is provided

    // Validate required fields
    if (!property_title || !rent || !ownerId || !property_types_id || (!hasNestedLocation && !bodyLocationId)) {
      return res.status(400).json({
        error:
          "property_title, rent, location (or location_id), user_id, and property_types_id are required",
      });
    }

    let finalLocationId = bodyLocationId; // Initialize location ID

    // If nested location object is provided, create new location
    if (hasNestedLocation) {
      const {
        street_address,
        area_name,
        city,
        postal_code,
        latitude,
        longitude,
        is_active: location_is_active,
      } = location;

      // Validate required location fields
      if (!city || latitude === undefined || longitude === undefined) {
        return res.status(400).json({
          error: "city, latitude, and longitude are required for location",
        });
      }

      // Normalize and trim address fields
      const normalizedStreet = street_address?.trim?.() || null;
      const normalizedPostal = postal_code?.trim?.() || null;

      // Create new location in database
      const createdLocation = await Location.create({
        street_address: normalizedStreet,
        area_name: area_name?.trim?.() ? area_name.trim() : area_name,
        city: city.trim(),
        postal_code: normalizedPostal,
        latitude,
        longitude,
        is_active: location_is_active,
      });

      finalLocationId = createdLocation._id; // Set final location ID to newly created location
    }

    // Prepare validation promises for referenced IDs
    const validationPromises = [
      validateObjectId(User, ownerId, "User"),
      validateObjectId(PropertyType, property_types_id, "Property type"),
    ];

    // Validate image ID if provided
    if (image_id) {
      validationPromises.push(validateObjectId(ImageModel, image_id, "Image"));
    }

    // Validate location ID if not creating new location
    if (!hasNestedLocation && finalLocationId) {
      validationPromises.push(validateObjectId(Location, finalLocationId, "Location"));
    }

    // Wait for all validations to complete
    await Promise.all(validationPromises);

    // Find "AVAILABLE" status for new property
    const availableStatus = await findStatusByName("AVAILABLE");

    // Create new property in database
    const property = await Property.create({
      property_title: property_title.trim(),
      detailed_description: detailed_description?.trim?.()
        ? detailed_description.trim()
        : detailed_description,
      image_id,
      rent,
      location_id: finalLocationId,
      status_id: availableStatus._id, // Set default status to AVAILABLE
      user_id: ownerId,
      property_types_id,
      is_active,
    });

    // Populate all referenced fields for complete response
    await property.populate([
      { path: "location_id" },
      { path: "user_id", select: "first_name last_name email_address" },
      { path: "property_types_id" },
      { path: "image_id" },
    ]);

    // Return success response with property data
    res.status(201).json({
      message: "Property created successfully",
      property: PropertyResponseDTO(property), // Convert to DTO format
    });
  } catch (error) {
    console.error("Error creating property:", error);
    // Handle different types of errors
    if (!error.statusCode) {
      if (error.name === "ValidationError") {
        return res.status(400).json({ error: error.message }); // Mongoose validation error
      }
      if (error.message?.includes("required")) {
        return res.status(400).json({ error: error.message }); // Custom required field error
      }
      error.statusCode = 500; // Default to internal server error
    }
    return res
      .status(error.statusCode)
      .json({ error: error.message || "Server error" });
  }
}

// Get all properties controller function
async function getAllProperties(req, res) {
  try {
    const includeInactive = req.query.includeInactive === "true"; // Check if inactive properties should be included
    const filter = includeInactive ? {} : { is_active: true }; // Set active filter

    // Parse and validate rent range filters
    const minRent = parseNumber(req.query.minRent, "minRent");
    const maxRent = parseNumber(req.query.maxRent, "maxRent");

    // Add rent range to filter if provided
    if (minRent !== undefined || maxRent !== undefined) {
      filter.rent = {};
      if (minRent !== undefined) filter.rent.$gte = minRent; // Greater than or equal
      if (maxRent !== undefined) filter.rent.$lte = maxRent; // Less than or equal
    }

    // Filter by property type if provided
    if (req.query.propertyTypeId) {
      filter.property_types_id = req.query.propertyTypeId;
    }

    // Filter by status if provided
    if (req.query.status) {
      const statusDoc = await findStatusByName(req.query.status);
      filter.status_id = statusDoc._id;
    }

    // Parse sorting parameters
    const sortBy = (req.query.sortBy || "").toLowerCase();
    const sortOrder = (req.query.sortOrder || "desc").toLowerCase();
    const sortDirection = sortOrder === "asc" ? 1 : -1; // Convert to 1 or -1 for MongoDB

    let sort = { created_date: -1 }; // Default sort by creation date descending
    if (sortBy === "price") {
      sort = { rent: sortDirection }; // Sort by price if requested
    }

    // Fetch properties from database with population and sorting
    const properties = await Property.find(filter)
      .populate({ path: "location_id" })
      .populate({ path: "user_id", select: "first_name last_name email_address" })
      .populate({ path: "property_types_id" })
      .populate({ path: "image_id" })
      .sort(sort);

    let results = properties.map((p) => p.toObject()); // Convert Mongoose documents to plain objects

    // Extract and process location-based filters
    const street = req.query.street?.trim?.();
    const area = req.query.area?.trim?.();
    const city = req.query.city?.trim?.();
    const postalCode = req.query.postalCode?.trim?.();

    // Filter by street address (partial match)
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

    // Filter by area name (partial match)
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

    // Filter by city (exact match)
    if (city) {
      const cityLower = city.toLowerCase();
      results = results.filter((p) => {
        const loc = p.location_id;
        return (
          loc && typeof loc.city === "string" && loc.city.toLowerCase() === cityLower
        );
      });
    }

    // Filter by postal code (exact match)
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

    // Parse and validate geographic bounding box filters
    const minLat = parseNumber(req.query.minLat, "minLat");
    const maxLat = parseNumber(req.query.maxLat, "maxLat");
    const minLon = parseNumber(req.query.minLon, "minLon");
    const maxLon = parseNumber(req.query.maxLon, "maxLon");

    // Filter by geographic bounding box
    if (
      minLat !== undefined ||
      maxLat !== undefined ||
      minLon !== undefined ||
      maxLon !== undefined
    ) {
      results = results.filter((p) => {
        const loc = p.location_id;
        if (!loc) return false; // Skip if no location
        const { latitude, longitude } = loc;
        if (latitude === undefined || longitude === undefined) return false; // Skip if coordinates missing
        
        // Check if coordinates are within bounds
        if (minLat !== undefined && latitude < minLat) return false;
        if (maxLat !== undefined && latitude > maxLat) return false;
        if (minLon !== undefined && longitude < minLon) return false;
        if (maxLon !== undefined && longitude > maxLon) return false;
        return true;
      });
    }

    // Parse and validate radius-based filtering parameters
    const centerLat = parseNumber(req.query.centerLat, "centerLat");
    const centerLon = parseNumber(req.query.centerLon, "centerLon");
    const radiusKm = parseNumber(req.query.radiusKm, "radiusKm");

    // Calculate distances and filter by radius if center coordinates provided
    if (centerLat !== undefined && centerLon !== undefined) {
      results = results
        .map((p) => {
          const loc = p.location_id;
          if (!loc || loc.latitude === undefined || loc.longitude === undefined) {
            return p; // Return property unchanged if no coordinates
          }
          // Calculate distance from center point
          const distanceKm = calculateDistanceKm(
            centerLat,
            centerLon,
            loc.latitude,
            loc.longitude
          );
          return { ...p, distance_km: distanceKm }; // Add distance to property object
        })
        .filter((p) => {
          // Filter by radius if specified
          if (radiusKm === undefined || p.distance_km === undefined) return true;
          return p.distance_km <= radiusKm;
        });

      // Sort by distance if requested
      if (sortBy === "distance") {
        results.sort((a, b) => {
          const aDist = a.distance_km ?? Number.POSITIVE_INFINITY; // Handle undefined distances
          const bDist = b.distance_km ?? Number.POSITIVE_INFINITY;
          if (aDist === bDist) return 0;
          return aDist < bDist ? sortDirection * -1 : sortDirection; // Sort based on direction
        });
      }
    }

    // Parse and validate pagination parameters
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const safePage = page < 1 ? 1 : page; // Ensure page is at least 1
    const safeLimit = limit < 1 ? 10 : limit; // Ensure limit is at least 10

    // Calculate pagination values
    const total = results.length;
    const totalPages = Math.ceil(total / safeLimit) || 1;
    const startIndex = (safePage - 1) * safeLimit;
    const paginatedResults = results.slice(startIndex, startIndex + safeLimit);
    const dtoResults = paginatedResults.map((p) => PropertyResponseDTO(p)); // Convert to DTO format

    // Return paginated response
    res.status(200).json({
      data: dtoResults,
      page: safePage,
      limit: safeLimit,
      total,
      totalPages,
    });
  } catch (error) {
    console.error("Error fetching properties:", error);
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message }); // Return specific error
    }
    res.status(500).json({ error: "Server error" }); // Return generic server error
  }
}

// Get property by ID controller function
async function getPropertyById(req, res) {
  try {
    const includeInactive = req.query.includeInactive === "true"; // Check if inactive properties should be included
    const filter = { _id: req.params.id }; // Filter by property ID from URL parameter
    if (!includeInactive) {
      filter.is_active = true; // Add active filter if not including inactive
    }

    // Find property by ID with populated references
    const property = await Property.findOne(filter)
      .populate({ path: "location_id" })
      .populate({ path: "user_id", select: "first_name last_name email_address" })
      .populate({ path: "property_types_id" })
      .populate({ path: "image_id" });

    if (!property) {
      return res.status(404).json({ error: "Property not found" }); // Return 404 if not found
    }

    // Return property in DTO format
    res.status(200).json(PropertyResponseDTO(property));
  } catch (error) {
    console.error("Error fetching property:", error);
    res.status(500).json({ error: "Server error" }); // Return server error
  }
}

// Update property controller function
async function updateProperty(req, res) {
  try {
    // Extract all possible update fields from request body
    const {
      property_title,
      detailed_description,
      image_id,
      rent,
      location_id,
      user_id,
      property_types_id,
      is_active,
      location,
    } = req.body;

    // Find existing property first
    const existingProperty = await Property.findById(req.params.id);

    if (!existingProperty) {
      return res.status(404).json({ error: "Property not found" }); // Return 404 if property doesn't exist
    }

    // Authorization check for non-admin users
    if (!req.isAdmin) {
      const currentUserId = getCurrentUserIdFromReq(req);
      if (!currentUserId) {
        return res.status(401).json({ error: "Not authorized" }); // Return 401 if not authenticated
      }
      // Extract owner ID from existing property
      const ownerId =
        existingProperty.user_id && existingProperty.user_id._id
          ? existingProperty.user_id._id.toString()
          : existingProperty.user_id?.toString?.();
      // Check if current user is the owner
      if (!ownerId || ownerId !== currentUserId) {
        return res
          .status(403)
          .json({ error: "You are not allowed to modify this property" }); // Return 403 if not owner
      }
    }

    const updates = {}; // Object to store update fields

    // Process property title update
    if (property_title) updates.property_title = property_title.trim();
    // Process description update
    if (detailed_description !== undefined) {
      updates.detailed_description = detailed_description?.trim?.()
        ? detailed_description.trim()
        : detailed_description;
    }

    const validationPromises = []; // Array for validation promises
    // Process image ID update with validation
    if (image_id !== undefined) {
      if (image_id) {
        validationPromises.push(validateObjectId(ImageModel, image_id, "Image"));
      }
      updates.image_id = image_id || null; // Set to null if empty
    }

    // Process other direct field updates
    if (rent !== undefined) updates.rent = rent;
    if (typeof is_active === "boolean") updates.is_active = is_active;

    // Process location updates (nested object or location_id)
    if (location) {
      const {
        street_address,
        area_name,
        city,
        postal_code,
        latitude,
        longitude,
        is_active: location_is_active,
      } = location;

      const locationUpdate = {}; // Object for location updates
      // Process each location field if provided
      if (street_address !== undefined) {
        locationUpdate.street_address = street_address?.trim?.() || null;
      }
      if (area_name !== undefined) locationUpdate.area_name = area_name;
      if (city !== undefined) locationUpdate.city = city;
      if (postal_code !== undefined) {
        locationUpdate.postal_code = postal_code?.trim?.() || null;
      }
      if (latitude !== undefined) locationUpdate.latitude = latitude;
      if (longitude !== undefined) locationUpdate.longitude = longitude;
      if (typeof location_is_active === "boolean") locationUpdate.is_active = location_is_active;

      // Update existing location or create new one
      if (existingProperty.location_id) {
        await Location.findByIdAndUpdate(
          existingProperty.location_id,
          { $set: locationUpdate },
          { new: true, runValidators: true }
        );
      } else {
        const createdLocation = await Location.create(locationUpdate);
        updates.location_id = createdLocation._id; // Set new location ID
      }
    } else if (location_id) {
      // Validate and update location_id if provided
      validationPromises.push(validateObjectId(Location, location_id, "Location"));
      updates.location_id = location_id;
    }

    // Process user_id update (admin only)
    if (user_id && req.isAdmin) {
      validationPromises.push(validateObjectId(User, user_id, "User"));
      updates.user_id = user_id;
    }
    // Process property type update
    if (property_types_id) {
      validationPromises.push(
        validateObjectId(PropertyType, property_types_id, "Property type")
      );
      updates.property_types_id = property_types_id;
    }

    // Wait for all validations to complete
    await Promise.all(validationPromises);

    // Update property in database
    const property = await Property.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true } // Return updated document and run validators
    )
      .populate({ path: "location_id" })
      .populate({ path: "user_id", select: "first_name last_name email_address" })
      .populate({ path: "property_types_id" });

    if (!property) {
      return res.status(404).json({ error: "Property not found" }); // Return 404 if update failed
    }

    // Return success response with updated property
    res.status(200).json({
      message: "Property updated successfully",
      property: PropertyResponseDTO(property),
    });
  } catch (error) {
    console.error("Error updating property:", error);
    if (error.name === "ValidationError") {
      return res.status(400).json({ error: error.message }); // Handle validation errors
    }
    if (!error.statusCode) {
      error.statusCode = 500; // Set default status code
    }
    res.status(error.statusCode).json({ error: error.message || "Server error" });
  }
}

// Soft delete property controller function
async function deleteProperty(req, res) {
  try {
    // Find property by ID
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({ error: "Property not found" }); // Return 404 if not found
    }

    // Authorization check for non-admin users
    if (!req.isAdmin) {
      const currentUserId = getCurrentUserIdFromReq(req);
      if (!currentUserId) {
        return res.status(401).json({ error: "Not authorized" }); // Return 401 if not authenticated
      }
      // Extract owner ID from property
      const ownerId =
        property.user_id && property.user_id._id
          ? property.user_id._id.toString()
          : property.user_id?.toString?.();
      // Check if current user is the owner
      if (!ownerId || ownerId !== currentUserId) {
        return res
          .status(403)
          .json({ error: "You are not allowed to delete this property" }); // Return 403 if not owner
      }
    }

    // Check if property is already inactive
    if (!property.is_active) {
      return res.status(200).json({ message: "Property already inactive" }); // Return message if already deleted
    }

    // Soft delete by setting is_active to false
    property.is_active = false;
    await property.save(); // Save the change

    // Return success response
    res.status(200).json({ message: "Property soft-deleted successfully" });
  } catch (error) {
    console.error("Error deleting property:", error);
    res.status(500).json({ error: "Server error" }); // Return server error
  }
}

// Export all controller functions
module.exports = {
  createProperty,
  getAllProperties,
  getPropertyById,
  updateProperty,
  deleteProperty,
};