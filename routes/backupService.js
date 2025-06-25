const { exec } = require("child_process");
const path = require("path");
require("dotenv").config();
const backupDatabase = (backupPath) => {
  return new Promise((resolve, reject) => {
    const dbName = process.env.DB_NAME;
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const outputDir = path.join(backupPath, `backup-${dbName}-${timestamp}`);
    const command = `mongodump --uri="${process.env.MONGO_URI}" --out="${outputDir}"`;
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
