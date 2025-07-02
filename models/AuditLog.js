// models/AuditLog.js
const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema({
  action: String,
  userEmail: String,
  userId: mongoose.Schema.Types.ObjectId,
  timestamp: { type: Date, default: Date.now },
  details: mongoose.Schema.Types.Mixed,
});

module.exports = mongoose.model("AuditLog", auditLogSchema);
