const express = require("express");
const router = express.Router();
const {
  assignAccess,
  getVerifiedUseradmin,
} = require("../controllers/adminController");
const verifyToken = require("../middleware/authMiddleware");

// middleware/isAdmin.js
const isAdmin = (req, res, next) => {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ success: false, message: "Admin only" });
  }
  next();
};

router.get("/verified-users", verifyToken, isAdmin, getVerifiedUseradmin);
router.post("/assign-access/:userId", verifyToken, isAdmin, assignAccess);

module.exports = router;
