import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import '@testing-library/jest-dom';
import DynamicSliders from '../DynamicSliders';
import DealFixer from '../DealFixer';
import ScenarioManager from '../ScenarioManager';
import type { SFRPropertyData } from '../../../types/property';
import type { Analysis } from '../../../types/analysis';

const theme = createTheme();

const mockPropertyData: SFRPropertyData = {
  propertyType: 'SFR',
  propertyName: 'Integration Test Property',
  propertyAddress: {
    street: '123 Integration St',
    city: 'Test City',
    state: 'CA',
    zipCode: '12345'
  },
  purchasePrice: 300000,
  downPayment: 60000,
  interestRate: 6.5,
  loanTerm: 30,
  monthlyRent: 2500,
  squareFootage: 1200,
  bedrooms: 3,
  bathrooms: 2,
  propertyTaxRate: 1.2,
  insuranceRate: 0.8,
  propertyManagementRate: 8,
  maintenanceCost: 3000,
  yearBuilt: 2010,
  longTermAssumptions: {
    projectionYears: 10,
    annualRentIncrease: 3,
    annualPropertyValueIncrease: 3.5,
    sellingCostsPercentage: 6,
    inflationRate: 2.5,
    vacancyRate: 5
  }
};

const mockGoodAnalysis: Analysis = {
  monthlyAnalysis: {
    income: { gross: 2500, effective: 2375 },
    expenses: {
      operating: 800,
      debt: 1400,
      total: 2200,
      breakdown: {
        propertyTax: 300,
        insurance: 200,
        maintenance: 250,
        propertyManagement: 200,
        vacancy: 125,
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
    cashFlow: 175
  },
  annualAnalysis: {
    income: 28500,
    expenses: 26400,
    noi: 19800,
    debtService: 16800,
    cashFlow: 2100
  },
  keyMetrics: {
    noi: 19800,
    capRate: 6.6,
    cashOnCashReturn: 8.75,
    irr: 12.5,
    dscr: 1.18,
    operatingExpenseRatio: 30.5,
    totalInvestment: 60000,
    pricePerSqFt: 250,
    rentPerSqFt: 2.08,
    grossRentMultiplier: 120,
    breakEvenOccupancy: 88.2,
    equityMultiple: 2.1,
    onePercentRuleValue: 3000,
    fiftyRuleAnalysis: true,
    rentToPriceRatio: 1.0,
    pricePerBedroom: 100000,
    debtToIncomeRatio: 58.9,
    returnOnImprovements: 0,
    turnoverCostImpact: 1.5
  },
  longTermAnalysis: {
    projections: [],
    exitAnalysis: {
      projectedSalePrice: 450000,
      sellingCosts: 27000,
      mortgagePayoff: 200000,
      netProceedsFromSale: 223000,
      totalReturn: 163000
    },
    returns: {
      irr: 12.5,
      totalCashFlow: 21000,
      totalAppreciation: 150000,
      totalReturn: 171000,
      totalInvestment: 60000,
      totalAdditionalInvestment: 0
    },
    projectionYears: 10
  },
  aiInsights: {
    summary: 'Good investment with positive cash flow',
    strengths: ['Good cash flow', 'Strong returns'],
    weaknesses: ['Market dependent'],
    recommendations: ['Hold long term'],
    investmentScore: 72
  }
};

const mockPoorAnalysis: Analysis = {
  ...mockGoodAnalysis,
  monthlyAnalysis: {
    ...mockGoodAnalysis.monthlyAnalysis,
    cashFlow: -200
  },
  keyMetrics: {
    ...mockGoodAnalysis.keyMetrics,
    cashOnCashReturn: -2.5,
    dscr: 0.85
  },
  aiInsights: {
    ...mockGoodAnalysis.aiInsights,
    investmentScore: 35,
    summary: 'Poor investment with negative cash flow'
  }
};

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider theme={theme}>
    {children}
  </ThemeProvider>
);

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('Interactive Scenario Modeling Integration', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockClear();
  });

  describe('Full Workflow Integration', () => {
    it('completes the full interactive scenario modeling workflow', async () => {
      let currentData = mockPropertyData;
      let currentAnalysis = mockGoodAnalysis;
      
      const mockOnParameterChange = jest.fn().mockImplementation(async (newData) => {
        currentData = newData;
        // Simulate analysis update
        currentAnalysis = {
          ...currentAnalysis,
          monthlyAnalysis: {
            ...currentAnalysis.monthlyAnalysis,
            cashFlow: newData.purchasePrice < 300000 ? 250 : 175
          }
        };
      });

      const mockOnLoadScenario = jest.fn().mockImplementation(async (data) => {
        currentData = data;
      });

      const mockOnApplyFix = jest.fn().mockImplementation(async (newData, description) => {
        currentData = newData;
        // Simulate improved analysis after fix
        currentAnalysis = {
          ...currentAnalysis,
          monthlyAnalysis: {
            ...currentAnalysis.monthlyAnalysis,
            cashFlow: 300
          },
          keyMetrics: {
            ...currentAnalysis.keyMetrics,
            cashOnCashReturn: 10.5
          },
          aiInsights: {
            ...currentAnalysis.aiInsights,
            investmentScore: 75
          }
        };
      });

      const { rerender } = render(
        <TestWrapper>
          <DynamicSliders
            propertyData={currentData}
            onParameterChange={mockOnParameterChange}
          />
          <ScenarioManager
            currentPropertyData={currentData}
            currentAnalysis={currentAnalysis}
            onLoadScenario={mockOnLoadScenario}
          />
        </TestWrapper>
      );

      // Step 1: Adjust parameters with DynamicSliders
      const purchasePriceInput = screen.getByDisplayValue('300000');
      fireEvent.change(purchasePriceInput, { target: { value: '280000' } });

      await waitFor(() => {
        expect(mockOnParameterChange).toHaveBeenCalledWith({
          ...mockPropertyData,
          purchasePrice: 280000
        });
      });

      // Step 2: Save the adjusted scenario
      const saveButton = screen.getByText('Save Current');
      fireEvent.click(saveButton);

      const nameInput = screen.getByLabelText('Scenario Name');
      fireEvent.change(nameInput, { target: { value: 'Reduced Price Scenario' } });

      const saveScenarioButton = screen.getByRole('button', { name: 'Save Scenario' });
      fireEvent.click(saveScenarioButton);

      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          'propertyScenarios',
          expect.stringContaining('Reduced Price Scenario')
        );
      });

      // Step 3: Test the complete integration
      expect(mockOnParameterChange).toHaveBeenCalled();
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it('integrates DealFixer with other components for poor deals', async () => {
      let currentData = mockPropertyData;
      let currentAnalysis = mockPoorAnalysis;

      const mockOnParameterChange = jest.fn();
      const mockOnLoadScenario = jest.fn();
      const mockOnApplyFix = jest.fn().mockImplementation(async (newData, description) => {
        currentData = newData;
        // Simulate improved analysis after fix
        currentAnalysis = {
          ...currentAnalysis,
          monthlyAnalysis: { ...currentAnalysis.monthlyAnalysis, cashFlow: 150 },
          keyMetrics: { ...currentAnalysis.keyMetrics, cashOnCashReturn: 6.5 },
          aiInsights: { ...currentAnalysis.aiInsights, investmentScore: 65 }
        };
      });

      render(
        <TestWrapper>
          <DynamicSliders
            propertyData={currentData}
            onParameterChange={mockOnParameterChange}
          />
          <DealFixer
            propertyData={currentData}
            analysis={currentAnalysis}
            onApplyFix={mockOnApplyFix}
          />
          <ScenarioManager
            currentPropertyData={currentData}
            currentAnalysis={currentAnalysis}
            onLoadScenario={mockOnLoadScenario}
          />
        </TestWrapper>
      );

      // DealFixer should be visible for poor deal
      expect(screen.getByText('Deal Optimization Suggestions')).toBeInTheDocument();
      expect(screen.getByText(/Current score: 35\/100/)).toBeInTheDocument();

      // Apply a fix
      const firstCheckbox = screen.getAllByTestId('RadioButtonUncheckedIcon')[0];
      fireEvent.click(firstCheckbox);

      const applyButton = screen.getByText(/Apply.*Selected Fix/);
      fireEvent.click(applyButton);

      await waitFor(() => {
        expect(mockOnApplyFix).toHaveBeenCalled();
      });
    });
  });

  describe('Component Integration Points', () => {
    it('DynamicSliders updates trigger analysis recalculation', async () => {
      const mockOnParameterChange = jest.fn();

      render(
        <TestWrapper>
          <DynamicSliders
            propertyData={mockPropertyData}
            onParameterChange={mockOnParameterChange}
          />
        </TestWrapper>
      );

      // Change multiple parameters
      const purchasePriceInput = screen.getByDisplayValue('300000');
      fireEvent.change(purchasePriceInput, { target: { value: '350000' } });

      // Switch to property category
      const propertyButton = screen.getByText('property');
      fireEvent.click(propertyButton);

      const rentInput = screen.getByDisplayValue('2500');
      fireEvent.change(rentInput, { target: { value: '2700' } });

      // Both changes should trigger parameter updates
      await waitFor(() => {
        expect(mockOnParameterChange).toHaveBeenCalledTimes(2);
      });
    });

    it('ScenarioManager saves and loads scenarios correctly', async () => {
      const mockOnLoadScenario = jest.fn();

      // Mock existing scenario in localStorage
      const existingScenario = {
        id: '1',
        name: 'Saved Scenario',
        propertyData: { ...mockPropertyData, purchasePrice: 350000 },
        analysis: mockGoodAnalysis,
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        isFavorite: false
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify([existingScenario]));

      render(
        <TestWrapper>
          <ScenarioManager
            currentPropertyData={mockPropertyData}
            currentAnalysis={mockGoodAnalysis}
            onLoadScenario={mockOnLoadScenario}
          />
        </TestWrapper>
      );

      // Load the saved scenario
      const loadButton = screen.getByTestId('EditIcon');
      fireEvent.click(loadButton);

      await waitFor(() => {
        expect(mockOnLoadScenario).toHaveBeenCalledWith(existingScenario.propertyData);
      });
    });

    it('DealFixer suggestions work with DynamicSliders parameters', async () => {
      const mockOnApplyFix = jest.fn();

      render(
        <TestWrapper>
          <DealFixer
            propertyData={mockPropertyData}
            analysis={mockPoorAnalysis}
            onApplyFix={mockOnApplyFix}
          />
        </TestWrapper>
      );

      // Select purchase price reduction fix
      const checkboxes = screen.getAllByTestId('RadioButtonUncheckedIcon');
      const purchasePriceCheckbox = checkboxes[0]; // First suggestion is usually purchase price
      fireEvent.click(purchasePriceCheckbox);

      const applyButton = screen.getByText(/Apply.*Selected Fix/);
      fireEvent.click(applyButton);

      await waitFor(() => {
        expect(mockOnApplyFix).toHaveBeenCalledWith(
          expect.objectContaining({
            purchasePrice: expect.any(Number)
          }),
          expect.stringContaining('Negotiate Purchase Price Down')
        );
      });
    });
  });

  describe('Data Flow Integration', () => {
    it('maintains data consistency across all components', async () => {
      let sharedData = mockPropertyData;
      let sharedAnalysis = mockGoodAnalysis;

      const mockOnParameterChange = jest.fn().mockImplementation(async (newData) => {
        sharedData = newData;
      });

      const mockOnLoadScenario = jest.fn().mockImplementation(async (data) => {
        sharedData = data;
      });

      const mockOnApplyFix = jest.fn().mockImplementation(async (newData) => {
        sharedData = newData;
      });

      const { rerender } = render(
        <TestWrapper>
          <DynamicSliders
            propertyData={sharedData}
            onParameterChange={mockOnParameterChange}
          />
          <DealFixer
            propertyData={sharedData}
            analysis={sharedAnalysis}
            onApplyFix={mockOnApplyFix}
          />
          <ScenarioManager
            currentPropertyData={sharedData}
            currentAnalysis={sharedAnalysis}
            onLoadScenario={mockOnLoadScenario}
          />
        </TestWrapper>
      );

      // Change data in DynamicSliders
      const purchasePriceInput = screen.getByDisplayValue('300000');
      fireEvent.change(purchasePriceInput, { target: { value: '320000' } });

      await waitFor(() => {
        expect(mockOnParameterChange).toHaveBeenCalledWith(
          expect.objectContaining({ purchasePrice: 320000 })
        );
      });

      // Update shared data and rerender
      sharedData = { ...sharedData, purchasePrice: 320000 };

      rerender(
        <TestWrapper>
          <DynamicSliders
            propertyData={sharedData}
            onParameterChange={mockOnParameterChange}
          />
          <DealFixer
            propertyData={sharedData}
            analysis={sharedAnalysis}
            onApplyFix={mockOnApplyFix}
          />
          <ScenarioManager
            currentPropertyData={sharedData}
            currentAnalysis={sharedAnalysis}
            onLoadScenario={mockOnLoadScenario}
          />
        </TestWrapper>
      );

      // Verify the new data is reflected
      expect(screen.getByDisplayValue('320000')).toBeInTheDocument();
    });

    it('handles real-time updates correctly', async () => {
      const mockOnParameterChange = jest.fn();

      render(
        <TestWrapper>
          <DynamicSliders
            propertyData={mockPropertyData}
            onParameterChange={mockOnParameterChange}
            isCalculating={true}
          />
        </TestWrapper>
      );

      // Should show calculating status
      expect(screen.getByText('Calculating...')).toBeInTheDocument();

      // Parameters should still be interactive during calculation
      const purchasePriceInput = screen.getByDisplayValue('300000');
      expect(purchasePriceInput).not.toBeDisabled();
    });
  });

  describe('Error Handling Integration', () => {
    it('handles errors gracefully across components', async () => {
      const mockOnParameterChange = jest.fn().mockRejectedValue(new Error('API Error'));
      const mockOnLoadScenario = jest.fn().mockRejectedValue(new Error('Load Error'));
      const mockOnApplyFix = jest.fn().mockRejectedValue(new Error('Fix Error'));

      render(
        <TestWrapper>
          <DynamicSliders
            propertyData={mockPropertyData}
            onParameterChange={mockOnParameterChange}
          />
          <DealFixer
            propertyData={mockPropertyData}
            analysis={mockPoorAnalysis}
            onApplyFix={mockOnApplyFix}
          />
          <ScenarioManager
            currentPropertyData={mockPropertyData}
            currentAnalysis={mockGoodAnalysis}
            onLoadScenario={mockOnLoadScenario}
          />
        </TestWrapper>
      );

      // Components should still render despite potential errors
      expect(screen.getByText('Interactive Analysis')).toBeInTheDocument();
      expect(screen.getByText('Deal Optimization Suggestions')).toBeInTheDocument();
      expect(screen.getByText('Scenario Management')).toBeInTheDocument();
    });

    it('handles localStorage errors in ScenarioManager', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      render(
        <TestWrapper>
          <ScenarioManager
            currentPropertyData={mockPropertyData}
            currentAnalysis={mockGoodAnalysis}
            onLoadScenario={jest.fn()}
          />
        </TestWrapper>
      );

      // Should render without crashing
      expect(screen.getByText('Scenario Management')).toBeInTheDocument();
    });
  });

  describe('Performance Integration', () => {
    it('debounces parameter changes correctly', async () => {
      const mockOnParameterChange = jest.fn();

      render(
        <TestWrapper>
          <DynamicSliders
            propertyData={mockPropertyData}
            onParameterChange={mockOnParameterChange}
          />
        </TestWrapper>
      );

      const purchasePriceInput = screen.getByDisplayValue('300000');

      // Make multiple rapid changes
      fireEvent.change(purchasePriceInput, { target: { value: '310000' } });
      fireEvent.change(purchasePriceInput, { target: { value: '320000' } });
      fireEvent.change(purchasePriceInput, { target: { value: '330000' } });

      // Should only call once after debounce
      await waitFor(() => {
        expect(mockOnParameterChange).toHaveBeenCalledTimes(1);
      }, { timeout: 500 });
    });

    it('handles large numbers of scenarios efficiently', () => {
      const manyScenarios = Array.from({ length: 50 }, (_, i) => ({
        id: i.toString(),
        name: `Scenario ${i}`,
        propertyData: mockPropertyData,
        analysis: mockGoodAnalysis,
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        isFavorite: i % 5 === 0 // Every 5th scenario is favorite
      }));

      localStorageMock.getItem.mockReturnValue(JSON.stringify(manyScenarios));

      render(
        <TestWrapper>
          <ScenarioManager
            currentPropertyData={mockPropertyData}
            currentAnalysis={mockGoodAnalysis}
            onLoadScenario={jest.fn()}
          />
        </TestWrapper>
      );

      // Should render without performance issues
      expect(screen.getByText('50 Saved Scenarios')).toBeInTheDocument();
      expect(screen.getByText('10 Favorites')).toBeInTheDocument();
    });
  });
});