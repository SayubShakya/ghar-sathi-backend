// User model definition using Mongoose
// Import Mongoose to define schema and model
const mongoose = require("mongoose");
// Import bcryptjs to hash and compare passwords
const bcrypt = require("bcryptjs");

// Define the shape of a User document
const userSchema = new mongoose.Schema(
  {
    // First name of the user
    first_name: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
      minlength: [2, "First name must be at least 2 characters"],
    },
    // Last name of the user
    last_name: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
      minlength: [2, "Last name must be at least 2 characters"],
    },
    // Unique email address used for login
    email_address: {
      type: String,
      required: [true, "Email address is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
    },
    // Hashed password (never store plain password)
    password_hash: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters long"],
      // By default, do not include this field when querying
      select: false,
    },
    // Optional phone number
    phone_number: {
      type: String,
      trim: true,
    },
    // Reference to Role document (role of the user)
    role_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
      required: [true, "Role is required"],
    },
    // URL or path to profile picture
    profile_picture_image: {
      type: String,
      trim: true,
    },
    // Soft delete / active flag
    is_active: {
      type: Boolean,
      default: true,
    },
  },
  {
    // Automatically manage created_date and updated_date fields
    timestamps: { createdAt: "created_date", updatedAt: "updated_date" },
    // Include virtuals when converting to JSON
    toJSON: { virtuals: true },
    // Include virtuals when converting to plain objects
    toObject: { virtuals: true },
  }
);

// Virtual field "id" that mirrors _id as a hex string
userSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

// Customize how user documents are converted to JSON
userSchema.set("toJSON", {
  virtuals: true,
  transform: (_, ret) => {
    // Expose id instead of _id
    ret.id = ret._id;
    // Remove internal MongoDB fields
    delete ret._id;
    delete ret.__v;
    // Never expose password hash in API responses
    delete ret.password_hash;
    return ret;
  },
});

// Pre-save hook: hash password_hash before saving if it was modified
userSchema.pre("save", async function (next) {
  // If password_hash is not changed, skip hashing
  if (!this.isModified("password_hash")) return next();

  try {
    // Generate salt and hash the password
    const salt = await bcrypt.genSalt(10);
    this.password_hash = await bcrypt.hash(this.password_hash, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method: compare a plain password with the stored hash
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password_hash);
};

// Static method: find a user by email and include password_hash field
userSchema.statics.findByEmailAddress = function (emailAddress) {
  return this.findOne({ email_address: emailAddress }).select("+password_hash");
};

// Create the User model from the schema
const User = mongoose.model("User", userSchema);

// Export the User model so it can be used in controllers and middleware
module.exports = User;