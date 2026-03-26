import api from './api';
import type { AnalyticsResponse, AnalyticsTimePeriod } from '../types/analytics';

/**
 * Analytics API Service
 *
 * Admin-only API calls for platform analytics
 * All endpoints require authentication and admin role
 */

/**
 * Fetch analytics summary for specified date range
 * @param startDate - Start date for the analytics period
 * @param endDate - End date for the analytics period
 * @param environment - Filter by environment ('development', 'production', or undefined for all)
 * @returns Analytics summary data
 */
export const fetchAnalyticsSummary = async (
  startDate: Date,
  endDate: Date,
  environment?: 'development' | 'production'
): Promise<AnalyticsResponse> => {
  const params = new URLSearchParams();
  params.append('startDate', startDate.toISOString().split('T')[0]); // Format as YYYY-MM-DD
  params.append('endDate', endDate.toISOString().split('T')[0]); // Format as YYYY-MM-DD
  if (environment) {
    params.append('environment', environment);
  }
  const response = await api.get(`/analytics/summary?${params.toString()}`);
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
