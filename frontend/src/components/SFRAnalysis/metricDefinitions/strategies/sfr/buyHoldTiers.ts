/**
 * Buy & Hold Strategy - Metric Tier Composition
 *
 * This file defines the 3-tier progressive disclosure pattern for SFR Buy & Hold investments.
 * Pattern: 3-7-8 (3 critical, 7 professional, 8 advanced)
 *
 * Strategy Focus: Long-term wealth building through rental income and appreciation
 * Investor Profile: Individual investors seeking passive income and equity build
 *
 * Source: /docs/METRICS_REORGANIZATION_PLAN.md
 */

import {
  TIER_1_METRICS,
  TIER_2_METRICS,
  TIER_3_METRICS,
  type MetricDefinition
} from '../../metrics/buyHoldMetrics';

export interface MetricTier {
  tierNumber: 1 | 2 | 3;
  title: string;
  description: string;
  metrics: MetricDefinition[];
  defaultExpanded: boolean;
}

/**
 * Tier 1: Critical Decision Metrics
 * Always visible - These answer: "Should I pursue this deal?"
 */
export const BUY_HOLD_TIER_1: MetricTier = {
  tierNumber: 1,
  title: 'Deal Decision Metrics',
  description: 'Critical metrics for initial investment decision',
  metrics: TIER_1_METRICS, // 3 metrics
  defaultExpanded: true
};

/**
 * Tier 2: Professional Financial Metrics
 * Collapsible - These answer: "How strong is this investment financially?"
 */
export const BUY_HOLD_TIER_2: MetricTier = {
  tierNumber: 2,
  title: 'Financial Performance',
  description: 'Professional-grade financial analysis (7 metrics)',
  metrics: TIER_2_METRICS, // 7 metrics
  defaultExpanded: false
};

/**
 * Tier 3: Advanced Risk & Operational Analytics
 * Collapsible - These answer: "What are the risks and operational considerations?"
 */
export const BUY_HOLD_TIER_3: MetricTier = {
  tierNumber: 3,
  title: 'Risk & Operational Analysis',
  description: 'Advanced analytics for experienced investors (8 metrics)',
  metrics: TIER_3_METRICS, // 8 metrics
  defaultExpanded: false
};

/**
 * Complete tier structure for Buy & Hold strategy
 * Total: 18 metrics across 3 tiers (3-7-8 pattern)
 */
export const BUY_HOLD_TIERS: MetricTier[] = [
  BUY_HOLD_TIER_1,
  BUY_HOLD_TIER_2,
  BUY_HOLD_TIER_3
];

/**
 * Strategy metadata
 */
export const BUY_HOLD_STRATEGY_INFO = {
  strategyName: 'Buy & Hold',
  strategyId: 'buy-hold' as const,
  propertyType: 'SFR' as const,
  description: 'Long-term rental investment focused on cash flow and appreciation',
  targetInvestorProfile: 'Individual investors seeking passive income',
  keyFocusAreas: [
    'Monthly cash flow sustainability',
    'Long-term appreciation potential',
    'Debt service coverage',
    'Risk mitigation through reserves'
  ],
  totalMetrics: 18,
  tierPattern: '3-7-8'
};
