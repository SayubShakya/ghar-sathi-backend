const mongoose = require("mongoose");

const imageSchema = new mongoose.Schema(
  {
    path: { type: String, required: true },
    filename: { type: String, required: true },
    is_active: { type: Boolean, default: true },
  },
  {
    timestamps: { createdAt: "created_date", updatedAt: "updated_date" },
  }
);

imageSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

imageSchema.set("toJSON", {
  virtuals: true,
  transform: (_, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

const ImageModel = mongoose.model("images", imageSchema);

module.exports = { ImageModel };