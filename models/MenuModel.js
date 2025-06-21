const mongoose = require("mongoose");

const menuSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["menu", "submenu", "form"],
      required: true,
    },
    pid: { type: String, unique: true },
    bname: { type: String, required: true },
    tablename: { type: String },
    MenuName: { type: String, default: null }, // If it's a submenu or nested, reference to parent
    ParentSubmenuName: { type: String, default: null }, // Optional
    FormType: {
      type: String,
      enum: ["M", "MD", "T", "R", "I"],
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
        options: [String], // optional for dropdowns or input
        required: { type: Boolean, default: false },
        sabtable: { type: String }, // optional, only for dropdown
        dataType: {
          type: String,
          enum: ["nvarchar", "int", "bigint", "decimal", "date", "sequence"],
        },
        size: { type: Number }, // e.g., 4 for int
        decimals: { type: Number }, // e.g., 2 for decimal
        length: { type: Number },
        defaultDateOption: {
          type: String,
          enum: ["currentDate"],
        },

        conditionalVisibility: { type: String },
        readOnly: { type: Boolean, default: false },
        entnoFormat: { type: String },
        autoGenerate: { type: Boolean },
      },
    ],
  },
  { timestamps: true }
);

// Collection name: saberpmenu
module.exports = mongoose.model("saberpmenu", menuSchema);
