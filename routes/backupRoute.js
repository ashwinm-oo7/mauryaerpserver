const express = require("express");
const router = express.Router();
const { backupDatabase } = require("./backupService");
const fs = require("fs");
const path = require("path");
const AdmZip = require("adm-zip");
const requireRoles = require("../middleware/requireRole");

router.get("/download", (req, res) => {
  const { folder, path: folderPath } = req.query;

  if (!folder || !folderPath) {
    return res.status(400).json({ error: "Folder and path are required" });
  }

  const fullPath = path.join(folderPath, folder);

  if (!fs.existsSync(fullPath)) {
    return res.status(404).json({ error: "Backup folder not found" });
  }

  const zip = new AdmZip();
  zip.addLocalFolder(fullPath);

  const zipBuffer = zip.toBuffer();

  res.set("Content-Type", "application/zip");
  res.set("Content-Disposition", `attachment; filename=${folder}.zip`);
  res.send(zipBuffer);
});

// Route to list backup folders
router.get("/list", (req, res) => {
  const baseBackupDirs = [
    "C:\\ERPBackups",
    "D:\\ERPBackups",
    "/home/erp/backups",
  ];

  const allBackups = [];

  for (const dir of baseBackupDirs) {
    if (fs.existsSync(dir)) {
      const backups = fs
        .readdirSync(dir)
        .filter((f) => fs.statSync(path.join(dir, f)).isDirectory());
      allBackups.push(...backups.map((b) => ({ path: dir, folder: b })));
    }
  }

  res.json({ backups: allBackups });
});

router.post(
  "/backup",
  requireRoles(["Developer", "Admin"]),
  async (req, res) => {
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
  }
);

module.exports = router;
