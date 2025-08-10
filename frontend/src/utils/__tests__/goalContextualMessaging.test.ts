/**
 * Tests for Goal-Contextual Messaging
 */

import { GoalContextualMessaging, type GoalContext, type AnalysisData } from '../goalContextualMessaging';

describe('GoalContextualMessaging', () => {
  const mockAnalysis: AnalysisData = {
    monthlyAnalysis: { cashFlow: 400 },
    keyMetrics: { capRate: 8.1, cashOnCashReturn: 12.5 },
    financing: { loanToValue: 75 },
    longTermAnalysis: { 
      totalAppreciation: 150000, 
      totalCashFlow: 120000,
      totalReturn: 270000 
    }
  };

  describe('getGoalContextualHeader', () => {
    test('should return estate-focused header for generational wealth', () => {
      const goalContext: GoalContext = {
        exitStrategy: 'estate',
        portfolioStrategy: 'appreciation',
        projectionYears: 30
      };

      const header = GoalContextualMessaging.getGoalContextualHeader(goalContext);
      expect(header).toBe("Perfect for Your Generational Wealth Strategy");
    });

    test('should return cash flow header for income-focused strategy', () => {
      const goalContext: GoalContext = {
        exitStrategy: 'flexible',
        portfolioStrategy: 'cashflow',
        projectionYears: 10
      };

      const header = GoalContextualMessaging.getGoalContextualHeader(goalContext);
      expect(header).toBe("Excellent for Your Cash Flow Portfolio");
    });

    test('should return first property header for new investors', () => {
      const goalContext: GoalContext = {
        exitStrategy: 'sale',
        portfolioStrategy: 'first',
        projectionYears: 5
      };

      const header = GoalContextualMessaging.getGoalContextualHeader(goalContext);
      expect(header).toBe("Great First Investment Property");
    });

    test('should return 1031 exchange header', () => {
      const goalContext: GoalContext = {
        exitStrategy: '1031exchange',
        portfolioStrategy: 'appreciation',
        projectionYears: 7
      };

      const header = GoalContextualMessaging.getGoalContextualHeader(goalContext);
      expect(header).toBe("Strong 1031 Exchange Candidate");
    });
  });

  describe('getGoalContextualReason', () => {
    test('should generate estate-focused reason with wealth calculation', () => {
      const goalContext: GoalContext = {
        exitStrategy: 'estate',
        portfolioStrategy: 'appreciation',
        projectionYears: 30
      };

      const reason = GoalContextualMessaging.getGoalContextualReason(goalContext, mockAnalysis);
      expect(reason).toContain('total wealth');
      expect(reason).toContain('30 years');
      expect(reason).toContain('heirs');
      expect(reason).toContain('stepped-up basis');
    });

    test('should generate cash flow focused reason', () => {
      const goalContext: GoalContext = {
        exitStrategy: 'flexible',
        portfolioStrategy: 'cashflow',
        projectionYears: 10
      };

      const reason = GoalContextualMessaging.getGoalContextualReason(goalContext, mockAnalysis);
      expect(reason).toContain('$400/month');
      expect(reason).toContain('income-focused');
      expect(reason).toContain('8.1%');
    });

    test('should generate first property reason with conservative focus', () => {
      const goalContext: GoalContext = {
        exitStrategy: 'sale',
        portfolioStrategy: 'first',
        projectionYears: 5
      };

      const reason = GoalContextualMessaging.getGoalContextualReason(goalContext, mockAnalysis);
      expect(reason).toContain('75%');
      expect(reason).toContain('learning');
      expect(reason).toContain('new investors');
    });
  });

  describe('getGoalContextualVerdictLabel', () => {
    test('should return goal-specific verdict labels', () => {
      const testCases = [
        { 
          goalContext: { exitStrategy: 'estate' as const }, 
          verdict: 'BUY' as const, 
          expected: 'Recommended for Generational Hold' 
        },
        { 
          goalContext: { portfolioStrategy: 'cashflow' as const }, 
          verdict: 'NEGOTIATE' as const, 
          expected: 'Negotiate for Income Portfolio' 
        },
        { 
          goalContext: { portfolioStrategy: 'first' as const }, 
          verdict: 'BUY' as const, 
          expected: 'Recommended Starter Property' 
        },
        { 
          goalContext: { exitStrategy: '1031exchange' as const }, 
          verdict: 'PASS' as const, 
          expected: 'Pass Exchange Property' 
        }
      ];

      testCases.forEach(({ goalContext, verdict, expected }) => {
        const label = GoalContextualMessaging.getGoalContextualVerdictLabel(goalContext, verdict);
        expect(label).toBe(expected);
      });
    });
  });

  describe('getGoalSpecificInsights', () => {
    test('should return estate planning insights for generational wealth', () => {
      const goalContext: GoalContext = {
        exitStrategy: 'estate',
        riskApproach: 'conservative'
      };

      const insights = GoalContextualMessaging.getGoalSpecificInsights(goalContext, mockAnalysis);
      expect(insights.length).toBeGreaterThan(0);
      expect(insights.some(insight => insight.includes('Estate Planning'))).toBe(true);
      expect(insights.some(insight => insight.includes('Stepped-up basis'))).toBe(true);
    });

    test('should return learning insights for first property', () => {
      const goalContext: GoalContext = {
        portfolioStrategy: 'first',
        riskApproach: 'conservative'
      };

      const insights = GoalContextualMessaging.getGoalSpecificInsights(goalContext, mockAnalysis);
      expect(insights.some(insight => insight.includes('Learning Opportunity'))).toBe(true);
    });

    test('should return 1031 exchange insights', () => {
      const goalContext: GoalContext = {
        exitStrategy: '1031exchange'
      };

      const insights = GoalContextualMessaging.getGoalSpecificInsights(goalContext, mockAnalysis);
      expect(insights.some(insight => insight.includes('Exchange Timeline'))).toBe(true);
    });
  });
});