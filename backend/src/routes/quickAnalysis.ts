import express from 'express';
import { logger } from '../utils/logger';
import { QuickCalculationService } from '../services/quickCalculationService';
import type { SFRData } from '../types/propertyTypes';

const router = express.Router();

/**
 * Quick Analysis Route - Lightning Fast Financial Calculations
 * Target: <50ms response time
 * Used for: Real-time parameter updates in Interactive Analysis
 */
router.post('/quick-calculate', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const propertyData: SFRData = req.body;
    
    // Validate essential fields
    if (!propertyData.purchasePrice || !propertyData.monthlyRent) {
      return res.status(400).json({ 
        error: 'Purchase price and monthly rent are required for quick calculations' 
      });
    }

    logger.info('Quick calculation request received:', {
      purchasePrice: propertyData.purchasePrice,
      monthlyRent: propertyData.monthlyRent,
      downPayment: propertyData.downPayment,
      interestRate: propertyData.interestRate
    });

    // Perform lightning-fast calculations
    const metrics = QuickCalculationService.calculateMetrics(propertyData);
    
    const totalTime = Date.now() - startTime;
    
    logger.info('Quick calculation completed:', {
      calculationTime: metrics.calculationTime,
      totalResponseTime: totalTime,
      monthlyCashFlow: metrics.monthlyAnalysis.cashFlow,
      capRate: metrics.keyMetrics.capRate,
      cocReturn: metrics.keyMetrics.cashOnCashReturn
    });

    // Ensure we're under performance target
    if (totalTime > 100) {
      logger.warn('Quick calculation exceeded performance target:', {
        targetMs: 50,
        actualMs: totalTime
      });
    }

    res.json({
      success: true,
      data: metrics,
      performanceMetrics: {
        calculationTime: metrics.calculationTime,
        totalResponseTime: totalTime,
        targetMs: 50
      }
    });

  } catch (error) {
    const totalTime = Date.now() - startTime;
    logger.error('Quick calculation error:', error);
    logger.error('Quick calculation failed in', totalTime, 'ms');
    
    res.status(500).json({
      error: 'Quick calculation failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      performanceMetrics: {
        totalResponseTime: totalTime,
        failed: true
      }
    });
  }
});

export default router;