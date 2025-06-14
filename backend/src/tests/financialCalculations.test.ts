import { FinancialCalculations } from '../utils/financialCalculations';

describe('FinancialCalculations', () => {
  // Test existing methods
  describe('calculateMortgage', () => {
    it('should calculate monthly mortgage payment correctly', () => {
      const result = FinancialCalculations.calculateMortgage(300000, 4.5, 30);
      expect(Math.round(result)).toEqual(1520); // Round to nearest dollar for comparison
    });

    it('should handle zero interest rate', () => {
      const result = FinancialCalculations.calculateMortgage(300000, 0, 30);
      expect(result).toEqual(300000 / (30 * 12));
    });
  });

  describe('calculateCapRate', () => {
    it('should calculate cap rate correctly', () => {
      const result = FinancialCalculations.calculateCapRate(15000, 300000);
      expect(result).toEqual(5);
    });

    it('should return 0 when purchase price is 0', () => {
      const result = FinancialCalculations.calculateCapRate(15000, 0);
      expect(result).toEqual(0);
    });
  });

  // Test new methods
  describe('calculateBreakEvenOccupancy', () => {
    it('should calculate break-even occupancy correctly', () => {
      const result = FinancialCalculations.calculateBreakEvenOccupancy(10000, 15000, 30000);
      expect(result).toEqual(((10000 + 15000) / 30000) * 100);
      expect(result).toEqual(83.33333333333334);
    });

    it('should return 0 when gross potential rent is 0', () => {
      const result = FinancialCalculations.calculateBreakEvenOccupancy(10000, 15000, 0);
      expect(result).toEqual(0);
    });
  });

  describe('calculateEquityMultiple', () => {
    it('should calculate equity multiple correctly', () => {
      const result = FinancialCalculations.calculateEquityMultiple(150000, 50000);
      expect(result).toEqual(3);
    });

    it('should return 0 when total investment is 0', () => {
      const result = FinancialCalculations.calculateEquityMultiple(150000, 0);
      expect(result).toEqual(0);
    });
  });

  describe('calculateOnePercentRuleValue', () => {
    it('should calculate one percent rule value correctly', () => {
      const result = FinancialCalculations.calculateOnePercentRuleValue(2000, 200000);
      expect(result).toEqual(1);
    });

    it('should return 0 when purchase price is 0', () => {
      const result = FinancialCalculations.calculateOnePercentRuleValue(2000, 0);
      expect(result).toEqual(0);
    });
  });

  describe('checkFiftyPercentRule', () => {
    it('should return true when operating expenses are <= 50% of gross rent', () => {
      const result = FinancialCalculations.checkFiftyPercentRule(12000, 24000);
      expect(result).toEqual(true);
    });

    it('should return false when operating expenses are > 50% of gross rent', () => {
      const result = FinancialCalculations.checkFiftyPercentRule(13000, 24000);
      expect(result).toEqual(false);
    });

    it('should return false when gross rent is 0', () => {
      const result = FinancialCalculations.checkFiftyPercentRule(13000, 0);
      expect(result).toEqual(false);
    });
  });

  describe('calculateRentToPriceRatio', () => {
    it('should calculate rent-to-price ratio correctly', () => {
      const result = FinancialCalculations.calculateRentToPriceRatio(2000, 200000);
      expect(result).toEqual(1);
    });

    it('should return 0 when purchase price is 0', () => {
      const result = FinancialCalculations.calculateRentToPriceRatio(2000, 0);
      expect(result).toEqual(0);
    });
  });

  describe('calculatePricePerBedroom', () => {
    it('should calculate price per bedroom correctly', () => {
      const result = FinancialCalculations.calculatePricePerBedroom(300000, 3);
      expect(result).toEqual(100000);
    });

    it('should return 0 when bedrooms is 0', () => {
      const result = FinancialCalculations.calculatePricePerBedroom(300000, 0);
      expect(result).toEqual(0);
    });
  });

  describe('calculateDebtToIncomeRatio', () => {
    it('should calculate debt-to-income ratio correctly', () => {
      const result = FinancialCalculations.calculateDebtToIncomeRatio(15000, 30000);
      expect(result).toEqual(50);
    });

    it('should return 0 when income is 0', () => {
      const result = FinancialCalculations.calculateDebtToIncomeRatio(15000, 0);
      expect(result).toEqual(0);
    });
  });

  describe('calculatePrincipalPayment', () => {
    it('should calculate principal payment correctly', () => {
      // For a $300,000 loan at 4.5% for 30 years
      // First set up the test with correct values
      const loanAmount = 300000;
      const annualRate = 4.5;
      const term = 30;
      const period = 1;
      
      // Calculate the monthly payment first
      const payment = FinancialCalculations.calculateMortgage(loanAmount, annualRate, term);
      
      // Now calculate the principal portion of the first payment
      const result = FinancialCalculations.calculatePrincipalPayment(payment, annualRate, term, period);
      
      // The first payment's principal portion should be around $375
      expect(Math.round(result)).toBeGreaterThan(350);
      expect(Math.round(result)).toBeLessThan(400);
    });

    it('should handle zero interest rate', () => {
      const payment = 1000;
      const rate = 0;
      const term = 30;
      const period = 1;
      
      const result = FinancialCalculations.calculatePrincipalPayment(payment, rate, term, period);
      expect(result).toEqual(payment);
    });
  });

  describe('calculateRemainingBalance', () => {
    it('should calculate remaining balance correctly', () => {
      // For a $300,000 loan at 0.375% monthly rate with $1,520 payment
      // After 1 payment, the balance should be about $299,625
      const principal = 300000;
      const payment = 1520;
      const rate = 0.375 / 100; // Monthly rate
      const period = 1;
      
      const result = FinancialCalculations.calculateRemainingBalance(principal, payment, rate, period);
      expect(Math.round(result)).toBeGreaterThan(299600);
      expect(Math.round(result)).toBeLessThan(299650);
    });

    it('should handle zero interest rate', () => {
      const principal = 300000;
      const payment = 1000;
      const rate = 0;
      const period = 3;
      
      const result = FinancialCalculations.calculateRemainingBalance(principal, payment, rate, period);
      expect(result).toEqual(principal - (payment * period));
    });
  });
}); 