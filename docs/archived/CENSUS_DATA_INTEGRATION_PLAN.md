# US Census Data Integration Plan

After reviewing your codebase and documentation, I'll outline a comprehensive plan to integrate US Census data while following your existing architectural patterns. This integration will serve as a blueprint for future external data sources.

## 1. Architecture Analysis

Your application follows a clear separation of concerns:
- **Frontend**: React with TypeScript, Material UI
- **Backend**: Node.js/Express with TypeScript
- **Data Layer**: MongoDB for storage, API services for external data

The integration should maintain this separation while extending the system to incorporate external data sources.

## 2. Census Data Integration Plan

### 2.1. Backend Components

#### 2.1.1. Census API Service (`backend/src/services/censusService.ts`)
```typescript
// Service to handle all Census API interactions
import axios from 'axios';
import { logger } from '../utils/logger';
import { CensusDataResponse, CensusQueryParams } from '../types/census';

export class CensusService {
  private apiKey: string;
  private baseUrl: string;
  
  constructor() {
    this.apiKey = process.env.CENSUS_API_KEY || '';
    this.baseUrl = 'https://api.census.gov/data';
    
    if (!this.apiKey) {
      logger.warn('Census API key not found in environment variables');
    }
  }
  
  async getDemographicData(params: CensusQueryParams): Promise<CensusDataResponse> {
    // Implementation
  }
  
  async getIncomeData(params: CensusQueryParams): Promise<CensusDataResponse> {
    // Implementation
  }
  
  async getHousingData(params: CensusQueryParams): Promise<CensusDataResponse> {
    // Implementation
  }
}

export const censusService = new CensusService();
```

#### 2.1.2. Census Data Types (`backend/src/types/census.ts`)
```typescript
export interface CensusQueryParams {
  state?: string;
  county?: string;
  zip?: string;
  city?: string;
  tract?: string;
  year?: number;
  dataset?: string;
}

export interface CensusDataResponse {
  demographics?: DemographicData;
  income?: IncomeData;
  housing?: HousingData;
  // Additional categories as needed
}

export interface DemographicData {
  // Census demographic fields
}

// Other interfaces
```

#### 2.1.3. Census Data Controller (`backend/src/controllers/censusController.ts`)
```typescript
import { Request, Response } from 'express';
import { censusService } from '../services/censusService';
import { logger } from '../utils/logger';

export const getCensusData = async (req: Request, res: Response) => {
  try {
    const { zip, state, county, city } = req.query;
    // Implementation
  } catch (error) {
    logger.error('Error fetching census data:', error);
    res.status(500).json({ error: 'Failed to fetch census data' });
  }
};
```

#### 2.1.4. Census Routes (`backend/src/routes/censusRoutes.ts`)
```typescript
import express from 'express';
import { getCensusData } from '../controllers/censusController';

const router = express.Router();

router.get('/demographics', getCensusData);
// Additional routes as needed

export default router;
```

#### 2.1.5. Integration with Main App (`backend/src/index.ts`)
```typescript
// Add to existing routes
app.use('/api/census', censusRoutes);
```

#### 2.1.6. Cache Layer (`backend/src/utils/cacheManager.ts`)
```typescript
// Implementation of a caching layer to avoid redundant API calls
```

### 2.2. Data Integration Layer

#### 2.2.1. Property Enrichment Service (`backend/src/services/propertyEnrichmentService.ts`)
```typescript
// Service to enrich property data with census information
import { censusService } from './censusService';

export const enrichPropertyWithCensusData = async (propertyData: any) => {
  // Extract location data from property
  // Call census service
  // Merge and return enriched data
};
```

#### 2.2.2. Analysis Enhancement (`backend/src/services/analysisService.ts`)
```typescript
// Add census data to analysis results
```

#### 2.2.3. AI Prompt Enhancement (`backend/src/prompts/aiPrompts.ts`)
```typescript
// Update prompts to include census data for more informed AI analysis
```

### 2.3. Frontend Components

#### 2.3.1. Census Data Types (`frontend/src/types/census.ts`)
```typescript
// Mirror of backend types for frontend use
```

#### 2.3.2. Census Data Service (`frontend/src/services/censusService.ts`)
```typescript
import api from './api';
import { CensusDataResponse, CensusQueryParams } from '../types/census';

export const getCensusData = async (params: CensusQueryParams): Promise<CensusDataResponse> => {
  const response = await api.get('/census/demographics', { params });
  return response.data;
};
```

#### 2.3.3. Census Data Display Components
```typescript
// Components to display census data in the UI
```

#### 2.3.4. Integration with Property Analysis
```typescript
// Update analysis components to display census insights
```

## 3. Implementation Strategy

### 3.1. Phase 1: Core Integration
1. Set up Census API service
2. Implement basic data fetching
3. Create caching layer
4. Add simple API endpoints

### 3.2. Phase 2: Data Enrichment
1. Integrate census data with property analysis
2. Enhance AI prompts with census insights
3. Create data visualization components

### 3.3. Phase 3: Advanced Features
1. Implement comparative analysis (property vs. neighborhood)
2. Add trend analysis based on historical census data
3. Create predictive models using census data

## 4. Testing Strategy

1. **Unit Tests**: Test individual service methods
2. **Integration Tests**: Test API endpoints and data flow
3. **Mock Tests**: Use mock Census API responses for consistent testing
4. **Error Handling Tests**: Verify graceful handling of API failures

## 5. Documentation Updates

1. Update API documentation
2. Add Census data dictionary
3. Document integration patterns for future external data sources

## 6. Considerations for Future Integrations

This Census data integration will establish patterns for:
1. **Authentication**: Secure API key management
2. **Caching**: Efficient data retrieval and storage
3. **Error Handling**: Graceful degradation when external services fail
4. **Data Normalization**: Consistent data structures across sources
5. **Extensibility**: Easy addition of new data sources

## 7. Environment Configuration

1. Add Census API key to environment variables
2. Update deployment scripts for new environment variables
3. Add Census API configuration to render.yaml

This plan follows your existing architectural patterns while extending the system to incorporate valuable external data that will enhance property analysis and AI-driven insights. 