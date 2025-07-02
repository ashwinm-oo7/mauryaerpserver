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
  const logs = await AuditLog.find().sort({ timestamp: -1 }).limit(100);
  res.json({ success: true, logs });
});

module.exports = router;
