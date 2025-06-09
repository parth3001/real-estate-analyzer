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
  income: {
    gross: number;
    effective: number;
  };
  expenses: {
    operating: number;
    debt: number;
    total: number;
    breakdown: {
      propertyTax: number;
      insurance: number;
      maintenance: number;
      propertyManagement: number;
      vacancy: number;
      utilities: number;
      commonAreaElectricity: number;
      landscaping: number;
      waterSewer: number;
      garbage: number;
      marketingAndAdvertising: number;
      repairsAndMaintenance: number;
      capEx: number;
      other?: number;
    };
  };
  cashFlow: number;
}
```

### Annual Analysis
Represents annual financial metrics:
```typescript
interface AnnualAnalysis {
  income: number;
  expenses: number;
  noi: number;
  debtService: number;
  cashFlow: number;
}
```

### Long Term Analysis
Represents long-term projections and returns:
```typescript
interface LongTermAnalysis {
  projections: YearlyProjection[];
  exitAnalysis: ExitAnalysis;
  returns: {
    irr: number;
    totalCashFlow: number;
    totalAppreciation: number;
    totalReturn: number;
  };
  projectionYears: number;
}
```

### Yearly Projection
Individual year metrics in long-term analysis:
```typescript
interface YearlyProjection {
  year: number;
  propertyValue: number;
  grossIncome: number;
  operatingExpenses: number;
  noi: number;
  debtService: number;
  cashFlow: number;
  equity: number;
  mortgageBalance: number;
  totalReturn: number;
  propertyTax: number;
  insurance: number;
  maintenance: number;
  propertyManagement: number;
  vacancy: number;
  realtorBrokerageFee: number;
  grossRent: number;
  appreciation: number;
}
```

### Exit Analysis
```typescript
interface ExitAnalysis {
  projectedSalePrice: number;
  sellingCosts: number;
  mortgagePayoff: number;
  netProceedsFromSale: number;
  totalReturn: number;
}
```

### Common Metrics
```typescript
interface CommonMetrics {
  noi: number;
  capRate: number;
  cashOnCashReturn: number;
  irr: number;
  dscr: number;
  operatingExpenseRatio: number;
}
```

### Property-Specific Metrics

#### SFR Metrics
```typescript
interface SFRMetrics extends CommonMetrics {
  pricePerSqFt: number;
  rentPerSqFt: number;
  grossRentMultiplier: number;
  afterRepairValueRatio?: number;
  rehabROI?: number;
}
```

#### Multi-Family Metrics
```typescript
interface MultiFamilyMetrics extends CommonMetrics {
  pricePerUnit: number;
  pricePerSqft: number;
  noiPerUnit: number;
  averageRentPerUnit: number;
  operatingExpensePerUnit: number;
  commonAreaExpenseRatio: number;
  unitMixEfficiency: number;
  economicVacancyRate: number;
}
```

### AI Insights
```typescript
interface AIInsights {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  investmentScore: number | null;
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
     utilities +
     // Property-specific expenses
     commonAreaElectricity +
     landscaping +
     waterSewer +
     garbage +
     marketingAndAdvertising +
     repairsAndMaintenance +
     capEx;
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
interface AnalyzeRequest {
  propertyType: 'SFR' | 'MF';  // Required
  // Property-specific data
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
  // Property-type specific fields
  // For SFR:
  monthlyRent?: number;
  squareFootage?: number;
  bedrooms?: number;
  bathrooms?: number;
  // For MF:
  totalUnits?: number;
  totalSqft?: number;
  unitTypes?: Array<{
    type: string;
    count: number;
    sqft: number;
    monthlyRent: number;
    occupied: number;
  }>;
  // Other fields...
}
```

Response: Analysis object (as defined above)

#### Get Sample SFR Data
```
GET /api/deals/sample-sfr
```

Response: Sample single-family property data that can be used for analysis testing

#### Get Sample MF Data
```
GET /api/deals/sample-mf
```

Response: Sample multi-family property data that can be used for analysis testing

### Deal Management

#### Get All Deals
```
GET /api/deals
```

Response: Array of saved deals

#### Get Deal by ID
```
GET /api/deals/:id
```

Parameters:
- `id`: Deal ID

Response: Complete deal data including analysis

#### Create Deal
```
POST /api/deals
```

Request Body:
```typescript
interface SaveDealRequest {
  dealData: SFRDealData | MultiFamilyDealData;
  analysisResult: AnalysisResult<KeyMetrics>;
}
```

Response: Saved deal with ID

#### Update Deal
```
PUT /api/deals/:id
```

Parameters:
- `id`: Deal ID

Request Body: Updated deal data

Response: Updated deal

#### Delete Deal
```
DELETE /api/deals/:id
```

Parameters:
- `id`: Deal ID

Response:
```typescript
interface DeleteDealResponse {
  success: boolean;
}
```

## Error Handling

### HTTP Status Codes
- 200: Successful analysis
- 400: Invalid input data
- 404: Resource not found
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

## Property Data Types

### Base Property Data
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
```

### Single-Family Residential (SFR) Data
```typescript
interface SFRDealData extends BasePropertyData {
  propertyType: 'SFR';
  monthlyRent: number;
  squareFootage: number;
  bedrooms: number;
  bathrooms: number;
  maintenanceCost: number;
  longTermAssumptions: LongTermAssumptions;
}
```

### Multi-Family (MF) Data
```typescript
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
   - Projection Years: 10
   - Property Value Appreciation: 3%
   - Annual Rent Increase: 3%
   - Selling Costs: 6%

## AI Integration

### OpenAI Configuration
```typescript
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
```

### AI Prompts
The application uses specialized prompts for different property types:

1. **SFR Analysis Prompt**
   - Generates a prompt analyzing single-family properties
   - Includes key metrics like NOI, Cap Rate, Cash on Cash Return, etc.
   - Requests a structured JSON response with insights

2. **MF Analysis Prompt**
   - Generates a prompt specifically for multi-family properties
   - Includes unit mix analysis, NOI per unit, and MF-specific metrics
   - Requests a structured JSON response with insights

### AI Response Format
```typescript
interface AIResponse {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  investmentScore: number | null;
  // Optional MF-specific fields
  unitMixAnalysis?: string;
  marketPositionAnalysis?: string;
  valueAddOpportunities?: string[];
  recommendedHoldPeriod?: string;
}
```

### Error Handling for AI
```typescript
// Example AI unavailable response:
const aiUnavailableResponse = {
  summary: "AI insights are not available. Please check your OpenAI API key.",
  strengths: [],
  weaknesses: [],
  recommendations: [],
  investmentScore: null
};
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

#### Example Request for Unified Endpoint
```json
{
  "propertyType": "SFR",
  "propertyName": "123 Main St",
  "propertyAddress": {
    "street": "123 Main St",
    "city": "Anytown",
    "state": "CA",
    "zipCode": "12345"
  },
  "purchasePrice": 300000,
  "downPayment": 60000,
  "interestRate": 5.5,
  "loanTerm": 30,
  "monthlyRent": 2500,
  "squareFootage": 1500,
  "bedrooms": 3,
  "bathrooms": 2,
  "yearBuilt": 1985,
  "propertyTaxRate": 1.2,
  "insuranceRate": 0.5,
  "propertyManagementRate": 8,
  "maintenanceCost": 200,
  "longTermAssumptions": {
    "projectionYears": 10,
    "annualRentIncrease": 3,
    "annualPropertyValueIncrease": 3,
    "sellingCostsPercentage": 6,
    "inflationRate": 2,
    "vacancyRate": 5
  }
}
```

### Sample Endpoints
- `GET /api/deals/sample-sfr`: Returns a valid sample SFR payload.
- `GET /api/deals/sample-mf`: Returns a valid sample MF payload.

These endpoints are useful for testing the analysis functionality without having to create your own data structure.

### Automated Smoke Testing
- On server startup, a script (`testApiOnStartup.ts`) runs and verifies:
  - Sample endpoints return valid data.
  - Analysis endpoint returns all required fields.
- Logs `[PASS]` or `[FAIL]` for each check.

### OpenAI Integration
- Uses OpenAI v4+ SDK (`openai.completions.create`).
- All property access is now safe to prevent runtime errors if analysis structure is missing fields.

## Example API Usage

### Analyze a Single-Family Property
```javascript
// Request
fetch('/api/deals/analyze', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    propertyType: 'SFR',
    propertyName: '123 Main St',
    propertyAddress: {
      street: '123 Main St',
      city: 'Anytown',
      state: 'CA',
      zipCode: '12345'
    },
    purchasePrice: 300000,
    downPayment: 60000,
    interestRate: 5.5,
    loanTerm: 30,
    monthlyRent: 2500,
    squareFootage: 1500,
    // Other required fields
  })
})
.then(response => response.json())
.then(analysis => console.log(analysis));
```

### Get Sample Multi-Family Data and Analyze
```javascript
// Request
fetch('/api/deals/sample-mf')
.then(response => response.json())
.then(sampleData => {
  // Use sample data to test analysis
  fetch('/api/deals/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(sampleData)
  })
  .then(response => response.json())
  .then(analysis => console.log(analysis));
});
``` 