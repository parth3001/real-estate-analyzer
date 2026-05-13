import mongoose from 'mongoose';
import { logger } from '../utils/logger';
import { verifyEventsRoleOnStartup } from './eventsRoleVerification';

/**
 * MongoDB connection setup with W1-S5a production-safety guard.
 *
 * Per /docs/PRODUCT_2.0_PROD_MIGRATION.md §2.3 (W1-S5a).
 *
 * Architecture:
 *   - Single MongoDB Atlas cluster shared by dev and production
 *   - Database-level separation: `real-estate-analyzer` (prod) vs
 *     `real-estate-analyzer-dev` (dev). Different DB users per database.
 *   - Production-safety guard rejects mismatched NODE_ENV + database name
 *     combinations at app startup — prevents accidental connection-string
 *     misconfiguration from polluting production substrate.
 *
 * Test environment uses `mongodb-memory-server` directly in test files;
 * this function is not called in test mode.
 */

// ===== Internal helpers (exposed for unit testing via __internal) =====

/**
 * Extracts the database name from a MongoDB connection URI.
 *
 * Examples:
 *   "mongodb+srv://u:p@cluster.mongodb.net/real-estate-analyzer-dev?retryWrites=true"
 *     → "real-estate-analyzer-dev"
 *   "mongodb://localhost:27017/mydb"
 *     → "mydb"
 *   "mongodb+srv://u:p@cluster.mongodb.net/?retryWrites=true"   (no db)
 *     → null
 */
function extractDatabaseName(uri: string): string | null {
  // Pattern: protocol://[creds@]host[:port]/dbname[?queryparams]
  const match = uri.match(/^[^/]+\/\/[^/]+\/([^?]+)(\?|$)/);
  return match && match[1] ? match[1] : null;
}

/**
 * Extracts the cluster hostname from a MongoDB connection URI (credentials
 * stripped). For logging only.
 */
function extractClusterHostname(uri: string): string | null {
  // Pattern: protocol://[creds@]host[:port]/...
  const match = uri.match(/^[^/]+\/\/(?:[^@]+@)?([^/?]+)/);
  return match && match[1] ? match[1] : null;
}

/**
 * Production-safety guard.
 *
 * Refuses to start the app if NODE_ENV and the configured database name
 * are misaligned in ways that would pollute substrate. Specifically:
 *
 *   - NODE_ENV=production + non-production database → THROW
 *     (a production deploy should never write to a dev database)
 *
 *   - NODE_ENV != production + production database → THROW
 *     (a dev workflow should never write to production substrate;
 *     events are append-only and cannot be cleaned up after the fact)
 *
 *   - NODE_ENV=test → bypassed (test files use mongodb-memory-server)
 *
 * Production database name: 'real-estate-analyzer'
 * Dev database name pattern: ends with '-dev' (typically 'real-estate-analyzer-dev')
 */
function assertEnvironmentMatchesDatabase(databaseName: string | null): void {
  const nodeEnv = process.env.NODE_ENV;

  // Test mode bypass — tests use mongodb-memory-server and don't call this function
  if (nodeEnv === 'test') return;

  if (!databaseName) {
    logger.warn('Could not extract database name from MONGODB_URI; skipping safety guard');
    return;
  }

  const isProductionDB = databaseName === 'real-estate-analyzer';
  const isProductionEnv = nodeEnv === 'production';

  if (isProductionEnv && !isProductionDB) {
    throw new Error(
      `Production-safety guard: NODE_ENV=production but MONGODB_URI database name is '${databaseName}' ` +
        `(expected 'real-estate-analyzer'). Refusing to start to prevent production from writing to a non-production database.`
    );
  }

  if (!isProductionEnv && isProductionDB) {
    throw new Error(
      `Production-safety guard: NODE_ENV='${nodeEnv ?? 'unset'}' but MONGODB_URI points at production database ` +
        `'real-estate-analyzer'. Refusing to start to prevent accidental writes to production substrate. ` +
        `Set MONGODB_URI to use 'real-estate-analyzer-dev' (or other -dev database).`
    );
  }

  // Sanity warn — non-fatal — if database name doesn't match expected patterns
  if (!isProductionDB && !databaseName.endsWith('-dev') && !databaseName.endsWith('-test')) {
    logger.warn(
      `MongoDB database name '${databaseName}' doesn't match expected 'real-estate-analyzer' (production) ` +
        `or '*-dev' / '*-test' (development). Proceeding but flagging for review.`
    );
  }
}

// ===== Public connection function =====

export const connectToDatabase = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
      logger.error('MONGODB_URI environment variable is not set');
      throw new Error('MongoDB URI is not defined in environment variables');
    }

    const databaseName = extractDatabaseName(mongoUri);
    const clusterHostname = extractClusterHostname(mongoUri);

    // Log connection target up-front (never log credentials)
    logger.info('MongoDB connection target:', {
      NODE_ENV: process.env.NODE_ENV ?? 'unset',
      cluster: clusterHostname,
      database: databaseName,
    });

    // W1-S5a: production-safety guard — throws on misconfiguration
    assertEnvironmentMatchesDatabase(databaseName);

    // Connection options
    const options = {
      autoIndex: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    logger.info('Attempting to connect to MongoDB...');

    await mongoose.connect(mongoUri, options);

    logger.info(
      `✅ Connected to MongoDB: ${clusterHostname} / ${databaseName} (NODE_ENV=${process.env.NODE_ENV ?? 'unset'})`
    );

    // W1-S5b: verify the events-writer role on startup (layer-3 of the
    // 3-layer append-only enforcement; see events store §6.3). Behavior
    // is mode-driven via EVENTS_ROLE_CHECK_MODE — defaults to 'warn'.
    await verifyEventsRoleOnStartup();

    mongoose.connection.on('error', (error) => {
      logger.error('MongoDB connection error:', error);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed due to app termination');
      process.exit(0);
    });
  } catch (error) {
    logger.error('Failed to connect to MongoDB:', error);
    console.error('MongoDB connection error details:', error);
    throw error;
  }
};

// ===== Test-only exports =====

/**
 * Internal exports for unit testing. Not part of the public API of this module.
 */
export const __internal = {
  extractDatabaseName,
  extractClusterHostname,
  assertEnvironmentMatchesDatabase,
};
