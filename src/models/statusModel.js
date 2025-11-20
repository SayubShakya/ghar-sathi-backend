const mongoose = require("mongoose");

const statusSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Status name is required"],
      trim: true,
      unique: true,
      minlength: [2, "Status name must be at least 2 characters"],
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

statusSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

statusSchema.set("toJSON", {
  virtuals: true,
  transform: (_, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

const Status = mongoose.model("Status", statusSchema);

module.exports = Status;
