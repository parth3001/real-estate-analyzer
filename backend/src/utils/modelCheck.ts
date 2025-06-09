import mongoose from 'mongoose';
import { logger } from './logger';

// Import all models to ensure they're registered
import '../models/Deal';

/**
 * Checks if all required models are registered
 */
export function checkModels(): boolean {
  const registeredModels = Object.keys(mongoose.models);
  logger.info('Registered models:', registeredModels);
  
  // Define required models
  const requiredModels = ['Deal'];
  
  // Check if all required models are registered
  const missingModels = requiredModels.filter(model => !registeredModels.includes(model));
  
  if (missingModels.length > 0) {
    logger.error('Missing required models:', missingModels);
    return false;
  }
  
  logger.info('All required models are registered');
  return true;
}

/**
 * Check if collections exist in the database
 */
export async function checkCollections(): Promise<boolean> {
  try {
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    logger.info('Collections in database:', collectionNames);
    
    // Define required collections
    const requiredCollections = ['deals'];
    
    // Check if all required collections exist
    const missingCollections = requiredCollections.filter(
      collection => !collectionNames.includes(collection)
    );
    
    if (missingCollections.length > 0) {
      logger.error('Missing required collections:', missingCollections);
      return false;
    }
    
    logger.info('All required collections exist in the database');
    return true;
  } catch (error) {
    logger.error('Error checking collections:', error);
    return false;
  }
} 