// src/controllers/statusController.js
// This controller manages CRUD operations for statuses (e.g., AVAILABLE, BOOKING).

// Import Status model for database operations
const Status = require("../models/statusModel");

// Create status
// Reads name and is_active, validates them, and saves a new status.
const createStatus = async (req, res) => {
  try {
    const { name, is_active } = req.body;

    // Name is required and cannot be empty
    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Status name is required" });
    }

    // Create a new Status document
    const status = await Status.create({
      name: name.trim(),
      is_active,
    });

    res.status(201).json({
      message: "Status created successfully",
      status,
    });
  } catch (error) {
    console.error("Error creating status:", error);
    // 11000 = duplicate key error for unique name
    if (error.code === 11000) {
      return res.status(400).json({ error: "Status name must be unique" });
    }
    res.status(500).json({ error: "Server error" });
  }
};

// Get all statuses
// Supports pagination and optional inclusion of inactive statuses.
const getAllStatuses = async (req, res) => {
  try {
    const includeInactive = req.query.includeInactive === "true";
    const filter = includeInactive ? {} : { is_active: true };
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const safePage = page < 1 ? 1 : page;
    const safeLimit = limit < 1 ? 10 : limit;
    const skip = (safePage - 1) * safeLimit;

    // Count and fetch statuses with pagination
    const [total, statuses] = await Promise.all([
      Status.countDocuments(filter),
      Status.find(filter).sort({ created_date: -1 }).skip(skip).limit(safeLimit),
    ]);

    const totalPages = Math.ceil(total / safeLimit) || 1;

    res.status(200).json({
      data: statuses,
      page: safePage,
      limit: safeLimit,
      total,
      totalPages,
    });
  } catch (error) {
    console.error("Error fetching statuses:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Get status by ID
// Returns a single status, optionally including inactive ones.
const getStatusById = async (req, res) => {
  try {
    const includeInactive = req.query.includeInactive === "true";
    const filter = { _id: req.params.id };
    // If not including inactive, only return active status
    if (!includeInactive) {
      filter.is_active = true;
    }

    const status = await Status.findOne(filter);
    if (!status) {
      return res.status(404).json({ error: "Status not found" });
    }

    res.status(200).json(status);
  } catch (error) {
    console.error("Error fetching status:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Update status
// Allows changing status name and active flag.
const updateStatus = async (req, res) => {
  try {
    const { name, is_active } = req.body;
    const updates = {};

    // Only update fields that are provided
    if (name) updates.name = name.trim();
    if (typeof is_active === "boolean") updates.is_active = is_active;

    const status = await Status.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!status) {
      return res.status(404).json({ error: "Status not found" });
    }

    res.status(200).json({
      message: "Status updated successfully",
      status,
    });
  } catch (error) {
    console.error("Error updating status:", error);
    // Duplicate name error
    if (error.code === 11000) {
      return res.status(400).json({ error: "Status name must be unique" });
    }
    // Mongoose validation errors
    if (error.name === "ValidationError") {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: "Server error" });
  }
};

// Soft delete status
// Marks a status as inactive instead of removing it from the database.
const deleteStatus = async (req, res) => {
  try {
    const status = await Status.findById(req.params.id);

    if (!status) {
      return res.status(404).json({ error: "Status not found" });
    }

    // If already inactive, do nothing and return a message
    if (!status.is_active) {
      return res.status(200).json({ message: "Status already inactive" });
    }

    // Mark as inactive and save
    status.is_active = false;
    await status.save();

    res.status(200).json({ message: "Status soft-deleted successfully" });
  } catch (error) {
    console.error("Error deleting status:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Export all status-related controller functions
module.exports = {
  createStatus,
  getAllStatuses,
  getStatusById,
  updateStatus,
  deleteStatus,
};
