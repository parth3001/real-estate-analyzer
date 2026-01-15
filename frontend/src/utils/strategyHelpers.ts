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
 *
 * @author Principal Software Architect from CLAUDE.md
 * @date January 14, 2026
 */

import React from 'react';
import HomeIcon from '@mui/icons-material/Home';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import LocationCityIcon from '@mui/icons-material/LocationCity';
import ConstructionIcon from '@mui/icons-material/Construction';
import { appleColors } from '../theme/appleDesignSystem';

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
 * Single source of truth for strategy visual identity
 */
const STRATEGY_CONFIG: Record<string, StrategyIconConfig> = {
  'buy-hold': {
    Icon: HomeIcon,
    color: '#FFFFFF',
    bgColor: appleColors.blue[600],  // #2563EB
    label: 'Buy & Hold'
  },
  'brrrr': {
    Icon: AutorenewIcon,
    color: '#FFFFFF',
    bgColor: '#7b1fa2',  // Purple (matches existing BRRRR tabs)
    label: 'BRRRR'
  },
  'house-hack': {
    Icon: LocationCityIcon,
    color: '#FFFFFF',
    bgColor: appleColors.green[600],  // #059669
    label: 'House Hacking'
  },
  'fix-and-flip': {
    Icon: ConstructionIcon,
    color: '#FFFFFF',
    bgColor: appleColors.orange[600],  // #EA580C
    label: 'Fix & Flip'
  }
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
 * @param strategy - Investment strategy (optional, may be undefined for legacy data)
 * @returns Icon configuration with Icon component, colors, and label
 *
 * @example
 * ```typescript
 * const iconConfig = getStrategyIconConfig('SFR', 'buy-hold');
 * const Icon = iconConfig.Icon;
 * // Renders: <HomeIcon /> with blue background (#2563EB)
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

  // Case 2: SFR with valid strategy → Return strategy-specific config
  if (strategy && STRATEGY_CONFIG[strategy]) {
    return STRATEGY_CONFIG[strategy];
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
export const getAllStrategies = (): Array<{ key: string; config: StrategyIconConfig }> => {
  return Object.entries(STRATEGY_CONFIG).map(([key, config]) => ({
    key,
    config
  }));
};
