const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    bname: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CategoryMaster", categorySchema);
