/**
 * Assessment Ratio Collection Script
 * 
 * Automated data collection from authoritative sources for property tax assessment ratios
 * Supports multiple data sources and validation workflows
 */

import * as dotenv from 'dotenv';
import { assessmentRatioService } from '../services/assessmentRatioService';
import { BulkAssessmentRatioData } from '../services/assessmentRatioService';
import { logger } from '../utils/logger';
import { connectToDatabase } from '../config/database';
import axios from 'axios';
import * as fs from 'fs/promises';
import * as path from 'path';

// Load environment variables
dotenv.config();

export interface DataSource {
  name: string;
  type: 'api' | 'scraping' | 'manual' | 'file';
  url: string;
  description: string;
  coverageLevel: 'state' | 'county' | 'both';
  reliability: 'high' | 'medium' | 'low';
  updateFrequency: 'annually' | 'quarterly' | 'monthly' | 'as-needed';
  lastCollected?: Date;
}

export interface StateDataSource extends DataSource {
  state: string;
  extractionMethod: 'direct' | 'scraping' | 'manual';
  dataFormat: 'json' | 'csv' | 'html' | 'pdf' | 'xml';
  selectors?: {
    assessmentRatio?: string;
    county?: string;
    effectiveDate?: string;
  };
}

export class AssessmentRatioCollector {
  private readonly dataSourcesPath = path.join(__dirname, '../data/assessment-ratios');
  private readonly outputPath = path.join(__dirname, '../data/collected-ratios');

  constructor() {
    this.ensureDirectories();
  }

