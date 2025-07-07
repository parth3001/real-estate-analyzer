import mongoose, { Schema, Document } from 'mongoose';

/**
 * MongoDB cache entry for RentCast API responses
 * Provides persistent caching with automatic TTL expiration
 */
export interface IMarketDataCache extends Document {
  cacheKey: string;           // Unique identifier for cached data (e.g., "rent:123_main_st_austin_tx")
  cacheType: 'rent' | 'sales' | 'market';  // Type of cached data
  data: any;                  // Raw API response data
  source: string;             // API source (e.g., "RentCast")
  address?: string;           // Property address (for rent/sales cache)
  zipCode?: string;           // ZIP code (for market cache)
  createdAt: Date;            // When cache entry was created
  expiresAt: Date;            // When cache entry expires (TTL)
  version: number;            // Cache schema version for migrations
}

const MarketDataCacheSchema: Schema = new Schema({
  cacheKey: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  cacheType: {
    type: String,
    required: true,
    enum: ['rent', 'sales', 'market'],
    index: true
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  source: {
    type: String,
    required: true,
    default: 'RentCast'
  },
  address: {
    type: String,
    index: true  // For efficient queries by address
  },
  zipCode: {
    type: String,
    index: true  // For efficient queries by ZIP code
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 }  // MongoDB TTL index for automatic cleanup
  },
  version: {
    type: Number,
    default: 1
  }
}, {
  timestamps: false,  // We handle timestamps manually
  collection: 'marketDataCache'
});

// Compound indexes for efficient queries
MarketDataCacheSchema.index({ cacheType: 1, address: 1 });
MarketDataCacheSchema.index({ cacheType: 1, zipCode: 1 });
MarketDataCacheSchema.index({ source: 1, createdAt: -1 });

// Interface for static methods
interface IMarketDataCacheStatics extends mongoose.Model<IMarketDataCache> {
  findValidCache(cacheKey: string): Promise<IMarketDataCache | null>;
  createCacheEntry(
    cacheKey: string,
    cacheType: 'rent' | 'sales' | 'market',
    data: any,
    ttlHours: number,
    metadata?: { address?: string; zipCode?: string; source?: string }
  ): Promise<IMarketDataCache>;
  getCacheStats(): Promise<any[]>;
  clearExpiredCache(): Promise<{ deletedCount: number }>;
}

// Static methods for cache operations
MarketDataCacheSchema.statics.findValidCache = function(cacheKey: string) {
  return this.findOne({
    cacheKey,
    expiresAt: { $gt: new Date() }
  });
};

MarketDataCacheSchema.statics.createCacheEntry = function(
  cacheKey: string,
  cacheType: 'rent' | 'sales' | 'market',
  data: any,
  ttlHours: number,
  metadata: { address?: string; zipCode?: string; source?: string } = {}
) {
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + ttlHours);

  return this.findOneAndUpdate(
    { cacheKey },
    {
      cacheKey,
      cacheType,
      data,
      source: metadata.source || 'RentCast',
      address: metadata.address,
      zipCode: metadata.zipCode,
      createdAt: new Date(),
      expiresAt,
      version: 1
    },
    { upsert: true, new: true }
  );
};

MarketDataCacheSchema.statics.getCacheStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$cacheType',
        count: { $sum: 1 },
        avgAge: { $avg: { $subtract: [new Date(), '$createdAt'] } }
      }
    },
    {
      $project: {
        cacheType: '$_id',
        count: 1,
        avgAgeHours: { $divide: ['$avgAge', 1000 * 60 * 60] }
      }
    }
  ]);
};

MarketDataCacheSchema.statics.clearExpiredCache = function() {
  return this.deleteMany({
    expiresAt: { $lt: new Date() }
  });
};

export const MarketDataCache = mongoose.model<IMarketDataCache, IMarketDataCacheStatics>('MarketDataCache', MarketDataCacheSchema);