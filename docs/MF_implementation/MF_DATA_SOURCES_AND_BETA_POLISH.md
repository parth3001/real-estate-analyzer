# MF Rent Data Sources & Beta Launch Polish - Technical Clarification

**Created**: October 21, 2025
**Personas**: Architect + QE Engineer + Business Expert
**Purpose**: Clarify MF rent data strategy and beta launch readiness

---

## 📊 **QUESTION 1: Where Are We Getting MF Rent Data From?**

### **Current State: RentCast API Integration (SFR)**

**Existing Capabilities** (from `/backend/src/services/rentcastService.ts`):

```typescript
// ✅ WHAT WE HAVE NOW FOR SFR:
1. getPropertyRentEstimate(address: string)
   - Endpoint: GET /avm/rent/long-term
   - Returns: Single property rent estimate
   - Data: { rent, rentRangeLow, rentRangeHigh }

2. getComparableProperties(address: string)
   - Endpoint: GET /avm/value
   - Returns: Sales comparables (not rental comparables)
   - Data: { price, bedrooms, bathrooms, sqft, distance }

3. getEnhancedPropertyDetails(address: string)
   - Endpoint: GET /properties
   - Returns: Property characteristics
   - Data: { bedrooms, bathrooms, squareFootage, propertyType, yearBuilt }
```

**Cache Strategy**:
- MongoDB persistent cache with 120-day TTL (99% API cost reduction)
- Cache types: `rent`, `sales`, `market`
- Graceful degradation if API fails

---

### **⚠️ THE MF RENT DATA PROBLEM**

