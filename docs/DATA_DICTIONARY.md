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