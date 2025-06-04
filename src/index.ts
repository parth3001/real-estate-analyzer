import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { Configuration, OpenAIApi } from 'openai';
import dotenv from 'dotenv';
import { logger } from './utils/logger';
import dealRoutes from './routes/deals';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('combined'));

// Routes
app.use('/api/deals', dealRoutes);

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy' });
});

// Validate OpenAI API key if present
if (process.env.OPENAI_API_KEY) {
  const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  });
  const openai = new OpenAIApi(configuration);

  // Test the API key
  openai.listEngines()
    .then(() => {
      logger.info('✅ OpenAI API key validated successfully');
    })
    .catch((error: unknown) => {
      if (error instanceof Error) {
        logger.error('❌ OpenAI API key validation failed:', error.message);
      } else {
        logger.error('❌ OpenAI API key validation failed with unknown error');
      }
    });
} else {
  logger.warn('⚠️ No OpenAI API key found');
}

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

// Start server
app.listen(port, () => {
  logger.info(`🚀 Server running on port ${port}`);
}); 