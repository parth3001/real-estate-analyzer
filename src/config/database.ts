import mongoose from 'mongoose';
import { logger } from '../utils/logger';

/**
 * MongoDB connection manager
 */
export const connectToDatabase = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    
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