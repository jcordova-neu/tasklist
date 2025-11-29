require('dotenv').config();
const mongoose = require('mongoose');
const serverless = require('serverless-http');
const app = require('./api/app.js');

let mongoosePromise = null;

const connectDb = async () => {
  if (mongoose.connection.readyState === 1) return;
  if (mongoosePromise) return mongoosePromise;

  const opts = {
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000
  };

  mongoosePromise = mongoose
    .connect(process.env.MONGO_URI, opts)
    .then(() => console.log('✅ MongoDB connected'))
    .catch((err) => {
      mongoosePromise = null;
      console.error('❌ DB error:', err.message);
      throw err;
    });

  return mongoosePromise;
};

const serverlessHandler = serverless(app);

module.exports = async (req, res) => {
  try {
    await connectDb();
    return serverlessHandler(req, res);
  } catch (err) {
    console.error('Handler error:', err.message);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'DB connection failed' }));
  }
};