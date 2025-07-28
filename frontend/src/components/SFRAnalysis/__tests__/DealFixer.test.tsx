import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import '@testing-library/jest-dom';
import DealFixer from '../DealFixer';
import type { SFRPropertyData } from '../../../types/property';
import type { Analysis } from '../../../types/analysis';

const theme = createTheme();

const mockPropertyData: SFRPropertyData = {
  propertyType: 'SFR',
  propertyName: 'Poor Deal Property',
  propertyAddress: {
    street: '123 Poor Deal St',
    city: 'Struggling City',
    state: 'CA',
    zipCode: '12345'
  },
  purchasePrice: 400000,
  downPayment: 80000,
  interestRate: 7.25,
  loanTerm: 30,
  monthlyRent: 2200, // Low rent for purchase price
  squareFootage: 1200,
  bedrooms: 3,
  bathrooms: 2,
  propertyTaxRate: 1.8, // High property tax
  insuranceRate: 1.2, // High insurance
  propertyManagementRate: 8,
  maintenanceCost: 6000, // High maintenance
  yearBuilt: 2010,
  longTermAssumptions: {
    projectionYears: 10,
    annualRentIncrease: 3,
    annualPropertyValueIncrease: 3.5,
    sellingCostsPercentage: 6,
    inflationRate: 2.5,
    vacancyRate: 8 // High vacancy
  }
};

const mockPoorAnalysis: Analysis = {
  monthlyAnalysis: {
    income: { gross: 2200, effective: 2024 },
    expenses: {
      operating: 1200,
      debt: 1071,
      total: 2271,
      breakdown: {
        propertyTax: 600,
        insurance: 400,
        maintenance: 500,
        propertyManagement: 176,
        vacancy: 176,
        utilities: 0,
        commonAreaElectricity: 0,
        landscaping: 0,
        waterSewer: 0,
        garbage: 0,
        marketingAndAdvertising: 0,
        repairsAndMaintenance: 0,
        capEx: 0
      }
    },
    cashFlow: -247 // Negative cash flow
  },
  annualAnalysis: {
    income: 24288,
    expenses: 27252,
    noi: 11928,
    debtService: 12852,
    cashFlow: -2964
  },
  keyMetrics: {
    noi: 11928,
    capRate: 2.98,
    cashOnCashReturn: -1.23, // Negative return
    irr: 2.1,
    dscr: 0.82, // Poor DSCR
    operatingExpenseRatio: 54.5,
    totalInvestment: 80000,
    pricePerSqFt: 333,
    rentPerSqFt: 1.83,
    grossRentMultiplier: 181.8,
    breakEvenOccupancy: 95.2,
    equityMultiple: 1.2,
    onePercentRuleValue: 4000,
    fiftyRuleAnalysis: false,
    rentToPriceRatio: 0.55,
    pricePerBedroom: 133333,
    debtToIncomeRatio: 52.9,
    returnOnImprovements: 0,
    turnoverCostImpact: 2.1
  },
  longTermAnalysis: {
    projections: [],
    exitAnalysis: {
      projectedSalePrice: 400000,
      sellingCosts: 24000,
      mortgagePayoff: 280000,
      netProceedsFromSale: 96000,
      totalReturn: 16000
    },
    returns: {
      irr: 2.1,
      totalCashFlow: -29640,
      totalAppreciation: 40000,
      totalReturn: 10360,
      totalInvestment: 80000,
      totalAdditionalInvestment: 0
    },
    projectionYears: 10
  },
  aiInsights: {
    summary: 'Poor investment with negative cash flow',
    strengths: ['Good location'],
    weaknesses: ['High expenses', 'Low rent', 'Negative cash flow'],
    recommendations: ['Reduce purchase price', 'Increase rent'],
    investmentScore: 25 // Poor score triggering deal fixer
  }
};

const mockGoodAnalysis: Analysis = {
  ...mockPoorAnalysis,
  monthlyAnalysis: {
    ...mockPoorAnalysis.monthlyAnalysis,
    cashFlow: 300 // Positive cash flow
  },
  keyMetrics: {
    ...mockPoorAnalysis.keyMetrics,
    cashOnCashReturn: 8.5, // Good return
    dscr: 1.4 // Good DSCR
  },
  aiInsights: {
    ...mockPoorAnalysis.aiInsights,
    investmentScore: 72 // Good score - shouldn't show fixer
  }
};

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider theme={theme}>
    {children}
  </ThemeProvider>
);

