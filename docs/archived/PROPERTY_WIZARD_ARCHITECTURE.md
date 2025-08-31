# Property Wizard Architecture Document
**Multi-Step Property Data Entry with External API Integration**

## 📋 Executive Summary

This document outlines the complete architecture for implementing a multi-step property wizard that replaces manual data entry with intelligent auto-population from external APIs while maintaining compatibility with existing analysis output.

---

## 🎯 Objectives

1. **Replace Manual Entry**: Transform current single-form property input into guided 4-step wizard
2. **Auto-Population**: Leverage external APIs to pre-fill property data intelligently  
3. **Smart Defaults**: Provide location-based and property-type-based intelligent defaults
4. **Progressive Enhancement**: Enhance data quality without breaking existing analysis pipeline
5. **Backward Compatibility**: Maintain all current analysis output functionality

---

## 🏗️ Architecture Overview

### Current vs. New Data Flow

**Current Flow:**
```
Manual Form → Deal Data → Analysis Engine → Results Display
```

**New Wizard Flow:**
```
Step 1: Address → External APIs → Auto-populated Data
Step 2: Financials → Smart Defaults → Enhanced Data  
Step 3: Rental → Market Data → Validated Data
Step 4: Assumptions → Final Review → Deal Data → Analysis Engine → Results Display
```

---

## 🔌 External API Integration Plan

### APIs We Already Have (Reusable)

#### 1. **FRED Service** (`/backend/src/services/fredService.ts`)
**Current Capabilities:**
- Mortgage rates (30-year fixed)
- Inflation data (CPI)
- Economic indicators
- Housing price index
- Federal funds rate

**Wizard Usage:**
- Auto-populate current mortgage rates in Step 2 (Financials)
- Provide economic context for investment timing
- Smart defaults for interest rates based on current market

#### 2. **RentCast Service** (`/backend/src/services/rentcastService.ts`)
**Current Capabilities:**
- Property rent estimates
- Comparable properties (sales & rentals)
- Market trends by ZIP code
- Property valuations

**Wizard Usage:**
- Step 1: Property details lookup by address
- Step 3: Rent estimates and market positioning
- Smart defaults for monthly rent based on comparables

### New APIs Needed

#### 3. **Property Details API** 
**Candidates:** ATTOM Data, Estated, First American
**Purpose:** Address → Property Details
**Data Retrieved:**
- Square footage, bedrooms, bathrooms
- Year built, lot size
- Property type classification
- Tax assessment data
- Current ownership information

#### 4. **Insurance Cost API**
**Candidates:** Lemonade API, Obie Insurance, Canopy Connect
**Purpose:** Property → Insurance Estimates
**Data Retrieved:**
- Homeowners insurance quotes
- Landlord insurance estimates
- Liability coverage options
- Regional insurance rate factors

#### 5. **Property Tax API**
**Candidates:** TaxNetUSA, ATTOM Tax Data
**Purpose:** Address → Tax Information
**Data Retrieved:**
- Current annual property taxes
- Tax assessment value
- Historical tax rates
- Exemptions and assessments

---

## 🧩 Component Architecture

### Frontend Components

#### 1. **PropertyWizard** (`/frontend/src/components/PropertyWizard/`)
```
PropertyWizard/
├── PropertyWizard.tsx          # Main wizard container
├── WizardStep.tsx             # Generic step wrapper
├── steps/
│   ├── AddressStep.tsx        # Step 1: Address & Property Details
│   ├── FinancialsStep.tsx     # Step 2: Purchase & Financing
│   ├── RentalStep.tsx         # Step 3: Rental & Market Data
│   └── AssumptionsStep.tsx    # Step 4: Long-term Assumptions
├── components/
│   ├── AddressLookup.tsx      # Address autocomplete
│   ├── PropertyDetailsCard.tsx # Auto-populated property info
│   ├── MarketDataCard.tsx     # Rent estimates & comparables
│   ├── SmartDefaults.tsx      # Location-based suggestions
│   └── DataSourceIndicator.tsx # Shows data confidence/source
└── types/
    └── wizardTypes.ts         # TypeScript interfaces
```

