# Real Estate Investment Intelligence Platform - Data Dictionary

**Last Updated**: October 28, 2025 - Multi-Family Analyzer Implementation Complete (Stories 1.1-1.6)

This document serves as a central reference for all data fields used throughout the Real Estate Investment Intelligence Platform. This includes the sophisticated Investment Decision Engine, AI microservices architecture, and professional-grade analysis capabilities.

## Implementation Status Legend
- ✅ **Implemented**: Field is actively used and returned by TypeScript analyzers
- ❌ **Missing**: Field is documented but not implemented in current TypeScript code  
- 🔄 **Planned**: Field is planned for future implementation
- 📋 **Legacy**: Field exists in old JavaScript code but not in active TypeScript implementation

## User & Authentication Data Fields

### User Model Fields
| Field Name | Type | Description | Required | Validation |
|------------|------|-------------|----------|------------|
| `_id` | ObjectId | MongoDB unique identifier | Auto | MongoDB generated |
| `email` | string | User's email address (unique) | Yes | Email format validation |
| `password` | string | Hashed password (bcrypt) | Yes | Min 8 chars, not selected by default |
| `firstName` | string | User's first name | Yes | Max 50 characters |
| `lastName` | string | User's last name | Yes | Max 50 characters |
| `role` | string enum | User role ('user' or 'admin') | Yes | Default: 'user' |
| `isVerified` | boolean | Email verification status | Yes | Default: false |
| `createdAt` | Date | Account creation timestamp | Auto | MongoDB timestamp |
| `updatedAt` | Date | Last update timestamp | Auto | MongoDB timestamp |
| `lastLogin` | Date | Last successful login | No | Updated on login |

### Authentication API Fields
| Field Name | Type | Description | Used In |
|------------|------|-------------|---------|
| `accessToken` | string | JWT access token | Login/Register responses |
| `refreshToken` | string | JWT refresh token | Login/Register responses |
| `currentPassword` | string | Current password for changes | Change password requests |
| `newPassword` | string | New password for changes | Change password requests |

### Deal Model Updates
| Field Name | Type | Description | Required | Notes |
|------------|------|-------------|----------|-------|
| `userId` | ObjectId | Reference to User who owns the deal | Yes | Added for user association |

## Property Data Fields

### Base Property Fields
| Field Name | Type | Description | Required | Used In |
|------------|------|-------------|----------|---------|
| `propertyType` | string enum | Type of property ('SFR' or 'MF') | Yes | All property forms |
| `propertyName` | string | User-defined name for the property | Yes | All property forms |
| `propertyAddress.street` | string | Street address | Yes | All property forms |
| `propertyAddress.city` | string | City | Yes | All property forms |
| `propertyAddress.state` | string | State/Province | Yes | All property forms |
| `propertyAddress.zipCode` | string | ZIP/Postal code | Yes | All property forms |
| `purchasePrice` | number | Purchase price of property | Yes | All property forms |
| `downPayment` | number | Down payment amount | Yes | All property forms |
| `interestRate` | number | Annual interest rate (%) | Yes | All property forms |
| `loanTerm` | number | Loan term in years | Yes | All property forms |
| `closingCosts` | number | Closing costs | No | All property forms |
| `repairCosts` | number | Repair/renovation costs | No | All property forms |
| `propertyTaxRate` | number | Annual property tax as % of property value | Yes | All property forms |
| `insuranceRate` | number | Annual insurance as % of property value | Yes | All property forms |
| `maintenanceCost` | number | Monthly maintenance cost | Yes | All property forms |
| `propertyManagementRate` | number | Property management fee as % of rent | Yes | All property forms |
| `yearBuilt` | number | Year the property was built | No | All property forms |
| `capitalInvestments` | number | One-time capital improvements or major upgrades | No | All property forms |
| `tenantTurnoverFees.prepFees` | number | Costs to prepare property between tenants | No | All property forms |
| `tenantTurnoverFees.realtorCommission` | number | Commission for finding new tenants (as multiplier of monthly rent) | No | All property forms |

### SFR-Specific Fields
| Field Name | Type | Description | Required | Used In |
|------------|------|-------------|----------|---------|
| `monthlyRent` | number | Monthly rental income | Yes | SFR property form |
| `squareFootage` | number | Total square footage | Yes | SFR property form |
| `bedrooms` | number | Number of bedrooms | Yes | SFR property form |
| `bathrooms` | number | Number of bathrooms | Yes | SFR property form |

### Multi-Family Specific Fields

**Story 1.1**: Enhanced with unit-level granularity for competitive advantage. Supports two input methods:
1. **unitTypes[]** - Simplified aggregated input (Property Wizard default)
2. **units[]** - Granular unit-level input (Advanced users, RentCast integration)

#### Building Details
| Field Name | Type | Description | Required | Used In |
|------------|------|-------------|----------|---------|
| `totalUnits` | number | Total number of rental units (2-32 target range) | Yes | MF property form |
| `totalSqft` | number | Total rentable square footage across all units | Yes | MF property form |
| `yearBuilt` | number | Year the property was built | Yes | MF property form |
| `buildingType` | string enum | 'GARDEN', 'MID_RISE', 'COMPLEX' (Phase 1: Commercial MF 5+ units) | No | MF property form |

#### Unit Configuration - Method 1: Aggregated (Simplified)
| Field Name | Type | Description | Required | Used In |
|------------|------|-------------|----------|---------|
| `unitTypes[]` | array | Array of unit type configurations | Conditional | MF property form (wizard) |
| `unitTypes[].type` | string | Unit type description (e.g., "2bed/1bath", "Studio") | Yes | MF property form |
| `unitTypes[].count` | number | How many units of this type | Yes | MF property form |
| `unitTypes[].sqft` | number | Square feet per unit of this type | Yes | MF property form |
| `unitTypes[].monthlyRent` | number | Current monthly rent per unit of this type | Yes | MF property form |

#### Unit Configuration - Method 2: Granular (Advanced) ✨ COMPETITIVE MOAT
| Field Name | Type | Description | Required | Used In |
|------------|------|-------------|----------|---------|
| `units[]` | array | Array of individual unit details | Conditional | MF property form (advanced) |
| `units[].unitNumber` | string | Unit identifier (e.g., "101", "2A") | No | MF property form |
| `units[].bedrooms` | number | Number of bedrooms (0 for studio, 1-4+) | Yes | MF property form |
| `units[].bathrooms` | number | Number of bathrooms (1.0, 1.5, 2.0, etc.) | Yes | MF property form |
| `units[].squareFeet` | number | Individual unit square footage | Yes | MF property form |
| `units[].currentRent` | number | What tenant actually pays per month | Yes | MF property form |
| `units[].marketRent` | number | ✨ Market rent from RentCast API (competitive advantage) | No | MF property form |
| `units[].isVacant` | boolean | Track physical vacancy at unit level | No | MF property form |
| `units[].condition` | string enum | 'EXCELLENT', 'GOOD', 'FAIR', 'POOR' (for renovation planning) | No | MF property form |
| `units[].leaseEndDate` | string | ISO date for turnover planning | No | MF property form |

#### Operating Expenses - MF Specific
| Field Name | Type | Description | Required | Used In |
|------------|------|-------------|----------|---------|
| `maintenanceCostPerUnit` | number | Monthly maintenance budget per unit | Yes | MF property form |
| `commonAreaUtilities` | object | Common area utility costs (monthly amounts) | Yes | MF property form |
| `commonAreaUtilities.electric` | number | Common area electricity per month | Yes | MF property form |
| `commonAreaUtilities.water` | number | Water/sewer for common areas per month | Yes | MF property form |
| `commonAreaUtilities.gas` | number | Gas for common areas per month | Yes | MF property form |
| `commonAreaUtilities.trash` | number | Trash removal service per month | Yes | MF property form |

#### Financing Options - MF Specific
| Field Name | Type | Description | Required | Used In |
|------------|------|-------------|----------|---------|
| `loanType` | string enum | 'RESIDENTIAL' (1-4 units), 'COMMERCIAL' (5+ units) | No | MF property form |
| `balloonPayment` | object | Balloon payment details (typical for commercial MF loans) | No | MF property form |
| `balloonPayment.years` | number | Years until balloon payment due (typical: 5, 7, 10) | No | MF property form |
| `balloonPayment.amount` | number | Balloon payment amount (calculated if not provided) | No | MF property form |

### Long-Term Assumptions Fields
| Field Name | Type | Description | Required | Used In |
|------------|------|-------------|----------|---------|
| `longTermAssumptions.annualRentIncrease` | number | Annual rent increase (%) | Yes | All property forms |
| `longTermAssumptions.annualExpenseIncrease` | number | Annual expense increase (%) | Yes | All property forms |
| `longTermAssumptions.annualPropertyValueIncrease` | number | Annual property value appreciation (%) | Yes | All property forms |
| `longTermAssumptions.vacancyRate` | number | Expected vacancy rate (%) | Yes | All property forms |
| `longTermAssumptions.sellingCosts` | number | Selling costs as % of sale price | Yes | All property forms |
| `longTermAssumptions.projectionYears` | number | Number of years for projections | Yes | All property forms |
| `longTermAssumptions.turnoverFrequency` | number | Average tenant stay in years | No | All property forms |

## Analysis Fields

