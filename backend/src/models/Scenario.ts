import mongoose, { Schema, Document } from 'mongoose';
import type { Analysis } from './Deal';

// Scenario interface following existing Deal model patterns
export interface IScenario extends Document {
  userId: mongoose.Schema.Types.ObjectId;
  dealId: mongoose.Schema.Types.ObjectId; // Reference to the original deal
  name: string;
  description?: string;
  
  // Complete snapshot of property data at save time (follows Complete Storage Architecture)
  propertyData: any; // Store the full SFRPropertyData object
  
  // Complete snapshot of analysis at save time (follows Complete Storage Architecture)
  analysis: Analysis;
  
  // Organization metadata
  isFavorite: boolean;
  tags?: string[];
  
  // System metadata (following existing Deal model pattern)
  createdAt: Date;
  lastModified: Date;
}

// Scenario schema following existing Deal model patterns and Complete Storage Architecture
const ScenarioSchema = new Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true // For efficient user-based queries
  },
  dealId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Deal', 
    required: true,
    index: true // For efficient deal-based queries
  },
  name: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 100
  },
  description: { 
    type: String, 
    trim: true,
    maxlength: 500
  },
  
  // Complete Storage Architecture: Store complete property data snapshot
  // This ensures scenarios capture the exact state when saved (following established patterns)
  propertyData: {
    type: Schema.Types.Mixed,
    required: true
  },
  
  // Complete Storage Architecture: Store complete analysis snapshot  
  // This follows the same pattern as Deal model for fast loading (<1s)
  analysis: {
    type: Schema.Types.Mixed,
    required: true
  },
  
  // Organization fields for scenario management
  isFavorite: { 
    type: Boolean, 
    default: false 
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: 30
  }],
  
  // Timestamps (following existing Deal model pattern)
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  lastModified: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true, // Automatic createdAt/updatedAt management
  // Compound indexes for efficient queries (following existing patterns)
  indexes: [
    { userId: 1, dealId: 1 }, // User's scenarios for a specific deal
    { userId: 1, createdAt: -1 }, // User's scenarios sorted by creation
    { userId: 1, isFavorite: -1, createdAt: -1 } // User's favorite scenarios
  ]
});

// Pre-save middleware to update lastModified (following existing patterns)
ScenarioSchema.pre('save', function(next) {
  this.lastModified = new Date();
  next();
});

// Create and export the model (following existing naming conventions)
export const ScenarioModel = mongoose.model<IScenario>('Scenario', ScenarioSchema);