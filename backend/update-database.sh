#!/bin/bash

cat > src/config/database.ts << 'EOF'
import mongoose from 'mongoose';
import { logger } from '../utils/logger';

/**
 * MongoDB connection manager
 */
export const connectToDatabase = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    
    // Log all environment variables (redacting sensitive information)
    logger.info('Environment variables:', {
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT,
      MONGODB_URI_EXISTS: !!process.env.MONGODB_URI,
      MONGODB_URI_LENGTH: process.env.MONGODB_URI?.length,
      MONGODB_URI_START: process.env.MONGODB_URI?.substring(0, 10) + '...',
      CORS_ORIGIN: process.env.CORS_ORIGIN
    });
    
    if (!mongoUri) {
      logger.error('MONGODB_URI environment variable is not set');
      throw new Error('MongoDB URI is not defined in environment variables');
    }
    
    // Connection options
    const options = {
      autoIndex: true,
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
    };
    
    logger.info('Attempting to connect to MongoDB...');
    
    // Connect to MongoDB
    await mongoose.connect(mongoUri, options);
    logger.info('✅ Connected to MongoDB successfully');
    
    // Log any connection errors
    mongoose.connection.on('error', (error) => {
      logger.error('MongoDB connection error:', error);
    });
    
    // Log when connection is disconnected
    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });
    
    // Handle process termination and close the MongoDB connection
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed due to app termination');
      process.exit(0);
    });
    
  } catch (error) {
    logger.error('Failed to connect to MongoDB:', error);
    // Print the full error details
    console.error('MongoDB connection error details:', error);
    throw error;
  }
};

/**
 * Close MongoDB connection
 */
export const closeDatabase = async (): Promise<void> => {
  try {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');
  } catch (error) {
    logger.error('Error closing MongoDB connection:', error);
    throw error;
  }
};
EOF

echo "Database.ts file updated with enhanced logging" 