// attachDB.js;
const jwt = require("jsonwebtoken");
const getConnection = require("../utils/dbSwitcher");
const { db } = require("../models/MenuModel");
require("dotenv").config();

module.exports = async (req, res, next) => {
  try {
    const dbName = req.headers["x-db-name"];
    const token = req.headers.authorization?.split(" ")[1];

    // console.log("Incoming dbName:", dbName);
    // console.log("Authorization Header:", req.headers.authorization);

    if (!token) {
      console.error("Missing token");
      return res.status(401).json({ message: "Unauthorized - no token" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // console.log("Decoded JWT:", decoded);

    const allowedDbs = decoded.dbs.map(String);
    const incomingDb = String(dbName);

    // console.log("Allowed DBs:", allowedDbs);
    // console.log("Incoming DB:", incomingDb);

    if (!allowedDbs.includes(incomingDb)) {
      console.error("Access denied: DB mismatch");
      return res.status(403).json({ message: "Access denied to this DB" });
    }

    req.dbConn = getConnection(incomingDb);
    req.user = decoded;
    next();
  } catch (err) {
    console.error("DB middleware error:", err);
    res
      .status(401)
      .json({ message: "Unauthorized - token invalid", error: err.message });
  }
};
