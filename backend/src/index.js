require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { logger, stream } = require('./utils/logger');
const dealsRouter = require('./routes/deals');
const aiRouter = require('./routes/aiRoutes');
const analyzeRouter = require('./routes/analyzeRoutes');
const { OpenAI } = require('openai');

const app = express();
const port = process.env.PORT || 3001;

// CORS Configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(morgan('combined', { stream }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'API is running' });
});

// Routes
app.use('/api/deals', dealsRouter);
app.use('/api/ai', aiRouter);
app.use('/api', analyzeRouter);

// Validate OpenAI API key on startup
const validateOpenAIKey = async () => {
  if (!process.env.OPENAI_API_KEY) {
    logger.warn('⚠️ OPENAI_API_KEY is not set! AI insights will not be available.');
    return;
  }
  
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    // Simple test call to verify API key
    await openai.models.list({ limit: 1 });
    logger.info('✅ OpenAI API key is valid and working');
  } catch (error) {
    logger.error('❌ OpenAI API key validation failed:', error.message);
    logger.error('AI insights will not be available until a valid key is provided');
  }
};

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

// Start the server
app.listen(port, async () => {
  logger.info(`Server running on port ${port}`);
  await validateOpenAIKey();
}); 