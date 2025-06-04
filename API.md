# Real Estate Analyzer API Documentation

## Overview
This document outlines the API interfaces, calculations, and data structures used in the Real Estate Analyzer application.

## Data Structures

### Analysis Interface
The core analysis interface that represents a complete property analysis:

```typescript
interface Analysis {
  monthlyAnalysis: MonthlyAnalysis;
  annualAnalysis: AnnualAnalysis;
  longTermAnalysis: LongTermAnalysis;
  keyMetrics: KeyMetrics;
  aiInsights?: AIInsights;
}
```

### Monthly Analysis
Represents monthly financial metrics:
```typescript
interface MonthlyAnalysis {
  expenses: {
    rent?: number;
    propertyTax?: number;
    insurance?: number;
    maintenance?: number;
    propertyManagement?: number;
    vacancy?: number;
    realtorBrokerageFee?: number;
    mortgage?: {
      total: number;
      principal: number;
      interest: number;
    };
    total?: number;
  };
  cashFlow: number;
  cashFlowAfterTax: number;
}
```

### Annual Analysis
Represents annual financial metrics:
```typescript
interface AnnualAnalysis {
  dscr: number;              // Debt Service Coverage Ratio
  cashOnCashReturn: number;  // Cash on Cash Return (%)
  capRate: number;           // Capitalization Rate (%)
  totalInvestment: number;   // Total Investment Amount
  annualNOI: number;        // Net Operating Income
  annualDebtService: number; // Annual Mortgage Payment
  effectiveGrossIncome: number; // Gross Income after Vacancy
}
```

### Long Term Analysis
Represents long-term projections and returns:
```typescript
interface LongTermAnalysis {
  yearlyProjections: YearlyProjection[];
  projectionYears: number;
  returns: {
    irr: number;             // Internal Rate of Return
    totalCashFlow: number;   // Total Cash Flow over Hold Period
    totalAppreciation: number; // Total Property Value Appreciation
    totalReturn: number;     // Total Return on Investment
  };
  exitAnalysis: {
    projectedSalePrice: number;
    sellingCosts: number;
    mortgagePayoff: number;
    netProceedsFromSale: number;
  };
}
```

### Yearly Projection
Individual year metrics in long-term analysis:
```typescript
interface YearlyProjection {
  year: number;
  cashFlow: number;
  propertyValue: number;
  equity: number;
  propertyTax: number;
  insurance: number;
  maintenance: number;
  propertyManagement: number;
  vacancy: number;
  realtorBrokerageFee: number;
  operatingExpenses: number;
  noi: number;
  debtService: number;
  grossRent: number;
  mortgageBalance: number;
  appreciation: number;
  totalReturn: number;
  capitalInvestment?: number;
}
```

## Calculations

### Monthly Calculations

1. **Monthly Mortgage Payment**
   ```javascript
   const monthlyPayment = (principal, annualRate, years) => {
     const monthlyRate = annualRate / 12 / 100;
     const numPayments = years * 12;
     return (principal * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
            (Math.pow(1 + monthlyRate, numPayments) - 1);
   };
   ```

2. **Monthly Operating Expenses**
   ```javascript
   const monthlyOperatingExpenses = 
     propertyTax + 
     insurance + 
     maintenance + 
     propertyManagement + 
     vacancy + 
     realtorBrokerageFee;
   ```

### Annual Calculations

1. **Cap Rate**
   ```javascript
   const capRate = (annualNOI, purchasePrice) => {
     return (annualNOI / purchasePrice) * 100;
   };
   ```

2. **Cash on Cash Return**
   ```javascript
   const cashOnCash = (annualCashFlow, totalInvestment) => {
     return (annualCashFlow / totalInvestment) * 100;
   };
   ```

3. **DSCR (Debt Service Coverage Ratio)**
   ```javascript
   const dscr = (annualNOI, annualDebtService) => {
     return annualNOI / annualDebtService;
   };
   ```

### Long-term Calculations

1. **Internal Rate of Return (IRR)**
   ```javascript
   const calculateIRR = (cashFlows) => {
     // Newton-Raphson method implementation
     // Returns IRR as percentage
   };
   ```

2. **Equity Growth**
   ```javascript
   const equityGrowth = (propertyValue, mortgageBalance) => {
     return propertyValue - mortgageBalance;
   };
   ```

## API Endpoints

### Property Analysis

#### Analyze Deal
```
POST /api/deals/analyze
```

