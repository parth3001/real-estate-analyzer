# Real Estate Investment Intelligence Platform - Data Mapping

**Last Updated**: August 30, 2025 - V3.0 Professional Assessment & Portfolio Intelligence Integration

This document describes how data is mapped between different layers of the Real Estate Investment Intelligence Platform, including V3.0 Professional Assessment, Portfolio Intelligence system, skinny metrics calculator, and AI microservices architecture.

## System Overview

The platform has evolved into a sophisticated investment intelligence system with multiple AI services and professional-grade analysis capabilities.

```
┌─────────────────┐    ┌──────────────────────────────────────────────┐    ┌─────────────────┐
│    Frontend     │    │              Backend Services                │    │    Database     │
│   (React 19)    │    │                                              │    │   (MongoDB)     │
│                 │    │  ┌─────────────────────────────────────────┐ │    │                 │
│ Investment      │    │  │           Core Services                 │ │    │ • Deal Storage  │
│ Decision Hero   │◄───┤  │                                         │ │    │ • Portfolio     │
│ (V3.0)          │    │  │ • InvestmentDecisionEngine (V3.0)       │ │    │ • AI Insights   │
│                 │    │  │ • PortfolioAnalyticsService             │ │    │ • Market Data   │
│ Portfolio       │    │  │ • PortfolioPropertyMetricsService       │ │    │ • User Data     │
│ Dashboard       │    │  │ • EnhancedPortfolioAI                   │ │◄───┤                 │
│                 │    │  │ • MarketIntelligenceService             │ │    │                 │
│ Professional    │    │  └─────────────────────────────────────────┘ │    │                 │
│ Assessment      │    │                                              │    │                 │
│ (0-100 Deal     │    │  ┌─────────────────────────────────────────┐ │    │                 │
│ Quality)        │    │  │         AI Microservices                │ │    │                 │
└─────────────────┘    │  │                                         │ │    │                 │
                       │  │ • AI Orchestrator                      │ │    │                 │
┌─────────────────┐    │  │ • Core Analysis Service                 │ │    │                 │
│  External APIs  │    │  │ • Market Analysis Service               │ │    │                 │
│                 │    │  │ • Enhanced Portfolio AI Service         │ │    │                 │
│ • FRED API      │◄───┤  │ • Professional Assessment Engine       │ │    │                 │
│ • RentCast API  │    │  └─────────────────────────────────────────┘ │    │                 │
│ • Census API    │    └──────────────────────────────────────────────┘    │                 │
│ • OpenAI API    │                                                        │                 │
└─────────────────┘                                                        └─────────────────┘
```

## Data Flow Patterns

### V3.0 Professional Assessment Integration (August 30, 2025)

**Critical V3.0 Enhancements Applied**: The system now includes professional-grade Deal Quality scoring and comprehensive portfolio intelligence.

**Key V3.0 Schema Changes**:
- Added `professionalAssessment` fields to Deal model with complete weighted scoring system
- Added `isFullAnalysis` flag distinguishing full vs skinny analysis
- Enhanced `portfolioContext` with fit scoring and diversification impact
- Added support for multi-property types (SFR, MF, Commercial, Self-Storage, etc.)
- Implemented skinny metrics calculator for manual portfolio properties

**V3.0 Professional Assessment Fields**:
- `dealQuality` (0-100) - Primary weighted score
- `cashFlowScore`, `irrScore`, `marketStrengthScore` - Component scores
- `strategicRecommendations`, `riskMitigation`, `opportunityMaximization` - AI insights
- Complete persistence through save/load cycles

## Data Flow Patterns

### 1. V3.0 Portfolio-Aware Analysis Flow (Full Analysis)

When analyzing a property with V3.0 Professional Assessment and optional portfolio context:

```
Frontend Wizard/Form
    ↓
Collect: propertyData + portfolioId (optional) + ownershipPercentage
    ↓
POST /api/deals/analyze
    ↓
Backend Controller (deals.ts)
    ├─→ Run Property Analysis (SFRAnalyzer)
    ├─→ V3.0 Professional Assessment Engine:
    │    ├─→ Calculate Deal Quality Score (0-100)
    │    ├─→ Calculate Component Scores (Cash Flow, IRR, Market Strength, etc.)
    │    ├─→ Generate Strategic Recommendations
    │    ├─→ Generate Risk Mitigation Plans
    │    └─→ Generate Opportunity Maximization Strategies
    └─→ IF portfolioId:
         ├─→ Load Portfolio (portfolioService.getPortfolioById)
         ├─→ Calculate Portfolio Analytics (portfolioAnalyticsService)
         ├─→ Generate Portfolio Context (generatePortfolioContext)
         └─→ Calculate Portfolio Fit Score
    ↓
Response includes (V3.0):
    - analysis.isFullAnalysis: true
    - analysis.keyMetrics (recalculated)
    - analysis.investmentDecision.verdict (BUY/NEGOTIATE/CAUTION/PASS)
    - analysis.investmentDecision.professionalAssessment:
        - dealQuality: 68 (0-100 weighted score)
        - executionDifficulty: 45
        - dataReliability: 90
        - cashFlowScore: 75 (35% weight)
        - irrScore: 82 (25% weight)
        - marketStrengthScore: 65 (15% weight)
        - debtStructureScore: 70 (10% weight)
        - exitStrategyScore: 60 (10% weight)
        - capRateScore: 55 (3% weight)
        - propertyRiskScore: 80 (2% weight)
        - primaryInsight: "Solid opportunity with negotiation potential"
        - strategicRecommendations: [array]
        - riskMitigation: [array]
        - opportunityMaximization: [array]
    - analysis.investmentDecision.portfolioContext (if portfolioId):
        - portfolioId, portfolioName, fitScore, fitLevel
        - fitAnalysis, diversificationImpact, riskContribution
    ↓
Frontend displays V3.0 Professional Investment Analysis with Deal Quality gauge
```

### 2. V3.0 Skinny Metrics Flow (Manual Portfolio Properties)

When adding manual properties to portfolios using the skinny calculator:

```
Frontend AddManualPropertyModal
    ↓
Collect: Basic property data (propertyType, purchasePrice, monthlyRent, monthlyOperatingExpenses, portfolioId)
    ↓
POST /api/deals (with source: 'PORTFOLIO_MANUAL_ENTRY')
    ↓
Backend Controller (deals.ts createDeal)
    ├─→ Detect manual portfolio property
    ├─→ PortfolioPropertyMetricsService.calculatePortfolioMetrics():
    │    ├─→ Calculate basic metrics (Cap Rate, Cash-on-Cash, Monthly ROI)
    │    ├─→ Handle zero loan parameters (prevent $Infinity bug)
    │    ├─→ Support all property types (SFR, MF, Commercial, Self-Storage, etc.)
    │    └─→ Use EXACTLY user-provided values (no smart defaults/overrides)
    └─→ Update Portfolio Analytics (portfolioAnalyticsService)
    ↓
Response includes (V3.0 Skinny):
    - analysis.isFullAnalysis: false
    - analysis.keyMetrics:
        - capRate: 6.2 (calculated from NOI / Purchase Price)
        - cashOnCashReturn: 8.1 (calculated from cash flow)
        - totalReturn: 14.8 (combined metrics)
        - monthlyRoi: 0.68
    - analysis.monthlyAnalysis:
        - income: { gross: 3200, net: 3200 }
        - expenses: { total: 1150 }
        - cashFlow: 2050
    - No AI insights (skinny analysis)
    - No market intelligence (skinny analysis)
    ↓
Portfolio Analytics updated with new property metrics
Frontend Portfolio Dashboard shows updated aggregated metrics
```

### 3. Frontend to Backend (Analysis Request)

When a user submits property data for analysis:

| Frontend Field | Backend Field | Transformation |
|----------------|---------------|----------------|
| `propertyType` | `propertyType` | V3.0: Now supports SFR, MF, COMMERCIAL_*, SELF_STORAGE, MOBILE_HOME_PARK, OTHER |
| `propertyName` | `propertyName` | None |
| `portfolioId` | `portfolioId` | V3.0: Optional ObjectId reference to portfolio |
| `ownershipPercentage` | `ownershipPercentage` | V3.0: Defaults to 100% if not specified |
| `source` | `source` | V3.0: Auto-detected ('FULL_ANALYSIS' or 'PORTFOLIO_MANUAL_ENTRY') |
| `propertyAddress` | `propertyAddress` | None |
| `purchasePrice` | `purchasePrice` | None |
| `downPayment` | `downPayment` | None |
| `interestRate` | `interestRate` | None |
| `loanTerm` | `loanTerm` | None |
| `closingCosts` | `closingCosts` | Default to 0 if undefined |
| `repairCosts` | `repairCosts` | Default to 0 if undefined |
| `propertyTaxRate` | `propertyTaxRate` | None |
| `insuranceRate` | `insuranceRate` | None |
| `maintenanceCost` | `maintenanceCost` | Wizard: Calculated from percentage (5% × monthlyRent × 12), Manual: Direct value |
| `propertyManagementRate` | `propertyManagementRate` | None |
| `capitalInvestments` | `capitalInvestments` | Default to 0 if undefined |
| `tenantTurnoverFees.prepFees` | `tenantTurnoverFees.prepFees` | Default to 500 if undefined |
| `tenantTurnoverFees.realtorCommission` | `tenantTurnoverFees.realtorCommission` | Default to 0.5 if undefined |
| `monthlyRent` (SFR) | `monthlyRent` | None |
| `squareFootage` (SFR) | `squareFootage` | None |
| `bedrooms` (SFR) | `bedrooms` | None |
| `bathrooms` (SFR) | `bathrooms` | None |
| `longTermAssumptions` | `longTermAssumptions` | Apply defaults for missing values |
| `exitStrategy` (NEW) | `exitStrategy` | Professional exit strategy configuration |
| `exitStrategy.primaryExitStrategy` | `exitStrategy.primaryExitStrategy` | Maps to: 'sale', 'refinance', '1031exchange', 'estate', 'flexible' |
| `exitStrategy.portfolioStrategy` | `exitStrategy.portfolioStrategy` | Maps to: 'first', 'geographic', 'cashflow', 'appreciation', 'diversification' |

