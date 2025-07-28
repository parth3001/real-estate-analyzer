import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import '@testing-library/jest-dom';
import ScenarioManager from '../ScenarioManager';
import type { SFRPropertyData } from '../../../types/property';
import type { Analysis } from '../../../types/analysis';

const theme = createTheme();

const mockPropertyData: SFRPropertyData = {
  propertyType: 'SFR',
  propertyName: 'Test Property',
  propertyAddress: {
    street: '123 Test St',
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

const mockAnalysis: Analysis = {
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

describe('ScenarioManager', () => {
  const mockOnLoadScenario = jest.fn();

  beforeEach(() => {
    mockOnLoadScenario.mockClear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
    localStorageMock.clear.mockClear();
  });

  it('renders correctly with no saved scenarios', () => {
    localStorageMock.getItem.mockReturnValue(null);

    render(
      <TestWrapper>
        <ScenarioManager
          currentPropertyData={mockPropertyData}
          currentAnalysis={mockAnalysis}
          onLoadScenario={mockOnLoadScenario}
        />
      </TestWrapper>
    );

    expect(screen.getByText('Scenario Management')).toBeInTheDocument();
    expect(screen.getByText('Save, compare, and analyze different property scenarios')).toBeInTheDocument();
    expect(screen.getByText('No saved scenarios yet. Save your current analysis to start building your scenario library.')).toBeInTheDocument();
  });

  it('shows save current button', () => {
    localStorageMock.getItem.mockReturnValue(null);

    render(
      <TestWrapper>
        <ScenarioManager
          currentPropertyData={mockPropertyData}
          currentAnalysis={mockAnalysis}
          onLoadScenario={mockOnLoadScenario}
        />
      </TestWrapper>
    );

    expect(screen.getByText('Save Current')).toBeInTheDocument();
  });

  it('opens save dialog when save current is clicked', () => {
    localStorageMock.getItem.mockReturnValue(null);

    render(
      <TestWrapper>
        <ScenarioManager
          currentPropertyData={mockPropertyData}
          currentAnalysis={mockAnalysis}
          onLoadScenario={mockOnLoadScenario}
        />
      </TestWrapper>
    );

    const saveButton = screen.getByText('Save Current');
    fireEvent.click(saveButton);

    expect(screen.getByText('Save Current Scenario')).toBeInTheDocument();
    expect(screen.getByLabelText('Scenario Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Description (Optional)')).toBeInTheDocument();
  });

  it('saves scenario when form is submitted', async () => {
    localStorageMock.getItem.mockReturnValue(null);

    render(
      <TestWrapper>
        <ScenarioManager
          currentPropertyData={mockPropertyData}
          currentAnalysis={mockAnalysis}
          onLoadScenario={mockOnLoadScenario}
        />
      </TestWrapper>
    );

    // Open save dialog
    const saveButton = screen.getByText('Save Current');
    fireEvent.click(saveButton);

    // Fill in scenario name
    const nameInput = screen.getByLabelText('Scenario Name');
    fireEvent.change(nameInput, { target: { value: 'Test Scenario' } });

    // Fill in description
    const descriptionInput = screen.getByLabelText('Description (Optional)');
    fireEvent.change(descriptionInput, { target: { value: 'Test description' } });

    // Submit
    const saveScenarioButton = screen.getByRole('button', { name: 'Save Scenario' });
    fireEvent.click(saveScenarioButton);

    // Should call localStorage.setItem
    await waitFor(() => {
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'propertyScenarios',
        expect.stringContaining('Test Scenario')
      );
    });
  });

  it('loads existing scenarios from localStorage', () => {
    const savedScenarios = [{
      id: '1',
      name: 'Existing Scenario',
      propertyData: mockPropertyData,
      analysis: mockAnalysis,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      isFavorite: false
    }];

    localStorageMock.getItem.mockReturnValue(JSON.stringify(savedScenarios));

    render(
      <TestWrapper>
        <ScenarioManager
          currentPropertyData={mockPropertyData}
          currentAnalysis={mockAnalysis}
          onLoadScenario={mockOnLoadScenario}
        />
      </TestWrapper>
    );

    expect(screen.getByText('Existing Scenario')).toBeInTheDocument();
    expect(screen.getByText('1 Saved Scenarios')).toBeInTheDocument();
  });

  it('displays scenario metrics correctly', () => {
    const savedScenarios = [{
      id: '1',
      name: 'Test Scenario',
      propertyData: mockPropertyData,
      analysis: mockAnalysis,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      isFavorite: false
    }];

    localStorageMock.getItem.mockReturnValue(JSON.stringify(savedScenarios));

    render(
      <TestWrapper>
        <ScenarioManager
          currentPropertyData={mockPropertyData}
          currentAnalysis={mockAnalysis}
          onLoadScenario={mockOnLoadScenario}
        />
      </TestWrapper>
    );

    expect(screen.getByText('Cash Flow: $175/mo')).toBeInTheDocument();
    expect(screen.getByText('CoC: 8.8%')).toBeInTheDocument();
    expect(screen.getByText('Score: 72/100')).toBeInTheDocument();
  });

  it('allows selecting scenarios for comparison', () => {
    const savedScenarios = [
      {
        id: '1',
        name: 'Scenario 1',
        propertyData: mockPropertyData,
        analysis: mockAnalysis,
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        isFavorite: false
      },
      {
        id: '2',
        name: 'Scenario 2',
        propertyData: { ...mockPropertyData, purchasePrice: 350000 },
        analysis: { ...mockAnalysis, monthlyAnalysis: { ...mockAnalysis.monthlyAnalysis, cashFlow: 100 } },
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        isFavorite: false
      }
    ];

    localStorageMock.getItem.mockReturnValue(JSON.stringify(savedScenarios));

    render(
      <TestWrapper>
        <ScenarioManager
          currentPropertyData={mockPropertyData}
          currentAnalysis={mockAnalysis}
          onLoadScenario={mockOnLoadScenario}
        />
      </TestWrapper>
    );

    // Click on first scenario to select it
    const firstScenario = screen.getByText('Scenario 1');
    fireEvent.click(firstScenario);

    // Should show 1 selected
    expect(screen.getByText('1 Selected')).toBeInTheDocument();
  });

  it('shows compare button when multiple scenarios are selected', () => {
    const savedScenarios = [
      {
        id: '1',
        name: 'Scenario 1',
        propertyData: mockPropertyData,
        analysis: mockAnalysis,
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        isFavorite: false
      },
      {
        id: '2',
        name: 'Scenario 2',
        propertyData: mockPropertyData,
        analysis: mockAnalysis,
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        isFavorite: false
      }
    ];

    localStorageMock.getItem.mockReturnValue(JSON.stringify(savedScenarios));

    render(
      <TestWrapper>
        <ScenarioManager
          currentPropertyData={mockPropertyData}
          currentAnalysis={mockAnalysis}
          onLoadScenario={mockOnLoadScenario}
        />
      </TestWrapper>
    );

    // Select both scenarios
    fireEvent.click(screen.getByText('Scenario 1'));
    fireEvent.click(screen.getByText('Scenario 2'));

    // Should show compare button
    expect(screen.getByText('Compare (2)')).toBeInTheDocument();
  });

  it('opens comparison view when compare button is clicked', async () => {
    const savedScenarios = [
      {
        id: '1',
        name: 'Scenario 1',
        propertyData: mockPropertyData,
        analysis: mockAnalysis,
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        isFavorite: false
      },
      {
        id: '2',
        name: 'Scenario 2',
        propertyData: mockPropertyData,
        analysis: mockAnalysis,
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        isFavorite: false
      }
    ];

    localStorageMock.getItem.mockReturnValue(JSON.stringify(savedScenarios));

    render(
      <TestWrapper>
        <ScenarioManager
          currentPropertyData={mockPropertyData}
          currentAnalysis={mockAnalysis}
          onLoadScenario={mockOnLoadScenario}
        />
      </TestWrapper>
    );

    // Select both scenarios
    fireEvent.click(screen.getByText('Scenario 1'));
    fireEvent.click(screen.getByText('Scenario 2'));

    // Click compare button
    const compareButton = screen.getByText('Compare (2)');
    fireEvent.click(compareButton);

    // Should open comparison dialog
    await waitFor(() => {
      expect(screen.getByText('Scenario Comparison')).toBeInTheDocument();
    });
  });

  it('shows favorite status correctly', () => {
    const savedScenarios = [{
      id: '1',
      name: 'Favorite Scenario',
      propertyData: mockPropertyData,
      analysis: mockAnalysis,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      isFavorite: true
    }];

    localStorageMock.getItem.mockReturnValue(JSON.stringify(savedScenarios));

    render(
      <TestWrapper>
        <ScenarioManager
          currentPropertyData={mockPropertyData}
          currentAnalysis={mockAnalysis}
          onLoadScenario={mockOnLoadScenario}
        />
      </TestWrapper>
    );

    expect(screen.getByText('1 Favorites')).toBeInTheDocument();
  });

  it('calls onLoadScenario when scenario is loaded', async () => {
    const savedScenarios = [{
      id: '1',
      name: 'Test Scenario',
      propertyData: mockPropertyData,
      analysis: mockAnalysis,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      isFavorite: false
    }];

    localStorageMock.getItem.mockReturnValue(JSON.stringify(savedScenarios));

    render(
      <TestWrapper>
        <ScenarioManager
          currentPropertyData={mockPropertyData}
          currentAnalysis={mockAnalysis}
          onLoadScenario={mockOnLoadScenario}
        />
      </TestWrapper>
    );

    // Click load button (edit icon)
    const loadButton = screen.getByTestId('EditIcon');
    fireEvent.click(loadButton);

    await waitFor(() => {
      expect(mockOnLoadScenario).toHaveBeenCalledWith(mockPropertyData);
    });
  });

  it('shows export button when scenarios are selected', () => {
    const savedScenarios = [{
      id: '1',
      name: 'Test Scenario',
      propertyData: mockPropertyData,
      analysis: mockAnalysis,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      isFavorite: false
    }];

    localStorageMock.getItem.mockReturnValue(JSON.stringify(savedScenarios));

    render(
      <TestWrapper>
        <ScenarioManager
          currentPropertyData={mockPropertyData}
          currentAnalysis={mockAnalysis}
          onLoadScenario={mockOnLoadScenario}
        />
      </TestWrapper>
    );

    // Select scenario
    fireEvent.click(screen.getByText('Test Scenario'));

    // Should show export button
    expect(screen.getByText('Export Selected Scenarios')).toBeInTheDocument();
  });

  it('prevents saving scenario without name', () => {
    localStorageMock.getItem.mockReturnValue(null);

    render(
      <TestWrapper>
        <ScenarioManager
          currentPropertyData={mockPropertyData}
          currentAnalysis={mockAnalysis}
          onLoadScenario={mockOnLoadScenario}
        />
      </TestWrapper>
    );

    // Open save dialog
    const saveButton = screen.getByText('Save Current');
    fireEvent.click(saveButton);

    // Save button should be disabled without name
    const saveScenarioButton = screen.getByRole('button', { name: 'Save Scenario' });
    expect(saveScenarioButton).toBeDisabled();
  });

  it('enables save button when name is provided', () => {
    localStorageMock.getItem.mockReturnValue(null);

    render(
      <TestWrapper>
        <ScenarioManager
          currentPropertyData={mockPropertyData}
          currentAnalysis={mockAnalysis}
          onLoadScenario={mockOnLoadScenario}
        />
      </TestWrapper>
    );

    // Open save dialog
    const saveButton = screen.getByText('Save Current');
    fireEvent.click(saveButton);

    // Fill in scenario name
    const nameInput = screen.getByLabelText('Scenario Name');
    fireEvent.change(nameInput, { target: { value: 'Test Scenario' } });

    // Save button should now be enabled
    const saveScenarioButton = screen.getByRole('button', { name: 'Save Scenario' });
    expect(saveScenarioButton).not.toBeDisabled();
  });

  it('handles localStorage errors gracefully', () => {
    localStorageMock.getItem.mockImplementation(() => {
      throw new Error('Storage error');
    });

    // Should not crash
    render(
      <TestWrapper>
        <ScenarioManager
          currentPropertyData={mockPropertyData}
          currentAnalysis={mockAnalysis}
          onLoadScenario={mockOnLoadScenario}
        />
      </TestWrapper>
    );

    expect(screen.getByText('Scenario Management')).toBeInTheDocument();
  });

  it('shows comparison metrics in comparison view', async () => {
    const savedScenarios = [
      {
        id: '1',
        name: 'Scenario 1',
        propertyData: mockPropertyData,
        analysis: mockAnalysis,
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        isFavorite: false
      },
      {
        id: '2',
        name: 'Scenario 2',
        propertyData: mockPropertyData,
        analysis: { ...mockAnalysis, monthlyAnalysis: { ...mockAnalysis.monthlyAnalysis, cashFlow: 200 } },
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        isFavorite: false
      }
    ];

    localStorageMock.getItem.mockReturnValue(JSON.stringify(savedScenarios));

    render(
      <TestWrapper>
        <ScenarioManager
          currentPropertyData={mockPropertyData}
          currentAnalysis={mockAnalysis}
          onLoadScenario={mockOnLoadScenario}
        />
      </TestWrapper>
    );

    // Select both scenarios and open comparison
    fireEvent.click(screen.getByText('Scenario 1'));
    fireEvent.click(screen.getByText('Scenario 2'));
    fireEvent.click(screen.getByText('Compare (2)'));

    // Should show comparison metrics
    await waitFor(() => {
      expect(screen.getByText('Monthly Cash Flow')).toBeInTheDocument();
      expect(screen.getByText('Cash-on-Cash Return')).toBeInTheDocument();
      expect(screen.getByText('Cap Rate')).toBeInTheDocument();
      expect(screen.getByText('DSCR')).toBeInTheDocument();
      expect(screen.getByText('AI Investment Score')).toBeInTheDocument();
    });
  });
});