### Monthly Analysis Fields
| Field Name | Type | Description | Calculated | Used In |
|------------|------|-------------|------------|---------|
| `monthlyAnalysis.income.gross` | number | Gross monthly income | Yes | Analysis results |
| `monthlyAnalysis.income.effective` | number | Effective income after vacancy | Yes | Analysis results |
| `monthlyAnalysis.expenses.propertyTax` | number | Monthly property tax | Yes | Analysis results |
| `monthlyAnalysis.expenses.insurance` | number | Monthly insurance | Yes | Analysis results |
| `monthlyAnalysis.expenses.maintenance` | number | Monthly maintenance | Yes | Analysis results |
| `monthlyAnalysis.expenses.propertyManagement` | number | Monthly property management fee | Yes | Analysis results |
| `monthlyAnalysis.expenses.vacancy` | number | Monthly vacancy cost | Yes | Analysis results |
| `monthlyAnalysis.expenses.mortgage.total` | number | Total monthly mortgage payment | Yes | Analysis results |
| `monthlyAnalysis.expenses.mortgage.principal` | number | Principal portion of payment | Yes | Analysis results |
| `monthlyAnalysis.expenses.mortgage.interest` | number | Interest portion of payment | Yes | Analysis results |
| `monthlyAnalysis.expenses.total` | number | Total monthly expenses | Yes | Analysis results |
| `monthlyAnalysis.cashFlow` | number | Monthly cash flow | Yes | Analysis results |

### Annual Analysis Fields
| Field Name | Type | Description | Calculated | Used In |
|------------|------|-------------|------------|---------|
| `annualAnalysis.effectiveGrossIncome` | number | Annual effective gross income | Yes | Analysis results |
| `annualAnalysis.operatingExpenses` | number | Annual operating expenses | Yes | Analysis results |
| `annualAnalysis.noi` | number | Net Operating Income | Yes | Analysis results |
| `annualAnalysis.debtService` | number | Annual debt service (mortgage) | Yes | Analysis results |
| `annualAnalysis.cashFlow` | number | Annual cash flow | Yes | Analysis results |

### Key Metrics Fields

#### Common Metrics (Both SFR and MF)
| Field Name | Type | Description | Status | Used In |
|------------|------|-------------|---------|---------|
| `keyMetrics.capRate` | number | Capitalization Rate (%): (NOI ÷ Purchase Price) × 100 | ✅ Implemented | Analysis results |
| `keyMetrics.cashOnCashReturn` | number | Cash on Cash Return (%): (Annual Cash Flow ÷ Total Investment) × 100 | ✅ Implemented | Analysis results |
| `keyMetrics.dscr` | number | Debt Service Coverage Ratio: NOI ÷ Annual Debt Service | ✅ Implemented | Analysis results |
| `keyMetrics.noi` | number | Net Operating Income: EGI - Operating Expenses (annual) | ✅ Implemented | Analysis results |
| `keyMetrics.irr` | number | Internal Rate of Return (%): Time-weighted annualized return | ✅ Implemented | Analysis results |
| `keyMetrics.operatingExpenseRatio` | number | Operating Expense Ratio (%): (Operating Expenses ÷ EGI) × 100 | ✅ Implemented | Analysis results |
| `keyMetrics.totalInvestment` | number | Total investment amount: Down Payment + Closing Costs + Capital Investments | ✅ Implemented | Analysis results |

#### SFR-Specific Metrics
| Field Name | Type | Description | Status | Used In |
|------------|------|-------------|---------|---------|
| `keyMetrics.pricePerSqFt` | number | Price per square foot (SFR): Purchase Price ÷ Square Footage | ✅ Implemented | SFR analysis |
| `keyMetrics.rentPerSqFt` | number | Rent per square foot (SFR): Monthly Rent ÷ Square Footage | ✅ Implemented | SFR analysis |
| `keyMetrics.grossRentMultiplier` | number | Gross Rent Multiplier (SFR): Purchase Price ÷ Annual Gross Rent | ✅ Implemented | SFR analysis |

#### Multi-Family Specific Metrics (Story 1.4)

**Core MF Metrics**
| Field Name | Type | Description | Status | Used In |
|------------|------|-------------|---------|---------|
| `keyMetrics.grm` | number | Gross Rent Multiplier: Purchase Price ÷ Gross Annual Income (Target: 4-7) | ✅ Implemented | MF analysis |
| `keyMetrics.debtYield` | number | Debt Yield (%): (NOI ÷ Loan Amount) × 100 (Lender req: 10%+) | ✅ Implemented | MF analysis |
| `keyMetrics.breakEvenOccupancy` | number | Break-Even Occupancy (%): ((OpEx + Debt Service) ÷ Gross Income) × 100 | ✅ Implemented | MF analysis |
| `keyMetrics.rentPerSqft` | number | Rent per Square Foot (MF): Gross Monthly Income ÷ Total Square Feet | ✅ Implemented | MF analysis |
| `keyMetrics.grossYield` | number | Gross Yield (%): (Gross Annual Income ÷ Purchase Price) × 100 (Target: 8-12%) | ✅ Implemented | MF analysis |

**Advanced MF Metrics**
| Field Name | Type | Description | Status | Used In |
|------------|------|-------------|---------|---------|
| `keyMetrics.unitMixEfficiency` | number | Unit Mix Efficiency (0-100): Rent optimization score across unit types | ✅ Implemented | MF analysis |
| `keyMetrics.economicVacancyRate` | number | Economic Vacancy Rate (%): Total income loss from vacancy + below-market rents | ✅ Implemented | MF analysis |
| `keyMetrics.commonAreaExpenseRatio` | number | Common Area Expense Ratio: Common area utility costs per square foot | ✅ Implemented | MF analysis |

**Per-Unit Metrics (MF)**
| Field Name | Type | Description | Status | Used In |
|------------|------|-------------|---------|---------|
| `keyMetrics.pricePerUnit` | number | Price per Unit: Purchase Price ÷ Total Units | ✅ Implemented | MF analysis |
| `keyMetrics.noiPerUnit` | number | NOI per Unit (annual): NOI ÷ Total Units | ✅ Implemented | MF analysis |
| `keyMetrics.cashFlowPerUnit` | number | Cash Flow per Unit (annual): Annual Cash Flow ÷ Total Units | ✅ Implemented | MF analysis |
| `keyMetrics.averageRentPerUnit` | number | Average Rent per Unit (monthly): Gross Income ÷ Total Units ÷ 12 | ✅ Implemented | MF analysis |
| `keyMetrics.operatingExpensePerUnit` | number | Operating Expense per Unit (annual): Operating Expenses ÷ Total Units | ✅ Implemented | MF analysis |

**Contextual Fields (for clarity)**
| Field Name | Type | Description | Status | Used In |
|------------|------|-------------|---------|---------|
| `keyMetrics.effectiveGrossIncome` | number | Effective Gross Income: Gross Income - Vacancy - Credit Loss (2%) | ✅ Implemented | MF analysis |
| `keyMetrics.grossIncome` | number | Gross Income: Potential income at 100% occupancy | ✅ Implemented | MF analysis |
| `keyMetrics.operatingExpenses` | number | Operating Expenses: Total annual operating costs (excludes vacancy, mortgage) | ✅ Implemented | MF analysis |

### Long-Term Analysis Fields
| Field Name | Type | Description | Calculated | Used In |
|------------|------|-------------|------------|---------|
| `longTermAnalysis.projections[].year` | number | Year number | Yes | Analysis results |
| `longTermAnalysis.projections[].grossRent` | number | Annual gross rent | Yes | Analysis results |
| `longTermAnalysis.projections[].operatingExpenses` | number | Annual operating expenses | Yes | Analysis results |
| `longTermAnalysis.projections[].noi` | number | Net Operating Income | Yes | Analysis results |
| `longTermAnalysis.projections[].debtService` | number | Annual debt service | Yes | Analysis results |
| `longTermAnalysis.projections[].cashFlow` | number | Annual cash flow | Yes | Analysis results |
| `longTermAnalysis.projections[].propertyValue` | number | Property value | Yes | Analysis results |
| `longTermAnalysis.projections[].mortgageBalance` | number | Remaining mortgage balance | Yes | Analysis results |
| `longTermAnalysis.projections[].equity` | number | Equity in property | Yes | Analysis results |
| `longTermAnalysis.projections[].propertyTax` | number | Annual property tax | Yes | Analysis results |
| `longTermAnalysis.projections[].insurance` | number | Annual insurance | Yes | Analysis results |
| `longTermAnalysis.projections[].maintenance` | number | Annual maintenance | Yes | Analysis results |
| `longTermAnalysis.projections[].propertyManagement` | number | Annual property management | Yes | Analysis results |
| `longTermAnalysis.projections[].vacancy` | number | Annual vacancy cost | Yes | Analysis results |
| `longTermAnalysis.projections[].turnoverCosts` | number | Annual tenant turnover costs | Yes | Analysis results |
| `longTermAnalysis.projections[].capitalImprovements` | number | Capital investments (only in year 1) | Yes | Analysis results |
| `longTermAnalysis.projections[].appreciation` | number | Annual appreciation amount | Yes | Analysis results |
| `longTermAnalysis.projections[].totalReturn` | number | Total return for the year | Yes | Analysis results |
| `longTermAnalysis.returns.irr` | number | Internal Rate of Return (%) | Yes | Analysis results |
| `longTermAnalysis.returns.totalCashFlow` | number | Total cash flow over projection period | Yes | Analysis results |
| `longTermAnalysis.returns.totalAppreciation` | number | Total appreciation over projection period | Yes | Analysis results |
| `longTermAnalysis.returns.totalReturn` | number | Total return over projection period | Yes | Analysis results |
| `longTermAnalysis.returns.totalInvestment` | number | Total investment amount (same as keyMetrics.totalInvestment) | ✅ Yes | Analysis results |
| `longTermAnalysis.returns.totalAdditionalInvestment` | number | Capital investments only (subset of totalInvestment) | ✅ Yes | Analysis results |
| `longTermAnalysis.exitAnalysis.projectedSalePrice` | number | Projected sale price | Yes | Analysis results |
| `longTermAnalysis.exitAnalysis.sellingCosts` | number | Selling costs | Yes | Analysis results |
| `longTermAnalysis.exitAnalysis.mortgagePayoff` | number | Mortgage payoff amount | Yes | Analysis results |
| `longTermAnalysis.exitAnalysis.netProceedsFromSale` | number | Net proceeds from sale | Yes | Analysis results |
| `longTermAnalysis.exitAnalysis.returnOnInvestment` | number | Return on Investment (%) | Yes | Analysis results |
| `longTermAnalysis.projectionYears` | number | Number of years projected | Yes | Analysis results |