### 4. Backend to Frontend (V3.0 Analysis Response)

When the backend returns V3.0 analysis results:

| Backend Field | Frontend Field | Transformation |
|---------------|----------------|----------------|
| `analysis.isFullAnalysis` | Used for UI conditionals | V3.0: Boolean flag (true=full, false=skinny) |
| `monthlyAnalysis` | `monthlyAnalysis` | Ensure all properties exist, normalize structure |
| `annualAnalysis` | `annualAnalysis` | Calculate from monthly if missing |
| `longTermAnalysis.projections` | `longTermAnalysis.projections` | Always recalculated for consistency (full analysis only) |
| `keyMetrics` | `keyMetrics` | Ensure all metrics are present |
| `aiInsights` | `aiInsights` | Enhanced with Intelligence Multiplier analysis (full analysis only) |
| **`investmentDecision`** | **`investmentDecision`** | **V3.0 Professional investment verdict and analysis** |
| `investmentDecision.verdict` | InvestmentDecisionHero display | V3.0: Maps to 'BUY', 'NEGOTIATE', 'CAUTION', 'PASS' |
| `investmentDecision.confidence` | Percentage display (deprecated) | V3.0: Use professionalAssessment.dealQuality instead |
| `investmentDecision.score` | Score display (deprecated) | V3.0: Use professionalAssessment.dealQuality instead |
| **`investmentDecision.professionalAssessment`** | **Professional Assessment Tab** | **V3.0 NEW: Complete weighted scoring system** |
| `professionalAssessment.dealQuality` | Deal Quality gauge (0-100) | V3.0: Primary weighted score replaces confidence/score |
| `professionalAssessment.cashFlowScore` | Component breakdown | V3.0: 35% weight - cash flow stability |
| `professionalAssessment.irrScore` | Component breakdown | V3.0: 25% weight - total return potential |
| `professionalAssessment.marketStrengthScore` | Component breakdown | V3.0: 15% weight - market tier analysis |
| `professionalAssessment.strategicRecommendations` | Recommendations list | V3.0: AI-generated strategic advice |
| `professionalAssessment.riskMitigation` | Risk mitigation list | V3.0: Professional risk management |
| `professionalAssessment.opportunityMaximization` | Opportunity list | V3.0: Value optimization strategies |
| **`investmentDecision.portfolioContext`** | **Portfolio Fit Tab** | **V3.0: Portfolio-specific analysis** |
| `portfolioContext.fitScore` | Portfolio fit percentage | V3.0: How well property fits portfolio (0-100) |
| `portfolioContext.fitLevel` | Fit description | V3.0: excellent/good/fair/poor |
| `portfolioContext.diversificationImpact` | Impact description | V3.0: Reduces/increases/neutral concentration |
| **`investmentDecision.aiEnhancedContent`** | **AI-Enhanced Tabs** | **V3.0: AI-generated tab content** |
| `aiEnhancedContent.actionPlan` | Strategic Action Plan tab | V3.0: Immediate actions, negotiation focus |
| `aiEnhancedContent.capitalStrategy` | Capital Strategy tab | V3.0: Financing optimization advice |
| `aiEnhancedContent.timeline` | Timeline tab | V3.0: Implementation phases |

### 5. V3.0 Investment Decision Engine Data Flow

The V3.0 Investment Decision Engine processes property and market data to generate professional-grade weighted scoring and investment recommendations:

**Input Data Sources:**
```typescript
// Property Data
SFRData {
  purchasePrice, monthlyRent, exitStrategy, ...
}

// Analysis Results  
AnalysisResult {
  monthlyAnalysis: { cashFlow, totalExpenses },
  keyMetrics: { capRate, cashOnCashReturn, dscr }
}

// Market Intelligence
MarketIntelligence {
  medianCapRate, currentMortgageRate, inflation, unemployment
}

// User Context
UserContext {
  experienceLevel, riskTolerance, investmentGoals, availableCash
}
```

