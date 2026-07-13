/**
 * Google Analytics 4 Tracking Utility
 *
 * Type-safe wrapper for GA4 event tracking
 * Safely handles cases where gtag is not loaded (dev mode, ad blockers)
 *
 * Usage:
 *   import { analytics } from '@/utils/analytics';
 *   analytics.trackPageView('landing');
 *   analytics.trackCalculatorCompleted('brrrr', 75);
 */

// TypeScript declaration for gtag
declare global {
  interface Window {
    gtag?: (
      command: 'event' | 'config' | 'js',
      eventNameOrDate: string | Date,
      params?: Record<string, any>
    ) => void;
    dataLayer?: any[];
  }
}

/**
 * Generic event tracking helper
 * Safely calls gtag only if it's loaded
 */
const trackEvent = (eventName: string, params?: Record<string, any>) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, params);

    // Log in development for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log('[Analytics]', eventName, params);
    }
  } else if (process.env.NODE_ENV === 'development') {
    console.warn('[Analytics] gtag not loaded, event not tracked:', eventName, params);
  }
};

/**
 * Track page views
 */
const trackPageView = (pageName: string) => {
  trackEvent('page_view', {
    page_title: pageName,
    page_location: window.location.href,
    page_path: window.location.pathname,
  });
};

/**
 * Calculator tracking.
 *
 * Issue #243 (2026-07-12): analytics dimensions accept EITHER a
 * CanonicalStrategy (post-refactor callers) or a LegacyDealStrategy
 * (wizard callers that still emit kebab). GA dashboards have historical
 * continuity on the kebab strings, so we project canonical → kebab at
 * the analytics hop via `toAnalyticsStrategyDimension`. All INTERNAL
 * code passes canonical; the shim converts at the last hop.
 */
import {
  toAnalyticsStrategyDimension,
  normalizeStrategy,
  type CanonicalStrategy,
  type LegacyDealStrategy,
} from '../domain/strategy';

type AnalyticsStrategyInput = CanonicalStrategy | LegacyDealStrategy | string;

function toAnalyticsDimension(strategy: AnalyticsStrategyInput): LegacyDealStrategy {
  // Issue #243 (iteration-2): normalize inbound (kebab / canonical / any
  // alias) → canonical → project to analytics kebab wire via the single
  // canonical projector. No inline kebab literals here.
  const canonical = normalizeStrategy(strategy) ?? 'buy_hold';
  return toAnalyticsStrategyDimension(canonical);
}

const trackCalculatorStarted = (strategy: AnalyticsStrategyInput) => {
  trackEvent('calculator_started', {
    strategy: toAnalyticsDimension(strategy),
    timestamp: new Date().toISOString(),
  });
};

const trackCalculatorCompleted = (
  strategy: AnalyticsStrategyInput,
  dealScore: number
) => {
  trackEvent('calculator_completed', {
    strategy: toAnalyticsDimension(strategy),
    deal_score: dealScore,
    timestamp: new Date().toISOString(),
  });
};

/**
 * CTA click tracking
 */
const trackCTAClick = (ctaType: 'beta_signup' | 'sample_analysis' | 'pricing', location: string) => {
  trackEvent('cta_click', {
    cta_type: ctaType,
    location,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Signup funnel tracking
 */
const trackSignupStarted = (source: string = 'direct') => {
  trackEvent('signup_started', {
    source,
    timestamp: new Date().toISOString(),
  });
};

const trackSignupCompleted = (source: string = 'direct') => {
  trackEvent('signup_completed', {
    source,
    timestamp: new Date().toISOString(),
  });
};

const trackSignupFailed = (errorMessage: string) => {
  trackEvent('signup_failed', {
    error_message: errorMessage,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Login tracking
 */
const trackLoginSuccess = () => {
  trackEvent('login_success', {
    timestamp: new Date().toISOString(),
  });
};

const trackLoginFailed = (errorMessage: string) => {
  trackEvent('login_failed', {
    error_message: errorMessage,
    timestamp: new Date().toISOString(),
  });
};

/**
 * PDF request tracking
 */
const trackPdfRequestInitiated = (
  strategy: AnalyticsStrategyInput,
  dealScore?: number
) => {
  trackEvent('pdf_request_initiated', {
    strategy: toAnalyticsDimension(strategy),
    deal_score: dealScore,
    timestamp: new Date().toISOString(),
  });
};

const trackPdfRequestSuccess = (
  strategy: AnalyticsStrategyInput,
  dealScore?: number
) => {
  trackEvent('pdf_request_success', {
    strategy: toAnalyticsDimension(strategy),
    deal_score: dealScore,
    timestamp: new Date().toISOString(),
  });
};

const trackPdfRequestFailed = (
  strategy: AnalyticsStrategyInput,
  errorType: string
) => {
  trackEvent('pdf_request_failed', {
    strategy: toAnalyticsDimension(strategy),
    error_type: errorType,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Exported analytics object with all tracking functions
 */
export const analytics = {
  // Page tracking
  trackPageView,

  // Calculator tracking
  trackCalculatorStarted,
  trackCalculatorCompleted,

  // CTA tracking
  trackCTAClick,

  // Signup funnel
  trackSignupStarted,
  trackSignupCompleted,
  trackSignupFailed,

  // Login tracking
  trackLoginSuccess,
  trackLoginFailed,

  // PDF tracking
  trackPdfRequestInitiated,
  trackPdfRequestSuccess,
  trackPdfRequestFailed,
};

// Default export for convenience
export default analytics;
