import { render, screen, fireEvent } from '@testing-library/react';
import AnalysisResults from '../AnalysisResults';
import { AnalysisResult, SFRMetrics } from '../../../types/analysis';

// Mock data following actual type definitions
const mockAnalysis: AnalysisResult<SFRMetrics> = {
  monthlyAnalysis: {
    income: {
      gross: 5000,
      effective: 4750
    },
    expenses: {
      operating: 2000,
      debt: 1500,
      total: 3500,
      breakdown: {
        propertyTax: 500,
        insurance: 200,
        maintenance: 300,
        propertyManagement: 400,
        vacancy: 250,
        utilities: 150,
        commonAreaElectricity: 100,
        landscaping: 50,
        waterSewer: 75,
        garbage: 25,
        marketingAndAdvertising: 50,
        repairsAndMaintenance: 200,
        capEx: 100,
        other: 0
      }
    },
    cashFlow: 1250
  },
  annualAnalysis: {
    income: 60000,
    expenses: 42000,
    noi: 18000,
    debtService: 18000,
    cashFlow: 15000
  },
  metrics: {
    pricePerSqFt: 200,
    rentPerSqFt: 1.5,
    grossRentMultiplier: 8.5,
    noi: 12000,
    capRate: 6.2,
    cashOnCashReturn: 8.5,
    irr: 12.5,
    dscr: 1.2,
    operatingExpenseRatio: 0.6
  },
  projections: [],
  exitAnalysis: {
    projectedSalePrice: 500000,
    sellingCosts: 30000,
    mortgagePayoff: 300000,
    netProceedsFromSale: 170000,
    totalReturn: 200000
  },
  aiInsights: {
    summary: 'This property shows strong investment potential with good cash flow and appreciation opportunities.',
    strengths: [
      'Strong cash flow potential',
      'Good location in growing area',
      'Below market purchase price'
    ],
    weaknesses: [
      'Older property requiring maintenance',
      'Higher than average vacancy rate',
      'Limited parking options'
    ],
    recommendations: [
      'Consider value-add improvements',
      'Implement proactive maintenance plan',
      'Explore parking expansion options'
    ],
    investmentScore: 75
  }
};

const incompleteAnalysis: AnalysisResult<SFRMetrics> = {
  monthlyAnalysis: {
    income: {
      gross: 2500,
      effective: 2375
    },
    expenses: {
      operating: 500,
      debt: 1000,
      total: 1500,
      breakdown: {
        propertyTax: 200,
        insurance: 100,
        maintenance: 150,
        propertyManagement: 160,
        vacancy: 100,
        utilities: 50,
        commonAreaElectricity: 0,
        landscaping: 0,
        waterSewer: 0,
        garbage: 0,
        marketingAndAdvertising: 0,
        repairsAndMaintenance: 0,
        capEx: 0,
        other: 0
      }
    },
    cashFlow: 290
  },
  annualAnalysis: {
    income: 30000,
    expenses: 18000,
    noi: 12000,
    debtService: 12000,
    cashFlow: 0
  },
  metrics: {
    pricePerSqFt: 200,
    rentPerSqFt: 1.5,
    grossRentMultiplier: 8.5,
    noi: 12000,
    capRate: 6.2,
    cashOnCashReturn: 8.5,
    irr: 12.5,
    dscr: 1.2,
    operatingExpenseRatio: 0.6
  },
  projections: [],
  exitAnalysis: {
    projectedSalePrice: 500000,
    sellingCosts: 30000,
    mortgagePayoff: 300000,
    netProceedsFromSale: 170000,
    totalReturn: 200000
  }
};

describe('AnalysisResults Component', () => {
  beforeEach(() => {
    // Reset any mocks before each test
  });

  it('renders without crashing', () => {
    render(<AnalysisResults analysis={mockAnalysis} />);
    expect(screen.getByText('Key Metrics')).toBeInTheDocument();
  });

  it('displays correct key metrics', () => {
    render(<AnalysisResults analysis={mockAnalysis} />);
    expect(screen.getByText('1.2')).toBeInTheDocument(); // DSCR
    expect(screen.getByText('12.5%')).toBeInTheDocument(); // IRR
    expect(screen.getByText('8.5%')).toBeInTheDocument(); // Cash on Cash Return
  });

  it('shows correct monthly expense breakdown', () => {
    render(<AnalysisResults analysis={mockAnalysis} />);
    fireEvent.click(screen.getByText('MONTHLY ANALYSIS'));
    
    expect(screen.getByText('Property Tax')).toBeInTheDocument();
    expect(screen.getByText('$500')).toBeInTheDocument();
  });

  it('displays correct annual projections', () => {
    render(<AnalysisResults analysis={mockAnalysis} />);
    fireEvent.click(screen.getByText('ANNUAL PROJECTIONS'));
    
    expect(screen.getByText('Year')).toBeInTheDocument();
    expect(screen.getByText('$60,000')).toBeInTheDocument(); // Annual Income
  });

  it('shows exit analysis correctly', () => {
    render(<AnalysisResults analysis={mockAnalysis} />);
    fireEvent.click(screen.getByText('EXIT ANALYSIS'));
    
    expect(screen.getByText('Projected Sale Price')).toBeInTheDocument();
    expect(screen.getByText('$500,000')).toBeInTheDocument();
  });

  it('handles chart tab changes', () => {
    render(<AnalysisResults analysis={mockAnalysis} />);
    fireEvent.click(screen.getByText('EXPENSE BREAKDOWN'));
    expect(screen.getByText('Operating Expenses')).toBeInTheDocument();
  });

  it('formats numbers correctly', () => {
    render(<AnalysisResults analysis={mockAnalysis} />);
    expect(screen.getByText('$1,250')).toBeInTheDocument(); // Monthly Cash Flow
    expect(screen.getByText('8.5%')).toBeInTheDocument(); // Cash on Cash Return
  });

  it('handles missing or incomplete data gracefully', () => {
    render(<AnalysisResults analysis={incompleteAnalysis} />);
    expect(screen.getByText('$0')).toBeInTheDocument();
  });
});

// Test utilities
describe('Analysis Calculation Utilities', () => {
  it('calculates cash on cash return correctly', () => {
    render(<AnalysisResults analysis={mockAnalysis} />);
    expect(screen.getByText('8.5%')).toBeInTheDocument();
  });

  it('calculates total return correctly', () => {
    render(<AnalysisResults analysis={mockAnalysis} />);
    expect(screen.getByText('$200,000')).toBeInTheDocument();
  });
}); 