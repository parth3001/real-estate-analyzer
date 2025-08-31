import { Request, Response } from 'express';
import { portfolioService, CreatePortfolioRequest, UpdatePortfolioRequest } from '../services/portfolio/portfolioService';
import { AuthenticatedRequest } from '../middleware/auth';
import { portfolioAnalyticsService } from '../services/portfolio/portfolioAnalyticsService';
import { enhancedPortfolioAI } from '../services/portfolio/enhancedPortfolioAI';

/**
 * Portfolio Controller - Handles portfolio-related API requests
 * Following existing patterns from deals.ts controller
 */

/**
 * Create a new portfolio
 * POST /api/portfolios
 */
export const createPortfolio = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const portfolioData: CreatePortfolioRequest = req.body;

    // Basic validation
    if (!portfolioData.name || portfolioData.name.trim().length === 0) {
      return res.status(400).json({ error: 'Portfolio name is required' });
    }

    if (!portfolioData.goals || !portfolioData.goals.primaryGoal || !portfolioData.goals.riskTolerance) {
      return res.status(400).json({ error: 'Portfolio goals are required' });
    }

    // Validate goal-specific requirements
    if (portfolioData.goals.primaryGoal === 'CASH_FLOW' && !portfolioData.goals.targetMonthlyIncome) {
      return res.status(400).json({ error: 'Target monthly income is required for cash flow goals' });
    }

    if (portfolioData.goals.primaryGoal === 'WEALTH_BUILDING' && !portfolioData.goals.targetNetWorth) {
      return res.status(400).json({ error: 'Target net worth is required for wealth building goals' });
    }

    const portfolio = await portfolioService.createPortfolio(userId, portfolioData);

    res.status(201).json({
      success: true,
      portfolio: {
        id: portfolio._id,
        name: portfolio.name,
        description: portfolio.description,
        goals: portfolio.goals,
        settings: portfolio.settings,
        status: portfolio.status,
        createdAt: portfolio.createdAt
      }
    });
  } catch (error: any) {
    console.error('Error in createPortfolio:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to create portfolio' 
    });
  }
};

/**
 * Get all portfolios for the authenticated user
 * GET /api/portfolios
 */
export const getUserPortfolios = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const portfolios = await portfolioService.getUserPortfolios(userId);

    res.json({
      success: true,
      portfolios
    });
  } catch (error: any) {
    console.error('Error in getUserPortfolios:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to get portfolios' 
    });
  }
};

/**
 * Get detailed portfolio information
 * GET /api/portfolios/:id
 */
export const getPortfolioDetails = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const portfolioId = req.params.id;
    if (!portfolioId) {
      return res.status(400).json({ error: 'Portfolio ID is required' });
    }

    const details = await portfolioService.getPortfolioDetails(portfolioId, userId);

    res.json({
      success: true,
      portfolio: {
        id: details.portfolio._id,
        name: details.portfolio.name,
        description: details.portfolio.description,
        goals: details.portfolio.goals,
        settings: details.portfolio.settings,
        status: details.portfolio.status,
        createdAt: details.portfolio.createdAt,
        updatedAt: details.portfolio.updatedAt
      },
      analytics: details.analytics,
      recommendations: details.recommendations.map(rec => ({
        id: rec._id,
        type: rec.type,
        priority: rec.priority,
        title: rec.title,
        description: rec.description,
        status: rec.status,
        createdAt: rec.createdAt
      })),
      properties: details.properties.map(prop => ({
        id: prop._id,
        propertyName: prop.propertyName,
        address: prop.address,
        purchasePrice: prop.purchasePrice,
        analysis: prop.analysis
      })),
      totalProperties: details.totalProperties
    });
  } catch (error: any) {
    console.error('Error in getPortfolioDetails:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to get portfolio details' 
    });
  }
};

/**
 * Update portfolio information
 * PUT /api/portfolios/:id
 */
export const updatePortfolio = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const portfolioId = req.params.id;
    if (!portfolioId) {
      return res.status(400).json({ error: 'Portfolio ID is required' });
    }

    const updates: UpdatePortfolioRequest = req.body;

    // Validate updates if provided
    if (updates.name !== undefined && updates.name.trim().length === 0) {
      return res.status(400).json({ error: 'Portfolio name cannot be empty' });
    }

    if (updates.goals?.primaryGoal === 'CASH_FLOW' && 
        updates.goals.targetMonthlyIncome === undefined) {
      return res.status(400).json({ error: 'Target monthly income is required for cash flow goals' });
    }

    if (updates.goals?.primaryGoal === 'WEALTH_BUILDING' && 
        updates.goals.targetNetWorth === undefined) {
      return res.status(400).json({ error: 'Target net worth is required for wealth building goals' });
    }

    const portfolio = await portfolioService.updatePortfolio(portfolioId, userId, updates);

    res.json({
      success: true,
      portfolio: {
        id: portfolio._id,
        name: portfolio.name,
        description: portfolio.description,
        goals: portfolio.goals,
        settings: portfolio.settings,
        status: portfolio.status,
        updatedAt: portfolio.updatedAt
      }
    });
  } catch (error: any) {
    console.error('Error in updatePortfolio:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to update portfolio' 
    });
  }
};

/**
 * Archive a portfolio (soft delete)
 * DELETE /api/portfolios/:id
 */
export const archivePortfolio = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const portfolioId = req.params.id;
    if (!portfolioId) {
      return res.status(400).json({ error: 'Portfolio ID is required' });
    }

    await portfolioService.archivePortfolio(portfolioId, userId);

    res.json({
      success: true,
      message: 'Portfolio archived successfully'
    });
  } catch (error: any) {
    console.error('Error in archivePortfolio:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to archive portfolio' 
    });
  }
};

