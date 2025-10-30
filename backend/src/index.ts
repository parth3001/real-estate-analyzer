import dotenv from 'dotenv';
dotenv.config();
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { logger } from './utils/logger';
import dealsRouter from './routes/deals';
import analyzeRouter from './routes/analyzeRoutes';
import censusRouter from './routes/censusRoutes';
import marketDataRouter from './routes/marketDataRoutes';
import wizardRouter from './routes/wizardRoutes';
import authRouter from './routes/auth';
import adminRouter from './routes/admin';
import quickAnalysisRouter from './routes/quickAnalysis';
import portfoliosRouter from './routes/portfolios';
import pipelineRouter from './routes/pipeline';
import commandCenterRouter from './routes/commandCenter';
import educationRouter from './routes/education';
import contactRouter from './routes/contact';
import feedbackRouter from './routes/feedback';
import { connectToDatabase } from './config/database';
import { checkModels, checkCollections } from './utils/modelCheck';
import { ensureAdminUser } from './utils/ensureAdminUser';

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
    CORS_ORIGIN: process.env.CORS_ORIGIN,
    MONGODB_URI: process.env.MONGODB_URI ? 'exists' : 'missing',
    CENSUS_API_KEY: process.env.CENSUS_API_KEY ? 'exists' : 'missing',
    RENTCAST_API_KEY: process.env.RENTCAST_API_KEY ? 'exists' : 'missing',
    FRED_API_KEY: process.env.FRED_API_KEY ? 'exists' : 'missing',
    JWT_SECRET: process.env.JWT_SECRET ? 'exists' : 'missing'
  });
}

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());

// Security headers with Helmet.js
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
      fontSrc: ["'self'", "fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'"]
    }
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  }
}));

app.use(express.json());
app.use(morgan('dev'));

// Rate limiting configuration
const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window per IP
  message: {
    error: 'Too many requests from this IP. Please try again in 15 minutes.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks and internal requests
    return req.path === '/api/health' || req.ip === '127.0.0.1' || req.ip === '::1';
  }
});

// Financial calculation rate limiting
const calculationRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 calculations per window per IP
  message: {
    error: 'Too many analysis requests. Please try again in 15 minutes.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply general rate limiting to all routes
app.use(generalRateLimit);

// Add request logging middleware
app.use((req, res, next) => {
  if (req.method === 'POST') {
    logger.info(`=== INCOMING ${req.method} REQUEST ===`);
    logger.info(`URL: ${req.url}`);
    logger.info(`Path: ${req.path}`);
    logger.info(`Body keys: ${Object.keys(req.body || {})}`);
    logger.info(`Has _isWizardData: ${!!req.body?._isWizardData}`);
    logger.info(`Has maintenanceReservePercentage: ${!!req.body?.maintenanceReservePercentage}`);
    logger.info(`=== END REQUEST LOG ===`);
  }
  next();
});

// Routes with specific rate limiting
// Note: Auth routes have their own specific rate limiting in the router
app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);
app.use('/api/deals', calculationRateLimit, dealsRouter);
app.use('/api/analyze', calculationRateLimit, analyzeRouter);
app.use('/api/census', censusRouter);
app.use('/api/market-data', marketDataRouter);
app.use('/api/wizard', calculationRateLimit, wizardRouter);
app.use('/api/quick', calculationRateLimit, quickAnalysisRouter);
app.use('/api/portfolios', portfoliosRouter);
app.use('/api/pipeline', pipelineRouter);
app.use('/api/command-center', commandCenterRouter);
app.use('/api/education', educationRouter);
app.use('/api/contact', contactRouter);
app.use('/api/feedback', feedbackRouter);

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ 
    status: 'healthy',
    env: {
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT,
      OPENAI_API_KEY_EXISTS: !!process.env.OPENAI_API_KEY,
      OPENAI_API_KEY_LENGTH: process.env.OPENAI_API_KEY?.length,
      CORS_ORIGIN: process.env.CORS_ORIGIN,
      MONGODB_URI_EXISTS: !!process.env.MONGODB_URI,
      CENSUS_API_KEY_EXISTS: !!process.env.CENSUS_API_KEY,
      RENTCAST_API_KEY_EXISTS: !!process.env.RENTCAST_API_KEY,
      FRED_API_KEY_EXISTS: !!process.env.FRED_API_KEY,
      JWT_SECRET_EXISTS: !!process.env.JWT_SECRET
    }
  });
});

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Connect to MongoDB and start server
connectToDatabase()
  .then(async () => {
    // Check if models are properly loaded
    checkModels();
    
    // Check if collections exist
    await checkCollections();
    
    // Ensure admin user exists for smoke tests
    await ensureAdminUser();
    
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
  })
  .catch(err => {
    logger.error('Failed to connect to MongoDB. Server not started:', err);
    // Print more detailed error information
    console.error('MongoDB connection error details:', err);
    
    // Start server anyway to handle health checks
    app.listen(port, () => {
      logger.info(`🚀 Server running in limited mode on port ${port} (without database connection)`);
      logger.warn('Database connection failed, only health check endpoint will work');
    });
  }); 