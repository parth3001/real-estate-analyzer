/**
 * Market Data API Routes
 * 
 * Endpoints for testing and accessing market intelligence features
 */

import express from 'express';
import { logger } from '../utils/logger.js';
import { marketIntelligenceService } from '../services/marketIntelligenceService';
import { rentcastService } from '../services/rentcastService';
import { fredService } from '../services/fredService';
import { cacheService } from '../services/cacheService';

const router = express.Router();

/**
 * Health check for all market data services
 */
router.get('/health', async (req, res) => {
  try {
    logger.info('Market data health check requested');
    
    const healthCheck = await marketIntelligenceService.healthCheck();
    const cacheStats = await cacheService.getStats();
    const cacheHealth = await cacheService.healthCheck();
    
    const response = {
      status: healthCheck.status,
      timestamp: new Date().toISOString(),
      services: healthCheck.services,
      cache: {
        status: cacheHealth.status,
        message: cacheHealth.message,
        stats: cacheStats
      },
      features: {
        enableMarketData: process.env.ENABLE_MARKET_DATA === 'true',
        enableInvestmentTiming: process.env.ENABLE_INVESTMENT_TIMING === 'true',
        enableComparableProperties: process.env.ENABLE_COMPARABLE_PROPERTIES === 'true'
      }
    };
    
    const statusCode = healthCheck.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(response);
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(500).json({
      status: 'error',
      message: 'Health check failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Test RentCast API integration
 */
router.get('/test/rentcast', async (req, res) => {
  try {
    const { address, zipCode } = req.query;
    
    if (!address && !zipCode) {
      return res.status(400).json({
        error: 'Either address or zipCode parameter is required'
      });
    }
    
    logger.info('Testing RentCast API integration', { address, zipCode });
    
    const results: any = {};
    
    // Test property data if address provided
    if (address) {
      try {
        results.propertyData = await rentcastService.getPropertyRentEstimate(address as string);
      } catch (error) {
        results.propertyError = error instanceof Error ? error.message : 'Unknown error';
      }
      
      // Test comparables
      try {
        results.comparables = await rentcastService.getComparableProperties(address as string, 0.5, 5);
      } catch (error) {
        results.comparablesError = error instanceof Error ? error.message : 'Unknown error';
      }
    }
    
    // Test market trends if ZIP code provided
    if (zipCode) {
      try {
        results.marketTrends = await rentcastService.getMarketTrends(zipCode as string);
      } catch (error) {
        results.marketTrendsError = error instanceof Error ? error.message : 'Unknown error';
      }
    }
    
    // Add rate limit status
    results.rateLimitStatus = rentcastService.getRateLimitStatus();
    
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      testParameters: { address, zipCode },
      results
    });
  } catch (error) {
    logger.error('RentCast test failed:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Test FRED API integration
 */
router.get('/test/fred', async (req, res) => {
  try {
    logger.info('Testing FRED API integration');
    
    const results = await fredService.getEconomicIndicators();
    const cacheStats = fredService.getCacheStats();
    
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      results,
      cacheStats
    });
  } catch (error) {
    logger.error('FRED test failed:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Test comprehensive market intelligence
 */
router.post('/test/comprehensive', async (req, res) => {
  try {
    const { address, zipCode, city, state, propertyType } = req.body;
    
    if (!address || !zipCode) {
      return res.status(400).json({
        error: 'address and zipCode are required'
      });
    }
    
    logger.info('Testing comprehensive market intelligence', { address, zipCode });
    
    const query = {
      address,
      zipCode,
      city: city || 'Unknown',
      state: state || 'Unknown',
      propertyType,
      includeEconomicData: true
    };
    
    const marketData = await marketIntelligenceService.getComprehensiveMarketData(query);
    
    // Generate insights
    const mockPropertyData = {
      monthlyRent: 2500,
      purchasePrice: 450000
    };
    
    const marketInsights = await marketIntelligenceService.generateMarketInsights(
      mockPropertyData,
      marketData
    );
    
    const investmentTiming = await marketIntelligenceService.analyzeInvestmentTiming(marketData);
    
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      query,
      results: {
        marketData,
        marketInsights,
        investmentTiming
      }
    });
  } catch (error) {
    logger.error('Comprehensive market intelligence test failed:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get market trends for a ZIP code
 */
router.get('/trends/:zipCode', async (req, res) => {
  try {
    const { zipCode } = req.params;
    
    logger.info(`Fetching market trends for ZIP: ${zipCode}`);
    
    const marketData = await marketIntelligenceService.getComprehensiveMarketData({
      address: '',
      zipCode,
      city: 'Unknown',
      state: 'Unknown'
    });
    
    res.json({
      success: true,
      zipCode,
      marketTrends: marketData.marketTrends,
      economicIndicators: marketData.economicIndicators,
      lastUpdated: marketData.lastUpdated,
      dataSource: marketData.dataSource
    });
  } catch (error) {
    logger.error(`Failed to fetch market trends for ${req.params.zipCode}:`, error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get comparable properties for an address
 */
router.get('/comparables', async (req, res) => {
  try {
    const { address, radius = 0.5, limit = 10 } = req.query;
    
    if (!address) {
      return res.status(400).json({
        error: 'address parameter is required'
      });
    }
    
    logger.info(`Fetching comparables for: ${address}`);
    
    const comparables = await rentcastService.getComparableProperties(
      address as string,
      parseFloat(radius as string),
      parseInt(limit as string)
    );
    
    res.json({
      success: true,
      address,
      radius: parseFloat(radius as string),
      limit: parseInt(limit as string),
      comparables,
      count: comparables.length
    });
  } catch (error) {
    logger.error(`Failed to fetch comparables for ${req.query.address}:`, error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get economic indicators
 */
router.get('/economic-indicators', async (req, res) => {
  try {
    logger.info('Fetching economic indicators');
    
    const indicators = await fredService.getEconomicIndicators();
    
    res.json({
      success: true,
      indicators,
      lastUpdated: indicators.lastUpdated,
      dataSource: indicators.dataSource
    });
  } catch (error) {
    logger.error('Failed to fetch economic indicators:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Cache management endpoints
 */
router.get('/cache/stats', async (req, res) => {
  try {
    const stats = await cacheService.getStats();
    const topKeys = await cacheService.getTopKeys(10);
    
    res.json({
      success: true,
      stats,
      topKeys
    });
  } catch (error) {
    logger.error('Failed to get cache stats:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/cache/clear', (req, res) => {
  try {
    marketIntelligenceService.clearCache();
    
    res.json({
      success: true,
      message: 'Cache cleared successfully'
    });
  } catch (error) {
    logger.error('Failed to clear cache:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Feature flags endpoint
 */
router.get('/features', (req, res) => {
  res.json({
    enableMarketData: process.env.ENABLE_MARKET_DATA === 'true',
    enableInvestmentTiming: process.env.ENABLE_INVESTMENT_TIMING === 'true',
    enableComparableProperties: process.env.ENABLE_COMPARABLE_PROPERTIES === 'true',
    rateLimitPerHour: parseInt(process.env.MARKET_API_RATE_LIMIT || '100'),
    cacheTTLMinutes: parseInt(process.env.CACHE_TTL_MINUTES || '60')
  });
});

export default router;