#### 2. **Step-by-Step Breakdown**

**Step 1: Address & Property Details**
- Address autocomplete with validation
- Property lookup via external APIs
- Auto-populate: sqft, bedrooms, bathrooms, year built
- Manual override capability for all fields
- Data confidence indicators

**Step 2: Purchase & Financing**  
- Auto-populate current mortgage rates from FRED
- Smart defaults for down payment (20% conventional, 25% investment)
- Insurance cost estimates from APIs
- Property tax auto-lookup
- Closing cost calculator based on location

**Step 3: Rental & Market Analysis**
- Rent estimate from RentCast
- Market positioning analysis
- Comparable rental properties
- Occupancy rate suggestions by market
- Rental expenses (management, maintenance) by property type

**Step 4: Long-term Assumptions**
- Regional appreciation rates from market data
- Inflation assumptions from FRED
- Rent growth projections from market trends
- Final review of all inputs
- Generate analysis

### Backend Services

#### 1. **PropertyDataAggregator** (`/backend/src/services/propertyDataAggregator.ts`)
```typescript
class PropertyDataAggregator {
  // Orchestrates all external API calls
  async getComprehensivePropertyData(address: string): Promise<PropertyData>
  
  // Individual API integrations
  async getPropertyDetails(address: string): Promise<PropertyDetails>
  async getInsuranceCosts(property: PropertyDetails): Promise<InsuranceCosts>
  async getTaxInformation(address: string): Promise<TaxData>
  async getMarketData(address: string): Promise<MarketData>
  
  // Data enrichment
  async enhanceWithSmartDefaults(property: PropertyData): Promise<EnhancedPropertyData>
}
```

#### 2. **SmartDefaultsEngine** (`/backend/src/services/smartDefaultsEngine.ts`)
```typescript
class SmartDefaultsEngine {
  // Location-based defaults
  getLocationDefaults(zipCode: string): Promise<LocationDefaults>
  
  // Property type defaults
  getPropertyTypeDefaults(propertyType: string): Promise<PropertyDefaults>
  
  // Market-based suggestions
  getMarketBasedSuggestions(marketData: MarketData): Promise<Suggestions>
  
  // Regional cost factors
  getRegionalCostFactors(location: Location): Promise<CostFactors>
}
```

---

## 📊 Data Flow Architecture

### 1. **Address Entry → Property Enrichment**
```typescript
// User enters address
address: "123 Main St, Austin, TX"

// PropertyDataAggregator orchestrates API calls
const propertyData = await Promise.allSettled([
  attomService.getPropertyDetails(address),
  rentcastService.getPropertyRentEstimate(address),
  taxService.getPropertyTaxes(address),
  insuranceService.getInsuranceQuote(address)
]);

// Enriched property object
{
  address: "123 Main St, Austin, TX 78701",
  sqft: 1847,                    // From ATTOM
  bedrooms: 3,                   // From ATTOM  
  bathrooms: 2,                  // From ATTOM
  yearBuilt: 2018,              // From ATTOM
  lotSize: 0.25,                // From ATTOM
  rentEstimate: 2650,           // From RentCast
  propertyTaxes: 8450,          // From Tax API
  insuranceEstimate: 1200,      // From Insurance API
  dataConfidence: {
    property: 95,
    rent: 87,
    tax: 100,
    insurance: 73
  },
  dataSources: ["ATTOM", "RentCast", "TaxNet", "Lemonade"]
}
```

### 2. **Smart Defaults Application**
```typescript
// Location-based defaults for Austin, TX
{
  managementFee: 8,              // % of rent (Austin average)
  maintenanceReserve: 5,         // % of rent (Texas SFR average)
  vacancyRate: 4,               // % (Austin market average)
  capExReserve: 0.5,            // % of property value (regional)
  appreciationRate: 4.2,        // % annual (Austin 5-yr average)
  rentGrowthRate: 3.8,          // % annual (Austin trend)
  closingCosts: 2.5,            // % of purchase (Texas average)
  insurance: {
    homeowners: 0.65,           // % of property value
    landlord: 0.75,             // % of property value  
    umbrella: 500               // Annual cost
  }
}
```

