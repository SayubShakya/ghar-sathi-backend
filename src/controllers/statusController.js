const Status = require("../models/statusModel");

// Create status
const createStatus = async (req, res) => {
  try {
    const { name, is_active } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Status name is required" });
    }

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
    if (error.code === 11000) {
      return res.status(400).json({ error: "Status name must be unique" });
    }
    res.status(500).json({ error: "Server error" });
  }
};

// Get all statuses
const getAllStatuses = async (req, res) => {
  try {
    const includeInactive = req.query.includeInactive === "true";
    const filter = includeInactive ? {} : { is_active: true };
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const safePage = page < 1 ? 1 : page;
    const safeLimit = limit < 1 ? 10 : limit;
    const skip = (safePage - 1) * safeLimit;

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
const getStatusById = async (req, res) => {
  try {
    const includeInactive = req.query.includeInactive === "true";
    const filter = { _id: req.params.id };
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
const updateStatus = async (req, res) => {
  try {
    const { name, is_active } = req.body;
    const updates = {};

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
    if (error.code === 11000) {
      return res.status(400).json({ error: "Status name must be unique" });
    }
    if (error.name === "ValidationError") {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: "Server error" });
  }
};

// Soft delete status
const deleteStatus = async (req, res) => {
  try {
    const status = await Status.findById(req.params.id);

    if (!status) {
      return res.status(404).json({ error: "Status not found" });
    }

    if (!status.is_active) {
      return res.status(200).json({ message: "Status already inactive" });
    }

    status.is_active = false;
    await status.save();

    res.status(200).json({ message: "Status soft-deleted successfully" });
  } catch (error) {
    console.error("Error deleting status:", error);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = {
  createStatus,
  getAllStatuses,
  getStatusById,
  updateStatus,
  deleteStatus,
};
