const User = require("../models/userModel");
const { isValidGmail } = require("../utils/sabidGenerator");
const sendOtp = require("../utils/sendOtp");

const jwt = require("jsonwebtoken");
const generateOtp = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

exports.loginWithOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      console.log("❌ User not found");
      return res
        .status(404)
        .json({ success: false, message: "Invalid credentials" });
    }

    if (user.otp !== otp) {
      console.log("❌ OTP does not match", { sent: user.otp, received: otp });
      return res
        .status(400)
        .json({ success: false, message: "Invalid credentials" });
    }

    if (!user.isVerified) {
      console.log("❌ User not verified yet");
      return res.status(403).json({ success: false, message: "Not verified" });
    }
    const payload = {
      userId: user._id,
      email: user.email,
      dbs: user.companies.map((c) => c.db),
      isAdmin: user.isAdmin,
      role: user.role,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    user.otp = null;
    await user.save();

    return res.json({
      success: true,
      token,
      email: user.email, // add this
      isAdmin: user.isAdmin,
      companies: user.companies,
      dbs: user.companies.map((c) => c.db),
      message: "Login successful",
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.sendOtpController = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !email.endsWith("@gmail.com"))
      return res.status(400).json({ success: false, message: "Invalid Gmail" });

    const otp = generateOtp();

    let user = await User.findOne({ email });
    if (!user) {
      user = new User({ email, otp });
    } else {
      user.otp = otp;
      user.isVerified = false;
    }

    await user.save();
    await sendOtp(email, otp);

    return res.json({ success: true, message: "OTP sent to email" });
  } catch (err) {
    console.error("Send OTP error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
exports.sendOtpControllerlogin = async (req, res) => {
  try {
    const { email } = req.body;
    if (!isValidGmail(email))
      return res
        .status(400)
        .json({ success: false, message: "Invalid Gmail address" });

    if (!email || !email.endsWith("@gmail.com"))
      return res.status(400).json({ success: false, message: "Invalid Gmail" });

    const otp = generateOtp();

    let user = await User.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    user.otp = otp;
    await user.save();

    await sendOtp(email, otp);

    return res.json({ success: true, message: "OTP sent to email" });
  } catch (err) {
    console.error("Send OTP error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.verifyOtpController = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });
    if (!user || user.otp !== otp) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    user.isVerified = true;
    user.otp = null;
    await user.save();

    return res.json({ success: true, message: "Verification successful" });
  } catch (err) {
    console.error("Verify OTP error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
exports.getVerifiedUsers = async (req, res) => {
  try {
    const users = await User.find({ isVerified: true });
    res.json(users);
  } catch (err) {
    console.error("Get verified users error:", err);
    res.status(500).json({ message: "Failed to fetch users" });
  }
};
