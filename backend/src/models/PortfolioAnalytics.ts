import mongoose, { Document, Schema } from 'mongoose';

// Financial Summary Interface (80% algorithmic)
export interface IPortfolioSummary {
  totalProperties: number;
  totalValue: number;              // Current market value estimate
  totalEquity: number;             // Sum of equity positions
  monthlyNetCashFlow: number;      // Sum of monthly cash flows
  monthlyRentalIncome: number;     // Sum of monthly rental income
  averageCapRate: number;          // Weighted average by property value
  averageCashOnCash: number;       // Weighted average by investment
  totalInvestment: number;         // Sum of total investments
}

// Simple Risk Analysis Interface
export interface IPortfolioRisk {
  geographicConcentration: number; // % of portfolio value in top state
  topMarket: string;               // "Florida: 67%" format
  concentrationWarning?: string;   // If >50% in single state
  leverageRatio: number;           // Total debt / total value
  cashFlowStability: number;       // Coefficient of variation
}

// Goal Progress Tracking Interface
export interface IGoalProgress {
  monthlyIncomeProgress?: {
    current: number;               // Current monthly cash flow
    target: number;                // Target from portfolio goals
    onTrack: boolean;              // Based on linear projection
    projection: string;            // "On track to reach $5,000/month by 2027"
  };
  netWorthProgress?: {
    current: number;               // Current total equity
    target: number;                // Target from portfolio goals
    onTrack: boolean;              // Based on appreciation assumptions
    projection: string;            // "On track to reach $2M by 2030"
  };
}

// AI Insights Interface (20% enhancement)
export interface IAIInsights {
  portfolioStrength: string;       // "Strong cash flow foundation"
  mainOpportunity: string;         // "Geographic diversification"
  nextSteps: string[];             // ["Consider Texas markets", "Refinance Property #2"]
  riskWarnings: string[];          // ["High Florida concentration"]
  goalAlignment: string;           // "Well-aligned for cash flow goals"
}

// Main Portfolio Analytics Interface
export interface IPortfolioAnalytics extends Document {
  portfolioId: mongoose.Schema.Types.ObjectId;
  calculatedAt: Date;
  summary: IPortfolioSummary;
  risk: IPortfolioRisk;
  goalProgress: IGoalProgress;
  aiInsights: IAIInsights;
}

// Portfolio Summary Schema
const portfolioSummarySchema = new Schema<IPortfolioSummary>({
  totalProperties: {
    type: Number,
    required: true,
    min: 0
  },
  totalValue: {
    type: Number,
    required: true,
    min: 0
  },
  totalEquity: {
    type: Number,
    required: true,
    min: 0
  },
  monthlyNetCashFlow: {
    type: Number,
    required: true
  },
  monthlyRentalIncome: {
    type: Number,
    required: true,
    min: 0
  },
  averageCapRate: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  averageCashOnCash: {
    type: Number,
    required: true,
    min: -100,
    max: 1000
  },
  totalInvestment: {
    type: Number,
    required: true,
    min: 0
  }
}, { _id: false });

// Portfolio Risk Schema
const portfolioRiskSchema = new Schema<IPortfolioRisk>({
  geographicConcentration: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  topMarket: {
    type: String,
    required: true,
    maxlength: 100
  },
  concentrationWarning: {
    type: String,
    maxlength: 200
  },
  leverageRatio: {
    type: Number,
    required: true,
    min: 0,
    max: 1
  },
  cashFlowStability: {
    type: Number,
    required: true,
    min: 0
  }
}, { _id: false });

// Goal Progress Schema
const goalProgressSchema = new Schema<IGoalProgress>({
  monthlyIncomeProgress: {
    current: {
      type: Number,
      required: true
    },
    target: {
      type: Number,
      required: true
    },
    onTrack: {
      type: Boolean,
      required: true
    },
    projection: {
      type: String,
      required: true,
      maxlength: 200
    }
  },
  netWorthProgress: {
    current: {
      type: Number,
      required: true
    },
    target: {
      type: Number,
      required: true
    },
    onTrack: {
      type: Boolean,
      required: true
    },
    projection: {
      type: String,
      required: true,
      maxlength: 200
    }
  }
}, { _id: false });

// AI Insights Schema
const aiInsightsSchema = new Schema<IAIInsights>({
  portfolioStrength: {
    type: String,
    required: true,
    maxlength: 300
  },
  mainOpportunity: {
    type: String,
    required: true,
    maxlength: 300
  },
  nextSteps: [{
    type: String,
    maxlength: 200
  }],
  riskWarnings: [{
    type: String,
    maxlength: 200
  }],
  goalAlignment: {
    type: String,
    required: true,
    maxlength: 300
  }
}, { _id: false });

// Main Portfolio Analytics Schema
const portfolioAnalyticsSchema = new Schema<IPortfolioAnalytics>({
  portfolioId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Portfolio',
    required: true,
    index: true
  },
  calculatedAt: {
    type: Date,
    default: Date.now,
    required: true,
    index: true
  },
  summary: {
    type: portfolioSummarySchema,
    required: true
  },
  risk: {
    type: portfolioRiskSchema,
    required: true
  },
  goalProgress: {
    type: goalProgressSchema,
    required: true
  },
  aiInsights: {
    type: aiInsightsSchema,
    required: true
  }
}, {
  timestamps: false, // We use calculatedAt instead
  versionKey: false
});

// Compound indexes for performance
portfolioAnalyticsSchema.index({ portfolioId: 1, calculatedAt: -1 });

// Static methods
portfolioAnalyticsSchema.statics.findLatestByPortfolio = function(portfolioId: string) {
  return this.findOne({ portfolioId }).sort({ calculatedAt: -1 });
};

portfolioAnalyticsSchema.statics.findByPortfolioWithLimit = function(portfolioId: string, limit: number = 10) {
  return this.find({ portfolioId }).sort({ calculatedAt: -1 }).limit(limit);
};

// Instance methods
portfolioAnalyticsSchema.methods.isStale = function(hoursOld: number = 24) {
  const staleTime = new Date(Date.now() - (hoursOld * 60 * 60 * 1000));
  return this.calculatedAt < staleTime;
};

portfolioAnalyticsSchema.methods.toSummary = function() {
  return {
    totalProperties: this.summary.totalProperties,
    totalValue: this.summary.totalValue,
    monthlyNetCashFlow: this.summary.monthlyNetCashFlow,
    monthlyRentalIncome: this.summary.monthlyRentalIncome,
    averageCapRate: this.summary.averageCapRate,
    portfolioStrength: this.aiInsights.portfolioStrength,
    calculatedAt: this.calculatedAt
  };
};

export const PortfolioAnalytics = mongoose.model<IPortfolioAnalytics>('PortfolioAnalytics', portfolioAnalyticsSchema);
export default PortfolioAnalytics;