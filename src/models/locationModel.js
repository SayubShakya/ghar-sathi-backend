const mongoose = require("mongoose");

const locationSchema = new mongoose.Schema(
  {
    street_address: {
      type: String,
      trim: true,
      minlength: [3, "Street address must be at least 3 characters"],
    },
    area_name: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
    },
    postal_code: {
      type: String,
      trim: true,
    },
    latitude: {
      type: Number,
      required: [true, "Latitude is required"],
      min: [-90, "Latitude must be greater than or equal to -90"],
      max: [90, "Latitude must be less than or equal to 90"],
    },
    longitude: {
      type: Number,
      required: [true, "Longitude is required"],
      min: [-180, "Longitude must be greater than or equal to -180"],
      max: [180, "Longitude must be less than or equal to 180"],
    },
    is_active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: { createdAt: "created_date", updatedAt: "updated_date" },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

locationSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

locationSchema.set("toJSON", {
  virtuals: true,
  transform: (_, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

const Location = mongoose.model("Location", locationSchema);

module.exports = Location;