### AI Insights Fields
| Field Name | Type | Description | Calculated | Used In |
|------------|------|-------------|------------|---------|
| `aiInsights.summary` | string | Summary of investment analysis | Yes | Analysis results |
| `aiInsights.strengths` | string[] | List of investment strengths | Yes | Analysis results |
| `aiInsights.weaknesses` | string[] | List of investment weaknesses | Yes | Analysis results |
| `aiInsights.recommendations` | string[] | List of recommendations | Yes | Analysis results |
| `aiInsights.investmentScore` | number | Investment score (0-100) | Yes | Analysis results |
| `aiInsights.riskAssessment` | string | Risk assessment analysis | Yes | Analysis results |
| `aiInsights.marketTrendPrediction` | string | Market trend predictions | Yes | Analysis results |
| `aiInsights.optimalExitStrategy` | object/string | Exit strategy recommendations | Yes | Analysis results |
| `aiInsights.recommendedHoldPeriod` | string | Recommended hold period | Yes | Analysis results |
| `aiInsights.boldPredictions` | object | Detailed future projections | Yes | Analysis results |
| `aiInsights.boldPredictions.wealthCreation` | object | Wealth creation forecasts | Yes | Analysis results |
| `aiInsights.boldPredictions.cashFlowGrowth` | object | Cash flow growth predictions | Yes | Analysis results |
| `aiInsights.boldPredictions.rentGrowthForecast` | object | Rent growth predictions | Yes | Analysis results |
| `aiInsights.boldPredictions.exitStrategy` | object | Exit strategy timing predictions | Yes | Analysis results |

### Market Intelligence Fields
| Field Name | Type | Description | Cached | Used In |
|------------|------|-------------|--------|---------|
| `marketData.property.rentEstimate` | number | Market rent estimate | Yes (30 days) | Analysis results |
| `marketData.property.rentRange.low` | number | Lower rent range estimate | Yes (30 days) | Analysis results |
| `marketData.property.rentRange.high` | number | Upper rent range estimate | Yes (30 days) | Analysis results |
| `marketData.property.valueEstimate` | number | Market value estimate | Yes (30 days) | Analysis results |
| `marketData.property.capRateEstimate` | number | Market cap rate estimate | Yes (30 days) | Analysis results |
| `marketData.property.marketPosition` | string | Position relative to market | Yes (30 days) | Analysis results |
| `marketData.property.confidence` | number | Confidence score (0-100) | Yes (30 days) | Analysis results |
| `marketData.comparables[]` | array | Comparable properties | Yes (30 days) | Analysis results |
| `marketData.comparables[].address` | string | Comparable property address | Yes (30 days) | Analysis results |
| `marketData.comparables[].salePrice` | number | Recent sale price | Yes (30 days) | Analysis results |
| `marketData.comparables[].pricePerSqft` | number | Price per square foot | Yes (30 days) | Analysis results |
| `marketData.marketTrends.medianRent` | number | ZIP code median rent | Yes (30 days) | Analysis results |
| `marketData.marketTrends.rentGrowthRate` | number | Annual rent growth rate (%) | Yes (30 days) | Analysis results |
| `marketData.marketTrends.medianSalePrice` | number | ZIP code median sale price | Yes (30 days) | Analysis results |
| `marketData.economicIndicators.currentMortgageRate` | number | Current mortgage rate (%) | Yes (1 day) | Analysis results |
| `marketData.economicIndicators.inflationRate` | number | Current inflation rate (%) | Yes (1 day) | Analysis results |
| `marketInsights[]` | array | Market analysis insights | Yes | Analysis results |
| `marketInsights[].category` | string | Insight category | Yes | Analysis results |
| `marketInsights[].insight` | string | Market insight text | Yes | Analysis results |
| `marketInsights[].impact` | string | Expected impact | Yes | Analysis results |
| `marketInsights[].confidence` | number | Confidence level (0-100) | Yes | Analysis results |
| `investmentTiming.recommendation` | string | Buy/Hold/Wait recommendation | Yes | Analysis results |
| `investmentTiming.confidence` | number | Timing confidence (0-100) | Yes | Analysis results |
| `investmentTiming.reasoning` | string[] | Reasoning for recommendation | Yes | Analysis results |
| `investmentTiming.marketCycle` | string | Current market cycle phase | Yes | Analysis results |
| `investmentTiming.timingScore` | number | Timing score (0-100) | Yes | Analysis results |

## Database Fields

### Property Document Fields
| Field Name | Type | Description | Required | Used In |
|------------|------|-------------|----------|---------|
| `_id` | ObjectId | MongoDB document ID | Yes | Database |
| `createdAt` | Date | Creation timestamp | Yes | Database |
| `updatedAt` | Date | Last update timestamp | Yes | Database |

## Guidelines for Adding New Fields

When adding new fields to the application, please follow these guidelines:

1. **Update this dictionary**: Add the new field with all required information
2. **Use consistent naming**: Follow existing naming conventions
3. **Add proper typing**: Include TypeScript interface updates
4. **Document calculations**: If the field is calculated, document the formula
5. **Update validations**: Add appropriate validation rules
6. **Consider backwards compatibility**: Ensure existing data remains valid

## Field Validation Rules

### Numeric Fields
- **Monetary amounts**: Non-negative numbers, typically 2 decimal places
- **Percentages**: Typically between 0-100, 2 decimal places
- **Counts**: Non-negative integers (bedrooms, bathrooms, etc.)

### String Fields
- **Names**: 1-100 characters
- **Addresses**: Follow standard address formatting
- **Enums**: Must match defined enum values

## Default Values

### SFR Default Values
| Field | Default Value |
|-------|---------------|
| `propertyManagementRate` | 8 |
| `vacancyRate` | 5 |
| `loanTerm` | 30 |
| `annualRentIncrease` | 3 |
| `annualExpenseIncrease` | 2 |
| `annualPropertyValueIncrease` | 3 |
| `projectionYears` | 10 |
| `sellingCosts` | 6 |

## Calculation Formulas

### Key Formulas
- **Cap Rate**: `(NOI / Purchase Price) * 100`
- **Cash on Cash Return**: `(Annual Cash Flow / Total Investment) * 100`
- **DSCR**: `NOI / Annual Debt Service`
- **Monthly Mortgage Payment**: `P * r * (1 + r)^n / ((1 + r)^n - 1)` where:
  - P = loan amount
  - r = monthly interest rate (annual rate / 12)
  - n = number of payments (years * 12)
- **Tenant Turnover Costs**: `(prepFees + (monthlyRent * realtorCommission)) * turnoverRate` where:
  - prepFees = costs to prepare property between tenants
  - realtorCommission = commission as multiplier of monthly rent
  - turnoverRate = min(0.9, (1/turnoverFrequency) * (vacancyRate / 5))
    - turnoverFrequency = average tenant stay in years (default: 2)
    - vacancyRate / 5 normalizes around standard 5% vacancy
    - 0.9 caps maximum turnover rate at 90% 

## Advanced Metrics

| Metric | Description | Formula | Good Value |
|--------|-------------|---------|------------|
| Cap Rate | Annual return based on property value | (NOI / Purchase Price) × 100 | >5% |
| Cash on Cash Return | Annual cash return on invested capital | (Annual Cash Flow / Total Investment) × 100 | >8% |
| IRR (Internal Rate of Return) | Annualized return accounting for time value of money | Complex formula using all cash flows | >15% |
| DSCR (Debt Service Coverage Ratio) | Ability to cover debt payments | NOI / Annual Debt Service | >1.25 |
| Operating Expense Ratio | Operating expenses as percentage of income | (Operating Expenses / Gross Income) × 100 | <50% |
| Break-Even Occupancy | Occupancy rate needed to cover expenses | ((Operating Expenses + Debt Service) / Gross Potential Rent) × 100 | <85% |
| Equity Multiple | Total return divided by initial investment | Total Return / Total Investment | >2.0x |
| One Percent Rule Value | Monthly rent as percentage of purchase price | (Monthly Rent / Purchase Price) × 100 | >1% |
| Fifty Rule Analysis | Whether operating expenses are ≤ 50% of gross rent | Operating Expenses ≤ (Gross Rent × 0.5) | Pass |
| Rent-to-Price Ratio | Monthly rent divided by purchase price | (Monthly Rent / Purchase Price) × 100 | >0.8% |
| Price Per Bedroom | Purchase price divided by number of bedrooms | Purchase Price / Number of Bedrooms | Market dependent |
| Debt-to-Income Ratio | Annual debt service divided by annual income | (Annual Debt Service / Annual Income) × 100 | <50% |
| Return on Improvements | Return generated by capital improvements | For actual renovations: ((NOI with improvements - NOI without improvements) / Capital Investments) × 100<br>For new investments: Estimated at 8% standard return | >8% |
| Turnover Cost Impact | Turnover costs as percentage of gross income | (Annual Turnover Costs / Gross Income) × 100 | <2% |

