// index.js
const express = require("express");
const cors = require("cors");
const config = require("./src/configs/config");
const db = require("./src/configs/db");
const errorHandler = require("./src/middleware/errorMiddleware");

const app = express();

// Connect to database
db.connect().catch(console.error);

// Basic middleware
app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require("./src/routes/authRoutes");
const userRoutes = require("./src/routes/userRoutes");
const roleRoutes = require("./src/routes/roleRoutes");
const locationRoutes = require("./src/routes/locationRoutes");
const propertyTypeRoutes = require("./src/routes/propertyTypeRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/locations", locationRoutes);
app.use("/api/property-types", propertyTypeRoutes);

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