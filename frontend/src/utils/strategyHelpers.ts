/**
 * Strategy Helpers Utility
 *
 * Shared utility functions for displaying investment strategy indicators
 * across different UI contexts (analysis results, saved properties list, dashboards).
 *
 * Provides:
 * - Icon configuration for each strategy type
 * - Color consistency with Apple Design System
 * - Graceful degradation for legacy data and MF properties
 *
 * Issue #75: Strategy indicators for Saved Properties list
 * Issue #243 (2026-07-12): rekeyed to CanonicalStrategy per P10. Callers
 * that pass kebab / SCREAMING / spaced values are normalized on entry
 * via `normalizeStrategy`. The dead `'fix-and-flip'` entry (wizard
 * legacy) is removed — it was never part of the canonical enum.
 *
 * @author Principal Software Architect from CLAUDE.md
 * @date January 14, 2026
 */

import React from 'react';
import HomeIcon from '@mui/icons-material/Home';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import LocationCityIcon from '@mui/icons-material/LocationCity';
import { appleColors } from '../theme/appleDesignSystem';
import {
  normalizeStrategy,
  type CanonicalStrategy,
} from '../domain/strategy';

/**
 * Strategy Icon Configuration Interface
 */
export interface StrategyIconConfig {
  Icon: React.ElementType;
  color: string;
  bgColor: string;
  label: string;
}

/**
 * Strategy Configuration Object
 * Single source of truth for strategy visual identity.
 *
 * Keyed by CanonicalStrategy (snake_case) per P10. TypeScript's
 * `Record<CanonicalStrategy, StrategyIconConfig>` catches a missing
 * entry at compile time if the canonical enum grows.
 */
const STRATEGY_CONFIG: Record<CanonicalStrategy, StrategyIconConfig> = {
  buy_hold: {
    Icon: HomeIcon,
    color: '#FFFFFF',
    bgColor: appleColors.blue[600], // #2563EB
    label: 'Buy & Hold',
  },
  brrrr: {
    Icon: AutorenewIcon,
    color: '#FFFFFF',
    bgColor: '#7b1fa2', // Purple (matches existing BRRRR tabs)
    label: 'BRRRR',
  },
  house_hack: {
    Icon: LocationCityIcon,
    color: '#FFFFFF',
    bgColor: appleColors.green[600], // #059669
    label: 'House Hacking',
  },
};

/**
 * Default icon configuration for properties without strategy data
 * Used for: Legacy SFR properties, unknown strategies
 */
const DEFAULT_SFR_ICON: StrategyIconConfig = {
  Icon: HomeIcon,
  color: '#8E8E93',        // Apple gray
  bgColor: '#F2F2F7',      // Light gray background
  label: 'Single-Family'
};

/**
 * Multi-family icon configuration
 * MF properties don't have strategy field in current schema
 */
const MULTI_FAMILY_ICON: StrategyIconConfig = {
  Icon: LocationCityIcon,
  color: '#8E8E93',        // Apple gray
  bgColor: '#F2F2F7',      // Light gray background
  label: 'Multi-Family'
};

/**
 * Get strategy icon configuration for a property
 *
 * Handles three cases:
 * 1. Multi-family properties → Neutral building icon
 * 2. SFR with strategy → Strategy-specific colored icon
 * 3. SFR without strategy → Default gray home icon (legacy data)
 *
 * @param propertyType - Property type ('SFR' or 'MF')
 * @param strategy - Investment strategy (any alias — normalized on entry)
 * @returns Icon configuration with Icon component, colors, and label
 *
 * @example
 * ```typescript
 * // kebab (legacy Deal wire shape) accepted:
 * const iconConfig = getStrategyIconConfig('SFR', 'buy-hold');
 * // canonical (post-refactor):
 * const iconConfig = getStrategyIconConfig('SFR', 'buy_hold');
 * ```
 */
export const getStrategyIconConfig = (
  propertyType: 'SFR' | 'MF',
  strategy?: string
): StrategyIconConfig => {
  // Case 1: Multi-Family properties always show neutral building icon
  if (propertyType === 'MF') {
    return MULTI_FAMILY_ICON;
  }

  // Case 2: SFR with valid strategy → Return strategy-specific config.
  // Normalize on entry so kebab / SCREAMING / spaced input all lands on
  // the canonical config key.
  const canonical = normalizeStrategy(strategy);
  if (canonical && canonical in STRATEGY_CONFIG) {
    return STRATEGY_CONFIG[canonical];
  }

  // Case 3: SFR without strategy (legacy data) or unknown strategy → Default gray icon
  return DEFAULT_SFR_ICON;
};

/**
 * Get strategy label text for display
 * Convenience function for showing strategy name
 *
 * @param propertyType - Property type ('SFR' or 'MF')
 * @param strategy - Investment strategy (optional)
 * @returns Human-readable strategy label
 */
export const getStrategyLabel = (
  propertyType: 'SFR' | 'MF',
  strategy?: string
): string => {
  return getStrategyIconConfig(propertyType, strategy).label;
};

/**
 * Get all available strategy configurations
 * Useful for generating strategy filters, legends, etc.
 *
 * @returns Array of all strategy configurations
 */
export const getAllStrategies = (): Array<{ key: CanonicalStrategy; config: StrategyIconConfig }> => {
  return (Object.entries(STRATEGY_CONFIG) as Array<[CanonicalStrategy, StrategyIconConfig]>).map(
    ([key, config]) => ({ key, config })
  );
};
