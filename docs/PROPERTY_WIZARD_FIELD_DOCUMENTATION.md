# Property Wizard - Complete Field Documentation

## Overview
As Sr QE, this document catalogs ALL manual input fields across the **4-step Property Wizard** (updated December 2025) to ensure comprehensive testing coverage. Each field supports both auto-population (via RentCast/FRED APIs) AND manual user override.

**🔄 Major UX Change (December 2025)**: Investment Strategy moved from Step 5 (last) to **Step 0 (first)**. Wizard is now 4 steps (down from 5).

### Current Wizard Flow:
- **Step 0**: Investment Strategy & Goals (NEW - Visual card selection)
- **Step 1**: Property Address & Details
- **Step 2**: Purchase & Financing
- **Step 3**: Rental Analysis + Advanced Assumptions (collapsed accordion)

### What Changed:
- **Removed**: Separate "Long-term Assumptions" step (merged into Step 3 accordion)
- **Removed**: Separate "Goals & Strategy" step (replaced by Step 0)
- **Added**: Step 0 with visual strategy cards (Buy & Hold, House Hacking, BRRRR)

---

## Step 0: Investment Strategy & Goals (NEW - December 2025) 🎯

**Implementation**: Visual card selection (not dropdown)
**Component**: `StrategySelectionStep.tsx`
**Date Added**: December 10, 2025 (Phase 1: Universal Simple)

### Investment Strategy Selection (REQUIRED)
- **Strategy Cards** (`strategy`) - Visual card selection
  - **Buy & Hold**: Long-term rental income (most common) ✅ Available
  - **House Hacking**: Live in one unit, rent out others (first-timers) ✅ Available
  - **BRRRR**: Buy, Rehab, Rent, Refinance, Repeat (advanced) ⚠️ Coming Soon
  - Auto-populated: `'buy-hold'` default
  - Manual Override: **REQUIRED** - User must select one strategy

### AI-Enhanced Strategy Input (OPTIONAL)
- **Free-form Investment Goals** (`enhancedGoals.freeTextStrategy`) - Multi-line text area
  - Auto-populated: No
  - Manual Override: **YES** (Optional, enhances AI analysis)
  - Triggers AI analysis when >50 characters entered
  - Results in `enhancedGoals.aiEnhancedStrategy` and `enhancedGoals.strategicInsights[]`

### Portfolio Context (OPTIONAL)
- **Portfolio Selection** (`selectedPortfolioId`) - Dropdown of user's portfolios
  - Auto-populated: No
  - Manual Override: **YES** (Optional)
  - When selected: Property analysis includes portfolio fit analysis

### Visual Design Notes (UX Specification)
- **Desktop**: 3 strategy cards horizontally
- **Mobile**: 3 strategy cards vertically stacked
- **Card States**: Default, Hover, Selected, Disabled
- **Disabled State**: BRRRR shows "Coming Soon" badge (Phase 2+)
- **Apple Design**: SF Pro font, 16px border-radius, subtle shadows

### Data Impact on Analysis
- `strategy='buy-hold'`: Standard long-term hold analysis (default)
- `strategy='house-hack'`: Personal housing cost offset calculations (available, not yet backend-supported)
- `strategy='brrrr'`: Capital recovery, refinance projections (Phase 1.3 backend complete, frontend pending)
- Portfolio selection: Adds `portfolioContext` to analysis results

---

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

### Step 3 Advanced Accordion: Long-term Assumptions (Collapsed by Default) 📊

**Implementation**: Collapsible accordion section at bottom of Rental Step
**Pattern**: Progressive disclosure - hidden by default, revealed when user clicks "Advanced Assumptions"

#### Tax & Insurance Fields (in accordion)
- **Property Tax Rate** (`propertyTaxRate`) - Auto-populated: **YES** (RentCast historical tax data) | Manual Override: **YES**
- **Insurance Rate** (`insuranceRate`) - Auto-populated: 0.7% of purchase price | Manual Override: **YES**
- **Maintenance Reserve %** (`maintenanceReservePercentage`) - Auto-populated: 5% of rent | Manual Override: **YES**

