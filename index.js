const express = require("express");
const app = express();
const config = require("./src/configs/config");
const db = require("./src/configs/db");

// use cors
const cors = require("cors");
app.use(cors());

// middleware to parse JSON request bodies
app.use(express.json());

// database connection
db.connect();

// routes
const authRoutes = require("./src/routes/authRoutes");

app.use("/api/auth/v1", authRoutes);
// app.use("/api/posts/v1", postRoutes);

const port = config.PORT;

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
