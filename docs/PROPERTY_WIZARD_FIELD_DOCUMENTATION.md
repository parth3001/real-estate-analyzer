# Property Wizard - Complete Field Documentation

## Overview
As Sr QE, this document catalogs ALL manual input fields across the 5-step Property Wizard to ensure comprehensive testing coverage. Each field supports both auto-population (via RentCast/FRED APIs) AND manual user override.

## Step 1: Property Address & Details (6+ Fields)

### Address Fields
- **Street Address** (`propertyAddress.street`) - Auto-populated: No | Manual Override: Yes
- **City** (`propertyAddress.city`) - Auto-populated: No | Manual Override: Yes  
- **State** (`propertyAddress.state`) - Auto-populated: No | Manual Override: Yes
- **ZIP Code** (`propertyAddress.zipCode`) - Auto-populated: No | Manual Override: Yes

### Property Details Fields
- **Square Footage** (`squareFootage`) - Auto-populated: **YES** (RentCast Enhanced) | Manual Override: **YES**
- **Bedrooms** (`bedrooms`) - Auto-populated: **YES** (RentCast Enhanced) | Manual Override: **YES**
- **Bathrooms** (`bathrooms`) - Auto-populated: **YES** (RentCast Enhanced) | Manual Override: **YES**
- **Year Built** (`yearBuilt`) - Auto-populated: **YES** (RentCast Enhanced) | Manual Override: **YES**
- **Property Name** (`propertyName`) - Auto-populated: No | Manual Override: Yes (Optional)

### Data Sources & Confidence
- **RentCast Enhanced API**: Property details, confidence scores 85-90%
- **Manual Override**: User can modify any auto-populated value
- **Validation**: Square footage > 0, Year built 1800-current year

---

## Step 2: Purchase & Financing (8+ Fields)

### Core Financial Fields
- **Purchase Price** (`purchasePrice`) - Auto-populated: No | Manual Override: **REQUIRED**
- **Down Payment Amount/Percentage** (`downPayment`/`downPaymentPercentage`) - Auto-populated: 20% default | Manual Override: **YES**
- **Interest Rate** (`interestRate`) - Auto-populated: **YES** (FRED API current rates) | Manual Override: **YES**
- **Loan Term** (`loanTerm`) - Auto-populated: 30 years default | Manual Override: **YES**

### Advanced Financing Fields  
- **Loan Type** (`loanType`) - Fixed vs ARM toggle - Auto-populated: Fixed | Manual Override: **YES**
- **Closing Costs** (`closingCosts`) - Auto-populated: 3% of purchase price | Manual Override: **YES**
- **Capital Investments/Renovations** (`capitalInvestments`) - Auto-populated: $0 | Manual Override: **YES**
- **Private Mortgage Insurance** (if < 20% down) - Auto-populated: **YES** | Manual Override: **YES**

### Data Sources & Validation
- **FRED API**: Current mortgage rates, updated daily
- **Smart Defaults**: Based on purchase price and market conditions
- **Validation**: Purchase price > 0, Down payment 0-100%, Interest rate 0-50%

---

## Step 3: Rental Analysis (5+ Fields)

### Rental Income Fields
- **Monthly Rent** (`monthlyRent`) - Auto-populated: **YES** (RentCast rent estimates) | Manual Override: **YES**
- **Annual Rent** (calculated) - Auto-populated: **YES** | Manual Override: Indirect

### Property Management Fields
- **Self-Manage Toggle** (`selfManage`) - Auto-populated: No (8% management) | Manual Override: **YES**
- **Property Management Rate** (`propertyManagementRate`) - Auto-populated: 8% | Manual Override: **YES** (5-12% slider)
- **Vacancy Rate** (`vacancyRate`) - Auto-populated: 5% | Manual Override: **YES** (0-20% slider)

### Turnover Cost Fields
- **Unit Prep Fees** (`tenantTurnoverFees.prepFees`) - Auto-populated: $500 | Manual Override: **YES**
- **Realtor Commission** (`tenantTurnoverFees.realtorCommission`) - Auto-populated: 0.5 months | Manual Override: **YES**

### Data Sources & Validation
- **RentCast API**: Market rent estimates with confidence scoring
- **Market Analysis**: Price-to-rent ratio, gross rental yield calculations
- **Validation**: Monthly rent > 0, Management rate 0-20%, Vacancy 0-100%

---

## Step 4: Long-term Assumptions (6+ Fields)

### Tax & Insurance Fields
- **Property Tax Rate** (`propertyTaxRate`) - Auto-populated: **YES** (RentCast historical tax data) | Manual Override: **YES**
- **Insurance Rate** (`insuranceRate`) - Auto-populated: 0.7% of purchase price | Manual Override: **YES**
- **Maintenance Reserve %** (`maintenanceReservePercentage`) - Auto-populated: 5% of rent | Manual Override: **YES**

