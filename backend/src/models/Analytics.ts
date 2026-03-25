import mongoose, { Schema, Document, Model } from 'mongoose';

// Event types for platform analytics
export type AnalyticsEventType =
  | 'calculator_completed'
  | 'wizard_completed'
  | 'user_registered'
  | 'user_login'
  | 'deal_analyzed'
  | 'deal_saved';

// Event metadata interfaces
export interface CalculatorMetadata {
  strategy: 'brrrr' | 'buy-hold';
  dealScore?: number;
  isAnonymous: boolean;
}

export interface RegistrationMetadata {
  source?: string;
  affiliateCode?: string;
}

export interface DealMetadata {
  dealId?: string;
  strategy?: 'brrrr' | 'buy-hold';
  dealScore?: number;
}

export interface WizardMetadata {
  strategy?: 'brrrr' | 'buy-hold';
  dealScore?: number;
  isAnonymous: boolean;
  propertyAddress?: string; // Full address string for easy querying
  purchasePrice?: number;
  monthlyRent?: number;
}

// Union type for all metadata
export type EventMetadata = CalculatorMetadata | RegistrationMetadata | DealMetadata | WizardMetadata | Record<string, any>;

// Analytics Event Interface
export interface IAnalyticsEvent extends Document {
  eventType: AnalyticsEventType;
  timestamp: Date;
  environment: 'development' | 'production' | 'test';
  userId?: mongoose.Types.ObjectId;
  metadata?: EventMetadata;
  createdAt: Date;
}

// Analytics Event Model Interface with static methods
export interface IAnalyticsEventModel extends Model<IAnalyticsEvent> {
  getEventCounts(
    eventTypes: AnalyticsEventType[],
    startDate: Date,
    endDate?: Date,
    environment?: 'development' | 'production'
  ): Promise<Record<string, number>>;

  getDailyEventCounts(
    eventType: AnalyticsEventType,
    startDate: Date,
    endDate?: Date
  ): Promise<any[]>;

  getUserEngagement(
    startDate: Date,
    endDate?: Date
  ): Promise<any[]>;
}

// Analytics Event Schema
const AnalyticsEventSchema = new Schema<IAnalyticsEvent>({
  eventType: {
    type: String,
    required: true,
    enum: ['calculator_completed', 'wizard_completed', 'user_registered', 'user_login', 'deal_analyzed', 'deal_saved'],
    index: true
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },
  environment: {
    type: String,
    enum: ['development', 'production', 'test'],
    required: true,
    index: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: false,
    index: true
  },
  metadata: {
    type: Schema.Types.Mixed,
    required: false
  }
}, {
  timestamps: { createdAt: true, updatedAt: false },
  collection: 'analytics_events'
});

// Compound index for fast event-type + environment + time-range queries
AnalyticsEventSchema.index({ eventType: 1, environment: 1, timestamp: -1 });

// Compound index for user-specific queries
AnalyticsEventSchema.index({ userId: 1, timestamp: -1 });

// TTL index - automatically delete events older than 2 years (730 days)
// This keeps the collection size manageable and complies with data retention policies
AnalyticsEventSchema.index({ timestamp: 1 }, { expireAfterSeconds: 63072000 }); // 730 days in seconds

// Static method to get event counts by type and date range
AnalyticsEventSchema.statics.getEventCounts = async function(
  eventTypes: AnalyticsEventType[],
  startDate: Date,
  endDate: Date = new Date(),
  environment?: 'development' | 'production'
) {
  const results = await this.aggregate([
    {
      $match: {
        eventType: { $in: eventTypes },
        timestamp: { $gte: startDate, $lte: endDate },
        ...(environment && { environment })
      }
    },
    {
      $group: {
        _id: '$eventType',
        count: { $sum: 1 }
      }
    }
  ]);

  // Convert to object with eventType as key
  const counts: Record<string, number> = {};
  results.forEach(result => {
    counts[result._id] = result.count;
  });

  // Ensure all requested event types have a count (default to 0)
  eventTypes.forEach(eventType => {
    if (counts[eventType] === undefined) {
      counts[eventType] = 0;
    }
  });

  return counts;
};

// Static method to get daily event counts (for trend analysis)
AnalyticsEventSchema.statics.getDailyEventCounts = async function(
  eventType: AnalyticsEventType,
  startDate: Date,
  endDate: Date = new Date()
) {
  return await this.aggregate([
    {
      $match: {
        eventType,
        timestamp: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$timestamp' },
          month: { $month: '$timestamp' },
          day: { $dayOfMonth: '$timestamp' }
        },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
    }
  ]);
};

// Static method to get user engagement metrics
AnalyticsEventSchema.statics.getUserEngagement = async function(
  startDate: Date,
  endDate: Date = new Date()
) {
  return await this.aggregate([
    {
      $match: {
        userId: { $exists: true },
        timestamp: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$userId',
        eventCount: { $sum: 1 },
        lastActivity: { $max: '$timestamp' }
      }
    },
    {
      $sort: { eventCount: -1 }
    }
  ]);
};

export const AnalyticsEvent = mongoose.model<IAnalyticsEvent, IAnalyticsEventModel>('AnalyticsEvent', AnalyticsEventSchema);