**Processing Pipeline:**
1. **Market Analysis**: Compare property metrics to local market medians
2. **Financial Validation**: Check cash flow, expense ratios, rent-to-price ratios
3. **Risk Assessment**: Evaluate DSCR, vacancy risk, market timing
4. **Walk-Away Price**: Calculate maximum acceptable price using 3 methods
5. **Exit Strategy Optimization**: Adjust hurdle rates based on intended strategy
6. **Experience Adjustments**: Apply novice/intermediate/expert modifications
7. **Confidence Scoring**: Generate 30-95% confidence based on all factors

**V3.0 Processing Pipeline:**
1. **Calculate Component Scores**: Cash Flow (35%), IRR (25%), Market Strength (15%), Debt Structure (10%), Exit Strategy (10%), Cap Rate (3%), Property Risk (2%)
2. **Generate Deal Quality Score**: Weighted average of all components (0-100)
3. **Determine Verdict**: BUY (80+), NEGOTIATE (65-79), CAUTION (50-64), PASS (<50)
4. **Generate Professional Insights**: Strategic recommendations, risk mitigation, opportunity maximization
5. **Portfolio Context**: If portfolioId provided, calculate fit score and impact analysis

**V3.0 Output Data Structure:**
```typescript
InvestmentDecision {
  verdict: 'BUY' | 'NEGOTIATE' | 'CAUTION' | 'PASS',
  confidence: number, // Deprecated - use professionalAssessment.dealQuality
  score: number, // Deprecated - use professionalAssessment.dealQuality
  professionalAssessment: {
    dealQuality: number, // 0-100 weighted score
    executionDifficulty: number,
    dataReliability: number,
    cashFlowScore: number, // Component scores
    irrScore: number,
    marketStrengthScore: number,
    debtStructureScore: number,
    exitStrategyScore: number,
    capRateScore: number,
    propertyRiskScore: number,
    primaryInsight: string,
    strategicRecommendations: string[],
    riskMitigation: string[],
    opportunityMaximization: string[]
  },
  portfolioContext?: { // If portfolioId provided
    portfolioId: string,
    portfolioName: string,
    fitScore: number,
    fitLevel: string,
    fitAnalysis: string,
    diversificationImpact: string,
    riskContribution: string
  },
  aiEnhancedContent: {
    actionPlan: {...},
    capitalStrategy: {...},
    timeline: {...}
  }
}
```

### 6. Frontend to Database (V3.0 Save Property)

When saving a V3.0 property with professional assessment and optional portfolio context:

| Frontend Field | Database Field | Transformation |
|----------------|----------------|----------------|
| All property data | Property document | Flattened into a single document |
| `portfolioId` (if selected) | `portfolioId` | V3.0: Optional ObjectId reference linking property to portfolio |
| `ownershipPercentage` | `ownershipPercentage` | V3.0: Ownership stake (default 100%) |
| `source` | `source` | V3.0: 'FULL_ANALYSIS' or 'PORTFOLIO_MANUAL_ENTRY' |
| `analysis` | `analysis` embedded document | V3.0: Full or skinny analysis is stored |
| `analysis.isFullAnalysis` | `analysis.isFullAnalysis` | V3.0: Boolean flag distinguishing analysis types |
| `analysis.investmentDecision` | `analysis.investmentDecision` | V3.0: Investment decision with professional assessment |
| **`analysis.investmentDecision.professionalAssessment`** | **`analysis.investmentDecision.professionalAssessment`** | **V3.0: Complete weighted scoring system persisted** |
| `professionalAssessment.dealQuality` | `professionalAssessment.dealQuality` | V3.0: Primary 0-100 score stored |
| `professionalAssessment.strategicRecommendations` | `professionalAssessment.strategicRecommendations` | V3.0: AI recommendations persisted |
| `analysis.investmentDecision.portfolioContext` | `analysis.investmentDecision.portfolioContext` | V3.0: Portfolio fit analysis persisted |
| `portfolioContext.fitScore` | `portfolioContext.fitScore` | V3.0: Portfolio fit score (0-100) |
| (none) | `createdAt` | Added automatically |
| (none) | `updatedAt` | Added automatically |
| (none) | `_id` | Generated by MongoDB |

### 7. Database to Frontend (V3.0 Load Property)

When loading a V3.0 saved property with professional assessment and portfolio context:

| Database Field | Frontend Field | Transformation | Notes |
|----------------|----------------|----------------|-------|
| Property document | Property form data | Restructured to match form structure | Base property data preserved |
| `portfolioId` | Used for portfolio operations | Preserved ObjectId reference | Links property to specific portfolio |
| `ownershipPercentage` | Portfolio operations | V3.0: Preserved ownership stake | Default 100% if missing |
| `source` | Property detection | V3.0: Used to distinguish manual vs analyzed | Determines UI behavior |
| `analysis.isFullAnalysis` | UI conditionals | V3.0: Controls analysis depth display | true=full, false=skinny |
| **`analysis.investmentDecision.professionalAssessment`** | **Professional Assessment Tab** | **V3.0: PRESERVED AND DISPLAYED** | **Complete weighted scoring persists** |
| `professionalAssessment.dealQuality` | Deal Quality gauge | V3.0: Primary 0-100 score display | Replaces deprecated confidence/score |
| `professionalAssessment.strategicRecommendations` | Recommendations list | V3.0: AI-generated advice preserved | Professional insights maintained |
| `analysis.investmentDecision.portfolioContext` | Portfolio Fit tab | V3.0: Portfolio analysis preserved | Fit score and impact analysis |
| `portfolioContext.fitScore` | Portfolio fit display | V3.0: Fit percentage (0-100) | How well property fits portfolio |
| `analysis.investmentDecision.aiEnhancedContent` | AI-Enhanced tabs | V3.0: Action plan, capital strategy, timeline | AI-generated tab content |
| `analysis.marketData` | `analysis.marketData` | Preserved if exists, otherwise re-fetched from cache | **CACHED DATA** |
| `analysis.aiInsights` | `analysis.aiInsights` | **ALWAYS REGENERATED** with current market data | **RECALCULATED** |
| `analysis.monthlyAnalysis` | `analysis.monthlyAnalysis` | **RECALCULATED** using appropriate analyzer | **RECALCULATED** |
| `analysis.keyMetrics` | `analysis.keyMetrics` | **RECALCULATED** (SFRAnalyzer or PortfolioPropertyMetricsService) | **RECALCULATED** |
| `analysis.longTermAnalysis` | `analysis.longTermAnalysis` | **RECALCULATED** using SFRAnalyzer (full analysis only) | **RECALCULATED** |
| `createdAt` | Displayed in UI | Formatted date | Preserved |
| `updatedAt` | Displayed in UI | Formatted date | Preserved |
| `_id` | Used for updates | Preserved for API calls | Preserved |

## Analysis Adapter Rules

The `analysisAdapter.ts` module handles data normalization between storage and UI:

```typescript
/**
 * adaptAnalysisForFrontend rules:
 * 1. Core property data is preserved
 * 2. Monthly analysis structure is normalized
 * 3. All projections are recalculated
 * 4. Exit analysis is recalculated
 * 5. Annual analysis is derived from monthly if missing
 * 6. AI Insights are preserved as-is
 */
```

### Key Transformations

1. **Monthly Analysis Normalization**:
   - Ensure all expense categories exist
   - Calculate totals if missing
   - Normalize mortgage object structure

2. **Yearly Projections Recalculation**:
   - Use consistent formulas for appreciation, income growth, and expense inflation
   - Ensure mortgage balance calculation is consistent
   - Recalculate equity based on property value and mortgage balance

3. **Metrics Calculation**:
   - Cap Rate: Ensure it's based on NOI and purchase price
   - Cash on Cash Return: Based on cash flow and total investment
   - DSCR: Based on NOI and debt service

## Data Validation

### Frontend Validation
- Form fields validated for required values and ranges
- Type checking with TypeScript interfaces
- UI prevents submission of invalid data

### Backend Validation
- Request body validated against schema
- Type conversion for numeric values
- Defaults applied for optional fields

## Example: Property Save/Load Flow

1. **User Saves a Property**:
   ```
   UI Form → Frontend State → API Request → Backend Controller → 
   Data Validation → Database Save → Response ID → UI Success Message
   ```

2. **User Loads a Property**:
   ```
   UI Request → Frontend API Call → Backend Controller → 
   Database Query → Adapter Processing → Frontend State → UI Form Population
   ```

## Backward Compatibility

To maintain backward compatibility when data structures change:

1. **Database Layer**:
   - New fields are optional
   - Default values provided for missing fields
   - Version field tracks schema version

2. **API Layer**:
   - Response adapters handle legacy formats
   - Required fields remain consistent
   - New fields added incrementally

3. **Frontend Layer**:
   - Component props handle missing data
   - Default values for visualization
   - Error boundaries catch rendering issues

## Future Data Mapping Considerations

### Multi-Family Data Mapping

For future Multi-Family implementation:

| SFR Field | MF Field | Transformation |
|-----------|----------|----------------|
| `monthlyRent` | Calculated from `unitTypes` | Sum of (unit count × monthly rent) for each unit type |
| `squareFootage` | `totalSqft` | None |
| (none) | `unitTypes` | Array of unit type objects |
| `maintenanceCost` | `maintenanceCostPerUnit` | Multiplied by unit count |
| (none) | `commonAreaUtilities` | New object with utility costs |

### AI Integration Data Mapping

For enhanced AI analysis:

| Analysis Data | AI Input | Transformation |
|---------------|----------|----------------|
| Key metrics | Formatted prompt | Values extracted and formatted for LLM consumption |
| Property details | Formatted prompt | Relevant details extracted |
| (none) | Location data | Added from external APIs based on address |
| AI Response | `aiInsights` | Parsed from structured JSON response |

