const mongoose = require('mongoose');

// Sub-schemas
const historyEntrySchema = new mongoose.Schema({
  changeType: {
    type: String,
    enum: ['creation', 'update', 'analysis', 'status_change', 'note_added', 'document_added'],
    required: true
  },
  timestamp: { type: Date, default: Date.now },
  changes: Object,
  userId: String, // For future authentication implementation
  note: String
});

const analysisHistorySchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  metrics: {
    monthlyMortgage: Number,
    monthlyExpenses: Object,
    totalMonthlyExpenses: Number,
    monthlyCashFlow: Number,
    annualCashFlow: Number,
    cashOnCashROI: Number
  },
  aiAnalysis: {
    cashFlowScore: Number,
    marketTrends: Object,
    riskAssessment: Object,
    recommendations: [String]
  },
  marketConditions: {
    interestRates: Number,
    localMarketIndicators: Object,
    economicIndicators: Object
  }
});

const documentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: {
    type: String,
    enum: ['contract', 'inspection', 'appraisal', 'tax', 'insurance', 'other'],
    required: true
  },
  url: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },
  description: String
});

const noteSchema = new mongoose.Schema({
  content: { type: String, required: true },
  category: {
    type: String,
    enum: ['general', 'financial', 'property', 'tenant', 'maintenance', 'other'],
    default: 'general'
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const sfrDetailsSchema = new mongoose.Schema({
  // Property Characteristics
  bedrooms: { type: Number, required: true },
  bathrooms: { type: Number, required: true },
  squareFootage: { type: Number, required: true },
  lotSize: { type: Number }, // in square feet
  yearBuilt: { type: Number },
  parking: {
    type: String,
    enum: ['garage', 'carport', 'street', 'none'],
  },
  condition: {
    type: String,
    enum: ['excellent', 'good', 'fair', 'poor', 'needs_renovation'],
  },

  // Renovation/Improvement Details
  renovationNeeded: {
    type: Boolean,
    default: false
  },
  renovationCosts: {
    total: Number,
    breakdown: {
      kitchen: Number,
      bathrooms: Number,
      flooring: Number,
      electrical: Number,
      plumbing: Number,
      hvac: Number,
      roof: Number,
      exterior: Number,
      other: Number
    }
  },
  afterRepairValue: Number,

  // Rental Details
  currentlyRented: {
    type: Boolean,
    default: false
  },
  leaseTerms: {
    startDate: Date,
    endDate: Date,
    monthlyRent: Number,
    securityDeposit: Number,
    petsAllowed: Boolean,
    utilityStructure: {
      type: String,
      enum: ['all_included', 'partial', 'tenant_pays_all']
    }
  },

  // Operating Expenses
  utilities: {
    electric: Number,
    gas: Number,
    water: Number,
    sewer: Number,
    garbage: Number,
    internet: Number
  },
  hoa: {
    monthly: Number,
    annual: Number,
    includes: [String]
  },
  propertyManagement: {
    company: String,
    feePercentage: { type: Number, default: 4 }, // Default 4%
    monthlyAmount: Number
  },
  tenantTurnover: {
    realtorCommissionMonths: { type: Number, default: 1 }, // Default 1 month of rent
    prepFeesMonths: { type: Number, default: 1 }, // Default 1 month of rent for prep
    assumedAnnualTurnover: { type: Boolean, default: true }, // Whether to assume annual turnover
    lastTurnoverDate: Date,
    averageTurnoverCosts: {
      cleaning: { type: Number, default: 0 },
      painting: { type: Number, default: 0 },
      repairs: { type: Number, default: 0 },
      marketing: { type: Number, default: 0 },
      other: { type: Number, default: 0 }
    }
  },

  // Market Analysis
  comparables: [{
    address: String,
    price: Number,
    squareFootage: Number,
    bedrooms: Number,
    bathrooms: Number,
    saleDate: Date,
    pricePerSqFt: Number,
    link: String
  }],
  rentalComps: [{
    address: String,
    monthlyRent: Number,
    squareFootage: Number,
    bedrooms: Number,
    bathrooms: Number,
    listingDate: Date,
    rentPerSqFt: Number,
    link: String
  }],

  // Long-term Analysis Assumptions
  longTermAssumptions: {
    projectionYears: { type: Number, default: 10 },
    annualRentIncrease: { type: Number, default: 2 }, // percentage
    annualPropertyValueIncrease: { type: Number, default: 2 }, // percentage
    sellingCostsPercentage: { type: Number, default: 3 }, // percentage
    inflationRate: { type: Number, default: 2 }, // percentage
    exitYear: { type: Number, default: 10 }
  },

  // Financial Analysis
  purchaseAnalysis: {
    purchasePrice: Number,
    closingCosts: Number,
    renovationCosts: Number,
    totalInvestment: Number,
    loanDetails: {
      amount: Number,
      type: String,
      term: Number,
      rate: Number,
      monthlyPayment: Number,
      downPayment: Number,
      pmi: Number
    }
  },
  monthlyAnalysis: {
    income: {
      baseRent: Number,
      otherIncome: Number,
      totalIncome: Number
    },
    expenses: {
      mortgage: Number,
      taxes: Number,
      insurance: Number,
      hoa: Number,
      utilities: Number,
      management: Number,
      maintenance: Number,
      vacancy: Number,
      capex: Number,
      tenantTurnoverAccrual: Number, // Monthly accrual for turnover costs
      total: Number
    },
    cashFlow: Number
  },
  annualAnalysis: {
    grossRent: Number,
    effectiveGrossIncome: Number,
    operatingExpenses: Number,
    netOperatingIncome: Number,
    cashFlow: Number,
    capRate: Number,
    cashOnCashReturn: Number,
    roi: Number,
    irr: Number,
    turnoverCosts: {
      realtorCommission: Number,
      prepFees: Number,
      total: Number
    }
  },
  longTermAnalysis: {
    yearlyProjections: [{
      year: Number,
      grossRent: Number,
      effectiveGrossIncome: Number,
      operatingExpenses: Number,
      netOperatingIncome: Number,
      cashFlow: Number,
      propertyValue: Number,
      equity: Number,
      mortgageBalance: Number,
      turnoverCosts: {
        realtorCommission: Number,
        prepFees: Number,
        total: Number
      }
    }],
    exitAnalysis: {
      projectedSalePrice: Number,
      sellingCosts: Number,
      mortgagePayoff: Number,
      principalPaidOff: Number,
      netProceedsFromSale: Number
    },
    returns: {
      totalCashFlow: Number,
      totalAppreciation: Number,
      totalReturn: Number,
      averageAnnualCashFlow: Number,
      irr: Number,
      equityMultiple: Number
    }
  }
});

const dealSchema = new mongoose.Schema({
  // Basic Information
  propertyAddress: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    country: { type: String, default: 'USA' }
  },
  propertyType: {
    type: String,
    enum: ['single_family', 'multi_family', 'condo', 'townhouse', 'commercial', 'land', 'retail', 'hotel'],
    required: true
  },
  purchasePrice: {
    type: Number,
    required: true,
  },
  downPayment: {
    type: Number,
    required: true,
  },
  interestRate: {
    type: Number,
    required: true,
  },
  loanTerm: {
    type: Number,
    required: true,
  },
  monthlyRent: {
    type: Number,
    required: true,
  },
  propertyTax: {
    type: Number,
    required: true,
  },
  insurance: {
    type: Number,
    required: true,
  },
  maintenance: {
    type: Number,
    required: true,
  },

  // AI Analysis
  aiAnalysis: {
    cashFlowScore: Number,
    marketTrends: Object,
    riskAssessment: Object,
    recommendations: [String],
    lastAnalyzed: Date,
  },

  // Contextual Data
  contextualData: {
    marketComps: [Object],
    demographicData: Object,
    economicIndicators: Object,
    propertyHistory: Object,
  },

  // Enhanced Tracking Features
  history: [historyEntrySchema],
  analysisHistory: [analysisHistorySchema],
  documents: [documentSchema],
  notes: [noteSchema],

  // Categorization
  tags: [String],
  category: {
    type: String,
    enum: ['residential', 'commercial', 'mixed_use', 'development', 'other'],
    required: true
  },
  portfolio: {
    type: String,
    ref: 'Portfolio' // For future portfolio management feature
  },

  // Performance Metrics
  performanceMetrics: {
    actualRent: { type: Number, default: 0 },
    actualExpenses: { type: Number, default: 0 },
    occupancyRate: { type: Number, default: 100 },
    netOperatingIncome: { type: Number, default: 0 },
    returnOnInvestment: { type: Number, default: 0 },
    appreciationRate: { type: Number, default: 0 }
  },

  // Status and Timestamps
  status: {
    type: String,
    enum: ['draft', 'analyzed', 'active', 'pending', 'closed', 'archived'],
    default: 'draft',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },

  // Add SFR-specific details
  sfrDetails: {
    type: sfrDetailsSchema,
    required: function() { return this.propertyType === 'single_family'; }
  },
});

// Middleware
dealSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Add to history if document is being modified
  if (this.isModified()) {
    const changes = this.getChanges();
    if (Object.keys(changes).length > 0) {
      this.history.push({
        changeType: this.isNew ? 'creation' : 'update',
        changes: changes,
        timestamp: new Date()
      });
    }
  }
  
  next();
});

