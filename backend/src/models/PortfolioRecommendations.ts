import mongoose, { Document, Schema } from 'mongoose';

// Recommendation Types (Simple)
export type RecommendationType = 'DIVERSIFY' | 'OPTIMIZE' | 'REFINANCE' | 'GOAL_ALIGNMENT';

// Priority Levels
export type RecommendationPriority = 'HIGH' | 'MEDIUM' | 'LOW';

// Recommendation Status
export type RecommendationStatus = 'PENDING' | 'VIEWED' | 'DISMISSED';

// Portfolio Recommendation Interface
export interface IPortfolioRecommendation extends Document {
  portfolioId: mongoose.Schema.Types.ObjectId;
  type: RecommendationType;
  priority: RecommendationPriority;
  title: string;                       // "Consider geographic diversification"
  description: string;                 // Simple explanation (1-2 sentences)
  actionSteps: string[];               // Specific steps user can take
  expectedImpact: string;              // "Reduce risk while maintaining returns"
  status: RecommendationStatus;
  createdAt: Date;
  expiresAt: Date;
  viewedAt?: Date;
  dismissedAt?: Date;
}

// Portfolio Recommendation Schema
const portfolioRecommendationSchema = new Schema<IPortfolioRecommendation>({
  portfolioId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Portfolio',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['DIVERSIFY', 'OPTIMIZE', 'REFINANCE', 'GOAL_ALIGNMENT'],
    required: true,
    index: true
  },
  priority: {
    type: String,
    enum: ['HIGH', 'MEDIUM', 'LOW'],
    required: true,
    default: 'MEDIUM'
  },
  title: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 100,
    trim: true
  },
  description: {
    type: String,
    required: true,
    minlength: 10,
    maxlength: 500,
    trim: true
  },
  actionSteps: [{
    type: String,
    required: true,
    minlength: 5,
    maxlength: 200,
    trim: true
  }],
  expectedImpact: {
    type: String,
    required: true,
    minlength: 10,
    maxlength: 200,
    trim: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'VIEWED', 'DISMISSED'],
    default: 'PENDING',
    index: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true
  },
  viewedAt: {
    type: Date
  },
  dismissedAt: {
    type: Date
  }
}, {
  timestamps: true,
  versionKey: false
});

// Compound indexes for performance
portfolioRecommendationSchema.index({ portfolioId: 1, status: 1, priority: -1 });
portfolioRecommendationSchema.index({ portfolioId: 1, createdAt: -1 });
portfolioRecommendationSchema.index({ expiresAt: 1 }); // For cleanup jobs

// Virtual for recommendation age
portfolioRecommendationSchema.virtual('ageInDays').get(function() {
  return Math.floor((Date.now() - this.createdAt.getTime()) / (1000 * 60 * 60 * 24));
});

// Virtual for time until expiration
portfolioRecommendationSchema.virtual('daysUntilExpiration').get(function() {
  return Math.floor((this.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
});

// Instance methods
portfolioRecommendationSchema.methods.markAsViewed = function() {
  if (this.status === 'PENDING') {
    this.status = 'VIEWED';
    this.viewedAt = new Date();
    return this.save();
  }
  return Promise.resolve(this);
};

portfolioRecommendationSchema.methods.dismiss = function() {
  this.status = 'DISMISSED';
  this.dismissedAt = new Date();
  return this.save();
};

portfolioRecommendationSchema.methods.isExpired = function() {
  return this.expiresAt < new Date();
};

portfolioRecommendationSchema.methods.isHighPriority = function() {
  return this.priority === 'HIGH';
};

portfolioRecommendationSchema.methods.toSummary = function() {
  return {
    id: this._id,
    type: this.type,
    priority: this.priority,
    title: this.title,
    description: this.description,
    status: this.status,
    ageInDays: this.ageInDays,
    daysUntilExpiration: this.daysUntilExpiration
  };
};

// Static methods
portfolioRecommendationSchema.statics.findActiveByPortfolio = function(portfolioId: string) {
  return this.find({
    portfolioId,
    status: { $in: ['PENDING', 'VIEWED'] },
    expiresAt: { $gt: new Date() }
  }).sort({ priority: -1, createdAt: -1 });
};

portfolioRecommendationSchema.statics.findPendingByPortfolio = function(portfolioId: string) {
  return this.find({
    portfolioId,
    status: 'PENDING',
    expiresAt: { $gt: new Date() }
  }).sort({ priority: -1, createdAt: -1 });
};

portfolioRecommendationSchema.statics.findHighPriorityByPortfolio = function(portfolioId: string) {
  return this.find({
    portfolioId,
    priority: 'HIGH',
    status: { $in: ['PENDING', 'VIEWED'] },
    expiresAt: { $gt: new Date() }
  }).sort({ createdAt: -1 });
};

portfolioRecommendationSchema.statics.cleanupExpired = function() {
  return this.deleteMany({
    expiresAt: { $lt: new Date() },
    status: { $ne: 'PENDING' } // Keep pending recommendations even if expired
  });
};

// Pre-save middleware
portfolioRecommendationSchema.pre('save', function(next) {
  // Set default expiration to 30 days if not specified
  if (this.isNew && !this.expiresAt) {
    this.expiresAt = new Date(Date.now() + (30 * 24 * 60 * 60 * 1000));
  }
  
  // Validate action steps
  if (this.actionSteps.length === 0) {
    return next(new Error('At least one action step is required'));
  }
  
  if (this.actionSteps.length > 5) {
    return next(new Error('Maximum 5 action steps allowed'));
  }
  
  next();
});

// Post-save middleware for analytics
portfolioRecommendationSchema.post('save', function(doc) {
  // Could emit events here for analytics tracking
  console.log(`Recommendation ${doc.type} created for portfolio ${doc.portfolioId}`);
});

export const PortfolioRecommendation = mongoose.model<IPortfolioRecommendation>('PortfolioRecommendation', portfolioRecommendationSchema);
export default PortfolioRecommendation;