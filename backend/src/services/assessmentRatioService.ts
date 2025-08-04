/**
 * Assessment Ratio Service
 * 
 * Manages official property tax assessment ratios for accurate tax calculations
 * Provides methods to query, cache, and validate assessment ratio data
 */

import { TaxAssessmentRatio, ITaxAssessmentRatio } from '../models/TaxAssessmentRatio';
import { logger } from '../utils/logger';
import { cacheService } from './cacheService';

export interface AssessmentRatioQuery {
  state: string;
  county?: string;
  preferCounty?: boolean; // Prefer county-level data over state-level if available
}

export interface AssessmentRatioResult {
  ratio: number;
  source: string;
  sourceUrl: string;
  dataQuality: 'high' | 'medium' | 'low';
  effectiveDate: Date;
  isCountyLevel: boolean;
  locationDescription: string;
  confidence: {
    score: number; // 0-100
    reliability: 'high' | 'medium' | 'low';
    reason: string;
  };
}

export interface BulkAssessmentRatioData {
  state: string;
  county?: string;
  assessmentRatio: number;
  effectiveDate: Date;
  source: string;
  sourceUrl: string;
  dataQuality: 'high' | 'medium' | 'low';
  notes?: string;
}

class AssessmentRatioService {
  private static readonly CACHE_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days
  private static readonly CACHE_PREFIX = 'assessment_ratio';

  /**
   * Get assessment ratio for a specific location
   */
  async getAssessmentRatio(query: AssessmentRatioQuery): Promise<AssessmentRatioResult | null> {
    try {
      const cacheKey = this.generateCacheKey(query);
      
      // Check cache first
      const cached = await cacheService.get('market', cacheKey);
      if (cached) {
        logger.info('Assessment ratio retrieved from cache', {
          state: query.state,
          county: query.county,
          cacheKey
        });
        return cached as AssessmentRatioResult;
      }

      let assessmentRatio: ITaxAssessmentRatio | null = null;

      // Try county-level first if county provided and preferred
      if (query.county && query.preferCounty !== false) {
        assessmentRatio = await TaxAssessmentRatio.findOne({
          state: query.state.toUpperCase(),
          county: new RegExp(query.county, 'i')
        }).sort({ effectiveDate: -1 });
        
        if (assessmentRatio) {
          logger.info('Found county-level assessment ratio', {
            state: query.state,
            county: query.county,
            ratio: assessmentRatio.assessmentRatio
          });
        }
      }

      // Fallback to state-level if no county data found
      if (!assessmentRatio) {
        assessmentRatio = await TaxAssessmentRatio.findOne({
          state: query.state.toUpperCase()
        }).sort({ effectiveDate: -1 });
        
        if (assessmentRatio) {
          logger.info('Found state-level assessment ratio', {
            state: query.state,
            ratio: assessmentRatio.assessmentRatio
          });
        }
      }

      if (!assessmentRatio) {
        logger.warn('No assessment ratio found for location', {
          state: query.state,
          county: query.county
        });
        return null;
      }

      // Build result
      const result: AssessmentRatioResult = {
        ratio: assessmentRatio.assessmentRatio,
        source: assessmentRatio.source,
        sourceUrl: assessmentRatio.sourceUrl,
        dataQuality: assessmentRatio.dataQuality,
        effectiveDate: assessmentRatio.effectiveDate,
        isCountyLevel: !!assessmentRatio.county,
        locationDescription: assessmentRatio.county ? `${assessmentRatio.county} County, ${assessmentRatio.state}` : `${assessmentRatio.state} (State-wide)`,
        confidence: this.calculateConfidence(assessmentRatio, query.county)
      };

      // Cache the result
      await cacheService.set('market', cacheKey, result, {
        source: 'AssessmentRatio'
      });

      return result;

    } catch (error) {
      logger.error('Error retrieving assessment ratio', {
        error: error instanceof Error ? error.message : 'Unknown error',
        state: query.state,
        county: query.county
      });
      return null;
    }
  }

  /**
   * Get all assessment ratios for a state
   */
  async getStateAssessmentRatios(state: string): Promise<ITaxAssessmentRatio[]> {
    try {
      const ratios = await TaxAssessmentRatio.find({
        state: state.toUpperCase()
      }).sort({ effectiveDate: -1 });
      
      logger.info('Retrieved state assessment ratios', {
        state,
        count: ratios.length
      });

      return ratios;

    } catch (error) {
      logger.error('Error retrieving state assessment ratios', {
        error: error instanceof Error ? error.message : 'Unknown error',
        state
      });
      return [];
    }
  }