// Instance methods
dealSchema.methods.getChanges = function() {
  const modifiedPaths = this.modifiedPaths();
  const changes = {};
  
  modifiedPaths.forEach(path => {
    if (path !== 'updatedAt' && path !== 'history') {
      changes[path] = {
        old: this.get(path, { getters: false }),
        new: this._update?.$set?.[path]
      };
    }
  });
  
  return changes;
};

dealSchema.methods.addNote = function(noteData) {
  this.notes.push(noteData);
  this.history.push({
    changeType: 'note_added',
    note: noteData.content,
    timestamp: new Date()
  });
  return this.save();
};

dealSchema.methods.addDocument = function(documentData) {
  this.documents.push(documentData);
  this.history.push({
    changeType: 'document_added',
    changes: { document: documentData.name },
    timestamp: new Date()
  });
  return this.save();
};

// Static methods
dealSchema.statics.findByTag = function(tag) {
  return this.find({ tags: tag });
};

dealSchema.statics.findByCategory = function(category) {
  return this.find({ category });
};

dealSchema.statics.compareDeals = function(dealIds) {
  return this.find({
    '_id': { $in: dealIds }
  }).select('propertyAddress purchasePrice monthlyRent performanceMetrics aiAnalysis');
};

// Add SFR-specific methods
dealSchema.methods.calculateSFRMetrics = function() {
  if (this.propertyType !== 'single_family') {
    throw new Error('This method is only for single-family properties');
  }

  const sfr = this.sfrDetails;
  
  // Calculate price per square foot
  const pricePerSqFt = this.purchasePrice / sfr.squareFootage;

  // Calculate gross rent multiplier
  const grm = this.purchasePrice / (sfr.monthlyAnalysis.income.baseRent * 12);

  // Calculate debt service coverage ratio
  const dscr = sfr.monthlyAnalysis.income.totalIncome / 
    (sfr.monthlyAnalysis.expenses.mortgage + sfr.monthlyAnalysis.expenses.taxes + sfr.monthlyAnalysis.expenses.insurance);

  // Calculate vacancy rate
  const vacancyRate = (sfr.monthlyAnalysis.expenses.vacancy / sfr.monthlyAnalysis.income.baseRent) * 100;

  return {
    pricePerSqFt,
    grm,
    dscr,
    vacancyRate,
    noi: sfr.annualAnalysis.netOperatingIncome,
    capRate: sfr.annualAnalysis.capRate,
    cashOnCashReturn: sfr.annualAnalysis.cashOnCashReturn,
    totalRoi: sfr.annualAnalysis.roi
  };
};

module.exports = mongoose.model('Deal', dealSchema); 