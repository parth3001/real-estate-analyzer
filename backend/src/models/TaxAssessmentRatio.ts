/**
 * Tax Assessment Ratio Model
 * 
 * Stores official property tax assessment ratios by state and county
 * Used to calculate accurate property tax estimates by combining with RentCast historical data
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface ITaxAssessmentRatio extends Document {
  state: string;
  county?: string;
  assessmentRatio: number; // Decimal (e.g., 0.33 for 33%)
  effectiveDate: Date;
  source: string;
  sourceUrl: string;
  lastUpdated: Date;
  dataQuality: 'high' | 'medium' | 'low';
  notes?: string;
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

const TaxAssessmentRatioSchema: Schema = new Schema({
  state: {
    type: String,
    required: true,
    uppercase: true,
    minlength: 2,
    maxlength: 2,
    index: true
  },
  county: {
    type: String,
    required: false,
    trim: true,
    index: true
  },
  assessmentRatio: {
    type: Number,
    required: true,
    min: 0.01, // Minimum 1%
    max: 1.0,  // Maximum 100%
    validate: {
      validator: function(value: number) {
        return value > 0 && value <= 1;
      },
      message: 'Assessment ratio must be between 0.01 (1%) and 1.0 (100%)'
    }
  },
  effectiveDate: {
    type: Date,
    required: true,
    index: true
  },
  source: {
    type: String,
    required: true,
    enum: [
      'State Department of Revenue',
      'County Assessor',
      'Lincoln Institute',
      'IAAO',
      'State Legislature',
      'Municipal Code',
      'Other Official Source'
    ]
  },
  sourceUrl: {
    type: String,
    required: true,
    validate: {
      validator: function(url: string) {
        return /^https?:\/\/.+/.test(url);
      },
      message: 'Source URL must be a valid HTTP/HTTPS URL'
    }
  },
  lastUpdated: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },
  dataQuality: {
    type: String,
    required: true,
    enum: ['high', 'medium', 'low'],
    default: 'medium'
  },
  notes: {
    type: String,
    required: false,
    maxlength: 500
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt automatically
  collection: 'taxAssessmentRatios'
});

// Compound indexes for efficient querying
TaxAssessmentRatioSchema.index({ state: 1, county: 1 });
TaxAssessmentRatioSchema.index({ state: 1, effectiveDate: -1 });
TaxAssessmentRatioSchema.index({ lastUpdated: -1 });

// Instance methods
TaxAssessmentRatioSchema.methods.getAssessmentPercentage = function(): number {
  return this.assessmentRatio * 100;
};

TaxAssessmentRatioSchema.methods.isDataStale = function(monthsThreshold: number = 12): boolean {
  const thresholdDate = new Date();
  thresholdDate.setMonth(thresholdDate.getMonth() - monthsThreshold);
  return this.lastUpdated < thresholdDate;
};

TaxAssessmentRatioSchema.methods.getLocationDescription = function(): string {
  return this.county ? `${this.county} County, ${this.state}` : `${this.state} (State-wide)`;
};

// Static methods
TaxAssessmentRatioSchema.statics.findByLocation = function(state: string, county?: string) {
  const query: any = { state: state.toUpperCase() };
  if (county) {
    query.county = new RegExp(county, 'i'); // Case-insensitive county search
  }
  return this.find(query).sort({ effectiveDate: -1 });
};

TaxAssessmentRatioSchema.statics.findMostRecent = function(state: string, county?: string) {
  const query: any = { state: state.toUpperCase() };
  if (county) {
    query.county = new RegExp(county, 'i');
  }
  return this.findOne(query).sort({ effectiveDate: -1 });
};

TaxAssessmentRatioSchema.statics.findStaleData = function(monthsThreshold: number = 12) {
  const thresholdDate = new Date();
  thresholdDate.setMonth(thresholdDate.getMonth() - monthsThreshold);
  return this.find({ lastUpdated: { $lt: thresholdDate } }).sort({ lastUpdated: 1 });
};

TaxAssessmentRatioSchema.statics.getStatesCovered = function() {
  return this.distinct('state');
};

TaxAssessmentRatioSchema.statics.getCountiesByState = function(state: string) {
  return this.distinct('county', { 
    state: state.toUpperCase(),
    county: { $exists: true, $ne: null }
  });
};

// Pre-save middleware
TaxAssessmentRatioSchema.pre('save', function(next) {
  // Ensure state is uppercase
  this.state = this.state.toUpperCase();
  
  // Update lastUpdated timestamp
  this.lastUpdated = new Date();
  
  // Validate state format (2-letter US state code)
  const validStates = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
    'DC' // District of Columbia
  ];
  
  if (!validStates.includes(this.state)) {
    return next(new Error(`Invalid state code: ${this.state}. Must be a valid US state abbreviation.`));
  }
  
  next();
});

export const TaxAssessmentRatio = mongoose.model<ITaxAssessmentRatio>('TaxAssessmentRatio', TaxAssessmentRatioSchema);

export default TaxAssessmentRatio;