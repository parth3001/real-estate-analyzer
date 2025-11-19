import { MarketDataCache } from '../models/MarketDataCache';
import { logger } from '../utils/logger';

export class CacheService {
  private ttlHours: number;

  constructor() {
    this.ttlHours = parseInt(process.env.RENTCAST_CACHE_TTL_HOURS || '2880');
    logger.info(`CacheService initialized with ${this.ttlHours} hour TTL`);
  }

  private generateCacheKey(type: 'rent' | 'sales' | 'market', identifier: string): string {
    const normalized = identifier
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
    
    return `${type}:${normalized}`;
  }

  async get(type: 'rent' | 'sales' | 'market', identifier: string): Promise<any | null> {
    try {
      const cacheKey = this.generateCacheKey(type, identifier);
      const cached = await MarketDataCache.findValidCache(cacheKey);
      
      if (cached) {
        const ageHours = (Date.now() - cached.createdAt.getTime()) / (1000 * 60 * 60);
        logger.debug(`Cache hit for ${cacheKey} (age: ${ageHours.toFixed(1)}h)`);
        return cached.data;
      }
      
      logger.debug(`Cache miss for ${cacheKey}`);
      return null;
    } catch (error) {
      logger.error('Cache get operation failed:', error);
      return null;
    }
  }

  async set(
    type: 'rent' | 'sales' | 'market', 
    identifier: string, 
    data: any,
    metadata: { address?: string; zipCode?: string; source?: string } = {}
  ): Promise<void> {
    try {
      const cacheKey = this.generateCacheKey(type, identifier);
      
      await MarketDataCache.createCacheEntry(
        cacheKey,
        type,
        data,
        this.ttlHours,
        metadata
      );
      
      logger.debug(`Cached data for ${cacheKey} (TTL: ${this.ttlHours}h)`);
    } catch (error) {
      logger.error('Cache set operation failed:', error);
    }
  }

  async getRentCache(address: string): Promise<any | null> {
    return this.get('rent', address);
  }

  async setRentCache(address: string, data: any): Promise<void> {
    return this.set('rent', address, data, { address, source: 'RentCast' });
  }

  async getSalesCache(address: string): Promise<any | null> {
    return this.get('sales', address);
  }

  async setSalesCache(address: string, data: any): Promise<void> {
    return this.set('sales', address, data, { address, source: 'RentCast' });
  }

  async getMarketCache(zipCode: string): Promise<any | null> {
    return this.get('market', zipCode);
  }

  async setMarketCache(zipCode: string, data: any): Promise<void> {
    return this.set('market', zipCode, data, { zipCode, source: 'RentCast' });
  }

  /**
   * Get MF unit rent estimate from cache
   * Cache key format: "address_BR_BA_sqft"
   *
   * Story 3.1: Multi-Family Unit Rent Caching
   */
  async getMFUnitRentCache(
    address: string,
    bedrooms: number,
    bathrooms: number,
    squareFootage: number
  ): Promise<any | null> {
    const cacheKey = this.buildMFUnitCacheKey(address, bedrooms, bathrooms, squareFootage);
    return this.get('rent', cacheKey);
  }

  /**
   * Set MF unit rent estimate in cache
   * TTL: 30 days (720 hours) - rent data changes slowly
   */
  async setMFUnitRentCache(
    address: string,
    bedrooms: number,
    bathrooms: number,
    squareFootage: number,
    data: any
  ): Promise<void> {
    const cacheKey = this.buildMFUnitCacheKey(address, bedrooms, bathrooms, squareFootage);
    return this.set('rent', cacheKey, data, { address, source: 'RentCast MF Unit' });
  }

  /**
   * Build cache key for MF unit rent estimate
   * Format: "address_BR_BA_sqft"
   * Example: "4512-sycamore-st-dallas-tx_2BR_1BA_900sqft"
   */
  private buildMFUnitCacheKey(
    address: string,
    bedrooms: number,
    bathrooms: number,
    squareFootage: number
  ): string {
    const normalizedAddress = address
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    return `${normalizedAddress}_${bedrooms}BR_${bathrooms}BA_${squareFootage}sqft`;
  }

  async clearAll(): Promise<number> {
    try {
      const result = await MarketDataCache.deleteMany({});
      logger.info(`Cleared ${result.deletedCount} cache entries`);
      return result.deletedCount;
    } catch (error) {
      logger.error('Failed to clear cache:', error);
      throw error;
    }
  }

  async healthCheck(): Promise<{ status: string; message: string }> {
    try {
      const totalEntries = await MarketDataCache.countDocuments();
      return {
        status: 'healthy',
        message: `Cache service operational with ${totalEntries} entries`
      };
    } catch (error) {
      return {
        status: 'error',
        message: `Cache service failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async getStats(): Promise<any[]> {
    try {
      return await MarketDataCache.getCacheStats();
    } catch (error) {
      logger.error('Failed to get cache stats:', error);
      return [];
    }
  }

  async getTopKeys(limit: number = 10): Promise<any[]> {
    try {
      return await MarketDataCache.find({})
        .sort({ createdAt: -1 })
        .limit(limit)
        .select('cacheKey cacheType createdAt address zipCode source')
        .lean();
    } catch (error) {
      logger.error('Failed to get top cache keys:', error);
      return [];
    }
  }
}

export const cacheService = new CacheService();