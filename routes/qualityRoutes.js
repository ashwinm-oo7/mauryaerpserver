// routes/masterRoutes.js
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Saberpmenu = require("../models/MenuModel");

const dynamicModels = {}; // Cache to avoid redefining models

const getDynamicModel = async (bname) => {
  const formMeta = await Saberpmenu.findOne({ bname });
  if (!formMeta || !formMeta.tablename) {
    throw new Error("Form metadata not found");
  }
  const tableName = formMeta.tablename;

  if (!dynamicModels[tableName]) {
    const schema = new mongoose.Schema({}, { strict: false });
    dynamicModels[tableName] = mongoose.model(tableName, schema, tableName);
  }
  return dynamicModels[tableName];
};

// Create
router.post("/", async (req, res) => {
  const { bname, ...formFields } = req.body;
  if (!bname) return res.status(400).json({ error: "Missing bname" });
  try {
    const Model = await getDynamicModel(bname);
    const doc = new Model(formFields);
    const saved = await doc.save();
    res.status(201).json({ success: true, data: saved });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Read (list all)
router.get("/:bname", async (req, res) => {
  const { bname } = req.params;
  try {
    const Model = await getDynamicModel(bname);
    const list = await Model.find().sort({ createdAt: -1 });
    res.json({ success: true, data: list });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Read single
router.get("/:bname/:id", async (req, res) => {
  const { bname, id } = req.params;
  try {
    const Model = await getDynamicModel(bname);
    const item = await Model.findById(id);
    if (!item) return res.status(404).json({ error: "Item not found" });
    res.json({ success: true, data: item });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update
router.put("/:bname/:id", async (req, res) => {
  const { bname, id } = req.params;
  const updates = req.body;
  try {
    const Model = await getDynamicModel(bname);
    const updated = await Model.findByIdAndUpdate(id, updates, { new: true });
    if (!updated) return res.status(404).json({ error: "Item not found" });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete
router.delete("/:bname/:id", async (req, res) => {
  const { bname, id } = req.params;
  try {
    const Model = await getDynamicModel(bname);
    const deleted = await Model.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ error: "Item not found" });
    res.json({ success: true, data: deleted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
