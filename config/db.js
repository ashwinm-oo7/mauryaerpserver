require("dotenv").config();
const mongoose = require("mongoose");

const requiredEnvVars = [
  "MONGO_USERNAME",
  "MONGO_PASSWORD",
  "MONGO_URI",
  "DB_NAME",
];

requiredEnvVars.forEach((varName) => {
  if (!process.env[varName]) {
    console.error(`Missing environment variable: ${varName}`);
    throw new Error(`Environment variable ${varName} is missing`);
  }
});

const {
  MONGO_USERNAME: username,
  MONGO_PASSWORD: password,
  MONGO_URI: host,
  DB_NAME: dbName,
} = process.env;

const uri = `mongodb+srv://${username}:${encodeURIComponent(
  password
)}@${host}/${dbName}?retryWrites=true&w=majority`;

const connectDB = async () => {
  try {
    await mongoose.connect(uri);
    console.log("MongoDB connected successfully");
  } catch (err) {
    console.error("MongoDB connection failed:", err);
    process.exit(1); // Exit process with failure
  }
};

module.exports = connectDB;
