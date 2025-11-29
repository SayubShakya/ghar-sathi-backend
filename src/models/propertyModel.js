// Property model definition
// Import Mongoose to define schema and model
const mongoose = require("mongoose");

// Define schema for a property listing
const propertySchema = new mongoose.Schema(
  {
    // Title of the property
    property_title: {
      type: String,
      required: [true, "Property title is required"],
      trim: true,
      minlength: [3, "Property title must be at least 3 characters"],
    },
    // Optional detailed description
    detailed_description: {
      type: String,
      trim: true,
    },
    // Reference to stored image document
    image_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "images",
    },
    // Monthly rent amount
    rent: {
      type: Number,
      required: [true, "Rent is required"],
      min: [0, "Rent cannot be negative"],
    },
    // Reference to Location document
    location_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Location",
      required: [true, "Location is required"],
    },
    // Reference to Status document (AVAILABLE, BOOKING, etc.)
    status_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Status",
      required: [true, "Status is required"],
    },
    // Reference to User document (owner/landlord)
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
    },
    // Reference to PropertyType document
    property_types_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PropertyType",
      required: [true, "Property type is required"],
    },
    // Soft delete / active flag
    is_active: {
      type: Boolean,
      default: true,
    },
  },
  {
    // Automatically track creation and update timestamps
    timestamps: { createdAt: "created_date", updatedAt: "updated_date" },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual "id" field to expose _id as id
propertySchema.virtual("id").get(function () {
  return this._id.toHexString();
});

// Customize JSON representation of property documents
propertySchema.set("toJSON", {
  virtuals: true,
  transform: (_, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

// Create Property model
const Property = mongoose.model("Property", propertySchema);

// Export Property model
module.exports = Property;
