const AuditLog = require("../models/AuditLog");
const User = require("../models/userModel");

exports.getVerifiedUseradmin = async (req, res) => {
  try {
    const page = parseInt(req.query.page || "1", 10);
    const limit = parseInt(req.query.limit || "10", 10);
    const skip = (page - 1) * limit;

    const totalUsers = await User.countDocuments({ isVerified: true });
    const users = await User.find({ isVerified: true })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    //   .select("_id email role isVerified createdAt");

    const totalPages = Math.ceil(totalUsers / limit);

    return res.json({
      users,
      page,
      totalPages,
    });
  } catch (err) {
    console.error("Error fetching verified users:", err);
    return res
      .status(500)
      .json({ success: false, message: "Server error fetching users" });
  }
};

exports.assignAccesswait = async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(userId);
    const { role, companies, userAccess } = req.body;

    if (!userId || !Array.isArray(companies) || companies.length === 0) {
      return res.status(400).json({ success: false, message: "Invalid data" });
    }

    const user = await User.findById(userId);
    console.log("Findbyid", user);
    if (!user || !user.isVerified) {
      return res
        .status(404)
        .json({ success: false, message: "User not found or not verified" });
    }

    user.companies = companies;
    user.role = role;
    user.userAccess = userAccess; // Save the new field

    await user.save();

    return res.json({ success: true, message: "Access assigned successfully" });
  } catch (err) {
    console.error("Assign access error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
exports.assignAccess = async (req, res) => {
  try {
    const { userId } = req.params;
    const update = req.body;

    const user = await User.findByIdAndUpdate(userId, update, { new: true });

    await AuditLog.create({
      action: "AssignAccess",
      userEmail: req.user.email,
      userId: req.user.userId,
      details: { assignedTo: user.email, updates: update },
    });

    res.json({ success: true, message: "Access updated", user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error assigning access" });
  }
};
exports.getVerifiedUserswait = async (req, res) => {
  try {
    const users = await User.find({ isVerified: true });
    res.json(users);
  } catch (err) {
    console.error("Get verified users error:", err);
    res.status(500).json({ message: "Failed to fetch users" });
  }
};
