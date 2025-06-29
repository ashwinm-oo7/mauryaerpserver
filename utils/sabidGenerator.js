const mongoose = require("mongoose");

const dynamicModels = {}; // Cache for dynamic models

const getModel = async (tablename) => {
  if (!tablename) throw new Error("Table name is required");

  if (!dynamicModels[tablename]) {
    if (mongoose.models[tablename]) {
      dynamicModels[tablename] = mongoose.model(tablename);
    } else {
      const schema = new mongoose.Schema({}, { strict: false });
      dynamicModels[tablename] = mongoose.model(tablename, schema, tablename);
    }
  }

  return dynamicModels[tablename];
};
// Counter schema (used only internally)
const counterSchema = new mongoose.Schema(
  {
    _id: { type: String }, // e.g., "saberpmenus-25"
    seq: { type: Number, default: 0 },
  },
  { collection: "counters" }
);
const Counter =
  mongoose.models.Counter || mongoose.model("Counter", counterSchema);

const generateSabid = async (tablename) => {
  const Model = await getModel(tablename);
  const yearPrefix = new Date().getFullYear().toString().slice(-2); // e.g. "25"

  const lastDoc = await Model.findOne({ sabid: { $regex: `^${yearPrefix}` } })
    .sort({ sabid: -1 })
    .lean();

  let nextSeq = 1;

  if (lastDoc?.sabid) {
    const lastSeq = parseInt(lastDoc.sabid.slice(2), 10);
    if (!isNaN(lastSeq)) {
      nextSeq = lastSeq + 1;
    }
  }

  const newSabid = `${yearPrefix}${String(nextSeq)}`;
  return newSabid;
};

const getFinancialYearYCode = (date = new Date()) => {
  const currentYear = date.getFullYear();
  const currentMonth = date.getMonth() + 1; // January is 0

  // Financial year starts in April
  const startYear = currentMonth >= 4 ? currentYear : currentYear - 1;
  const endYear = startYear + 1;

  const ycode = `${String(startYear).slice(-2)}${String(endYear).slice(-2)}`;
  return ycode;
};
// Main sabid generator with atomic increment
const generateSabidMenu = async (tablename) => {
  if (!tablename) throw new Error("Table name required for sabid");

  const ycode = getFinancialYearYCode();
  const counterId = `${tablename}-${ycode}`;

  const updatedCounter = await Counter.findOneAndUpdate(
    { _id: counterId },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  const nextSeq = updatedCounter.seq;
  const sabid = `${ycode}${String(nextSeq).padStart(3, "0")}`; // e.g., 2526001

  return sabid;
};
const isValidGmail = (email) => /^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(email);

module.exports = {
  generateSabid,
  getFinancialYearYCode,
  generateSabidMenu,
  getModel,
  isValidGmail,
};
