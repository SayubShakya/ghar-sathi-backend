// Booking model definition
// Import Mongoose to define schema and model
const mongoose = require("mongoose");

// Define schema for a booking record
const bookingSchema = new mongoose.Schema(
  {
    // Reference to the booked property
    property_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: [true, "Property is required"],
    },
    // Reference to the user who made the booking
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
    },
    // Booking start date
    start_date: {
      type: Date,
      required: [true, "Start date is required"],
    },
    // Booking end date with validation to ensure it is after start_date
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
    // Reference to Status document
    status_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Status",
      required: [true, "Status is required"],
    },
    // Total rent amount for the whole booking period
    total_rent: {
      type: Number,
      required: [true, "Total rent is required"],
      min: [0, "Total rent cannot be negative"],
    },
    // Soft delete / active flag
    is_active: {
      type: Boolean,
      default: true,
    },
  },
  {
    // Automatically manage created_date and updated_date
    timestamps: { createdAt: "created_date", updatedAt: "updated_date" },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual "id" to expose _id as a string
bookingSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

// Customize JSON output
bookingSchema.set("toJSON", {
  virtuals: true,
  transform: (_, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

// Create Booking model
const Booking = mongoose.model("Booking", bookingSchema);

// Export Booking model
module.exports = Booking;
