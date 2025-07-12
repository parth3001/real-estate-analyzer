/**
 * Property Wizard API Routes
 * 
 * Handles wizard-specific endpoints for property lookup and smart defaults
 * Leverages existing cached services (FRED, RentCast) to minimize API costs
 */

import express, { Router, Request, Response } from 'express';
import { logger } from '../utils/logger';
import { propertyDataAggregator } from '../services/propertyDataAggregator';
import {
  PropertyLookupRequest,
  SmartDefaultsRequest,
  AddressValidationRequest
} from '../types/wizardTypes';
import { convertWizardToSFRData, analyzePropertyFromWizard } from '../controllers/wizardController';

const router: Router = express.Router();

/**
 * POST /api/wizard/property-lookup
 * Look up property details by address using cached APIs
 */
router.post('/property-lookup', async (req: Request, res: Response) => {
  const startTime = Date.now();
  
  try {
    const lookupRequest: PropertyLookupRequest = {
      address: req.body.address,
      includeComparables: req.body.includeComparables ?? true,
      includeMarketData: req.body.includeMarketData ?? true,
      includeTaxData: req.body.includeTaxData ?? false, // Phase 2
      includeInsuranceEstimate: req.body.includeInsuranceEstimate ?? false // Phase 2
    };

    // Validate required fields
    if (!lookupRequest.address || typeof lookupRequest.address !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Address is required and must be a string'
      });
    }

    logger.info('Property lookup request received', {
      address: lookupRequest.address,
      includeComparables: lookupRequest.includeComparables,
      includeMarketData: lookupRequest.includeMarketData,
      clientIP: req.ip
    });

    // Use PropertyDataAggregator to orchestrate the lookup
    const result = await propertyDataAggregator.lookupProperty(lookupRequest);

    // Log the response for monitoring
    logger.info('Property lookup completed', {
      address: lookupRequest.address,
      success: result.success,
      duration: Date.now() - startTime,
      hasPropertyDetails: !!result.propertyDetails,
      hasRentEstimate: !!result.rentEstimate,
      hasComparables: result.comparables?.length || 0,
      apiCallsSuccessful: result.apiCalls.successful.length,
      apiCallsCached: result.apiCalls.cached.length,
      apiCallsFailed: result.apiCalls.failed.length
    });

    // Return standardized response
    res.status(result.success ? 200 : 404).json(result);

  } catch (error) {
    logger.error('Property lookup endpoint error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      duration: Date.now() - startTime,
      requestBody: req.body
    });

    res.status(500).json({
      success: false,
      error: 'Internal server error during property lookup',
      apiCalls: {
        successful: [],
        failed: ['PropertyLookup'],
        cached: []
      }
    });
  }
});

/**
 * POST /api/wizard/smart-defaults
 * Get intelligent defaults based on location and property type
 */
router.post('/smart-defaults', async (req: Request, res: Response) => {
  const startTime = Date.now();

  try {
    const defaultsRequest: SmartDefaultsRequest = {
      zipCode: req.body.zipCode,
      propertyType: req.body.propertyType || 'SFR',
      propertyValue: req.body.propertyValue,
      squareFootage: req.body.squareFootage
    };

    // Validate required fields
    if (!defaultsRequest.zipCode || typeof defaultsRequest.zipCode !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'ZIP code is required and must be a string'
      });
    }

    if (!['SFR', 'MF'].includes(defaultsRequest.propertyType)) {
      return res.status(400).json({
        success: false,
        error: 'Property type must be either SFR or MF'
      });
    }

    logger.info('Smart defaults request received', {
      zipCode: defaultsRequest.zipCode,
      propertyType: defaultsRequest.propertyType,
      propertyValue: defaultsRequest.propertyValue,
      clientIP: req.ip
    });

    // Get smart defaults using cached economic and market data
    const result = await propertyDataAggregator.getSmartDefaults(defaultsRequest);

    logger.info('Smart defaults completed', {
      zipCode: defaultsRequest.zipCode,
      success: result.success,
      duration: Date.now() - startTime,
      hasRegionalContext: !!result.regionalContext,
      economicDataSource: result.defaults.dataSources?.economic,
      marketDataSource: result.defaults.dataSources?.market
    });

    res.status(result.success ? 200 : 500).json(result);

  } catch (error) {
    logger.error('Smart defaults endpoint error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      duration: Date.now() - startTime,
      requestBody: req.body
    });

    res.status(500).json({
      success: false,
      error: 'Internal server error during smart defaults generation'
    });
  }
});

