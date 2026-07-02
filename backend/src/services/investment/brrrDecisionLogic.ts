/**
 * BRRRR Decision Logic - Helper functions for BRRRR strategy assessment
 *
 * This file contains BRRRR-specific logic that's used by InvestmentDecisionEngine
 * Keeps the main file cleaner and maintains separation of concerns
 *
 * @author FSE from CLAUDE.md
 * @version 1.0.0
 * @date December 17, 2025
 */

import { BRRRRAnalysis } from './brrrAnalyzer';

/**
 * Calculate post-refinance cash flow score (0-100)
 * Weight: 10% in BRRRR assessment
 */
export function calculatePostRefiCashFlowScore(brrrAnalysis: BRRRRAnalysis): number {
  const monthlyCashFlow = brrrAnalysis.postRefinanceMetrics.monthlyCashFlow;

  // Positive cash flow is critical for sustainability
  if (monthlyCashFlow >= 300) return 100; // Excellent ($300+/month)
  if (monthlyCashFlow >= 200) return 90;  // Great ($200-300/month)
  if (monthlyCashFlow >= 100) return 75;  // Good ($100-200/month)
  if (monthlyCashFlow >= 50) return 60;   // Acceptable ($50-100/month)
  if (monthlyCashFlow >= 0) return 40;    // Break-even (0-50/month)

  // Issue #74 (2026-06-30) — smoother gradient below zero. Prior code
  // collapsed everything below -$100/mo to score 0, losing signal on
  // stress scenarios. A deal losing $101/mo scored the same as a deal
  // losing $10,000/mo, making it impossible to distinguish "small
  // negotiation gap" from "structurally broken." Now:
  //   -100 to 0    → 20 (small negative, likely fixable with rent bump)
  //   -300 to -100 → 15 (moderate — negotiate price or accept holding cost)
  //   -600 to -300 → 10 (large — deal has real structural friction)
  //   -1000 to -600 → 5 (severe — walk away in most markets)
  //   < -1000      → 0 (catastrophic — never build a portfolio this way)
  if (monthlyCashFlow >= -100) return 20;
  if (monthlyCashFlow >= -300) return 15;
  if (monthlyCashFlow >= -600) return 10;
  if (monthlyCashFlow >= -1000) return 5;
  return 0;
}

/**
 * Calculate refinance viability score (0-100)
 * Weight: 5% in BRRRR assessment
 *
 * Checks if lender will approve refinance based on DSCR and seasoning
 */
export function calculateRefinanceViabilityScore(brrrAnalysis: BRRRRAnalysis): number {
  const dscr = brrrAnalysis.postRefinanceMetrics.postRefiDSCR;
  const seasoningMonths = brrrAnalysis.seasoningCosts.months;

  let score = 50; // Base score

  // DSCR check (most important for lender)
  if (dscr >= 1.35) score += 40; // Excellent DSCR
  else if (dscr >= 1.25) score += 30; // Fannie Mae minimum
  else if (dscr >= 1.15) score += 15; // Some portfolio lenders
  else score -= 30; // Likely rejection

  // Seasoning period check
  if (seasoningMonths >= 12) score += 10; // Fannie Mae standard
  else if (seasoningMonths >= 6) score += 5; // Portfolio lender minimum
  else score -= 10; // Too short

  return Math.max(0, Math.min(100, score));
}

/**
 * Calculate property risk score based on ARV assumptions (0-100)
 * Weight: 2% in BRRRR assessment
 */
export function calculatePropertyRiskScore(propertyData: any): number {
  const confidence = propertyData.brrrr?.arvAppraisalConfidence || 'moderate';

  const arvLift = ((propertyData.brrrr?.afterRepairValue - propertyData.purchasePrice) /
                   propertyData.purchasePrice) * 100;

  let baseScore = {
    'conservative': 90,
    'moderate': 70,
    'aggressive': 50
  }[confidence];

  // Additional risk for extreme ARV lift
  if (arvLift > 75) baseScore -= 30;
  else if (arvLift > 50) baseScore -= 15;

  return Math.max(0, baseScore);
}

/**
 * Generate BRRRR-specific strengths
 */
export function generateBRRRRStrengths(brrrAnalysis: BRRRRAnalysis): string[] {
  const strengths: string[] = [];

  // Infinite return
  if (brrrAnalysis.capitalRecovery.infiniteReturn) {
    strengths.push(`🎯 Infinite return: ${brrrAnalysis.capitalRecovery.capitalRecoveryRate.toFixed(0)}% capital recovered`);
  }

  // High capital recovery
  if (brrrAnalysis.capitalRecovery.capitalRecoveryRate >= 80 && !brrrAnalysis.capitalRecovery.infiniteReturn) {
    strengths.push(`💰 Strong capital recovery: ${brrrAnalysis.capitalRecovery.capitalRecoveryRate.toFixed(0)}% of investment recovered`);
  }

  // Meets 70% rule
  if (brrrAnalysis.rule70Check.meets70Rule && brrrAnalysis.rule70Check.margin > 5000) {
    strengths.push(`✅ Meets 70% Rule with $${brrrAnalysis.rule70Check.margin.toLocaleString()} margin`);
  }

  // Strong post-refi cash flow
  if (brrrAnalysis.postRefinanceMetrics.monthlyCashFlow > 200) {
    strengths.push(`📈 Strong post-refinance cash flow: $${brrrAnalysis.postRefinanceMetrics.monthlyCashFlow.toFixed(0)}/month`);
  }

  // High ARV reliability
  if (brrrAnalysis.scores.arvReliability >= 80) {
    strengths.push(`🏠 Conservative ARV assumptions increase reliability`);
  }

  return strengths;
}

