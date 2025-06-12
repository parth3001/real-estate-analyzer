# Real Estate Analyzer API Documentation

## Overview
This document outlines the API interfaces, calculations, and data structures used in the Real Estate Analyzer application.

## API Endpoints

### Property Analysis

#### Analyze Property
```
POST /api/deals/analyze
```

**Purpose:** Analyze a property based on the provided data

**Request Body:**
```json
{
  "propertyType": "SFR",
  "propertyName": "Sample SFR Property",
  "propertyAddress": {
    "street": "123 Main St",
    "city": "Anytown",
    "state": "CA",
    "zipCode": "12345"
  },
  "purchasePrice": 300000,
  "downPayment": 60000,
  "interestRate": 4.5,
  "loanTerm": 30,
  "monthlyRent": 2500,
  "propertyTaxRate": 1.2,
  "insuranceRate": 0.5,
  "maintenanceCost": 150,
  "propertyManagementRate": 8,
  "squareFootage": 1500,
  "bedrooms": 3,
  "bathrooms": 2,
  "yearBuilt": 2010,
  "closingCosts": 5000,
  "longTermAssumptions": {
    "annualRentIncrease": 3,
    "annualExpenseIncrease": 2,
    "annualPropertyValueIncrease": 3,
    "sellingCosts": 6,
    "projectionYears": 10,
    "vacancyRate": 5
  }
}
```

**Response:**
```json
{
  "monthlyAnalysis": {
    "income": {
      "gross": 2500,
      "effective": 2375
    },
    "expenses": {
      "propertyTax": 300,
      "insurance": 125,
      "maintenance": 150,
      "propertyManagement": 200,
      "vacancy": 125,
      "mortgage": {
        "total": 1216,
        "principal": 182,
        "interest": 1034
      },
      "total": 2116
    },
    "cashFlow": 259
  },
  "annualAnalysis": {
    "effectiveGrossIncome": 28500,
    "operatingExpenses": 10800,
    "noi": 17700,
    "debtService": 14592,
    "cashFlow": 3108
  },
  "longTermAnalysis": {
    "projections": [
      {
        "year": 1,
        "grossRent": 28500,
        "operatingExpenses": 10800,
        "noi": 17700,
        "debtService": 14592,
        "cashFlow": 3108,
        "propertyValue": 300000,
        "mortgageBalance": 237818,
        "equity": 62182,
        "propertyTax": 3600,
        "insurance": 1500,
        "maintenance": 1800,
        "propertyManagement": 2400,
        "vacancy": 1500,
        "appreciation": 9000,
        "totalReturn": 12108
      },
      // Additional years omitted for brevity
    ],
    "returns": {
      "irr": 18.21,
      "totalCashFlow": 40950,
      "totalAppreciation": 103143,
      "totalReturn": 144093
    },
    "exitAnalysis": {
      "projectedSalePrice": 403143,
      "sellingCosts": 24189,
      "mortgagePayoff": 199811,
      "netProceedsFromSale": 179143,
      "returnOnInvestment": 220.24
    },
    "projectionYears": 10
  },
  "keyMetrics": {
    "capRate": 5.9,
    "cashOnCashReturn": 4.78,
    "dscr": 1.21,
    "totalInvestment": 65000,
    "pricePerSqFt": 200,
    "rentPerSqFt": 1.67,
    "grossRentMultiplier": 10
  },
  "aiInsights": {
    "summary": "This property appears to be a solid investment with positive cash flow and good long-term potential.",
    "strengths": [
      "Positive cash flow from day one",
      "Good location with potential for appreciation",
      "Solid cap rate compared to market average"
    ],
    "weaknesses": [
      "Maintenance costs may increase due to property age",
      "Property tax rate is slightly above average",
      "Market rental rates may fluctuate"
    ],
    "recommendations": [
      "Consider setting aside reserves for future capital expenditures",
      "Monitor property tax assessments",
      "Evaluate refinancing options after 5 years"
    ],
    "investmentScore": 75
  }
}
```

#### Get Sample SFR Data
```
GET /api/deals/sample-sfr
```

**Purpose:** Get sample data for a Single-Family Rental property

**Response:** A complete SFR property data object with sample values

### Saved Properties

#### Get All Properties
```
GET /api/deals
```

**Purpose:** Retrieve all saved properties

**Response:**
```json
[
  {
    "_id": "655e1a2bc3f7b8d4e9f0a1b2",
    "propertyName": "Sample SFR Property",
    "propertyType": "SFR",
    "propertyAddress": {
      "street": "123 Main St",
      "city": "Anytown",
      "state": "CA",
      "zipCode": "12345"
    },
    "purchasePrice": 300000,
    "downPayment": 60000,
    // Additional property data...
    "analysis": {
      // Full analysis object
    },
    "createdAt": "2025-06-15T14:30:00.000Z",
    "updatedAt": "2025-06-15T14:30:00.000Z"
  },
  // Additional properties...
]
```