### Long-term Projection Fields
- **Projection Years** (`longTermProjections.projectionYears`) - Auto-populated: 10 years | Manual Override: **YES**
- **Annual Rent Increase** (`longTermProjections.annualRentIncrease`) - Auto-populated: **YES** (FRED inflation + market data) | Manual Override: **YES**
- **Annual Property Value Increase** (`longTermProjections.annualPropertyValueIncrease`) - Auto-populated: **YES** (FRED housing price index) | Manual Override: **YES**
- **Selling Costs Percentage** (`longTermProjections.sellingCostsPercentage`) - Auto-populated: 6% | Manual Override: **YES**
- **Inflation Rate** (`longTermProjections.inflationRate`) - Auto-populated: **YES** (FRED CPI data) | Manual Override: **YES**
- **Turnover Frequency** (`longTermProjections.turnoverFrequency`) - Auto-populated: 2 years | Manual Override: **YES**

### Data Sources & Validation
- **FRED API**: Inflation rates, housing price index, economic indicators
- **RentCast API**: Historical property tax rates by location
- **Market Intelligence**: Regional growth trends and assumptions
- **Validation**: All percentages 0-100%, Years 1-50, Rates 0-20%

---

## Step 5: Investment Goals & Strategy (4+ Fields)

### Strategy Dropdown Fields
- **Exit Strategy** (`exitStrategy`) - Options: sale, refinance, 1031exchange, estate, flexible
- **Portfolio Strategy** (`portfolioStrategy`) - Options: first, geographic, cashflow, appreciation, diversification
- **Experience Level** (`experienceLevel`) - Options: novice, intermediate, expert
- **Risk Tolerance** (`riskTolerance`) - Options: conservative, moderate, aggressive

### Investment Planning Fields
- **Investment Horizon** (`investmentHorizon`) - Options: 1-3 years, 3-5 years, 5-10 years, 10+ years
- **Target Cash Flow** (`targetCashFlow`) - Auto-populated: No | Manual Override: **YES** (Optional)
- **Target Appreciation** (`targetAppreciation`) - Auto-populated: No | Manual Override: **YES** (Optional)

### AI-Enhanced Fields
- **Free-form Investment Goals** (`freeformGoals`) - Auto-populated: No | Manual Override: **YES** (Text area)
- **Market Focus Areas** (derived from goals) - Auto-populated: **YES** (AI analysis) | Manual Override: Indirect
- **Risk Assessment** (derived from selections) - Auto-populated: **YES** (AI analysis) | Manual Override: Indirect

### Data Sources & Impact
- **AI Processing**: GPT-4o-mini analyzes free-form goals for enhanced context
- **Investment Decision Engine**: Strategy selections influence verdict scoring
- **Portfolio Context**: Goals affect property fit analysis and recommendations

---

## Complete Input Field Summary

### Total Manual Input Fields: **30+ Fields**
- **Step 1**: 9 fields (5 address + 4 property details)
- **Step 2**: 8 fields (4 core + 4 advanced financing)
- **Step 3**: 7 fields (2 rental + 2 management + 3 turnover)
- **Step 4**: 9 fields (3 assumptions + 6 projections)
- **Step 5**: 7+ fields (4 strategy + 3+ planning/goals)

### Auto-Population Coverage
- **High Auto-Population**: Steps 1, 3, 4 (60-80% fields auto-populated)
- **Moderate Auto-Population**: Step 2 (40% fields auto-populated)
- **Low Auto-Population**: Step 5 (20% fields auto-populated)

### API Integration Points
- **RentCast API**: Property details, rent estimates, tax rates, comparables
- **FRED API**: Interest rates, inflation, housing price index, economic data
- **Census API**: Demographic data, market context
- **OpenAI API**: Investment goals analysis, strategy recommendations

---

## Testing Strategy Implications

### Critical Test Scenarios
1. **Auto-Population + Manual Override**: Test RentCast data vs user input precedence
2. **Field Validation**: Test boundary conditions and error handling
3. **Data Flow Integration**: Ensure all fields reach Investment Decision Engine
4. **Strategy Impact**: Validate Step 5 selections influence final analysis
5. **Cross-Step Dependencies**: Property details → rent estimates → cash flow calculations

### Sr QE Validation Points
- ✅ Every field accepts manual input
- ✅ Auto-populated fields show confidence scores  
- ✅ Manual overrides take precedence over API data
- ✅ Field validation prevents invalid submissions
- ✅ All inputs flow through to final investment analysis
- ✅ Strategy selections impact investment verdict
- ✅ Error handling gracefully degrades when APIs fail

### Comprehensive Test Coverage
- **Field-by-Field Testing**: Each input field tested individually
- **End-to-End Workflow**: Complete wizard flow with all fields populated
- **Auto-Population Testing**: API integration and data quality validation
- **Manual Override Testing**: User input precedence over auto-populated data
- **Error Scenario Testing**: Invalid data, API failures, network issues
- **Integration Testing**: Data flow from wizard to Investment Decision Engine

This documentation ensures no manual input field is overlooked in comprehensive E2E testing.