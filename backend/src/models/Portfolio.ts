import mongoose, { Document, Schema } from 'mongoose';

// Portfolio Goals Interface (matches user-stories.md)
export interface IPortfolioGoals {
  primaryGoal: 'CASH_FLOW' | 'WEALTH_BUILDING' | 'ESTATE_BUILDING' | 'INFLATION_HEDGE' | 'DIVERSIFICATION' | 'REIT_ALTERNATIVE' | 'OPPORTUNISTIC';
  targetMonthlyIncome?: number;    // For CASH_FLOW goals
  targetNetWorth?: number;         // For WEALTH_BUILDING goals
  targetTimeline?: string;         // "5 years", "10-15 years", "long-term"
  riskTolerance: 'CONSERVATIVE' | 'MODERATE' | 'AGGRESSIVE';
}

// Portfolio Settings Interface
export interface IPortfolioSettings {
  includeInSFRAnalysis: boolean;   // Show portfolio context in property analysis
  alertsEnabled: boolean;          // Email alerts for recommendations
  currency: 'USD';                 // Fixed for v1
}

// Main Portfolio Interface
export interface IPortfolio extends Document {
  userId: mongoose.Schema.Types.ObjectId;
  name: string;
  description?: string;
  goals: IPortfolioGoals;
  settings: IPortfolioSettings;
  status: 'ACTIVE' | 'ARCHIVED';
  createdAt: Date;
  updatedAt: Date;
}

// Portfolio Goals Schema
const portfolioGoalsSchema = new Schema<IPortfolioGoals>({
  primaryGoal: {
    type: String,
    enum: ['CASH_FLOW', 'WEALTH_BUILDING', 'ESTATE_BUILDING', 'INFLATION_HEDGE', 'DIVERSIFICATION', 'REIT_ALTERNATIVE', 'OPPORTUNISTIC'],
    required: true
  },
  targetMonthlyIncome: {
    type: Number,
    min: 0,
    max: 1000000,
    required: function(this: IPortfolioGoals) {
      return this.primaryGoal === 'CASH_FLOW';
    }
  },
  targetNetWorth: {
    type: Number,
    min: 0,
    max: 100000000,
    required: function(this: IPortfolioGoals) {
      return this.primaryGoal === 'WEALTH_BUILDING';
    }
  },
  targetTimeline: {
    type: String,
    enum: ['5 years', '10-15 years', 'long-term'],
    default: '10-15 years'
  },
  riskTolerance: {
    type: String,
    enum: ['CONSERVATIVE', 'MODERATE', 'AGGRESSIVE'],
    required: true,
    default: 'MODERATE'
  }
}, { _id: false });

// Portfolio Settings Schema
const portfolioSettingsSchema = new Schema<IPortfolioSettings>({
  includeInSFRAnalysis: {
    type: Boolean,
    default: true
  },
  alertsEnabled: {
    type: Boolean,
    default: true
  },
  currency: {
    type: String,
    enum: ['USD'],
    default: 'USD'
  }
}, { _id: false });

// Main Portfolio Schema
const portfolioSchema = new Schema<IPortfolio>({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    minlength: 1,
    maxlength: 50,
    trim: true
  },
  description: {
    type: String,
    maxlength: 200,
    trim: true
  },
  goals: {
    type: portfolioGoalsSchema,
    required: true
  },
  settings: {
    type: portfolioSettingsSchema,
    default: () => ({
      includeInSFRAnalysis: true,
      alertsEnabled: true,
      currency: 'USD'
    })
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'ARCHIVED'],
    default: 'ACTIVE',
    index: true
  }
}, {
  timestamps: true,
  versionKey: false
});

// Compound indexes for performance
portfolioSchema.index({ userId: 1, status: 1 });
portfolioSchema.index({ userId: 1, createdAt: -1 });

// Virtual for portfolio property count (populated later)
portfolioSchema.virtual('propertyCount', {
  ref: 'Deal',
  localField: '_id',
  foreignField: 'portfolioId',
  count: true
});

// Instance methods
portfolioSchema.methods.toSummary = function() {
  return {
    id: this._id,
    name: this.name,
    primaryGoal: this.goals.primaryGoal,
    riskTolerance: this.goals.riskTolerance,
    status: this.status,
    createdAt: this.createdAt
  };
};

// Static methods
portfolioSchema.statics.findByUser = function(userId: string) {
  return this.find({ userId, status: 'ACTIVE' }).sort({ createdAt: -1 });
};

portfolioSchema.statics.findActiveByUser = function(userId: string) {
  return this.find({ userId, status: 'ACTIVE' }).sort({ createdAt: -1 });
};

// Pre-save validation
portfolioSchema.pre('save', function(next) {
  // Validate goal-specific requirements
  if (this.goals.primaryGoal === 'CASH_FLOW' && !this.goals.targetMonthlyIncome) {
    return next(new Error('Target monthly income is required for cash flow goals'));
  }
  
  if (this.goals.primaryGoal === 'WEALTH_BUILDING' && !this.goals.targetNetWorth) {
    return next(new Error('Target net worth is required for wealth building goals'));
  }
  
  next();
});

export const Portfolio = mongoose.model<IPortfolio>('Portfolio', portfolioSchema);
export default Portfolio;