#### Get Property by ID
```
GET /api/deals/:id
```

**Purpose:** Retrieve a saved property by ID

**Response:** Complete property and analysis object

#### Create Property
```
POST /api/deals
```

**Purpose:** Save a new property analysis

**Request Body:** Complete property data with analysis

**Response:**
```json
{
  "_id": "655e1a2bc3f7b8d4e9f0a1b2",
  "message": "Property saved successfully"
}
```

#### Update Property
```
PUT /api/deals/:id
```

**Purpose:** Update an existing property

**Request Body:** Updated property data with analysis

**Response:**
```json
{
  "_id": "655e1a2bc3f7b8d4e9f0a1b2",
  "message": "Property updated successfully"
}
```

#### Delete Property
```
DELETE /api/deals/:id
```

**Purpose:** Delete a property by ID

**Response:**
```json
{
  "message": "Property deleted successfully"
}
```

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
      utilities?: number;
      commonAreaElectricity?: number;
      landscaping?: number;
      waterSewer?: number;
      garbage?: number;
      marketingAndAdvertising?: number;
      repairsAndMaintenance?: number;
      capEx?: number;
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
  effectiveGrossIncome: number;
  operatingExpenses: number;
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
  realtorBrokerageFee?: number;
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
  returnOnInvestment: number;
}
```

### Key Metrics
```typescript
interface KeyMetrics {
  capRate: number;
  cashOnCashReturn: number;
  dscr: number;
  totalInvestment: number;
}
```

### Property-Specific Metrics

#### SFR Metrics
```typescript
interface SFRMetrics extends KeyMetrics {
  pricePerSqFt: number;
  rentPerSqFt: number;
  grossRentMultiplier: number;
  afterRepairValueRatio?: number;
  rehabROI?: number;
}
```

#### Multi-Family Metrics
```typescript
interface MultiFamilyMetrics extends KeyMetrics {
  pricePerUnit: number;
  pricePerSqft: number;
  noiPerUnit: number;
  averageRentPerUnit: number;
  operatingExpensePerUnit: number;
  commonAreaExpenseRatio: number;
  unitMixEfficiency?: number;
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

## Property Data Structures

### Base Property Data
```typescript
interface BasePropertyData {
  propertyType: 'SFR' | 'MF';
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
  closingCosts?: number;
  repairCosts?: number;
  propertyTaxRate: number;
  insuranceRate: number;
  maintenanceCost: number;
  propertyManagementRate: number;
  longTermAssumptions: LongTermAssumptions;
}
```

### SFR Property Data
```typescript
interface SFRPropertyData extends BasePropertyData {
  propertyType: 'SFR';
  monthlyRent: number;
  squareFootage: number;
  bedrooms: number;
  bathrooms: number;
  yearBuilt: number;
}
```

### Long Term Assumptions
```typescript
interface LongTermAssumptions {
  annualRentIncrease: number;
  annualExpenseIncrease: number;
  annualPropertyValueIncrease: number;
  vacancyRate: number;
  sellingCosts: number;
  projectionYears: number;
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
     vacancy;
   ```

3. **Monthly Cash Flow**
   ```javascript
   const monthlyCashFlow = effectiveGrossIncome - operatingExpenses - mortgagePayment;
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

1. **Property Value Growth**
   ```javascript
   const propertyValueInYear = (initialValue, appreciationRate, year) => {
     return initialValue * Math.pow(1 + appreciationRate / 100, year - 1);
   };
   ```

2. **Rent Growth**
   ```javascript
   const rentInYear = (initialRent, rentGrowthRate, year) => {
     return initialRent * Math.pow(1 + rentGrowthRate / 100, year - 1);
   };
   ```

3. **Expense Growth**
   ```javascript
   const expenseInYear = (initialExpense, expenseGrowthRate, year) => {
     return initialExpense * Math.pow(1 + expenseGrowthRate / 100, year - 1);
   };
   ```

4. **Mortgage Balance**
   ```javascript
   const mortgageBalanceAfterYears = (principal, annualRate, termYears, yearsElapsed) => {
     const monthlyRate = annualRate / 12 / 100;
     const totalPayments = termYears * 12;
     const paymentsMade = yearsElapsed * 12;
     const monthlyPayment = calculateMonthlyMortgage(principal, annualRate, termYears);
     
     return principal * Math.pow(1 + monthlyRate, paymentsMade) -
            (monthlyPayment / monthlyRate) * (Math.pow(1 + monthlyRate, paymentsMade) - 1);
   };
   ```

5. **Internal Rate of Return (IRR)**
   ```javascript
   const calculateIRR = (cashFlows, iterations = 1000, guess = 0.1) => {
     // Implementation of Newton-Raphson method for IRR approximation
   };
   ``` 