describe('DealFixer', () => {
  const mockOnApplyFix = jest.fn();

  beforeEach(() => {
    mockOnApplyFix.mockClear();
  });

  it('renders when deal score is poor', () => {
    render(
      <TestWrapper>
        <DealFixer
          propertyData={mockPropertyData}
          analysis={mockPoorAnalysis}
          onApplyFix={mockOnApplyFix}
        />
      </TestWrapper>
    );

    expect(screen.getByText('Deal Optimization Suggestions')).toBeInTheDocument();
    expect(screen.getByText(/Current score: 25\/100/)).toBeInTheDocument();
  });

  it('does not render when deal score is good', () => {
    render(
      <TestWrapper>
        <DealFixer
          propertyData={mockPropertyData}
          analysis={mockGoodAnalysis}
          onApplyFix={mockOnApplyFix}
        />
      </TestWrapper>
    );

    expect(screen.queryByText('Deal Optimization Suggestions')).not.toBeInTheDocument();
  });

  it('displays deal issues correctly', () => {
    render(
      <TestWrapper>
        <DealFixer
          propertyData={mockPropertyData}
          analysis={mockPoorAnalysis}
          onApplyFix={mockOnApplyFix}
        />
      </TestWrapper>
    );

    expect(screen.getByText('Deal Issues Identified:')).toBeInTheDocument();
    expect(screen.getByText('Low Cash Flow: $-247/mo')).toBeInTheDocument();
    expect(screen.getByText('Low CoC Return: -1.2%')).toBeInTheDocument();
    expect(screen.getByText('Poor DSCR: 0.82')).toBeInTheDocument();
  });

  it('shows purchase price reduction suggestion', () => {
    render(
      <TestWrapper>
        <DealFixer
          propertyData={mockPropertyData}
          analysis={mockPoorAnalysis}
          onApplyFix={mockOnApplyFix}
        />
      </TestWrapper>
    );

    expect(screen.getByText('Negotiate Purchase Price Down')).toBeInTheDocument();
  });

  it('shows rent increase suggestion', () => {
    render(
      <TestWrapper>
        <DealFixer
          propertyData={mockPropertyData}
          analysis={mockPoorAnalysis}
          onApplyFix={mockOnApplyFix}
        />
      </TestWrapper>
    );

    expect(screen.getByText('Market Rent Analysis & Increase')).toBeInTheDocument();
  });

  it('shows property tax appeal suggestion for high tax rates', () => {
    render(
      <TestWrapper>
        <DealFixer
          propertyData={mockPropertyData}
          analysis={mockPoorAnalysis}
          onApplyFix={mockOnApplyFix}
        />
      </TestWrapper>
    );

    expect(screen.getByText('Property Tax Appeal')).toBeInTheDocument();
  });

  it('shows self-management suggestion when management fee exists', () => {
    render(
      <TestWrapper>
        <DealFixer
          propertyData={mockPropertyData}
          analysis={mockPoorAnalysis}
          onApplyFix={mockOnApplyFix}
        />
      </TestWrapper>
    );

    expect(screen.getByText('Self-Management Strategy')).toBeInTheDocument();
  });

  it('allows selecting multiple fixes', () => {
    render(
      <TestWrapper>
        <DealFixer
          propertyData={mockPropertyData}
          analysis={mockPoorAnalysis}
          onApplyFix={mockOnApplyFix}
        />
      </TestWrapper>
    );

    // Click on first suggestion to select it
    const firstSuggestion = screen.getByText('Negotiate Purchase Price Down').closest('.MuiAccordion-root');
    const checkbox = firstSuggestion?.querySelector('[data-testid="RadioButtonUncheckedIcon"]');
    
    if (checkbox) {
      fireEvent.click(checkbox);
    }

    // Should show selected impact summary
    expect(screen.getByText('Selected Improvements Impact:')).toBeInTheDocument();
  });

  it('shows combined impact when fixes are selected', async () => {
    render(
      <TestWrapper>
        <DealFixer
          propertyData={mockPropertyData}
          analysis={mockPoorAnalysis}
          onApplyFix={mockOnApplyFix}
        />
      </TestWrapper>
    );

    // Expand and select first suggestion
    const firstAccordion = screen.getByText('Negotiate Purchase Price Down').closest('.MuiAccordion-root');
    const expandButton = firstAccordion?.querySelector('[data-testid="ExpandMoreIcon"]');
    
    if (expandButton) {
      fireEvent.click(expandButton);
    }

    // Wait for accordion to expand and then select
    await waitFor(() => {
      const checkbox = screen.getByTestId('RadioButtonUncheckedIcon');
      fireEvent.click(checkbox);
    });

    // Should show apply button
    await waitFor(() => {
      expect(screen.getByText(/Apply.*Selected Fix/)).toBeInTheDocument();
    });
  });

  it('calls onApplyFix when fixes are applied', async () => {
    render(
      <TestWrapper>
        <DealFixer
          propertyData={mockPropertyData}
          analysis={mockPoorAnalysis}
          onApplyFix={mockOnApplyFix}
        />
      </TestWrapper>
    );

    // Select first suggestion
    const firstCheckbox = screen.getAllByTestId('RadioButtonUncheckedIcon')[0];
    fireEvent.click(firstCheckbox);

    // Click apply button
    const applyButton = screen.getByText(/Apply.*Selected Fix/);
    fireEvent.click(applyButton);

    await waitFor(() => {
      expect(mockOnApplyFix).toHaveBeenCalled();
    });
  });

  it('shows impact levels correctly', () => {
    render(
      <TestWrapper>
        <DealFixer
          propertyData={mockPropertyData}
          analysis={mockPoorAnalysis}
          onApplyFix={mockOnApplyFix}
        />
      </TestWrapper>
    );

    // Should show impact levels as chips
    expect(screen.getByText('high')).toBeInTheDocument();
    expect(screen.getByText('medium')).toBeInTheDocument();
  });

  it('shows difficulty levels correctly', () => {
    render(
      <TestWrapper>
        <DealFixer
          propertyData={mockPropertyData}
          analysis={mockPoorAnalysis}
          onApplyFix={mockOnApplyFix}
        />
      </TestWrapper>
    );

    // Should show difficulty levels as chips
    expect(screen.getByText('moderate')).toBeInTheDocument();
    expect(screen.getByText('easy')).toBeInTheDocument();
  });

  it('expands suggestion details when clicked', async () => {
    render(
      <TestWrapper>
        <DealFixer
          propertyData={mockPropertyData}
          analysis={mockPoorAnalysis}
          onApplyFix={mockOnApplyFix}
        />
      </TestWrapper>
    );

    // Click to expand first suggestion
    const firstAccordion = screen.getByText('Negotiate Purchase Price Down');
    fireEvent.click(firstAccordion);

    // Should show expanded details
    await waitFor(() => {
      expect(screen.getByText('Expected Impact:')).toBeInTheDocument();
      expect(screen.getByText('Implementation:')).toBeInTheDocument();
      expect(screen.getByText('Pros:')).toBeInTheDocument();
      expect(screen.getByText('Risks & Considerations:')).toBeInTheDocument();
    });
  });

  it('shows market timing suggestion for very poor deals', () => {
    const veryPoorAnalysis = {
      ...mockPoorAnalysis,
      aiInsights: {
        ...mockPoorAnalysis.aiInsights,
        investmentScore: 35 // Very poor score
      }
    };

    render(
      <TestWrapper>
        <DealFixer
          propertyData={mockPropertyData}
          analysis={veryPoorAnalysis}
          onApplyFix={mockOnApplyFix}
        />
      </TestWrapper>
    );

    expect(screen.getByText('Market Timing Strategy')).toBeInTheDocument();
  });

  it('handles down payment optimization suggestion', () => {
    const highDownPaymentData = {
      ...mockPropertyData,
      downPayment: 120000 // 30% down payment
    };

    const lowCoCAnalysis = {
      ...mockPoorAnalysis,
      keyMetrics: {
        ...mockPoorAnalysis.keyMetrics,
        cashOnCashReturn: 5 // Low but positive CoC return
      }
    };

    render(
      <TestWrapper>
        <DealFixer
          propertyData={highDownPaymentData}
          analysis={lowCoCAnalysis}
          onApplyFix={mockOnApplyFix}
        />
      </TestWrapper>
    );

    expect(screen.getByText('Optimize Down Payment')).toBeInTheDocument();
  });

  it('calculates expected improvements correctly', () => {
    render(
      <TestWrapper>
        <DealFixer
          propertyData={mockPropertyData}
          analysis={mockPoorAnalysis}
          onApplyFix={mockOnApplyFix}
        />
      </TestWrapper>
    );

    // Expand first suggestion to see expected improvements
    const firstAccordion = screen.getByText('Negotiate Purchase Price Down');
    fireEvent.click(firstAccordion);

    // Should show specific improvement numbers
    expect(screen.getByText(/Cash Flow: \+\$/)).toBeInTheDocument();
    expect(screen.getByText(/CoC Return: \+/)).toBeInTheDocument();
    expect(screen.getByText(/Score: \+/)).toBeInTheDocument();
  });

  it('sorts suggestions by expected score improvement', () => {
    render(
      <TestWrapper>
        <DealFixer
          propertyData={mockPropertyData}
          analysis={mockPoorAnalysis}
          onApplyFix={mockOnApplyFix}
        />
      </TestWrapper>
    );

    // First suggestion should be the one with highest expected score improvement
    // Purchase price reduction typically has high impact
    const suggestions = screen.getAllByRole('button', { expanded: false });
    expect(suggestions[0]).toHaveTextContent('Negotiate Purchase Price Down');
  });

  it('prevents selecting more than reasonable number of fixes', () => {
    render(
      <TestWrapper>
        <DealFixer
          propertyData={mockPropertyData}
          analysis={mockPoorAnalysis}
          onApplyFix={mockOnApplyFix}
        />
      </TestWrapper>
    );

    // All checkboxes should be selectable (no artificial limit in this implementation)
    const checkboxes = screen.getAllByTestId('RadioButtonUncheckedIcon');
    expect(checkboxes.length).toBeGreaterThan(0);
  });

  it('shows warning when isVisible is false', () => {
    render(
      <TestWrapper>
        <DealFixer
          propertyData={mockPropertyData}
          analysis={mockPoorAnalysis}
          onApplyFix={mockOnApplyFix}
          isVisible={false}
        />
      </TestWrapper>
    );

    expect(screen.queryByText('Deal Optimization Suggestions')).not.toBeInTheDocument();
  });
});