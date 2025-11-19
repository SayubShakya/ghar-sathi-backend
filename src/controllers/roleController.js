const Role = require("../models/roleModel");

// Create a new role
const createRole = async (req, res) => {
  try {
    const { name, is_active } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Role name is required" });
    }

    const newRole = await Role.create({
      name: name.trim(),
      is_active,
    });

    res.status(201).json({
      message: "Role created successfully",
      role: newRole,
    });
  } catch (error) {
    console.error("Error creating role:", error);
    if (error.code === 11000) {
      return res.status(400).json({ error: "Role name must be unique" });
    }
    res.status(500).json({ error: "Server error" });
  }
};

// Get all roles
const getAllRoles = async (req, res) => {
  try {
    const includeInactive = req.query.includeInactive === "true";
    const filter = includeInactive ? {} : { is_active: true };

    const roles = await Role.find(filter).sort({ created_date: -1 });
    res.status(200).json(roles);
  } catch (error) {
    console.error("Error fetching roles:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Get role by ID
const getRoleById = async (req, res) => {
  try {
    const includeInactive = req.query.includeInactive === "true";
    const filter = { _id: req.params.id };
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
const updateRole = async (req, res) => {
  try {
    const { name, is_active } = req.body;
    const updates = {};

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
    if (error.code === 11000) {
      return res.status(400).json({ error: "Role name must be unique" });
    }
    res.status(500).json({ error: "Server error" });
  }
};

// Delete role by ID
const deleteRole = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);

    if (!role) {
      return res.status(404).json({ error: "Role not found" });
    }

    if (!role.is_active) {
      return res.status(200).json({ message: "Role already inactive" });
    }

    role.is_active = false;
    await role.save();

    res.status(200).json({ message: "Role soft-deleted successfully" });
  } catch (error) {
    console.error("Error deleting role:", error);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = {
  createRole,
  getAllRoles,
  getRoleById,
  updateRole,
  deleteRole,
};