## Data Recalculation and Caching Behavior

### Analysis Data Behavior (Updated January 2025)

| Data Category | New Analysis | Saved Deal Load | Cached Duration | Notes |
|---------------|--------------|-----------------|-----------------|-------|
| **Base Property Data** | Input from user | Preserved from database | Permanent | Never recalculated |
| **Monthly Analysis** | Calculated fresh | **RECALCULATED** via SFRAnalyzer | Not cached | Ensures consistency |
| **Annual Analysis** | Calculated fresh | **RECALCULATED** via SFRAnalyzer | Not cached | Ensures consistency |
| **Key Metrics** | Calculated fresh | **RECALCULATED** via SFRAnalyzer | Not cached | Ensures consistency |
| **Long-term Projections** | Calculated fresh | **RECALCULATED** via SFRAnalyzer | Not cached | Ensures consistency |
| **Market Data** | Fetched from RentCast/FRED | Preserved if exists, otherwise re-fetched | 30 days (RentCast), 1 day (FRED) | **CACHED DATA** |
| **Market Insights** | Generated from market data | Preserved if exists, otherwise regenerated | Tied to market data cache | **CACHED DATA** |
| **Investment Timing** | Generated from market data | Preserved if exists, otherwise regenerated | Tied to market data cache | **CACHED DATA** |
| **AI Insights** | Generated with full context | **ALWAYS REGENERATED** with market intelligence | Never cached | Ensures intelligent predictions |

### Key Benefits of Current Strategy

1. **Consistent Analysis Quality**: Saved deals get the same high-quality analysis as new deals
2. **Market Intelligence Utilization**: Cached market data is properly utilized for AI insights
3. **Performance Optimization**: Market data is cached but financial calculations are fresh
4. **Intelligent AI Predictions**: AI always gets full market context, preventing basic math fallbacks

### Cache Management

- **RentCast Data**: Cached in MongoDB `api_cache` collection for 30 days
- **FRED Economic Data**: Cached in MongoDB `api_cache` collection for 1 day  
- **Cache Keys**: Based on ZIP code, address, and API endpoint for efficient retrieval
- **Fallback Strategy**: If cache miss occurs, fresh API calls are made automatically

### Troubleshooting Data Issues

| Issue | Likely Cause | Solution |
|-------|--------------|----------|
| Investment score shows 0 | Falsy value check in frontend | Fixed: Use `typeof === 'number'` check |
| AI predictions are basic math | Missing market intelligence context | Fixed: Always regenerate AI insights with market data |
| Inconsistent analysis quality | Old analysis caching strategy | Fixed: Always recalculate core metrics |
| Missing market data | API cache miss or expired data | Automatic: System fetches fresh data and caches it |

## Intelligence Multiplier Data Fields

### AI Insights - Intelligence Multiplier Fields (NEW - July 19, 2025)

| Field Name | Type | Description | Required | Default |
|------------|------|-------------|----------|---------|
| `metricIntelligence` | Array<MetricIntelligence> | Professional transformation of key metrics | No | [] |
| `riskBlindSpots` | Array<RiskBlindSpot> | Critical risks novice investors miss | No | [] |
| `opportunityAlternatives` | Array<OpportunityAlternative> | Alternative investment options | No | [] |
| `advancedStrategies` | Array<AdvancedStrategy> | Professional investment strategies | No | [] |
| `competitiveIntelligence` | CompetitiveIntelligence | Market competition insights | No | null |
| `intelligenceScore` | number | Analysis sophistication score (0-100) | No | 85 |
| `sophisticationLevel` | string enum | Analysis sophistication level | No | 'professional' |
| `transformationInsights` | string | Summary of analysis transformation | No | Auto-generated |
| `professionalEquivalent` | string | Value proposition statement | No | "$1,500-3,000" |

### MetricIntelligence Object

| Field Name | Type | Description | Required |
|------------|------|-------------|----------|
| `metricName` | string | Name of the metric being analyzed | Yes |
| `noviceView` | string | How beginners interpret this metric | Yes |
| `proInsight` | string | Professional-level understanding | Yes |
| `actionItem` | string | Specific action to take | Yes |
| `benchmark` | string | Industry standard for comparison | Yes |
| `warning` | string | Critical risk or caution | Yes |
| `riskLevel` | string enum | 'low' \| 'medium' \| 'high' \| 'critical' | Yes |

### RiskBlindSpot Object

| Field Name | Type | Description | Required |
|------------|------|-------------|----------|
| `riskType` | string | Type of risk identified | Yes |
| `description` | string | Detailed risk description | Yes |
| `probability` | string | Likelihood of occurrence | Yes |
| `impact` | string | Potential impact on investment | Yes |
| `mitigation` | string | How to mitigate this risk | Yes |
| `priority` | string enum | 'low' \| 'medium' \| 'high' \| 'critical' | Yes |

### OpportunityAlternative Object

| Field Name | Type | Description | Required |
|------------|------|-------------|----------|
| `category` | string enum | 'real_estate' \| 'investment' \| 'timing' \| 'market' | Yes |
| `title` | string | Alternative opportunity name | Yes |
| `description` | string | Detailed description | Yes |
| `expectedReturn` | string | Expected return profile | Yes |
| `riskLevel` | string | Risk assessment | Yes |
| `benefit` | string | Key benefit of this alternative | Yes |

### AdvancedStrategy Object

| Field Name | Type | Description | Required |
|------------|------|-------------|----------|
| `strategyType` | string | Category of strategy | Yes |
| `title` | string | Strategy name | Yes |
| `description` | string | Detailed strategy description | Yes |
| `implementation` | string | How to implement | Yes |
| `costEstimate` | string | Implementation cost | Yes |
| `expectedROI` | string | Expected return on investment | Yes |
| `timeframe` | string | Implementation timeline | Yes |
| `difficulty` | string enum | 'beginner' \| 'intermediate' \| 'advanced' | Yes |

### CompetitiveIntelligence Object

| Field Name | Type | Description | Required |
|------------|------|-------------|----------|
| `marketInsight` | string | Key market intelligence | Yes |
| `winningStrategies` | string[] | Successful investor strategies | Yes |
| `losingPatterns` | string[] | Common investor mistakes | Yes |
| `localTrends` | string[] | Local market trends | Yes |
| `investorBehavior` | string | Market participant analysis | Yes |

## Investment Decision Engine Data Fields (V3.0 - August 27, 2025)

The Investment Decision Engine V3.0 Professional Calibration provides institutional-grade weighted scoring system with AI-enhanced content generation and comprehensive financial consistency validation.

### V3.0 Professional Assessment Fields (NEW - August 27, 2025)

| Field Name | Type | Description | Required | Used In |
|------------|------|-------------|----------|---------|
| `investmentDecision.professionalAssessment.dealQuality` | number | Weighted professional quality score (0-100) | Yes | Primary scoring metric |
| `investmentDecision.professionalAssessment.executionDifficulty` | number | Complexity score for executing investment (0-100) | Yes | Execution planning |
| `investmentDecision.professionalAssessment.dataReliability` | number | Input data confidence score (0-100) | Yes | Analysis confidence |
| `investmentDecision.professionalAssessment.cashFlowScore` | number | Cash flow stability score (0-100, 35% weight) | Yes | Primary factor |
| `investmentDecision.professionalAssessment.irrScore` | number | Total return potential score (0-100, 25% weight) | Yes | Return analysis |
| `investmentDecision.professionalAssessment.marketStrengthScore` | number | Market quality score (0-100, 15% weight) | Yes | Market analysis |
| `investmentDecision.professionalAssessment.debtStructureScore` | number | Financing quality score (0-100, 10% weight) | Yes | Debt assessment |
| `investmentDecision.professionalAssessment.exitStrategyScore` | number | Liquidity options score (0-100, 10% weight) | Yes | Exit planning |
| `investmentDecision.professionalAssessment.capRateScore` | number | Yield competitiveness score (0-100, 3% weight) | Yes | Current yield |
| `investmentDecision.professionalAssessment.propertyRiskScore` | number | Property risk assessment (0-100, 2% weight) | Yes | Risk evaluation |
| `investmentDecision.professionalAssessment.primaryInsight` | string | Main professional insight | Yes | Investment summary |
| `investmentDecision.professionalAssessment.strategicRecommendations` | string[] | Strategic improvement recommendations | Yes | Action guidance |
| `investmentDecision.professionalAssessment.riskMitigation` | string[] | Risk mitigation strategies | Yes | Risk management |
| `investmentDecision.professionalAssessment.opportunityMaximization` | string[] | Opportunity enhancement strategies | Yes | Optimization |

### AI Enhanced Content Fields (NEW - August 27, 2025)

| Field Name | Type | Description | Required | Used In |
|------------|------|-------------|----------|---------|
| `investmentDecision.aiEnhancedContent.actionPlan.immediateActions` | string[] | 24-48 hour priority actions | Yes | Strategic Action Plan UI |
| `investmentDecision.aiEnhancedContent.actionPlan.negotiationFocus` | string[] | Key negotiation leverage points | Yes | Deal Sensitivity Analysis |
| `investmentDecision.aiEnhancedContent.actionPlan.preparationItems` | string[] | Pre-closing preparation checklist | Yes | Execution timeline |
| `investmentDecision.aiEnhancedContent.actionPlan.timeframe` | string | Recommended execution timeline | Yes | Timeline planning |
| `investmentDecision.aiEnhancedContent.capitalStrategy.currentAssessment` | string | Current financing structure analysis | Yes | Capital Strategy UI |
| `investmentDecision.aiEnhancedContent.capitalStrategy.optimizedApproach` | string | Recommended financing optimization | Yes | Structure improvement |
| `investmentDecision.aiEnhancedContent.capitalStrategy.alternativeOptions` | string[] | Alternative financing strategies | Yes | Creative financing |
| `investmentDecision.aiEnhancedContent.capitalStrategy.recommendation` | string | Professional capital deployment advice | Yes | Strategic guidance |