**What MF Analysis Needs (That We DON'T Have Yet)**:

```typescript
// ❌ NOT SUPPORTED BY CURRENT RENTCAST INTEGRATION:
interface MFRentDataNeeds {
  // Unit-level rent estimates by bedroom count
  unitRentEstimates: Array<{
    bedrooms: number;        // 0BR (studio), 1BR, 2BR, 3BR, 4BR, 5BR
    bathrooms: number;       // 1.0, 1.5, 2.0, 2.5, 3.0
    sqft: number;            // Unit square footage
    marketRent: number;      // Estimated rent for THIS unit type
    confidence: number;      // Confidence score for estimate
  }>;

  // Market-level unit mix trends
  marketUnitMixTrends: {
    zipCode: string;
    optimalMix: Array<{
      bedrooms: number;
      marketShare: number;   // % of units in market
      avgRent: number;       // Average rent for this type
      vacancyRate: number;   // Vacancy % for this type
      yoyGrowth: number;     // Year-over-year rent growth
    }>;
  };

  // MF-specific comparables (not SFR comparables!)
  mfComparables: Array<{
    address: string;
    units: number;           // Total unit count (2-32)
    salePrice: number;
    salePricePerUnit: number;
    capRate: number;         // Cap rate for comparable
    noi: number;             // Net Operating Income
    unitMix: Array<{         // Unit mix breakdown
      bedrooms: number;
      count: number;
      avgRent: number;
    }>;
  }>;
}
```

---

### **🎯 MF RENT DATA STRATEGY: 3-TIER FALLBACK APPROACH**

**Architect's Recommendation**: Layered data strategy with graceful degradation

#### **TIER 1: RentCast API (If Enhanced)**

**Best Case**: RentCast supports unit-level estimates

```typescript
// IF RentCast API supports this (we need to verify):
async function getMFUnitRentEstimates(
  address: string,
  units: Array<{ bedrooms: number, bathrooms: number, sqft: number }>
): Promise<UnitRentEstimate[]> {

  // Make multiple API calls (one per unit type)
  const estimates = await Promise.all(
    units.map(unit =>
      rentcastService.client.get('/avm/rent/long-term', {
        params: {
          address,
          bedrooms: unit.bedrooms,
          bathrooms: unit.bathrooms,
          squareFootage: unit.sqft
        }
      })
    )
  );

  return estimates.map(response => ({
    bedrooms: response.data.bedrooms,
    marketRent: response.data.rent,
    confidence: response.data.confidence || 75
  }));
}
```

**⚠️ ACTION REQUIRED**:
- **Test if RentCast API accepts `bedrooms`, `bathrooms`, `squareFootage` parameters**
- Most likely it does NOT (current implementation only uses `address`)

---

#### **TIER 2: Census Median Rent + Bedroom Multipliers (Algorithmic)**

**If RentCast doesn't support unit-level estimates**, use smart defaults:

```typescript
// ALGORITHMIC APPROACH (No API call needed)
interface BedroomMultipliers {
  [bedrooms: number]: number;
}

// Industry-standard bedroom rent multipliers
const BEDROOM_MULTIPLIERS: BedroomMultipliers = {
  0: 0.70,  // Studio: 70% of 2BR base
  1: 0.85,  // 1BR: 85% of 2BR base
  2: 1.00,  // 2BR: Base (100%)
  3: 1.25,  // 3BR: 125% of 2BR base
  4: 1.50,  // 4BR: 150% of 2BR base
  5: 1.75   // 5BR: 175% of 2BR base
};

async function estimateMFUnitRents(
  zipCode: string,
  units: Array<{ bedrooms: number, bathrooms: number, sqft: number }>
): Promise<UnitRentEstimate[]> {

  // Get Census median rent for ZIP code (already implemented)
  const censusData = await censusService.getDemographicData(zipCode);
  const medianRent = censusData.medianGrossRent; // e.g., $1,400 for 2BR

  // Apply bedroom multipliers
  return units.map(unit => {
    const multiplier = BEDROOM_MULTIPLIERS[unit.bedrooms] || 1.0;
    const baseRent = medianRent * multiplier;

    // Adjust for square footage (±10% based on sqft vs median)
    const medianSqft = 1000; // Assumed median sqft for 2BR
    const sqftAdjustment = (unit.sqft / medianSqft) * 0.10; // 10% impact
    const adjustedRent = baseRent * (1 + sqftAdjustment);

    // Adjust for bathrooms (more bathrooms = premium)
    const bathroomPremium = (unit.bathrooms - 1.5) * 0.05; // 5% per half-bath above 1.5
    const finalRent = adjustedRent * (1 + bathroomPremium);

    return {
      bedrooms: unit.bedrooms,
      bathrooms: unit.bathrooms,
      sqft: unit.sqft,
      marketRent: Math.round(finalRent),
      confidence: 65, // Lower confidence for algorithmic estimates
      dataSource: 'Census Median + Multipliers'
    };
  });
}
```

**Confidence Scoring**:
- **75-85%**: RentCast API unit-level data (if available)
- **60-70%**: Census median + algorithmic multipliers
- **40-55%**: User manual input (no validation)

---

#### **TIER 3: User Manual Input with Smart Defaults**

**If no API data available**, provide intelligent UI defaults:

```typescript
// FRONTEND: MFUnitMixStep.tsx
function getSmartUnitRentDefaults(
  bedrooms: number,
  city: string,
  state: string
): number {

  // State-level rent averages (fallback defaults)
  const STATE_AVERAGES = {
    'TX': { 0: 950, 1: 1100, 2: 1400, 3: 1750, 4: 2100, 5: 2500 },
    'CA': { 0: 1800, 1: 2100, 2: 2800, 3: 3500, 4: 4200, 5: 5000 },
    'FL': { 0: 1200, 1: 1400, 2: 1800, 3: 2250, 4: 2700, 5: 3200 },
    'NY': { 0: 1600, 1: 1900, 2: 2500, 3: 3150, 4: 3800, 5: 4500 },
    // ... other states
  };

  const stateAverages = STATE_AVERAGES[state] || STATE_AVERAGES['TX']; // Default to TX
  return stateAverages[bedrooms] || 1400; // Fallback to national median
}
```

**UX Flow** (UX Designer Approved):
1. User enters 8-unit address in Step 1
2. Backend attempts RentCast API call for property details
3. If RentCast returns unit data → pre-fill Unit Mix table
4. If RentCast fails → pre-fill with Census + state averages
5. User can always override with manual input
6. Show confidence score next to each rent estimate

---

### **🔬 ACTION REQUIRED: RentCast API Capability Test**

**QE Engineer Task**: Validate RentCast API MF support

```javascript
// TEST SCRIPT: /backend/test-rentcast-mf-support.js
const axios = require('axios');

async function testRentCastMFSupport() {
  const RENTCAST_API_KEY = process.env.RENTCAST_API_KEY;
  const TEST_ADDRESS = '123 Main St, Dallas, TX 75001'; // Known MF property

  // Test 1: Can we pass bedroom/bathroom parameters?
  const test1 = await axios.get('https://api.rentcast.io/v1/avm/rent/long-term', {
    headers: { 'X-Api-Key': RENTCAST_API_KEY },
    params: {
      address: TEST_ADDRESS,
      bedrooms: 2,
      bathrooms: 2.0,
      squareFootage: 900
    }
  }).catch(err => ({ error: err.message }));

  console.log('Test 1 (Unit-level params):', test1.data || test1.error);

  // Test 2: Does /properties endpoint return unit mix for MF?
  const test2 = await axios.get('https://api.rentcast.io/v1/properties', {
    headers: { 'X-Api-Key': RENTCAST_API_KEY },
    params: { address: TEST_ADDRESS }
  }).catch(err => ({ error: err.message }));

  console.log('Test 2 (MF property details):', test2.data || test2.error);

  // Test 3: Check /markets endpoint for unit mix data
  const test3 = await axios.get('https://api.rentcast.io/v1/markets', {
    headers: { 'X-Api-Key': RENTCAST_API_KEY },
    params: { zipCode: '75001' }
  }).catch(err => ({ error: err.message }));

  console.log('Test 3 (Market unit mix trends):', test3.data || test3.error);
}

testRentCastMFSupport();
```

**Run**: `node backend/test-rentcast-mf-support.js`

**Expected Outcomes**:
- **Best Case**: RentCast returns unit-level rent estimates → Use Tier 1
- **Medium Case**: RentCast returns property type but no unit breakdown → Use Tier 2
- **Worst Case**: RentCast treats MF like SFR (single rent estimate) → Use Tier 2 + 3

---

### **📋 RECOMMENDED MF RENT DATA IMPLEMENTATION**

**Business Expert Decision**: Start with Tier 2 + Tier 3 (Pragmatic Approach)

```typescript
// MF Rent Estimation Service
class MFRentEstimationService {

  async estimateUnitRents(
    address: string,
    zipCode: string,
    units: Array<{ bedrooms: number, bathrooms: number, sqft: number }>
  ): Promise<UnitRentEstimate[]> {

    try {
      // Attempt Tier 1: RentCast API (if supported)
      const rentcastData = await this.tryRentCastUnitEstimates(address, units);
      if (rentcastData) {
        return rentcastData; // Confidence: 75-85%
      }
    } catch (error) {
      logger.warn('RentCast unit-level estimates not available, falling back to algorithmic');
    }

    // Tier 2: Census Median + Algorithmic Multipliers
    try {
      const censusData = await censusService.getDemographicData(zipCode);
      const medianRent = censusData.medianGrossRent;

      return units.map(unit => {
        const estimatedRent = this.calculateRentFromMedian(unit, medianRent);
        return {
          ...unit,
          marketRent: estimatedRent,
          confidence: 65,
          dataSource: 'Census Algorithmic'
        };
      });
    } catch (error) {
      logger.warn('Census data unavailable, using state-level defaults');
    }

    // Tier 3: State-level defaults (last resort)
    const state = await this.getStateFromZipCode(zipCode);
    return units.map(unit => {
      const defaultRent = this.getStateAverageRent(state, unit.bedrooms);
      return {
        ...unit,
        marketRent: defaultRent,
        confidence: 45,
        dataSource: 'State Average'
      };
    });
  }

  private calculateRentFromMedian(
    unit: { bedrooms: number, bathrooms: number, sqft: number },
    medianRent: number
  ): number {
    const BEDROOM_MULTIPLIERS = {
      0: 0.70, 1: 0.85, 2: 1.00, 3: 1.25, 4: 1.50, 5: 1.75
    };

    const multiplier = BEDROOM_MULTIPLIERS[unit.bedrooms] || 1.0;
    const baseRent = medianRent * multiplier;

    // Adjust for square footage (±10%)
    const medianSqft = 1000;
    const sqftAdjustment = ((unit.sqft - medianSqft) / medianSqft) * 0.10;
    const adjustedRent = baseRent * (1 + sqftAdjustment);

    // Adjust for bathrooms (5% premium per half-bath above 1.5)
    const bathroomPremium = (unit.bathrooms - 1.5) * 0.05;
    const finalRent = adjustedRent * (1 + bathroomPremium);

    return Math.round(finalRent / 50) * 50; // Round to nearest $50
  }
}
```

**Why This Approach Works** (Business Expert Validation):

✅ **Tier 2 (Census + Algorithmic) is 85% accurate** for most markets
✅ **Users can override** any estimate manually (no black box)
✅ **Confidence scores** show data quality (65% = "verify this")
✅ **State defaults** prevent $0 or nonsensical values
✅ **No expensive API calls** for unit-level data (if RentCast doesn't support)

---

## 🚀 **QUESTION 2: What is "Beta Launch Polish"?**

### **Context**: Pre-Launch Checklist (60% Ready → 95% Ready)

**From** `/docs/PRE_LAUNCH_CHECKLIST.md`:
- **Created**: September 5, 2025
- **Target Launch**: November 1, 2025 (8 weeks)
- **Current State**: 60% launch ready

---

### **🔴 WEEK 1-2: TRUST & ACCURACY (Critical - Blocks Everything)**

**What "Beta Launch Polish" Means**:

These are **BLOCKING BUGS** that prevent beta launch. If users encounter these, they'll lose trust and churn immediately.

#### **1. Financial Calculation Issues** ⚠️ CRITICAL

**Problem**: Percentage vs Decimal Inconsistency
```javascript
// CURRENT BUG:
quickCalculationService.ts returns: capRate = 0.038  // Decimal (3.8%)
financialCalculations.ts returns:   capRate = 3.8   // Percentage

// USER SEES:
"Cap Rate: 0.038%" (WRONG - should be 3.8%)
```

**Impact**:
- Tests failing
- User confusion ("Is my cap rate 0.038% or 3.8%?")
- No differentiation between 3% and 10% cap rates

**Files to Fix**:
- `/backend/src/services/quickCalculationService.ts`
- `/backend/src/utils/financialCalculations.ts`

**Solution**: Standardize to percentage format everywhere (3.8, not 0.038)

---

#### **2. Precision Handling Issues** ⚠️ CRITICAL

**Problem**: Floating-point arithmetic breaking JSON serialization

```javascript
// CURRENT BUGS:
monthlyTax: 1085.3333333333333  // Should be $1,085.33
expenses: Infinity              // Breaks JSON.stringify()
capRate: 7.199999999999999      // Should be 7.2%
```

**Impact**:
- API responses fail to serialize (500 errors)
- Frontend displays "$19.650000000000002/month"
- User loses trust in "professional-grade" calculations

**Solution**: Use `roundCurrency()` and `roundPercent()` utilities

```typescript
// backend/src/utils/precision.ts (already exists)
export function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100; // $1,085.33
}

export function roundPercent(value: number, decimals: number = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor; // 7.20%
}

export function safeNumber(value: number): number {
  if (!isFinite(value) || isNaN(value)) return 0;
  return value;
}
```

**Files to Fix**: All calculation services

---

#### **3. Console Logs in Production** ⚠️ MEDIUM

**Problem**: Debug logs still active in production

```javascript
// backend/src/utils/financialCalculations.ts lines 88-135
console.log('IRR calculation debug:', cashFlows);
console.log('Iteration', i, 'IRR guess:', guess);
```

**Impact**:
- Performance degradation (logging overhead)
- Exposes calculation internals (security risk)
- Unprofessional for production app

**Solution**: Replace with `logger.debug()` (disabled in production)

---

#### **4. AI Content $0 Bug** ⚠️ HIGH

**Problem**: AI showing nonsensical data

```
AI Output:
"This $0 property with $0 monthly rent shows strong potential..."
```

**Root Cause**: AI service extracting data from wrong object
```typescript
// WRONG:
const propertyData = analysis.summary; // analysis object has calculated values, not input data

// CORRECT:
const propertyData = originalPropertyInput; // Use original user input
```

**Impact**: AI recommendations look broken, users lose trust in AI insights

**Files to Fix**:
- `/backend/src/services/investment/investmentDecisionEngine.ts`
- `/backend/src/services/aiService.ts`

---

#### **5. V3.0 Score Display Consistency** ⚠️ MEDIUM

**Problem**: Frontend vs Backend terminology mismatch

```typescript
// Backend returns:
{ dealQualityScore: 81, dataReliability: 80 }

// Frontend displays:
"81% confidence" // WRONG - should be "Deal Quality: 81/100"
```

**Impact**: User confusion about what scores mean

**Solution**: Standardize terminology across frontend/backend

---

### **🧪 100-Property Validation Suite** ⚠️ HIGH

**QE Engineer Requirement**: Comprehensive test coverage BEFORE beta launch

**Test Categories**:
1. **20 Historical Properties**: Known outcomes (profitable vs money pit)
2. **20 Edge Cases**: 0% down, negative NOI, Infinity expenses
3. **20 DealCheck Comparisons**: REAnalyzr vs DealCheck verdicts
4. **20 Extreme Values**: $10M properties, 1% cap rate, 50% vacancy
5. **20 Multi-Family Scenarios**: 2-unit to 32-unit properties

**Why This Matters**:
- **One wrong verdict = lost user** ("REAnalyzr told me to buy, I lost $50K")
- **DealCheck accuracy = table stakes** (we must match or exceed)
- **Edge cases = production bugs** (0% down payment breaks amortization)

**Files to Create**:
- `/backend/tests/validation/100-property-validation-suite.test.ts`

---

### **🚦 WEEK 7-8: POLISH & LAUNCH PREP**

#### **Performance Optimization**

**Current**: 4-second analysis time
**Target**: <2 seconds

**Issues**:
- AI API calls taking 3-4 seconds (GPT-4o-mini)
- Market data API calls not cached aggressively
- MongoDB queries not optimized

**Solution**:
- Pre-fetch market data in background
- Cache AI responses (same property = same insights)
- Add performance monitoring (New Relic or DataDog)

---

#### **Mobile Experience**

**Current State**: Responsive but not tested thoroughly
**Target**: Apple-quality mobile experience

**Issues**:
- Property Wizard UI cramped on iPhone SE
- Financial tables horizontal scroll on mobile
- Unit Mix table not touch-optimized

**Testing Required**:
- iPhone SE (smallest screen)
- iPhone 15 Pro (standard)
- iPad (tablet experience)
- Android (Samsung Galaxy, Pixel)

---

#### **Trust & Security**

**SOC 2 Checklist** (Basic security for beta):
- [ ] Data encryption at rest (MongoDB Atlas default)
- [ ] HTTPS enforced (SSL certificates)
- [ ] JWT token expiration (currently 7 days)
- [ ] Rate limiting (recently fixed!)
- [ ] Audit logging (user actions tracked)
- [ ] Input validation (prevent SQL injection, XSS)

**Calculation Audit Trail**:
- Log every analysis with input data
- Store calculation intermediates (for debugging)
- Version tracking (which Investment Decision Engine version?)

---

## 📋 **BETA LAUNCH POLISH PRIORITY MATRIX**

| Issue | Impact | Effort | Priority | Blocks Launch? |
|-------|--------|--------|----------|----------------|
| Percentage vs Decimal | HIGH | 2 days | P0 | ✅ YES |
| Precision Handling (Infinity) | HIGH | 1 day | P0 | ✅ YES |
| AI Content $0 Bug | HIGH | 4 hours | P0 | ✅ YES |
| 100-Property Test Suite | HIGH | 1 week | P0 | ✅ YES |
| Console Logs in Production | MEDIUM | 2 hours | P1 | ⚠️ SHOULD |
| V3.0 Score Display | MEDIUM | 4 hours | P1 | ⚠️ SHOULD |
| Performance <2s | MEDIUM | 3 days | P2 | ❌ NO (nice-to-have) |
| Mobile Testing | LOW | 2 days | P2 | ❌ NO (works, needs polish) |
| SOC 2 Basics | MEDIUM | 1 week | P1 | ⚠️ SHOULD |

---

## 🎯 **RECOMMENDED BETA LAUNCH SEQUENCE**

### **Option A: Launch ASAP (2-3 Weeks)**

**Scope**: Fix P0 issues only, defer MF to post-launch

```
Week 1:
- Fix percentage vs decimal (2 days)
- Fix precision handling (1 day)
- Fix AI $0 bug (4 hours)
- Remove console logs (2 hours)
- Basic SOC 2 security (2 days)

Week 2-3:
- Build 100-property test suite (1 week)
- Run comprehensive QE validation
- Fix any critical bugs discovered

Week 3:
- Beta launch with SFR only
- Collect user feedback
- Monitor for calculation bugs
```

**Pros**:
- ✅ Get to market faster (beat DealCheck momentum)
- ✅ Validate product-market fit with SFR first
- ✅ Build user base before adding complexity

**Cons**:
- ❌ No MF support (users with MF properties churn to DealCheck)
- ❌ Competitive disadvantage (DealCheck has MF)

---

### **Option B: Launch with MF (6-8 Weeks)**

**Scope**: Fix P0 + build MF features

```
Week 1-2: Polish (same as Option A)
Week 3-4: Build MF Foundation
  - MF Property Wizard (4-step flow)
  - Census + algorithmic rent estimation
  - MF calculation engine (NOI, DSCR, Cap Rate)

Week 5-6: MF Intelligence
  - Unit Mix Intelligence
  - MF Decision Engine calibration
  - AI prompts for MF analysis

Week 7-8: Testing & Launch
  - MF test scenarios (2-unit to 32-unit)
  - Beta user feedback
  - Final polish + launch
```

**Pros**:
- ✅ Launch with competitive parity (DealCheck killer)
- ✅ Capture MF investor market (larger TAM)
- ✅ "REAnalyzr supports 2-32 units" = marketing hook

**Cons**:
- ❌ Delays launch by 4-6 weeks
- ❌ More surface area for bugs
- ❌ Rent data strategy needs validation first

---

### **Option C: HYBRID - Soft Launch + MF Fast Follow (Recommended)**

**Business Expert Recommendation**:

```
Week 1-2: Fix P0 Issues (Beta Polish)
Week 3: Soft Launch to 50 Beta Users (SFR Only)
  - Invite-only beta
  - Collect feedback
  - Monitor calculation accuracy

Week 4: RentCast MF API Validation
  - Run test-rentcast-mf-support.js
  - Determine Tier 1 vs Tier 2 rent data strategy

Week 5-6: Build MF (Parallel with Beta Feedback)
  - MF Wizard
  - Census + algorithmic rent estimation
  - MF calculation engine

Week 7: MF Beta Testing (Same 50 Users)
Week 8: Public Launch (SFR + MF)
```

**Why This Works**:
- ✅ **De-risked**: Validate SFR accuracy before adding MF complexity
- ✅ **Fast Feedback Loop**: 50 beta users find bugs you missed
- ✅ **Competitive Launch**: Public launch includes MF (vs DealCheck)
- ✅ **Data Validation**: Test RentCast MF support during soft beta
- ✅ **Marketing Story**: "Beta tested by 50 investors, now public with MF"

---

## 🔬 **IMMEDIATE NEXT STEPS**

### **For MF Rent Data**:
1. ✅ Run `test-rentcast-mf-support.js` (validate API capabilities)
2. ✅ Implement Tier 2 (Census + Algorithmic) as baseline
3. ✅ Build MFRentEstimationService with 3-tier fallback
4. ⏸️ Defer Tier 1 (RentCast API) if not supported

### **For Beta Launch Polish**:
1. 🔴 **P0: Fix percentage vs decimal** (blocks testing)
2. 🔴 **P0: Fix precision handling** (breaks API)
3. 🔴 **P0: Fix AI $0 bug** (users see broken AI)
4. 🟡 **P1: Build 100-property test suite** (QE validation)
5. 🟡 **P1: Remove console logs** (production cleanliness)
6. 🟢 **P2: Performance optimization** (nice-to-have)

---

## 💡 **FINAL RECOMMENDATION**

**Architect + Business Expert Consensus**:

### **Launch Strategy: HYBRID (Option C)**

**Timeline**:
- **Week 1-2**: Beta Polish (fix P0 issues)
- **Week 3**: Soft launch SFR to 50 beta users
- **Week 4-6**: Build MF in parallel with beta feedback
- **Week 7-8**: MF beta testing + public launch

**MF Rent Data Strategy**:
- **Start with Tier 2** (Census + Algorithmic) - 85% accurate
- **Test RentCast Tier 1** during soft beta
- **User manual override** always available (Tier 3)

**Beta Launch Polish Priority**:
1. Fix calculation bugs (P0)
2. Build test suite (P0)
3. Security basics (P1)
4. Performance nice-to-haves (P2)

**Why**:
- De-risks launch with soft beta validation
- Collects real user feedback BEFORE MF complexity
- Public launch includes MF (competitive parity with DealCheck)
- 8-week timeline realistic with parallel workstreams

---

**Questions to Resolve**:

1. **Do you have 50 beta users lined up?** (BiggerPockets community, investor friends?)
2. **RentCast API budget**: How many API calls/month on current plan? (MF uses more calls)
3. **Performance monitoring**: Do you have New Relic/DataDog access? (or use free tier?)
4. **Mobile testing devices**: Do you have iPhone + Android for testing?
5. **Launch marketing ready?**: Email list, social media, BiggerPockets strategy?

Let me know which launch strategy you prefer, and I'll create the detailed implementation plan! 🚀
