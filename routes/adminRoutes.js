const express = require("express");
const router = express.Router();
const {
  assignAccess,
  getVerifiedUseradmin,
} = require("../controllers/adminController");
const verifyToken = require("../middleware/authMiddleware");
const AuditLog = require("../models/AuditLog");

// middleware/isAdmin.js
const isAdmin = (req, res, next) => {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ success: false, message: "Admin only" });
  }
  next();
};

router.get("/verified-users", verifyToken, isAdmin, getVerifiedUseradmin);
router.post("/assign-access/:userId", verifyToken, isAdmin, assignAccess);
router.get("/audit-logs", verifyToken, isAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, start, end } = req.query;

    const query = {};
    if (status) query.status = status;
    if (start || end) {
      query.timestamp = {};
      if (start) query.timestamp.$gte = new Date(start);
      if (end) query.timestamp.$lte = new Date(end);
    }

    const logs = await AuditLog.find(query)
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await AuditLog.countDocuments(query);
    res.json({ success: true, logs, total });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch logs" });
  }
});

module.exports = router;
