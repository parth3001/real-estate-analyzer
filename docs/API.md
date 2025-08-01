# Real Estate Analyzer API Documentation

## Overview
This document outlines the API interfaces, calculations, and data structures used in the Real Estate Analyzer application.

For a comprehensive listing of all data fields, their types, and usage, please refer to the [Data Dictionary](DATA_DICTIONARY.md).

## Performance & Concurrency

### Race Condition Prevention System

**Implementation Date**: 2025-07-28  
**Status**: ✅ Active in Production

The API implements a sophisticated race condition prevention system for interactive features to ensure data consistency and optimal performance.

#### Request ID Tracking

All analysis requests should implement client-side request tracking to prevent race conditions:

```typescript
// Generate unique request ID
const requestId = `analysis-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

// Track active request
setActiveRequestId(requestId);

// Validate response is from latest request
if (requestId === activeRequestId && response.status === 200) {
  // Process response
} else {
  // Discard outdated response
  console.log(`Request ${requestId} cancelled - newer request active`);
}
```

#### Best Practices for Interactive Features

1. **Debounced Full Analysis**: Only trigger full AI analysis for significant parameter changes (>10% change)
2. **Quick Calculations**: Use `/api/quick-calculate` for immediate UI feedback (<50ms)
3. **Request Cancellation**: Always check request validity before updating UI state
4. **Timeout Management**: Clear previous timeouts before setting new ones

#### Performance Metrics

- **Quick Calculations**: Target <50ms response time
- **Full Analysis**: Target <2s response time  
- **Race Condition Prevention**: 99.9% request consistency
- **Resource Usage**: Eliminated redundant concurrent analyses

## API Endpoints

### Interactive Analysis Endpoints

#### Quick Calculation (Real-time Updates)
```
POST /api/quick-calculate
```

**Purpose:** Ultra-fast financial calculations for real-time interactive analysis.

**Performance:** Target <50ms response time for immediate UI feedback.

**Request Body:**
```json
{
  "purchasePrice": 425000,
  "downPayment": 85000,
  "interestRate": 7.125,
  "monthlyRent": 2875,
  "propertyTaxRate": 1.25,
  "insuranceRate": 0.52,
  "maintenanceCost": 287,
  "propertyManagementRate": 8.5,
  "vacancyRate": 5,
  "requestId": "analysis-1643723456789-abc123"
}
```

**Response:**
```json
{
  "requestId": "analysis-1643723456789-abc123",
  "keyMetrics": {
    "monthlyIncome": 2875,
    "monthlyExpenses": 1158.51,
    "monthlyCashFlow": -535.28,
    "capRate": 4.95,
    "cashOnCashReturn": -7.56,
    "dscr": 0.77,
    "debtYield": 6.19,
    "grossYield": 8.12
  },
  "calculationTime": 23
}
```

#### Deal Optimization
```
POST /api/deals/:id/optimize
```

**Purpose:** Generate AI-powered optimization suggestions for underperforming deals.

**Request Body:**
```json
{
  "optimizationGoals": ["improve_cash_flow", "reduce_risk", "maximize_returns"],
  "constraints": {
    "maxPriceReduction": 0.15,
    "maxDownPaymentIncrease": 0.10
  }
}
```

**Response:**
```json
{
  "originalScore": 42,
  "optimizations": [
    {
      "strategy": "purchase_price_reduction",
      "description": "Reduce purchase price by 8.5% to improve cash flow",
      "changes": { "purchasePrice": 388250 },
      "impact": {
        "newScore": 67,
        "monthlyImprovement": 285.50,
        "capRateImprovement": 1.2
      },
      "feasibility": "high",
      "implementation": "Negotiate with seller citing comparable sales"
    }
  ]
}
```

#### Scenario Management
```
POST /api/scenarios
```

**Purpose:** Save analysis scenario with custom name for future comparison.

**Request Body:**
```json
{
  "dealId": "507f1f77bcf86cd799439011",
  "scenarioName": "Conservative Estimate",
  "propertyData": { /* complete property data */ },
  "analysis": { /* complete analysis results */ }
}
```

```
GET /api/scenarios/:dealId
```

**Purpose:** Retrieve all saved scenarios for a specific deal.

```
POST /api/scenarios/compare
```

**Purpose:** Compare multiple scenarios side-by-side.

**Request Body:**
```json
{
  "scenarioIds": ["scenario1", "scenario2", "scenario3"]
}
```

### Authentication Endpoints

#### User Registration
```
POST /api/auth/register
```

**Purpose:** Create a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "user",
    "isVerified": false
  },
  "accessToken": "jwt_token_here",
  "refreshToken": "refresh_token_here"
}
```

