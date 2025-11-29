// PropertyType model definition
// Import Mongoose to define schema and model
const mongoose = require("mongoose");

// Define schema for a type of property (e.g., ROOM, FLAT, HOUSE)
const propertyTypeSchema = new mongoose.Schema(
  {
    // Name of the property type
    name: {
      type: String,
      required: [true, "Property type name is required"],
      trim: true,
      unique: true,
      minlength: [2, "Property type name must be at least 2 characters"],
    },
    // Soft delete / active flag
    is_active: {
      type: Boolean,
      default: true,
    },
  },
  {
    // Automatically add created_date and updated_date
    timestamps: { createdAt: "created_date", updatedAt: "updated_date" },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual "id" to expose _id as id
propertyTypeSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

// Customize JSON transform
propertyTypeSchema.set("toJSON", {
  virtuals: true,
  transform: (_, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

// Create PropertyType model
const PropertyType = mongoose.model("PropertyType", propertyTypeSchema);

// Export PropertyType model
module.exports = PropertyType;