### Core Investment Decision Fields

| Field Name | Type | Description | Required | Used In |
|------------|------|-------------|----------|---------|
| `investmentDecision.verdict` | string enum | Professional investment recommendation | Yes | Analysis results, Investment Hero |
| `investmentDecision.confidence` | number | Confidence score (30-95) | Yes | Analysis results, Investment Hero |
| `investmentDecision.primaryReason` | string | Main explanation for verdict | Yes | Analysis results, Investment Hero |
| `investmentDecision.secondaryReasons` | string[] | Supporting reasons and factors | No | Analysis details |
| `investmentDecision.keyRisks` | string[] | Identified investment risks | No | Risk assessment |
| `investmentDecision.actionPlan` | ActionItem[] | Recommended next steps | No | Action plan UI |
| `investmentDecision.capitalStrategy` | CapitalDeploymentAdvice | Capital deployment recommendations | No | Strategy advice |
| `investmentDecision.marketContext` | MarketContextAnalysis | Market-relative analysis | No | Market intelligence |
| `investmentDecision.timeline` | InvestmentTimeline | Recommended timing | No | Timeline guidance |
| `investmentDecision.goalContext` | GoalContext | Goal-contextual messaging | No | Personalized UI |
| `investmentDecision.portfolioContext` | PortfolioContext | Portfolio integration analysis | No | Portfolio-aware analysis |

### Portfolio Context Fields (Enhanced - August 25, 2025)
Portfolio context is generated when analyzing properties with an associated portfolio, providing sophisticated portfolio integration insights.

| Field Name | Type | Description | Required | Used In |
|------------|------|-------------|----------|---------|
| `investmentDecision.portfolioContext.portfolioId` | string | Portfolio ObjectId reference | Yes | Portfolio linking |
| `investmentDecision.portfolioContext.portfolioName` | string | Display name of target portfolio | Yes | UI display |
| `investmentDecision.portfolioContext.portfolioGoal` | string | Portfolio primary goal (CASH_FLOW, etc.) | Yes | Goal alignment |
| `investmentDecision.portfolioContext.currentProperties` | number | Current number of properties in portfolio | Yes | Portfolio metrics |
| `investmentDecision.portfolioContext.monthlyNetCashFlow` | number | Portfolio current monthly cash flow | Yes | Cash flow impact |
| `investmentDecision.portfolioContext.totalValue` | number | Total portfolio property value | Yes | Value metrics |
| `investmentDecision.portfolioContext.fitAnalysis` | string | AI-generated portfolio fit analysis | Yes | Strategic insights |
| `investmentDecision.portfolioContext.impactSummary` | string | Goal-specific impact summary | Yes | Impact messaging |

### V3.0 Investment Verdict Enum Values

| Value | Description | Deal Quality Range | Typical Use Case |
|-------|-------------|-------------------|------------------|
| `'BUY'` | Excellent professional opportunity | 80-100 | Property meets professional investment standards |
| `'NEGOTIATE'` | Good with optimization needed | 65-79 | Strong potential with price/terms improvements |
| `'CAUTION'` | Below professional standards | 50-64 | High risk, significant issues to address |
| `'PASS'` | Reject - seek better opportunities | 0-49 | Poor fundamentals, avoid investment |

## Portfolio Intelligence Data Fields (Implemented - August 2025)

The Portfolio Intelligence system enables users to manage multiple properties with real-time analytics, AI insights, and goal tracking.

### Portfolio Model Fields

| Field Name | Type | Description | Required | Used In |
|------------|------|-------------|----------|---------|
| `_id` | ObjectId | MongoDB unique identifier | Auto | Portfolio referencing |
| `userId` | ObjectId | Owner user reference | Yes | User association |
| `name` | string | Portfolio display name | Yes | UI display |
| `description` | string | Portfolio description | No | UI display |
| `goals.primaryGoal` | string enum | Primary investment goal | Yes | Goal-based analysis |
| `goals.targetMonthlyIncome` | number | Target monthly cash flow | No | Goal tracking |
| `goals.targetTotalValue` | number | Target portfolio value | No | Goal tracking |
| `goals.targetPropertyCount` | number | Target number of properties | No | Goal tracking |
| `preferences.propertyTypes` | string[] | Preferred property types | No | Property matching |
| `preferences.priceRange.min` | number | Minimum property price | No | Property filtering |
| `preferences.priceRange.max` | number | Maximum property price | No | Property filtering |
| `preferences.markets` | string[] | Target markets/cities | No | Market analysis |
| `createdAt` | Date | Portfolio creation timestamp | Auto | MongoDB timestamp |
| `updatedAt` | Date | Last update timestamp | Auto | MongoDB timestamp |

### Portfolio Analytics Fields

| Field Name | Type | Description | Required | Used In |
|------------|------|-------------|----------|---------|
| `portfolioId` | ObjectId | Portfolio reference | Yes | Analytics association |
| `summary.totalProperties` | number | Number of properties | Yes | Dashboard metrics |
| `summary.totalValue` | number | Total portfolio value | Yes | Financial summary |
| `summary.monthlyRentalIncome` | number | Total monthly rental income | Yes | Cash flow analysis |
| `summary.monthlyNetCashFlow` | number | Net monthly cash flow | Yes | Performance tracking |
| `summary.averageCapRate` | number | Portfolio average cap rate | Yes | Yield analysis |
| `summary.averageCashOnCash` | number | Portfolio average CoC return | Yes | Return analysis |
| `summary.totalEquity` | number | Total portfolio equity | Yes | Equity tracking |
| `riskAnalysis.geographicConcentration` | string enum | Risk level: LOW/MODERATE/HIGH | Yes | Risk assessment |
| `riskAnalysis.concentrationScore` | number | Concentration risk score (0-100) | Yes | Risk quantification |
| `riskAnalysis.recommendations` | string[] | Risk mitigation recommendations | No | Risk management |
| `lastCalculated` | Date | Last analytics calculation | Auto | Cache management |

### Portfolio AI Insights Fields

| Field Name | Type | Description | Required | Used In |
|------------|------|-------------|----------|---------|
| `portfolioId` | ObjectId | Portfolio reference | Yes | Insights association |
| `portfolioStrength` | string | AI-generated strength analysis | Yes | Portfolio overview |
| `opportunities` | string[] | Growth opportunities | Yes | Strategic planning |
| `risks` | string[] | Portfolio risk factors | Yes | Risk awareness |
| `marketPosition` | string | Competitive position analysis | No | Market context |
| `diversificationAdvice` | string | Diversification recommendations | No | Portfolio optimization |
| `generatedAt` | Date | AI insights generation timestamp | Auto | Content freshness |

### Portfolio Goal Enum Values

| Value | Description | Typical Metrics Focus |
|-------|-------------|----------------------|
| `'CASH_FLOW'` | Maximize monthly income | Net cash flow, cap rates |
| `'WEALTH_BUILDING'` | Long-term appreciation | Total value, equity growth |
| `'ESTATE_BUILDING'` | Generational wealth | Asset accumulation, debt paydown |
| `'TAX_BENEFITS'` | Tax optimization | Depreciation, expense deductions |
| `'HOUSE_HACKING'` | Live-in cost reduction | Personal housing cost offset |
| `'GEOGRAPHIC_DIVERSIFICATION'` | Market risk spread | Geographic distribution |
| `'BALANCED'` | Balanced approach | Mixed metrics optimization |

### ActionItem Object Structure

| Field Name | Type | Description | Required |
|------------|------|-------------|----------|
| `type` | string enum | Action category: 'immediate', 'short_term', 'long_term' | Yes |
| `title` | string | Action item title | Yes |
| `description` | string | Detailed action description | Yes |
| `priority` | string enum | Priority level: 'critical', 'high', 'medium', 'low' | Yes |
| `estimatedCost` | string | Cost estimate for action | No |
| `expectedBenefit` | string | Expected benefit description | No |
| `timeframe` | string | Recommended completion timeframe | No |

### MarketContextAnalysis Object Structure

| Field Name | Type | Description | Required |
|------------|------|-------------|----------|
| `marketPosition` | string | Property position vs market median | Yes |
| `capRateComparison` | number | Property cap rate vs market median | Yes |
| `rentToValueRatio` | number | Monthly rent to purchase price ratio | Yes |
| `marketTrends` | string[] | Relevant local market trends | No |
| `competitivePosition` | string | Position vs comparable properties | No |
| `marketRisk` | string enum | Market risk level: 'low', 'medium', 'high' | Yes |

### GoalContext Object Structure (Goal-Contextual Messaging)

| Field Name | Type | Description | Required |
|------------|------|-------------|----------|
| `exitStrategy` | string enum | Primary exit strategy | No |
| `portfolioStrategy` | string enum | Portfolio building approach | No |
| `marketTimingFlexibility` | string enum | Timing flexibility level | No |
| `riskApproach` | string enum | Risk tolerance approach | No |
| `capitalDeployment` | string enum | Capital deployment strategy | No |
| `projectionYears` | number | Investment time horizon | No |

### Exit Strategy Enum Values

