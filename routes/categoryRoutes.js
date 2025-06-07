const express = require("express");
const router = express.Router();
const Category = require("../models/CategoryMaster");

// Create
router.post("/", async (req, res) => {
  try {
    const category = new Category({ bname: req.body.bname });
    await category.save();
    res.status(201).json(category);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Read all
router.get("/", async (req, res) => {
  const categories = await Category.find();
  res.json(categories);
});

// Update
router.put("/:id", async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { bname: req.body.bname },
      { new: true }
    );
    res.json(category);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete
router.delete("/:id", async (req, res) => {
  await Category.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

module.exports = router;