#### Long-term Projection Fields (in accordion)
- **Projection Years** (`longTermProjections.projectionYears`) - Auto-populated: 10 years | Manual Override: **YES**
- **Annual Rent Increase** (`longTermProjections.annualRentIncrease`) - Auto-populated: **YES** (FRED inflation + market data) | Manual Override: **YES**
- **Annual Property Value Increase** (`longTermProjections.annualPropertyValueIncrease`) - Auto-populated: **YES** (FRED housing price index) | Manual Override: **YES**
- **Selling Costs Percentage** (`longTermProjections.sellingCostsPercentage`) - Auto-populated: 6% | Manual Override: **YES**
- **Inflation Rate** (`longTermProjections.inflationRate`) - Auto-populated: **YES** (FRED CPI data) | Manual Override: **YES**
- **Turnover Frequency** (`longTermProjections.turnoverFrequency`) - Auto-populated: 2 years | Manual Override: **YES**

#### Data Sources & Validation
- **FRED API**: Inflation rates, housing price index, economic indicators
- **RentCast API**: Historical property tax rates by location
- **Market Intelligence**: Regional growth trends and assumptions
- **Validation**: All percentages 0-100%, Years 1-50, Rates 0-20%

**UX Notes**:
- Section starts collapsed (simplifies wizard for novice users)
- Smart defaults mean most users never need to expand this
- "Pro users" can expand and customize all assumptions

---

## ~~Step 4 & 5: DEPRECATED (December 2025)~~

**Step 4 "Long-term Assumptions"**: ❌ **REMOVED** - Content moved to Step 3 advanced accordion
**Step 5 "Investment Goals & Strategy"**: ❌ **REMOVED** - Replaced by Step 0

**Rationale**: Wizard simplified from 5 steps → 4 steps to reduce cognitive load and improve completion rates.

---

## Complete Input Field Summary (UPDATED December 2025)

### Total Manual Input Fields: **30+ Fields** (Across 4 steps)
- **Step 0**: 3 fields (1 strategy + 1 AI text + 1 portfolio) - **NEW**
- **Step 1**: 9 fields (5 address + 4 property details)
- **Step 2**: 8 fields (4 core + 4 advanced financing)
- **Step 3**: 7 visible + 9 accordion fields (2 rental + 2 management + 3 turnover + 9 advanced assumptions)

**Changed from 5-step wizard:**
- Steps 4 & 5 removed/consolidated
- Step 0 added (strategy first)
- Total steps: 5 → 4 (20% reduction in wizard length)

### Auto-Population Coverage
- **Step 0**: Low (33% - only strategy default populated)
- **Step 1**: High (67% - property details auto-populated)
- **Step 2**: Moderate (50% - interest rate + defaults)
- **Step 3**: High (75% - rent, taxes, all projections)

### API Integration Points
- **RentCast API**: Property details, rent estimates, tax rates, comparables
- **FRED API**: Interest rates, inflation, housing price index, economic data
- **Census API**: Demographic data, market context
- **OpenAI API**: Investment goals analysis, strategy recommendations

---

## Testing Strategy Implications

### Critical Test Scenarios (UPDATED December 2025)
1. **Step 0 Strategy Selection**: Test visual card selection, strategy routing to backend
2. **Auto-Population + Manual Override**: Test RentCast data vs user input precedence
3. **Field Validation**: Test boundary conditions and error handling
4. **Accordion Collapse/Expand**: Test advanced assumptions section UX
5. **Data Flow Integration**: Ensure all fields (including strategy) reach Investment Decision Engine
6. **Strategy Impact**: Validate Step 0 strategy selection influences final analysis verdict
7. **Cross-Step Dependencies**: Strategy → property details → rent estimates → cash flow calculations

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