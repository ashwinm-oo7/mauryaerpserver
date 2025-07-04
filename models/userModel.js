const mongoose = require("mongoose");

const companySchema = new mongoose.Schema({
  name: String,
  db: String,
  rights: Number,
});

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    otp: { type: String },
    isVerified: { type: Boolean, default: false },
    isAdmin: { type: Boolean, default: false },
    role: { type: String, default: "pending" }, // 'pending', 'approved'
    userAccess: { type: String, default: "User" }, // <--- Add this
    companies: [companySchema], // NEW FIELD
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
