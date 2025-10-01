const express = require('express');
const path = require('path');

// Simple static server for the HTML form
const app = express();
const PORT = 3310;

// Serve static files
app.use(express.static(path.join(__dirname)));

// Serve the customer entry form
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'customer-entry.html'));
});

app.listen(PORT, () => {
  console.log(`📄 Customer Entry Form available at: http://localhost:${PORT}`);
  console.log(`🎯 Make sure your CRM backend is running on http://localhost:5685`);
});