Request Body:
```typescript
interface DealData {
  propertyName: string;
  propertyAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  purchasePrice: number;
  downPayment: number;
  interestRate: number;
  loanTerm: number;
  capitalInvestment: number;
  monthlyRent: number;
  propertyTaxRate: number;
  insuranceRate: number;
  maintenance: number;
  realtorBrokerageFee: number;
  sfrDetails: {
    bedrooms: number;
    bathrooms: number;
    squareFootage: number;
    yearBuilt: number;
    propertyManagement: {
      feePercentage: number;
    };
    longTermAssumptions: {
      projectionYears: number;
      annualRentIncrease: number;
      annualPropertyValueIncrease: number;
      sellingCostsPercentage: number;
      inflationRate: number;
      vacancyRate: number;
    };
  };
}
```

Response: Analysis object (as defined above)

## Error Handling

### HTTP Status Codes
- 200: Successful analysis
- 400: Invalid input data
- 500: Server error during calculation

### Error Response Format
```typescript
interface ErrorResponse {
  error: string;
  details?: {
    field: string;
    message: string;
  }[];
  code?: string; // Added for more specific error identification
}
```

## Best Practices

1. **Input Validation**
   - All monetary values should be positive numbers
   - Percentages should be between 0 and 100
   - Required fields must not be null or undefined

2. **Calculation Accuracy**
   - All monetary calculations should be rounded to 2 decimal places
   - Percentages should be rounded to 2 decimal places
   - IRR calculations should use the Newton-Raphson method for accuracy

