const express = require("express");
const router = express.Router();
const {
  sendOtpController,
  verifyOtpController,
  getVerifiedUsers,
  loginWithOtp,
  sendOtpControllerlogin,
} = require("../controllers/authController");
const jwt = require("jsonwebtoken");

router.post("/send-otp", sendOtpController);
router.post("/verify-otp", verifyOtpController);
router.get("/verified-users", getVerifiedUsers); // ← Add this
router.post("/login", loginWithOtp);
router.post("/login-otp", sendOtpControllerlogin);

router.post("/refresh", async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) return res.status(401).json({ message: "No refresh token" });

  try {
    const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    const newToken = jwt.sign(decoded, process.env.JWT_SECRET, {
      expiresIn: "600m",
    });

    res.json({ token: newToken });
  } catch (err) {
    res.status(403).json({ message: "Invalid refresh token" });
  }
});

module.exports = router;
