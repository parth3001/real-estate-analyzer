#!/usr/bin/env ts-node

/**
 * Load All States Assessment Ratio Data
 * 
 * This script loads the comprehensive assessment ratio data for all 50 states
 * from the static JSON file into the MongoDB database.
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { assessmentRatioService } from '../services/assessmentRatioService';
import { logger } from '../utils/logger';

// Load environment variables
dotenv.config();

async function loadAllStatesData() {
  try {
    // Connect to MongoDB using environment variable
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI environment variable is not set');
    }
    
    logger.info('Connecting to MongoDB...', { uri: mongoUri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@') });
    await mongoose.connect(mongoUri);
    logger.info('Connected to MongoDB');

    // Load all states data
    logger.info('Starting to load all states assessment ratio data...');
    const result = await assessmentRatioService.loadAllStatesData();

    logger.info('All states data loading completed', {
      successful: result.successful,
      failed: result.failed,
      errors: result.errors.length
    });

    if (result.errors.length > 0) {
      logger.error('Errors during data loading:', result.errors);
    }

    // Get coverage stats
    const stats = await assessmentRatioService.getCoverageStats();
    logger.info('Current coverage statistics:', {
      totalStates: stats.statesWithData.length,
      states: stats.statesWithData,
      totalRatios: stats.totalRatios,
      dataQuality: stats.dataQualityBreakdown
    });

    process.exit(result.failed > 0 ? 1 : 0);

  } catch (error) {
    logger.error('Script execution failed:', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    logger.info('Disconnected from MongoDB');
  }
}

// Run the script
if (require.main === module) {
  loadAllStatesData();
}

export default loadAllStatesData;