| Value | Description | Hurdle Rate Adjustment | Special Considerations |
|-------|-------------|----------------------|----------------------|
| `'sale'` | Traditional sale after hold period | Standard 6.5% | Market timing flexibility important |
| `'refinance'` | Cash-out refinance strategy | Standard 6.5% | Focus on appreciation and equity |
| `'1031exchange'` | Tax-deferred exchange | Reduced to 5.5% | Tax benefits consideration |
| `'estate'` | Generational wealth building | Standard 6.5% | Requires positive cash flow buffer |
| `'flexible'` | Opportunistic exit timing | Standard 6.5% | Maximum flexibility approach |

### Portfolio Strategy Enum Values

| Value | Description | Cash Flow Requirements | Risk Adjustments |
|-------|-------------|----------------------|------------------|
| `'first'` | First investment property | Minimum $400/month | Extra safety margins |
| `'geographic'` | Geographic diversification | Standard requirements | Market risk focus |
| `'cashflow'` | Cash flow focused portfolio | Higher cash flow emphasis | Income sustainability |
| `'appreciation'` | Appreciation focused strategy | Lower cash flow acceptance | Market timing critical |
| `'diversification'` | Balanced diversification | Standard requirements | Risk-adjusted approach |

## Leverage Analysis Data Fields (NEW - August 8, 2025)

The Leverage Optimizer provides sophisticated analysis of optimal capital deployment and loan-to-value ratios.

### Core Leverage Analysis Fields

| Field Name | Type | Description | Required | Used In |
|------------|------|-------------|----------|---------|
| `leverageAnalysis.scenarios` | LeverageScenario[] | All analyzed leverage scenarios | Yes | Leverage comparison |
| `leverageAnalysis.optimalScenario` | LeverageScenario | Recommended leverage scenario | Yes | Leverage recommendations |
| `leverageAnalysis.currentScenario` | LeverageScenario | User's current approach | Yes | Comparison analysis |
| `leverageAnalysis.recommendations` | LeverageRecommendation[] | Leverage improvement suggestions | No | Action items |
| `leverageAnalysis.opportunityCost` | OpportunityCostAnalysis | Capital efficiency analysis | No | Investment strategy |
| `leverageAnalysis.stressTestResults` | StressTestResult | Risk scenario analysis | No | Risk assessment |

### LeverageScenario Object Structure

| Field Name | Type | Description | Calculated |
|------------|------|-------------|------------|
| `downPaymentPercent` | number | Down payment percentage (0-100) | Input |
| `downPaymentAmount` | number | Dollar amount of down payment | Calculated |
| `loanAmount` | number | Loan amount | Calculated |
| `monthlyPayment` | number | Monthly mortgage payment | Calculated |
| `monthlyNetCashFlow` | number | Net monthly cash flow | Calculated |
| `cashOnCashReturn` | number | Cash-on-cash return percentage | Calculated |
| `capRate` | number | Capitalization rate | Calculated |
| `dscr` | number | Debt service coverage ratio | Calculated |
| `totalCashRequired` | number | Total cash needed (down + closing) | Calculated |
| `leverageScore` | number | Leverage optimization score (0-100) | Calculated |

### OpportunityCostAnalysis Object Structure

| Field Name | Type | Description | Calculated |
|------------|------|-------------|------------|
| `currentDeployment.cashInvested` | number | Cash invested in current scenario | Calculated |
| `currentDeployment.propertiesControlled` | number | Number of properties controlled | Calculated |
| `currentDeployment.totalAssetValue` | number | Total value of controlled assets | Calculated |
| `currentDeployment.portfolioVelocity` | number | Asset value per dollar invested | Calculated |
| `optimalDeployment.cashInvested` | number | Cash invested in optimal scenario | Calculated |
| `optimalDeployment.propertiesControlled` | number | Properties controlled with optimal leverage | Calculated |
| `optimalDeployment.totalAssetValue` | number | Total asset value with optimization | Calculated |
| `optimalDeployment.portfolioVelocity` | number | Optimal portfolio velocity | Calculated |
| `opportunityCostAnnual` | number | Annual opportunity cost of current approach | Calculated |
| `capitalEfficiencyGap` | number | Efficiency difference multiplier | Calculated |

## Enhanced Analysis Calculations (NEW - August 8, 2025)

### Investment Decision Scoring Algorithm

The Investment Decision Engine uses a sophisticated multi-factor scoring system:

#### Base Confidence Scores
- **BUY Verdict**: Starts at 80% confidence
- **NEGOTIATE Verdict**: Starts at 65% confidence  
- **PASS Verdict**: Starts at 85% confidence

#### Confidence Adjustments
| Factor | Adjustment | Conditions |
|--------|------------|------------|
| **Market-Relative Cap Rate** | ±15% | Property vs median comparison |
| **Rent-to-Price Ratio** | ±20% | Below 0.4% (fail), above 1.2% (flag) |
| **Too Good to Be True** | -30% | Cap rate >1.5x median + long DOM |
| **Operating Expense Ratio** | -15% | Above 50% of rental income |
| **Experience Level** | ±0-25% | Novice: cap at 70%, Expert: up to 95% |
| **Cash Flow Buffer** | ±10% | Adequate buffer vs requirements |
| **Walk-Away Price** | Auto-PASS | Purchase price >110% of calculated max |

#### Walk-Away Price Calculation
The system calculates maximum acceptable price using the **minimum** of:
1. **Treasury Spread Method**: `NOI ÷ (Treasury Rate + 3%)`
2. **Comparable Method**: `Average Comparable Price × 0.95`  
3. **Income Multiplier**: `Monthly Rent × 100`

#### Market-Relative Cap Rate Thresholds
- **PASS**: Property cap rate >1.5% below market median
- **NEGOTIATE**: Property cap rate 0.5-1.5% below market median
- **BUY Consideration**: Property cap rate at or above market median

#### Experience-Based Adjustments
| Experience Level | Hurdle Rate | Confidence Cap | Cash Flow Min | Risk Tolerance |
|-----------------|-------------|----------------|---------------|----------------|
| **Novice** | +1.0% above standard | 70% | $400/month | High safety margins |
| **Intermediate** | Standard rates | 85% | Standard | Standard risk assessment |
| **Experienced** | -0.5% with strong appreciation | 95% | Flexible | Advanced risk tolerance |

#### Exit Strategy Hurdle Rate Adjustments
| Exit Strategy | Hurdle Rate | Rationale |
|---------------|-------------|-----------|
| **1031 Exchange** | 5.5% (vs 6.5% standard) | Tax benefits consideration |
| **Estate/Generational** | 6.5% + positive cash flow requirement | Sustainability critical |
| **Quick Flip (<2 years)** | 12.0% minimum | Short-term capital gains risk |
| **Standard Hold** | 6.5% baseline | Standard investment return |

This comprehensive scoring system ensures professional-grade investment analysis that adapts to market conditions, user experience, and investment strategies.

## Portfolio Data Fields ✅

### Portfolio Model Fields
| Field Name | Type | Description | Required | Implementation Status |
|------------|------|-------------|----------|----------------------|
| `_id` | ObjectId | MongoDB unique identifier | Auto | ✅ Implemented |
| `userId` | ObjectId | Reference to User who owns portfolio | Yes | ✅ Implemented |
| `name` | string | Portfolio name | Yes | ✅ Implemented |
| `description` | string | Portfolio description | No | ✅ Implemented |
| `goals.primaryGoal` | enum | CASH_FLOW, WEALTH_BUILDING, etc. | Yes | ✅ Implemented |
| `goals.targetMonthlyIncome` | number | Target monthly cash flow | Conditional | ✅ Implemented |
| `goals.targetNetWorth` | number | Target net worth | Conditional | ✅ Implemented |
| `goals.targetTimeline` | string | Investment timeline | No | ✅ Implemented |
| `goals.riskTolerance` | enum | CONSERVATIVE, MODERATE, AGGRESSIVE | Yes | ✅ Implemented |
| `settings.includeInSFRAnalysis` | boolean | Show portfolio context in analysis | Yes | ✅ Implemented |
| `settings.alertsEnabled` | boolean | Email alerts enabled | Yes | ✅ Implemented |
| `settings.currency` | string | Currency code (USD) | Yes | ✅ Implemented |
| `status` | enum | ACTIVE, ARCHIVED | Yes | ✅ Implemented |
| `createdAt` | Date | Creation timestamp | Auto | ✅ Implemented |
| `updatedAt` | Date | Last update timestamp | Auto | ✅ Implemented |

### Portfolio Analytics Fields
| Field Name | Type | Description | Calculation | Implementation Status |
|------------|------|-------------|-------------|----------------------|
| `portfolioId` | ObjectId | Reference to Portfolio | - | ✅ Implemented |
| `summary.totalProperties` | number | Count of properties in portfolio | COUNT(deals WHERE portfolioId) | ✅ Implemented |
| `summary.totalValue` | number | Sum of property values | SUM(purchasePrice) | ✅ Implemented |
| `summary.totalEquity` | number | Sum of equity positions | SUM(purchasePrice - loanAmount) | ✅ Implemented |
| `summary.monthlyNetCashFlow` | number | Sum of monthly cash flows | SUM(analysis.monthlyAnalysis.cashFlow) | ✅ Implemented |
| `summary.monthlyRentalIncome` | number | Sum of monthly rents | SUM(monthlyRent) | ✅ Implemented |
| `summary.averageCapRate` | number | Weighted average cap rate | WEIGHTED_AVG(capRate, purchasePrice) | ✅ Implemented |
| `summary.averageCashOnCash` | number | Weighted average CoC return | WEIGHTED_AVG(cashOnCash, downPayment) | ✅ Implemented |
| `summary.totalInvestment` | number | Total capital invested | SUM(downPayment + closingCosts) | ✅ Implemented |
| `risk.geographicConcentration` | number | % of value in top market | MAX(marketValue) / totalValue * 100 | ✅ Implemented |
| `risk.topMarket` | string | Highest concentration location | "Austin, TX: 67%" | ✅ Implemented |
| `risk.leverageRatio` | number | Total debt to value ratio | totalDebt / totalValue | ✅ Implemented |
| `calculatedAt` | Date | Analytics calculation timestamp | Auto | ✅ Implemented |

