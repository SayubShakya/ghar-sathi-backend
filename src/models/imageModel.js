// Image model definition
// Import Mongoose to define schema and model
const mongoose = require("mongoose");

// Define schema for storing uploaded image metadata
const imageSchema = new mongoose.Schema(
  {
    // Full filesystem path where the image is stored
    path: { type: String, required: true },
    // Original or generated filename of the image
    filename: { type: String, required: true },
    // Soft delete / active flag for the image record
    is_active: { type: Boolean, default: true },
  },
  {
    // Automatically add created_date and updated_date
    timestamps: { createdAt: "created_date", updatedAt: "updated_date" },
  }
);

// Virtual "id" to expose _id as a string
imageSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

// Customize JSON output
imageSchema.set("toJSON", {
  virtuals: true,
  transform: (_, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

// Create ImageModel (collection name: images)
const ImageModel = mongoose.model("images", imageSchema);

// Export ImageModel inside an object (as used in controllers)
module.exports = { ImageModel };