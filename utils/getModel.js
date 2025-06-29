module.exports = (req, modelName, schema, collectionName) => {
  if (!req.dbConn) {
    throw new Error("Database connection not found on request object");
  }

  if (req.dbConn.models[modelName]) {
    return req.dbConn.models[modelName];
  }

  return req.dbConn.model(modelName, schema, collectionName);
};
