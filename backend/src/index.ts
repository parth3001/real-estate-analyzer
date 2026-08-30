// CRITICAL: loadEnv MUST be the very first import so dotenv.config()
// runs BEFORE any service module (RentcastService, FredService, etc.)
// reads process.env at module-load time. See loadEnv.ts header for
// the bug class this prevents.
// eslint-disable-next-line import/order
import './loadEnv';

import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { logger } from './utils/logger';
import dealsRouter from './routes/deals';
import analyzeRouter from './routes/analyzeRoutes';
import chatRouter from './routes/chat';
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
import stripeWebhookRouter from './routes/stripeWebhook';
import { connectToDatabase } from './config/database';
import { checkModels, checkCollections } from './utils/modelCheck';
import { ensureAdminUser } from './utils/ensureAdminUser';

// .env was already loaded by `./loadEnv` at the top of this file.
// We just log the resolved state here so startup output stays informative.
if (process.env.NODE_ENV !== 'production') {
  logger.info('✅ .env loaded (via loadEnv)');
  logger.info('Environment:', {
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY ? 'configured' : 'missing',
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ? 'configured' : 'missing',
    RENTCAST_API_KEY: process.env.RENTCAST_API_KEY ? 'configured' : 'missing',
    FRED_API_KEY: process.env.FRED_API_KEY ? 'configured' : 'missing',
    MONGODB_URI: process.env.MONGODB_URI ? 'configured' : 'missing',
  });
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
//
// CORS_ORIGIN is wired from the static site's URL by render.yaml. Until
// 2026-08-30 it was read only for the /api/health payload and never
// passed to the cors() middleware, so production accepted credentialed
// requests from any origin. Now it's enforced: in production the header
// is required and only the configured origin (plus same-origin/curl
// requests, which send no Origin header) is allowed. Non-production
// stays permissive so local dev and the Vite proxy keep working.
const corsOrigin = process.env.CORS_ORIGIN;
if (process.env.NODE_ENV === 'production' && corsOrigin) {
  const allowedOrigins = corsOrigin
    .split(',')
    .map((o) => o.trim().replace(/\/$/, ''))
    .filter(Boolean);
  app.use(
    cors({
      origin(origin, callback) {
        // No Origin header → same-origin, curl, or a server-to-server
        // call. Not a browser cross-origin request, so nothing to block.
        if (!origin) return callback(null, true);
        const normalized = origin.replace(/\/$/, '');
        if (allowedOrigins.includes(normalized)) return callback(null, true);
        logger.warn('CORS: blocked disallowed origin', { origin, allowedOrigins });
        return callback(new Error('Not allowed by CORS'));
      },
      credentials: true,
    })
  );
  logger.info('✅ CORS restricted to configured origins', { allowedOrigins });
} else {
  if (process.env.NODE_ENV === 'production') {
    logger.warn(
      'CORS_ORIGIN is unset in production — falling back to permissive CORS. ' +
        'Set CORS_ORIGIN to the frontend URL.'
    );
  }
  app.use(cors());
}

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

// Task #34 (2026-07-14) — Stripe webhook mount MUST come before the
// global express.json() middleware. Stripe signature verification
// requires the exact raw bytes Stripe sent; a JSON.parse round-trip
// re-orders keys and breaks the HMAC. The router applies
// express.raw({type:'application/json'}) inline so req.body is a
// Buffer inside the handler. See stripeWebhookController INV-1.
app.use('/api/webhooks/stripe', stripeWebhookRouter);

app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev'));

// Rate limiting configuration
//
// Dev-mode note (2026-07-19): heavy manual testing on a LAN IP (not
// 127.0.0.1) blew through 100 req / 15 min routinely — workspace loads
// alone fire 5-8 parallel GETs, and route churn stacks fast. Skip
// rate-limiting entirely outside production so dev/QA sessions stay
// snappy. Prod protection unchanged.
const isProduction = process.env.NODE_ENV === 'production';

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
    // Non-production: skip entirely (dev + QA + local network testing).
    if (!isProduction) return true;
    // Production: skip only for health checks, sample analysis (public
    // SEO page), and localhost internal requests.
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
  skip: () => !isProduction,
});

// Apply general rate limiting to all routes
app.use(generalRateLimit);

// Task #94 (2026-06-21): demoted to logger.debug — previously emitted
// 7 info lines per POST request, drowning out actual signal during
// chat-heavy sessions. Express's per-request `method url status time`
// summary (printed elsewhere) is sufficient at the info level.
app.use((req, res, next) => {
  if (req.method === 'POST') {
    logger.debug(`=== INCOMING ${req.method} REQUEST ===`);
    logger.debug(`URL: ${req.url}`);
    logger.debug(`Path: ${req.path}`);
    logger.debug(`Body keys: ${Object.keys(req.body || {})}`);
    logger.debug(`Has _isWizardData: ${!!req.body?._isWizardData}`);
    logger.debug(`Has maintenanceReservePercentage: ${!!req.body?.maintenanceReservePercentage}`);
    logger.debug(`=== END REQUEST LOG ===`);
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
// W6-S1: chat overlay surface. Same rate-limit class as deals/analyze
// (chat turns invoke LLMs — even more expensive than calc).
app.use('/api/chat', calculationRateLimit, chatRouter);
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

// Health check endpoint — also Render's healthCheckPath.
//
// This endpoint is UNAUTHENTICATED and publicly reachable. Until
// 2026-08-30 it echoed which secrets were configured, plus the literal
// character length of OPENAI_API_KEY — a free reconnaissance surface for
// anyone probing the host. The config diagnostics are still useful when
// debugging a local or staging boot, so they're kept OUT of production
// only.
app.get('/api/health', (_req: Request, res: Response) => {
  const payload: Record<string, unknown> = {
    status: 'healthy',
    uptimeSeconds: Math.round(process.uptime()),
    // 1 === connected. Surfacing this makes "the app is up but Mongo
    // isn't" visible without reading logs.
    dbConnected: mongoose.connection.readyState === 1,
  };

  if (process.env.NODE_ENV !== 'production') {
    payload.env = {
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT,
      OPENAI_API_KEY_EXISTS: !!process.env.OPENAI_API_KEY,
      CORS_ORIGIN: process.env.CORS_ORIGIN,
      MONGODB_URI_EXISTS: !!process.env.MONGODB_URI,
      CENSUS_API_KEY_EXISTS: !!process.env.CENSUS_API_KEY,
      RENTCAST_API_KEY_EXISTS: !!process.env.RENTCAST_API_KEY,
      FRED_API_KEY_EXISTS: !!process.env.FRED_API_KEY,
      JWT_SECRET_EXISTS: !!process.env.JWT_SECRET,
      ANTHROPIC_API_KEY_EXISTS: !!process.env.ANTHROPIC_API_KEY,
      RESEND_API_KEY_EXISTS: !!process.env.RESEND_API_KEY,
      FRONTEND_URL: process.env.FRONTEND_URL,
      BILLING_ENABLED: process.env.BILLING_ENABLED ?? 'true (default)',
    };
  }

  res.json(payload);
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