/**
 * Generate BRRRR-specific concerns
 */
export function generateBRRRRConcerns(brrrAnalysis: BRRRRAnalysis): string[] {
  const concerns: string[] = [];

  // Low capital recovery
  if (brrrAnalysis.capitalRecovery.capitalRecoveryRate < 40) {
    concerns.push(`⚠️ Low capital recovery: Only ${brrrAnalysis.capitalRecovery.capitalRecoveryRate.toFixed(0)}% recovered (target 60%+)`);
  }

  // Violates 70% rule
  if (!brrrAnalysis.rule70Check.meets70Rule) {
    const overage = Math.abs(brrrAnalysis.rule70Check.margin);
    concerns.push(`🚨 Violates 70% Rule: Paying $${overage.toLocaleString()} too much`);
  }

  // Negative post-refi cash flow
  if (brrrAnalysis.postRefinanceMetrics.monthlyCashFlow < 0) {
    const loss = Math.abs(brrrAnalysis.postRefinanceMetrics.monthlyCashFlow);
    concerns.push(`📉 Negative post-refinance cash flow: -$${loss.toFixed(0)}/month`);
  }

  // Low DSCR
  if (brrrAnalysis.postRefinanceMetrics.postRefiDSCR < 1.25) {
    concerns.push(`⚠️ Low DSCR (${brrrAnalysis.postRefinanceMetrics.postRefiDSCR.toFixed(2)}): May not qualify for refinance`);
  }

  // Aggressive ARV
  if (brrrAnalysis.scores.arvReliability < 60) {
    concerns.push(`🎲 Aggressive ARV assumptions increase risk`);
  }

  // High rehab risk
  if (brrrAnalysis.scores.rehabExecution < 60) {
    const rehabPercent = (brrrAnalysis.rehabBudget / brrrAnalysis.totalInvestment) * 100;
    concerns.push(`🔨 Rehab budget is ${rehabPercent.toFixed(0)}% of purchase - verify feasibility`);
  }

  return concerns;
}

/**
 * Generate BRRRR bottom line summary
 */
export function generateBRRRRBottomLine(brrrAnalysis: BRRRRAnalysis): string {
  const recoveryRate = brrrAnalysis.capitalRecovery.capitalRecoveryRate;
  const cashFlow = brrrAnalysis.postRefinanceMetrics.monthlyCashFlow;

  if (brrrAnalysis.capitalRecovery.infiniteReturn && cashFlow > 0) {
    return `Exceptional BRRRR deal: ${recoveryRate.toFixed(0)}% capital recovered with positive cash flow. Execute immediately.`;
  }

  if (recoveryRate >= 80 && cashFlow > 100) {
    return `Strong BRRRR opportunity: High capital recovery (${recoveryRate.toFixed(0)}%) and solid post-refi cash flow ($${cashFlow.toFixed(0)}/mo).`;
  }

  if (recoveryRate >= 60 && cashFlow >= 0) {
    return `Acceptable BRRRR deal: Moderate capital recovery (${recoveryRate.toFixed(0)}%) with break-even cash flow. Negotiate improvements.`;
  }

  // Issue #207 (2026-06-30) — the previous single `||` branch attributed
  // friction to "low capital recovery" even when the trigger was actually
  // negative cash flow. Split into three explicit branches so the message
  // matches the actual driver. Capital-recovery tiers (validated at
  // brrrr-uat-validation-all-fixes.test.ts:178-183): 85-100 EXCELLENT,
  // 60-85 GOOD, 40-60 FAIR, <40 POOR.
  if (recoveryRate < 40 && cashFlow < -100) {
    return `Weak BRRRR fundamentals: Only ${recoveryRate.toFixed(0)}% capital recovery AND negative post-refi cash flow (-$${Math.abs(cashFlow).toFixed(0)}/mo). Structural pass unless purchase price drops meaningfully.`;
  }

  if (recoveryRate < 40) {
    return `Low capital recovery: Only ${recoveryRate.toFixed(0)}% recovered at refi (target 60%+). Structural weakness — pass unless purchase price drops or ARV assumption firms.`;
  }

  if (cashFlow < -100) {
    return `Negative post-refi cash flow (-$${Math.abs(cashFlow).toFixed(0)}/mo) despite ${recoveryRate.toFixed(0)}% capital recovery. The refi structure works, but ongoing rent won't cover post-refi debt service. Pass unless rent can be pushed higher or purchase price renegotiated.`;
  }

  return `Mixed BRRRR metrics: ${recoveryRate.toFixed(0)}% recovery, $${cashFlow.toFixed(0)}/mo cash flow. Requires careful evaluation.`;
}
