# Implementation Plan: Capital Investments & Tenant Turnover Fees

## Overview
This document outlines the comprehensive implementation plan for adding two new fields to the Real Estate Analyzer:
1. **Capital Investments** - One-time capital improvements or major upgrades to the property
2. **Tenant Turnover Fees** - Costs associated with tenant turnover, including preparation fees and realtor commissions

## Feature Requirements

### Capital Investments
- Allow users to input one-time capital improvement costs
- Include these costs in total investment calculations
- Factor into ROI and other return metrics
- Default value: 0

### Tenant Turnover Fees
- Allow users to input:
  - Preparation fees (cleaning, repairs between tenants)
  - Realtor commission (as percentage of monthly rent)
- Calculate impact on monthly and annual expenses
- Include in cash flow and return calculations
- Default values: $500 for prep fees, 0.5 (half month's rent) for commission

## Implementation Plan

### 1. Data Model Changes

#### New Fields to Add:
- **Capital Investments**
  - Field name: `capitalInvestments`
  - Type: `number`
  - Description: One-time capital improvements or major upgrades to the property
  - Default: `0`
  - Required: `No`

- **Tenant Turnover Fees**
  - Field name: `tenantTurnoverFees`
  - Type: `object`
  - Properties:
    - `prepFees`: Cost to prepare property between tenants (cleaning, minor repairs)
    - `realtorCommission`: Commission paid to realtor for finding new tenants
  - Default values: 
    - `prepFees`: `500` (industry standard: $500-1000 depending on property size)
    - `realtorCommission`: `0.5` (industry standard: 0.5-1 month's rent)

#### Data Dictionary Update:
Add to Property Data Fields section:
```
| `capitalInvestments` | number | One-time capital improvements | No | All property forms |
| `tenantTurnoverFees.prepFees` | number | Prep costs between tenants | No | All property forms |
| `tenantTurnoverFees.realtorCommission` | number | Realtor fee for finding tenants | No | All property forms |
```

### 2. Frontend Implementation

#### Form Component Updates:
1. Add to SFRPropertyForm.tsx:
   - Add new section "Additional Investment & Fees"
   - Add Capital Investments input field with tooltip explaining impact
   - Add Tenant Turnover Fees section with two inputs (prep fees & realtor commission)
   - Add validation (non-negative numbers)

2. Sample SFR Data Update:
   - Add default values for the new fields to sampleSFRData.ts:
   ```typescript
   capitalInvestments: 5000,
   tenantTurnoverFees: {
     prepFees: 750,
     realtorCommission: 0.5
   }
   ```

### 3. Backend Implementation

#### Analysis Engine Updates:

1. Update Total Investment Calculation:
   ```typescript
   const totalInvestment = downPayment + closingCosts + repairCosts + capitalInvestments;
   ```

2. Update Cash Flow Calculation:
   - Calculate yearly tenant turnover costs:
   ```typescript
   const annualTurnoverRate = assumptions.vacancyRate / 100;
   const annualTurnoverCost = 
     (tenantTurnoverFees.prepFees + (monthlyRent * tenantTurnoverFees.realtorCommission)) * 
     annualTurnoverRate;
   const monthlyTurnoverCost = annualTurnoverCost / 12;
   ```

   - Add to monthly expenses:
   ```typescript
   monthlyAnalysis.expenses.tenantTurnover = monthlyTurnoverCost;
   monthlyAnalysis.expenses.total += monthlyTurnoverCost;
   ```

3. Update Long-Term Analysis:
   - Include capital investments in year 1 returns calculation
   - Account for tenant turnover costs in yearly projections

4. Update Key Metrics:
   - Adjust ROI calculation to include capital investments
   - Create new metric "Total Cost Per Unit" that includes capital investments

#### API Updates:

1. Update request/response schemas in `api/deals/analyze` endpoint:
   ```typescript
   // Request schema update
   interface PropertyAnalysisRequest {
     // existing fields
     capitalInvestments?: number;
     tenantTurnoverFees?: {
       prepFees?: number;
       realtorCommission?: number;
     };
   }
   
   // Response schema update
   interface MonthlyAnalysis {
     expenses: {
       // existing expense fields
       tenantTurnover?: number;
       // other fields
     };
     // other fields
   }
   ```

### 4. Analysis Adapter Updates

#### Property Data Extraction
```typescript
// Add to property data extraction
adaptedAnalysis.propertyData = {
  // Existing fields...
  capitalInvestments: analysis.capitalInvestments || 0,
  tenantTurnoverFees: {
    prepFees: analysis.tenantTurnoverFees?.prepFees || 500,
    realtorCommission: analysis.tenantTurnoverFees?.realtorCommission || 0.5
  }
};
```

#### Monthly Analysis Normalization
```typescript
// Calculate and add tenant turnover costs
const vacancyRate = adaptedAnalysis.propertyData.longTermAssumptions?.vacancyRate || 5;
const monthlyRent = adaptedAnalysis.propertyData.monthlyRent || 0;
const prepFees = adaptedAnalysis.propertyData.tenantTurnoverFees?.prepFees || 500;
const realtorCommission = adaptedAnalysis.propertyData.tenantTurnoverFees?.realtorCommission || 0.5;

// Get turnover frequency in years (default: 2 years)
const turnoverFrequency = adaptedAnalysis.propertyData.longTermAssumptions?.turnoverFrequency || 2;
// Calculate base turnover rate as 1/frequency (e.g., 1/2 = 50% annual turnover)
const baseTurnoverRate = 1 / turnoverFrequency;

// Adjust based on vacancy rate: higher vacancy = higher turnover
const vacancyAdjustment = vacancyRate / 5;
const turnoverRate = Math.min(0.9, baseTurnoverRate * vacancyAdjustment); // Cap at 90%

const annualTurnoverCost = (prepFees + (monthlyRent * realtorCommission)) * turnoverRate;
const monthlyTurnoverCost = annualTurnoverCost / 12;

adaptedAnalysis.monthlyAnalysis.expenses.tenantTurnover = monthlyTurnoverCost;
adaptedAnalysis.monthlyAnalysis.expenses.total += monthlyTurnoverCost;
```

#### Yearly Projections Generation
```typescript
// In projections loop
// Get turnover frequency in years (default: 2 years)
const turnoverFrequency = propertyData.longTermAssumptions?.turnoverFrequency || 2;
// Calculate base turnover rate as 1/frequency (e.g., 1/2 = 50% annual turnover)
const baseTurnoverRate = 1 / turnoverFrequency;

// Adjust based on vacancy rate: higher vacancy = higher turnover
const vacancyAdjustment = vacancyRate / 5;
const turnoverRate = Math.min(0.9, baseTurnoverRate * vacancyAdjustment); // Cap at 90%

const prepFees = propertyData.tenantTurnoverFees?.prepFees || 500;
const realtorCommission = propertyData.tenantTurnoverFees?.realtorCommission || 0.5;

// Apply inflation to prep fees
const inflatedPrepFees = prepFees * expenseGrowthFactor;

// Calculate turnover costs
const turnoverCosts = (inflatedPrepFees + (grossRent / 12 * realtorCommission)) * turnoverRate;

// Update operating expenses and NOI
const operatingExpenses = propertyTax + insurance + maintenance + propertyManagement + vacancy + turnoverCosts;
const noi = effectiveGrossIncome - (operatingExpenses - vacancy);
```

#### Return Calculations
```typescript
// Update total investment calculation
const totalInvestment = downPayment + closingCosts + repairCosts + capitalInvestments;

// Add return on capital improvements metric
const returnOnCapitalImprovements = capitalInvestments > 0 ? 
  ((totalProfit * 0.3) / capitalInvestments) * 100 : 0;
```

### 5. Database Implementation

#### Schema Updates:
```typescript
const propertySchema = new Schema({
  // Existing fields...
  capitalInvestments: { type: Number, default: 0 },
  tenantTurnoverFees: {
    prepFees: { type: Number, default: 500 },
    realtorCommission: { type: Number, default: 0.5 }
  }
});
```

### 6. Impact on Analysis Results

#### New and Updated Metrics:
1. **Total Investment**:
   - Now includes capital investments
   - Formula: `downPayment + closingCosts + repairCosts + capitalInvestments`

2. **True Cash-on-Cash Return**:
   - Accounts for total investment including capital improvements
   - Formula: `(annualCashFlow / totalInvestment) * 100`

3. **Return on Improvements**:
   - Measures return specifically on capital investments
   - Formula: `(increaseInAnnualNOI / capitalInvestments) * 100`

4. **Turnover Cost Impact**:
   - Evaluates how turnover affects overall returns
   - Formula: `(annualTurnoverCost / annualGrossIncome) * 100`

#### Visualization Updates:
1. Add turnover costs to expense breakdown pie chart
2. Include capital investments in investment summary
3. Show impact of turnover on cash flow in projection charts

### 7. API Documentation Updates

Update API.md to include the new fields in the request/response examples:

```json
// Request body addition
{
  // existing fields
  "capitalInvestments": 5000,
  "tenantTurnoverFees": {
    "prepFees": 750,
    "realtorCommission": 0.5
  }
}

// Response addition
{
  "monthlyAnalysis": {
    "expenses": {
      // existing fields
      "tenantTurnover": 52.08,
      "total": 2168.08
    }
  },
  "keyMetrics": {
    // existing metrics
    "returnOnImprovements": 3.6,
    "turnoverCostImpact": 2.5
  }
}
```

### 8. Data Mapping Updates

Update DATA_MAPPING.md to include the new fields:

```
| Frontend Field | Backend Field | Transformation |
|----------------|---------------|----------------|
| `capitalInvestments` | `capitalInvestments` | Default to 0 if undefined |
| `tenantTurnoverFees.prepFees` | `tenantTurnoverFees.prepFees` | Default to 500 if undefined |
| `tenantTurnoverFees.realtorCommission` | `tenantTurnoverFees.realtorCommission` | Default to 0.5 if undefined |
```

### 9. Storage vs. Recalculation Strategy

#### Store in Database
- Raw input values for capital investments
- Raw input values for tenant turnover fees

#### Always Recalculate
- Monthly turnover costs
- Impact on operating expenses
- Return on capital investments
- Yearly turnover costs with inflation

## Implementation Steps & Status

| Task | Status | Notes |
|------|--------|-------|
| **Data Model Changes** | Completed | |
| - Update TypeScript interfaces | Completed | Added to BasePropertyData in frontend and backend |
| - Update validation schemas | Completed | Added validation in SFRPropertyForm |
| - Update Data Dictionary | Completed | Added fields to Data Dictionary |
| **Frontend Implementation** | Partially Completed | |
| - Add form fields to SFRPropertyForm | Completed | Added new section "Additional Investment & Fees" |
| - Update sample data | Completed | Updated in backend controllers |
| - Add validation | Completed | Added validation for new fields |
| - Update results display | Completed | Added turnover costs to expense breakdown chart and yearly projections |
| **Backend Implementation** | Partially Completed | |
| - Update calculation engine | Completed | Updated analysisAdapter.ts |
| - Update API endpoints | Not Needed | Endpoints already handle arbitrary fields |
| - Add new metrics | Completed | Added Return on Improvements and Turnover Cost Impact metrics |
| **Analysis Adapter Updates** | Completed | |
| - Update property data extraction | Completed | Added fields to property data extraction |
| - Update monthly analysis normalization | Completed | Added tenant turnover costs to monthly expenses |
| - Update yearly projections | Completed | Added turnoverCosts and capitalImprovements to projections |
| - Update return calculations | Completed | Added capitalInvestments to totalInvestment calculation |
| **Database Implementation** | Not Needed | |
| - Update schema | Not Needed | MongoDB schema is flexible |
| - Create migration script | Not Needed | No migration needed due to schema flexibility |
| **Documentation Updates** | Completed | |
| - Update API docs | Completed | Added fields to request/response examples and interfaces |
| - Update Data Mapping docs | Completed | Added fields to data mapping documentation |
| **Testing** | Not Started | |
| - Unit tests | Not Started | |
| - Integration tests | Not Started | |
| - UI tests | Not Started | |

## Notes & Considerations

- Capital investments may have varying impacts on property value (not all improvements yield 100% ROI)
- Tenant turnover frequency is configurable via the `turnoverFrequency` parameter (default: 2 years)
- The turnover rate calculation uses the formula: `turnoverRate = min(0.9, (1/turnoverFrequency) * (vacancyRate / 5))` where:
  - 1/turnoverFrequency represents the base annual turnover probability (e.g., 1/2 = 50%)
  - vacancyRate / 5 normalizes the vacancy rate around the standard 5% vacancy
  - 0.9 caps the maximum turnover rate at 90% (to avoid unrealistic scenarios)
- Realtor commission varies by market; 0.5-1 month's rent is standard but can be customized

## Future Enhancements

- Detailed capital improvement tracking with categories and depreciation schedules
- Historical tracking of tenant turnover for more accurate projections
- ROI calculator for specific improvement types
- Visualization of turnover impact on long-term returns 