import dotenv from 'dotenv';
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
import magicLinkRouter from './routes/magicLink';
import adminRouter from './routes/admin';
import analyticsRouter from './routes/analytics';
import quickAnalysisRouter from './routes/quickAnalysis';
import portfoliosRouter from './routes/portfolios';
import pipelineRouter from './routes/pipeline';
import commandCenterRouter from './routes/commandCenter';
import educationRouter from './routes/education';
import contactRouter from './routes/contact';
import feedbackRouter from './routes/feedback';
import pdfRouter from './routes/pdf';
import { connectToDatabase } from './config/database';
import { checkModels, checkCollections } from './utils/modelCheck';
import { ensureAdminUser } from './utils/ensureAdminUser';

// Load .env file only in development (production uses Render environment variables)
if (process.env.NODE_ENV !== 'production') {
  const envPath = path.resolve(__dirname, '../.env');
  const result = dotenv.config({ path: envPath });

  if (result.error) {
    logger.warn('⚠️  No .env file found (this is normal in production)');
  } else {
    logger.info('✅ .env file loaded successfully');
    logger.info('Environment:', {
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT,
      OPENAI_API_KEY: process.env.OPENAI_API_KEY ? 'configured' : 'missing',
      MONGODB_URI: process.env.MONGODB_URI ? 'configured' : 'missing'
    });
  }
}

const app = express();
const port = process.env.PORT || 3001;

// Trust proxy - CRITICAL for production deployment behind reverse proxy (Render, Heroku, etc.)
// This allows Express to correctly identify client IPs from X-Forwarded-For header
// Required for: rate limiting, IP-based security, accurate logging
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1); // Trust first proxy (Render.com load balancer)
  logger.info('✅ Trust proxy enabled for production environment');
} else {
  // In development, optionally trust localhost proxies
  app.set('trust proxy', 'loopback');
  logger.info('✅ Trust proxy enabled for localhost only (development)');
}

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

app.use(express.json({ limit: '2mb' }));
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
    // Skip rate limiting for health checks, sample analysis (public SEO page), and internal requests
    return req.path === '/api/health' || req.path === '/api/deals/sample-analysis' || req.ip === '127.0.0.1' || req.ip === '::1';
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
app.use('/api/auth', magicLinkRouter);
app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);
app.use('/api/analytics', analyticsRouter);
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
app.use('/api/pdf', pdfRouter);  // PDF routes (has its own rate limiting in pdfRateLimiter middleware)

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

      // Smoke tests mint a JWT in-process for an existing admin user
      // (no password login needed). Opt out with SKIP_SMOKE_TESTS=true.
      if (process.env.SKIP_SMOKE_TESTS === 'true') {
        logger.info('[startup] Smoke tests skipped (SKIP_SMOKE_TESTS=true)');
      } else {
        import('./testApiOnStartup').then(mod => {
          mod.runApiSmokeTests().catch((err: any) => {
            logger.error('API smoke tests failed:', err);
          });
        }).catch((err: any) => {
          logger.error('Could not import API smoke test module:', err);
        });
      }
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