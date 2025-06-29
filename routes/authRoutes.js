const express = require("express");
const router = express.Router();
const {
  sendOtpController,
  verifyOtpController,
  getVerifiedUsers,
  loginWithOtp,
  sendOtpControllerlogin,
} = require("../controllers/authController");

router.post("/send-otp", sendOtpController);
router.post("/verify-otp", verifyOtpController);
router.get("/verified-users", getVerifiedUsers); // ← Add this
router.post("/login", loginWithOtp);
router.post("/login-otp", sendOtpControllerlogin);
module.exports = router;
