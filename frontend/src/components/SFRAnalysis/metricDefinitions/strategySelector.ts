/**
 * Strategy Selector - Extensible Foundation for Strategy-Aware Metrics
 *
 * This file implements the strategy selection logic that determines which metric tiers
 * to display based on property type and investment strategy.
 *
 * Architecture:
 * 1. Check property type FIRST (MF vs SFR)
 * 2. For SFR, check strategy (buy-hold, brrrr, house-hack)
 * 3. Return appropriate tier structure with fallback logic
 *
 * Fallback Pattern:
 * - Unsupported strategies show Buy & Hold metrics with console.warn()
 * - MF properties use existing implementation (no changes in this phase)
 *
 * Phase 1 Status: Buy & Hold implemented, BRRRR/House Hack show fallback
 * Phase 2-4 Integration: When BRRRR_TIERS file is created, update case 'brrrr'
 *
 * NO REFACTORING REQUIRED in Phase 2-4:
 * - Architecture designed for drop-in strategy additions
 * - To add BRRRR: Create brrrrTiers.ts, import, change ONE line (line 81)
 * - To add House Hack: Create houseHackTiers.ts, import, change ONE line (line 94)
 * - Same pattern works for MF strategy variants (core, value-add, opportunistic)
 *
 * Future-Proof Design Principles:
 * 1. Property type checked before strategy (prevents SFR/MF confusion)
 * 2. MetricDefinition interface supports all strategies (getValue signature unchanged)
 * 3. MetricTier structure identical across strategies (composition not inheritance)
 * 4. Fallback logic ensures zero breaking changes
 * 5. Type system ready for backend strategy fields (see types/analysis.ts)
 *
 * Source: User requirement and multi-expert validation (Business, Architect, UX Designer)
 */

import type { Analysis } from '../../../types/analysis';
import type { SFRPropertyData } from '../../../types/property';
import type { MetricTier } from './strategies/sfr/buyHoldTiers';
import type { MFMetricTier } from './strategies/mf/coreMFTiers';

// SFR Strategy imports
import {
  BUY_HOLD_TIERS,
  BUY_HOLD_STRATEGY_INFO
} from './strategies/sfr/buyHoldTiers';

// MF Strategy imports
import {
  MF_CORE_TIERS,
  MF_CORE_STRATEGY_INFO
} from './strategies/mf/coreMFTiers';

/**
 * Investment strategy types (from StrategyCard.tsx line 39)
 */
export type InvestmentStrategy = 'buy-hold' | 'house-hack' | 'brrrr';

/**
 * Property types
 */
export type PropertyType = 'SFR' | 'MF';

/**
 * Strategy selector options
 */
export interface StrategyOptions {
  propertyType?: PropertyType;
  strategy?: InvestmentStrategy;
  analysis: Analysis;
  propertyData?: SFRPropertyData;
}

/**
 * Strategy selector result (union type for SFR or MF)
 */
export type StrategyResult = {
  type: 'SFR';
  strategy: InvestmentStrategy;
  tiers: MetricTier[];
  info: typeof BUY_HOLD_STRATEGY_INFO;
  isFallback: boolean;
} | {
  type: 'MF';
  tiers: MFMetricTier[];
  info: typeof MF_CORE_STRATEGY_INFO;
  renderExisting: true;
};

/**
 * Main strategy selector function
 *
 * Decision tree:
 * 1. If propertyType === 'MF' → Return MF tiers (existing implementation)
 * 2. If propertyType === 'SFR':
 *    a. If strategy === 'buy-hold' → Return Buy & Hold tiers
 *    b. If strategy === 'brrrr' → Log warning, fallback to Buy & Hold
 *    c. If strategy === 'house-hack' → Log warning, fallback to Buy & Hold
 *    d. If strategy undefined → Default to Buy & Hold
 *
 * @param options - Property type, strategy, and data
 * @returns Strategy-specific tier structure
 */
