import mongoose from 'mongoose';
import { AnalyticsEvent } from '../models/Analytics';
import { logger } from '../utils/logger';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Migration Script: Clean Analytics Data and Start Fresh
 *
 * PURPOSE: Delete all existing analytics events to start with clean environment tracking
 *
 * REASON: Analytics system is only hours old (< 1 day), data contains mixed
 *         local/production testing that cannot be reliably separated.
 *
 * SAFETY: Only deletes analytics_events collection.
 *         All users, deals, properties, and other data remain intact.
 *
 * RUN ONCE BEFORE DEPLOYING: npx ts-node src/scripts/migrate-analytics-environment.ts
 */

async function migrateAnalyticsEnvironment() {
  try {
    logger.info('='.repeat(80));
    logger.info('Analytics Environment Migration Script');
    logger.info('='.repeat(80));

    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI not found in environment variables');
    }

    logger.info('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    logger.info('✅ Connected to MongoDB');

    // Count existing events
    const existingCount = await AnalyticsEvent.countDocuments({});
    logger.info(`\nFound ${existingCount} existing analytics events`);

    if (existingCount > 0) {
      logger.info('\n📋 Migration Strategy:');
      logger.info('  - DELETE all existing analytics events');
      logger.info('  - Start fresh with clean environment tracking');
      logger.info('  - Reason: System < 1 day old, data contains mixed local/production tests');
      logger.info('\n⚠️  SAFETY NOTE:');
      logger.info('  - Only analytics_events collection affected');
      logger.info('  - Users, deals, properties remain 100% intact');
      logger.info('  - This is just tracking data, not business data');

      // Delete all analytics events
      logger.info('\n🗑️  Deleting all analytics events...');
      const result = await AnalyticsEvent.deleteMany({});

      logger.info(`\n✅ Successfully deleted ${result.deletedCount} analytics events`);
      logger.info('✅ Database is now ready for clean environment tracking');
      logger.info('\n📊 Next Steps:');
      logger.info('  1. Deploy backend with environment field changes');
      logger.info('  2. Deploy frontend with toggle UI');
      logger.info('  3. All new events will have clean environment tracking');
      logger.info('  4. Dashboard will start at zero and accumulate clean data');
    } else {
      logger.info('\n✅ No existing events found - already clean slate');
      logger.info('✅ Ready for environment tracking');
    }

    logger.info('\n' + '='.repeat(80));
    logger.info('✅ Migration complete');
    logger.info('='.repeat(80));

    // Close connection
    await mongoose.connection.close();
    logger.info('Disconnected from MongoDB');

    process.exit(0);
  } catch (error) {
    logger.error('\n❌ Migration failed:', error);

    if (error instanceof Error) {
      logger.error('Error message:', error.message);
      logger.error('Stack trace:', error.stack);
    }

    // Close connection if open
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      logger.info('Disconnected from MongoDB');
    }

    process.exit(1);
  }
}

// Run migration
migrateAnalyticsEnvironment();