## ZIP Code Field Naming Convention

To ensure consistency and backward compatibility, the application handles ZIP code data with the following conventions:

### Property Data Structure
- In property data objects, the ZIP code field is named `zipCode` (camelCase with capital C) as part of the `propertyAddress` object:
  ```typescript
  propertyAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string; // Standard naming in property objects
  }
  ```

### Census API Parameters
- The Census API controller accepts both `zip` and `zipCode` parameters for backward compatibility
- When both parameters are provided, `zipCode` takes precedence
- Internally, the backend always uses `zip` when communicating with the Census service:
  ```typescript
  // In censusController.ts
  const zipCode = (req.query.zipCode as string) || (req.query.zip as string);
  
  const params: CensusQueryParams = {
    // ... other params
    zip: zipCode, // Always map to 'zip' for internal consistency
  };
  ```

### Frontend Implementation
- When preparing Census API requests in the frontend, always map from `propertyAddress.zipCode` to the `zip` parameter:
  ```typescript
  const params: CensusQueryParams = {
    zip: propertyData.propertyAddress?.zipCode, // Map from zipCode to zip
    state: propertyData.propertyAddress?.state,
    // Include other parameters as needed
  };
  ```
- The `ExtendedPropertyAddress` interface might include a `zip` field for backward compatibility, but always prefer using `propertyAddress.zipCode` from the standard property data structure

### Data Transformation Rules
1. Frontend components should use `propertyAddress.zipCode` when accessing property data
2. When preparing Census API requests, map from `propertyAddress.zipCode` to the `zip` parameter
3. UI components should display ZIP codes with consistent formatting (e.g., 5-digit or ZIP+4 format)

This approach ensures backward compatibility while maintaining a clear standard for future development.

## Property Wizard Data Mapping

### Wizard-Specific Field Transformations

The Property Wizard uses percentage-based inputs that are converted to absolute values during backend processing:

| Wizard Field | Backend Calculation | Notes |
|--------------|-------------------|--------|
| `maintenanceReservePercentage` | `maintenanceCost = (monthlyRent × percentage / 100) × 12` | Default: 5% of annual rent |
| `downPaymentPercentage` | `downPayment = purchasePrice × (percentage / 100)` | Default: 25% |
| `closingCostPercentage` | `closingCosts = purchasePrice × (percentage / 100)` | Default: 2.5% |
| `vacancyRate` | Stored in `longTermAssumptions.vacancyRate` | Default: 5% |

### Frontend Display Logic

The frontend `AnalysisResults.tsx` component includes special logic to handle wizard vs. manual data:

```typescript
// Only preserve user input maintenance values if they're meaningful (> 0)
// Don't override backend calculations when propertyData.maintenanceCost is 0 (wizard)
if (propertyData.maintenanceCost !== undefined && propertyData.maintenanceCost > 0) {
  // Use manual entry
  analysis.monthlyAnalysis.expenses.maintenance = propertyData.maintenanceCost;
} else {
  // Preserve backend-calculated values from wizard
  // Backend calculated: 5% × monthlyRent × 12
}
```

### Data Flow for Wizard Submissions

```
Wizard Form (percentages) → Backend Conversion → Analysis Calculation → Frontend Display
┌─────────────────────┐     ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
│ maintenanceReserve  │────→│ Calculate actual │──→│ SFRAnalyzer     │──→│ Preserve backend│
│ Percentage: 5%      │     │ cost: $1,197    │   │ projections     │   │ calculated      │
│ monthlyRent: $1,995 │     │ (5% × $1,995×12)│   │ with inflation  │   │ values in UI    │
└─────────────────────┘     └─────────────────┘   └─────────────────┘   └─────────────────┘
```

## Data Persistence and Caching Strategy

### Current Implementation (as of January 2025)

The application uses a sophisticated caching and persistence strategy to optimize performance while ensuring data accuracy:

### 1. Market Intelligence Data Caching

#### RentCast API Data
- **Cache Location**: MongoDB `api_cache` collection
- **Cache Duration**: 30 days (configurable via `RENTCAST_CACHE_TTL_DAYS`)
- **Cache Key Strategy**: Based on ZIP code, address, and API endpoint
- **Cached Data Types**:
  - Property rent estimates
  - Comparable properties
  - Market trend data
  - Property valuations

#### FRED Economic Data
- **Cache Location**: MongoDB `api_cache` collection  
- **Cache Duration**: 1 day for economic indicators
- **Cached Data Types**:
  - Mortgage rates
  - Inflation data
  - Housing price indices
  - Employment data

### 2. Deal Storage and Loading Strategy