export function getMetricTiers(options: StrategyOptions): StrategyResult {
  const { propertyType, strategy } = options;
  // analysis and propertyData will be used in Phase 3 UI implementation

  // Step 1: Check property type FIRST
  if (propertyType === 'MF') {
    return {
      type: 'MF',
      tiers: MF_CORE_TIERS,
      info: MF_CORE_STRATEGY_INFO,
      renderExisting: true
    };
  }

  // Step 2: We're dealing with SFR, now check strategy
  const sfrStrategy = strategy || 'buy-hold'; // Default to buy-hold if undefined

  switch (sfrStrategy) {
    case 'buy-hold':
      return {
        type: 'SFR',
        strategy: 'buy-hold',
        tiers: BUY_HOLD_TIERS,
        info: BUY_HOLD_STRATEGY_INFO,
        isFallback: false
      };

    case 'brrrr':
      console.warn(
        '⚠️ BRRRR strategy metrics not yet implemented. ' +
        'Showing Buy & Hold metrics as fallback. ' +
        'BRRRR implementation planned for Phase 2.'
      );
      return {
        type: 'SFR',
        strategy: 'brrrr',
        tiers: BUY_HOLD_TIERS, // Fallback to buy-hold
        info: {
          ...BUY_HOLD_STRATEGY_INFO,
          strategyName: 'BRRRR (Coming Soon)',
          strategyId: 'brrrr' as const,
          description: 'Buy, Rehab, Rent, Refinance, Repeat - Implementation coming soon'
        },
        isFallback: true
      };

    case 'house-hack':
      console.warn(
        '⚠️ House Hacking strategy metrics not yet implemented. ' +
        'Showing Buy & Hold metrics as fallback. ' +
        'House Hacking implementation planned for Phase 2.'
      );
      return {
        type: 'SFR',
        strategy: 'house-hack',
        tiers: BUY_HOLD_TIERS, // Fallback to buy-hold
        info: {
          ...BUY_HOLD_STRATEGY_INFO,
          strategyName: 'House Hack (Coming Soon)',
          strategyId: 'house-hack' as const,
          description: 'Live in one unit, rent others - Implementation coming soon'
        },
        isFallback: true
      };

    default:
      // Unknown strategy - fallback to buy-hold
      console.warn(
        `⚠️ Unknown strategy "${sfrStrategy}". Falling back to Buy & Hold metrics.`
      );
      return {
        type: 'SFR',
        strategy: 'buy-hold',
        tiers: BUY_HOLD_TIERS,
        info: BUY_HOLD_STRATEGY_INFO,
        isFallback: true
      };
  }
}

/**
 * Helper function to check if strategy is fully implemented
 */
export function isStrategyImplemented(strategy: InvestmentStrategy): boolean {
  return strategy === 'buy-hold';
}

/**
 * Helper function to get available strategies
 */
export function getAvailableStrategies(): Array<{
  id: InvestmentStrategy;
  name: string;
  implemented: boolean;
  comingSoon: boolean;
}> {
  return [
    {
      id: 'buy-hold',
      name: 'Buy & Hold',
      implemented: true,
      comingSoon: false
    },
    {
      id: 'brrrr',
      name: 'BRRRR',
      implemented: false,
      comingSoon: true
    },
    {
      id: 'house-hack',
      name: 'House Hacking',
      implemented: false,
      comingSoon: true
    }
  ];
}

/**
 * Future: MF strategy selector
 * This will be expanded when MF strategy variants are implemented
 */
export type MFStrategy = 'core' | 'value-add' | 'opportunistic';

export function getMFStrategyTiers(mfStrategy?: MFStrategy): MFMetricTier[] {
  // Currently all MF strategies use same implementation
  // Future: Return different tier structures based on mfStrategy
  if (mfStrategy && mfStrategy !== 'core') {
    console.warn(
      `⚠️ MF strategy "${mfStrategy}" not yet implemented. ` +
      'Using core MF metrics.'
    );
  }
  return MF_CORE_TIERS;
}
