const mongoose = require("mongoose");
const config = require("./config");

const db = {};

// Connect to MongoDB
db.connect = async () => {
  try {
    await mongoose.connect(config.MONGODB_URI);
    console.log("✅ Database connected successfully");
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    process.exit(1);  // Exit if can't connect to DB
  }
};

// Disconnect from MongoDB
db.disconnect = async () => {
  try {
    await mongoose.connection.close();
    console.log("ℹ️ Database disconnected");
  } catch (error) {
    console.error("⚠️ Error disconnecting from database:", error.message);
  }
};

module.exports = db;