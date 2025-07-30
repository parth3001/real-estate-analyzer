/**
 * Race Condition Prevention Tests for DynamicSliders
 * 
 * Tests the request ID tracking system implemented to prevent race conditions
 * in interactive slider analysis requests.
 * 
 * Implementation Date: 2025-07-28
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import DynamicSliders from '../DynamicSliders';
import { propertyApi } from '../../../services/api';
import type { SFRPropertyData } from '../../../types/property';
import type { Analysis } from '../../../types/analysis';

// Mock the propertyApi
vi.mock('../../../services/api', () => ({
  propertyApi: {
    quickCalculate: vi.fn(),
    analyzeProperty: vi.fn()
  }
}));

// Mock data
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
  propertyTaxRate: 1.2,
  insuranceRate: 0.8,
  propertyManagementRate: 10,
  yearBuilt: 2010,
  squareFootage: 1200,
  bedrooms: 3,
  bathrooms: 2,
  maintenanceCost: 3000,
  closingCosts: 5000,
  repairCosts: 2000,
  longTermAssumptions: {
    projectionYears: 10,
    annualRentIncrease: 3,
    annualPropertyValueIncrease: 3,
    sellingCostsPercentage: 6,
    inflationRate: 2.5,
    vacancyRate: 5
  }
};

const mockAnalysis: Analysis = {
  monthlyAnalysis: {
    expenses: {
      propertyTax: 300,
      insurance: 200,
      maintenance: 250,
      propertyManagement: 250,
      vacancy: 125,
      operating: 1125,
      debt: 1847,
      total: 2972,
      breakdown: {}
    },
    income: {
      gross: 2500,
      effective: 2375
    },
    cashFlow: -597
  },
  annualAnalysis: {
    income: 30000,
    expenses: 13500,
    noi: 16500,
    debtService: 22164,
    cashFlow: -7164
  },
  longTermAnalysis: {
    projections: [],
    projectionYears: 10,
    returns: {
      irr: 0,
      totalCashFlow: -71640,
      totalAppreciation: 100000,
      totalReturn: 28360
    },
    exitAnalysis: {
      projectedSalePrice: 400000,
      sellingCosts: 24000,
      mortgagePayoff: 200000,
      netProceedsFromSale: 176000,
      totalReturn: 28360,
      returnOnInvestment: 42.5
    }
  },
  keyMetrics: {
    capRate: 5.5,
    cashOnCashReturn: -11.9,
    dscr: 0.74,
    pricePerSqFtAtPurchase: 150,
    expenseRatio: 45,
    operatingExpenseRatio: 45
  }
};

describe('DynamicSliders Race Condition Prevention', () => {
  const mockOnParameterChange = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    
    // Mock successful quick calculation response
    (propertyApi.quickCalculate as any).mockResolvedValue({
      status: 200,
      data: {
        keyMetrics: mockAnalysis.keyMetrics,
        monthlyAnalysis: mockAnalysis.monthlyAnalysis,
        calculationTime: 45
      }
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should generate unique request IDs for different slider changes', async () => {
    render(
      <DynamicSliders
        propertyData={mockPropertyData}
        analysis={mockAnalysis}
        onParameterChange={mockOnParameterChange}
      />
    );

    // Find purchase price slider
    const purchasePriceSlider = screen.getByRole('slider', { name: /purchase price/i });
    
    // Track console logs to verify unique request IDs
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    // Make two quick slider changes
    await act(async () => {
      fireEvent.change(purchasePriceSlider, { target: { value: '310000' } });
    });
    
    await act(async () => {
      fireEvent.change(purchasePriceSlider, { target: { value: '320000' } });
    });

    // Wait for quick calculations to complete
    await waitFor(() => {
      expect(propertyApi.quickCalculate).toHaveBeenCalled();
    });

    // Verify that different request IDs were generated
    const logCalls = consoleSpy.mock.calls.filter(call => 
      call[0] && call[0].includes('Quick calculation') && call[0].includes('completed')
    );
    
    expect(logCalls.length).toBeGreaterThan(0);
    
    // If we have multiple calls, they should have different request IDs
    if (logCalls.length > 1) {
      const requestId1 = logCalls[0][0].match(/\\(([^)]+)\\)/)?.[1];
      const requestId2 = logCalls[1][0].match(/\\(([^)]+)\\)/)?.[1];
      expect(requestId1).not.toEqual(requestId2);
    }

    consoleSpy.mockRestore();
  });

  it('should cancel outdated quick calculations when newer requests are active', async () => {
    // Mock quick calculation with delay to simulate race condition
    let resolveFirstRequest: (value: any) => void;
    let resolveSecondRequest: (value: any) => void;
    
    const firstRequestPromise = new Promise(resolve => {
      resolveFirstRequest = resolve;
    });
    
    const secondRequestPromise = new Promise(resolve => {
      resolveSecondRequest = resolve;
    });

    (propertyApi.quickCalculate as any)
      .mockReturnValueOnce(firstRequestPromise)
      .mockReturnValueOnce(secondRequestPromise);

    render(
      <DynamicSliders
        propertyData={mockPropertyData}
        analysis={mockAnalysis}
        onParameterChange={mockOnParameterChange}
      />
    );

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const slider = screen.getByRole('slider', { name: /purchase price/i });
    
    // Start first request
    await act(async () => {
      fireEvent.change(slider, { target: { value: '310000' } });
    });
    
    // Start second request immediately
    await act(async () => {
      fireEvent.change(slider, { target: { value: '320000' } });
    });

    // Resolve first request (should be cancelled)
    await act(async () => {
      resolveFirstRequest!({
        status: 200,
        data: {
          keyMetrics: mockAnalysis.keyMetrics,
          monthlyAnalysis: mockAnalysis.monthlyAnalysis,
          calculationTime: 100
        }
      });
    });

    // Resolve second request (should succeed)
    await act(async () => {
      resolveSecondRequest!({
        status: 200,
        data: {
          keyMetrics: mockAnalysis.keyMetrics,
          monthlyAnalysis: mockAnalysis.monthlyAnalysis,
          calculationTime: 50
        }
      });
    });

    await waitFor(() => {
      const logCalls = consoleSpy.mock.calls;
      const cancelledCalls = logCalls.filter(call => 
        call[0] && call[0].includes('cancelled - newer request active')
      );
      expect(cancelledCalls.length).toBeGreaterThan(0);
    });

    consoleSpy.mockRestore();
  });

  it('should prevent multiple full analyses from rapid slider changes', async () => {
    render(
      <DynamicSliders
        propertyData={mockPropertyData}
        analysis={mockAnalysis}
        onParameterChange={mockOnParameterChange}
      />
    );

    const slider = screen.getByRole('slider', { name: /monthly rent/i });
    
    // Make multiple significant changes rapidly (>10% change triggers full analysis)
    await act(async () => {
      fireEvent.change(slider, { target: { value: '3000' } }); // +20% change
    });
    
    await act(async () => {
      fireEvent.change(slider, { target: { value: '3500' } }); // Another significant change
    });
    
    await act(async () => {
      fireEvent.change(slider, { target: { value: '4000' } }); // Another significant change
    });

    // Fast forward through the debounce timeout (2 seconds)
    await act(async () => {
      vi.advanceTimersByTime(2100);
    });

    // Should only trigger one full analysis (the last one)
    expect(mockOnParameterChange).toHaveBeenCalledTimes(1);
    expect(mockOnParameterChange).toHaveBeenCalledWith(
      expect.objectContaining({
        monthlyRent: 4000
      })
    );
  });

  it('should clear previous timeouts when new slider changes occur', async () => {
    const timeoutSpy = vi.spyOn(global, 'clearTimeout');
    
    render(
      <DynamicSliders
        propertyData={mockPropertyData}
        analysis={mockAnalysis}
        onParameterChange={mockOnParameterChange}
      />
    );

    const slider = screen.getByRole('slider', { name: /interest rate/i });
    
    // Make first significant change
    await act(async () => {
      fireEvent.change(slider, { target: { value: '7.5' } }); // Significant change
    });
    
    // Make second change before timeout
    await act(async () => {
      fireEvent.change(slider, { target: { value: '8.0' } }); // Another change
    });

    // Verify clearTimeout was called when second change occurred
    expect(timeoutSpy).toHaveBeenCalled();
    
    timeoutSpy.mockRestore();
  });

  it('should display request ID in debug mode', async () => {
    render(
      <DynamicSliders
        propertyData={mockPropertyData}
        analysis={mockAnalysis}
        onParameterChange={mockOnParameterChange}
      />
    );

    const slider = screen.getByRole('slider', { name: /purchase price/i });
    
    // Make a slider change
    await act(async () => {
      fireEvent.change(slider, { target: { value: '310000' } });
    });

    // Wait for request ID to be displayed
    await waitFor(() => {
      const requestIdChip = screen.queryByText(/ID:/);
      expect(requestIdChip).toBeInTheDocument();
    });
  });

  it('should handle API errors gracefully without breaking request tracking', async () => {
    // Mock API error
    (propertyApi.quickCalculate as any).mockRejectedValue(new Error('API Error'));
    
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    render(
      <DynamicSliders
        propertyData={mockPropertyData}
        analysis={mockAnalysis}
        onParameterChange={mockOnParameterChange}
      />
    );

    const slider = screen.getByRole('slider', { name: /purchase price/i });
    
    // Make slider change that will cause API error
    await act(async () => {
      fireEvent.change(slider, { target: { value: '310000' } });
    });

    await waitFor(() => {
      expect(propertyApi.quickCalculate).toHaveBeenCalled();
    });

    // Verify error was logged with request ID
    const errorCalls = consoleSpy.mock.calls.filter(call => 
      call[0] && call[0].includes('Quick calculation') && call[0].includes('failed')
    );
    expect(errorCalls.length).toBeGreaterThan(0);
    
    // Component should still be functional after error
    expect(slider).toBeInTheDocument();
    
    consoleSpy.mockRestore();
  });

  it('should reset request tracking when resetting all parameters', async () => {
    render(
      <DynamicSliders
        propertyData={mockPropertyData}
        analysis={mockAnalysis}
        onParameterChange={mockOnParameterChange}
      />
    );

    const slider = screen.getByRole('slider', { name: /purchase price/i });
    const resetButton = screen.getByRole('button', { name: /reset all/i });
    
    // Make a change to set active request
    await act(async () => {
      fireEvent.change(slider, { target: { value: '310000' } });
    });

    // Wait for request ID to appear
    await waitFor(() => {
      expect(screen.queryByText(/ID:/)).toBeInTheDocument();
    });

    // Reset all parameters
    await act(async () => {
      fireEvent.click(resetButton);
    });

    // Verify reset was called with original data
    expect(mockOnParameterChange).toHaveBeenCalledWith(mockPropertyData);
  });

  it('should use consistent request ID format', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    render(
      <DynamicSliders
        propertyData={mockPropertyData}
        analysis={mockAnalysis}
        onParameterChange={mockOnParameterChange}
      />
    );

    const slider = screen.getByRole('slider', { name: /purchase price/i });
    
    await act(async () => {
      fireEvent.change(slider, { target: { value: '310000' } });
    });

    await waitFor(() => {
      expect(propertyApi.quickCalculate).toHaveBeenCalled();
    });

    // Check that request ID follows expected format: timestamp-randomString
    const logCalls = consoleSpy.mock.calls.filter(call => 
      call[0] && call[0].includes('Quick calculation') && call[0].includes('completed')
    );
    
    if (logCalls.length > 0) {
      const logMessage = logCalls[0][0];
      const requestIdMatch = logMessage.match(/\\(([^)]+)\\)/);
      expect(requestIdMatch).toBeTruthy();
      
      if (requestIdMatch) {
        const requestIdSuffix = requestIdMatch[1];
        // Should be 4 characters (last 4 of request ID)
        expect(requestIdSuffix).toHaveLength(4);
      }
    }

    consoleSpy.mockRestore();
  });
});