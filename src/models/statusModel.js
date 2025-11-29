// Status model definition
// Import Mongoose to define schema and model
const mongoose = require("mongoose");

// Define schema for Status (e.g., AVAILABLE, BOOKING, etc.)
const statusSchema = new mongoose.Schema(
  {
    // Name of the status
    name: {
      type: String,
      required: [true, "Status name is required"],
      trim: true,
      unique: true,
      minlength: [2, "Status name must be at least 2 characters"],
    },
    // Soft delete flag
    is_active: {
      type: Boolean,
      default: true,
    },
  },
  {
    // Add created_date and updated_date timestamp fields
    timestamps: { createdAt: "created_date", updatedAt: "updated_date" },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual "id" to return _id as a simple string
statusSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

// Customize JSON output
statusSchema.set("toJSON", {
  virtuals: true,
  transform: (_, ret) => {
    // Expose id instead of _id and remove internal fields
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

// Create Status model
const Status = mongoose.model("Status", statusSchema);

// Export Status model
module.exports = Status;
