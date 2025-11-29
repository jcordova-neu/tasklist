// Root entrypoint for Vercel — re-export api/server.js
const express = require('express');
module.exports = require('./api/server.js');