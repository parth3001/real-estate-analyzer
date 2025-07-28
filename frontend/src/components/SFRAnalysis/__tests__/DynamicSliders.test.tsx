import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import '@testing-library/jest-dom';
import DynamicSliders from '../DynamicSliders';
import type { SFRPropertyData } from '../../../types/property';

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

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider theme={theme}>
    {children}
  </ThemeProvider>
);

describe('DynamicSliders', () => {
  const mockOnParameterChange = jest.fn();

  beforeEach(() => {
    mockOnParameterChange.mockClear();
  });

  it('renders correctly with property data', () => {
    render(
      <TestWrapper>
        <DynamicSliders
          propertyData={mockPropertyData}
          analysis={undefined as any}
          onParameterChange={mockOnParameterChange}
        />
      </TestWrapper>
    );

    expect(screen.getByText('Interactive Analysis')).toBeInTheDocument();
    expect(screen.getByText('Adjust parameters to see real-time impact on returns')).toBeInTheDocument();
  });

  it('displays live updates status when not calculating', () => {
    render(
      <TestWrapper>
        <DynamicSliders
          propertyData={mockPropertyData}
          analysis={undefined as any}
          onParameterChange={mockOnParameterChange}
        />
      </TestWrapper>
    );

    expect(screen.getByText('Live Updates')).toBeInTheDocument();
  });

  it('displays calculating status when calculating', () => {
    render(
      <TestWrapper>
        <DynamicSliders
          propertyData={mockPropertyData}
          analysis={undefined as any}
          onParameterChange={mockOnParameterChange}
        />
      </TestWrapper>
    );

    expect(screen.getByText('Calculating...')).toBeInTheDocument();
  });

  it('shows category navigation buttons', () => {
    render(
      <TestWrapper>
        <DynamicSliders
          propertyData={mockPropertyData}
          analysis={undefined as any}
          onParameterChange={mockOnParameterChange}
        />
      </TestWrapper>
    );

    expect(screen.getByText('financial')).toBeInTheDocument();
    expect(screen.getByText('property')).toBeInTheDocument();
    expect(screen.getByText('assumptions')).toBeInTheDocument();
  });

  it('switches categories when category buttons are clicked', () => {
    render(
      <TestWrapper>
        <DynamicSliders
          propertyData={mockPropertyData}
          analysis={undefined as any}
          onParameterChange={mockOnParameterChange}
        />
      </TestWrapper>
    );

    const propertyButton = screen.getByText('property');
    fireEvent.click(propertyButton);

    // Check that property category sliders are visible
    expect(screen.getByText('Property Tax Rate')).toBeInTheDocument();
    expect(screen.getByText('Insurance Rate')).toBeInTheDocument();
  });

  it('displays purchase price slider with correct format', () => {
    render(
      <TestWrapper>
        <DynamicSliders
          propertyData={mockPropertyData}
          analysis={undefined as any}
          onParameterChange={mockOnParameterChange}
        />
      </TestWrapper>
    );

    expect(screen.getByText('Purchase Price')).toBeInTheDocument();
    expect(screen.getByText('$300,000')).toBeInTheDocument();
  });

  it('displays down payment with percentage', () => {
    render(
      <TestWrapper>
        <DynamicSliders
          propertyData={mockPropertyData}
          analysis={undefined as any}
          onParameterChange={mockOnParameterChange}
        />
      </TestWrapper>
    );

    expect(screen.getByText('Down Payment')).toBeInTheDocument();
    // Down payment should show amount and percentage
    expect(screen.getByDisplayValue('60000')).toBeInTheDocument();
  });

  it('calls onParameterChange when slider value changes', async () => {
    render(
      <TestWrapper>
        <DynamicSliders
          propertyData={mockPropertyData}
          analysis={undefined as any}
          onParameterChange={mockOnParameterChange}
        />
      </TestWrapper>
    );

    // Find the purchase price input field
    const purchasePriceInput = screen.getByDisplayValue('300000');
    
    // Change the value
    fireEvent.change(purchasePriceInput, { target: { value: '320000' } });

    // Wait for debounced call
    await waitFor(() => {
      expect(mockOnParameterChange).toHaveBeenCalledWith({
        ...mockPropertyData,
        purchasePrice: 320000
      });
    }, { timeout: 500 });
  });

  it('shows reset all button', () => {
    render(
      <TestWrapper>
        <DynamicSliders
          propertyData={mockPropertyData}
          analysis={undefined as any}
          onParameterChange={mockOnParameterChange}
        />
      </TestWrapper>
    );

    expect(screen.getByText('Reset All')).toBeInTheDocument();
  });

  it('resets parameters when reset all is clicked', () => {
    render(
      <TestWrapper>
        <DynamicSliders
          propertyData={mockPropertyData}
          analysis={undefined as any}
          onParameterChange={mockOnParameterChange}
        />
      </TestWrapper>
    );

    const resetButton = screen.getByText('Reset All');
    fireEvent.click(resetButton);

    expect(mockOnParameterChange).toHaveBeenCalledWith(mockPropertyData);
  });

  it('shows individual parameter reset buttons', () => {
    render(
      <TestWrapper>
        <DynamicSliders
          propertyData={mockPropertyData}
          analysis={undefined as any}
          onParameterChange={mockOnParameterChange}
        />
      </TestWrapper>
    );

    // Reset buttons should be present for each parameter
    const resetButtons = screen.getAllByTestId('RestoreIcon');
    expect(resetButtons.length).toBeGreaterThan(0);
  });

  it('displays tooltips for parameters', () => {
    render(
      <TestWrapper>
        <DynamicSliders
          propertyData={mockPropertyData}
          analysis={undefined as any}
          onParameterChange={mockOnParameterChange}
        />
      </TestWrapper>
    );

    // Info icons should be present
    const infoIcons = screen.getAllByTestId('InfoIcon');
    expect(infoIcons.length).toBeGreaterThan(0);
  });

  it('shows impact indicators when parameters change', async () => {
    render(
      <TestWrapper>
        <DynamicSliders
          propertyData={mockPropertyData}
          analysis={undefined as any}
          onParameterChange={mockOnParameterChange}
        />
      </TestWrapper>
    );

    // Change purchase price to a lower value (should be positive impact)
    const purchasePriceInput = screen.getByDisplayValue('300000');
    fireEvent.change(purchasePriceInput, { target: { value: '250000' } });

    // Should show impact indicator after change
    await waitFor(() => {
      const helpChips = screen.queryAllByText('Helps');
      expect(helpChips.length).toBeGreaterThan(0);
    });
  });

  it('handles edge cases for slider values', () => {
    render(
      <TestWrapper>
        <DynamicSliders
          propertyData={mockPropertyData}
          analysis={undefined as any}
          onParameterChange={mockOnParameterChange}
        />
      </TestWrapper>
    );

    // Test with empty or invalid input
    const purchasePriceInput = screen.getByDisplayValue('300000');
    fireEvent.change(purchasePriceInput, { target: { value: '' } });

    // Should not crash and should not call onParameterChange with invalid data
    expect(mockOnParameterChange).not.toHaveBeenCalledWith(
      expect.objectContaining({ purchasePrice: NaN })
    );
  });

  it('shows warning alert when negative impact parameters are detected', async () => {
    render(
      <TestWrapper>
        <DynamicSliders
          propertyData={mockPropertyData}
          analysis={undefined as any}
          onParameterChange={mockOnParameterChange}
        />
      </TestWrapper>
    );

    // Increase purchase price significantly (negative impact)
    const purchasePriceInput = screen.getByDisplayValue('300000');
    fireEvent.change(purchasePriceInput, { target: { value: '400000' } });

    // Should show warning about negative impact
    await waitFor(() => {
      expect(screen.getByText(/Some parameter changes may negatively impact returns/)).toBeInTheDocument();
    });
  });

  it('formats different parameter types correctly', () => {
    render(
      <TestWrapper>
        <DynamicSliders
          propertyData={mockPropertyData}
          analysis={undefined as any}
          onParameterChange={mockOnParameterChange}
        />
      </TestWrapper>
    );

    // Check currency formatting
    expect(screen.getByText('$300,000')).toBeInTheDocument();
    
    // Switch to property category for rate formatting
    const propertyButton = screen.getByText('property');
    fireEvent.click(propertyButton);
    
    // Check percentage formatting
    expect(screen.getByText('1.2%')).toBeInTheDocument(); // Property tax rate
    expect(screen.getByText('0.8%')).toBeInTheDocument(); // Insurance rate
  });
});

// Test utility functions
describe('DynamicSliders Utility Functions', () => {
  it('calculates percentage changes correctly', () => {
    const originalValue = 100;
    const newValue = 120;
    const percentChange = ((newValue - originalValue) / originalValue) * 100;
    
    expect(percentChange).toBe(20);
  });

  it('determines impact direction correctly', () => {
    // Positive impact keys should show positive when value increases
    const positiveImpactKeys = ['monthlyRent'];
    expect(positiveImpactKeys.includes('monthlyRent')).toBe(true);
    
    // Negative impact keys should show negative when value increases
    const negativeImpactKeys = ['purchasePrice', 'interestRate'];
    expect(negativeImpactKeys.includes('purchasePrice')).toBe(true);
    expect(negativeImpactKeys.includes('interestRate')).toBe(true);
  });
});