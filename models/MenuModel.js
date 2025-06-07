const mongoose = require("mongoose");

const menuSchema = new mongoose.Schema(
  {
    bname: { type: String, required: true },
    tablename: { type: String },
    MenuName: { type: String, default: null }, // If it's a submenu or nested, reference to parent
    ParentSubmenuName: { type: String, default: null }, // Optional
    FormType: {
      type: String,
      enum: ["M", "T", "R", "I"],
      default: "M",
      required: true,
    },

    Active: { type: Boolean, default: true },
    // 👇 New: Dynamic controls array
    controls: [
      {
        controlType: {
          type: String,
          enum: ["input", "checkbox", "dropdown"],
          required: true,
        },
        label: { type: String, required: true },
        options: [String], // optional for dropdowns
      },
    ],
  },
  { timestamps: true }
);

// Collection name: saberpmenu
module.exports = mongoose.model("saberpmenu", menuSchema);