### Portfolio Context in Property Analysis
| Field Name | Type | Description | Source | Implementation Status |
|------------|------|-------------|--------|----------------------|
| `portfolioContext.portfolioName` | string | Name of selected portfolio | Portfolio.name | ✅ Backend |
| `portfolioContext.portfolioGoal` | string | Portfolio's primary goal | Portfolio.goals.primaryGoal | ✅ Backend |
| `portfolioContext.currentProperties` | number | Current property count | PortfolioAnalytics.summary.totalProperties | ✅ Backend |
| `portfolioContext.monthlyNetCashFlow` | number | Current portfolio cash flow | PortfolioAnalytics.summary.monthlyNetCashFlow | ✅ Backend |
| `portfolioContext.totalValue` | number | Current portfolio value | PortfolioAnalytics.summary.totalValue | ✅ Backend |
| `portfolioContext.fitAnalysis` | string | How property fits portfolio | Calculated based on metrics | ✅ Backend |
| `portfolioContext.impactSummary` | string | Impact on portfolio goals | Goal-specific analysis | ✅ Backend |

---

## Multi-Family Calculation Methodology (Stories 1.1-1.6)

### Critical NOI Calculation Fix (Story 1.2) 🔥

**Implementation**: MultiFamilyAnalyzer.ts lines 237-311

**The Problem (Pre-Story 1.2)**:
- Vacancy was incorrectly included in operating expenses
- This violated institutional underwriting standards
- NOI calculations did not match Fannie Mae/Freddie Mac methodology

**The Solution (Story 1.2 Fix)**:
```typescript
// CORRECT: Vacancy reduces INCOME, not an expense
const vacancyLoss = grossIncome * (vacancyRate / 100);
const creditLoss = grossIncome * 0.02; // 2% industry standard
const effectiveGrossIncome = grossIncome - vacancyLoss - creditLoss;

// Operating expenses DO NOT include vacancy
const operatingExpenses = propertyTax + insurance + propertyManagement +
                          maintenance + commonAreaUtilities + capEx;

// NOI calculation
const noi = effectiveGrossIncome - operatingExpenses;
```

**Industry Validation**:
- ✅ Matches JP Morgan commercial real estate underwriting
- ✅ Matches Wall Street Prep financial modeling standards
- ✅ Matches PropertyMetrics institutional methodology
- ✅ Approved by Business Expert (20-year investor, $10M AUM)

**What Changed**:
- `calculateEffectiveGrossIncome()` - Handles vacancy and credit loss
- `calculateOperatingExpenses()` - Excludes vacancy (only actual operating costs)
- `calculateNOI()` - Uses EGI instead of Gross Income

**Impact**: All NOI-dependent metrics (Cap Rate, DSCR, Debt Yield) now match institutional standards.

---

### Multi-Family Specific Calculations

#### 1. Effective Gross Income (EGI)

**Formula**:
```
EGI = Gross Income - Vacancy Loss - Credit Loss
Vacancy Loss = Gross Income × (Vacancy Rate ÷ 100)
Credit Loss = Gross Income × 2%  (industry standard for tenant non-payment)
```

**Implementation**: MultiFamilyAnalyzer.ts:243-253

**Industry Standard**: 2% credit loss is standard for multifamily (confirmed across 10+ sources)

**Typical EGI**: 93-95% of Gross Income for well-managed properties

---

#### 2. Operating Expenses (MF-Specific Components)

**Formula**:
```
Operating Expenses = Property Tax + Insurance + Property Management +
                     Maintenance + Common Area Utilities + CapEx

EXCLUDES:
❌ Vacancy (reduces income, not an expense)
❌ Mortgage payments (debt service is separate from NOI)
❌ Depreciation (accounting concept, not cash expense)
❌ Income taxes (owner-specific, not property-specific)
```

**Implementation**: MultiFamilyAnalyzer.ts:261-299

**Components Calculated**:
1. **Property Tax**: `purchasePrice × (propertyTaxRate ÷ 100)` (annual)
2. **Insurance**: `purchasePrice × (insuranceRate ÷ 100)` (annual)
3. **Property Management**: `grossIncome × (propertyManagementRate ÷ 100)` (annual)
4. **Maintenance**: `maintenanceCostPerUnit × totalUnits × 12` (annual)
5. **Common Area Utilities**: `(electric + water + gas + trash) × 12` (annual)
6. **CapEx**: `grossIncome × 0.06` (6% of gross income, annual)

**CapEx Note**: Current implementation uses 6% of gross income. Alternative industry approaches:
- $250-300/unit/year (institutional standard)
- 4% for newer properties (<10 years)
- 8-10% for older properties (20+ years)

---

#### 3. Net Operating Income (NOI)

**Formula**:
```
NOI = Effective Gross Income - Operating Expenses
```

**Implementation**: MultiFamilyAnalyzer.ts:310-311

**Industry Standard**: Matches Fannie Mae, Freddie Mac, HUD underwriting methodology

**Typical Range**: 40-60% of Gross Income for well-operated multifamily

**Business Use**:
- Property valuation (Cap Rate calculation)
- Loan qualification (DSCR calculation)
- Investment performance comparison
- Independent of financing structure

---

#### 4. Gross Rent Multiplier (GRM) - Story 1.4

**Formula**:
```
GRM = Purchase Price ÷ Gross Annual Income
```

**Implementation**: MultiFamilyAnalyzer.ts:494-522

**Industry Benchmark**: 4-7 for residential multifamily

**Validation Warnings**:
- GRM < 4: May indicate below-market rents or data quality issues
- GRM > 7: Property may be overpriced relative to income potential

---

#### 5. Debt Yield - Story 1.4

**Formula**:
```
Debt Yield = (NOI ÷ Loan Amount) × 100
```

**Implementation**: MultiFamilyAnalyzer.ts:532-565

**Lender Requirement**: 10%+ minimum for commercial multifamily loans

**Why Lenders Use This**:
- More stable than LTV (not affected by property value fluctuations)
- Directly measures income coverage
- Independent of appraisal

**Validation Warnings**:
- Debt Yield < 10%: May face financing challenges or require larger down payment

---

#### 6. Break-Even Occupancy (BEO) - Story 1.4

**Formula**:
```
BEO = ((Operating Expenses + Annual Debt Service) ÷ Gross Potential Income) × 100
```

**Implementation**: MultiFamilyAnalyzer.ts:575-603

**Industry Benchmark**: 60-75% for stable multifamily properties

**Risk Interpretation**:
- <60%: Excellent safety margin
- 60-75%: Good (industry standard)
- 75-85%: Moderate risk
- >85%: High risk (very little cushion for vacancy)

**Preferred Gap**: 15% difference between historical occupancy and BEO

**Validation Warnings**:
- BEO > 85%: Very little cushion for vacancy - risky investment
- BEO < 60%: Excellent - strong cushion for market fluctuations

---

#### 7. Unit Mix Efficiency - Story 1.4

**Formula**:
```
Unit Mix Efficiency = Rent Optimization Score (0-100)

Based on:
- Rent per square foot variance across units
- Market rent vs actual rent comparison
- Unit type rent optimization
```

**Implementation**: MultiFamilyAnalyzer.ts:662-724

**Score Interpretation**:
- 90-100: Highly optimized rents
- 70-89: Good optimization
- 50-69: Room for improvement
- <50: Significant rent optimization opportunity

---

#### 8. Economic Vacancy Rate - Story 1.4

**Formula**:
```
Economic Vacancy = ((Potential Market Income - Actual Collected Income) ÷ Potential Market Income) × 100

Where:
- Potential Market Income = Σ(Market Rent × 12) for all units
- Actual Collected Income = Σ(Current Rent × 12) for occupied units
```

**Implementation**: MultiFamilyAnalyzer.ts:726-780

**Components**:
- **Physical Vacancy**: Units are empty (no tenant)
- **Economic Vacancy**: Units occupied but rent below market
- **Total Loss**: Physical + Economic

**Typical Range**:
- 0-5%: Excellent (at or near market rents)
- 5-10%: Good (minor loss to market)
- 10-20%: Moderate (value-add opportunity)
- >20%: Significant loss to market (renovation/repositioning needed)

---

#### 9. Per-Unit Normalizations

**Purpose**: Enable comparison across properties of different sizes

**Calculations**:
```typescript
// Annual metrics (MultiFamilyAnalyzer.ts:345-348)
pricePerUnit = purchasePrice ÷ totalUnits
noiPerUnit = noi ÷ totalUnits  // Annual NOI per unit
cashFlowPerUnit = cashFlow ÷ totalUnits  // Annual cash flow per unit

// Monthly metric
averageRentPerUnit = grossIncome ÷ (totalUnits × 12)  // Monthly average
```

**Typical Ranges**:
- **Price per Unit**: $60K-300K (varies by market, size)
- **NOI per Unit**: $5,000-15,000/year
- **Cash Flow per Unit**: $2,000-10,000/year (good: $2,000-6,000)
- **Average Rent**: Varies significantly by market and unit type

---

### Data Validation System (Story 1.5)

