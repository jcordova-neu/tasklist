require('dotenv').config();
const mongoose = require('mongoose');
const serverless = require('serverless-http');
const app = require('./app');

const connectDb = async () => {
  if (global.__mongoosePromise) return global.__mongoosePromise;
  global.__mongoosePromise = mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log('✅ MongoDB connected'))
    .catch((err) => {
      console.error('❌ DB connection error:', err);
      throw err;
    });
  return global.__mongoosePromise;
};

const startServer = async () => {
  await connectDb();
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
};

if (require.main === module) {
  startServer().catch(() => process.exit(1));
} else {
  // On serverless import, attempt DB connect (cold start) and export handler
  connectDb().catch((err) => console.error('DB connect failed on serverless init:', err));
  module.exports = serverless(app);
}