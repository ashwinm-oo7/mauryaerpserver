const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const { getDbConnection } = require("../utils/dbManager");
const jwt = require("jsonwebtoken");
const createDynamicConnection = require("../utils/dbSwitcher");
// const formSchema = require("../models/formSchema"); // generic schema

router.get("/userdata/:dbname", verifyToken, async (req, res) => {
  const { dbname } = req.params;

  if (!req.user.dbs.includes(dbname)) {
    return res.status(403).json({ message: "Access denied to this database" });
  }

  const conn = await getDbConnection(dbname);
  const FormModel = conn.model(
    "Forms",
    new conn.base.Schema({ name: String }),
    "forms"
  );

  const forms = await FormModel.find({});
  res.json(forms);
});

router.get("/forms/:dbName", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { dbs } = decoded;
    const dbName = req.params.dbName;

    if (!dbs.includes(dbName))
      return res.status(403).json({ message: "Access denied" });

    const conn = createDynamicConnection(dbName);
    const Form = conn.model("Form", formSchema, "forms");

    const forms = await Form.find({});
    res.json({ success: true, data: forms });
  } catch (err) {
    console.error("Dynamic DB fetch failed:", err);
    res.status(500).json({ message: "Failed to fetch from DB" });
  }
});

module.exports = router;
