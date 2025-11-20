const mongoose = require("mongoose");

const propertyTypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Property type name is required"],
      trim: true,
      unique: true,
      minlength: [2, "Property type name must be at least 2 characters"],
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

propertyTypeSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

propertyTypeSchema.set("toJSON", {
  virtuals: true,
  transform: (_, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

const PropertyType = mongoose.model("PropertyType", propertyTypeSchema);

module.exports = PropertyType;
