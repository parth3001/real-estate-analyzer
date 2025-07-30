/**
 * Race Condition Prevention Tests for SFRAnalysis Main Pipeline
 * 
 * Tests the request ID tracking system implemented to prevent race conditions
 * in the main analysis pipeline and scenario loading.
 * 
 * Implementation Date: 2025-07-28
 */

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import SFRAnalysis from '../SFRAnalysis';
import { propertyApi } from '../../services/api';
import type { SFRPropertyData } from '../../types/property';
import type { Analysis } from '../../types/analysis';

// Mock the propertyApi
vi.mock('../../services/api', () => ({
  propertyApi: {
    analyzeProperty: vi.fn(),
    quickCalculate: vi.fn(),
    getSampleSFR: vi.fn(),
    getProperty: vi.fn(),
    saveProperty: vi.fn(),
    updateProperty: vi.fn()
  }
}));

// Mock react-router-dom hooks
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useLocation: () => ({ search: '' }),
    useSearchParams: () => [new URLSearchParams(), vi.fn()]
  };
});

// Mock AnalysisResults component to avoid complex rendering
vi.mock('../../components/SFRAnalysis/AnalysisResults', () => ({
  default: ({ onParameterChange, onLoadScenario }: any) => (
    <div data-testid="analysis-results">
      <button 
        data-testid="trigger-parameter-change"
        onClick={() => onParameterChange && onParameterChange({
          propertyType: 'SFR',
          purchasePrice: 350000,
          monthlyRent: 2800
        })}
      >
        Trigger Parameter Change
      </button>
      <button
        data-testid="trigger-scenario-load"
        onClick={() => onLoadScenario && onLoadScenario({
          propertyType: 'SFR',
          purchasePrice: 400000,
          monthlyRent: 3000
        })}
      >
        Load Scenario
      </button>
    </div>
  )
}));

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
  maintenanceCost: 3000,
  propertyManagementRate: 10,
  vacancyRate: 5,
  rentalIncreaseRate: 3,
  propertyAppreciationRate: 3,
  inflationRate: 2.5,
  projectionYears: 10,
  closingCosts: 5000,
  repairCosts: 2000,
  capExRate: 1,
  turnoverCost: 1500
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

const renderSFRAnalysis = () => {
  return render(
    <BrowserRouter>
      <SFRAnalysis />
    </BrowserRouter>
  );
};

