# Real Estate Deal Analyzer - Data Dictionary

This document serves as a central reference for all data fields used throughout the Real Estate Deal Analyzer application. The purpose is to maintain consistency and provide clear documentation as the application evolves.

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
| Field Name | Type | Description | Calculated | Used In |
|------------|------|-------------|------------|---------|
| `keyMetrics.capRate` | number | Capitalization Rate (%) | Yes | Analysis results |
| `keyMetrics.cashOnCashReturn` | number | Cash on Cash Return (%) | Yes | Analysis results |
| `keyMetrics.dscr` | number | Debt Service Coverage Ratio | Yes | Analysis results |
| `keyMetrics.totalInvestment` | number | Total investment amount | Yes | Analysis results |
| `keyMetrics.pricePerSqFt` | number | Price per square foot | Yes | SFR analysis |
| `keyMetrics.rentPerSqFt` | number | Rent per square foot | Yes | SFR analysis |
| `keyMetrics.grossRentMultiplier` | number | Gross Rent Multiplier | Yes | SFR analysis |

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