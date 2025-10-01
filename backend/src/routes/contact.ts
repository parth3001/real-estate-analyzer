import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { submitContactForm, validateContactForm } from '../controllers/contactController';

const router = Router();

// Strict rate limiting for contact form to prevent spam
const contactRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 2, // 2 contact form submissions per window per IP
  message: {
    error: 'Too many contact form submissions. Please try again in 15 minutes.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * @route   POST /api/contact
 * @desc    Submit contact form
 * @access  Public
 */
router.post('/', contactRateLimit, validateContactForm, submitContactForm);

export default router;