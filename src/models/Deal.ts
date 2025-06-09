import mongoose, { Document, Schema } from 'mongoose';
import { PropertyType } from '../types/propertyTypes';

// Interface representing a Deal document in MongoDB
export interface IDeal extends Document {
  propertyName: string;
  propertyType: PropertyType;
  propertyAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  purchasePrice: number;
  downPayment: number;
  interestRate: number;
  loanTerm: number;
  propertyTaxRate: number;
  insuranceRate: number;
  yearBuilt: number;
  
  // SFR specific fields
  monthlyRent?: number;
  squareFootage?: number;
  bedrooms?: number;
  bathrooms?: number;
  maintenanceCost?: number;
  propertyManagementRate?: number;
  
  // Multi-family specific fields
  totalUnits?: number;
  totalSqft?: number;
  maintenanceCostPerUnit?: number;
  unitTypes?: Array<{
    type: string;
    count: number;
    sqft: number;
    monthlyRent: number;
    occupied: number;
  }>;
  commonAreaUtilities?: {
    electric: number;
    water: number;
    gas: number;
    trash: number;
  };
  
  // Analysis results
  analysis?: {
    monthlyAnalysis: {
      expenses: {
        propertyTax: number;
        insurance: number;
        maintenance: number;
        propertyManagement: number;
        vacancy: number;
        mortgage: {
          total: number;
          principal: number;
          interest: number;
        };
        total: number;
      };
      cashFlow: number;
      cashFlowAfterTax: number;
    };
    annualAnalysis: {
      dscr: number;
      cashOnCashReturn: number;
      capRate: number;
      totalInvestment: number;
      annualNOI: number;
      annualDebtService: number;
      effectiveGrossIncome: number;
    };
    longTermAnalysis: {
      yearlyProjections: Array<{
        year: number;
        cashFlow: number;
        propertyValue: number;
        equity: number;
        noi: number;
        debtService: number;
        grossRent: number;
        mortgageBalance: number;
        appreciation: number;
        totalReturn: number;
      }>;
      projectionYears: number;
      returns: {
        irr: number;
        totalCashFlow: number;
        totalAppreciation: number;
        totalReturn: number;
      };
      exitAnalysis: {
        projectedSalePrice: number;
        sellingCosts: number;
        mortgagePayoff: number;
        netProceedsFromSale: number;
      };
    };
    keyMetrics: {
      pricePerSqFt?: number;
      pricePerUnit?: number;
      averageRentPerUnit?: number;
      averageRentPerSqFt?: number;
    };
    aiInsights?: {
      summary: string;
      strengths: string[];
      weaknesses: string[];
      recommendations: string[];
      investmentScore: number | null;
    };
  };
  
  // Long-term assumptions
  longTermAssumptions?: {
    projectionYears: number;
    annualRentIncrease: number;
    annualPropertyValueIncrease: number;
    sellingCostsPercentage: number;
    inflationRate: number;
    vacancyRate: number;
    // MF-specific assumptions
    capitalExpenditureRate?: number;
    commonAreaMaintenanceRate?: number;
  };
  
  // Metadata
  userId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Schema definition
const DealSchema: Schema = new Schema({
  propertyName: { type: String, required: true },
  propertyType: { type: String, enum: ['SFR', 'MF'], required: true },
  propertyAddress: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true }
  },
  purchasePrice: { type: Number, required: true },
  downPayment: { type: Number, required: true },
  interestRate: { type: Number, required: true },
  loanTerm: { type: Number, required: true },
  propertyTaxRate: { type: Number, required: true },
  insuranceRate: { type: Number, required: true },
  yearBuilt: { type: Number, required: true },
  
  // SFR specific fields
  monthlyRent: { type: Number },
  squareFootage: { type: Number },
  bedrooms: { type: Number },
  bathrooms: { type: Number },
  maintenanceCost: { type: Number },
  propertyManagementRate: { type: Number },
  
  // Multi-family specific fields
  totalUnits: { type: Number },
  totalSqft: { type: Number },
  maintenanceCostPerUnit: { type: Number },
  unitTypes: [{
    type: { type: String },
    count: { type: Number },
    sqft: { type: Number },
    monthlyRent: { type: Number },
    occupied: { type: Number }
  }],
  commonAreaUtilities: {
    electric: { type: Number },
    water: { type: Number },
    gas: { type: Number },
    trash: { type: Number }
  },
  
  // Analysis results
  analysis: {
    monthlyAnalysis: {
      expenses: {
        propertyTax: { type: Number },
        insurance: { type: Number },
        maintenance: { type: Number },
        propertyManagement: { type: Number },
        vacancy: { type: Number },
        mortgage: {
          total: { type: Number },
          principal: { type: Number },
          interest: { type: Number }
        },
        total: { type: Number }
      },
      cashFlow: { type: Number },
      cashFlowAfterTax: { type: Number }
    },
    annualAnalysis: {
      dscr: { type: Number },
      cashOnCashReturn: { type: Number },
      capRate: { type: Number },
      totalInvestment: { type: Number },
      annualNOI: { type: Number },
      annualDebtService: { type: Number },
      effectiveGrossIncome: { type: Number }
    },
    longTermAnalysis: {
      yearlyProjections: [{
        year: { type: Number },
        cashFlow: { type: Number },
        propertyValue: { type: Number },
        equity: { type: Number },
        noi: { type: Number },
        debtService: { type: Number },
        grossRent: { type: Number },
        mortgageBalance: { type: Number },
        appreciation: { type: Number },
        totalReturn: { type: Number }
      }],
      projectionYears: { type: Number },
      returns: {
        irr: { type: Number },
        totalCashFlow: { type: Number },
        totalAppreciation: { type: Number },
        totalReturn: { type: Number }
      },
      exitAnalysis: {
        projectedSalePrice: { type: Number },
        sellingCosts: { type: Number },
        mortgagePayoff: { type: Number },
        netProceedsFromSale: { type: Number }
      }
    },
    keyMetrics: {
      pricePerSqFt: { type: Number },
      pricePerUnit: { type: Number },
      averageRentPerUnit: { type: Number },
      averageRentPerSqFt: { type: Number }
    },
    aiInsights: {
      summary: { type: String },
      strengths: [{ type: String }],
      weaknesses: [{ type: String }],
      recommendations: [{ type: String }],
      investmentScore: { type: Number }
    }
  },
  
  // Long-term assumptions
  longTermAssumptions: {
    projectionYears: { type: Number },
    annualRentIncrease: { type: Number },
    annualPropertyValueIncrease: { type: Number },
    sellingCostsPercentage: { type: Number },
    inflationRate: { type: Number },
    vacancyRate: { type: Number },
    // MF-specific assumptions
    capitalExpenditureRate: { type: Number },
    commonAreaMaintenanceRate: { type: Number }
  },
  
  // Metadata
  userId: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true, // Automatically manage createdAt and updatedAt
  versionKey: false // Disable the __v field
});

// Create and export the model
export default mongoose.model<IDeal>('Deal', DealSchema); 