#### User Login
```
POST /api/auth/login
```

**Purpose:** Authenticate user and receive access tokens.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123"
}
```

**Response:** Same as registration response.

#### Token Refresh
```
POST /api/auth/refresh
```

**Purpose:** Refresh expired access token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "refresh_token_here"
}
```

#### Get User Profile
```
GET /api/auth/profile
```

**Purpose:** Get current user's profile information.

**Headers:** `Authorization: Bearer <access_token>`

**Response:**
```json
{
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "user",
    "isVerified": false,
    "createdAt": "2025-07-13T19:14:40.000Z",
    "lastLogin": "2025-07-13T20:30:15.000Z"
  }
}
```

#### Update User Profile
```
PUT /api/auth/profile
```

**Purpose:** Update user's profile information.

**Headers:** `Authorization: Bearer <access_token>`

**Request Body:**
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "newemail@example.com"
}
```

#### Change Password
```
POST /api/auth/change-password
```

**Purpose:** Change user's password.

**Headers:** `Authorization: Bearer <access_token>`

**Request Body:**
```json
{
  "currentPassword": "OldPassword123",
  "newPassword": "NewPassword456"
}
```

### Admin Endpoints

#### Get All Users (Admin Only)
```
GET /api/admin/users
```

**Purpose:** Retrieve all users with statistics (admin only).

**Headers:** `Authorization: Bearer <admin_access_token>`

**Response:**
```json
{
  "message": "Users retrieved successfully",
  "users": [
    {
      "id": "507f1f77bcf86cd799439011",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "user",
      "isVerified": true,
      "createdAt": "2025-07-13T19:14:40.000Z",
      "lastLogin": "2025-07-13T20:30:15.000Z",
      "totalDeals": 5
    }
  ],
  "total": 1
}
```

#### Update User Role (Admin Only)
```
PUT /api/admin/users/:userId/role
```

**Purpose:** Change user's role (promote/demote admin).

**Headers:** `Authorization: Bearer <admin_access_token>`

**Request Body:**
```json
{
  "role": "admin"
}
```

#### Update User Status (Admin Only)
```
PUT /api/admin/users/:userId/status
```

**Purpose:** Update user's verification status.

**Headers:** `Authorization: Bearer <admin_access_token>`

**Request Body:**
```json
{
  "isVerified": true
}
```

#### Get System Statistics (Admin Only)
```
GET /api/admin/stats
```

**Purpose:** Get system-wide statistics.

**Headers:** `Authorization: Bearer <admin_access_token>`

**Response:**
```json
{
  "stats": {
    "users": {
      "total": 150,
      "admins": 3,
      "verified": 120,
      "recent": 15
    },
    "deals": {
      "total": 1250
    },
    "timestamp": "2025-07-13T20:30:15.000Z"
  }
}
```

### Census Data

#### Get Demographic Data
```
GET /api/census/demographics
```

**Purpose:** Retrieves demographic data for a specified location from the US Census Bureau API.

**Query Parameters:**

| Parameter | Type   | Description                                |
|-----------|--------|--------------------------------------------|
| zip       | string | ZIP code (e.g., "94043")                  |
| state     | string | State code (e.g., "CA")                   |
| county    | string | County code or name                        |
| city      | string | City name                                  |
| tract     | string | Census tract                               |
| year      | number | Census data year (defaults to most recent) |
| dataset   | string | Census dataset (defaults to "acs/acs5")    |

**Response:**
```json
{
  "totalPopulation": 28000,
  "medianAge": 35.4
}
```

#### Get Income Data
```
GET /api/census/income
```

**Purpose:** Retrieves income data for a specified location from the US Census Bureau API.

**Query Parameters:**

| Parameter | Type   | Description                                |
|-----------|--------|--------------------------------------------|
| zip       | string | ZIP code (e.g., "94043")                  |
| state     | string | State code (e.g., "CA")                   |
| county    | string | County code or name                        |
| city      | string | City name                                  |
| tract     | string | Census tract                               |
| year      | number | Census data year (defaults to most recent) |
| dataset   | string | Census dataset (defaults to "acs/acs5")    |

**Response:**
```json
{
  "medianHouseholdIncome": 85000,
  "perCapitaIncome": 45000
}
```

#### Get Housing Data
```
GET /api/census/housing
```

**Purpose:** Retrieves housing data for a specified location from the US Census Bureau API.

**Query Parameters:**

| Parameter | Type   | Description                                |
|-----------|--------|--------------------------------------------|
| zip       | string | ZIP code (e.g., "94043")                  |
| state     | string | State code (e.g., "CA")                   |
| county    | string | County code or name                        |
| city      | string | City name                                  |
| tract     | string | Census tract                               |
| year      | number | Census data year (defaults to most recent) |
| dataset   | string | Census dataset (defaults to "acs/acs5")    |

**Response:**
```json
{
  "totalHousingUnits": 12000,
  "occupancyRate": 0.95,
  "vacancyRate": 0.05,
  "ownerOccupied": 7000,
  "renterOccupied": 4400,
  "medianHomeValue": 450000,
  "medianRent": 1800
}
```

#### Get Comprehensive Census Data
```
GET /api/census/comprehensive
```

**Purpose:** Retrieves comprehensive census data (demographics, income, housing) for a specified location.

**Query Parameters:**

| Parameter | Type   | Description                                |
|-----------|--------|--------------------------------------------|
| zip       | string | ZIP code (e.g., "94043")                  |
| state     | string | State code (e.g., "CA")                   |
| county    | string | County code or name                        |
| city      | string | City name                                  |
| tract     | string | Census tract                               |
| year      | number | Census data year (defaults to most recent) |
| dataset   | string | Census dataset (defaults to "acs/acs5")    |

**Response:**
```json
{
  "demographics": {
    "totalPopulation": 28000,
    "medianAge": 35.4
  },
  "income": {
    "medianHouseholdIncome": 85000,
    "perCapitaIncome": 45000
  },
  "housing": {
    "totalHousingUnits": 12000,
    "occupancyRate": 0.95,
    "vacancyRate": 0.05,
    "ownerOccupied": 7000,
    "renterOccupied": 4400,
    "medianHomeValue": 450000,
    "medianRent": 1800
  }
}
```

### Property Analysis

#### Analyze Property (Enhanced with AI)
```
POST /api/analyze/:type
```

**Purpose:** Analyze a property with comprehensive financial metrics and AI-powered insights

**Parameters:**
- `type`: Property type (`sfr` for Single Family Rental, `mf` for Multi-Family)

#### Legacy Analyze Property
```
POST /api/deals/analyze
```

**Purpose:** Legacy analysis endpoint (deprecated - use /api/analyze/:type instead)

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
  "capitalInvestments": 5000,
  "tenantTurnoverFees": {
    "prepFees": 750,
    "realtorCommission": 0.5
  },
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
      "tenantTurnover": 52,
      "mortgage": {
        "total": 1216,
        "principal": 182,
        "interest": 1034
      },
      "total": 2168
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
        "turnoverCosts": 625,
        "capitalImprovements": 5000,
        "appreciation": 9000,
        "totalReturn": 12108
      },
      // Additional years omitted for brevity
    ],
    "returns": {
      "irr": 18.21,
      "totalCashFlow": 40950,
      "totalAppreciation": 103143,
      "totalReturn": 144093,
      "totalInvestment": 65000,
      "totalAdditionalInvestment": 15000
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
    "noi": 17760,
    "capRate": 5.9,
    "cashOnCashReturn": 4.78,
    "irr": 18.21,
    "dscr": 1.21,
    "operatingExpenseRatio": 42.5,
    "totalInvestment": 65000,
    "pricePerSqFt": 200,
    "rentPerSqFt": 1.67,
    "grossRentMultiplier": 10,
    "returnOnImprovements": 8.5,
    "turnoverCostImpact": 1.2
  },
  "aiInsights": {
    "summary": "This property represents a solid investment opportunity with $259 monthly cash flow and a 5.9% cap rate, positioned 12% below market median pricing, making it suitable for income-focused investors seeking stable returns with moderate appreciation potential.",
    "investmentScore": 75,
    "investorFit": "Best suited for income-focused investors with 3-5 year investment horizons seeking stable cash flow with moderate appreciation. Ideal for portfolio diversification with 15-25% allocation to real estate.",
    "strengths": [
      "Strong monthly cash flow of $259 representing 4.78% cash-on-cash return above market average of 4.2%",
      "Excellent market positioning at 12% below area median home value of $340,000",
      "Solid cap rate of 5.9% exceeding market average of 5.2% for similar properties",
      "DSCR of 1.21 provides comfortable debt service coverage above lender requirements"
    ],
    "weaknesses": [
      "Property age of 15 years may result in $200-400 monthly maintenance increases over next 5 years",
      "Property tax rate of 1.2% slightly above county average of 1.1%, adding $360 annually",
      "Expense ratio of 43% approaches upper limit of acceptable range (35-45%)",
      "Break-even occupancy of 87% leaves limited margin for extended vacancies"
    ],
    "recommendations": [
      "Establish $15,000 capital reserve fund for major maintenance items (HVAC, roof) expected within 3-5 years",
      "Consider refinancing if rates drop below 4% to improve cash flow by approximately $150/month",
      "Implement property management system to reduce vacancy periods and optimize rent collection",
      "Evaluate market rent increases of 3-5% annually based on local demographics and income growth"
    ],
    "riskAssessment": "Moderate risk profile with primary concerns being property age-related maintenance costs and market rental volatility. Downside scenario shows potential for $50-100 monthly cash flow reduction if major repairs coincide with vacancy periods.",
    "strategicInsights": "Property demonstrates strong fundamentals with defensive characteristics suitable for conservative portfolios. Below-market purchase price provides built-in equity cushion of approximately $40,000, while positive cash flow supports debt service during market downturns.",
    "competitiveAdvantage": "Location in established neighborhood with 95% occupancy rates provides stable rental demand. Property's condition and recent updates position it favorably against 40% of area rentals requiring significant improvements.",
    "wealthBuildingPotential": "Conservative wealth building vehicle with projected $31,000 equity accumulation over 5 years through mortgage paydown and 3% annual appreciation. Total return potential of $55,000 including cash flow represents 85% ROI over holding period.",
    "marketCycleAnalysis": "Local market in mid-cycle expansion phase with population growth of 2.1% annually and median income increases of 4.2%. Optimal acquisition timing with 3-5 year appreciation runway before next cycle peak.",
    "financingRecommendations": "Current 4.5% financing is competitive but monitor for refinancing opportunities below 4.0% which would improve cash flow by $150/month and IRR by 1.8 percentage points.",
    "portfolioFitAnalysis": "Excellent diversification asset with low correlation to stock market volatility. Recommended allocation of 15-20% of investment portfolio for risk-adjusted returns and inflation hedging characteristics.",
    "opportunityCostAnalysis": "Expected 12.3% IRR compares favorably to S&P 500 historical 10.5% with lower volatility. Superior to bond yields of 4.8% while providing inflation protection and tax advantages through depreciation.",
    "marketTrendPrediction": "Expect continued rental demand growth driven by local job market expansion and limited new construction. Rental rates likely to increase 3-4% annually over next 3 years based on income growth and housing supply constraints.",
    "optimalExitStrategy": "Hold for 5-7 years to maximize mortgage paydown and appreciation. Exit timing should coincide with market peak indicators: rent growth slowing below 2% annually and cap rate compression below 5.5%.",
    "recommendedHoldPeriod": "5-7 years optimal hold period to balance equity accumulation with market cycle timing. Consider sale when IRR peaks around year 6-7 or if market fundamentals deteriorate significantly.",
    "valueAddOpportunities": [
      {
        "improvement": "Kitchen renovation with modern appliances and finishes",
        "estimatedCost": "$12,000-15,000",
        "potentialRoiPercent": "18-22%",
        "rentIncreasePotential": "$150-200/month",
        "valueIncreasePotential": "$25,000-30,000",
        "implementationDifficulty": "medium",
        "strategicPriority": "high"
      },
      {
        "improvement": "Energy efficiency upgrades (windows, insulation, HVAC)",
        "estimatedCost": "$8,000-12,000",
        "potentialRoiPercent": "15-20%",
        "rentIncreasePotential": "$75-100/month",
        "valueIncreasePotential": "$15,000-20,000",
        "implementationDifficulty": "medium",
        "strategicPriority": "medium"
      }
    ],
    "notes": "Property benefits from established neighborhood character and proximity to employment centers. Consider local zoning changes that might allow ADU development for additional income potential."
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
      tenantTurnover: number;
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
    totalInvestment: number;
    totalAdditionalInvestment: number;
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
  turnoverCosts: number;
  capitalImprovements: number;
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
interface CommonMetrics {
  noi: number;
  capRate: number;
  cashOnCashReturn: number;
  irr: number;
  dscr: number;
  operatingExpenseRatio: number;
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
  // Core Analysis
  summary: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  investmentScore: number | null;
  riskAssessment?: string;
  
  // PHASE 1 ENHANCEMENT: Score Breakdown System ✅
  scoreBreakdown?: {
    cashFlow: {
      score: number;
      max: number;
      reason: string;
    };
    marketPosition: {
      score: number;
      max: number;
      reason: string;
    };
    financialMetrics: {
      score: number;
      max: number;
      reason: string;
    };
    riskAssessment: {
      score: number;
      max: number;
      reason: string;
    };
  };
  
  // PHASE 1 ENHANCEMENT: Market Intelligence ✅
  marketPositioning?: {
    propertyValue: number;
    marketMedian: number;
    percentageDiff: number;
    position: string;
    competitiveAdvantage: string;
  };
  
  marketInsights?: string[];
  
  // Enhanced Strategic Analysis (v2.0+)
  investorFit?: string;
  strategicInsights?: string;
  competitiveAdvantage?: string;
  wealthBuildingPotential?: string;
  marketCycleAnalysis?: string;
  financingRecommendations?: string;
  portfolioFitAnalysis?: string;
  opportunityCostAnalysis?: string;
  
  // Property-Specific Analysis
  unitMixAnalysis?: string; // For Multi-Family properties
  marketPositionAnalysis?: string;
  
  // Future Performance
  marketTrendPrediction?: string;
  optimalExitStrategy?: string;
  recommendedHoldPeriod?: string;
  
  // Value Enhancement
  valueAddOpportunities?: ValueAddOpportunity[];
  
  // Additional Context
  notes?: string;
}

interface ValueAddOpportunity {
  improvement: string;
  estimatedCost: string;
  potentialRoiPercent: string;
  rentIncreasePotential: string;
  valueIncreasePotential: string;
  implementationDifficulty?: 'easy' | 'medium' | 'hard';
  strategicPriority?: 'high' | 'medium' | 'low';
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
  capitalInvestments?: number;
  tenantTurnoverFees?: {
    prepFees: number;
    realtorCommission: number;
  };
  longTermAssumptions: LongTermAssumptions;
}
```

### SFR Property Data
```typescript
interface SFRData extends BasePropertyData {
  propertyType: 'SFR';
  monthlyRent: number;
  squareFootage: number;
  bedrooms: number;
  bathrooms: number;
  yearBuilt: number;
  condition?: string;
  afterRepairValue?: number;
  renovationCosts?: number;
  longTermAssumptions?: {
    projectionYears: number;
    annualRentIncrease: number;
    annualPropertyValueIncrease: number;
    inflationRate: number;
    vacancyRate: number;
    sellingCostsPercentage: number;
    turnoverFrequency?: number;
  };
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

4. **Return on Improvements**
   ```javascript
   const returnOnImprovements = (noiWithImprovements, noiWithoutImprovements, capitalInvestments) => {
     // If we have before/after NOI data
     if (noiWithoutImprovements > 0) {
       return ((noiWithImprovements - noiWithoutImprovements) / capitalInvestments) * 100;
     }
     // Otherwise use estimated 8% return
     return 8.0;
   };
   ```

5. **Turnover Cost Impact**
   ```javascript
   const turnoverCostImpact = (annualTurnoverCosts, grossIncome) => {
     return (annualTurnoverCosts / grossIncome) * 100;
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