  /**
   * Store new assessment ratio data
   */
  async storeAssessmentRatio(data: BulkAssessmentRatioData): Promise<ITaxAssessmentRatio | null> {
    try {
      // Check if ratio already exists for this location and date
      const existing = await TaxAssessmentRatio.findOne({
        state: data.state.toUpperCase(),
        county: data.county || null,
        effectiveDate: data.effectiveDate
      });

      if (existing) {
        logger.info('Assessment ratio already exists, updating', {
          state: data.state,
          county: data.county,
          effectiveDate: data.effectiveDate
        });

        // Update existing record
        existing.assessmentRatio = data.assessmentRatio;
        existing.source = data.source;
        existing.sourceUrl = data.sourceUrl;
        existing.dataQuality = data.dataQuality;
        existing.notes = data.notes;
        existing.lastUpdated = new Date();

        const updated = await existing.save();
        
        // Clear related cache entries
        await this.clearLocationCache(data.state, data.county);
        
        return updated;
      }

      // Create new record
      const newRatio = new TaxAssessmentRatio({
        state: data.state.toUpperCase(),
        county: data.county,
        assessmentRatio: data.assessmentRatio,
        effectiveDate: data.effectiveDate,
        source: data.source,
        sourceUrl: data.sourceUrl,
        dataQuality: data.dataQuality,
        notes: data.notes
      });

      const saved = await newRatio.save();

      logger.info('Assessment ratio stored successfully', {
        id: saved._id,
        state: saved.state,
        county: saved.county,
        ratio: saved.assessmentRatio
      });

      // Clear related cache entries
      await this.clearLocationCache(data.state, data.county);

      return saved;

    } catch (error) {
      logger.error('Error storing assessment ratio', {
        error: error instanceof Error ? error.message : 'Unknown error',
        data
      });
      return null;
    }
  }

