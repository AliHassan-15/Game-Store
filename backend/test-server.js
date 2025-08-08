const express = require('express');
const app = express();

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple test route
app.get('/test', (req, res) => {
  res.json({ message: 'Test server is working!' });
});

app.get('/', (req, res) => {
  res.json({ message: 'Root endpoint working!' });
});

const PORT = 5001;
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
}); 