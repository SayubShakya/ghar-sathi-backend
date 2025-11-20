const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    property_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: [true, "Property is required"],
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
    },
    start_date: {
      type: Date,
      required: [true, "Start date is required"],
    },
    end_date: {
      type: Date,
      required: [true, "End date is required"],
      validate: {
        validator: function (value) {
          if (!this.start_date || !value) return true;
          return value >= this.start_date;
        },
        message: "End date cannot be before start date",
      },
    },
    status_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Status",
      required: [true, "Status is required"],
    },
    total_rent: {
      type: Number,
      required: [true, "Total rent is required"],
      min: [0, "Total rent cannot be negative"],
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

bookingSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

bookingSchema.set("toJSON", {
  virtuals: true,
  transform: (_, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

const Booking = mongoose.model("Booking", bookingSchema);

module.exports = Booking;
