// Import dotenv to load environment variables from a .env file into process.env
const dotenv = require('dotenv');
// Initialize dotenv so that environment variables are available in the app
dotenv.config();

// Central configuration object for the application
const config = {
  // Port number on which the Express server will listen
  PORT: process.env.PORT || 5000,
  // MongoDB connection string (e.g. from .env file)
  MONGODB_URI:
    process.env.MONGODB_URI ,
  // Secret key used to sign and verify JWT tokens
  JWT_SECRET: process.env.JWT_SECRET ,
  // JWT token expiration time (e.g. "1d", "2h")
  JWT_EXPIRATION: process.env.JWT_EXPIRATION ,
 
};

// Export the config object so it can be used throughout the project
module.exports = config;