---

## 🔄 Integration Points

### 1. **Existing Analysis Pipeline Compatibility**

**No Changes Required:**
- `/backend/src/controllers/dealController.ts` - receives same DealData structure
- `/backend/src/services/dealAnalysisService.ts` - analysis logic unchanged
- `/backend/src/services/aiService.ts` - AI insights generation unchanged
- Frontend analysis results display - completely unchanged

**Enhanced Data Quality:**
- Wizard provides richer, validated data to existing pipeline
- External API data enhances accuracy of calculations
- Smart defaults reduce user errors
- Data confidence scoring helps users understand reliability

### 2. **Database Schema Extensions**

**File:** `/backend/src/models/Deal.ts`
```typescript
// Add optional wizard metadata (doesn't break existing)
export interface DealData {
  // ... existing fields unchanged ...
  
  // NEW: Optional wizard metadata
  wizardData?: {
    dataEnrichment: {
      autoPopulatedFields: string[];
      apiSources: Record<string, string>;
      dataConfidence: Record<string, number>;
      manualOverrides: Record<string, any>;
      enrichmentTimestamp: Date;
    };
    userJourney: {
      stepCompletionTimes: number[];
      totalWizardTime: number;
      fieldsManuallyModified: string[];
      apiFailures: string[];
    };
  };
}
```

### 3. **API Rate Limiting & Caching Strategy**

**Existing Cache Infrastructure:**
- MongoDB cache service already implemented
- RentCast data cached for 1 month
- FRED data cached for 30 minutes

**New Caching Requirements:**
```typescript
// Cache strategy by API type
{
  propertyDetails: {
    ttl: '6 months',     // Property details rarely change
    service: 'MongoDB'
  },
  insuranceQuotes: {
    ttl: '1 week',       // Insurance rates update weekly
    service: 'MongoDB'  
  },
  taxAssessments: {
    ttl: '1 year',       // Tax assessments annual
    service: 'MongoDB'
  },
  mortgageRates: {
    ttl: '1 hour',       // Rates change frequently
    service: 'Memory'
  }
}
```

---

## 🎨 User Experience Flow

### Step 1: Address & Property Discovery
```
User Input: "123 Main St, Austin, TX"
       ↓
Address Validation & Geocoding
       ↓
Property Details API Lookup
       ↓
Display: Auto-populated property card
- ✅ 1847 sqft (95% confidence)
- ✅ 3 bed / 2 bath (95% confidence)  
- ✅ Built 2018 (100% confidence)
- ⚠️  Lot size not found - please enter
       ↓
User Reviews/Overrides & Continues
```

### Step 2: Financial Intelligence
```
Current Market Data Loading...
       ↓
Smart Defaults Applied:
- Mortgage Rate: 6.81% (current 30-yr fixed)
- Down Payment: 25% ($118,750) [investment property]
- Property Tax: $8,450/yr (from county records)
- Insurance: $1,200/yr (estimated)
- Closing Costs: $11,875 (2.5% of purchase)
       ↓
User Reviews & Adjusts
       ↓
Loan Parameters Calculated
```

### Step 3: Rental Market Analysis
```
Market Analysis Running...
       ↓
Rent Intelligence:
- Estimated Rent: $2,650/month (87% confidence)
- Market Position: Above Average (+8%)
- 5 Comparable Rentals Found
- Austin Vacancy Rate: 4%
       ↓
Operating Expenses Suggested:
- Management: 8% ($212/month)
- Maintenance: 5% ($132/month)
- Reserves: $156/month
       ↓
User Reviews Market Data
```

### Step 4: Long-term Assumptions
```
Regional Trends Applied:
- Property Appreciation: 4.2%/year (Austin 5-yr avg)
- Rent Growth: 3.8%/year (market trend)
- Inflation: 2.8% (current rate)
       ↓
Final Review Screen:
📍 Property: 123 Main St, Austin, TX
💰 Purchase: $475,000 (25% down)
🏠 Rent: $2,650/month
📈 Projections: Based on Austin market data
       ↓
Generate Analysis → Existing Analysis Pipeline
```

