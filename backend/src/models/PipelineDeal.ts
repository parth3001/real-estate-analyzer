import mongoose, { Schema, Document } from 'mongoose';

// Reuse PropertyAddress from Deal.ts
export interface PropertyAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
}

// Property Types - Extended but compatible with Deal.ts
export enum PropertyType {
  // Existing from Deal.ts
  SFR = 'SFR',
  MF = 'MF',
  CONDO = 'CONDO',
  TOWNHOUSE = 'TOWNHOUSE',
  APARTMENT = 'APARTMENT',
  
  // Commercial
  COMMERCIAL_RETAIL = 'COMMERCIAL_RETAIL',
  COMMERCIAL_OFFICE = 'COMMERCIAL_OFFICE',
  COMMERCIAL_INDUSTRIAL = 'COMMERCIAL_INDUSTRIAL',
  COMMERCIAL_MIXED = 'COMMERCIAL_MIXED',
  
  // Alternative
  SELF_STORAGE = 'SELF_STORAGE',
  MOBILE_HOME_PARK = 'MOBILE_HOME_PARK',
  LAND = 'LAND',
  OTHER = 'OTHER'
}

// Investment Strategies
export enum PropertyStrategy {
  BUY_HOLD = 'BUY_HOLD',
  BRRR = 'BRRR',
  FIX_FLIP = 'FIX_FLIP',
  WHOLESALE = 'WHOLESALE',
  HOUSE_HACK = 'HOUSE_HACK',
  VALUE_ADD = 'VALUE_ADD'
}

// Deal Pipeline Stages
export enum DealStage {
  WATCHING = 'WATCHING',
  ANALYZING = 'ANALYZING',
  NEGOTIATING = 'NEGOTIATING',
  UNDER_CONTRACT = 'UNDER_CONTRACT',
  CLOSED = 'CLOSED',
  LOST = 'LOST'
}

// Deal Sources
export enum DealSource {
  MLS = 'MLS',
  AGENT = 'AGENT',
  DIRECT_MARKETING = 'DIRECT_MARKETING',
  ONLINE = 'ONLINE',
  REFERRAL = 'REFERRAL',
  COLD_CALLING = 'COLD_CALLING',
  OTHER = 'OTHER'
}

// Stage History Entry
export interface StageHistoryEntry {
  stage: DealStage;
  date: Date;
  notes?: string;
  userId?: mongoose.Schema.Types.ObjectId;
}

// Source Information
export interface SourceInfo {
  channel: DealSource;
  referrer?: string;
  cost?: number;
  notes?: string;
}

// Price History Entry
export interface PriceHistoryEntry {
  price: number;
  date: Date;
  source: 'USER' | 'AGENT' | 'API';
  notes?: string;
}

// Instance methods interface
export interface IPipelineDealMethods {
  updateStage(
    newStage: DealStage, 
    userId: mongoose.Schema.Types.ObjectId, 
    notes?: string
  ): Promise<IPipelineDeal>;
  
  updatePrice(
    newPrice: number, 
    source: 'USER' | 'AGENT' | 'API', 
    notes?: string
  ): Promise<IPipelineDeal>;
  
  linkAnalysis(
    analysisId: mongoose.Schema.Types.ObjectId,
    quickMetrics?: any
  ): Promise<IPipelineDeal>;
}

// Pipeline Deal Interface
export interface IPipelineDeal extends Document, IPipelineDealMethods {
  userId: mongoose.Schema.Types.ObjectId;
  
  // Basic Information
  dealName: string;
  propertyType: PropertyType;
  strategy: PropertyStrategy;
  currentStage: DealStage;
  
  // Property Details
  address: PropertyAddress;
  askingPrice: number;
  
  // Optional Property-Specific Fields (Tier 1 - Simple)
  propertyDetails?: {
    bedrooms?: number;
    bathrooms?: number;
    squareFootage?: number;
    yearBuilt?: number;
    units?: number; // For MF
    [key: string]: any; // Extensible for future property types
  };
  