#### New Deal Analysis
```
User Input → SFRAnalyzer.analyzeWithMarketIntelligence() → Fetch/Use Cached Market Data → AI Analysis → Save Complete Analysis
```

#### Saved Deal Loading (Enhanced as of January 2025)
```
Load Deal → Check for Stored Market Data → Re-run SFRAnalyzer.analyzeWithMarketIntelligence() → Preserve Cached Data → Regenerate AI Insights → Return Enhanced Analysis
```

### 3. Data Categories by Persistence Strategy

#### ✅ **SAVED AND PRESERVED**
- Base property data (address, purchase price, financial details)
- Market intelligence data (if available)
- Market insights (if available) 
- Investment timing analysis (if available)
- Deal metadata (created/updated dates, IDs)

#### 🔄 **ALWAYS RECALCULATED**
- Monthly analysis (income, expenses, cash flow)
- Annual analysis (NOI, debt service, returns)
- Key financial metrics (cap rate, cash-on-cash, DSCR)
- Long-term projections (yearly forecasts)
- **AI insights (ALWAYS regenerated with fresh market context)**

#### 💾 **CACHED BUT REFRESHED**
- Market data from RentCast (30-day cache)
- Economic indicators from FRED (1-day cache)
- Comparable properties data
- Market trend analysis

### 4. Enhanced Saved Deal Loading Logic

When a user loads a saved deal, the system now:

1. **Loads the saved deal** from MongoDB
2. **Checks for cached market intelligence data** in the deal
3. **Re-runs full analysis** using `SFRAnalyzer.analyzeWithMarketIntelligence()`
4. **Preserves cached market data** if fresh data isn't available
5. **Generates fresh AI insights** with full market intelligence context
6. **Returns enhanced analysis** with consistent intelligent predictions

### 5. Benefits of Current Strategy

#### Performance Benefits
- ✅ Reduces API calls through intelligent caching
- ✅ Faster load times for saved deals
- ✅ Consistent analysis quality between new and saved deals

#### Data Quality Benefits  
- ✅ Investment scores display correctly on saved deals
- ✅ AI predictions are consistent and intelligent (not basic math)
- ✅ Market intelligence is utilized even for saved deals
- ✅ Temperature effects in AI are mitigated through full context

#### User Experience Benefits
- ✅ No difference in analysis quality between new vs saved deals
- ✅ Saved deals benefit from latest analysis engine improvements
- ✅ Market data stays current through intelligent caching

### 6. Cache Management

#### Cache Invalidation
- Market data cache expires after 30 days
- Economic data cache expires after 1 day
- Manual cache clearing available for development/testing

#### Cache Optimization
- ZIP code-based grouping reduces redundant API calls
- Intelligent fallbacks when cache misses occur
- Graceful degradation when external APIs are unavailable

## Pipeline Deal Flow Data Mapping (August 30, 2025)

The Pipeline system manages deal flow separately from analyzed deals, with its own data flow patterns and collection structure.

### Pipeline Deal Collection Structure

Pipeline deals are stored in a separate `PipelineDeal` collection with the following key differences from analyzed `Deal` documents:

```typescript
PipelineDeal {
  _id: ObjectId,
  userId: ObjectId,
  dealName: string,
  askingPrice: number,
  propertyType: PropertyType, // Supports all types (SFR, MF, Commercial, etc.)
  address: {
    street: string,
    city: string,
    state: string,
    zipCode: string
  },
  sourceInfo: {
    channel: DealSource, // MLS, AGENT, DIRECT_MARKETING, etc.
    contact: string,
    notes: string
  },
  propertyDetails: {
    // Property-specific details based on type
    bedrooms?: number, // SFR
    bathrooms?: number, // SFR
    squareFootage?: number,
    units?: number, // Multi-family
    // ... other type-specific fields
  },
  stage: PipelineStage, // LEAD, ANALYSIS, NEGOTIATION, etc.
  analysisStatus: 'NOT_ANALYZED' | 'IN_PROGRESS' | 'COMPLETE',
  analysisId?: ObjectId, // Reference to full Deal analysis if completed
  quickMetrics?: {
    cashFlow: number,
    capRate: number,
    cashOnCashReturn: number,
    verdict: 'BUY' | 'NEGOTIATE' | 'CAUTION' | 'PASS',
    dealQuality: number // 0-100 professional assessment score
  },
  confidence: {
    level: 1 | 2 | 3, // Investment insights level
    dataSource: 'BASIC_INFO' | 'QUICK_METRICS' | 'FULL_ANALYSIS'
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Pipeline-to-SFR Analysis Data Flow

When a Pipeline deal is analyzed using the full SFR Analysis system:

```
Pipeline Deal (PipelineDeal collection)
    ↓
User clicks "Analyze Deal" → PipelineSkinnyCalculator
    ↓