---

## 📁 File Structure Changes

### New Files to Create

#### Frontend
```
/frontend/src/components/PropertyWizard/
├── PropertyWizard.tsx
├── WizardStep.tsx
├── steps/
│   ├── AddressStep.tsx
│   ├── FinancialsStep.tsx  
│   ├── RentalStep.tsx
│   └── AssumptionsStep.tsx
├── components/
│   ├── AddressLookup.tsx
│   ├── PropertyDetailsCard.tsx
│   ├── MarketDataCard.tsx
│   ├── SmartDefaults.tsx
│   ├── DataSourceIndicator.tsx
│   └── ConfidenceScore.tsx
└── types/
    └── wizardTypes.ts

/frontend/src/services/
├── addressService.ts          # Address validation & geocoding
├── propertyService.ts         # Property data fetching
└── wizardService.ts          # Wizard state management
```

#### Backend
```
/backend/src/services/
├── propertyDataAggregator.ts  # Main orchestration service
├── smartDefaultsEngine.ts    # Location-based defaults
├── addressService.ts         # Address validation
├── propertyDetailsService.ts # Property lookup (ATTOM/Estated)
├── insuranceService.ts       # Insurance cost estimation
└── propertyTaxService.ts     # Tax data lookup

/backend/src/integrations/     # New directory
├── attomService.ts           # ATTOM Data API
├── estatedService.ts         # Estated API  
├── lemonadeService.ts        # Lemonade Insurance API
└── taxnetService.ts          # TaxNet USA API

/backend/src/types/
├── propertyTypes.ts          # Enhanced property interfaces
├── wizardTypes.ts           # Wizard-specific types
└── externalApiTypes.ts      # External API response types
```

### Files to Modify

#### Frontend
```
/frontend/src/App.tsx
- Add PropertyWizard route
- Feature flag for wizard vs. legacy form

/frontend/src/components/SFRAnalysis/SFRPropertyForm.tsx  
- Add "Use New Wizard" toggle
- Maintain as fallback option

/frontend/src/services/api.ts
- Add wizard endpoints
- Maintain existing analysis endpoints
```

#### Backend
```
/backend/src/routes/dealRoutes.ts
- Add POST /api/deals/wizard/property-lookup
- Add POST /api/deals/wizard/smart-defaults
- Add POST /api/deals/wizard/market-data

/backend/src/controllers/dealController.ts
- Add wizard-specific endpoints
- Maintain existing analyze endpoint

/backend/src/models/Deal.ts
- Add optional wizardData field
- Maintain backward compatibility

/backend/src/types/propertyTypes.ts
- Extend SFRData interface with wizard metadata
- Add confidence scoring fields
```

---

## 🔒 API Key Management

### Environment Variables Required
```bash
# Existing (already configured)
FRED_API_KEY=your_fred_key
RENTCAST_API_KEY=your_rentcast_key

# New API Keys Needed
ATTOM_API_KEY=your_attom_key
ESTATED_API_KEY=your_estated_key
LEMONADE_API_KEY=your_lemonade_key
TAXNET_API_KEY=your_taxnet_key

# API Configuration
PROPERTY_WIZARD_ENABLED=true
EXTERNAL_API_TIMEOUT=10000
API_RATE_LIMIT_ENABLED=true
```

### Rate Limiting Strategy
```typescript
// API rate limits management
const rateLimits = {
  attom: { calls: 1000, period: 'month', cost: '$0.10/call' },
  estated: { calls: 500, period: 'month', cost: '$0.05/call' },  
  lemonade: { calls: 100, period: 'day', cost: 'free tier' },
  taxnet: { calls: 2000, period: 'month', cost: '$0.02/call' },
  rentcast: { calls: 1000, period: 'month', cost: 'existing' },
  fred: { calls: 'unlimited', period: 'month', cost: 'free' }
};
```

---

## 🚀 Implementation Phases

