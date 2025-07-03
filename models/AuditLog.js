// models/AuditLog.js
const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema({
  action: String,
  userEmail: String,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  status: String, // "SUCCESS" or "FAILURE"
  ipAddress: String,
  userAgent: String,
  message: String, // optional notes
  timestamp: { type: Date, default: Date.now },
  details: mongoose.Schema.Types.Mixed,
});

module.exports = mongoose.model("AuditLog", auditLogSchema);
