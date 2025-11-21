const Booking = require("../models/bookingModel");
const Property = require("../models/propertyModel");
const User = require("../models/userModel");
const Status = require("../models/statusModel");

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const STATUS_AVAILABLE = "AVAILABLE";
const STATUS_RESERVED = "BOOKING";

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

const parseDate = (value, label) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    const error = new Error(`${label} must be a valid date`);
    error.statusCode = 400;
    throw error;
  }
  return date;
};

const normalizeStatusName = (name) => (name || "").trim().toUpperCase();

const ensurePropertyIsAvailable = (propertyDoc) => {
  const currentStatusName = normalizeStatusName(propertyDoc?.status?.name);
  if (currentStatusName !== STATUS_AVAILABLE) {
    const error = new Error("This property is not available for booking.");
    error.statusCode = 400;
    throw error;
  }
};

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

  const start = startDate instanceof Date ? startDate : parseDate(startDate, "start_date");
  const end = endDate instanceof Date ? endDate : parseDate(endDate, "end_date");

  if (end <= start) {
    const error = new Error("end_date must be after start_date");
    error.statusCode = 400;
    throw error;
  }

  const durationDays = Math.ceil((end - start) / DAY_IN_MS);
  return { totalRent: property.rent * durationDays, start, end };
};

const findStatusByName = async (name) => {
  const doc = await Status.findOne({ name: new RegExp(`^${name}$`, "i") }).select("_id name");
  if (!doc) {
    const error = new Error(`Status '${name}' not found. Please seed it first.`);
    error.statusCode = 500;
    throw error;
  }
  return doc;
};

const updatePropertyStatusIfNeeded = async (propertyDoc, targetStatusDoc) => {
  if (!propertyDoc || !targetStatusDoc) return;

  const currentId =
    typeof propertyDoc.status === "object" && propertyDoc.status?._id
      ? propertyDoc.status._id.toString()
      : propertyDoc.status?.toString?.();

  if (currentId === targetStatusDoc._id.toString()) return;

  propertyDoc.status = targetStatusDoc._id;
  await propertyDoc.save();
};

// Create booking
const createBooking = async (req, res) => {
  try {
    const { property_id, start_date, end_date, is_active } = req.body;

    const currentUserId = getCurrentUserIdFromReq(req);
    const isRoomSeeker = req.isRoomSeeker;

    if (!isRoomSeeker) {
      return res.status(403).json({ error: "Only room seekers can create bookings" });
    }

    const effectiveUserId = currentUserId;

    if (!property_id || !start_date || !end_date) {
      return res.status(400).json({
        error: "property_id, start_date, and end_date are required",
      });
    }

    if (!effectiveUserId) {
      return res.status(400).json({ error: "User is required for booking" });
    }

    await Promise.all([
      validateObjectId(Property, property_id, "Property"),
      validateObjectId(User, effectiveUserId, "User"),
    ]);

    const propertyDoc = await Property.findById(property_id)
      .select("rent status")
      .populate({ path: "status", select: "name" });

    if (!propertyDoc) {
      return res.status(404).json({ error: "Property not found" });
    }

    ensurePropertyIsAvailable(propertyDoc);

    const parsedStartDate = parseDate(start_date, "start_date");
    const parsedEndDate = parseDate(end_date, "end_date");
    const { totalRent } = await calculateTotalRent(propertyDoc, parsedStartDate, parsedEndDate);
    const reservedStatus = await findStatusByName(STATUS_RESERVED);

    const booking = await Booking.create({
      property_id,
      user_id: effectiveUserId,
      start_date: parsedStartDate,
      end_date: parsedEndDate,
      status_id: reservedStatus._id,
      total_rent: totalRent,
      is_active,
    });

    await booking.populate([
      { path: "property_id" },
      { path: "user_id", select: "first_name last_name email_address" },
      { path: "status_id" },
    ]);

    await updatePropertyStatusIfNeeded(propertyDoc, reservedStatus);

    res.status(201).json({
      message: "Booking created successfully",
      booking,
    });
  } catch (error) {
    console.error("Error creating booking:", error);
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
const getAllBookings = async (req, res) => {
  try {
    const includeInactive = req.query.includeInactive === "true";
    const filter = includeInactive ? {} : { is_active: true };

    const bookings = await Booking.find(filter)
      .populate({ path: "property_id" })
      .populate({ path: "user_id", select: "first_name last_name email_address" })
      .populate({ path: "status_id" })
      .sort({ created_date: -1 });

    const currentUserId = getCurrentUserIdFromReq(req);
    let filteredBookings = bookings;

    if (req.isRoomSeeker && !req.isAdmin) {
      filteredBookings = bookings.filter((b) => {
        const bookingUserId =
          b.user_id && b.user_id._id ? b.user_id._id.toString() : b.user_id?.toString?.();
        return currentUserId && bookingUserId === currentUserId;
      });
    } else if (req.isLandlord && !req.isAdmin) {
      filteredBookings = bookings.filter((b) => {
        const propertyOwnerId =
          b.property_id && b.property_id.user_id && b.property_id.user_id._id
            ? b.property_id.user_id._id.toString()
            : b.property_id?.user_id?.toString?.();
        return currentUserId && propertyOwnerId === currentUserId;
      });
    }

    res.status(200).json(filteredBookings);
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Get booking by ID
const getBookingById = async (req, res) => {
  try {
    const includeInactive = req.query.includeInactive === "true";
    const filter = { _id: req.params.id };
    if (!includeInactive) {
      filter.is_active = true;
    }

    const booking = await Booking.findOne(filter)
      .populate({ path: "property_id" })
      .populate({ path: "user_id", select: "first_name last_name email_address" })
      .populate({ path: "status_id" });

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    if (!req.isAdmin) {
      const currentUserId = getCurrentUserIdFromReq(req);
      if (!currentUserId) {
        return res.status(401).json({ error: "Not authorized" });
      }

      if (req.isRoomSeeker) {
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
const updateBooking = async (req, res) => {
  try {
    const { property_id, user_id, start_date, end_date, is_active } = req.body;

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    const validationPromises = [];
    if (property_id) validationPromises.push(validateObjectId(Property, property_id, "Property"));
    if (user_id && req.isAdmin)
      validationPromises.push(validateObjectId(User, user_id, "User"));

    await Promise.all(validationPromises);

    let newPropertyDoc = null;
    if (property_id) {
      newPropertyDoc = await Property.findById(property_id)
        .select("rent status")
        .populate({ path: "status", select: "name" });
      if (!newPropertyDoc) {
        return res.status(404).json({ error: "Property not found" });
      }
      ensurePropertyIsAvailable(newPropertyDoc);
      booking.property_id = property_id;
    }
    if (user_id && req.isAdmin) booking.user_id = user_id;
    if (start_date !== undefined) booking.start_date = parseDate(start_date, "start_date");
    if (end_date !== undefined) booking.end_date = parseDate(end_date, "end_date");
    if (typeof is_active === "boolean") booking.is_active = is_active;

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

    await booking.save();

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
const deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    if (!booking.is_active) {
      return res.status(200).json({ message: "Booking already inactive" });
    }

    booking.is_active = false;
    await booking.save();

    res.status(200).json({ message: "Booking soft-deleted successfully" });
  } catch (error) {
    console.error("Error deleting booking:", error);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = {
  createBooking,
  getAllBookings,
  getBookingById,
  updateBooking,
  deleteBooking,
};
