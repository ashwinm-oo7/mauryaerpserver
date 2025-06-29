const mongoose = require("mongoose");

const connections = {};

const createDbUri = (dbName) => {
  return `mongodb+srv://${process.env.MONGO_USERNAME}:${encodeURIComponent(
    process.env.MONGO_PASSWORD
  )}@${process.env.MONGO_URI}/${dbName}?retryWrites=true&w=majority`;
};

const getDbConnection = async (dbName) => {
  if (connections[dbName]) return connections[dbName];

  const uri = createDbUri(dbName);
  const conn = await mongoose.createConnection(uri);
  connections[dbName] = conn;
  return conn;
};

module.exports = { getDbConnection };
