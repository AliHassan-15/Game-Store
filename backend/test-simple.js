const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Basic CORS
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174', 'http://localhost:4173'],
  credentials: true
}));

// Basic body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Simple test routes
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Simple test server is running',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/v1/health', (req, res) => {
  res.json({
    success: true,
    message: 'Health check passed',
    timestamp: new Date().toISOString()
  });
});

app.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Test route working',
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Simple test server running on port ${PORT}`);
}); 