3. **Default Values**
   - Vacancy Rate: 5%
   - Property Management Fee: 8%
   - Realtor Brokerage Fee: 8.33% (one month's rent)
   - Loan Term: 30 years
   - Inflation Rate: 2%

## Component Integration

### AnalysisResults Component
```typescript
interface AnalysisResultsProps {
  analysis: Analysis;
}
```

Default values for Analysis object:
```typescript
const defaultAnalysis: Analysis = {
  monthlyAnalysis: {
    expenses: {},
    cashFlow: 0,
    cashFlowAfterTax: 0
  },
  annualAnalysis: {
    dscr: 0,
    cashOnCashReturn: 0,
    capRate: 0,
    totalInvestment: 0,
    annualNOI: 0,
    annualDebtService: 0,
    effectiveGrossIncome: 0
  },
  longTermAnalysis: {
    yearlyProjections: [],
    projectionYears: 0,
    returns: {
      irr: 0,
      totalCashFlow: 0,
      totalAppreciation: 0,
      totalReturn: 0
    },
    exitAnalysis: {
      projectedSalePrice: 0,
      sellingCosts: 0,
      mortgagePayoff: 0,
      netProceedsFromSale: 0
    }
  },
  keyMetrics: {
    pricePerSqFtAtPurchase: 0,
    pricePerSqFtAtSale: 0,
    avgRentPerSqFt: 0
  }
};
```

## AI Integration

### OpenAI Configuration
```typescript
interface AIInsights {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  investmentScore: number | null;
}

// OpenAI client initialization
const getOpenAIClient = (): OpenAI | null => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return null;
    }
    return new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  } catch (error) {
    console.error('Error initializing OpenAI:', error);
    return null;
  }
};

// AI Insights Response Format
interface AIResponse {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  investmentScore: number | null;
}
```

### Error Handling Updates
```typescript
interface ErrorResponse {
  error: string;
  details?: {
    field: string;
    message: string;
  }[];
  code?: string; // Added for more specific error identification
}

// Example error responses:
const aiUnavailableError = {
  error: 'AI Insights Unavailable',
  code: 'AI_UNAVAILABLE',
  details: [{
    field: 'aiInsights',
    message: 'AI insights are not available. Please check your OpenAI API key.'
  }]
};

const validationError = {
  error: 'Validation Error',
  code: 'VALIDATION_ERROR',
  details: [{
    field: 'propertyPrice',
    message: 'Property price must be a positive number'
  }]
};
```

### Deal Analysis Routes
```typescript
// POST /api/deals/analyze
interface AnalyzeRequest {
  propertyType: 'SFR' | 'MF';
  propertyData: SFRDealData | MultiFamilyDealData;
  assumptions: LongTermAssumptions;
}

// GET /api/deals/:id
interface GetDealResponse {
  deal: SavedDeal;
}

// POST /api/deals/save
interface SaveDealRequest {
  dealData: SFRDealData | MultiFamilyDealData;
  analysisResult: AnalysisResult<KeyMetrics>;
}

// GET /api/deals
interface GetDealsResponse {
  deals: SavedDeal[];
  total: number;
}

// DELETE /api/deals/:id
interface DeleteDealResponse {
  success: boolean;
}
```

### Property Data Types
```typescript
interface BasePropertyData {
  propertyName: string;
  propertyAddress: PropertyAddress;
  purchasePrice: number;
  downPayment: number;
  interestRate: number;
  loanTerm: number;
  propertyTaxRate: number;
  insuranceRate: number;
  propertyManagementRate: number;
  yearBuilt: number;
  id?: string;
}

interface PropertyAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
}

interface SFRDealData extends BasePropertyData {
  propertyType: 'SFR';
  monthlyRent: number;
  squareFootage: number;
  bedrooms: number;
  bathrooms: number;
  maintenanceCost: number;
  longTermAssumptions: LongTermAssumptions;
}

interface MultiFamilyDealData extends BasePropertyData {
  propertyType: 'MF';
  totalUnits: number;
  totalSqft: number;
  maintenanceCostPerUnit: number;
  unitTypes: UnitType[];
  longTermAssumptions: MFLongTermAssumptions;
  commonAreaUtilities: CommonAreaUtilities;
}

interface UnitType {
  type: string;
  count: number;
  sqft: number;
  monthlyRent: number;
  occupied: number;
}

interface LongTermAssumptions {
  projectionYears: number;
  annualRentIncrease: number;
  annualPropertyValueIncrease: number;
  sellingCostsPercentage: number;
  inflationRate: number;
  vacancyRate: number;
}

interface MFLongTermAssumptions extends LongTermAssumptions {
  capitalExpenditureRate: number;
  commonAreaMaintenanceRate: number;
}

interface CommonAreaUtilities {
  electric: number;
  water: number;
  gas: number;
  trash: number;
}
```

### Analysis Results
```typescript
interface AnalysisResult<T extends CommonMetrics> {
  monthlyAnalysis: MonthlyAnalysis;
  annualAnalysis: AnnualAnalysis;
  metrics: T;
  projections: YearlyProjection[];
  exitAnalysis: ExitAnalysis;
  aiInsights?: AIInsights;
}

interface MonthlyAnalysis {
  expenses: {
    propertyTax: number;
    insurance: number;
    maintenance: number;
    propertyManagement: number;
    vacancy: number;
    mortgage: {
      total: number;
      principal: number;
      interest: number;
    };
    total: number;
  };
  cashFlow: number;
  cashFlowAfterTax: number;
}

interface AnnualAnalysis {
  dscr: number;
  cashOnCashReturn: number;
  capRate: number;
  totalInvestment: number;
  annualNOI: number;
  annualDebtService: number;
  effectiveGrossIncome: number;
}

interface YearlyProjection {
  year: number;
  cashFlow: number;
  propertyValue: number;
  equity: number;
  noi: number;
  debtService: number;
  grossRent: number;
  mortgageBalance: number;
  appreciation: number;
  totalReturn: number;
}

interface ExitAnalysis {
  projectedSalePrice: number;
  sellingCosts: number;
  mortgagePayoff: number;
  netProceedsFromSale: number;
}

interface AIInsights {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  investmentScore: number;
}
```

### Error Responses
```typescript
interface ErrorResponse {
  error: string;
  code: string;
  details?: {
    field: string;
    message: string;
  }[];
}

// Common error codes
type ErrorCode = 
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'INTERNAL_ERROR'
  | 'AI_UNAVAILABLE';
```

## 2025-06-03 Backend Update

### TypeScript-First Workflow
- Backend runs directly from TypeScript source using `ts-node` and `nodemon`.
- `.env` is loaded at the very top of `src/index.ts`.
- All old JS files in `src/` have been removed.

### Unified Analysis Endpoint
- `POST /api/deals/analyze` handles both SFR and MF analysis.
- Request must include a `propertyType` field (`'SFR'` or `'MF'`).
- The backend branches on `propertyType` and uses the appropriate analyzer.
- The response always includes:
  - `monthlyAnalysis`
  - `annualAnalysis`
  - `longTermAnalysis`
  - `keyMetrics`
  - `aiInsights`

#### Example Request
```json
{
  "propertyType": "SFR",
  ... // SFR or MF property fields
}
```

#### Example Response
```json
{
  "monthlyAnalysis": { ... },
  "annualAnalysis": { ... },
  "longTermAnalysis": { ... },
  "keyMetrics": { ... },
  "aiInsights": { ... }
}
```

### Sample Endpoints
- `GET /api/deals/sample-sfr`: Returns a valid sample SFR payload.
- `GET /api/deals/sample-mf`: Returns a valid sample MF payload.

### Automated Smoke Testing
- On server startup, a script (`testApiOnStartup.ts`) runs and verifies:
  - Sample endpoints return valid data.
  - Analysis endpoint returns all required fields.
- Logs `[PASS]` or `[FAIL]` for each check.

### OpenAI Integration
- Uses OpenAI v4+ SDK (`openai.completions.create`).
- All property access is now safe to prevent runtime errors if analysis structure is missing fields. 