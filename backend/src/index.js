require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { logger, stream } = require('./utils/logger');
const dealsRouter = require('./routes/deals');

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('combined', { stream }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  logger.info('Health check endpoint called');
  res.status(200).json({ status: 'ok' });
});

// Routes
app.use('/api/deals', dealsRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Error occurred:', { 
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body,
    query: req.query,
    params: req.params
  });

  const errorMessage = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : err.message;
  res.status(500).json({ error: errorMessage });
});

app.listen(port, () => {
  logger.info(`Server running on port ${port}`);
}); 