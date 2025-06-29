const mongoose = require("mongoose");
const connections = {}; // cache db connections

const getDynamicConnection = (dbName) => {
  if (connections[dbName]) return connections[dbName];

  const uri = `mongodb+srv://${process.env.MONGO_USERNAME}:${encodeURIComponent(
    process.env.MONGO_PASSWORD
  )}@${process.env.MONGO_URI}/${dbName}?retryWrites=true&w=majority`;

  const conn = mongoose.createConnection(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  connections[dbName] = conn;
  return conn;
};

module.exports = getDynamicConnection;
