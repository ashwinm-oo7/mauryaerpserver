const fs = require("fs");
const { exec } = require("child_process");
const path = require("path");
require("dotenv").config();

const backupDatabase = (backupPath) => {
  return new Promise((resolve, reject) => {
    const dbName = process.env.DB_NAME;
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const outputDir = path.join(backupPath, `backup-${dbName}-${timestamp}`);

    // ✅ Auto-create folder if it doesn't exist
    fs.mkdirSync(outputDir, { recursive: true });

    const mongodumpPath = `"C:\\mongodb-database-tools-windows-x86_64-100.12.2\\mongodb-database-tools-windows-x86_64-100.12.2\\bin\\mongodump.exe"`;

    const command = `${mongodumpPath} --uri="${process.env.MONGO_URI_URL}" --out="${outputDir}"`;

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Backup failed: ${stderr}`);
        return reject(`Backup failed: ${stderr}`);
      }
      console.log(`Backup successful: ${stdout}`);
      return resolve(`Backup saved to: ${outputDir}`);
    });
  });
};

module.exports = { backupDatabase };
