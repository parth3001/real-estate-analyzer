# Real Estate Deal Analyzer - API Documentation

## Package Versions & Dependencies

### Frontend Dependencies
```json
{
  "dependencies": {
    "@emotion/react": "^11.11.0",
    "@emotion/styled": "^11.11.0",
    "@mui/icons-material": "^5.11.16",
    "@mui/material": "^5.13.0",
    "@mui/system": "^5.13.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-hook-form": "^7.45.0",
    "react-router-dom": "^6.11.1",
    "recharts": "^2.7.0",
    "typescript": "^4.9.5",
    "axios": "^1.4.0",
    "date-fns": "^2.30.0",
    "lodash": "^4.17.21"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^5.16.5",
    "@testing-library/react": "^14.0.0",
    "@testing-library/user-event": "^14.4.3",
    "@types/jest": "^29.5.1",
    "@types/node": "^20.1.3",
    "@types/react": "^18.2.6",
    "@types/react-dom": "^18.2.4",
    "@typescript-eslint/eslint-plugin": "^5.59.5",
    "@typescript-eslint/parser": "^5.59.5",
    "@vitejs/plugin-react": "^4.0.0",
    "eslint": "^8.40.0",
    "eslint-plugin-react": "^7.32.2",
    "jest": "^29.5.0",
    "prettier": "^2.8.8",
    "vite": "^4.4.0"
  }
}
```

### Backend Dependencies
```json
{
  "dependencies": {
    "@types/express": "^4.17.17",
    "@types/node": "^20.1.3",
    "cors": "^2.8.5",
    "dotenv": "^16.0.3",
    "express": "^4.18.2",
    "express-validator": "^7.0.1",
    "helmet": "^7.0.0",
    "joi": "^17.9.2",
    "morgan": "^1.10.0",
    "openai": "^3.2.1",
    "typescript": "^4.9.5",
    "winston": "^3.8.2"
  },
  "devDependencies": {
    "@types/cors": "^2.8.13",
    "@types/jest": "^29.5.1",
    "@types/morgan": "^1.9.4",
    "@types/supertest": "^2.0.12",
    "eslint": "^8.40.0",
    "jest": "^29.5.0",
    "nodemon": "^2.0.22",
    "supertest": "^6.3.3",
    "ts-jest": "^29.1.0",
    "ts-node": "^10.9.1"
  }
}
```

### System Requirements
- Node.js >= 18.x
- npm >= 9.x
- TypeScript >= 4.9.x

### Browser Support
- Chrome >= 100
- Firefox >= 100
- Safari >= 15
- Edge >= 100