/**
 * POST /api/wizard/validate-address
 * Validate and standardize address format
 */
router.post('/validate-address', async (req: Request, res: Response) => {
  const startTime = Date.now();

  try {
    const validationRequest: AddressValidationRequest = {
      address: req.body.address,
      validateOnly: req.body.validateOnly ?? true
    };

    if (!validationRequest.address || typeof validationRequest.address !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Address is required and must be a string'
      });
    }

    logger.info('Address validation request received', {
      address: validationRequest.address,
      validateOnly: validationRequest.validateOnly,
      clientIP: req.ip
    });

    // Basic address validation for Phase 1
    // In Phase 2, this would integrate with proper address validation APIs
    const addressParts = validationRequest.address.split(',').map(part => part.trim());
    
    const result = {
      success: true,
      isValid: addressParts.length >= 2,
      standardizedAddress: addressParts.length >= 2 ? {
        street: addressParts[0] || '',
        city: addressParts[1] || '',
        state: addressParts[2] || '',
        zipCode: addressParts[3] || '',
        formattedAddress: validationRequest.address
      } : undefined,
      suggestions: addressParts.length < 2 ? [
        { address: validationRequest.address + ', City, State', confidence: 0.7 }
      ] : undefined
    };

    logger.info('Address validation completed', {
      address: validationRequest.address,
      isValid: result.isValid,
      duration: Date.now() - startTime
    });

    res.status(200).json(result);

  } catch (error) {
    logger.error('Address validation endpoint error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      duration: Date.now() - startTime,
      requestBody: req.body
    });

    res.status(500).json({
      success: false,
      error: 'Internal server error during address validation'
    });
  }
});

/**
 * GET /api/wizard/health
 * Health check for wizard services
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    // Check health of underlying services
    const fredHealth = await import('../services/fredService').then(module => 
      module.fredService.healthCheck()
    );
    
    const rentcastHealth = await import('../services/rentcastService').then(module =>
      module.rentcastService.healthCheck()  
    );

    const overallHealth = fredHealth.status === 'healthy' && rentcastHealth.status === 'healthy' 
      ? 'healthy' : 'degraded';

    const healthStatus = {
      status: overallHealth,
      timestamp: new Date().toISOString(),
      services: {
        fred: fredHealth,
        rentcast: rentcastHealth,
        aggregator: { status: 'healthy', message: 'PropertyDataAggregator operational' }
      },
      version: '1.0.0-phase1'
    };

    logger.info('Wizard health check completed', { status: overallHealth });

    res.status(overallHealth === 'healthy' ? 200 : 503).json(healthStatus);

  } catch (error) {
    logger.error('Wizard health check failed', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: 'Health check failed'
    });
  }
});

/**
 * POST /api/wizard/convert
 * Convert wizard data to standard SFR format
 */
router.post('/convert', convertWizardToSFRData);

/**
 * POST /api/wizard/analyze
 * Analyze property using wizard data with enhanced metadata
 */
router.post('/analyze', analyzePropertyFromWizard);

/**
 * GET /api/wizard/stats
 * Get usage statistics for monitoring
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    // Basic stats for Phase 1 - will enhance with proper analytics in later phases
    const stats = {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      phase: 'Phase 1 - Foundation',
      features: {
        propertyLookup: 'enabled',
        smartDefaults: 'enabled',
        addressValidation: 'basic',
        externalApis: 'cached (FRED, RentCast)',
        costOptimization: 'MongoDB caching active'
      }
    };

    res.status(200).json(stats);

  } catch (error) {
    logger.error('Stats endpoint error', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    res.status(500).json({
      error: 'Failed to retrieve stats'
    });
  }
});

export default router;