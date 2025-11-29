// src/controllers/roleController.js
// This controller manages CRUD operations for roles (ADMIN, LANDLORD, ROOM_SEEKER, etc.).

// Import Role model for database operations
const Role = require("../models/roleModel");

// Create a new role
// Reads role name and is_active from body, validates, and saves a new record.
const createRole = async (req, res) => {
  try {
    const { name, is_active } = req.body;

    // Role name is required and must not be blank
    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Role name is required" });
    }

    // Create a new Role document
    const newRole = await Role.create({
      name: name.trim(),
      is_active,
    });

    // Respond with the newly created role
    res.status(201).json({
      message: "Role created successfully",
      role: newRole,
    });
  } catch (error) {
    console.error("Error creating role:", error);
    // Handle duplicate key error for unique role name
    if (error.code === 11000) {
      return res.status(400).json({ error: "Role name must be unique" });
    }
    res.status(500).json({ error: "Server error" });
  }
};

// Get all roles
// Supports pagination and optional inclusion of inactive roles.
const getAllRoles = async (req, res) => {
  try {
    const includeInactive = req.query.includeInactive === "true";
    // Filter for active roles by default
    const filter = includeInactive ? {} : { is_active: true };
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const safePage = page < 1 ? 1 : page;
    const safeLimit = limit < 1 ? 10 : limit;
    const skip = (safePage - 1) * safeLimit;

    // Count and fetch roles with pagination
    const [total, roles] = await Promise.all([
      Role.countDocuments(filter),
      Role.find(filter).sort({ created_date: -1 }).skip(skip).limit(safeLimit),
    ]);

    const totalPages = Math.ceil(total / safeLimit) || 1;

    res.status(200).json({
      data: roles,
      page: safePage,
      limit: safeLimit,
      total,
      totalPages,
    });
  } catch (error) {
    console.error("Error fetching roles:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Get role by ID
// Optionally includes inactive roles based on query flag.
const getRoleById = async (req, res) => {
  try {
    const includeInactive = req.query.includeInactive === "true";
    const filter = { _id: req.params.id };
    // If not including inactive, filter for active role only
    if (!includeInactive) {
      filter.is_active = true;
    }

    const role = await Role.findOne(filter);
    if (!role) {
      return res.status(404).json({ error: "Role not found" });
    }
    res.status(200).json(role);
  } catch (error) {
    console.error("Error fetching role:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Update role by ID
// Allows updating the role name and active flag.
const updateRole = async (req, res) => {
  try {
    const { name, is_active } = req.body;
    const updates = {};

    // Only update provided fields
    if (name) updates.name = name.trim();
    if (typeof is_active === "boolean") updates.is_active = is_active;

    const updatedRole = await Role.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!updatedRole) {
      return res.status(404).json({ error: "Role not found" });
    }

    res.status(200).json({
      message: "Role updated successfully",
      role: updatedRole,
    });
  } catch (error) {
    console.error("Error updating role:", error);
    // Handle duplicate role name error
    if (error.code === 11000) {
      return res.status(400).json({ error: "Role name must be unique" });
    }
    res.status(500).json({ error: "Server error" });
  }
};

// Delete role by ID (soft delete)
// Marks the role as inactive instead of permanently removing it.
const deleteRole = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);

    if (!role) {
      return res.status(404).json({ error: "Role not found" });
    }

    // If already inactive, do not modify it
    if (!role.is_active) {
      return res.status(200).json({ message: "Role already inactive" });
    }

    // Mark as inactive and save
    role.is_active = false;
    await role.save();

    res.status(200).json({ message: "Role soft-deleted successfully" });
  } catch (error) {
    console.error("Error deleting role:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Export all role-related controller functions
module.exports = {
  createRole,
  getAllRoles,
  getRoleById,
  updateRole,
  deleteRole,
};
