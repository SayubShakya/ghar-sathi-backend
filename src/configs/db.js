// Import Mongoose library to interact with MongoDB
const mongoose = require("mongoose");
// Import application configuration (contains MongoDB connection string)
const config = require("./config");

// Object that will hold database helper functions
const db = {};

// Connect to MongoDB
db.connect = async () => {
  try {
    // Use Mongoose to connect using the connection string from config
    await mongoose.connect(config.MONGODB_URI);
    console.log("✅ Database connected successfully");
  } catch (error) {
    // Log the error if connection fails
    console.error("❌ Database connection failed:", error.message);
    // Exit the process if we cannot connect to the database
    process.exit(1);  // Exit if can't connect to DB
  }
};

// Disconnect from MongoDB
db.disconnect = async () => {
  try {
    // Close the current Mongoose connection
    await mongoose.connection.close();
    console.log("ℹ️ Database disconnected");
  } catch (error) {
    // Log any error that happens during disconnection
    console.error("⚠️ Error disconnecting from database:", error.message);
  }
};

// Export the db helper object so other files can call connect() and disconnect()
module.exports = db;