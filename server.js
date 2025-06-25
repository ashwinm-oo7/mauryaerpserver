require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const connectDB = require("./config/db");
const backupRoute = require("./routes/backupRoute");

// Import routes when ready
// const productRoutes = require("./routes/productRoutes");

const app = express();

// Connect to DB
connectDB();

// Middleware
app.use(cors());
app.use(morgan("dev"));
app.use(bodyParser.json());

// Routes
app.get("/", (req, res) => {
  res.send("Stock Management API is running");
});
const menuRoutes = require("./routes/menuRoutes");
const masterRoutes = require("./routes/masterRoutes");

app.use("/api/mastertable", masterRoutes);
app.use("/api", backupRoute);

// Other middleware above...
app.use("/api/menus", menuRoutes);

// Example to mount routes when ready
// app.use("/api/products", productRoutes);

// Error handling middleware (catch all errors)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something broke!" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
