import dotenv from 'dotenv';
dotenv.config();
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import { logger } from './utils/logger';
import dealsRouter from './routes/deals';
import analyzeRouter from './routes/analyzeRoutes';

const envPath = path.resolve(__dirname, '../.env');
const result = dotenv.config({ path: envPath });

logger.info('Attempting to load .env from:', envPath);
if (result.error) {
  logger.error('❌ Error loading .env file:', result.error);
} else {
  logger.info('✅ .env file loaded successfully');
  // Log the raw environment variables
  logger.info('Raw environment variables:', {
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY ? 'exists' : 'missing',
    OPENAI_API_KEY_LENGTH: process.env.OPENAI_API_KEY?.length,
    OPENAI_API_KEY_START: process.env.OPENAI_API_KEY?.substring(0, 10),
    CORS_ORIGIN: process.env.CORS_ORIGIN
  });
}

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api/deals', dealsRouter);
app.use('/api/analyze', analyzeRouter);

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ 
    status: 'healthy',
    env: {
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT,
      OPENAI_API_KEY_EXISTS: !!process.env.OPENAI_API_KEY,
      OPENAI_API_KEY_LENGTH: process.env.OPENAI_API_KEY?.length,
      CORS_ORIGIN: process.env.CORS_ORIGIN
    }
  });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(port, () => {
  logger.info(`🚀 Server running on port ${port}`);
  // Run API smoke tests after server starts
  import('./testApiOnStartup').then(mod => {
    mod.runApiSmokeTests().catch((err: any) => {
      logger.error('API smoke tests failed:', err);
    });
  }).catch((err: any) => {
    logger.error('Could not import API smoke test module:', err);
  });
}); 