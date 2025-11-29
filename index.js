require('dotenv').config();
const mongoose = require('mongoose');
const serverless = require('serverless-http');
const express = require('express');
const app = require('./api/app.js');

let mongoosePromise = null;
const connectDb = async () => {
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  if (mongoosePromise) return mongoosePromise;

  const opts = {
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000
  };

  mongoosePromise = mongoose.connect(process.env.MONGO_URI, opts)
    .then(() => {
      console.log('✅ MongoDB connected');
      return mongoose.connection;
    })
    .catch((err) => {
      mongoosePromise = null;
      console.error('❌ MongoDB connection error:', err && err.message ? err.message : err);
      throw err;
    });

  return mongoosePromise;
};

const handler = serverless(app);

module.exports = async (req, res) => {
  try {
    await connectDb();
  } catch (err) {
    console.error('DB connect failed:', err && err.message ? err.message : err);
    res.statusCode = 500;
    return res.end('DB connection failed');
  }
  return handler(req, res);
};