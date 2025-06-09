import mongoose, { Schema, Document } from 'mongoose';

// Base interfaces
export interface PropertyAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
}

export interface LongTermAssumptions {
  projectionYears: number;
  annualRentIncrease: number;
  annualPropertyValueIncrease: number;
  sellingCostsPercentage: number;
  inflationRate: number;
  vacancyRate: number;
}

export interface MFLongTermAssumptions extends LongTermAssumptions {
  capitalExpenditureRate: number;
  commonAreaMaintenanceRate: number;
}

export interface UnitType {
  type: string;
  count: number;
  sqft: number;
  monthlyRent: number;
  occupied: number;
}

export interface CommonAreaUtilities {
  electric: number;
  water: number;
  gas: number;
  trash: number;
}

export interface Analysis {
  monthlyAnalysis: {
    expenses: {
      propertyTax?: number;
      insurance?: number;
      maintenance?: number;
      propertyManagement?: number;
      vacancy?: number;
      total?: number;
    };
    income?: {
      gross?: number;
      effective?: number;
    };
    cashFlow?: number;
  };
  annualAnalysis: {
    dscr?: number;
    cashOnCashReturn?: number;
    capRate?: number;
    totalInvestment?: number;
    annualNOI?: number;
    annualDebtService?: number;
    effectiveGrossIncome?: number;
  };
  longTermAnalysis: {
    yearlyProjections?: Array<{
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
    }>;
    projectionYears?: number;
    returns?: {
      irr?: number;
      totalCashFlow?: number;
      totalAppreciation?: number;
      totalReturn?: number;
    };
    exitAnalysis?: {
      projectedSalePrice?: number;
      sellingCosts?: number;
      mortgagePayoff?: number;
      netProceedsFromSale?: number;
    };
  };
  keyMetrics?: {
    capRate?: number;
    cashOnCashReturn?: number;
    dscr?: number;
    pricePerSqFtAtPurchase?: number;
    pricePerSqFtAtSale?: number;
    avgRentPerSqFt?: number;
  };
  aiInsights?: {
    summary?: string;
    strengths?: string[];
    weaknesses?: string[];
    recommendations?: string[];
    investmentScore?: number;
  };
}