  // Source Tracking
  sourceInfo: SourceInfo;
  
  // Stage Management
  stageHistory: StageHistoryEntry[];
  daysInCurrentStage?: number; // Virtual field
  
  // Analysis Integration (Reference to existing Deal)
  analysisId?: mongoose.Schema.Types.ObjectId; // Links to Deal collection
  analysisStatus: 'NOT_ANALYZED' | 'IN_PROGRESS' | 'COMPLETE';
  
  // Quick Metrics from V3 Analysis (Cached for display)
  quickMetrics?: {
    dealQuality?: number; // From V3 professionalAssessment.dealQuality
    verdict?: 'BUY' | 'PASS' | 'NEGOTIATE' | 'CAUTION';
    cashFlow?: number;
    capRate?: number;
    cashOnCashReturn?: number;
  };
  
  // Analysis Confidence
  confidence: {
    level: 1 | 2 | 3;
    lastUpdated: Date;
    dataSource: 'MANUAL' | 'QUICK_CALC' | 'FULL_ANALYSIS' | 'PIPELINE' | 'PORTFOLIO';
    calculationMethod: 'NONE' | 'BASIC' | 'QUICK_METRICS' | 'FULL_SFR';
  };
  
  // Price Tracking
  priceHistory: PriceHistoryEntry[];
  
  // Notes
  notes?: string;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  lastActivity: Date;
}

// Schema Definitions
const AddressSchema = new Schema({
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zipCode: { type: String, required: false }
});

const StageHistorySchema = new Schema({
  stage: { 
    type: String, 
    enum: Object.values(DealStage),
    required: true 
  },
  date: { type: Date, required: true, default: Date.now },
  notes: { type: String },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

const SourceInfoSchema = new Schema({
  channel: { 
    type: String, 
    enum: Object.values(DealSource),
    required: true 
  },
  referrer: { type: String },
  cost: { type: Number, min: 0 },
  notes: { type: String }
});

const PriceHistorySchema = new Schema({
  price: { type: Number, required: true },
  date: { type: Date, required: true, default: Date.now },
  source: { 
    type: String, 
    enum: ['USER', 'AGENT', 'API'],
    required: true 
  },
  notes: { type: String }
});

// Main Pipeline Deal Schema
const PipelineDealSchema = new Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true
  },
  
  // Basic Information
  dealName: { 
    type: String, 
    required: true, 
    trim: true,
    maxlength: 100
  },
  propertyType: { 
    type: String, 
    enum: Object.values(PropertyType),
    required: true 
  },
  strategy: { 
    type: String, 
    enum: Object.values(PropertyStrategy),
    default: PropertyStrategy.BUY_HOLD
  },
  currentStage: { 
    type: String, 
    enum: Object.values(DealStage),
    required: true,
    default: DealStage.WATCHING,
    index: true
  },
  
  // Property Details
  address: { 
    type: AddressSchema, 
    required: true 
  },
  askingPrice: { 
    type: Number, 
    required: true, 
    min: 0 
  },
  
  // Optional Property-Specific Fields
  propertyDetails: {
    type: Schema.Types.Mixed,
    default: {}
  },
  
  // Source Tracking
  sourceInfo: { 
    type: SourceInfoSchema, 
    required: true 
  },
  
  // Stage Management
  stageHistory: {
    type: [StageHistorySchema],
    default: []
  },
  
  // Analysis Integration
  analysisId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Deal',
    index: true
  },
  analysisStatus: { 
    type: String, 
    enum: ['NOT_ANALYZED', 'IN_PROGRESS', 'COMPLETE'],
    default: 'NOT_ANALYZED',
    index: true
  },
  
  // Quick Metrics (Cached from V3 Analysis)
  quickMetrics: {
    dealQuality: { type: Number, min: 0, max: 100 }, // V3 professionalAssessment.dealQuality
    verdict: { 
      type: String, 
      enum: ['BUY', 'PASS', 'NEGOTIATE', 'CAUTION'] 
    },
    cashFlow: { type: Number },
    capRate: { type: Number },
    cashOnCashReturn: { type: Number }
  },
  
  // Analysis Confidence
  confidence: {
    level: { 
      type: Number, 
      required: true, 
      min: 1, 
      max: 3,
      default: 1
    },
    lastUpdated: { 
      type: Date, 
      default: Date.now 
    },
    dataSource: { 
      type: String, 
      enum: ['MANUAL', 'QUICK_CALC', 'FULL_ANALYSIS', 'PIPELINE', 'PORTFOLIO'],
      default: 'PIPELINE'
    },
    calculationMethod: { 
      type: String, 
      enum: ['NONE', 'BASIC', 'QUICK_METRICS', 'FULL_SFR'],
      default: 'BASIC'
    }
  },
  
  // Price Tracking
  priceHistory: {
    type: [PriceHistorySchema],
    default: []
  },
  
  // Notes
  notes: { 
    type: String,
    maxlength: 1000
  },
  
  // Metadata
  lastActivity: { 
    type: Date, 
    default: Date.now,
    index: true
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt
});

