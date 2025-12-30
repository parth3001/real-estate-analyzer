/**
 * BRRRR Component Type Definitions
 *
 * Shared TypeScript interfaces for BRRRR components
 * Exported separately to avoid circular dependencies and module resolution issues
 */

/**
 * Financial Period Metrics Interface
 * Used in FinancialPeriodCard and BRRRRFinancialComparison
 *
 * Backward compatible - all new fields are optional
 */
export interface FinancialPeriodMetrics {
  // Required (existing fields)
  monthlyMortgage: number;
  monthlyExpenses: number;
  monthlyCashFlow: number;

  // Optional (new - backward compatible)
  annualCashFlow?: number;
  cashOnCashReturn?: number;

  // Optional breakdown (for BRRRR dual-period detailed display)
  expenseBreakdown?: {
    propertyTax?: number;
    insurance?: number;
    maintenance?: number;
    propertyManagement?: number;
    hoa?: number;
    vacancy?: number;
  };

  // Optional loan details (for comparison display)
  loanDetails?: {
    loanAmount: number;
    interestRate: number;
    loanTerm: number;
    previousPayment?: number; // For delta display
  };
}

/**
 * Financial Period Card Props
 */
export interface FinancialPeriodCardProps {
  period: 'initial' | 'postRefinance';
  title: string;
  metrics: FinancialPeriodMetrics;
}

/**
 * Projection Row Interface
 * Used in ProjectionsTable and BRRRRLongTermProjections
 */
export interface ProjectionRow {
  year: number;
  propertyValue: number;
  equity?: number;
  loanBalance?: number;
  cashFlow?: number;
  noi?: number;
  appreciationGain?: number;
}

/**
 * Projections Table Props
 */
export interface ProjectionsTableProps {
  projections: ProjectionRow[];
  compact?: boolean;
  highlightYear?: number;
}
