const express = require("express");
const router = express.Router();
const {
  sendOtpController,
  verifyOtpController,
  getVerifiedUsers,
  loginWithOtp,
  sendOtpControllerlogin,
  refreshAccessToken,
  logout,
} = require("../controllers/authController");
const jwt = require("jsonwebtoken");

router.post("/send-otp", sendOtpController);
router.post("/verify-otp", verifyOtpController);
router.get("/verified-users", getVerifiedUsers); // ← Add this
router.post("/login", loginWithOtp);
router.post("/login-otp", sendOtpControllerlogin);

router.post("/refresh-token", refreshAccessToken);
router.post("/logout", logout);

module.exports = router;
