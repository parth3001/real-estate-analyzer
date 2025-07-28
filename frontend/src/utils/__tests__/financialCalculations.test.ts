import { describe, it, expect } from 'vitest'
import { 
  calculateMonthlyMortgagePayment,
  calculateCapRate,
  calculateCashOnCashReturn,
  calculateDSCR,
  calculateOperatingExpenseRatio,
  calculateGrossRentMultiplier,
  calculateOnePercentRule,
  calculateBreakEvenOccupancy
} from '../financialCalculations'

describe('Financial Calculations', () => {
  describe('Epic 2: Property Analysis Accuracy - Story 2.1: Financial Calculations', () => {
    
    describe('Monthly Mortgage Payment Calculation', () => {
      it('should calculate correct monthly payment for standard mortgage', () => {
        const principal = 360000 // $450k - $90k down
        const annualRate = 6.75
        const years = 30
        
        const payment = calculateMonthlyMortgagePayment(principal, annualRate, years)
        
        // Expected payment should be approximately $2334.95
        expect(payment).toBeCloseTo(2334.95, 2)
      })

      it('should handle zero interest rate', () => {
        const principal = 300000
        const annualRate = 0
        const years = 30
        
        const payment = calculateMonthlyMortgagePayment(principal, annualRate, years)
        
        // With 0% interest, payment = principal / (years * 12)
        expect(payment).toBeCloseTo(300000 / (30 * 12), 2)
      })

      it('should handle different loan terms', () => {
        const principal = 300000
        const annualRate = 5.0
        
        const payment15Year = calculateMonthlyMortgagePayment(principal, annualRate, 15)
        const payment30Year = calculateMonthlyMortgagePayment(principal, annualRate, 30)
        
        // 15-year should have higher monthly payment
        expect(payment15Year).toBeGreaterThan(payment30Year)
      })

      it('should handle edge case of very high interest rate', () => {
        const principal = 100000
        const annualRate = 50 // 50% - extreme case
        const years = 30
        
        const payment = calculateMonthlyMortgagePayment(principal, annualRate, years)
        
        // Should not throw error and should be a reasonable number
        expect(payment).toBeGreaterThan(0)
        expect(payment).toBeLessThan(principal) // Shouldn't exceed principal
      })
    })

    describe('Cap Rate Calculation', () => {
      it('should calculate correct cap rate', () => {
        const noi = 12960 // Annual NOI
        const propertyValue = 450000
        
        const capRate = calculateCapRate(noi, propertyValue)
        
        expect(capRate).toBeCloseTo(2.88, 2)
      })

      it('should handle zero property value', () => {
        const noi = 10000
        const propertyValue = 0
        
        const capRate = calculateCapRate(noi, propertyValue)
        
        expect(capRate).toBe(0)
      })

      it('should handle negative NOI', () => {
        const noi = -5000
        const propertyValue = 300000
        
        const capRate = calculateCapRate(noi, propertyValue)
        
        expect(capRate).toBeLessThan(0)
      })
    })

    describe('Cash-on-Cash Return Calculation', () => {
      it('should calculate correct cash-on-cash return', () => {
        const annualCashFlow = -4732.80
        const totalInvestment = 101250
        
        const cocReturn = calculateCashOnCashReturn(annualCashFlow, totalInvestment)
        
        expect(cocReturn).toBeCloseTo(-4.67, 2)
      })

      it('should handle positive cash flow', () => {
        const annualCashFlow = 5000
        const totalInvestment = 50000
        
        const cocReturn = calculateCashOnCashReturn(annualCashFlow, totalInvestment)
        
        expect(cocReturn).toBeCloseTo(10, 2)
      })

      it('should handle zero investment', () => {
        const annualCashFlow = 1000
        const totalInvestment = 0
        
        const cocReturn = calculateCashOnCashReturn(annualCashFlow, totalInvestment)
        
        expect(cocReturn).toBe(0)
      })
    })

    describe('Debt Service Coverage Ratio (DSCR)', () => {
      it('should calculate correct DSCR', () => {
        const noi = 12960
        const debtService = 16396.80
        
        const dscr = calculateDSCR(noi, debtService)
        
        expect(dscr).toBeCloseTo(0.79, 2)
      })

      it('should handle zero debt service', () => {
        const noi = 12000
        const debtService = 0
        
        const dscr = calculateDSCR(noi, debtService)
        
        // With no debt, DSCR should be very high (infinity concept)
        expect(dscr).toBe(Infinity)
      })

      it('should identify good vs poor DSCR', () => {
        const goodDSCR = calculateDSCR(15000, 10000) // 1.5
        const poorDSCR = calculateDSCR(8000, 10000)  // 0.8
        
        expect(goodDSCR).toBeGreaterThan(1.25) // Good DSCR threshold
        expect(poorDSCR).toBeLessThan(1.0)     // Poor DSCR threshold
      })
    })

    describe('Operating Expense Ratio', () => {
      it('should calculate correct expense ratio', () => {
        const operatingExpenses = 22320
        const grossIncome = 35280
        
        const ratio = calculateOperatingExpenseRatio(operatingExpenses, grossIncome)
        
        expect(ratio).toBeCloseTo(63.27, 2)
      })

      it('should handle zero income', () => {
        const operatingExpenses = 5000
        const grossIncome = 0
        
        const ratio = calculateOperatingExpenseRatio(operatingExpenses, grossIncome)
        
        expect(ratio).toBe(0)
      })

      it('should identify efficiency thresholds', () => {
        const efficientRatio = calculateOperatingExpenseRatio(15000, 40000) // 37.5%
        const inefficientRatio = calculateOperatingExpenseRatio(30000, 40000) // 75%
        
        expect(efficientRatio).toBeLessThan(50) // Good threshold
        expect(inefficientRatio).toBeGreaterThan(60) // Poor threshold
      })
    })

    describe('Gross Rent Multiplier (GRM)', () => {
      it('should calculate correct GRM', () => {
        const propertyValue = 450000
        const monthlyRent = 2940
        
        const grm = calculateGrossRentMultiplier(propertyValue, monthlyRent)
        
        expect(grm).toBeCloseTo(12.76, 2)
      })

      it('should handle zero rent', () => {
        const propertyValue = 300000
        const monthlyRent = 0
        
        const grm = calculateGrossRentMultiplier(propertyValue, monthlyRent)
        
        expect(grm).toBe(0)
      })

      it('should identify good vs poor GRM', () => {
        const goodGRM = calculateGrossRentMultiplier(200000, 2500) // 6.67
        const poorGRM = calculateGrossRentMultiplier(500000, 2500) // 16.67
        
        expect(goodGRM).toBeLessThan(10) // Good GRM threshold
        expect(poorGRM).toBeGreaterThan(12) // Poor GRM threshold
      })
    })

    describe('1% Rule Calculation', () => {
      it('should calculate correct 1% rule percentage', () => {
        const monthlyRent = 2940
        const propertyValue = 450000
        
        const onePercentRule = calculateOnePercentRule(monthlyRent, propertyValue)
        
        expect(onePercentRule).toBeCloseTo(0.65, 2)
      })

      it('should identify properties that meet 1% rule', () => {
        const meetRule = calculateOnePercentRule(3000, 300000) // 1.0%
        const exceedRule = calculateOnePercentRule(3500, 300000) // 1.17%
        const failRule = calculateOnePercentRule(2000, 300000) // 0.67%
        
        expect(meetRule).toBeCloseTo(1.0, 1)
        expect(exceedRule).toBeGreaterThan(1.0)
        expect(failRule).toBeLessThan(1.0)
      })

      it('should handle zero property value', () => {
        const monthlyRent = 2000
        const propertyValue = 0
        
        const onePercentRule = calculateOnePercentRule(monthlyRent, propertyValue)
        
        expect(onePercentRule).toBe(0)
      })
    })

    describe('Break-Even Occupancy Calculation', () => {
      it('should calculate correct break-even occupancy', () => {
        const totalExpenses = 38716.80 // Operating expenses + debt service
        const grossIncome = 35280
        
        const breakEven = calculateBreakEvenOccupancy(totalExpenses, grossIncome)
        
        expect(breakEven).toBeCloseTo(109.74, 2)
      })

      it('should handle profitable properties', () => {
        const totalExpenses = 30000
        const grossIncome = 40000
        
        const breakEven = calculateBreakEvenOccupancy(totalExpenses, grossIncome)
        
        expect(breakEven).toBeLessThan(100) // Should be under 100% for profitable properties
      })

      it('should handle zero income', () => {
        const totalExpenses = 25000
        const grossIncome = 0
        
        const breakEven = calculateBreakEvenOccupancy(totalExpenses, grossIncome)
        
        expect(breakEven).toBe(0)
      })
    })
  })

  describe('Integration Tests - Multiple Calculations', () => {
    it('should produce consistent results across related metrics', () => {
      // Test data from our mock property
      const propertyValue = 450000
      const monthlyRent = 2940
      const operatingExpenses = 22320
      const debtService = 16396.80
      const totalInvestment = 101250
      
      const grossIncome = monthlyRent * 12
      const noi = grossIncome - operatingExpenses
      const annualCashFlow = noi - debtService
      
      // Calculate all metrics
      const capRate = calculateCapRate(noi, propertyValue)
      const cocReturn = calculateCashOnCashReturn(annualCashFlow, totalInvestment)
      const dscr = calculateDSCR(noi, debtService)
      const expenseRatio = calculateOperatingExpenseRatio(operatingExpenses, grossIncome)
      const grm = calculateGrossRentMultiplier(propertyValue, monthlyRent)
      const onePercent = calculateOnePercentRule(monthlyRent, propertyValue)
      const breakEven = calculateBreakEvenOccupancy(operatingExpenses + debtService, grossIncome)
      
      // Verify relationships between metrics
      expect(dscr).toBeLessThan(1.0) // Since we have negative cash flow
      expect(cocReturn).toBeLessThan(0) // Negative cash flow should result in negative return
      expect(expenseRatio).toBeGreaterThan(50) // High expense ratio indicates inefficiency
      expect(breakEven).toBeGreaterThan(100) // Should need more than 100% occupancy to break even
      expect(onePercent).toBeLessThan(1.0) // Fails the 1% rule
      
      // All calculations should be finite numbers
      expect(Number.isFinite(capRate)).toBe(true)
      expect(Number.isFinite(cocReturn)).toBe(true)
    })
  })

  describe('Performance Tests', () => {
    it('should calculate metrics within performance threshold', () => {
      const iterations = 1000
      const startTime = performance.now()
      
      for (let i = 0; i < iterations; i++) {
        calculateMonthlyMortgagePayment(300000, 6.5, 30)
        calculateCapRate(12000, 400000)
        calculateCashOnCashReturn(5000, 80000)
        calculateDSCR(12000, 15000)
      }
      
      const endTime = performance.now()
      const timePerIteration = (endTime - startTime) / iterations
      
      // Should complete each set of calculations in less than 1ms
      expect(timePerIteration).toBeLessThan(1)
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle extremely large numbers', () => {
      const largeNumber = 1e10 // 10 billion
      
      const payment = calculateMonthlyMortgagePayment(largeNumber, 5, 30)
      const capRate = calculateCapRate(largeNumber, largeNumber * 10)
      
      expect(Number.isFinite(payment)).toBe(true)
      expect(Number.isFinite(capRate)).toBe(true)
    })

    it('should handle very small decimal numbers', () => {
      const smallNumber = 0.01
      
      const payment = calculateMonthlyMortgagePayment(100000, smallNumber, 30)
      const capRate = calculateCapRate(smallNumber, 100000)
      
      expect(Number.isFinite(payment)).toBe(true)
      expect(Number.isFinite(capRate)).toBe(true)
    })

    it('should handle negative inputs appropriately', () => {
      // Some calculations should handle negatives, others shouldn't
      const negativeCashFlow = calculateCashOnCashReturn(-5000, 100000)
      const negativeNOI = calculateCapRate(-1000, 200000)
      
      expect(negativeCashFlow).toBeLessThan(0)
      expect(negativeNOI).toBeLessThan(0)
    })
  })
})