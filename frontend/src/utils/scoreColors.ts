import { appleColors } from '../theme/appleDesignSystem';

/**
 * Score-based color mapping for Investment Decision UI
 *
 * Color Ranges:
 * - 80-100: Green (Strong fundamentals)
 * - 60-79: Blue (Acceptable, meets standards)
 * - 40-59: Orange (Below target, needs work)
 * - 20-39: Orange-Red (Weak, significant concerns)
 * - 0-19: Red (Critical issues)
 */

export function getScoreColor(score: number): string {
  if (score >= 80) return appleColors.green[600];   // #34C759
  if (score >= 60) return appleColors.blue[600];    // #007AFF
  if (score >= 40) return appleColors.orange[600];  // #FF9500
  if (score >= 20) return '#FF6B35';                // Orange-red (custom)
  return appleColors.red[600];                       // #FF3B30
}

export function getScoreLabel(score: number): string {
  if (score >= 80) return "Strong fundamentals";
  if (score >= 60) return "Meets professional standards";
  if (score >= 40) return "Below target - optimization required";
  if (score >= 20) return "Weak fundamentals - significant concerns";
  return "Critical issues - unsuitable for most investors";
}

export function getScoreCategory(score: number): 'strong' | 'acceptable' | 'below-target' | 'weak' | 'critical' {
  if (score >= 80) return 'strong';
  if (score >= 60) return 'acceptable';
  if (score >= 40) return 'below-target';
  if (score >= 20) return 'weak';
  return 'critical';
}
