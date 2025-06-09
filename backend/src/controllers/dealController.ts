import { Request, Response } from 'express';
import { dealService } from '../services/DealService';
import { logger } from '../utils/logger';
import { IDeal } from '../models/Deal';
import { analyzeSFRProperty, analyzeMFProperty } from '../services/analysisService';

/**
 * Get all deals
 */
export const getAllDeals = async (req: Request, res: Response) => {
  try {
    // Get user ID from auth middleware if available
    const userId = req.user?.id;
    const deals = await dealService.getAllDeals(userId);
    res.json(deals);
  } catch (error) {
    logger.error('Error getting all deals:', error);
    res.status(500).json({ error: 'Failed to get deals' });
  }
};

/**
 * Get a specific deal by ID
 */
export const getDealById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deal = await dealService.getDealById(id);
    
    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' });
    }
    
    res.json(deal);
  } catch (error) {
    logger.error(`Error getting deal ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to get deal' });
  }
};

/**
 * Get deals by property type
 */
export const getDealsByType = async (req: Request, res: Response) => {
  try {
    const { type } = req.params;
    
    if (type !== 'SFR' && type !== 'MF') {
      return res.status(400).json({ error: 'Invalid property type. Must be "SFR" or "MF"' });
    }
    
    // Get user ID from auth middleware if available
    const userId = req.user?.id;
    const deals = await dealService.getDealsByType(type, userId);
    res.json(deals);
  } catch (error) {
    logger.error(`Error getting ${req.params.type} deals:`, error);
    res.status(500).json({ error: 'Failed to get deals' });
  }
};

/**
 * Create a new deal
 */
export const createDeal = async (req: Request, res: Response) => {
  try {
    // Add user ID from auth middleware if available
    const dealData: Partial<IDeal> = {
      ...req.body,
      userId: req.user?.id
    };
    
    const deal = await dealService.saveDeal(dealData);
    res.status(201).json(deal);
  } catch (error) {
    logger.error('Error creating deal:', error);
    res.status(500).json({ error: 'Failed to create deal' });
  }
};

/**
 * Update an existing deal
 */
export const updateDeal = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Add user ID and ID from params
    const dealData: Partial<IDeal> = {
      ...req.body,
      _id: id,
      userId: req.user?.id
    };
    
    const deal = await dealService.saveDeal(dealData);
    res.json(deal);
  } catch (error) {
    logger.error(`Error updating deal ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to update deal' });
  }
};

/**
 * Delete a deal
 */
export const deleteDeal = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const success = await dealService.deleteDeal(id);
    
    if (!success) {
      return res.status(404).json({ error: 'Deal not found' });
    }
    
    res.json({ message: 'Deal deleted successfully' });
  } catch (error) {
    logger.error(`Error deleting deal ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to delete deal' });
  }
};

/**
 * Analyze a deal without saving
 */
export const analyzeDeal = async (req: Request, res: Response) => {
  try {
    const { propertyType, ...dealData } = req.body;
    
    if (propertyType !== 'SFR' && propertyType !== 'MF') {
      return res.status(400).json({ error: 'Invalid property type. Must be "SFR" or "MF"' });
    }
    
    let analysis;
    if (propertyType === 'SFR') {
      analysis = await analyzeSFRProperty(dealData);
    } else {
      analysis = await analyzeMFProperty(dealData);
    }
    
    res.json(analysis);
  } catch (error) {
    logger.error('Error analyzing deal:', error);
    res.status(500).json({ error: 'Failed to analyze deal' });
  }
}; 