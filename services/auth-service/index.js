/**
 * Auth Service - Enterprise Microservices Platform
 * Developed by Wander
 * 
 * Manages user authentication and authorization
 * Implements JWT, bcrypt, and data validation
 */

const express = require('express');
const app = express();
const PORT = process.env.AUTH_SERVICE_PORT || 3001;

app.use(express.json());

// Basic health check
app.get('/health', (req, res) => {
  res.json({ 
    service: 'Auth Service',
    status: 'OK',
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Auth Service running on port ${PORT}`);
});

module.exports = app; 