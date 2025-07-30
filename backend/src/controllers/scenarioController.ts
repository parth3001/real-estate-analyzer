import { Request, Response } from 'express';
import { ScenarioModel } from '../models/Scenario';
import { DealModel } from '../models/Deal';
import { logger } from '../utils/logger';

// Extended Request interface to include user data (following existing auth patterns)
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

/**
 * Get all scenarios for a specific deal
 * GET /api/deals/:dealId/scenarios
 */
export const getScenarios = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { dealId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    // Verify the deal belongs to the user (security check following existing patterns)
    const deal = await DealModel.findOne({ _id: dealId, userId });
    if (!deal) {
      res.status(404).json({ error: 'Deal not found or access denied' });
      return;
    }

    // Get all scenarios for this deal, sorted by creation date (most recent first)
    const scenarios = await ScenarioModel.find({ 
      dealId, 
      userId 
    }).sort({ createdAt: -1 });

    logger.info(`Retrieved ${scenarios.length} scenarios for deal ${dealId} by user ${userId}`);

    res.json({
      scenarios,
      total: scenarios.length
    });
  } catch (error) {
    logger.error('Error getting scenarios:', error);
    res.status(500).json({ error: 'Failed to retrieve scenarios' });
  }
};

/**
 * Create a new scenario
 * POST /api/deals/:dealId/scenarios
 */
export const createScenario = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { dealId } = req.params;
    const userId = req.user?.id;
    const { name, description, propertyData, analysis, isFavorite = false, tags = [] } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    // Validate required fields
    if (!name || !propertyData || !analysis) {
      res.status(400).json({ 
        error: 'Missing required fields: name, propertyData, and analysis are required' 
      });
      return;
    }

    // Verify the deal belongs to the user (security check)
    const deal = await DealModel.findOne({ _id: dealId, userId });
    if (!deal) {
      res.status(404).json({ error: 'Deal not found or access denied' });
      return;
    }

    // Create new scenario (following Complete Storage Architecture)
    const scenario = new ScenarioModel({
      userId,
      dealId,
      name: name.trim(),
      description: description?.trim(),
      propertyData, // Complete property data snapshot
      analysis, // Complete analysis snapshot (no recalculation needed on load)
      isFavorite,
      tags: tags.filter((tag: string) => tag.trim()).map((tag: string) => tag.trim())
    });

    const savedScenario = await scenario.save();

    logger.info(`Scenario created: ${savedScenario._id} for deal ${dealId} by user ${userId}`);

    res.status(201).json({
      message: 'Scenario created successfully',
      scenario: savedScenario
    });
  } catch (error) {
    logger.error('Error creating scenario:', error);
    res.status(500).json({ error: 'Failed to create scenario' });
  }
};

/**
 * Get a specific scenario
 * GET /api/deals/:dealId/scenarios/:scenarioId
 */
export const getScenario = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { dealId, scenarioId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    // Get scenario with security checks (must belong to user and deal)
    const scenario = await ScenarioModel.findOne({ 
      _id: scenarioId, 
      dealId, 
      userId 
    });

    if (!scenario) {
      res.status(404).json({ error: 'Scenario not found or access denied' });
      return;
    }

    logger.info(`Retrieved scenario ${scenarioId} for deal ${dealId} by user ${userId}`);

    res.json(scenario);
  } catch (error) {
    logger.error('Error getting scenario:', error);
    res.status(500).json({ error: 'Failed to retrieve scenario' });
  }
};

/**
 * Update a scenario
 * PUT /api/deals/:dealId/scenarios/:scenarioId
 */
export const updateScenario = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { dealId, scenarioId } = req.params;
    const userId = req.user?.id;
    const updateData = req.body;

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    // Find and update scenario with security checks
    const scenario = await ScenarioModel.findOneAndUpdate(
      { 
        _id: scenarioId, 
        dealId, 
        userId 
      },
      { 
        ...updateData,
        lastModified: new Date()
      },
      { 
        new: true, // Return updated document
        runValidators: true 
      }
    );

    if (!scenario) {
      res.status(404).json({ error: 'Scenario not found or access denied' });
      return;
    }

    logger.info(`Updated scenario ${scenarioId} for deal ${dealId} by user ${userId}`);

    res.json({
      message: 'Scenario updated successfully',
      scenario
    });
  } catch (error) {
    logger.error('Error updating scenario:', error);
    res.status(500).json({ error: 'Failed to update scenario' });
  }
};

/**
 * Delete a scenario
 * DELETE /api/deals/:dealId/scenarios/:scenarioId
 */
export const deleteScenario = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { dealId, scenarioId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    // Find and delete scenario with security checks
    const scenario = await ScenarioModel.findOneAndDelete({ 
      _id: scenarioId, 
      dealId, 
      userId 
    });

    if (!scenario) {
      res.status(404).json({ error: 'Scenario not found or access denied' });
      return;
    }

    logger.info(`Deleted scenario ${scenarioId} for deal ${dealId} by user ${userId}`);

    res.json({
      message: 'Scenario deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting scenario:', error);
    res.status(500).json({ error: 'Failed to delete scenario' });
  }
};

/**
 * Toggle scenario favorite status
 * PATCH /api/deals/:dealId/scenarios/:scenarioId/favorite
 */
export const toggleScenarioFavorite = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { dealId, scenarioId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    // Find scenario and toggle favorite status
    const scenario = await ScenarioModel.findOne({ 
      _id: scenarioId, 
      dealId, 
      userId 
    });

    if (!scenario) {
      res.status(404).json({ error: 'Scenario not found or access denied' });
      return;
    }

    scenario.isFavorite = !scenario.isFavorite;
    scenario.lastModified = new Date();
    await scenario.save();

    logger.info(`Toggled favorite for scenario ${scenarioId} to ${scenario.isFavorite} by user ${userId}`);

    res.json({
      message: `Scenario ${scenario.isFavorite ? 'added to' : 'removed from'} favorites`,
      scenario
    });
  } catch (error) {
    logger.error('Error toggling scenario favorite:', error);
    res.status(500).json({ error: 'Failed to toggle scenario favorite' });
  }
};