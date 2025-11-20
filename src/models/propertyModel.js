const mongoose = require("mongoose");

const propertySchema = new mongoose.Schema(
  {
    property_title: {
      type: String,
      required: [true, "Property title is required"],
      trim: true,
      minlength: [3, "Property title must be at least 3 characters"],
    },
    detailed_description: {
      type: String,
      trim: true,
    },
    cover_image_url: {
      type: String,
      trim: true,
    },
    rent: {
      type: Number,
      required: [true, "Rent is required"],
      min: [0, "Rent cannot be negative"],
    },
    location_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Location",
      required: [true, "Location is required"],
    },
    status: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Status",
      required: [true, "Status is required"],
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
    },
    property_types_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PropertyType",
      required: [true, "Property type is required"],
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

propertySchema.virtual("id").get(function () {
  return this._id.toHexString();
});

propertySchema.set("toJSON", {
  virtuals: true,
  transform: (_, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

const Property = mongoose.model("Property", propertySchema);

module.exports = Property;
