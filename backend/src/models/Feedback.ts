/**
 * Feedback Model
 * MongoDB schema for beta user feedback collection
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface IFeedback extends Document {
  usefulnessRating: number;
  mostHelpfulFeature: string;
  easeOfUse: string;
  wouldRecommend: string;
  additionalFeedback: string;
  dealId?: string;
  propertyAddress?: string;
  submittedAt: Date;
  userId?: string; // Optional - for future user association
  userEmail?: string; // Optional - for follow-up
  createdAt: Date;
  updatedAt: Date;
}

const FeedbackSchema: Schema = new Schema(
  {
    usefulnessRating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      validate: {
        validator: Number.isInteger,
        message: 'Rating must be an integer between 1 and 5',
      },
    },
    mostHelpfulFeature: {
      type: String,
      required: false,
      enum: [
        'verdict',
        'metrics',
        'ai',
        'projections',
        'interactive',
        'tax',
        '',
      ],
    },
    easeOfUse: {
      type: String,
      required: false,
      enum: ['very-easy', 'easy', 'okay', 'difficult', 'very-difficult', ''],
    },
    wouldRecommend: {
      type: String,
      required: false,
      enum: ['definitely', 'probably', 'not-sure', 'probably-not', 'no', ''],
    },
    additionalFeedback: {
      type: String,
      required: false,
      maxlength: 2000,
      trim: true,
    },
    dealId: {
      type: String,
      required: false,
      index: true,
    },
    propertyAddress: {
      type: String,
      required: false,
      trim: true,
    },
    submittedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    userId: {
      type: String,
      required: false,
      index: true,
    },
    userEmail: {
      type: String,
      required: false,
      lowercase: true,
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: 'feedback',
  }
);

// Indexes for common queries
FeedbackSchema.index({ submittedAt: -1 });
FeedbackSchema.index({ usefulnessRating: 1 });
FeedbackSchema.index({ mostHelpfulFeature: 1 });

// Virtual for formatted submission date
FeedbackSchema.virtual('formattedDate').get(function () {
  return this.submittedAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
});

export default mongoose.model<IFeedback>('Feedback', FeedbackSchema);
