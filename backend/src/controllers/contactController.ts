import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { emailService } from '../services/emailService';
import { logger } from '../utils/logger';

/**
 * Validation rules for contact form
 */
export const validateContactForm = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name is required and must be less than 100 characters'),

  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),

  body('subject')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Subject is required and must be less than 200 characters'),

  body('message')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Message must be between 10 and 2000 characters')
];

/**
 * Handle validation errors
 */
const handleValidationErrors = (req: Request, res: Response): boolean => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => error.msg);
    res.status(400).json({
      error: 'Validation failed',
      details: errorMessages
    });
    return true;
  }
  return false;
};

/**
 * Submit contact form
 */
export const submitContactForm = async (req: Request, res: Response): Promise<void> => {
  try {
    // Check for validation errors
    if (handleValidationErrors(req, res)) return;

    const { name, email, subject, message } = req.body;

    logger.info(`[ContactController] Contact form submission from: ${email}`);

    // Send email to admin
    await emailService.sendContactUsMessage(name, email, subject, message);

    logger.info(`[ContactController] Contact form processed successfully for: ${email}`);

    res.json({
      message: 'Your message has been sent successfully. We\'ll get back to you soon!',
      success: true
    });

  } catch (error) {
    logger.error('[ContactController] Error processing contact form:', error);
    res.status(500).json({
      error: 'Failed to send message. Please try again later.',
      success: false
    });
  }
};