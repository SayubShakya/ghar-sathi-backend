// Role model definition
// Import Mongoose to create schema and model
const mongoose = require("mongoose");

// Define the schema for a Role document
const roleSchema = new mongoose.Schema(
  {
    // Name of the role (e.g., ADMIN, LANDLORD, ROOM_SEEKER)
    name: {
      type: String,
      required: [true, "Role name is required"],
      trim: true,
      unique: true,
      minlength: [2, "Role name must be at least 2 characters long"],
    },
    // Flag to indicate if the role is active
    is_active: {
      type: Boolean,
      default: true,
    },
  },
  {
    // Automatically store created and updated timestamps
    timestamps: { createdAt: "created_date", updatedAt: "updated_date" },
    // Include virtual fields when converting to JSON and plain objects
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual "id" field to expose _id as id
roleSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

// Customize JSON output
roleSchema.set("toJSON", {
  virtuals: true,
  transform: (_, ret) => {
    // Map _id to id and remove internal fields
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

// Create the Role model
const Role = mongoose.model("Role", roleSchema);

// Export the Role model for use in controllers
module.exports = Role;
