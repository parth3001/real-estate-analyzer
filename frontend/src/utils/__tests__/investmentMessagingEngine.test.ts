/**
 * Tests for Investment Messaging Engine - Safety-First Architecture
 */

import InvestmentMessagingEngine, { type InvestmentMetrics, type GoalContext, SafetyValidator } from '../investmentMessagingEngine';

describe('InvestmentMessagingEngine', () => {
  describe('Critical Bug Prevention', () => {
    test('should never show positive cash flow messages for negative cash flow properties', () => {
      const negativeFlowMetrics: InvestmentMetrics = {
        monthlyFlow: -1501,
        annualFlow: -18012,
        capRate: 4.2,
        cashOnCashReturn: -8.5,
        totalInvestment: 100000,
        purchasePrice: 450000
      };

      const cashflowGoal: GoalContext = {
        portfolioStrategy: 'cashflow',
        exitStrategy: 'flexible'
      };

      const result = InvestmentMessagingEngine.generateMessage('PASS', cashflowGoal, negativeFlowMetrics);

      // Should NOT contain positive messages like "Excellent for Your Cash Flow Portfolio"
      expect(result.header).not.toContain('Excellent');
      expect(result.header).not.toContain('Strong');
      expect(result.header).not.toContain('Great');
      expect(result.primaryReason).toContain('negative');
      expect(result.sentiment).toBe('negative');
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    test('should show warning for cash flow strategy with negative flow', () => {
      const metrics: InvestmentMetrics = {
        monthlyFlow: -500,
        annualFlow: -6000,
        capRate: 5.2,
        cashOnCashReturn: -4.0,
        totalInvestment: 80000,
        purchasePrice: 300000
      };

      const goal: GoalContext = {
        portfolioStrategy: 'cashflow'
      };

      const violations = SafetyValidator.validate('BUY', goal, metrics);
      
      expect(violations.some(v => v.code === 'CASHFLOW_STRATEGY_VIOLATION')).toBe(true);
      expect(violations.some(v => v.severity === 'CRITICAL')).toBe(true);
    });

    test('should allow positive messaging only when metrics truly support it', () => {
      const positiveMetrics: InvestmentMetrics = {
        monthlyFlow: 800,
        annualFlow: 9600,
        capRate: 8.1,
        cashOnCashReturn: 12.0,
        totalInvestment: 80000,
        purchasePrice: 300000
      };

      const cashflowGoal: GoalContext = {
        portfolioStrategy: 'cashflow'
      };

      const result = InvestmentMessagingEngine.generateMessage('BUY', cashflowGoal, positiveMetrics);

      expect(result.header).toContain('Income');
      expect(result.primaryReason).toContain('$800/month');
      expect(result.sentiment).toBe('positive');
      expect(result.warnings.length).toBe(0);
    });
  });

  describe('Estate Strategy Safety', () => {
    test('should prevent positive estate messages for wealth-destroying properties', () => {
      const negativeWealthMetrics: InvestmentMetrics = {
        monthlyFlow: -300,
        annualFlow: -3600,
        capRate: 2.1,
        cashOnCashReturn: -6.0,
        totalInvestment: 100000,
        purchasePrice: 500000,
        totalWealth: -50000 // Destroys wealth
      };

      const estateGoal: GoalContext = {
        exitStrategy: 'estate',
        portfolioStrategy: 'appreciation'
      };

      const result = InvestmentMessagingEngine.generateMessage('PASS', estateGoal, negativeWealthMetrics);

      expect(result.header).not.toContain('Perfect');
      expect(result.header).not.toContain('Generational');
      expect(result.primaryReason).toContain('unsustainable');
      expect(result.sentiment).toBe('negative');
    });
  });

  describe('First Investor Protections', () => {
    test('should protect novice investors from risky properties', () => {
      const riskyMetrics: InvestmentMetrics = {
        monthlyFlow: -200,
        annualFlow: -2400,
        capRate: 3.5,
        cashOnCashReturn: -3.0,
        totalInvestment: 80000,
        purchasePrice: 400000
      };

      const firstGoal: GoalContext = {
        portfolioStrategy: 'first',
        experienceLevel: 'novice'
      };

      const violations = SafetyValidator.validate('BUY', firstGoal, riskyMetrics);
      
      expect(violations.some(v => v.code === 'NOVICE_RISK_PROTECTION')).toBe(true);
      expect(violations.some(v => v.severity === 'CRITICAL')).toBe(true);
    });
  });
});