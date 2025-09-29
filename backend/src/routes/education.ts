/**
 * Education Routes - Educational content endpoints
 *
 * Provides educational content that is completely separate from investment decisions.
 * This includes tax education, investment concepts, and general real estate education.
 */

import express from 'express';
import { taxEducationService } from '../services/education/taxEducationService';
import { logger } from '../utils/logger';

const router = express.Router();

/**
 * GET /api/education/tax-basics
 * Get basic tax education content (no property-specific calculations)
 */
router.get('/tax-basics', async (req, res) => {
  try {
    logger.info('Education API: Fetching basic tax education content');

    const educationalContent = await taxEducationService.getBasicEducation();

    res.json({
      success: true,
      educational: true,
      disclaimer: 'This is educational content only and does not constitute tax advice.',
      content: educationalContent
    });
  } catch (error) {
    logger.error('Education API: Error fetching tax basics', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch educational content',
      message: 'Please try again later'
    });
  }
});

/**
 * POST /api/education/tax-context
 * Get educational tax content with optional property context
 * This does NOT provide optimization or recommendations
 */
router.post('/tax-context', async (req, res) => {
  try {
    const { propertyData, topic } = req.body;

    logger.info('Education API: Generating educational tax content', {
      hasPropertyData: !!propertyData,
      requestedTopic: topic
    });

    // Generate educational content (no optimization)
    const educationalContent = await taxEducationService.generateEducationalContent(
      propertyData,
      topic
    );

    res.json({
      success: true,
      educational: true,
      disclaimer: 'This is educational content only and does not constitute tax advice or investment recommendations.',
      content: educationalContent
    });
  } catch (error) {
    logger.error('Education API: Error generating tax education', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate educational content',
      message: 'Please try again later'
    });
  }
});

/**
 * GET /api/education/tax-concepts/:concept
 * Get specific tax concept education
 */
router.get('/tax-concepts/:concept', async (req, res) => {
  try {
    const { concept } = req.params;

    logger.info('Education API: Fetching tax concept education', { concept });

    // Map concept to topic
    const topicMap: Record<string, 'rates' | 'timeline' | 'strategies'> = {
      'capital-gains': 'rates',
      'depreciation': 'rates',
      '1031-exchange': 'strategies',
      'hold-periods': 'timeline'
    };

    const topic = topicMap[concept];

    if (!topic) {
      return res.status(404).json({
        success: false,
        error: 'Concept not found',
        availableConcepts: Object.keys(topicMap)
      });
    }

    const educationalContent = await taxEducationService.generateEducationalContent(
      undefined,
      topic
    );

    res.json({
      success: true,
      educational: true,
      concept,
      content: educationalContent
    });
  } catch (error) {
    logger.error('Education API: Error fetching tax concept', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch concept education'
    });
  }
});

export default router;