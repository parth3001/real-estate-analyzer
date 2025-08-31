# New SFR Metrics Implementation - Data Mapping

This document outlines the data flow and transformations for the new SFR metrics being added to the Real Estate Deal Analyzer.

## 1. Metrics Overview

| Metric | Description | Calculation | Storage |
|--------|-------------|------------|---------|
| Break-Even Occupancy | The minimum occupancy rate needed to cover all expenses | `(operatingExpenses + debtService) / grossPotentialRent * 100` | Calculated on demand |
| Equity Multiple | Total return divided by initial investment | `totalReturn / totalInvestment` | Calculated on demand |
| One Percent Rule Value | Monthly rent as percentage of purchase price | `monthlyRent / purchasePrice * 100` | Calculated on demand |
| Fifty Rule Analysis | Whether operating expenses are ≤ 50% of gross rent | `operatingExpenses <= grossRent * 0.5` | Calculated on demand |
| Rent-to-Price Ratio | Monthly rent divided by purchase price | `monthlyRent / purchasePrice * 100` | Calculated on demand |
| Price Per Bedroom | Purchase price divided by number of bedrooms | `purchasePrice / bedrooms` | Calculated on demand |
| Debt-to-Income Ratio | Annual debt service divided by annual income | `debtService / income * 100` | Calculated on demand |
| Gross Rent Multiplier | Purchase price divided by annual gross rent | `purchasePrice / annualRent` | Calculated on demand |
| Operating Expense Ratio | Operating expenses as % of effective gross income | `operatingExpenses / effectiveGrossIncome * 100` | Calculated on demand |

## 2. Data Flow

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│    Frontend     │         │     Backend      │         │    Database     │
│    (React)      │ ───────>│  (Node/Express)  │ ───────>│   (MongoDB)     │
└─────────────────┘         └──────────────────┘         └─────────────────┘
```

### Frontend to Backend

When a user submits property data for analysis:

| Frontend Field | Backend Field | Transformation |
|----------------|---------------|----------------|
| `purchasePrice` | `purchasePrice` | None |
| `monthlyRent` | `monthlyRent` | None |
| `bedrooms` | `bedrooms` | None |
| `operatingExpenses` | Calculated | Sum of individual expense items |

### Backend Processing

1. `SFRAnalyzer.ts` calculates all metrics using `FinancialCalculations.ts` utility methods
2. Results are stored in the `keyMetrics` object within the analysis result
3. Sensitivity analysis is calculated and stored in `sensitivityAnalysis` object

### Backend to Database

When saving a deal:

| Backend Field | Database Field | Transformation |
|---------------|----------------|----------------|
| `keyMetrics.breakEvenOccupancy` | `analysis.keyMetrics.breakEvenOccupancy` | None |
| `keyMetrics.equityMultiple` | `analysis.keyMetrics.equityMultiple` | None |
| `keyMetrics.onePercentRuleValue` | `analysis.keyMetrics.onePercentRuleValue` | None |
| `keyMetrics.fiftyRuleAnalysis` | `analysis.keyMetrics.fiftyRuleAnalysis` | None |
| `keyMetrics.rentToPriceRatio` | `analysis.keyMetrics.rentToPriceRatio` | None |
| `keyMetrics.pricePerBedroom` | `analysis.keyMetrics.pricePerBedroom` | None |
| `keyMetrics.debtToIncomeRatio` | `analysis.keyMetrics.debtToIncomeRatio` | None |
| `keyMetrics.grossRentMultiplier` | `analysis.keyMetrics.grossRentMultiplier` | None |
| `keyMetrics.operatingExpenseRatio` | `analysis.keyMetrics.operatingExpenseRatio` | None |

### Database to Frontend

When retrieving a saved deal:

| Database Field | Frontend Field | Transformation |
|----------------|----------------|----------------|
| `analysis.keyMetrics.breakEvenOccupancy` | `keyMetrics.breakEvenOccupancy` | None |
| `analysis.keyMetrics.equityMultiple` | `keyMetrics.equityMultiple` | None |
| `analysis.keyMetrics.onePercentRuleValue` | `keyMetrics.onePercentRuleValue` | None |
| `analysis.keyMetrics.fiftyRuleAnalysis` | `keyMetrics.fiftyRuleAnalysis` | None |
| `analysis.keyMetrics.rentToPriceRatio` | `keyMetrics.rentToPriceRatio` | None |
| `analysis.keyMetrics.pricePerBedroom` | `keyMetrics.pricePerBedroom` | None |
| `analysis.keyMetrics.debtToIncomeRatio` | `keyMetrics.debtToIncomeRatio` | None |
| `analysis.keyMetrics.grossRentMultiplier` | `keyMetrics.grossRentMultiplier` | None |
| `analysis.keyMetrics.operatingExpenseRatio` | `keyMetrics.operatingExpenseRatio` | None |

## 3. Recalculation Rules

When a saved deal is retrieved:

1. All metrics are stored in the database as calculated values
2. No recalculation is needed when retrieving a saved deal
3. If deal parameters are modified, all metrics are recalculated using the `SFRAnalyzer`

## 4. Frontend Display

The new metrics will be displayed in:

1. The Analysis Results component in a new "Advanced Metrics" section
2. The Sensitivity Analysis component showing best/worst case scenarios
3. The AI analysis will include risk assessment based on sensitivity analysis

## 5. AI Prompt Integration

The AI prompt has been enhanced to:

1. Include all new metrics in the prompt data
2. Add a "Risk Assessment" section based on sensitivity analysis
3. Consider the risk profile in the investment score calculation
4. Evaluate rule-based metrics (1% rule, 50% rule) as additional factors 