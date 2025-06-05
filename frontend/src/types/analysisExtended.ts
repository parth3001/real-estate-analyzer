/**
 * Extended Analysis Types
 * 
 * This file extends the base Analysis types to include
 * additional properties needed by the analysis components
 */

import { Analysis, MonthlyAnalysis, AnnualAnalysis, LongTermAnalysis } from './analysis';

/**
 * Extended Analysis interface that includes purchasePrice
 */
export interface ExtendedAnalysis extends Analysis {
  purchasePrice?: number;
}

/**
 * Extended monthly expenses interface
 */
export interface ExtendedExpenses {
  propertyTax: number;
  insurance: number;
  maintenance: number;
  propertyManagement: number;
  vacancy: number;
  total: number;
  rent?: number;
  mortgage?: {
    total: number;
    downPayment?: number;
  };
  closingCosts?: number;
  repairCosts?: number;
  [key: string]: any;
}

/**
 * Extended MonthlyAnalysis that includes the correct expenses type
 */
export interface ExtendedMonthlyAnalysis extends MonthlyAnalysis {
  expenses: ExtendedExpenses;
  cashFlow: number;
  cashFlowAfterTax?: number;
}

/**
 * Extended YearlyProjection that includes string indexing
 */
export interface ExtendedYearlyProjection {
  year: number;
  cashFlow: number;
  propertyValue: number;
  equity: number;
  propertyTax: number;
  insurance: number;
  maintenance: number;
  propertyManagement: number;
  vacancy: number;
  operatingExpenses: number;
  noi: number;
  debtService: number;
  grossRent: number;
  mortgageBalance: number;
  appreciation: number;
  totalReturn: number;
  [key: string]: number | string | boolean | undefined;
}

/**
 * Extended LongTermAnalysis that uses the extended yearly projection
 */
export interface ExtendedLongTermAnalysis extends Omit<LongTermAnalysis, 'yearlyProjections'> {
  yearlyProjections: ExtendedYearlyProjection[];
}

/**
 * Complete Extended Analysis
 */
export interface CompleteExtendedAnalysis extends Omit<ExtendedAnalysis, 'monthlyAnalysis' | 'longTermAnalysis'> {
  monthlyAnalysis: ExtendedMonthlyAnalysis;
  annualAnalysis: AnnualAnalysis;
  longTermAnalysis: ExtendedLongTermAnalysis;
} 