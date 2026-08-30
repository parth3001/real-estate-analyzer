/**
 * Feedback API Service
 * Handles beta user feedback submission to backend
 */

import axios from 'axios';
import api from './api';

// NOTE: this module used to build its own base URL from VITE_API_BASE_URL,
// a var that was set nowhere and fell back to http://localhost:3000 — so in
// production every feedback submission POSTed to the user's own machine and
// silently failed. It now uses the shared client like every other service.

export interface FeedbackSubmission {
  usefulnessRating: number;
  mostHelpfulFeature: string;
  easeOfUse: string;
  wouldRecommend: string;
  additionalFeedback: string;
  dealId?: string;
  propertyAddress?: string;
  submittedAt: string;
}

export interface FeedbackResponse {
  success: boolean;
  feedbackId: string;
  message: string;
}

/**
 * Submit user feedback to backend
 */
export const submitFeedback = async (
  feedback: FeedbackSubmission
): Promise<FeedbackResponse> => {
  try {
    const response = await api.post<FeedbackResponse>('/feedback', feedback, {
      timeout: 10000, // 10 second timeout
    });

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Feedback submission failed:', {
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
      });
      throw new Error(
        error.response?.data?.message || 'Failed to submit feedback. Please try again.'
      );
    }
    throw error;
  }
};

/**
 * Get user's feedback history (optional - for future use)
 */
export const getUserFeedback = async (userId: string): Promise<FeedbackSubmission[]> => {
  try {
    const response = await api.get<{ feedback: FeedbackSubmission[] }>(
      `/feedback/user/${userId}`
    );
    return response.data.feedback;
  } catch (error) {
    console.error('Failed to fetch user feedback:', error);
    return [];
  }
};

export const feedbackApi = {
  submitFeedback,
  getUserFeedback,
};
