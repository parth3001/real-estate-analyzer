const express = require('express');
const cors = require('cors');

const app = express();
const port = 3002;

// Basic middleware
app.use(cors());
app.use(express.json());

// Simple health check
app.get('/health', (req, res) => {
  console.log('✅ Health endpoint hit successfully');
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    message: 'Standalone test server is working perfectly'
  });
});

// Simple auth test
app.post('/auth/test', (req, res) => {
  console.log('✅ Auth test endpoint hit with body:', req.body);
  res.json({
    message: 'Auth test successful',
    received: req.body
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('❌ Error caught:', err);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

app.listen(port, () => {
  console.log(`🚀 Standalone test server running on port ${port}`);
  console.log(`Test with: curl http://localhost:${port}/health`);
});