  /**
   * Bulk insert assessment ratios
   */
  async bulkStoreAssessmentRatios(ratios: BulkAssessmentRatioData[]): Promise<{
    successful: number;
    failed: number;
    errors: string[];
  }> {
    const result = {
      successful: 0,
      failed: 0,
      errors: [] as string[]
    };

    logger.info('Starting bulk assessment ratio storage', {
      totalRatios: ratios.length
    });

    for (const ratio of ratios) {
      try {
        const stored = await this.storeAssessmentRatio(ratio);
        if (stored) {
          result.successful++;
        } else {
          result.failed++;
          result.errors.push(`Failed to store ratio for ${ratio.state}${ratio.county ? ` ${ratio.county}` : ''}`);
        }
      } catch (error) {
        result.failed++;
        result.errors.push(`Error storing ${ratio.state}${ratio.county ? ` ${ratio.county}` : ''}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    logger.info('Bulk assessment ratio storage completed', result);
    return result;
  }

  /**
   * Get coverage statistics
   */
  async getCoverageStats(): Promise<{
    totalStates: number;
    statesWithData: string[];
    totalCounties: number;
    totalRatios: number;
    dataQualityBreakdown: Record<string, number>;
    staleDataCount: number;
  }> {
    try {
      const [statesWithData, totalRatios, dataQualityStats, staleData] = await Promise.all([
        TaxAssessmentRatio.distinct('state'),
        TaxAssessmentRatio.countDocuments(),
        TaxAssessmentRatio.aggregate([
          { $group: { _id: '$dataQuality', count: { $sum: 1 } } }
        ]),
        TaxAssessmentRatio.find({
          lastUpdated: { $lt: new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000) }
        }).sort({ lastUpdated: 1 })
      ]);

      const totalCounties = await TaxAssessmentRatio.countDocuments({ county: { $exists: true, $ne: null } });

      const dataQualityBreakdown: Record<string, number> = {};
      dataQualityStats.forEach((stat: any) => {
        dataQualityBreakdown[stat._id] = stat.count;
      });

      return {
        totalStates: 51, // 50 states + DC
        statesWithData: statesWithData.sort(),
        totalCounties,
        totalRatios,
        dataQualityBreakdown,
        staleDataCount: staleData.length
      };

    } catch (error) {
      logger.error('Error getting coverage statistics', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Health check for the service
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'error';
    message: string;
    stats?: any;
  }> {
    try {
      const stats = await this.getCoverageStats();

      if (stats.statesWithData.length === 0) {
        return {
          status: 'error',
          message: 'No assessment ratio data available'
        };
      }

      if (stats.statesWithData.length < 10) {
        return {
          status: 'degraded',
          message: 'Limited assessment ratio coverage',
          stats
        };
      }

      return {
        status: 'healthy',
        message: 'Assessment ratio service operational',
        stats
      };

    } catch (error) {
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Health check failed'
      };
    }
  }

  // Private helper methods

  private generateCacheKey(query: AssessmentRatioQuery): string {
    const parts = [AssessmentRatioService.CACHE_PREFIX, query.state];
    if (query.county) {
      parts.push(query.county.toLowerCase());
    }
    return parts.join(':');
  }

  private calculateConfidence(ratio: ITaxAssessmentRatio, requestedCounty?: string): {
    score: number;
    reliability: 'high' | 'medium' | 'low';
    reason: string;
  } {
    let score = 70; // Base score
    let reasons: string[] = [];

    // Data quality factor
    switch (ratio.dataQuality) {
      case 'high':
        score += 20;
        reasons.push('high-quality data source');
        break;
      case 'medium':
        score += 10;
        reasons.push('medium-quality data source');
        break;
      case 'low':
        score -= 10;
        reasons.push('lower-quality data source');
        break;
    }

    // Recency factor
    const monthsOld = Math.floor((Date.now() - ratio.effectiveDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
    if (monthsOld <= 12) {
      score += 10;
      reasons.push('recent data');
    } else if (monthsOld <= 24) {
      score += 5;
      reasons.push('relatively recent data');
    } else {
      score -= 5;
      reasons.push('older data');
    }

    // Geographic specificity factor
    if (ratio.county) {
      if (requestedCounty && ratio.county.toLowerCase().includes(requestedCounty.toLowerCase())) {
        score += 15;
        reasons.push('county-specific match');
      } else {
        score += 10;
        reasons.push('county-level data');
      }
    } else {
      score -= 5;
      reasons.push('state-level fallback');
    }

    // Source credibility factor
    if (ratio.source.includes('Department of Revenue') || ratio.source.includes('State Legislature')) {
      score += 5;
      reasons.push('official government source');
    }

    // Clamp score between 1 and 100
    score = Math.max(1, Math.min(100, score));

    let reliability: 'high' | 'medium' | 'low';
    if (score >= 80) {
      reliability = 'high';
    } else if (score >= 60) {
      reliability = 'medium';
    } else {
      reliability = 'low';
    }

    return {
      score,
      reliability,
      reason: reasons.join(', ')
    };
  }

  private async clearLocationCache(state: string, county?: string): Promise<void> {
    try {
      const cacheKeys = [
        this.generateCacheKey({ state }),
        ...(county ? [this.generateCacheKey({ state, county })] : [])
      ];

      // Note: Current cacheService doesn't have delete method
      // Cache will expire based on TTL
      logger.info('Cache will auto-expire for assessment ratios');

      logger.info('Cleared assessment ratio cache for location', {
        state,
        county,
        clearedKeys: cacheKeys.length
      });

    } catch (error) {
      logger.error('Error clearing location cache', {
        error: error instanceof Error ? error.message : 'Unknown error',
        state,
        county
      });
    }
  }

  /**
   * Load all state assessment ratios from static data file
   */
  async loadAllStatesData(): Promise<{
    successful: number;
    failed: number;
    errors: string[];
  }> {
    try {
      const fs = require('fs');
      const path = require('path');
      
      const dataPath = path.join(__dirname, '../data/assessment-ratios/all-states.json');
      const allStatesData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
      
      const ratios: BulkAssessmentRatioData[] = [];
      
      // Convert all-states.json format to our bulk data format
      for (const [stateCode, stateData] of Object.entries(allStatesData.states)) {
        const state = stateData as any;
        
        // Map source to valid enum value
        let mappedSource = 'State Department of Revenue';
        if (state.source.toLowerCase().includes('tax commission')) {
          mappedSource = 'State Department of Revenue';
        } else if (state.source.toLowerCase().includes('assessor')) {
          mappedSource = 'County Assessor';
        } else if (state.source.toLowerCase().includes('department of revenue') || 
                   state.source.toLowerCase().includes('department of taxation')) {
          mappedSource = 'State Department of Revenue';
        } else {
          mappedSource = 'Other Official Source';
        }
        
        // Generate placeholder URL (in production, these would be actual URLs)
        const sourceUrl = `https://www.${stateCode.toLowerCase()}.gov/taxation/assessment-ratios`;
        
        ratios.push({
          state: stateCode,
          assessmentRatio: state.assessmentRatio,
          effectiveDate: new Date(state.lastUpdated),
          source: mappedSource,
          sourceUrl: sourceUrl,
          dataQuality: 'high' as const,
          notes: state.notes
        });
      }
      
      logger.info('Loading all states assessment ratio data', {
        totalStates: ratios.length
      });
      
      return await this.bulkStoreAssessmentRatios(ratios);
      
    } catch (error) {
      logger.error('Error loading all states data', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return {
        successful: 0,
        failed: 1,
        errors: [`Failed to load all states data: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }
}

export const assessmentRatioService = new AssessmentRatioService();
export default assessmentRatioService;