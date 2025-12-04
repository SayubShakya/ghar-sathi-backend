// src/controllers/bookingController.js
// This controller manages booking creation, listing, viewing, updating and soft-deleting.

// Import models used by booking logic
const Booking = require("../models/bookingModel");
const Property = require("../models/propertyModel");
const User = require("../models/userModel");
const Status = require("../models/statusModel");

// Constant: number of milliseconds in one day
const DAY_IN_MS = 24 * 60 * 60 * 1000;
// Logical names for property statuses used in this controller
const STATUS_AVAILABLE = "AVAILABLE";
const STATUS_RESERVED = "BOOKING";

// Helper: safely get current user id from the request (if logged in)
const getCurrentUserIdFromReq = (req) => {
  if (!req || !req.user || !req.user._id) {
    return null;
  }
  return req.user._id.toString();
};

// Helper: validate that an ObjectId exists for the given model
// Throws 404 error if not found, or generic error if id missing.
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

// Helper: parse a date from string and validate it
const parseDate = (value, label) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    const error = new Error(`${label} must be a valid date`);
    error.statusCode = 400;
    throw error;
  }
  return date;
};

// Helper: normalize status name for comparison (trim + uppercase)
const normalizeStatusName = (name) => (name || "").trim().toUpperCase();

// Helper: ensure a property is currently AVAILABLE
const ensurePropertyIsAvailable = (propertyDoc) => {
  const currentStatusName = normalizeStatusName(
    propertyDoc && propertyDoc.status_id && typeof propertyDoc.status_id === "object"
      ? propertyDoc.status_id.name
      : null
  );
  if (currentStatusName !== STATUS_AVAILABLE) {
    const error = new Error("This property is not available for booking.");
    error.statusCode = 400;
    throw error;
  }
};

// Helper: calculate total rent based on property rent and date range
// Accepts either a property document or a property id.
const calculateTotalRent = async (propertyOrId, startDate, endDate) => {
  const property =
    propertyOrId && typeof propertyOrId === "object" && "rent" in propertyOrId
      ? propertyOrId
      : await Property.findById(propertyOrId).select("rent");
  if (!property) {
    const error = new Error("Property not found");
    error.statusCode = 404;
    throw error;
  }

  // Ensure we have Date objects for the date range
  const start = startDate instanceof Date ? startDate : parseDate(startDate, "start_date");
  const end = endDate instanceof Date ? endDate : parseDate(endDate, "end_date");

  // End date must be after start date
  if (end <= start) {
    const error = new Error("end_date must be after start_date");
    error.statusCode = 400;
    throw error;
  }

  // Duration in days (rounded up) multiplied by daily rent
  const durationDays = Math.ceil((end - start) / DAY_IN_MS);
  return { totalRent: property.rent * durationDays, start, end };
};

// Helper: find a Status document by name (case-insensitive)
const findStatusByName = async (name) => {
  const doc = await Status.findOne({ name: new RegExp(`^${name}$`, "i") }).select(
    "_id name"
  );
  if (!doc) {
    const error = new Error(`Status '${name}' not found. Please seed it first.`);
    error.statusCode = 500;
    throw error;
  }
  return doc;
};

// Helper: update property's status only if it is different from target
const updatePropertyStatusIfNeeded = async (propertyDoc, targetStatusDoc) => {
  if (!propertyDoc || !targetStatusDoc) return;

  // Get current status id from either populated object or raw id
  const currentId =
    typeof propertyDoc.status_id === "object" && propertyDoc.status_id?._id
      ? propertyDoc.status_id._id.toString()
      : propertyDoc.status_id?.toString?.();

  // If already has that status, skip update
  if (currentId === targetStatusDoc._id.toString()) return;

  // Otherwise, update and save property
  propertyDoc.status_id = targetStatusDoc._id;
  await propertyDoc.save();
};