/**
 * Add a property to a portfolio
 * POST /api/portfolios/:id/properties
 */
export const addPropertyToPortfolio = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const portfolioId = req.params.id;
    const { propertyId } = req.body;

    if (!portfolioId || !propertyId) {
      return res.status(400).json({ error: 'Portfolio ID and property ID are required' });
    }

    await portfolioService.addPropertyToPortfolio(portfolioId, propertyId, userId);

    res.json({
      success: true,
      message: 'Property added to portfolio successfully'
    });
  } catch (error: any) {
    console.error('Error in addPropertyToPortfolio:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to add property to portfolio' 
    });
  }
};

/**
 * Remove a property from a portfolio
 * DELETE /api/portfolios/:id/properties/:propertyId
 */
export const removePropertyFromPortfolio = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const portfolioId = req.params.id;
    const propertyId = req.params.propertyId;

    if (!portfolioId || !propertyId) {
      return res.status(400).json({ error: 'Portfolio ID and property ID are required' });
    }

    await portfolioService.removePropertyFromPortfolio(portfolioId, propertyId, userId);

    res.json({
      success: true,
      message: 'Property removed from portfolio successfully'
    });
  } catch (error: any) {
    console.error('Error in removePropertyFromPortfolio:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to remove property from portfolio' 
    });
  }
};

/**
 * Get available portfolios for adding a property
 * GET /api/portfolios/available
 */
export const getAvailablePortfolios = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const portfolios = await portfolioService.getAvailablePortfoliosForProperty(userId);

    res.json({
      success: true,
      portfolios
    });
  } catch (error: any) {
    console.error('Error in getAvailablePortfolios:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to get available portfolios' 
    });
  }
};

/**
 * Manually recalculate portfolio analytics (debug endpoint)
 * POST /api/portfolios/:id/recalculate-analytics
 */
export const recalculatePortfolioAnalytics = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const portfolioId = req.params.id;
    if (!portfolioId) {
      return res.status(400).json({ error: 'Portfolio ID is required' });
    }

    // Verify portfolio ownership
    const hasAccess = await portfolioService.verifyPortfolioOwnership(portfolioId, userId);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    console.log(`Manually recalculating analytics for portfolio: ${portfolioId}`);
    const analytics = await portfolioAnalyticsService.calculatePortfolioAnalytics(portfolioId);

    res.json({
      success: true,
      analytics,
      message: 'Analytics recalculated successfully'
    });
  } catch (error: any) {
    console.error('Error in recalculatePortfolioAnalytics:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to recalculate analytics' 
    });
  }
};

// ==================== PHASE 4: ENHANCED AI INSIGHTS ====================

/**
 * Get portfolio health check insights
 * GET /api/portfolios/:id/health-check
 */
export const getPortfolioHealthCheck = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const portfolioId = req.params.id;
    if (!portfolioId) {
      return res.status(400).json({ error: 'Portfolio ID is required' });
    }

    // Verify portfolio ownership
    const hasAccess = await portfolioService.verifyPortfolioOwnership(portfolioId, userId);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    console.log(`Generating health check insights for portfolio: ${portfolioId}`);
    const healthCheck = await enhancedPortfolioAI.generatePortfolioHealthCheck(portfolioId);

    res.json({
      success: true,
      healthCheck,
      generated: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Error in getPortfolioHealthCheck:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to generate health check insights' 
    });
  }
};

/**
 * Get peer comparison insights
 * GET /api/portfolios/:id/peer-comparison
 */
export const getPeerComparison = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const portfolioId = req.params.id;
    if (!portfolioId) {
      return res.status(400).json({ error: 'Portfolio ID is required' });
    }

    // Verify portfolio ownership
    const hasAccess = await portfolioService.verifyPortfolioOwnership(portfolioId, userId);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    console.log(`Generating peer comparison for portfolio: ${portfolioId}`);
    const peerComparison = await enhancedPortfolioAI.generatePeerComparison(portfolioId);
    console.log('Generated peer comparison result:', peerComparison);

    res.json({
      success: true,
      peerComparison,
      generated: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Error in getPeerComparison:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to generate peer comparison insights' 
    });
  }
};

/**
 * Get goal achievement path insights
 * GET /api/portfolios/:id/goal-path
 */
export const getGoalAchievementPath = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const portfolioId = req.params.id;
    if (!portfolioId) {
      return res.status(400).json({ error: 'Portfolio ID is required' });
    }

    // Verify portfolio ownership
    const hasAccess = await portfolioService.verifyPortfolioOwnership(portfolioId, userId);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    console.log(`Generating goal achievement path for portfolio: ${portfolioId}`);
    const goalPath = await enhancedPortfolioAI.generateGoalAchievementPath(portfolioId);

    res.json({
      success: true,
      goalPath,
      generated: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Error in getGoalAchievementPath:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to generate goal achievement path' 
    });
  }
};

/**
 * Get comprehensive AI insights (all three types)
 * GET /api/portfolios/:id/comprehensive-insights
 */
export const getComprehensiveInsights = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const portfolioId = req.params.id;
    if (!portfolioId) {
      return res.status(400).json({ error: 'Portfolio ID is required' });
    }

    // Verify portfolio ownership
    const hasAccess = await portfolioService.verifyPortfolioOwnership(portfolioId, userId);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    console.log(`Generating comprehensive insights for portfolio: ${portfolioId}`);
    const insights = await enhancedPortfolioAI.generateAllInsights(portfolioId);

    res.json({
      success: true,
      insights,
      generated: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Error in getComprehensiveInsights:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to generate comprehensive insights' 
    });
  }
};