// Base deal interface
export interface IDeal extends Document {
  propertyName: string;
  propertyType: 'SFR' | 'MF';
  propertyAddress: PropertyAddress;
  purchasePrice: number;
  downPayment: number;
  interestRate: number;
  loanTerm: number;
  propertyTaxRate: number;
  insuranceRate: number;
  propertyManagementRate: number;
  yearBuilt: number;
  closingCosts?: number;
  analysis: Analysis;
  notes?: Array<{
    text: string;
    createdAt: Date;
    author?: string;
  }>;
  documents?: Array<{
    name: string;
    url: string;
    type: string;
    uploadedAt: Date;
  }>;
  performanceMetrics?: {
    actualRent?: number;
    actualExpenses?: number;
    occupancyRate?: number;
    updatedAt: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

// SFR specific fields
export interface ISFRDeal extends IDeal {
  propertyType: 'SFR';
  monthlyRent: number;
  squareFootage: number;
  bedrooms: number;
  bathrooms: number;
  maintenanceCost: number;
  longTermAssumptions: LongTermAssumptions;
}

// MF specific fields
export interface IMFDeal extends IDeal {
  propertyType: 'MF';
  totalUnits: number;
  totalSqft: number;
  maintenanceCostPerUnit: number;
  unitTypes: UnitType[];
  longTermAssumptions: MFLongTermAssumptions;
  commonAreaUtilities: CommonAreaUtilities;
}

// Address schema
const AddressSchema = new Schema({
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zipCode: { type: String, required: true }
});

// Analysis schema
const AnalysisSchema = new Schema({
  monthlyAnalysis: {
    expenses: {
      propertyTax: Number,
      insurance: Number,
      maintenance: Number,
      propertyManagement: Number,
      vacancy: Number,
      total: Number
    },
    income: {
      gross: Number,
      effective: Number
    },
    cashFlow: Number
  },
  annualAnalysis: {
    dscr: Number,
    cashOnCashReturn: Number,
    capRate: Number,
    totalInvestment: Number,
    annualNOI: Number,
    annualDebtService: Number,
    effectiveGrossIncome: Number
  },
  longTermAnalysis: {
    yearlyProjections: [Schema.Types.Mixed],
    projectionYears: Number,
    returns: {
      irr: Number,
      totalCashFlow: Number,
      totalAppreciation: Number,
      totalReturn: Number
    },
    exitAnalysis: {
      projectedSalePrice: Number,
      sellingCosts: Number,
      mortgagePayoff: Number,
      netProceedsFromSale: Number
    }
  },
  keyMetrics: {
    capRate: Number,
    cashOnCashReturn: Number,
    dscr: Number,
    pricePerSqFtAtPurchase: Number,
    pricePerSqFtAtSale: Number,
    avgRentPerSqFt: Number
  },
  aiInsights: {
    summary: String,
    strengths: [String],
    weaknesses: [String],
    recommendations: [String],
    investmentScore: Number
  }
});

// Base schema for all deals
const DealSchema = new Schema({
  propertyName: { type: String, required: true },
  propertyType: { type: String, enum: ['SFR', 'MF'], required: true },
  propertyAddress: { type: AddressSchema, required: true },
  purchasePrice: { type: Number, required: true },
  downPayment: { type: Number, required: true },
  interestRate: { type: Number, required: true },
  loanTerm: { type: Number, required: true },
  propertyTaxRate: { type: Number, required: true },
  insuranceRate: { type: Number, required: true },
  propertyManagementRate: { type: Number, required: true },
  yearBuilt: { type: Number, required: true },
  closingCosts: { type: Number },
  
  // SFR specific fields with conditional validation
  monthlyRent: { 
    type: Number,
    required: function() { return this.propertyType === 'SFR'; }
  },
  squareFootage: { 
    type: Number,
    required: function() { return this.propertyType === 'SFR'; }
  },
  bedrooms: { 
    type: Number,
    required: function() { return this.propertyType === 'SFR'; }
  },
  bathrooms: { 
    type: Number,
    required: function() { return this.propertyType === 'SFR'; }
  },
  maintenanceCost: { 
    type: Number,
    required: function() { return this.propertyType === 'SFR'; }
  },
  
  // MF specific fields with conditional validation
  totalUnits: { 
    type: Number,
    required: function() { return this.propertyType === 'MF'; }
  },
  totalSqft: { 
    type: Number,
    required: function() { return this.propertyType === 'MF'; }
  },
  maintenanceCostPerUnit: { 
    type: Number,
    required: function() { return this.propertyType === 'MF'; }
  },
  unitTypes: { 
    type: [Schema.Types.Mixed],
    required: function() { return this.propertyType === 'MF'; }
  },
  commonAreaUtilities: { 
    type: Schema.Types.Mixed,
    required: function() { return this.propertyType === 'MF'; }
  },
  
  // Common fields for both types
  longTermAssumptions: { type: Schema.Types.Mixed, required: true },
  analysis: { type: AnalysisSchema },
  
  // Metadata
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true,
  discriminatorKey: 'propertyType'
});

// Create the base model
const DealModel = mongoose.model<IDeal>('Deal', DealSchema);

// Create discriminators for the different property types
const SFRDeal = DealModel.discriminator<ISFRDeal>(
  'SFR',
  new Schema({
    // SFR specific validation can go here
  })
);

const MFDeal = DealModel.discriminator<IMFDeal>(
  'MF',
  new Schema({
    // MF specific validation can go here
  })
);

export { DealModel, SFRDeal, MFDeal }; 