// Create booking
// Only ROOM_SEEKER can create bookings. It validates dates, property, user,
// calculates total rent, creates a booking, and updates property status.
const createBooking = async (req, res) => {
  try {
    const { property_id, start_date, end_date, is_active } = req.body;

    // Get currently logged in user's id and role flag from auth middleware
    const currentUserId = getCurrentUserIdFromReq(req);
    const isRoomSeeker = req.isRoomSeeker;

    // Only room seekers are allowed to create bookings
    if (!isRoomSeeker) {
      return res.status(403).json({ error: "Only room seekers can create bookings" });
    }

    const effectiveUserId = currentUserId;

    // Required fields for booking
    if (!property_id || !start_date || !end_date) {
      return res.status(400).json({
        error: "property_id, start_date, and end_date are required",
      });
    }

    // User must be known for the booking
    if (!effectiveUserId) {
      return res.status(400).json({ error: "User is required for booking" });
    }

    // Validate referenced property and user ids
    await Promise.all([
      validateObjectId(Property, property_id, "Property"),
      validateObjectId(User, effectiveUserId, "User"),
    ]);

    // Fetch property with its status for availability check
    const propertyDoc = await Property.findById(property_id)
      .select("rent status_id")
      .populate({ path: "status_id", select: "name" });

    if (!propertyDoc) {
      return res.status(404).json({ error: "Property not found" });
    }

    // Ensure property is AVAILABLE (not already booked)
    ensurePropertyIsAvailable(propertyDoc);

    // Parse and validate date range
    const parsedStartDate = parseDate(start_date, "start_date");
    const parsedEndDate = parseDate(end_date, "end_date");
    const { totalRent } = await calculateTotalRent(
      propertyDoc,
      parsedStartDate,
      parsedEndDate
    );
    // Get the reserved/BOOKING status document
    const reservedStatus = await findStatusByName(STATUS_RESERVED);

    // Create the booking document
    const booking = await Booking.create({
      property_id,
      user_id: effectiveUserId,
      start_date: parsedStartDate,
      end_date: parsedEndDate,
      status_id: reservedStatus._id,
      total_rent: totalRent,
      is_active,
    });

    // Populate references for response
    await booking.populate([
      { path: "property_id" },
      { path: "user_id", select: "first_name last_name email_address" },
      { path: "status_id" },
    ]);

    // Update property status to BOOKING if needed
    await updatePropertyStatusIfNeeded(propertyDoc, reservedStatus);

    res.status(201).json({
      message: "Booking created successfully",
      booking,
    });
  } catch (error) {
    console.error("Error creating booking:", error);
    // Map validation-related errors to 400, others to 500
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

// Get all bookings
// Admin can see all, landlord sees bookings for own properties,
// room seeker sees only their own bookings.
const getAllBookings = async (req, res) => {
  try {
    const includeInactive = req.query.includeInactive === "true";
    // Filter active bookings unless includeInactive is true
    const filter = includeInactive ? {} : { is_active: true };

    // Load bookings with related property, user, and status
    const bookings = await Booking.find(filter)
      .populate({ path: "property_id" })
      .populate({ path: "user_id", select: "first_name last_name email_address" })
      .populate({ path: "status_id" })
      .sort({ created_date: -1 });

    const currentUserId = getCurrentUserIdFromReq(req);
    let filteredBookings = bookings;

    // If room seeker (non-admin), show only bookings where they are the user_id
    if (req.isRoomSeeker && !req.isAdmin) {
      filteredBookings = bookings.filter((b) => {
        const bookingUserId =
          b.user_id && b.user_id._id ? b.user_id._id.toString() : b.user_id?.toString?.();
        return currentUserId && bookingUserId === currentUserId;
      });
    } else if (req.isLandlord && !req.isAdmin) {
      // If landlord (non-admin), show bookings only for their properties
      filteredBookings = bookings.filter((b) => {
        const propertyOwnerId =
          b.property_id && b.property_id.user_id && b.property_id.user_id._id
            ? b.property_id.user_id._id.toString()
            : b.property_id?.user_id?.toString?.();
        return currentUserId && propertyOwnerId === currentUserId;
      });
    }

    // Apply pagination in-memory on filtered results
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const safePage = page < 1 ? 1 : page;
    const safeLimit = limit < 1 ? 10 : limit;
    const total = filteredBookings.length;
    const totalPages = Math.ceil(total / safeLimit) || 1;
    const startIndex = (safePage - 1) * safeLimit;
    const paginatedBookings = filteredBookings.slice(startIndex, startIndex + safeLimit);

    res.status(200).json({
      data: paginatedBookings,
      page: safePage,
      limit: safeLimit,
      total,
      totalPages,
    });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Get booking by ID
// Applies access control similar to list: admin sees all,
// room seeker sees own, landlord sees bookings for own properties.
const getBookingById = async (req, res) => {
  try {
    const includeInactive = req.query.includeInactive === "true";
    const filter = { _id: req.params.id };
    if (!includeInactive) {
      filter.is_active = true;
    }

    // Populate all related references
    const booking = await Booking.findOne(filter)
      .populate({ path: "property_id" })
      .populate({ path: "user_id", select: "first_name last_name email_address" })
      .populate({ path: "status_id" });

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    // Non-admin users must pass extra authorization checks
    if (!req.isAdmin) {
      const currentUserId = getCurrentUserIdFromReq(req);
      if (!currentUserId) {
        return res.status(401).json({ error: "Not authorized" });
      }

      if (req.isRoomSeeker) {
        // Room seeker: must match booking.user_id
        const bookingUserId =
          booking.user_id && booking.user_id._id
            ? booking.user_id._id.toString()
            : booking.user_id?.toString?.();
        if (!bookingUserId || bookingUserId !== currentUserId) {
          return res
            .status(403)
            .json({ error: "You are not allowed to access this booking" });
        }
      } else if (req.isLandlord) {
        // Landlord: must own the property referenced by the booking
        const propertyOwnerId =
          booking.property_id && booking.property_id.user_id && booking.property_id.user_id._id
            ? booking.property_id.user_id._id.toString()
            : booking.property_id?.user_id?.toString?.();
        if (!propertyOwnerId || propertyOwnerId !== currentUserId) {
          return res
            .status(403)
            .json({ error: "You are not allowed to access this booking" });
        }
      } else {
        // Any other role is forbidden
        return res.status(403).json({ error: "Forbidden" });
      }
    }

    res.status(200).json(booking);
  } catch (error) {
    console.error("Error fetching booking:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Update booking
// Admin can move bookings between users and properties, and dates can change.
// This recalculates total_rent when required.
const updateBooking = async (req, res) => {
  try {
    const { property_id, user_id, start_date, end_date, is_active } = req.body;

    // Load the existing booking record
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    // Build validation promises for optional references
    const validationPromises = [];
    if (property_id)
      validationPromises.push(validateObjectId(Property, property_id, "Property"));
    if (user_id && req.isAdmin)
      validationPromises.push(validateObjectId(User, user_id, "User"));

    await Promise.all(validationPromises);

    let newPropertyDoc = null;
    // If property_id is changing, load the new property and verify availability
    if (property_id) {
      newPropertyDoc = await Property.findById(property_id)
        .select("rent status_id")
        .populate({ path: "status_id", select: "name" });
      if (!newPropertyDoc) {
        return res.status(404).json({ error: "Property not found" });
      }
      ensurePropertyIsAvailable(newPropertyDoc);
      booking.property_id = property_id;
    }
    // Allow admin to move booking to another user
    if (user_id && req.isAdmin) booking.user_id = user_id;
    // Update start and end dates if provided
    if (start_date !== undefined) booking.start_date = parseDate(start_date, "start_date");
    if (end_date !== undefined) booking.end_date = parseDate(end_date, "end_date");
    // Update active flag if explicitly set
    if (typeof is_active === "boolean") booking.is_active = is_active;

    // Decide whether total rent must be recalculated
    const shouldRecalculate =
      !!property_id || start_date !== undefined || end_date !== undefined;

    if (shouldRecalculate) {
      const { totalRent } = await calculateTotalRent(
        newPropertyDoc || booking.property_id,
        booking.start_date,
        booking.end_date
      );
      booking.total_rent = totalRent;
    }

    // Save updated booking
    await booking.save();

    // Populate fields for response
    await booking.populate([
      { path: "property_id" },
      { path: "user_id", select: "first_name last_name email_address" },
      { path: "status_id" },
    ]);

    res.status(200).json({
      message: "Booking updated successfully",
      booking,
    });
  } catch (error) {
    console.error("Error updating booking:", error);
    // Map validation error to 400, others to 500
    if (error.name === "ValidationError") {
      return res.status(400).json({ error: error.message });
    }
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    res.status(error.statusCode).json({ error: error.message || "Server error" });
  }
};

// Soft delete booking
// Marks a booking as inactive instead of removing it completely.
const deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    // If already inactive, no changes are needed
    if (!booking.is_active) {
      return res.status(200).json({ message: "Booking already inactive" });
    }

    // Mark as inactive and save
    booking.is_active = false;
    await booking.save();

    res.status(200).json({ message: "Booking soft-deleted successfully" });
  } catch (error) {
    console.error("Error deleting booking:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Export all booking-related controller functions
module.exports = {
  createBooking,
  getAllBookings,
  getBookingById,
  updateBooking,
  deleteBooking,
};
