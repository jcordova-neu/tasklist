require('dotenv').config();
const mongoose = require('mongoose');
const serverless = require('serverless-http');
const app = require('./app');

let mongoosePromise = null;
const connectDb = async () => {
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  if (mongoosePromise) return mongoosePromise;

  const opts = {
    serverSelectionTimeoutMS: 10000, // fail fast (10s)
    connectTimeoutMS: 10000
  };

  mongoosePromise = mongoose.connect(process.env.MONGO_URI, opts)
    .then(() => {
      console.log('✅ MongoDB connected');
      return mongoose.connection;
    })
    .catch((err) => {
      mongoosePromise = null; // allow retry later
      console.error('❌ MongoDB connection error:', err && err.message ? err.message : err);
      throw err;
    });

  return mongoosePromise;
};

const startServer = async () => {
  await connectDb();
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
};

if (require.main === module) {
  startServer().catch(() => process.exit(1));
} else {
  // serverless export: ensure DB connect attempt before handling; if fails, return 500 quickly
  const handler = serverless(app);
  module.exports = async (req, res) => {
    try {
      await connectDb();
    } catch (err) {
      console.error('DB connect failed on serverless invocation:', err && err.message ? err.message : err);
      res.statusCode = 500;
      return res.end('DB connection failed');
    }
    return handler(req, res);
  };
}