describe('SFRAnalysis Race Condition Prevention', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    
    // Mock successful analysis response
    (propertyApi.analyzeProperty as any).mockResolvedValue({
      status: 200,
      data: mockAnalysis
    });
    
    // Mock sample data response
    (propertyApi.getSampleSFR as any).mockResolvedValue({
      status: 200,
      data: mockPropertyData
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should generate unique request IDs for main analysis requests', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    // Load sample data first to get into analysis state
    renderSFRAnalysis();
    
    // Wait for sample data to load and trigger analysis
    await act(async () => {
      const sampleButton = await screen.findByText(/Load Sample Data/i);
      sampleButton.click();
    });
    
    await waitFor(() => {
      expect(screen.queryByTestId('analysis-results')).toBeInTheDocument();
    });

    // Clear previous logs
    consoleSpy.mockClear();
    
    // Trigger multiple parameter changes
    const parameterChangeButton = screen.getByTestId('trigger-parameter-change');
    
    await act(async () => {
      parameterChangeButton.click();
    });
    
    await act(async () => {
      parameterChangeButton.click();
    });

    await waitFor(() => {
      expect(propertyApi.analyzeProperty).toHaveBeenCalled();
    });

    // Verify different request IDs were generated
    const logCalls = consoleSpy.mock.calls.filter(call => 
      call[0] && call[0].includes('Starting full analysis') && call[0].includes('analysis-')
    );
    
    expect(logCalls.length).toBeGreaterThan(0);
    
    // If multiple calls, they should have different request IDs
    if (logCalls.length > 1) {
      const requestId1 = logCalls[0][0].match(/\\(([^)]+)\\)/)?.[1];
      const requestId2 = logCalls[1][0].match(/\\(([^)]+)\\)/)?.[1];
      expect(requestId1).not.toEqual(requestId2);
    }

    consoleSpy.mockRestore();
  });

  it('should cancel outdated analysis requests when newer ones are active', async () => {
    let resolveFirstRequest: (value: any) => void;
    let resolveSecondRequest: (value: any) => void;
    
    const firstRequestPromise = new Promise(resolve => {
      resolveFirstRequest = resolve;
    });
    
    const secondRequestPromise = new Promise(resolve => {
      resolveSecondRequest = resolve;
    });

    (propertyApi.analyzeProperty as any)
      .mockReturnValueOnce({ status: 200, data: mockAnalysis }) // Initial load
      .mockReturnValueOnce(firstRequestPromise)  // First parameter change
      .mockReturnValueOnce(secondRequestPromise); // Second parameter change

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    renderSFRAnalysis();
    
    // Load sample data first
    await act(async () => {
      const sampleButton = await screen.findByText(/Load Sample Data/i);
      sampleButton.click();
    });
    
    await waitFor(() => {
      expect(screen.queryByTestId('analysis-results')).toBeInTheDocument();
    });

    const parameterChangeButton = screen.getByTestId('trigger-parameter-change');
    
    // Start first request
    await act(async () => {
      parameterChangeButton.click();
    });
    
    // Start second request immediately
    await act(async () => {
      parameterChangeButton.click();
    });

    // Resolve first request (should be cancelled)
    await act(async () => {
      resolveFirstRequest!({
        status: 200,
        data: mockAnalysis
      });
    });

    // Resolve second request (should succeed)
    await act(async () => {
      resolveSecondRequest!({
        status: 200,
        data: mockAnalysis
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

  it('should handle scenario loading with race condition prevention', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    renderSFRAnalysis();
    
    // Load sample data first
    await act(async () => {
      const sampleButton = await screen.findByText(/Load Sample Data/i);
      sampleButton.click();
    });
    
    await waitFor(() => {
      expect(screen.queryByTestId('analysis-results')).toBeInTheDocument();
    });

    // Clear previous logs
    consoleSpy.mockClear();
    
    // Trigger scenario loading
    const scenarioButton = screen.getByTestId('trigger-scenario-load');
    
    await act(async () => {
      scenarioButton.click();
    });

    await waitFor(() => {
      expect(propertyApi.analyzeProperty).toHaveBeenCalled();
    });

    // Verify scenario request ID was generated
    const logCalls = consoleSpy.mock.calls.filter(call => 
      call[0] && call[0].includes('Loading scenario') && call[0].includes('scenario-')
    );
    
    expect(logCalls.length).toBeGreaterThan(0);

    consoleSpy.mockRestore();
  });

  it('should display request ID in loading indicator during analysis', async () => {
    // Mock slow analysis to see loading state
    let resolveAnalysis: (value: any) => void;
    const analysisPromise = new Promise(resolve => {
      resolveAnalysis = resolve;
    });

    (propertyApi.analyzeProperty as any)
      .mockReturnValueOnce({ status: 200, data: mockAnalysis }) // Initial load
      .mockReturnValueOnce(analysisPromise); // Parameter change

    renderSFRAnalysis();
    
    // Load sample data first
    await act(async () => {
      const sampleButton = await screen.findByText(/Load Sample Data/i);
      sampleButton.click();
    });
    
    await waitFor(() => {
      expect(screen.queryByTestId('analysis-results')).toBeInTheDocument();
    });

    // Trigger parameter change to show loading state
    const parameterChangeButton = screen.getByTestId('trigger-parameter-change');
    
    await act(async () => {
      parameterChangeButton.click();
    });

    // Check for loading indicator with request ID
    await waitFor(() => {
      expect(screen.getByText(/Analyzing your property/i)).toBeInTheDocument();
      expect(screen.getByText(/Request ID:/i)).toBeInTheDocument();
    });

    // Resolve the analysis
    await act(async () => {
      resolveAnalysis!({
        status: 200,
        data: mockAnalysis
      });
    });
  });

  it('should handle analysis errors gracefully without breaking request tracking', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    (propertyApi.analyzeProperty as any)
      .mockReturnValueOnce({ status: 200, data: mockAnalysis }) // Initial load
      .mockRejectedValueOnce(new Error('Analysis failed')); // Parameter change error

    renderSFRAnalysis();
    
    // Load sample data first
    await act(async () => {
      const sampleButton = await screen.findByText(/Load Sample Data/i);
      sampleButton.click();
    });
    
    await waitFor(() => {
      expect(screen.queryByTestId('analysis-results')).toBeInTheDocument();
    });

    // Trigger parameter change that will fail
    const parameterChangeButton = screen.getByTestId('trigger-parameter-change');
    
    await act(async () => {
      parameterChangeButton.click();
    });

    await waitFor(() => {
      expect(propertyApi.analyzeProperty).toHaveBeenCalledTimes(2);
    });

    // Verify error was logged with request ID
    const errorCalls = consoleSpy.mock.calls.filter(call => 
      call[0] && call[0].includes('Error updating parameters') && call[0].includes('analysis-')
    );
    expect(errorCalls.length).toBeGreaterThan(0);
    
    // Component should still be functional
    expect(screen.queryByTestId('analysis-results')).toBeInTheDocument();
    
    consoleSpy.mockRestore();
  });

  it('should use consistent request ID format for analysis requests', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    renderSFRAnalysis();
    
    // Load sample data first
    await act(async () => {
      const sampleButton = await screen.findByText(/Load Sample Data/i);
      sampleButton.click();
    });
    
    await waitFor(() => {
      expect(screen.queryByTestId('analysis-results')).toBeInTheDocument();
    });

    // Clear previous logs
    consoleSpy.mockClear();
    
    // Trigger parameter change
    const parameterChangeButton = screen.getByTestId('trigger-parameter-change');
    
    await act(async () => {
      parameterChangeButton.click();
    });

    await waitFor(() => {
      expect(propertyApi.analyzeProperty).toHaveBeenCalled();
    });

    // Check request ID format: analysis-timestamp-randomString
    const logCalls = consoleSpy.mock.calls.filter(call => 
      call[0] && call[0].includes('Starting full analysis') && call[0].includes('analysis-')
    );
    
    if (logCalls.length > 0) {
      const logMessage = logCalls[0][0];
      const fullMessage = logMessage;
      
      // Should contain 'analysis-' prefix
      expect(fullMessage).toContain('analysis-');
      
      // Should have request ID in parentheses showing last 4 characters
      const requestIdMatch = fullMessage.match(/\\(([^)]+)\\)/);
      expect(requestIdMatch).toBeTruthy();
      
      if (requestIdMatch) {
        const requestIdSuffix = requestIdMatch[1];
        expect(requestIdSuffix).toHaveLength(4);
      }
    }

    consoleSpy.mockRestore();
  });

  it('should properly clear loading states only for active requests', async () => {
    let resolveFirstRequest: (value: any) => void;
    let resolveSecondRequest: (value: any) => void;
    
    const firstRequestPromise = new Promise(resolve => {
      resolveFirstRequest = resolve;
    });
    
    const secondRequestPromise = new Promise(resolve => {
      resolveSecondRequest = resolve;
    });

    (propertyApi.analyzeProperty as any)
      .mockReturnValueOnce({ status: 200, data: mockAnalysis }) // Initial load
      .mockReturnValueOnce(firstRequestPromise)  // First request
      .mockReturnValueOnce(secondRequestPromise); // Second request

    renderSFRAnalysis();
    
    // Load sample data first
    await act(async () => {
      const sampleButton = await screen.findByText(/Load Sample Data/i);
      sampleButton.click();
    });
    
    await waitFor(() => {
      expect(screen.queryByTestId('analysis-results')).toBeInTheDocument();
    });

    const parameterChangeButton = screen.getByTestId('trigger-parameter-change');
    
    // Start first request
    await act(async () => {
      parameterChangeButton.click();
    });
    
    // Verify loading state is active
    expect(screen.getByText(/Analyzing your property/i)).toBeInTheDocument();
    
    // Start second request
    await act(async () => {
      parameterChangeButton.click();
    });

    // Resolve first request (should not clear loading since it's cancelled)
    await act(async () => {
      resolveFirstRequest!({
        status: 200,
        data: mockAnalysis
      });
    });

    // Loading should still be active (because second request is still pending)
    expect(screen.getByText(/Analyzing your property/i)).toBeInTheDocument();

    // Resolve second request (should clear loading)
    await act(async () => {
      resolveSecondRequest!({
        status: 200,
        data: mockAnalysis
      });
    });

    // Loading should now be cleared
    await waitFor(() => {
      expect(screen.queryByText(/Analyzing your property/i)).not.toBeInTheDocument();
    });
  });
});