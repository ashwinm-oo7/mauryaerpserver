require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const connectDB = require("./config/db");
const backupRoute = require("./routes/backupRoute");
const cookieParser = require("cookie-parser");

// Import routes when ready
// const productRoutes = require("./routes/productRoutes");

const app = express();

// Connect to DB
connectDB();

// Middleware
// app.use(cors());
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGIN || process.env.ALLOWED_ORIGIN1,
    credentials: true, // ✅ allows cookies to be sent
  })
);

app.use(morgan("dev"));
app.use(bodyParser.json());
app.use(cookieParser());

// Routes
app.get("/", (req, res) => {
  res.send("Stock Management API is running");
});
const menuRoutes = require("./routes/menuRoutes");
const masterRoutes = require("./routes/masterRoutes");
const adminRoutes = require("./routes/adminRoutes");
const userDataRoutes = require("./routes/userDataRoutes");
const authRoutes = require("./routes/authRoutes");
const attachDB = require("./middleware/attachDB");

app.use("/auth", authRoutes);
// app.use("/user", userDataRoutes);

app.use("/admin", adminRoutes);

app.use("/user", attachDB); // Optional: if needed
app.use("/api/mastertable", attachDB, masterRoutes);
app.use("/api/menus", attachDB, menuRoutes);
app.use("/api/backup", attachDB, backupRoute);

// Other middleware above...

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