  /**
   * Collect assessment ratios for all configured states
   */
  async collectAllStates(): Promise<{
    successful: number;
    failed: number;
    errors: string[];
    collected: BulkAssessmentRatioData[];
  }> {
    // Initialize database connection
    await connectToDatabase();
    logger.info('Starting comprehensive assessment ratio collection');

    const result = {
      successful: 0,
      failed: 0,
      errors: [] as string[],
      collected: [] as BulkAssessmentRatioData[]
    };

    try {
      // Load all configured data sources
      const dataSources = await this.loadDataSources();
      
      for (const source of dataSources) {
        try {
          logger.info('Processing data source', {
            state: source.state,
            source: source.name,
            type: source.type
          });

          const stateData = await this.collectStateData(source);
          
          if (stateData.length > 0) {
            result.collected.push(...stateData);
            result.successful++;
            
            logger.info('Successfully collected state data', {
              state: source.state,
              ratiosCollected: stateData.length
            });
          } else {
            result.failed++;
            result.errors.push(`No data collected for ${source.state}`);
          }

        } catch (error) {
          result.failed++;
          const errorMsg = `Failed to collect data for ${source.state}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          result.errors.push(errorMsg);
          
          logger.error('State data collection failed', {
            state: source.state,
            error: errorMsg
          });
        }
      }

      // Store collected data
      if (result.collected.length > 0) {
        const storeResult = await assessmentRatioService.bulkStoreAssessmentRatios(result.collected);
        
        logger.info('Bulk storage completed', {
          totalCollected: result.collected.length,
          stored: storeResult.successful,
          failed: storeResult.failed
        });
      }

      logger.info('Assessment ratio collection completed', result);
      return result;

    } catch (error) {
      logger.error('Comprehensive collection failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Collect data for a specific state
   */
  async collectStateData(source: StateDataSource): Promise<BulkAssessmentRatioData[]> {
    switch (source.type) {
      case 'file':
        return this.collectFromFile(source);
      case 'api':
        return this.collectFromAPI(source);
      case 'scraping':
        return this.collectFromScraping(source);
      case 'manual':
        return this.collectFromManualEntry(source);
      default:
        throw new Error(`Unsupported data source type: ${source.type}`);
    }
  }

  /**
   * Collect data from local files (CSV, JSON)
   */
  private async collectFromFile(source: StateDataSource): Promise<BulkAssessmentRatioData[]> {
    try {
      const filePath = path.join(this.dataSourcesPath, `${source.state.toLowerCase()}.${source.dataFormat}`);
      
      logger.info('Reading data from file', {
        state: source.state,
        filePath
      });

      const fileContent = await fs.readFile(filePath, 'utf-8');
      
      switch (source.dataFormat) {
        case 'json':
          return this.parseJSONData(JSON.parse(fileContent), source);
        case 'csv':
          return this.parseCSVData(fileContent, source);
        default:
          throw new Error(`Unsupported file format: ${source.dataFormat}`);
      }

    } catch (error) {
      logger.error('File collection failed', {
        state: source.state,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return [];
    }
  }

  /**
   * Collect data from API endpoints
   */
  private async collectFromAPI(source: StateDataSource): Promise<BulkAssessmentRatioData[]> {
    try {
      logger.info('Fetching data from API', {
        state: source.state,
        url: source.url
      });

      const response = await axios.get(source.url, {
        timeout: 30000,
        headers: {
          'User-Agent': 'Real Estate Analyzer - Assessment Ratio Collector'
        }
      });

      return this.parseAPIResponse(response.data, source);

    } catch (error) {
      logger.error('API collection failed', {
        state: source.state,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return [];
    }
  }

  /**
   * Collect data from web scraping
   */
  private async collectFromScraping(source: StateDataSource): Promise<BulkAssessmentRatioData[]> {
    try {
      logger.info('Scraping data from website', {
        state: source.state,
        url: source.url
      });

      // For now, return empty array - scraping implementation would go here
      // This would require additional dependencies like Puppeteer or Cheerio
      logger.warn('Web scraping not yet implemented', {
        state: source.state
      });

      return [];

    } catch (error) {
      logger.error('Scraping collection failed', {
        state: source.state,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return [];
    }
  }

  /**
   * Load manually entered data
   */
  private async collectFromManualEntry(source: StateDataSource): Promise<BulkAssessmentRatioData[]> {
    try {
      const manualDataPath = path.join(this.dataSourcesPath, 'manual', `${source.state.toLowerCase()}.json`);
      
      logger.info('Loading manual data entry', {
        state: source.state,
        path: manualDataPath
      });

      const manualData = await fs.readFile(manualDataPath, 'utf-8');
      return this.parseJSONData(JSON.parse(manualData), source);

    } catch (error) {
      logger.error('Manual data collection failed', {
        state: source.state,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return [];
    }
  }

  /**
   * Initialize collection for a new state
   */
  async initializeStateCollection(state: string, sourceConfig: Partial<StateDataSource>): Promise<StateDataSource> {
    const defaultSource: StateDataSource = {
      name: `${state} Department of Revenue`,
      type: 'manual',
      url: '',
      description: `Property tax assessment ratios for ${state}`,
      coverageLevel: 'state',
      reliability: 'medium',
      updateFrequency: 'annually',
      state: state.toUpperCase(),
      extractionMethod: 'manual',
      dataFormat: 'json',
      ...sourceConfig
    };

    // Create initial data source configuration
    const configPath = path.join(this.dataSourcesPath, 'sources.json');
    let sources: StateDataSource[] = [];

    try {
      const existingSources = await fs.readFile(configPath, 'utf-8');
      sources = JSON.parse(existingSources);
    } catch (error) {
      // File doesn't exist, start with empty array
    }

    // Add new source if not exists
    const existingIndex = sources.findIndex(s => s.state === state.toUpperCase());
    if (existingIndex >= 0) {
      sources[existingIndex] = { ...sources[existingIndex], ...defaultSource };
    } else {
      sources.push(defaultSource);
    }

    await fs.writeFile(configPath, JSON.stringify(sources, null, 2));

    logger.info('Initialized state collection configuration', {
      state,
      sourceType: defaultSource.type
    });

    return defaultSource;
  }

  // Private helper methods

  private async ensureDirectories(): Promise<void> {
    const dirs = [
      this.dataSourcesPath,
      this.outputPath,
      path.join(this.dataSourcesPath, 'manual'),
      path.join(this.dataSourcesPath, 'api-cache')
    ];

    for (const dir of dirs) {
      try {
        await fs.mkdir(dir, { recursive: true });
      } catch (error) {
        // Directory might already exist
      }
    }
  }

  private async loadDataSources(): Promise<StateDataSource[]> {
    try {
      const configPath = path.join(this.dataSourcesPath, 'sources.json');
      const sourcesData = await fs.readFile(configPath, 'utf-8');
      return JSON.parse(sourcesData);
    } catch (error) {
      logger.warn('No data sources configuration found, using built-in defaults');
      return this.getBuiltInDataSources();
    }
  }

  private getBuiltInDataSources(): StateDataSource[] {
    return [
      {
        name: 'Texas Comptroller',
        type: 'manual',
        url: 'https://comptroller.texas.gov/taxes/property-tax/',
        description: 'Texas property tax assessment ratios',
        coverageLevel: 'state',
        reliability: 'high',
        updateFrequency: 'annually',
        state: 'TX',
        extractionMethod: 'manual',
        dataFormat: 'json'
      },
      {
        name: 'California State Board of Equalization',
        type: 'manual',
        url: 'https://www.boe.ca.gov/',
        description: 'California Proposition 13 assessment ratios',
        coverageLevel: 'state',
        reliability: 'high',
        updateFrequency: 'annually',
        state: 'CA',
        extractionMethod: 'manual',
        dataFormat: 'json'
      },
      {
        name: 'Illinois Department of Revenue',
        type: 'manual',
        url: 'https://www2.illinois.gov/rev/localgovsupport/property/Pages/default.aspx',
        description: 'Illinois property tax assessment ratios',
        coverageLevel: 'both',
        reliability: 'high',
        updateFrequency: 'annually',
        state: 'IL',
        extractionMethod: 'manual',
        dataFormat: 'json'
      }
    ];
  }

  private parseJSONData(data: any, source: StateDataSource): BulkAssessmentRatioData[] {
    try {
      const ratios: BulkAssessmentRatioData[] = [];

      if (Array.isArray(data)) {
        for (const item of data) {
          const ratio = this.extractRatioFromObject(item, source);
          if (ratio) ratios.push(ratio);
        }
      } else if (typeof data === 'object') {
        const ratio = this.extractRatioFromObject(data, source);
        if (ratio) ratios.push(ratio);
      }

      return ratios;

    } catch (error) {
      logger.error('JSON parsing failed', {
        state: source.state,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return [];
    }
  }

  private parseCSVData(csvContent: string, source: StateDataSource): BulkAssessmentRatioData[] {
    try {
      const lines = csvContent.split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      const ratios: BulkAssessmentRatioData[] = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        if (values.length >= headers.length) {
          const rowData: any = {};
          headers.forEach((header, index) => {
            rowData[header] = values[index];
          });

          const ratio = this.extractRatioFromObject(rowData, source);
          if (ratio) ratios.push(ratio);
        }
      }

      return ratios;

    } catch (error) {
      logger.error('CSV parsing failed', {
        state: source.state,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return [];
    }
  }

  private parseAPIResponse(data: any, source: StateDataSource): BulkAssessmentRatioData[] {
    // This would depend on the specific API response format
    // For now, delegate to JSON parsing
    return this.parseJSONData(data, source);
  }

  private extractRatioFromObject(obj: any, source: StateDataSource): BulkAssessmentRatioData | null {
    try {
      const assessmentRatio = this.parseAssessmentRatio(obj.assessmentRatio || obj.ratio || obj.assessment_ratio);
      
      if (!assessmentRatio || assessmentRatio <= 0 || assessmentRatio > 1) {
        return null;
      }

      return {
        state: source.state,
        county: obj.county || undefined,
        assessmentRatio,
        effectiveDate: obj.effectiveDate ? new Date(obj.effectiveDate) : new Date(),
        source: obj.source || 'State Department of Revenue',
        sourceUrl: source.url,
        dataQuality: source.reliability,
        notes: obj.notes || undefined
      };

    } catch (error) {
      logger.error('Object extraction failed', {
        state: source.state,
        error: error instanceof Error ? error.message : 'Unknown error',
        object: obj
      });
      return null;
    }
  }

  private parseAssessmentRatio(value: any): number | null {
    if (typeof value === 'number') {
      return value > 1 ? value / 100 : value; // Convert percentage to decimal if needed
    }
    
    if (typeof value === 'string') {
      // Handle percentage strings like "33%" or "0.33"
      const cleaned = value.replace('%', '').trim();
      const parsed = parseFloat(cleaned);
      
      if (isNaN(parsed)) return null;
      
      return parsed > 1 ? parsed / 100 : parsed;
    }

    return null;
  }
}

// CLI interface for manual execution
if (require.main === module) {
  const collector = new AssessmentRatioCollector();
  
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'collect-all':
      (async () => {
        try {
          await connectToDatabase();
          const result = await collector.collectAllStates();
          console.log('Collection completed:', result);
          process.exit(0);
        } catch (error) {
          console.error('Collection failed:', error);
          process.exit(1);
        }
      })();
      break;

    case 'init-state':
      const state = args[1];
      if (!state) {
        console.error('Usage: npm run collect-ratios init-state <STATE>');
        process.exit(1);
      }
      
      (async () => {
        try {
          const source = await collector.initializeStateCollection(state, {});
          console.log('State initialized:', source);
          process.exit(0);
        } catch (error) {
          console.error('State initialization failed:', error);
          process.exit(1);
        }
      })();
      break;

    default:
      console.log('Available commands:');
      console.log('  collect-all    - Collect assessment ratios for all configured states');
      console.log('  init-state <STATE> - Initialize collection configuration for a state');
      break;
  }
}

export default AssessmentRatioCollector;