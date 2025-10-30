/**
 * Feedback Routes
 * API endpoints for beta user feedback collection
 */

import express from 'express';
import Feedback from '../models/Feedback';

const router = express.Router();

/**
 * POST /api/feedback
 * Submit user feedback
 */
router.post('/', async (req, res) => {
  try {
    const {
      usefulnessRating,
      mostHelpfulFeature,
      easeOfUse,
      wouldRecommend,
      additionalFeedback,
      dealId,
      propertyAddress,
      submittedAt,
    } = req.body;

    // Validation
    if (!usefulnessRating || usefulnessRating < 1 || usefulnessRating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Usefulness rating is required and must be between 1 and 5',
      });
    }

    // Create feedback document
    const feedback = new Feedback({
      usefulnessRating,
      mostHelpfulFeature: mostHelpfulFeature || '',
      easeOfUse: easeOfUse || '',
      wouldRecommend: wouldRecommend || '',
      additionalFeedback: additionalFeedback || '',
      dealId,
      propertyAddress,
      submittedAt: submittedAt ? new Date(submittedAt) : new Date(),
      // Optional: Add user info if authenticated
      // userId: req.user?.id,
      // userEmail: req.user?.email,
    });

    await feedback.save();

    console.log('Feedback submitted successfully:', {
      feedbackId: feedback._id,
      rating: usefulnessRating,
      dealId,
    });

    res.status(201).json({
      success: true,
      feedbackId: feedback._id.toString(),
      message: 'Thank you for your feedback!',
    });
  } catch (error) {
    console.error('Error saving feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save feedback. Please try again.',
    });
  }
});

/**
 * GET /api/feedback/stats
 * Get feedback statistics (admin only in production)
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await Feedback.aggregate([
      {
        $group: {
          _id: null,
          totalFeedback: { $sum: 1 },
          averageRating: { $avg: '$usefulnessRating' },
          ratingDistribution: {
            $push: '$usefulnessRating',
          },
        },
      },
    ]);

    const featureStats = await Feedback.aggregate([
      { $match: { mostHelpfulFeature: { $ne: '' } } },
      {
        $group: {
          _id: '$mostHelpfulFeature',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    const easeOfUseStats = await Feedback.aggregate([
      { $match: { easeOfUse: { $ne: '' } } },
      {
        $group: {
          _id: '$easeOfUse',
          count: { $sum: 1 },
        },
      },
    ]);

    const recommendStats = await Feedback.aggregate([
      { $match: { wouldRecommend: { $ne: '' } } },
      {
        $group: {
          _id: '$wouldRecommend',
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({
      success: true,
      stats: {
        total: stats[0]?.totalFeedback || 0,
        averageRating: stats[0]?.averageRating?.toFixed(2) || '0.00',
        ratingDistribution: stats[0]?.ratingDistribution || [],
        topFeatures: featureStats,
        easeOfUse: easeOfUseStats,
        recommendations: recommendStats,
      },
    });
  } catch (error) {
    console.error('Error fetching feedback stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch feedback statistics',
    });
  }
});

/**
 * GET /api/feedback/recent
 * Get recent feedback submissions (admin only in production)
 */
router.get('/recent', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const recentFeedback = await Feedback.find()
      .sort({ submittedAt: -1 })
      .limit(limit)
      .select('-__v');

    res.json({
      success: true,
      feedback: recentFeedback,
      count: recentFeedback.length,
    });
  } catch (error) {
    console.error('Error fetching recent feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recent feedback',
    });
  }
});

/**
 * GET /api/feedback/user/:userId
 * Get feedback for specific user (future use)
 */
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const userFeedback = await Feedback.find({ userId })
      .sort({ submittedAt: -1 })
      .select('-__v');

    res.json({
      success: true,
      feedback: userFeedback,
      count: userFeedback.length,
    });
  } catch (error) {
    console.error('Error fetching user feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user feedback',
    });
  }
});

export default router;
