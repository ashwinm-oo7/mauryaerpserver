const express = require("express");
const router = express.Router();
const {
  assignAccess,
  getVerifiedUsers,
} = require("../controllers/adminController");

// GET verified users
router.get("/verified-users", getVerifiedUsers);

// POST assign access to user
router.post("/assign-access", assignAccess);

module.exports = router;
