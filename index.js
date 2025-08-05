/**
 * API Gateway - Enterprise Microservices Platform
 * Developed by Wander
 * 
 * Orchestrates authentication and product microservices
 * Provides unified API with JWT authentication
 */

const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Basic health check
app.get('/health', (req, res) => {
  res.json({ 
    gateway: 'OK',
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  console.log(`🚀 API Gateway running on port ${PORT}`);
});

module.exports = app; 