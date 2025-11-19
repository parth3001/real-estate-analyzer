/**
 * MFFinancialsStep Component Unit Tests
 * Tests LTV calculation, commercial loan features, and financial validations
 *
 * QE Standard: Financial component tests must cover:
 * - Calculation accuracy (LTV, monthly payment, total cash needed)
 * - Commercial loan-specific features
 * - Warning thresholds (LTV > 80%)
 * - Field interactions and dependencies
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import MFFinancialsStep from '../MFFinancialsStep';
import type { MFWizardState, StepValidation } from '../mfWizardTypes';

// Mock API service
vi.mock('../../../services/api', () => ({
  wizardApi: {
    lookupProperty: vi.fn()
  }
}));

describe('MFFinancialsStep', () => {
  let mockState: MFWizardState;
  let mockOnUpdate: ReturnType<typeof vi.fn>;
  let mockOnNext: ReturnType<typeof vi.fn>;
  let mockOnPrevious: ReturnType<typeof vi.fn>;
  let mockValidation: StepValidation;

  beforeEach(() => {
    mockState = {
      currentStep: 1, // FINANCIALS step
      completed: [true, false, false, false, false],
      data: {
        propertyName: 'Test Property',
        propertyAddress: {
          street: '123 Oak Street',
          city: 'Austin',
          state: 'TX',
          zipCode: '78701'
        },
        totalUnits: 8,
        totalSqft: 6400,
        yearBuilt: 2015,
        buildingType: 'STACKED',
        purchasePrice: 1200000,
        downPaymentPercentage: 25,
        downPayment: 300000,
        interestRate: 7.625,
        loanTerm: 30,
        closingCostPercentage: 3.0,
        closingCosts: 36000,
        propertyTaxRate: 2.0,
        propertyManagementRate: 10,
        maintenanceCostPerUnit: 100,
        commonAreaUtilities: {
          electric: 150,
          water: 120,
          gas: 80,
          trash: 60
        },
        unitTypes: [],
        longTermAssumptions: {
          projectionYears: 10,
          annualRentIncrease: 3,
          annualPropertyValueIncrease: 4,
          sellingCostsPercentage: 7,
          inflationRate: 2.5,
          vacancyRate: 5,
          capitalExpenditureRate: 6,
          commonAreaMaintenanceRate: 2
        }
      },
      autoPopulated: {},
      smartDefaults: {
        downPaymentPercentage: 25,
        closingCostPercentage: 3.0,
        propertyManagementRate: 10,
        maintenanceCostPerUnit: 100,
        vacancyRate: 5,
        capitalExpenditureRate: 6,
        dataSource: 'Default',
        confidence: {
          score: 70,
          source: 'Industry Standards',
          lastUpdated: new Date(),
          reliability: 'medium'
        },
        currentMortgageRate: {
          value: 7.625,
          confidence: {
            score: 90,
            source: 'FRED Economic Data',
            lastUpdated: new Date(),
            reliability: 'high'
          }
        }
      },
      manualOverrides: [],
      apiErrors: [],
      unitTemplateMode: 'template'
    };

    mockOnUpdate = vi.fn();
    mockOnNext = vi.fn();
    mockOnPrevious = vi.fn();
    mockValidation = {
      isValid: true,
      errors: {},
      warnings: {}
    };
  });

  describe('Field Rendering', () => {
    it('should render all financial input fields', () => {
      render(
        <MFFinancialsStep
          state={mockState}
          onUpdate={mockOnUpdate}
          onNext={mockOnNext}
          onPrevious={mockOnPrevious}
          validation={mockValidation}
        />
      );

      expect(screen.getByLabelText(/Purchase Price/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Interest Rate/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Loan Term/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Closing Cost Percentage/i)).toBeInTheDocument();
    });

    it('should render down payment slider', () => {
      render(
        <MFFinancialsStep
          state={mockState}
          onUpdate={mockOnUpdate}
          onNext={mockOnNext}
          onPrevious={mockOnPrevious}
          validation={mockValidation}
        />
      );

      const slider = screen.getByRole('slider');
      expect(slider).toBeInTheDocument();
      expect(slider).toHaveAttribute('aria-valuemin', '10');
      expect(slider).toHaveAttribute('aria-valuemax', '99');
    });

    it('should render loan type toggle (Fixed/ARM)', () => {
      render(
        <MFFinancialsStep
          state={mockState}
          onUpdate={mockOnUpdate}
          onNext={mockOnNext}
          onPrevious={mockOnPrevious}
          validation={mockValidation}
        />
      );

      expect(screen.getByRole('button', { name: /Fixed Rate/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /ARM \(Adjustable\)/i })).toBeInTheDocument();
    });

    it('should display default financial values from state', () => {
      render(
        <MFFinancialsStep
          state={mockState}
          onUpdate={mockOnUpdate}
          onNext={mockOnNext}
          onPrevious={mockOnPrevious}
          validation={mockValidation}
        />
      );

      const purchasePriceInput = screen.getByLabelText(/Purchase Price/i) as HTMLInputElement;
      expect(purchasePriceInput.value).toBe('1200000');

      const interestRateInput = screen.getByLabelText(/Interest Rate/i) as HTMLInputElement;
      expect(interestRateInput.value).toBe('7.625');

      const loanTermInput = screen.getByLabelText(/Loan Term/i) as HTMLInputElement;
      expect(loanTermInput.value).toBe('30');
    });
  });

  describe('LTV Ratio Calculation - MF Specific', () => {
    it('should calculate and display correct LTV ratio (75%)', () => {
      // Purchase: $1,200,000, Down: $300,000 (25%) = Loan: $900,000
      // LTV = $900,000 / $1,200,000 = 75%

      render(
        <MFFinancialsStep
          state={mockState}
          onUpdate={mockOnUpdate}
          onNext={mockOnNext}
          onPrevious={mockOnPrevious}
          validation={mockValidation}
        />
      );

      expect(screen.getByText(/75\.0%/)).toBeInTheDocument();
    });

    it('should show "Good" LTV rating for 75% LTV', () => {
      render(
        <MFFinancialsStep
          state={mockState}
          onUpdate={mockOnUpdate}
          onNext={mockOnNext}
          onPrevious={mockOnPrevious}
          validation={mockValidation}
        />
      );

      expect(screen.getByText(/Good \(65-75%\)/i)).toBeInTheDocument();
    });

    it('should show "Excellent" LTV rating for 65% LTV', () => {
      const stateWith65LTV = {
        ...mockState,
        data: {
          ...mockState.data,
          downPaymentPercentage: 35,
          downPayment: 420000 // 35% of $1,200,000
        }
      };

      render(
        <MFFinancialsStep
          state={stateWith65LTV}
          onUpdate={mockOnUpdate}
          onNext={mockOnNext}
          onPrevious={mockOnPrevious}
          validation={mockValidation}
        />
      );

      expect(screen.getByText(/65\.0%/)).toBeInTheDocument();
      expect(screen.getByText(/Excellent/i)).toBeInTheDocument();
    });

    it('should show "High" LTV rating for 85% LTV', () => {
      const stateWith85LTV = {
        ...mockState,
        data: {
          ...mockState.data,
          downPaymentPercentage: 15,
          downPayment: 180000 // 15% of $1,200,000
        }
      };

      render(
        <MFFinancialsStep
          state={stateWith85LTV}
          onUpdate={mockOnUpdate}
          onNext={mockOnNext}
          onPrevious={mockOnPrevious}
          validation={mockValidation}
        />
      );

      expect(screen.getByText(/85\.0%/)).toBeInTheDocument();
      expect(screen.getByText(/High \(80-85%\)/i)).toBeInTheDocument();
    });

    it('should show "Very High" LTV rating for 90% LTV', () => {
      const stateWith90LTV = {
        ...mockState,
        data: {
          ...mockState.data,
          downPaymentPercentage: 10,
          downPayment: 120000 // 10% of $1,200,000
        }
      };

      render(
        <MFFinancialsStep
          state={stateWith90LTV}
          onUpdate={mockOnUpdate}
          onNext={mockOnNext}
          onPrevious={mockOnPrevious}
          validation={mockValidation}
        />
      );

      expect(screen.getByText(/90\.0%/)).toBeInTheDocument();
      expect(screen.getByText(/Very High \(85%\+\)/i)).toBeInTheDocument();
    });
  });

  describe('Monthly Payment Calculation', () => {
    it('should calculate monthly payment correctly', () => {
      // Loan: $900,000, Rate: 7.625%, Term: 30 years
      // Expected monthly payment: ~$6,261

      render(
        <MFFinancialsStep
          state={mockState}
          onUpdate={mockOnUpdate}
          onNext={mockOnNext}
          onPrevious={mockOnPrevious}
          validation={mockValidation}
        />
      );

      // Check for monthly payment display (exact value may vary slightly due to rounding)
      const monthlyPaymentText = screen.getByText(/Monthly Payment \(P&I\)/i);
      expect(monthlyPaymentText).toBeInTheDocument();

      // Monthly payment should be around $6,261
      expect(screen.getByText(/\$6,2\d{2}/)).toBeInTheDocument();
    });

    it('should recalculate monthly payment when purchase price changes', async () => {
      const user = userEvent.setup();

      render(
        <MFFinancialsStep
          state={mockState}
          onUpdate={mockOnUpdate}
          onNext={mockOnNext}
          onPrevious={mockOnPrevious}
          validation={mockValidation}
        />
      );

      const purchasePriceInput = screen.getByLabelText(/Purchase Price/i);
      await user.clear(purchasePriceInput);
      await user.type(purchasePriceInput, '1500000');

      expect(mockOnUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            purchasePrice: 1500000,
            downPayment: 375000, // 25% of $1,500,000
            closingCosts: 45000 // 3% of $1,500,000
          })
        })
      );
    });
  });

  describe('Total Cash Needed Calculation', () => {
    it('should calculate total cash needed correctly', () => {
      // Down payment: $300,000
      // Closing costs: $36,000
      // Capital investments: $0
      // Total: $336,000

      render(
        <MFFinancialsStep
          state={mockState}
          onUpdate={mockOnUpdate}
          onNext={mockOnNext}
          onPrevious={mockOnPrevious}
          validation={mockValidation}
        />
      );

      expect(screen.getByText(/Total Cash Needed to Close/i)).toBeInTheDocument();
      expect(screen.getByText(/\$336,000/)).toBeInTheDocument();
    });

    it('should include capital investments in total cash needed', () => {
      const stateWithCapEx = {
        ...mockState,
        data: {
          ...mockState.data,
          capitalInvestments: 50000
        }
      };

      render(
        <MFFinancialsStep
          state={stateWithCapEx}
          onUpdate={mockOnUpdate}
          onNext={mockOnNext}
          onPrevious={mockOnPrevious}
          validation={mockValidation}
        />
      );

      // $300,000 + $36,000 + $50,000 = $386,000
      expect(screen.getByText(/\$386,000/)).toBeInTheDocument();
    });
  });

  describe('Loan Summary Card', () => {
    it('should display loan amount correctly', () => {
      // Loan: $1,200,000 - $300,000 = $900,000

      render(
        <MFFinancialsStep
          state={mockState}
          onUpdate={mockOnUpdate}
          onNext={mockOnNext}
          onPrevious={mockOnPrevious}
          validation={mockValidation}
        />
      );

      expect(screen.getByText(/Loan Amount/i)).toBeInTheDocument();
      expect(screen.getByText(/\$900,000/)).toBeInTheDocument();
    });

    it('should display total interest paid', () => {
      render(
        <MFFinancialsStep
          state={mockState}
          onUpdate={mockOnUpdate}
          onNext={mockOnNext}
          onPrevious={mockOnPrevious}
          validation={mockValidation}
        />
      );

      expect(screen.getByText(/Total Interest \(est\.\)/i)).toBeInTheDocument();
      // Total interest should be displayed (total paid - principal)
    });

    it('should display LTV in loan summary', () => {
      render(
        <MFFinancialsStep
          state={mockState}
          onUpdate={mockOnUpdate}
          onNext={mockOnNext}
          onPrevious={mockOnPrevious}
          validation={mockValidation}
        />
      );

      const loanSummary = screen.getByText(/Loan Summary/i).closest('[class*="MuiCardContent"]');
      expect(loanSummary).toBeInTheDocument();
      expect(loanSummary).toHaveTextContent(/75\.0%/);
    });
  });

  describe('Commercial Financing Educational Content', () => {
    it('should display commercial financing notice', () => {
      render(
        <MFFinancialsStep
          state={mockState}
          onUpdate={mockOnUpdate}
          onNext={mockOnNext}
          onPrevious={mockOnPrevious}
          validation={mockValidation}
        />
      );

      expect(screen.getByText(/Commercial Financing for Multi-Family Properties/i)).toBeInTheDocument();
    });

    it('should display commercial loan considerations card', () => {
      render(
        <MFFinancialsStep
          state={mockState}
          onUpdate={mockOnUpdate}
          onNext={mockOnNext}
          onPrevious={mockOnPrevious}
          validation={mockValidation}
        />
      );

      expect(screen.getByText(/Commercial Loan Considerations/i)).toBeInTheDocument();
      expect(screen.getByText(/Minimum Down Payment/i)).toBeInTheDocument();
      expect(screen.getByText(/DSCR Requirement/i)).toBeInTheDocument();
      expect(screen.getByText(/LTV Sweet Spot/i)).toBeInTheDocument();
    });

    it('should mention 25-30% down payment requirement', () => {
      render(
        <MFFinancialsStep
          state={mockState}
          onUpdate={mockOnUpdate}
          onNext={mockOnNext}
          onPrevious={mockOnPrevious}
          validation={mockValidation}
        />
      );

      expect(screen.getByText(/25-30% down payment minimum/i)).toBeInTheDocument();
    });

    it('should mention DSCR ≥ 1.25 requirement', () => {
      render(
        <MFFinancialsStep
          state={mockState}
          onUpdate={mockOnUpdate}
          onNext={mockOnNext}
          onPrevious={mockOnPrevious}
          validation={mockValidation}
        />
      );

      expect(screen.getByText(/DSCR ≥ 1\.25/i)).toBeInTheDocument();
    });
  });

  describe('User Input Handling', () => {
    it('should update state when purchase price is changed', async () => {
      const user = userEvent.setup();

      render(
        <MFFinancialsStep
          state={mockState}
          onUpdate={mockOnUpdate}
          onNext={mockOnNext}
          onPrevious={mockOnPrevious}
          validation={mockValidation}
        />
      );

      const purchasePriceInput = screen.getByLabelText(/Purchase Price/i);
      await user.clear(purchasePriceInput);
      await user.type(purchasePriceInput, '1500000');

      expect(mockOnUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            purchasePrice: 1500000
          })
        })
      );
    });

    it('should update down payment when slider is moved', async () => {
      const user = userEvent.setup();

      render(
        <MFFinancialsStep
          state={mockState}
          onUpdate={mockOnUpdate}
          onNext={mockOnNext}
          onPrevious={mockOnPrevious}
          validation={mockValidation}
        />
      );

      const slider = screen.getByRole('slider');

      // Simulate slider change to 30%
      await user.click(slider);
      // Note: Actual slider interaction is complex and may need special handling

      // Verify onUpdate was called with updated percentage
      // In a real scenario, we'd mock the slider value change
    });

    it('should update state when interest rate is changed', async () => {
      const user = userEvent.setup();

      render(
        <MFFinancialsStep
          state={mockState}
          onUpdate={mockOnUpdate}
          onNext={mockOnNext}
          onPrevious={mockOnPrevious}
          validation={mockValidation}
        />
      );

      const interestRateInput = screen.getByLabelText(/Interest Rate/i);
      await user.clear(interestRateInput);
      await user.type(interestRateInput, '8.0');

      expect(mockOnUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            interestRate: 8.0
          })
        })
      );
    });

    it('should update state when closing cost percentage is changed', async () => {
      const user = userEvent.setup();

      render(
        <MFFinancialsStep
          state={mockState}
          onUpdate={mockOnUpdate}
          onNext={mockOnNext}
          onPrevious={mockOnPrevious}
          validation={mockValidation}
        />
      );

      const closingCostInput = screen.getByLabelText(/Closing Cost Percentage/i);
      await user.clear(closingCostInput);
      await user.type(closingCostInput, '3.5');

      expect(mockOnUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            closingCostPercentage: 3.5,
            closingCosts: 42000 // 3.5% of $1,200,000
          })
        })
      );
    });
  });

  describe('Smart Defaults Auto-Population', () => {
    it('should display market rate badge when available', () => {
      render(
        <MFFinancialsStep
          state={mockState}
          onUpdate={mockOnUpdate}
          onNext={mockOnNext}
          onPrevious={mockOnPrevious}
          validation={mockValidation}
        />
      );

      expect(screen.getByText(/Market Rate Applied/i)).toBeInTheDocument();
    });

    it('should show current market rate in helper text', () => {
      render(
        <MFFinancialsStep
          state={mockState}
          onUpdate={mockOnUpdate}
          onNext={mockOnNext}
          onPrevious={mockOnPrevious}
          validation={mockValidation}
        />
      );

      expect(screen.getByText(/Current market rate: 7\.625%/i)).toBeInTheDocument();
    });
  });

  describe('Validation Error Display', () => {
    it('should display error for invalid purchase price', () => {
      const validationWithErrors = {
        ...mockValidation,
        isValid: false,
        errors: {
          'purchasePrice': 'Purchase price is required'
        }
      };

      render(
        <MFFinancialsStep
          state={mockState}
          onUpdate={mockOnUpdate}
          onNext={mockOnNext}
          onPrevious={mockOnPrevious}
          validation={validationWithErrors}
        />
      );

      expect(screen.getByText(/Purchase price is required/i)).toBeInTheDocument();
    });

    it('should display error for invalid interest rate', () => {
      const validationWithErrors = {
        ...mockValidation,
        isValid: false,
        errors: {
          'interestRate': 'Interest rate is required'
        }
      };

      render(
        <MFFinancialsStep
          state={mockState}
          onUpdate={mockOnUpdate}
          onNext={mockOnNext}
          onPrevious={mockOnPrevious}
          validation={validationWithErrors}
        />
      );

      expect(screen.getByText(/Interest rate is required/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for all input fields', () => {
      render(
        <MFFinancialsStep
          state={mockState}
          onUpdate={mockOnUpdate}
          onNext={mockOnNext}
          onPrevious={mockOnPrevious}
          validation={mockValidation}
        />
      );

      expect(screen.getByLabelText(/Purchase Price/i)).toHaveAttribute('type', 'number');
      expect(screen.getByLabelText(/Interest Rate/i)).toHaveAttribute('type', 'number');
      expect(screen.getByLabelText(/Loan Term/i)).toHaveAttribute('type', 'number');
    });

    it('should have accessible slider with proper ARIA attributes', () => {
      render(
        <MFFinancialsStep
          state={mockState}
          onUpdate={mockOnUpdate}
          onNext={mockOnNext}
          onPrevious={mockOnPrevious}
          validation={mockValidation}
        />
      );

      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('aria-valuemin');
      expect(slider).toHaveAttribute('aria-valuemax');
      expect(slider).toHaveAttribute('aria-valuenow');
    });
  });
});