// Indexes for common queries
PipelineDealSchema.index({ userId: 1, currentStage: 1 }); // Kanban board queries
PipelineDealSchema.index({ userId: 1, lastActivity: -1 }); // Recent activity
PipelineDealSchema.index({ userId: 1, propertyType: 1 }); // Filter by type
PipelineDealSchema.index({ userId: 1, askingPrice: 1 }); // Price range queries
PipelineDealSchema.index({ 'address.zipCode': 1 }); // Geographic queries

// Virtual field for days in current stage
PipelineDealSchema.virtual('daysInCurrentStage').get(function() {
  if (!this.stageHistory || this.stageHistory.length === 0) return 0;
  
  const currentStageEntry = this.stageHistory
    .filter((entry: any) => entry.stage === this.currentStage)
    .sort((a: any, b: any) => b.date.getTime() - a.date.getTime())[0];
  
  if (!currentStageEntry) return 0;
  
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - currentStageEntry.date.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Pre-save middleware
PipelineDealSchema.pre('save', function(next) {
  // Update lastActivity
  this.lastActivity = new Date();
  
  // Calculate and update confidence level
  if (!this.confidence) {
    this.confidence = {
      level: 1,
      lastUpdated: new Date(),
      dataSource: 'PIPELINE',
      calculationMethod: 'BASIC'
    };
  }
  this.confidence.level = calculatePipelineConfidence(this);
  this.confidence.lastUpdated = new Date();
  
  // Add initial stage to history if new document
  if (this.isNew && this.stageHistory.length === 0) {
    this.stageHistory.push({
      stage: this.currentStage,
      date: new Date(),
      notes: 'Deal created'
    });
  }
  
  // If stage changed, add to history
  if (this.isModified('currentStage') && !this.isNew) {
    // Check if this stage is already the latest in history
    const latestStage = this.stageHistory[this.stageHistory.length - 1];
    if (!latestStage || latestStage.stage !== this.currentStage) {
      this.stageHistory.push({
        stage: this.currentStage,
        date: new Date(),
        notes: `Stage updated to ${this.currentStage}`
      });
    }
  }
  
  // Initialize price history with asking price if new
  if (this.isNew && this.askingPrice && this.priceHistory.length === 0) {
    this.priceHistory.push({
      price: this.askingPrice,
      date: new Date(),
      source: 'USER',
      notes: 'Initial asking price'
    });
  }
  
  next();
});

// Confidence calculation function
function calculatePipelineConfidence(deal: any): 1 | 2 | 3 {
  // Level 3: Full analysis (linked to complete Deal analysis)
  if (deal.analysisStatus === 'COMPLETE' && deal.analysisId) {
    deal.confidence.calculationMethod = 'FULL_SFR';
    deal.confidence.dataSource = 'FULL_ANALYSIS';
    return 3;
  }
  
  // Level 2: Quick metrics calculated
  if (deal.quickMetrics && (
    deal.quickMetrics.cashFlow !== undefined || 
    deal.quickMetrics.capRate !== undefined ||
    deal.quickMetrics.cashOnCashReturn !== undefined
  )) {
    deal.confidence.calculationMethod = 'QUICK_METRICS';
    deal.confidence.dataSource = 'QUICK_CALC';
    return 2;
  }
  
  // Level 1: Basic deal info only
  deal.confidence.calculationMethod = 'BASIC';
  deal.confidence.dataSource = 'PIPELINE';
  return 1;
}

// Instance methods implementation
PipelineDealSchema.methods.updateStage = function(
  newStage: DealStage, 
  userId: mongoose.Schema.Types.ObjectId, 
  notes?: string
): Promise<IPipelineDeal> {
  this.currentStage = newStage;
  this.stageHistory.push({
    stage: newStage,
    date: new Date(),
    userId,
    notes: notes || `Stage updated to ${newStage}`
  });
  this.lastActivity = new Date();
  return this.save();
};

PipelineDealSchema.methods.updatePrice = function(
  newPrice: number, 
  source: 'USER' | 'AGENT' | 'API', 
  notes?: string
): Promise<IPipelineDeal> {
  if (newPrice !== this.askingPrice) {
    this.priceHistory.push({
      price: this.askingPrice, // Store old price in history
      date: new Date(),
      source,
      notes: notes || `Price updated from $${this.askingPrice} to $${newPrice}`
    });
    this.askingPrice = newPrice;
    this.lastActivity = new Date();
  }
  return this.save();
};

PipelineDealSchema.methods.linkAnalysis = function(
  analysisId: mongoose.Schema.Types.ObjectId,
  quickMetrics?: any
): Promise<IPipelineDeal> {
  this.analysisId = analysisId;
  this.analysisStatus = 'COMPLETE';
  
  // Cache quick metrics from V3 analysis
  if (quickMetrics) {
    this.quickMetrics = {
      dealQuality: quickMetrics.dealQuality,
      verdict: quickMetrics.verdict,
      cashFlow: quickMetrics.cashFlow,
      capRate: quickMetrics.capRate,
      cashOnCashReturn: quickMetrics.cashOnCashReturn
    };
  }
  
  this.lastActivity = new Date();
  return this.save();
};

// Static methods for common queries
PipelineDealSchema.statics.findByUser = function(
  userId: string, 
  filters?: any
): Promise<IPipelineDeal[]> {
  const query: any = { userId: new mongoose.Types.ObjectId(userId) };
  
  if (filters?.stage) query.currentStage = filters.stage;
  if (filters?.propertyType) query.propertyType = filters.propertyType;
  if (filters?.minPrice) query.askingPrice = { $gte: filters.minPrice };
  if (filters?.maxPrice) query.askingPrice = { ...query.askingPrice, $lte: filters.maxPrice };
  
  return this.find(query)
    .sort({ lastActivity: -1 })
    .populate('analysisId', 'propertyName analysis.investmentDecision')
    .exec();
};

PipelineDealSchema.statics.getKanbanData = function(
  userId: string
): Promise<{ [key: string]: IPipelineDeal[] }> {
  return Promise.all(
    Object.values(DealStage).map(stage => 
      this.find({ 
        userId: new mongoose.Types.ObjectId(userId), 
        currentStage: stage 
      })
      .sort({ lastActivity: -1 })
      .limit(50) // Limit per column for performance
      .exec()
    )
  ).then(results => {
    return Object.values(DealStage).reduce((acc, stage, index) => ({
      ...acc,
      [stage]: results[index]
    }), {});
  });
};

// Create and export the model
const PipelineDeal = mongoose.model<IPipelineDeal>('PipelineDeal', PipelineDealSchema);

export { PipelineDeal, PipelineDealSchema };
export default PipelineDeal;