// Main entry point of the backend Express server
// index.js
// Import express framework
const express = require("express");
// Import CORS package to handle cross-origin requests
const cors = require("cors");
// Import path module to work with directory and file paths
const path = require("path");
// Import application configuration (like PORT and other settings)
const config = require("./src/configs/config");
// Import database connection helper
const db = require("./src/configs/db");
// Import custom error handling middleware
const errorHandler = require("./src/middleware/errorMiddleware");

// Create an Express application instance
const app = express();

// Connect to database when server starts
db.connect().catch(console.error);

// Read allowed CORS origins from environment variable CORS_ORIGINS
const allowedOriginsEnv = process.env.CORS_ORIGINS || "";
// Prepare a cleaned-up array of allowed origins
const allowedOrigins = allowedOriginsEnv
  // Split comma-separated origins into an array
  .split(",")
  // Trim extra whitespace from each origin string
  .map((o) => o.trim())
  // Remove any empty strings from the array
  .filter(Boolean);

// CORS configuration options
const corsOptions = {
  // Custom origin check function for each request
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) {
      return callback(null, true);
    }

    // Allow if no specific origins are configured or origin is in the allow list
    if (!allowedOrigins.length || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Otherwise, block the request because origin is not allowed
    return callback(new Error("Not allowed by CORS"));
  },
  // Allow these HTTP methods for CORS requests
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  // Allow these headers to be sent by the client
  allowedHeaders: ["Content-Type", "Authorization"],
};

// Enable CORS with the configured options
app.use(cors(corsOptions));
// Parse incoming JSON request bodies
app.use(express.json());
// Serve static files from the /uploads folder (e.g., images)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Import route modules for different resources
const authRoutes = require("./src/routes/authRoutes");
const userRoutes = require("./src/routes/userRoutes");
const roleRoutes = require("./src/routes/roleRoutes");
const locationRoutes = require("./src/routes/locationRoutes");
const propertyTypeRoutes = require("./src/routes/propertyTypeRoutes");
const propertyRoutes = require("./src/routes/propertyRoutes");
const statusRoutes = require("./src/routes/statusRoutes");
const bookingRoutes = require("./src/routes/bookingRoutes");
const imageRoutes = require("./src/routes/imageRoutes");

// Mount authentication routes under /api/auth
app.use("/api/auth", authRoutes);
// Mount user management routes under /api/users
app.use("/api/users", userRoutes);
// Mount role management routes under /api/roles
app.use("/api/roles", roleRoutes);
// Mount location-related routes under /api/locations
app.use("/api/locations", locationRoutes);
// Mount property type routes under /api/property-types
app.use("/api/property-types", propertyTypeRoutes);
// Mount property routes under /api/properties
app.use("/api/properties", propertyRoutes);
// Mount status routes under /api/statuses
app.use("/api/statuses", statusRoutes);
// Mount booking routes under /api/bookings
app.use("/api/bookings", bookingRoutes);
// Mount image upload and fetch routes under /api/images
app.use("/api/images", imageRoutes);

// 404 handler (must be before error handler)
// This runs when no matching route is found
app.use((req, res) => {
  // Respond with a 404 status and a JSON error message
  res.status(404).json({ error: 'Route not found' });
});

// Error handler (must be last middleware)
// Centralized error handling for all routes
app.use(errorHandler);

// Start server
// Use configured port or default to 5000
const port = config.PORT || 5000;
// Start listening for incoming HTTP requests on the chosen port
app.listen(port, () => {
  // Log to the console that the server has started successfully
  console.log(`Server running on port ${port}`);
});