Check if deal.analysisStatus === 'COMPLETE' && deal.analysisId exists
    ├─→ YES: Navigate to existing analysis (/sfr-analysis?id=${analysisId})
    └─→ NO: Extract deal data for new analysis
    ↓
Extract Pipeline data to SFR format:
    - dealName → propertyName
    - askingPrice → purchasePrice
    - address → propertyAddress
    - propertyDetails → bedrooms, bathrooms, squareFootage, etc.
    ↓
SessionStorage transfer for form population:
    sessionStorage.setItem('pipelineDealData', JSON.stringify(extractedData))
    ↓
Navigate to SFR Analysis page (/sfr-analysis)
    ↓
SFR Analysis loads sessionStorage data and populates form
    ↓
User completes analysis → Full Deal document created (Deal collection)
    ↓
Update Pipeline deal:
    - analysisStatus = 'COMPLETE'
    - analysisId = newDeal._id
    - quickMetrics = extracted from analysis
    - confidence.level = 3, confidence.dataSource = 'FULL_ANALYSIS'
```

### Pipeline Data Extraction Patterns

When extracting data from Pipeline deals for analysis or display:

| Pipeline Field | Extraction Target | Transformation Notes |
|----------------|------------------|---------------------|
| `dealName` | `propertyName` | Direct mapping |
| `askingPrice` | `purchasePrice` | Direct mapping |
| `address` | `propertyAddress` | Object structure preserved |
| `propertyDetails.bedrooms` | `bedrooms` | SFR properties only |
| `propertyDetails.bathrooms` | `bathrooms` | SFR properties only |
| `propertyDetails.squareFootage` | `squareFootage` | All property types |
| `propertyDetails.units` | `units` | Multi-family properties |
| `quickMetrics.*` | Display values | From completed analysis |
| `analysisId` | Deal reference | ObjectId for full analysis lookup |

### Confidence Level Calculation for Pipeline Deals

The confidence indicator system uses a 3-level approach:

```javascript
// Level 1: Basic deal information only
if (!deal.quickMetrics && deal.analysisStatus !== 'COMPLETE') {
  return 1;
}

// Level 2: Quick metrics calculated (skinny calculator)
if (deal.quickMetrics && deal.analysisStatus !== 'COMPLETE') {
  return 2;
}

// Level 3: Full analysis completed and linked
if (deal.analysisStatus === 'COMPLETE' && deal.analysisId) {
  return 3;
}
```

### Pipeline Deal Update Flow

When updating Pipeline deals with analysis results:

```
SFR Analysis Complete → Extract key metrics
    ↓
Prepare Pipeline update data:
    {
      analysisStatus: 'COMPLETE',
      analysisId: dealId,
      quickMetrics: {
        cashFlow: analysis.monthlyAnalysis.cashFlow,
        capRate: analysis.keyMetrics.capRate,
        cashOnCashReturn: analysis.keyMetrics.cashOnCashReturn,
        verdict: analysis.investmentDecision.verdict,
        dealQuality: analysis.investmentDecision.professionalAssessment?.dealQuality
      },
      confidence: {
        level: 3,
        dataSource: 'FULL_ANALYSIS'
      }
    }
    ↓
Update both collections:
    - Update PipelineDeal document with quick metrics
    - Create/update Deal document with full analysis
```

### Data Consistency Rules

1. **Single Source of Truth**: Full analysis data is stored in Deal collection
2. **Pipeline Summary**: PipelineDeal stores summary metrics for dashboard display
3. **Reference Integrity**: analysisId links Pipeline deal to full Deal document
4. **Status Synchronization**: analysisStatus must match actual analysis state
5. **Confidence Accuracy**: confidence.level must reflect actual data completeness

### Pipeline-Specific API Endpoints

| Endpoint | Purpose | Data Flow |
|----------|---------|-----------|
| `GET /api/pipeline/deals` | Load pipeline deals | PipelineDeal collection → UI |
| `PUT /api/pipeline/deals/:id` | Update pipeline deal | UI → PipelineDeal collection |
| `POST /api/deals/analyze` | Create full analysis | Pipeline data → Deal collection |
| `PUT /api/deals/:id` | Update existing analysis | Deal collection (both Pipeline + regular) |

### Error Handling and Edge Cases

1. **Missing analysisId**: Handle cases where Pipeline deal claims completion but has no linked analysis
2. **Orphaned references**: Deal exists but Pipeline deal analysisId is invalid
3. **Status mismatch**: analysisStatus doesn't match actual analysis state
4. **Data corruption**: Handle null/undefined values gracefully in extraction

### 7. Future Considerations

#### Potential Optimizations
- Add user preference for cache refresh frequency
- Implement background cache warming for popular markets
- Add cache analytics and hit/miss monitoring

#### Scalability Considerations
- Monitor cache size and implement cleanup strategies
- Consider Redis cache for high-frequency data
- Implement cache partitioning for different data types
