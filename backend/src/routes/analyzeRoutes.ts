import express, { Request, Response } from 'express';
import { logger } from '../utils/logger';
import { SFRAnalyzer, MultiFamilyAnalyzer } from '../analysis';
import { SFRData, MultiFamilyData } from '../types/propertyTypes';
import { getOpenAIClient } from '../services/openai';
import { getAIInsights } from '../services/aiService';

const router = express.Router();

// Generic property analysis endpoint
const analyzeHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const propertyType = req.params.type.toLowerCase();
    const formData = req.body;
    
    logger.info(`Received ${propertyType} analysis request:`, { data: formData });

    if (propertyType !== 'sfr' && propertyType !== 'mf') {
      res.status(400).json({ error: 'Invalid property type. Must be "sfr" or "mf".' });
      return;
    }

    // Create analyzer instance with default assumptions
    const assumptions = {
      projectionYears: formData.longTermAssumptions?.projectionYears || 5,
      annualRentIncrease: formData.longTermAssumptions?.annualRentIncrease || 3,
      annualExpenseIncrease: formData.longTermAssumptions?.inflationRate || 2,
      annualPropertyValueIncrease: formData.longTermAssumptions?.annualPropertyValueIncrease || 3,
      sellingCosts: formData.longTermAssumptions?.sellingCostsPercentage || 6,
      vacancyRate: formData.longTermAssumptions?.vacancyRate || 5
    };

    let analyzer;
    if (propertyType === 'sfr') {
      analyzer = new SFRAnalyzer(formData as SFRData, assumptions);
    } else {
      analyzer = new MultiFamilyAnalyzer(formData as MultiFamilyData, assumptions);
    }

    const results = analyzer.analyze();
    
    // Get AI analysis if OpenAI is configured
    const openai = getOpenAIClient();
    if (openai) {
      try {
        const aiInsights = await getAIInsights(formData as SFRData | MultiFamilyData, results);
        results.aiInsights = aiInsights;
        logger.info(`AI analysis completed for ${propertyType} property`);
      } catch (error) {
        logger.error('Error getting AI analysis:', error);
        results.aiInsights = {
          summary: "Error generating AI analysis. Please try again later.",
          strengths: [],
          weaknesses: [],
          recommendations: [],
          investmentScore: null
        };
      }
    } else {
      results.aiInsights = {
        summary: "AI analysis not available. Please configure OpenAI API key.",
        strengths: [],
        weaknesses: [],
        recommendations: [],
        investmentScore: null
      };
    }
    
    logger.info(`${propertyType} analysis completed successfully`);
    res.json(results);
  } catch (error) {
    logger.error(`Error in ${req.params.type} analysis:`, error);
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'An unknown error occurred' });
    }
  }
};

router.post('/:type', analyzeHandler);

export default router; 