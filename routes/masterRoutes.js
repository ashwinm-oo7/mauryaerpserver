// routes/masterRoutes.js

const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Saberpmenu = require("../models/MenuModel");
const menuSchema = require("../models/MenuModel").schema;

const {
  generateSabid,
  getFinancialYearYCode,
  generateSabidMenu,
} = require("../utils/sabidGenerator");
const getModel = require("../utils/getModel");
const modelCache = new Map();

const dynamicModels = {}; // Cache models

// 🔁 Sequence generator
const generateNextSequence = async (Model, fieldLabel, formatPattern) => {
  const prefixMatch = formatPattern.match(/^\D*/)?.[0] || "";
  const numberLength = formatPattern.length - prefixMatch.length;

  // Search latest document with matching prefix
  const latestDoc = await Model.findOne({
    [fieldLabel]: { $regex: `^${prefixMatch}` },
  })
    .sort({ [fieldLabel]: -1 })
    .lean();

  let nextNumber = 1;

  if (latestDoc && latestDoc[fieldLabel]) {
    const latestVal = latestDoc[fieldLabel].slice(prefixMatch.length);
    const parsed = parseInt(latestVal, 10);
    if (!isNaN(parsed)) {
      nextNumber = parsed + 1;
    }
  }

  const padded = String(nextNumber).padStart(numberLength, "0");
  return `${prefixMatch}${padded}`;
};

const getDynamicModelByTableName = (tablename, dbConn) => {
  const dbName = dbConn.name;
  const key = `${dbName}_${tablename}`;

  if (!modelCache.has(key)) {
    const schema = new mongoose.Schema({}, { strict: false });
    const model = dbConn.model(tablename, schema, tablename);
    modelCache.set(key, model);
  }

  return modelCache.get(key);
};

const getDynamicModelByTableNamewait = async (tablename, dbConn) => {
  if (!tablename) throw new Error("Table name not specified");

  if (!dbConn.dynamicModels[tablename]) {
    if (mongoose.models[tablename]) {
      dbConn.dynamicModels[tablename] = mongoose.model(tablename); // Use existing compiled model
    } else {
      const schema = new mongoose.Schema({}, { strict: false });
      dbConn.dynamicModels[tablename] = mongoose.model(
        tablename,
        schema,
        tablename
      );
    }
  }

  return dynamicModels[tablename];
};

// Create (Save)
router.post("/save/:tablename", async (req, res) => {
  const { tablename } = req.params;
  const formFields = req.body;
  const Saberpmenu = getModel(req, "Menu", menuSchema, "saberpmenus");

  if (!tablename) return res.status(400).json({ error: "Missing tablename" });

  try {
    // 1. Find the form metadata in saberpmenu
    const formMeta = await Saberpmenu.findOne({ tablename });

    if (!formMeta) {
      return res
        .status(404)
        .json({ error: `No form found for tablename: ${tablename}` });
    }
    const Model = await getDynamicModelByTableName(tablename, req.dbConn);
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

    // 💡 Auto generate sequence if entnoFormat is provided
    for (const key in formFields) {
      if (key.toLowerCase().includes("format")) {
        const targetField = key.replace(/format$/i, "");
        const formatPattern = formFields[key];

        // Only set if the value doesn't already exist (user can overwrite manually)
        if (!formFields[targetField]) {
          formFields[targetField] = await generateNextSequence(
            Model,
            targetField,
            formatPattern
          );
        }

        // Clean up: remove format key from payload
        delete formFields[key];
      }
    }

    if (!formFields.sabid) {
      formFields.sabid = await generateSabid(tablename);
    }
    if (!formFields.pid) {
      formFields.pid = await generateSabidMenu(tablename);
    }

    if (!formFields.ycode) {
      formFields.ycode = getFinancialYearYCode();
    }
    const doc = new Model(formFields);
    console.log("FinalValue", doc);

    const saved = await doc.save();
    res.status(201).json({ success: true, data: saved });
  } catch (err) {
    console.error("Error saving form data:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});
// Update a record
router.put("/update/:tablename/:id", async (req, res) => {
  const { tablename, id } = req.params;
  const updates = req.body;
  try {
    const Model = await getDynamicModelByTableName(tablename, req.dbConn);
    const updated = await Model.findByIdAndUpdate(id, updates, { new: true });
    res.json({ success: true, data: updated });
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/mastertable/options/:tablename
router.get("/options/:tablename", async (req, res) => {
  const { tablename } = req.params;

  if (!tablename) return res.status(400).json({ error: "Table name required" });

  try {
    const schema = new mongoose.Schema({}, { strict: false });
    // const DynamicModel =
    //   mongoose.models[tablename] ||
    //   mongoose.model(tablename, schema, tablename);

    const DynamicModel = await getDynamicModelByTableName(
      tablename,
      req.dbConn
    );

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
    const Model = await getDynamicModelByTableName(tablename, req.dbConn);
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
    const Model = await getDynamicModelByTableName(tablename, req.dbConn);
    await Model.findByIdAndDelete(id);
    res.json({ success: true, message: "Deleted" });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
