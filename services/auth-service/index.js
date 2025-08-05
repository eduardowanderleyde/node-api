/**
 * Auth Service - Enterprise Microservices Platform
 * Developed by Wander
 * 
 * Manages user authentication and authorization
 * Implements JWT, bcrypt, and data validation
 */

const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();
const PORT = process.env.AUTH_SERVICE_PORT || 3001;

app.use(express.json());

// In-memory user storage
const users = [
  {
    id: 1,
    email: 'admin@enterprise.com',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
    name: 'Administrator',
    role: 'admin',
  },
  {
    id: 2,
    email: 'user@enterprise.com',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
    name: 'Regular User',
    role: 'user',
  },
];

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      role: user.role,
    },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '24h' },
  );
};

// Basic health check
app.get('/health', (req, res) => {
  res.json({ 
    service: 'Auth Service',
    status: 'OK',
    timestamp: new Date().toISOString(),
  });
});

// Login endpoint
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user);

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Auth Service running on port ${PORT}`);
});

module.exports = app; 