import OpenAI from 'openai';
import { logger } from '../utils/logger';

const getOpenAIClient = (): OpenAI | null => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      logger.warn('OpenAI API key not found in environment variables');
      logger.debug('Current environment variables:', {
        NODE_ENV: process.env.NODE_ENV,
        OPENAI_API_KEY_EXISTS: !!process.env.OPENAI_API_KEY,
        OPENAI_API_KEY_LENGTH: process.env.OPENAI_API_KEY?.length
      });
      return null;
    }
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    logger.info('OpenAI client initialized successfully');
    return client;
  } catch (error) {
    logger.error('Error initializing OpenAI:', error);
    return null;
  }
};

export { getOpenAIClient }; 