import mongoose from 'mongoose';
import { logger } from '../utils/logger';

export const connectToDatabase = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
      logger.error('MongoDB URI is not defined in environment variables');
      throw new Error('MongoDB URI is not defined');
    }
    
    await mongoose.connect(mongoUri);
    
    logger.info('Connected to MongoDB successfully');
    
    mongoose.connection.on('error', (error) => {
      logger.error('MongoDB connection error:', error);
    });
    
    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });
    
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed due to application termination');
      process.exit(0);
    });
    
  } catch (error) {
    logger.error('Failed to connect to MongoDB:', error);
    throw error;
  }
}; 