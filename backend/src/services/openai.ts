import { OpenAI } from 'openai';
import dotenv from 'dotenv';
import { logger } from '../utils/logger';

// Load environment variables
dotenv.config();

// Create OpenAI client singleton
let openaiClient: OpenAI | null = null;

export const getOpenAIClient = (): OpenAI | null => {
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

    if (!openaiClient) {
      openaiClient = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
      logger.info('OpenAI client initialized successfully');
    }

    return openaiClient;
  } catch (error) {
    logger.error('Error initializing OpenAI:', error);
    return null;
  }
};

// Helper function to make OpenAI API calls
export const generateAnalysis = async (prompt: string): Promise<any> => {
  const openai = getOpenAIClient();
  if (!openai) {
    throw new Error('OpenAI client not available');
  }

  try {
    // Try to use GPT-4 if available, otherwise fall back to GPT-3.5-turbo
    const preferredModel = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';
    
    logger.info(`Using OpenAI model: ${preferredModel}`);
    logger.info(`Prompt length: ${prompt.length} characters`);
    
    const completion = await openai.chat.completions.create({
      model: preferredModel,
      messages: [
        { 
          role: "system", 
          content: "You are a real estate investment analysis expert. Provide detailed, actionable insights in JSON format. Be precise with your numbers and analytics." 
        },
        { 
          role: "user", 
          content: prompt 
        }
      ],
      max_tokens: 1500,
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    const content = completion.choices[0].message.content;
    logger.info(`Response length: ${content?.length || 0} characters`);
    
    if (!content) {
      throw new Error('Empty response from OpenAI');
    }

    try {
      // Parse JSON response
      return JSON.parse(content);
    } catch (parseError) {
      logger.error('Error parsing OpenAI response as JSON:', parseError);
      logger.error('Raw response:', content);
      throw new Error('Invalid JSON response from OpenAI');
    }
  } catch (error) {
    logger.error('Error calling OpenAI API:', error);
    throw error;
  }
}; 