### Phase 1: Foundation (Week 1-2)
- [ ] Create PropertyWizard component structure
- [ ] Implement AddressStep with geocoding
- [ ] Set up PropertyDataAggregator service
- [ ] Integrate with existing FRED & RentCast services

### Phase 2: External APIs (Week 3-4)  
- [ ] ATTOM Data integration for property details
- [ ] Insurance API integration (Lemonade/Obie)
- [ ] Property tax API integration
- [ ] Smart defaults engine implementation

### Phase 3: UI/UX Polish (Week 5)
- [ ] Data confidence indicators
- [ ] Loading states and error handling
- [ ] Manual override capabilities
- [ ] Mobile responsiveness

### Phase 4: Integration & Testing (Week 6)
- [ ] Connect wizard to existing analysis pipeline
- [ ] Feature flag implementation
- [ ] Performance optimization
- [ ] End-to-end testing

---

## 📊 Success Metrics

### User Experience Metrics
- **Data Entry Time**: Target 50% reduction (from 15 min to 7.5 min)
- **Data Accuracy**: Target 30% improvement in calculation accuracy
- **User Completion Rate**: Target 85% wizard completion rate
- **Error Reduction**: Target 60% fewer user input errors

### Technical Metrics
- **API Response Time**: < 2 seconds for property lookup
- **Cache Hit Rate**: > 80% for repeat property lookups  
- **API Cost**: < $0.50 per property analysis
- **System Reliability**: 99.5% uptime for wizard functionality

### Business Metrics
- **User Adoption**: 70% of users choose wizard over manual entry
- **Analysis Quality**: Higher confidence scores in AI insights
- **User Retention**: Improved user satisfaction scores
- **Conversion Rate**: More completed property analyses

---

## 🛡️ Risk Mitigation

### API Dependency Risks
- **Fallback Strategy**: Manual entry always available
- **Graceful Degradation**: Partial data enrichment if APIs fail
- **Rate Limit Management**: Intelligent queuing and caching
- **Cost Control**: Monthly API budget alerts and limits

### Data Quality Risks
- **Confidence Scoring**: Always show data source and confidence
- **Manual Override**: Users can modify any auto-populated field
- **Validation Logic**: Server-side validation of all external data
- **Audit Trail**: Track all data sources and modifications

### Performance Risks
- **Caching Strategy**: Aggressive caching of static property data
- **Async Loading**: Non-blocking API calls with progressive enhancement
- **Timeout Handling**: 10-second timeout with fallbacks
- **Error Recovery**: Partial wizard completion saves progress

---

## 🔍 Monitoring & Analytics

### Performance Monitoring
```typescript
// Wizard analytics events
{
  'wizard_step_completed': { step: number, duration: number },
  'api_call_success': { service: string, responseTime: number },
  'api_call_failure': { service: string, error: string },
  'manual_override_used': { field: string, originalValue: any },
  'data_confidence_low': { field: string, confidence: number },
  'wizard_abandoned': { step: number, reason: string }
}
```

### Cost Monitoring
```typescript
// API cost tracking
{
  'daily_api_costs': { total: number, byService: Record<string, number> },
  'monthly_api_usage': { calls: number, budget: number, remaining: number },
  'cost_per_analysis': { average: number, trend: string }
}
```

---

## 📚 Development Guidelines

### Code Quality Standards
- **TypeScript**: Strict mode enabled, 100% type coverage
- **Testing**: Unit tests for all services, integration tests for APIs
- **Error Handling**: Comprehensive error boundaries and fallbacks
- **Documentation**: JSDoc comments for all public methods
- **Logging**: Structured logging with correlation IDs

### API Integration Best Practices
- **Retry Logic**: Exponential backoff for transient failures
- **Circuit Breaker**: Prevent cascading failures
- **Data Validation**: Validate all external API responses
- **Security**: Never log API keys or sensitive data
- **Rate Limiting**: Respect API limits and implement queuing

---

This architecture document provides the complete blueprint for implementing the Property Wizard while maintaining full compatibility with existing analysis functionality. The wizard enhances data quality through external API integration while preserving user control through manual override capabilities.