## Table of Contents
1. [Frontend Components](#frontend-components)
2. [Backend Services](#backend-services)
3. [API Routes](#api-routes)
4. [Data Models](#data-models)
5. [Utility Functions](#utility-functions)
6. [AI Integration Architecture](#ai-integration-architecture)
7. [MongoDB Integration](#mongodb-integration)
8. [TypeScript Type System](#typescript-type-system)

## Frontend Components

### DealAnalysis Component
```typescript
/**
 * Main component for analyzing real estate deals.
 * Handles form submission, analysis calculation, and result display.
 * 
 * @component
 * @param {Object} props - Component props
 * @param {string} [props.dealId] - Optional ID of existing deal to load
 * @param {Function} props.onAnalysisComplete - Callback when analysis is complete
 * 
 * @example
 * <DealAnalysis 
 *   dealId="123"
 *   onAnalysisComplete={(result) => console.log(result)} 
 * />
 */
const DealAnalysis: React.FC<DealAnalysisProps>;
```

### AnalysisResults Component
```typescript
/**
 * Displays the results of a property analysis including metrics, 
 * projections, and AI insights.
 * 
 * @component
 * @param {Object} props - Component props
 * @param {AnalysisResult<KeyMetrics>} props.analysis - Analysis results to display
 * 
 * @example
 * <AnalysisResults analysis={analysisResult} />
 */
const AnalysisResults: React.FC<AnalysisResultsProps>;
```

### MultiFamilyForm Component
```typescript
/**
 * Form for inputting multi-family property details and assumptions.
 * 
 * @component
 * @param {Object} props - Component props
 * @param {Function} props.onSubmit - Form submission handler
 * @param {MultiFamilyData} [props.initialData] - Initial form data
 * 
 * @example
 * <MultiFamilyForm
 *   onSubmit={handleSubmit}
 *   initialData={existingData}
 * />
 */
const MultiFamilyForm: React.FC<MultiFamilyFormProps>;
```

## Backend Services

### BasePropertyAnalyzer
```typescript
/**
 * Abstract base class for property analysis.
 * Provides common analysis functionality for all property types.
 * 
 * @abstract
 * @class
 * @template T - Property data type extending BasePropertyData
 * @template U - Metrics type extending CommonMetrics
 */
abstract class BasePropertyAnalyzer<T extends BasePropertyData, U extends CommonMetrics> {
  /**
   * Calculates gross income for a given year.
   * 
   * @abstract
   * @param {number} year - Year number (1-based)
   * @returns {number} Gross income for the year
   */
  protected abstract calculateGrossIncome(year: number): number;

  /**
   * Calculates property-specific metrics.
   * 
   * @abstract
   * @returns {U} Property-specific metrics
   */
  protected abstract calculatePropertySpecificMetrics(): U;

  /**
   * Performs complete property analysis.
   * 
   * @returns {AnalysisResult<U>} Complete analysis results
   */
  public analyze(): AnalysisResult<U>;
}
```

### FinancialCalculations
```typescript
/**
 * Static utility class for financial calculations.
 * 
 * @class
 */
class FinancialCalculations {
  /**
   * Calculates monthly mortgage payment.
   * 
   * @static
   * @param {number} principal - Loan principal amount
   * @param {number} rate - Annual interest rate (as percentage)
   * @param {number} term - Loan term in years
   * @returns {number} Monthly payment amount
   */
  static calculateMonthlyMortgage(principal: number, rate: number, term: number): number;

  /**
   * Calculates Net Operating Income.
   * 
   * @static
   * @param {number} grossIncome - Annual gross income
   * @param {number} operatingExpenses - Annual operating expenses
   * @returns {number} Net Operating Income
   */
  static calculateNOI(grossIncome: number, operatingExpenses: number): number;

  /**
   * Calculates Capitalization Rate.
   * 
   * @static
   * @param {number} noi - Net Operating Income
   * @param {number} propertyValue - Property value
   * @returns {number} Cap rate as percentage
   */
  static calculateCapRate(noi: number, propertyValue: number): number;

  /**
   * Calculates Internal Rate of Return.
   * Uses Newton-Raphson method for approximation.
   * 
   * @static
   * @param {number[]} cashFlows - Array of cash flows
   * @returns {number} IRR as percentage
   */
  static calculateIRR(cashFlows: number[]): number;

  /**
   * Calculates Debt Service Coverage Ratio.
   * 
   * @static
   * @param {number} noi - Net Operating Income
   * @param {number} debtService - Annual debt service
   * @returns {number} DSCR ratio
   */
  static calculateDSCR(noi: number, debtService: number): number;
}
```

### AI Prompt Engineering

#### mfAnalysisPrompt (Multi-Family AI Analysis)
- **Purpose:**
  - Generates a detailed prompt for OpenAI to analyze multi-family property investments.
  - Uses only metrics and data already calculated by the backend analysis engine (e.g., DSCR, Cap Rate, Cash on Cash, NOI, unit mix, price per unit, etc.).
  - Does not recalculate any financial metrics; it simply formats and summarizes the results for the AI.
- **Prompt Content:**
  - Property details (address, units, square footage, year built, price per unit/sqft)
  - Unit mix breakdown
  - Financial metrics (purchase price, down payment, interest rate, loan term, mortgage, NOI, DSCR, Cap Rate, Cash on Cash)
  - Operating expenses (property management, vacancy, maintenance, utilities, common area)
  - Long-term assumptions (rent/expense growth, value appreciation, projection years, selling costs)
  - Requests a structured JSON response from the AI, including:
    ```json
    {
      "summary": "2-3 sentence summary of the investment opportunity",
      "strengths": ["strength1", "strength2", "strength3"],
      "weaknesses": ["weakness1", "weakness2", "weakness3"],
      "recommendations": ["recommendation1", "recommendation2", "recommendation3"],
      "unitMixAnalysis": "1-2 sentences analyzing if the unit mix is optimal",
      "marketPositionAnalysis": "1-2 sentences about the property's positioning in the market",
      "valueAddOpportunities": ["opportunity1", "opportunity2"],
      "investmentScore": 0-100,
      "recommendedHoldPeriod": "recommendation on how long to hold this property"
    }
    ```
- **Best Practice:**
  - All metrics in the prompt are sourced from the backend's analysis output, ensuring consistency and no redundant calculations.
  - The prompt function is a formatter, not a calculator.

## API Routes

### Deal Analysis Routes
```typescript
/**
 * Analyzes a property deal.
 * 
 * @route POST /api/deals/analyze
 * @param {Object} req.body - Request body
 * @param {string} req.body.propertyType - 'SFR' or 'MF'
 * @param {SFRData | MultiFamilyData} req.body.propertyData - Property data
 * @param {AnalysisAssumptions} req.body.assumptions - Analysis assumptions
 * @returns {AnalysisResult} Analysis results
 * @throws {ValidationError} If input data is invalid
 */
router.post('/analyze', analyzeDealController);

/**
 * Retrieves a saved deal.
 * 
 * @route GET /api/deals/:id
 * @param {string} req.params.id - Deal ID
 * @returns {Object} Deal and analysis data
 * @throws {NotFoundError} If deal not found
 */
router.get('/:id', getDealController);

/**
 * Saves a deal.
 * 
 * @route POST /api/deals/save
 * @param {Object} req.body - Request body
 * @param {Deal} req.body.deal - Deal data
 * @param {AnalysisResult} req.body.analysis - Analysis results
 * @returns {Object} Saved deal ID
 */
router.post('/save', saveDealController);
```

### AI Integration Routes
```typescript
/**
 * Generates AI insights for a property analysis.
 * 
 * @route POST /api/ai/analyze
 * @param {Object} req.body - Request body
 * @param {AnalysisResult} req.body.analysis - Analysis results
 * @param {PropertyData} req.body.propertyData - Property data
 * @param {MarketData} [req.body.marketData] - Optional market data
 * @returns {AIAnalyzeResponse} AI insights and recommendations
 * @throws {AIServiceError} If AI service fails
 */
router.post('/analyze', aiAnalyzeController);
```

## Data Models

### Property Data Types
```typescript
/**
 * Base interface for property data.
 * 
 * @interface
 */
interface BasePropertyData {
  /** Purchase price of the property */
  purchasePrice: number;
  /** Down payment amount */
  downPayment: number;
  /** Annual interest rate as percentage */
  interestRate: number;
  /** Loan term in years */
  loanTerm: number;
  /** Closing costs */
  closingCosts?: number;
  /** Repair/renovation costs */
  repairCosts?: number;
  /** Annual property tax amount */
  propertyTax: number;
  /** Annual insurance amount */
  insurance: number;
}

/**
 * Single-family residential property data.
 * 
 * @interface
 * @extends {BasePropertyData}
 */
interface SFRData extends BasePropertyData {
  /** Property type identifier */
  propertyType: 'SFR';
  /** Number of bedrooms */
  bedrooms: number;
  /** Number of bathrooms */
  bathrooms: number;
  /** Total square footage */
  squareFootage: number;
  /** Monthly rental income */
  monthlyRent: number;
  /** Year property was built */
  yearBuilt: number;
}

/**
 * Multi-family property data.
 * 
 * @interface
 * @extends {BasePropertyData}
 */
interface MultiFamilyData extends BasePropertyData {
  /** Property type identifier */
  propertyType: 'MF';
  /** Total number of units */
  totalUnits: number;
  /** Total square footage */
  totalSqft: number;
  /** Array of unit types and details */
  unitTypes: UnitType[];
  /** Year property was built */
  yearBuilt: number;
}
```

### Analysis Result Types
```typescript
/**
 * Complete analysis results.
 * 
 * @interface
 * @template T - Type of metrics extending CommonMetrics
 */
interface AnalysisResult<T extends CommonMetrics> {
  /** Monthly financial analysis */
  monthlyAnalysis: MonthlyAnalysis;
  /** Annual financial analysis */
  annualAnalysis: AnnualAnalysis;
  /** Property-specific metrics */
  metrics: T;
  /** Year-by-year projections */
  projections: YearlyProjection[];
  /** Exit strategy analysis */
  exitAnalysis: ExitAnalysis;
  /** Optional AI-generated insights */
  aiInsights?: AIInsights;
}
```

## Utility Functions

### Formatting Functions
```typescript
/**
 * Formats a number as currency.
 * 
 * @param {number} value - Number to format
 * @returns {string} Formatted currency string
 * 
 * @example
 * formatCurrency(1234.56) // "$1,235"
 */
const formatCurrency = (value: number): string;

/**
 * Formats a number as percentage.
 * 
 * @param {number} value - Number to format
 * @returns {string} Formatted percentage string
 * 
 * @example
 * formatPercentage(12.345) // "12.35%"
 */
const formatPercentage = (value: number): string;

/**
 * Formats a number with 2 decimal places.
 * 
 * @param {number} value - Number to format
 * @returns {string} Formatted decimal string
 * 
 * @example
 * formatDecimal(1.2345) // "1.23"
 */
const formatDecimal = (value: number): string;
```

### Validation Functions
```typescript
/**
 * Validates property data input.
 * 
 * @param {BasePropertyData} data - Property data to validate
 * @returns {ValidationResult} Validation result
 * @throws {ValidationError} If validation fails
 */
const validatePropertyData = (data: BasePropertyData): ValidationResult;

/**
 * Validates analysis assumptions.
 * 
 * @param {AnalysisAssumptions} assumptions - Analysis assumptions to validate
 * @returns {ValidationResult} Validation result
 * @throws {ValidationError} If validation fails
 */
const validateAssumptions = (assumptions: AnalysisAssumptions): ValidationResult;
```

### Error Handling
```typescript
/**
 * Custom API error class.
 * 
 * @class
 * @extends {Error}
 */
class APIError extends Error {
  /**
   * Creates an API error.
   * 
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code
   */
  constructor(message: string, statusCode: number);
}

/**
 * Validation error class.
 * 
 * @class
 * @extends {APIError}
 */
class ValidationError extends APIError {
  /**
   * Creates a validation error.
   * 
   * @param {ValidationErrorDetail[]} errors - Validation error details
   */
  constructor(errors: ValidationErrorDetail[]);
}
```

## Backend Workflow (2025-06-03 Update)
- The backend now uses a TypeScript-first workflow: development and server startup use `ts-node` and `nodemon` directly on TypeScript source files (no manual JS compilation needed).
- `.env` is loaded at the very top of `src/index.ts` to ensure environment variables are available for all modules.
- All old JS files in `src/` have been removed to prevent stale code from being loaded.

## Backend Architecture

### Controller-Service Pattern
The application follows a modern controller-service pattern:

```typescript
// Example: deals.ts controller
import { Request, Response } from 'express';
import { analyzeSFRProperty, analyzeMFProperty } from '../services/analysisService';
import { PropertyType } from '../types/propertyTypes';

export const analyzeDeal = async (req: Request, res: Response) => {
  try {
    const { propertyType, propertyData } = req.body;
    
    if (propertyType === 'SFR') {
      const analysis = await analyzeSFRProperty(propertyData);
      return res.json(analysis);
    } else if (propertyType === 'MF') {
      const analysis = await analyzeMFProperty(propertyData);
      return res.json(analysis);
    }
    
    return res.status(400).json({ error: 'Invalid property type' });
  } catch (error) {
    logger.error('Error analyzing deal:', error);
    return res.status(500).json({ error: 'Server error' });
  }
};
```

Key components:
- **Controllers**: Handle HTTP requests/responses and parameter validation
- **Services**: Contain business logic and coordinate between different utilities
- **Utilities**: Provide reusable functions and calculations
- **Types**: Define TypeScript interfaces and types for the application
- **Routes**: Map endpoints to controller methods

## AI Integration Architecture

### Model Context Protocol (MCP)
The application uses a "Model Context Protocol" architecture for AI integration, which separates concerns between:
- Context building (gathering and structuring input data)
- Prompt engineering (crafting optimal prompts)
- Service integration (handling API calls and responses)

```typescript
// Context builder for AI analysis (MCP architecture)
export async function buildSFRContext(dealData: any, analysis: any) {
  // Future integrations with external data sources
  // const crexiData = await getCrexiData(dealData.propertyAddress);
  // const censusData = await getCensusData(dealData.propertyAddress);
  return {
    ...dealData,
    ...analysis,
    // crexiData,
    // censusData,
  };
}
```

### Prompt Engineering System
The application centralizes all AI prompts in the `aiPrompts.ts` module, which contains specialized prompt templates for different property types:

```typescript
// aiPrompts.ts - Central repository for all AI prompts
export function sfrAnalysisPrompt(dealData: any, analysis: any): string {
  // Calculate metrics for the prompt
  const downPaymentPercent = (dealData.downPayment / dealData.purchasePrice) * 100;
  const monthlyMortgage = analysis?.monthlyAnalysis?.expenses?.mortgage?.total ?? 0;
  const monthlyNOI = (analysis?.monthlyAnalysis?.cashFlow ?? 0) + monthlyMortgage;
  
  return `Analyze this single-family rental property investment:

  PROPERTY DETAILS:
  - Purchase Price: $${dealData.purchasePrice}
  - Down Payment: $${dealData.downPayment} (${downPaymentPercent.toFixed(1)}%)
  - Monthly Rent: $${dealData.monthlyRent}
  ...
  `;
}

export function mfAnalysisPrompt(dealData: any, analysis: any): string {
  // Multi-family specific prompt logic
  // ...
}
```

All services that need to generate AI prompts import these specialized functions, ensuring consistency across the application:

```typescript
// aiService.ts - Using the centralized prompts
import { sfrAnalysisPrompt, mfAnalysisPrompt } from '../prompts/aiPrompts';

export async function getAIInsights(dealData: SFRData | MultiFamilyData, analysis: any): Promise<AIInsights> {
  // Generate prompt based on property type using specialized prompts
  let prompt: string;
  if (dealData.propertyType === 'SFR') {
    prompt = sfrAnalysisPrompt(dealData, analysis);
  } else {
    prompt = mfAnalysisPrompt(dealData, analysis);
  }
  
  // Make OpenAI API call with the prompt
  // ...
}
```

### OpenAI Integration
OpenAI integration is managed through a dedicated service:

```typescript
// OpenAI client singleton pattern
let openaiClient: OpenAI | null = null;

export const getOpenAIClient = (): OpenAI | null => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      logger.warn('OpenAI API key not found in environment variables');
      return null;
    }

    if (!openaiClient) {
      openaiClient = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
      logger.info('OpenAI client initialized successfully');
    }

    return openaiClient;
  } catch (error) {
    logger.error('Error initializing OpenAI:', error);
    return null;
  }
};
```

Key features:
- Singleton pattern to prevent multiple client instances
- Graceful handling of missing API keys
- Detailed error logging
- Response parsing and error handling
- Support for both GPT-4 and GPT-3.5-turbo

## MongoDB Integration

The application now uses MongoDB for data persistence instead of the file-based storage system. This provides several benefits:

1. **Improved Scalability**: MongoDB can handle large amounts of data and concurrent users.
2. **Better Query Performance**: MongoDB's query capabilities allow for more complex and efficient data retrieval.
3. **Schema Flexibility**: The document-based nature of MongoDB works well with the varied property types in the application.
4. **Data Integrity**: MongoDB's ACID transactions ensure data integrity.
5. **Replication and Failover**: MongoDB provides built-in replication for high availability.

### MongoDB Schema

The application uses a comprehensive MongoDB schema for deal data:

```typescript
const DealSchema = new Schema({
  propertyName: { type: String, required: true },
  propertyType: { type: String, enum: ['SFR', 'MF'], required: true },
  propertyAddress: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true }
  },
  purchasePrice: { type: Number, required: true },
  // Additional property fields...
  
  // Analysis results
  analysis: {
    monthlyAnalysis: { /* Monthly analysis fields */ },
    annualAnalysis: { /* Annual analysis fields */ },
    longTermAnalysis: { /* Long-term analysis fields */ },
    keyMetrics: { /* Key metrics fields */ },
    aiInsights: { /* AI insights fields */ }
  },
  
  // Metadata
  userId: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
```

### Repository Pattern

The application uses a repository pattern to interact with MongoDB:

```typescript
// Repository example
export class DealRepository {
  async findById(id: string): Promise<IDeal | null> {
    return await Deal.findById(id);
  }
  
  async findAll(userId?: string): Promise<IDeal[]> {
    const query = userId ? { userId } : {};
    return await Deal.find(query).sort({ updatedAt: -1 });
  }
  
  async create(dealData: SFRData | MultiFamilyData, analysis: AnalysisResult<CommonMetrics>, userId?: string): Promise<IDeal> {
    const newDeal = new Deal({
      ...dealData,
      analysis,
      userId,
    });
    return await newDeal.save();
  }
  
  // Additional repository methods...
}
```

### Service Layer

The service layer uses the repository to implement business logic:

```typescript
export class DealService {
  private dealRepository: DealRepository;

  constructor() {
    this.dealRepository = new DealRepository();
  }

  async getDealById(id: string): Promise<IDeal | null> {
    return await this.dealRepository.findById(id);
  }
  
  async saveDeal(dealData: SFRData | MultiFamilyData, analysis: AnalysisResult<CommonMetrics>, userId?: string): Promise<IDeal> {
    // If the deal has an ID, update it, otherwise create a new one
    if (dealData.id) {
      const updatedDeal = await this.dealRepository.update(dealData.id, dealData, analysis);
      if (!updatedDeal) {
        throw new Error(`Deal with ID ${dealData.id} not found`);
      }
      return updatedDeal;
    }
    
    return await this.dealRepository.create(dealData, analysis, userId);
  }
  
  // Additional service methods...
}
```

### MongoDB Connection Configuration

The application connects to MongoDB using the following configuration:

```typescript
export const connectToDatabase = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    
    // Connection options
    const options = {
      autoIndex: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };
    
    // Connect to MongoDB
    await mongoose.connect(mongoUri, options);
    logger.info('✅ Connected to MongoDB successfully');
    
    // Additional event handlers...
  } catch (error) {
    logger.error('Failed to connect to MongoDB:', error);
    throw error;
  }
};
```

### Setting Up MongoDB

To use MongoDB with the application:

1. Install MongoDB locally or use MongoDB Atlas (cloud-hosted solution).
2. Create a `.env` file with your MongoDB connection string:
   ```
   MONGODB_URI=mongodb://localhost:27017/real-estate-analyzer
   ```
   
   For MongoDB Atlas, use:
   ```
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/real-estate-analyzer?retryWrites=true&w=majority
   ```

3. The application will automatically connect to MongoDB on startup.

## Financial Calculation Engine

The application includes a comprehensive financial calculation engine implemented as a static TypeScript class:

```typescript
export class FinancialCalculations {
  /**
   * Calculate monthly mortgage payment
   */
  static calculateMortgage(principal: number, annualRate: number, years: number): number {
    const monthlyRate = annualRate / 12 / 100;
    const numPayments = years * 12;
    if (monthlyRate === 0) return principal / numPayments;
    return (principal * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
           (Math.pow(1 + monthlyRate, numPayments) - 1);
  }

  /**
   * Calculate Net Operating Income (NOI)
   */
  static calculateNOI(effectiveGrossIncome: number, operatingExpenses: number): number {
    return effectiveGrossIncome - operatingExpenses;
  }

  /**
   * Calculate Cap Rate
   */
  static calculateCapRate(noi: number, purchasePrice: number): number {
    if (!purchasePrice) return 0;
    return (noi / purchasePrice) * 100;
  }

  /**
   * Calculate Internal Rate of Return (IRR)
   */
  static calculateIRR(cashFlows: number[]): number {
    // Implementation using Newton-Raphson method
  }
  
  // Additional financial calculations...
}
```

Key features:
- Well-documented methods with proper TypeScript types
- Specialized calculations for real estate metrics
- Support for both SFR and MF property types
- Threshold values for performance benchmarking
- Advanced calculations like IRR and DSCR

## TypeScript Type System

The application uses a comprehensive TypeScript type system for data validation and structure:

```typescript
// Core property types
export type PropertyType = 'SFR' | 'MF';

export interface BasePropertyData {
  propertyType: PropertyType;
  purchasePrice: number;
  downPayment: number;
  interestRate: number;
  loanTerm: number;
  propertyTaxRate: number;
  insuranceRate: number;
  maintenanceCost: number;
  propertyManagementRate: number;
  propertyAddress: PropertyAddress;
  closingCosts?: number;
}

export interface SFRData extends BasePropertyData {
  propertyType: 'SFR';
  monthlyRent: number;
  squareFootage: number;
  bedrooms: number;
  bathrooms: number;
  yearBuilt: number;
  // Additional SFR-specific fields
}

export interface MultiFamilyData extends BasePropertyData {
  propertyType: 'MF';
  totalUnits: number;
  totalSqft: number;
  unitTypes: Array<{
    type: string;
    count: number;
    sqft: number;
    monthlyRent: number;
  }>;
  // Additional MF-specific fields
}

// Analysis result types
export interface AnalysisResult<T extends CommonMetrics> {
  monthlyAnalysis: MonthlyAnalysis;
  annualAnalysis: AnnualAnalysis;
  metrics: T;
  projections: YearlyProjection[];
  exitAnalysis: ExitAnalysis;
  aiInsights?: AIInsights;
}

export interface AIInsights {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  investmentScore: number | null;
}
```

Key features:
- Generic types for analysis results
- Property-type specific interfaces
- Comprehensive financial metrics types
- AI analysis result structures
- Shared base interfaces 