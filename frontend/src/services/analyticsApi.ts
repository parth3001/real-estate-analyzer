import api from './api';
import type { AnalyticsResponse, AnalyticsTimePeriod } from '../types/analytics';

/**
 * Analytics API Service
 *
 * Admin-only API calls for platform analytics
 * All endpoints require authentication and admin role
 */

/**
 * Fetch analytics summary for specified time period
 * @param days - Time period (7, 30, or 90 days)
 * @param environment - Filter by environment ('development', 'production', or undefined for all)
 * @returns Analytics summary data
 */
export const fetchAnalyticsSummary = async (
  days: AnalyticsTimePeriod = 7,
  environment?: 'development' | 'production'
): Promise<AnalyticsResponse> => {
  let url = `/analytics/summary?days=${days}`;
  if (environment) {
    url += `&environment=${environment}`;
  }
  const response = await api.get(url);
  return response.data;
};

/**
 * Fetch user engagement metrics
 * @param days - Time period (7, 30, or 90 days)
 * @returns User engagement data
 */
export const fetchUserEngagement = async (
  days: AnalyticsTimePeriod = 30
): Promise<any> => {
  const response = await api.get(`/analytics/engagement?days=${days}`);
  return response.data;
};

/**
 * Fetch raw analytics events (for debugging/export)
 * @param type - Event type filter (optional)
 * @param days - Time period
 * @param limit - Max results
 * @returns Raw analytics events
 */
export const fetchRawEvents = async (
  type?: string,
  days: number = 7,
  limit: number = 100
): Promise<any> => {
  let url = `/analytics/events?days=${days}&limit=${limit}`;
  if (type) {
    url += `&type=${type}`;
  }
  const response = await api.get(url);
  return response.data;
};
