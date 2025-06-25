const express = require("express");
const router = express.Router();
const { backupDatabase } = require("./backupService");
router.post("/backup", async (req, res) => {
  const { path: backupPath } = req.body;

  if (!backupPath) {
    return res.status(400).json({ message: "Backup path is required" });
  }

  try {
    const result = await backupDatabase(backupPath);
    res.status(200).json({ message: result });
  } catch (error) {
    res.status(500).json({ error });
  }
});

module.exports = router;
