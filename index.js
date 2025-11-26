// index.js
const express = require("express");
const cors = require("cors");
const path = require("path");
const config = require("./src/configs/config");
const db = require("./src/configs/db");
const errorHandler = require("./src/middleware/errorMiddleware");

const app = express();

// Connect to database
db.connect().catch(console.error);

// Basic middleware
const allowedOriginsEnv = process.env.CORS_ORIGINS || "";
const allowedOrigins = allowedOriginsEnv
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) {
      return callback(null, true);
    }

    if (!allowedOrigins.length || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
const authRoutes = require("./src/routes/authRoutes");
const userRoutes = require("./src/routes/userRoutes");
const roleRoutes = require("./src/routes/roleRoutes");
const locationRoutes = require("./src/routes/locationRoutes");
const propertyTypeRoutes = require("./src/routes/propertyTypeRoutes");
const propertyRoutes = require("./src/routes/propertyRoutes");
const statusRoutes = require("./src/routes/statusRoutes");
const bookingRoutes = require("./src/routes/bookingRoutes");
const imageRoutes = require("./src/routes/imageRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/locations", locationRoutes);
app.use("/api/property-types", propertyTypeRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/statuses", statusRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/images", imageRoutes);

// 404 handler (must be before error handler)
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler (must be last middleware)
app.use(errorHandler);

// Start server
const port = config.PORT || 5000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});