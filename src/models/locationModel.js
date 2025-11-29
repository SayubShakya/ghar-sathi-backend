// Location model definition
// Import Mongoose to define schema and model
const mongoose = require("mongoose");

// Define schema for a physical location of a property
const locationSchema = new mongoose.Schema(
  {
    // Optional street address
    street_address: {
      type: String,
      trim: true,
      minlength: [3, "Street address must be at least 3 characters"],
    },
    // Optional area or neighborhood name
    area_name: {
      type: String,
      trim: true,
    },
    // Required city name
    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
    },
    // Optional postal/ZIP code
    postal_code: {
      type: String,
      trim: true,
    },
    // Latitude coordinate with validation
    latitude: {
      type: Number,
      required: [true, "Latitude is required"],
      min: [-90, "Latitude must be greater than or equal to -90"],
      max: [90, "Latitude must be less than or equal to 90"],
    },
    // Longitude coordinate with validation
    longitude: {
      type: Number,
      required: [true, "Longitude is required"],
      min: [-180, "Longitude must be greater than or equal to -180"],
      max: [180, "Longitude must be less than or equal to 180"],
    },
    // Soft delete / active flag
    is_active: {
      type: Boolean,
      default: true,
    },
  },
  {
    // Automatically track when each document is created/updated
    timestamps: { createdAt: "created_date", updatedAt: "updated_date" },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual "id" to expose _id as a string id
locationSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

// Customize JSON output
locationSchema.set("toJSON", {
  virtuals: true,
  transform: (_, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

// Create Location model
const Location = mongoose.model("Location", locationSchema);

// Export Location model
module.exports = Location;
