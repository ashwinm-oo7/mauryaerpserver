const User = require("../models/userModel");

exports.assignAccess = async (req, res) => {
  try {
    const { userId, companies } = req.body;

    if (!userId || !Array.isArray(companies) || companies.length === 0) {
      return res.status(400).json({ success: false, message: "Invalid data" });
    }

    const user = await User.findById(userId);
    if (!user || !user.isVerified) {
      return res
        .status(404)
        .json({ success: false, message: "User not found or not verified" });
    }

    user.companies = companies;
    user.role = "approved";
    await user.save();

    return res.json({ success: true, message: "Access assigned successfully" });
  } catch (err) {
    console.error("Assign access error:", err);
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
