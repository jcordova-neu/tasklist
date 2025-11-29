require('dotenv').config();
const mongoose = require('mongoose');
const serverless = require('serverless-http');
const app = require('./app');

let mongoosePromise = null;
const connectDb = async () => {
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  if (mongoosePromise) return mongoosePromise;

  const opts = {
    // fail fast so Vercel doesn't hang for 5+ minutes
    serverSelectionTimeoutMS: 10000, // 10s
    connectTimeoutMS: 10000,         // 10s
    // other options are OK with modern mongoose
  };

  mongoosePromise = mongoose.connect(process.env.MONGO_URI, opts)
    .then(() => {
      console.log('✅ MongoDB connected');
      return mongoose.connection;
    })
    .catch((err) => {
      mongoosePromise = null; // allow retry on next invocation
      console.error('❌ MongoDB connection error:', err.message || err);
      throw err;
    });

  return mongoosePromise;
};

const startServer = async () => {
  await connectDb();
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
};

// local dev: node api/server.js
if (require.main === module) {
  startServer().catch(() => process.exit(1));
} else {
  // serverless: wrap handler to ensure DB connects quickly before handling request
  const handler = serverless(app);

  module.exports = async (req, res) => {
    try {
      await connectDb();
    } catch (err) {
      console.error('DB connect failed on serverless invocation:', err.message || err);
      // respond quickly with 500 so Vercel doesn't hang
      res.statusCode = 500;
      res.end('DB connection failed');
      return;
    }
    return handler(req, res);
  };
}