**Implementation**: MultiFamilyAnalyzer.ts:14-100

**Validation Checks**:

1. **Unit Count Mismatch Detection**:
   - Compares `totalUnits` field vs `units[]` array length
   - Compares `totalUnits` vs sum of `unitTypes[].count`
   - Warns on discrepancies

2. **Square Footage Validation**:
   - Compares `totalSqft` field vs sum of individual unit square footage
   - Warns if difference exceeds 5%

3. **Rent Reasonability Checks**:
   - Flags rents ≤ $0 as errors
   - Warns if unit rent is >3x or <0.3x average (likely data entry error)

**Purpose**: Catch common data quality issues before analysis, ensuring accurate calculations.

---

### Financial Precision Principle

**Implementation Philosophy**:
- ✅ **No Intermediate Rounding**: All calculations maintain full floating-point precision
- ✅ **Round for Display Only**: Values rounded only in console.log statements (e.g., `.toFixed(2)`)
- ✅ **Consistent Precision**: All financial values calculated with full precision
- ✅ **Audit Trail**: Comprehensive logging for calculation verification

**Why This Matters**:
Rounding intermediate values creates compounding errors in complex calculations like IRR and multi-year projections. This approach matches institutional-grade financial modeling standards.

---

### Phase 1: Commercial MF Building Types (November 2025)

**Implementation**: Phase 1 Commercial MF (5+ units) - 3 building types only

**Building Type Enum Values**:

| Value | Description | Operating Expense Range | Cap Rate Adjustment |
|-------|-------------|------------------------|---------------------|
| `GARDEN` | 2-3 stories, outdoor corridors, parking lot | $250-400/unit/month | 0 bps (baseline) |
| `MID_RISE` | 4-9 stories with elevator | $450-700/unit/month | -150 bps (institutional appeal) |
| `COMPLEX` | Multi-building garden-style on one property | $300-500/unit/month | 0 bps (baseline) |

**Why 3 Building Types Only?**:
- **Phase 1 Focus**: Commercial multi-family (5+ units) with commercial financing
- **Market Coverage**: These 3 types cover 95% of commercial MF properties
- **Excluded**: 2-4 units (use SFR Analyzer), high-rise (rare, institutional), mixed-use (different calculations)

**Building Type Details**:

**GARDEN** (Most Common - 60% of market):
- **Structure**: 2-3 stories, outdoor corridors, surface parking
- **Units**: Typically 5-50 units per building
- **Operating Expenses**: $250-400/unit/month
  - Lower insurance (no elevator)
  - Lower maintenance (simpler construction)
  - Moderate landscaping/parking lot costs
- **Cap Rate**: Market baseline (no adjustment)
- **Best For**: Local investors, first commercial MF property
- **Example**: Typical suburban apartment complex

**MID_RISE** (Institutional Appeal - 10% of market):
- **Structure**: 4-9 stories with elevator
- **Units**: Typically 30-150 units per building
- **Operating Expenses**: $450-700/unit/month
  - Higher insurance (elevator liability)
  - Elevator maintenance: $1,200-2,000/month
  - Higher management costs
  - Higher utilities (common area HVAC)
- **Cap Rate**: -150 bps adjustment (institutional buyers compress cap rates)
- **Best For**: Experienced investors, urban markets
- **Example**: Urban downtown apartment building

**COMPLEX** (Multi-Building - 25% of market):
- **Structure**: Multiple garden-style buildings on one property
- **Units**: Typically 25-200+ units across multiple buildings
- **Operating Expenses**: $300-500/unit/month
  - Moderate insurance (no elevator)
  - Higher landscaping costs (larger property)
  - Higher parking lot maintenance
  - Shared amenities (pool, clubhouse)
- **Cap Rate**: Market baseline (no adjustment)
- **Best For**: Scaling investors, portfolio aggregation
- **Example**: Large suburban complex with 4-8 buildings

---

### Phase 1: Validation Warnings System (November 2025)

**Implementation**: MultiFamilyAnalyzer.ts + ValidationWarning types

**ValidationWarning Interface**:

```typescript
interface ValidationWarning {
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  category: 'OPERATING_EXPENSES' | 'FINANCING' | 'MARKET_DATA' | 'INPUT_VALIDATION';
  message: string;
  impact?: string;
  recommendation?: string;
  affectedMetric?: string;
}
```

**Severity Levels**:

| Severity | Meaning | UI Treatment |
|----------|---------|--------------|
| `LOW` | Information, may be intentional | Blue info alert |
| `MEDIUM` | Unusual but potentially valid | Orange warning alert |
| `HIGH` | Likely error, needs attention | Red error alert |

**Validation Warning Categories**:

1. **OPERATING_EXPENSES**:
   - Triggered when OpEx per unit falls outside typical range for building type
   - Example (GARDEN): "$200/unit/month appears low (typical: $250-400/unit/month)"
   - Impact: "Actual expenses may be $4,800 higher annually"
   - Recommendation: "Verify all expense categories are included (tax, insurance, maintenance, management, utilities)"

2. **FINANCING**:
   - Triggered when financing structure unusual for commercial MF
   - Example: "Low down payment (15%) for commercial property"
   - Impact: "May face financing challenges or higher interest rates"
   - Recommendation: "Commercial loans (5+ units) typically require 20-25% down payment"

3. **MARKET_DATA**:
   - Triggered when market data appears inconsistent
   - Example: "Market rent significantly higher than current rent"
   - Impact: "Potential rental upside of $X/month"

4. **INPUT_VALIDATION**:
   - Triggered when input data appears incorrect
   - Example: "Unit count mismatch: totalUnits (8) vs units[] array length (10)"
   - Impact: "Calculations may use incorrect unit count"

**API Response Contract**:

All MF analysis endpoints return validationWarnings array:

```typescript
POST /api/deals/analyze
Response: {
  ...analysis,
  validationWarnings: ValidationWarning[] // Empty array if no warnings
}
```

**Frontend Display**:
- Warnings displayed at TOP of analysis results page
- Color-coded by severity (HIGH=red, MEDIUM=orange, LOW=blue)
- Collapsible if more than 3 warnings
- Includes impact and recommendation text
- Chips showing affected metrics

---

### Phase 1: Cap Rate Target Adjustments (November 2025)

**Implementation**: MFDecisionEngine.ts - getTargetCapRate() method

**Calculation Formula**:
```
Target Cap Rate = Base Market Rate + Building Type Adjustment
```

**Base Market Rates** (by market tier):

| Market Tier | Cities | Base Cap Rate |
|-------------|--------|---------------|
| A-Class (Premium) | Dallas, Austin, Nashville | 5.0% |
| B-Class (Balanced) | Phoenix, Tampa, Charlotte | 7.5% |
| C-Class (Cash Flow) | Memphis, Indianapolis, Birmingham | 10.0% |

**Building Type Adjustments**:

| Building Type | Adjustment | Reasoning |
|---------------|-----------|-----------|
| GARDEN | 0 bps | Baseline (most common, no premium/discount) |
| MID_RISE | -150 bps | Institutional buyers compress cap rates (better rent growth, lower vacancy) |
| COMPLEX | 0 bps | Baseline (similar to garden, just multiple buildings) |

**Example Calculations**:

1. **Phoenix (B-Class) + GARDEN**:
   - Base: 7.5%
   - Adjustment: +0 bps
   - Target: **7.5%**

2. **Phoenix (B-Class) + MID_RISE**:
   - Base: 7.5%
   - Adjustment: -150 bps
   - Target: **6.0%**

3. **Dallas (A-Class) + MID_RISE**:
   - Base: 5.0%
   - Adjustment: -150 bps
   - Target: **3.5%**

**Impact on Walk-Away Price**:
```
Walk-Away Price = NOI / Target Cap Rate
```

Higher target cap rate = Lower walk-away price (more conservative)
Lower target cap rate = Higher walk-away price (more aggressive, reflects institutional demand)

**Backward Compatibility**:
- If `buildingType` not provided, uses base market rate only
- Existing MF analyses without building type continue to work

---

### Industry Standards Reference

All Multi-Family calculations validated against:
- **Fannie Mae**: Multifamily underwriting standards, DSCR requirements (1.25x minimum)
- **Freddie Mac**: Multifamily guidelines, cap rates, DSCR minimums (1.20x minimum)
- **HUD 221(d)(4)**: Debt service coverage requirements (1.18x market-rate)
- **Wall Street Prep**: Real estate financial modeling methodology
- **PropertyMetrics**: Commercial real estate analysis standards
- **JP Morgan**: NOI and cash flow calculation methodology
- **Multifamily Loans**: Industry benchmarks for GRM (4-7), debt yield (10%+), BEO (60-75%)

**Validation Date**: October 28, 2025

**Validation Confidence**: 95%+ (institutional-grade accuracy)

**Related Documentation**:
- [MF Metrics Business Validation](./MF_METRICS_BUSINESS_VALIDATION.md) - Full industry validation report
- [MF Metrics Reference Guide](./MF_METRICS_REFERENCE.md) - Comprehensive metric definitions
- [SFR vs MF Isolation](./SFR_VS_MF_ISOLATION.md) - Property type separation strategy

---

## Document Version History

- **October 28, 2025**: Multi-Family Analyzer implementation complete (Stories 1.1-1.6)
  - Added comprehensive MF-specific fields documentation
  - Documented 22 MF metrics with formulas and industry benchmarks
  - Added Story 1.2 NOI calculation fix documentation
  - Added MF calculation methodology section

- **August 27, 2025**: V3.0 Professional Calibration & AI Content Pipeline Integration

- **Previous versions**: See git history for full changelog 