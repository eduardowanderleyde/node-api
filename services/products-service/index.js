/**
 * Products Service - Enterprise Microservices Platform
 * Developed by Wander
 * 
 * Manages products and external API integration
 * Implements intelligent caching and data enrichment
 */

const express = require('express');
const app = express();
const PORT = process.env.PRODUCTS_SERVICE_PORT || 3002;

app.use(express.json());

// Basic health check
app.get('/health', (req, res) => {
  res.json({ 
    service: 'Products Service',
    status: 'OK',
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Products Service running on port ${PORT}`);
});

module.exports = app; 