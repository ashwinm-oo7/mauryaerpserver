// routes/masterRoutes.js

const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Saberpmenu = require("../models/MenuModel");

const dynamicModels = {}; // Cache models

// Get dynamic model based on tablename
const getDynamicModelByTableName = async (tablename) => {
  if (!tablename) throw new Error("Table name not specified");

  if (!dynamicModels[tablename]) {
    const schema = new mongoose.Schema({}, { strict: false });
    dynamicModels[tablename] = mongoose.model(tablename, schema, tablename);
  }

  return dynamicModels[tablename];
};

// Create (Save)
router.post("/save/:tablename", async (req, res) => {
  const { tablename } = req.params;
  const formFields = req.body;

  if (!tablename) return res.status(400).json({ error: "Missing tablename" });

  try {
    // 1. Find the form metadata in saberpmenu
    const formMeta = await Saberpmenu.findOne({ tablename });

    if (!formMeta) {
      return res
        .status(404)
        .json({ error: `No form found for tablename: ${tablename}` });
    }
    const Model = await getDynamicModelByTableName(tablename);
    console.log("formFields", formFields);

    // 2. Validate: if FormType is 'M', then bname is required
    if (formMeta.FormType === "M") {
      if (!formFields.bname || formFields.bname.trim() === "") {
        return res.status(400).json({
          error: `bname is required for Master (M) forms.`,
        });
      }

      // If bname field exists in form, check for duplication
      if ("bname" in formFields) {
        const existing = await Model.findOne({
          bname: formFields?.bname?.trim(),
        });
        if (existing) {
          return res.status(400).json({
            error: `Duplicate entry: '${formFields.bname}' already exists.`,
          });
        }
      }
    }

    const doc = new Model(formFields);
    const saved = await doc.save();
    res.status(201).json({ success: true, data: saved });
  } catch (err) {
    console.error("Error saving form data:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

// GET /api/mastertable/options/:tablename
router.get("/options/:tablename", async (req, res) => {
  const { tablename } = req.params;

  if (!tablename) return res.status(400).json({ error: "Table name required" });

  try {
    const schema = new mongoose.Schema({}, { strict: false });
    const DynamicModel =
      mongoose.models[tablename] ||
      mongoose.model(tablename, schema, tablename);

    const data = await DynamicModel.find({}, { bname: 1 }); // Only return bname

    const options = data.map((item) => ({
      label: item.bname,
      value: item._id,
    }));

    res.json({ success: true, options });
  } catch (err) {
    console.error("Dropdown option fetch error:", err);
    res.status(500).json({ error: err.message || "Server error" });
  }
});

// Get all data for a table
router.get("/options/:tablename/all", async (req, res) => {
  const { tablename } = req.params;
  if (!tablename) return res.status(400).json({ error: "Table name required" });

  try {
    const Model = await getDynamicModelByTableName(tablename);
    const data = await Model.find({});
    res.json({ success: true, data });
  } catch (err) {
    console.error("List fetch error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Delete a record
router.delete("/delete/:tablename/:id", async (req, res) => {
  const { tablename, id } = req.params;
  try {
    const Model = await getDynamicModelByTableName(tablename);
    await Model.findByIdAndDelete(id);
    res.json({ success: true, message: "Deleted" });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Update a record
router.put("/update/:tablename/:id", async (req, res) => {
  const { tablename, id } = req.params;
  const updates = req.body;
  try {
    const Model = await getDynamicModelByTableName(tablename);
    const updated = await Model.findByIdAndUpdate(id, updates, { new: true });
    res.json({ success: true, data: updated });
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
