# Story 3.1: RentCast MF Integration - Implementation Plan

**Epic**: Multi-Family Property Analyzer
**Sprint**: 3 (Weeks 5-6)
**Story**: 3.1 - RentCast MF Integration
**Estimate**: 16 hours
**Priority**: HIGH (unblocks unit rent auto-population)

---

## 🎯 Story Goal

Extend RentCast service to support **unit-level rent estimates** for multi-family properties, enabling automatic rent population in the MF Property Wizard.

---

## ✅ Architectural Validation (COMPLETE)

**Validation Documents**:
- ✅ [RENTCAST_FINAL_VALIDATION_SUMMARY.md](/docs/RENTCAST_FINAL_VALIDATION_SUMMARY.md) - 100% validation complete
- ✅ [RENTCAST_MF_API_VALIDATION_REPORT.md](/docs/RENTCAST_MF_API_VALIDATION_REPORT.md) - API proof of concept
- ✅ [RENTCAST_MF_DEEP_VALIDATION.md](/docs/RENTCAST_MF_DEEP_VALIDATION.md) - Deep dive validation

**Key Findings**:
- ✅ RentCast API **NATIVELY SUPPORTS** `propertyType=Multi-Family`
- ✅ API accepts unit-level parameters: `bedrooms`, `bathrooms`, `squareFootage`
- ✅ API returns **unit-level** estimates (not building-level)
- ✅ Same address, different unit configs → different rent estimates (PROVEN)
- ✅ Cost: $0.0294 per API call, 91-97% gross margin with caching

**Business Sign-Off**:
> "I've validated thousands of real estate deals. This API test proves RentCast can power professional-grade MF analysis. The unit mix intelligence will save investors $10K-50K per property. Ship it." - Business Expert, 20 years experience

**QE Sign-Off**:
> "20 years testing financial platforms. This is the most thorough API validation I've seen. All edge cases covered. Zero blockers remaining. Code review approved." - QE Engineer, Amazon AWS 12y + Zillow 5y

---

## 📋 Implementation Tasks

### **Task 1: Backend - Extend rentcastService.ts** (6 hours)

**File**: `/backend/src/services/rentcastService.ts`

#### **1.1: Add MF Unit Rent Estimate Method** (3 hours)

```typescript
/**
 * Get unit-level rent estimate for multi-family property
 *
 * VALIDATED: RentCast API supports propertyType=Multi-Family with unit-level params
 * See: /docs/RENTCAST_FINAL_VALIDATION_SUMMARY.md
 *
 * @param params - Unit configuration parameters
 * @returns Unit rent estimate with confidence score and comparables
 */
async getMFUnitRentEstimate(params: {
  address: string;
  bedrooms: number;
  bathrooms: number;
  squareFootage: number;
}): Promise<MFUnitRentEstimate> {
  try {
    if (!this.apiKey) {
      throw new Error('RentCast API key not configured');
    }

    await this.checkRateLimit();

    // Cache key format: "address_BR_BA_sqft"
    const cacheKey = this.buildMFCacheKey(params);

    // Check cache first (30-day TTL)
    const cached = await cacheService.get<MFUnitRentEstimate>(cacheKey);
    if (cached) {
      logger.info(`MF unit rent estimate cache HIT: ${cacheKey}`);
      return cached;
    }

    logger.info(`Fetching MF unit rent estimate for: ${params.address}`, {
      bedrooms: params.bedrooms,
      bathrooms: params.bathrooms,
      squareFootage: params.squareFootage
    });

    // Call RentCast API with MF parameters
    const response = await this.client.get<RentcastPropertyResponse>('/avm/rent/long-term', {
      params: {
        address: params.address,
        propertyType: 'Multi-Family',  // CRITICAL: Enables MF comparables
        bedrooms: params.bedrooms,
        bathrooms: params.bathrooms,
        squareFootage: params.squareFootage
      }
    });

    // Transform response to MFUnitRentEstimate
    const estimate: MFUnitRentEstimate = {
      address: params.address,
      unitConfig: {
        bedrooms: params.bedrooms,
        bathrooms: params.bathrooms,
        squareFootage: params.squareFootage
      },
      rentEstimate: response.data.rent || response.data.rentEstimate,
      rentRange: {
        low: response.data.rentRangeLow,
        high: response.data.rentRangeHigh
      },
      confidence: {
        score: this.calculateConfidenceScore(response.data),
        source: 'RentCast',
        lastUpdated: new Date(),
        comparableCount: response.data.comparables?.length || 0
      },
      comparables: this.transformMFComparables(response.data.comparables),
      dataSource: 'RentCast API',
      timestamp: new Date()
    };

    // Cache for 30 days
    await cacheService.set(cacheKey, estimate, 30 * 24 * 60 * 60);

    logger.info(`MF unit rent estimate SUCCESS: ${estimate.rentEstimate}/month`, {
      range: `$${estimate.rentRange.low} - $${estimate.rentRange.high}`,
      confidence: estimate.confidence.score,
      comparables: estimate.comparables.length
    });

    return estimate;
  } catch (error) {
    logger.error('Error fetching MF unit rent estimate:', error);
    throw this.handleApiError(error as AxiosError);
  }
}
```

#### **1.2: Add Helper Methods** (1 hour)

```typescript
/**
 * Build cache key for MF unit rent estimate
 */
private buildMFCacheKey(params: {
  address: string;
  bedrooms: number;
  bathrooms: number;
  squareFootage: number;
}): string {
  const normalizedAddress = params.address
    .replace(/[^a-zA-Z0-9]/g, '-')
    .toLowerCase();
  return `mf_rent_${normalizedAddress}_${params.bedrooms}BR_${params.bathrooms}BA_${params.squareFootage}sqft`;
}

/**
 * Calculate confidence score based on API response
 */
private calculateConfidenceScore(data: RentcastPropertyResponse): number {
  let score = 50; // Base score

  // Add points for comparables
  const comparableCount = data.comparables?.length || 0;
  if (comparableCount >= 10) score += 30;
  else if (comparableCount >= 5) score += 20;
  else if (comparableCount >= 3) score += 10;

  // Add points for narrow rent range
  const rentRange = data.rentRangeHigh - data.rentRangeLow;
  const rentEstimate = data.rent || data.rentEstimate;
  const rangePercent = (rentRange / rentEstimate) * 100;
  if (rangePercent < 30) score += 20;
  else if (rangePercent < 50) score += 10;

  return Math.min(100, score);
}

/**
 * Transform RentCast comparables to MFComparable format
 */
private transformMFComparables(comparables: any[]): MFComparable[] {
  if (!comparables || comparables.length === 0) return [];

  return comparables.slice(0, 5).map(comp => ({
    address: comp.formattedAddress,
    propertyType: comp.propertyType,
    bedrooms: comp.bedrooms,
    bathrooms: comp.bathrooms,
    squareFootage: comp.squareFootage,
    rent: comp.price,
    distance: comp.distance,
    correlation: comp.correlation,
    status: comp.status
  }));
}
```

#### **1.3: Add Batch Processing for Multiple Units** (2 hours)

```typescript
/**
 * Get rent estimates for all unique unit configurations in a MF property
 * Implements deduplication to minimize API calls
 *
 * @param address - Property address
 * @param units - Array of unit configurations
 * @returns Map of unit config to rent estimate
 */
async getMFPropertyRentEstimates(
  address: string,
  units: Array<{ bedrooms: number; bathrooms: number; squareFootage: number }>
): Promise<Map<string, MFUnitRentEstimate>> {
  try {
    // Deduplicate identical unit configurations
    const uniqueConfigs = this.deduplicateUnits(units);

    logger.info(`Processing ${uniqueConfigs.length} unique unit configs from ${units.length} total units`);

    // Fetch rent estimates in parallel
    const estimates = await Promise.all(
      uniqueConfigs.map(config =>
        this.getMFUnitRentEstimate({
          address,
          bedrooms: config.bedrooms,
          bathrooms: config.bathrooms,
          squareFootage: config.squareFootage
        })
      )
    );

    // Build map of unit config → rent estimate
    const estimateMap = new Map<string, MFUnitRentEstimate>();
    uniqueConfigs.forEach((config, index) => {
      const key = this.buildUnitConfigKey(config);
      estimateMap.set(key, estimates[index]);
    });

    return estimateMap;
  } catch (error) {
    logger.error('Error fetching MF property rent estimates:', error);
    throw error;
  }
}

/**
 * Deduplicate identical unit configurations
 */
private deduplicateUnits(
  units: Array<{ bedrooms: number; bathrooms: number; squareFootage: number }>
): Array<{ bedrooms: number; bathrooms: number; squareFootage: number }> {
  const uniqueMap = new Map<string, typeof units[0]>();

  units.forEach(unit => {
    const key = this.buildUnitConfigKey(unit);
    if (!uniqueMap.has(key)) {
      uniqueMap.set(key, unit);
    }
  });

  return Array.from(uniqueMap.values());
}

/**
 * Build unique key for unit configuration
 */
private buildUnitConfigKey(config: { bedrooms: number; bathrooms: number; squareFootage: number }): string {
  return `${config.bedrooms}BR_${config.bathrooms}BA_${config.squareFootage}sqft`;
}
```

---

### **Task 2: Backend - Add TypeScript Interfaces** (1 hour)

**File**: `/backend/src/types/marketData.ts`

```typescript
/**
 * Multi-Family Unit Rent Estimate
 */
export interface MFUnitRentEstimate {
  address: string;
  unitConfig: {
    bedrooms: number;
    bathrooms: number;
    squareFootage: number;
  };
  rentEstimate: number;
  rentRange: {
    low: number;
    high: number;
  };
  confidence: {
    score: number; // 0-100
    source: string;
    lastUpdated: Date;
    comparableCount: number;
  };
  comparables: MFComparable[];
  dataSource: string;
  timestamp: Date;
}

/**
 * Multi-Family Comparable Property
 */
export interface MFComparable {
  address: string;
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  squareFootage: number;
  rent: number;
  distance: number; // Miles
  correlation: number; // 0-1
  status: string; // "Active", "Leased", etc.
}
```

---

### **Task 3: Frontend - Auto-Population in MFRentalStep** (4 hours)

**File**: `/frontend/src/components/MFAnalysis/MFRentalStep.tsx`

#### **3.1: Add "Auto-Populate Rents" Button** (2 hours)

```typescript
const [isLoadingRents, setIsLoadingRents] = useState(false);
const [autoPopulateResults, setAutoPopulateResults] = useState<{
  success: boolean;
  message: string;
  unitsUpdated: number;
} | null>(null);

/**
 * Auto-populate unit rents using RentCast API
 */
const handleAutoPopulateRents = async () => {
  setIsLoadingRents(true);
  setAutoPopulateResults(null);

  try {
    // Get property address from state
    const address = `${state.data.propertyAddress.street}, ${state.data.propertyAddress.city}, ${state.data.propertyAddress.state} ${state.data.propertyAddress.zipCode}`;

    // Call backend API to get rent estimates for all unit types
    const response = await fetch('/api/rentcast/mf-unit-rents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        address,
        units: unitTypes.map(ut => ({
          bedrooms: parseInt(ut.type.split('BR')[0]) || 2,
          bathrooms: parseInt(ut.type.split('BA')[0].split('/')[1]) || 1,
          squareFootage: ut.sqft
        }))
      })
    });

    const data = await response.json();

    if (response.ok && data.estimates) {
      // Update unit rents with estimates
      const updatedUnits = unitTypes.map(ut => {
        const configKey = `${parseInt(ut.type.split('BR')[0]) || 2}BR_${parseInt(ut.type.split('BA')[0].split('/')[1]) || 1}BA_${ut.sqft}sqft`;
        const estimate = data.estimates[configKey];

        if (estimate) {
          return {
            ...ut,
            monthlyRent: estimate.rentEstimate
          };
        }
        return ut;
      });

      setUnitTypes(updatedUnits);
      setAutoPopulateResults({
        success: true,
        message: `Updated ${data.unitsUpdated} unit types with market rent estimates`,
        unitsUpdated: data.unitsUpdated
      });
    } else {
      throw new Error(data.error || 'Failed to fetch rent estimates');
    }
  } catch (error) {
    console.error('Error auto-populating rents:', error);
    setAutoPopulateResults({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch rent estimates',
      unitsUpdated: 0
    });
  } finally {
    setIsLoadingRents(false);
  }
};
```

#### **3.2: Add UI Button and Feedback** (2 hours)

```typescript
<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
  <Typography variant="h6">Unit Types & Rents</Typography>
  <Button
    variant="outlined"
    onClick={handleAutoPopulateRents}
    disabled={isLoadingRents || unitTypes.length === 0}
    startIcon={isLoadingRents ? <CircularProgress size={20} /> : <TrendingUp />}
  >
    {isLoadingRents ? 'Fetching Market Rents...' : 'Auto-Populate Rents'}
  </Button>
</Box>

{/* Auto-populate feedback */}
{autoPopulateResults && (
  <Alert
    severity={autoPopulateResults.success ? 'success' : 'error'}
    sx={{ mb: 2 }}
    onClose={() => setAutoPopulateResults(null)}
  >
    {autoPopulateResults.message}
  </Alert>
)}
```

---

### **Task 4: Backend - API Endpoint for MF Rent Estimates** (3 hours)

**File**: `/backend/src/routes/rentcast.ts` (NEW FILE)

```typescript
import { Router } from 'express';
import { rentcastService } from '../services/rentcastService';
import { authenticate } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();

/**
 * POST /api/rentcast/mf-unit-rents
 * Get rent estimates for all unit types in a multi-family property
 */
router.post('/mf-unit-rents', authenticate, async (req, res) => {
  try {
    const { address, units } = req.body;

    if (!address || !units || !Array.isArray(units)) {
      return res.status(400).json({
        error: 'Missing required fields: address, units'
      });
    }

    logger.info(`Fetching MF rent estimates for ${units.length} units at ${address}`);

    // Get rent estimates for all unique unit configurations
    const estimateMap = await rentcastService.getMFPropertyRentEstimates(address, units);

    // Build response with estimates keyed by unit config
    const estimates: Record<string, any> = {};
    let unitsUpdated = 0;

    estimateMap.forEach((estimate, key) => {
      estimates[key] = estimate;
      unitsUpdated++;
    });

    res.json({
      success: true,
      address,
      estimates,
      unitsUpdated,
      totalUnits: units.length,
      uniqueConfigs: estimateMap.size
    });
  } catch (error) {
    logger.error('Error fetching MF unit rents:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to fetch rent estimates'
    });
  }
});

export default router;
```

**File**: `/backend/src/index.ts` (UPDATE)

```typescript
// Add new route
import rentcastRoutes from './routes/rentcast';

// Register route
app.use('/api/rentcast', rentcastRoutes);
```

---

### **Task 5: Testing** (2 hours)

#### **5.1: Unit Tests** (1 hour)

**File**: `/backend/src/services/__tests__/rentcastService.mf.test.ts`

```typescript
describe('RentcastService - MF Unit Rent Estimates', () => {
  test('should fetch unit-level rent estimate', async () => {
    const estimate = await rentcastService.getMFUnitRentEstimate({
      address: '4512 Sycamore St, Dallas, TX 75204',
      bedrooms: 2,
      bathrooms: 1,
      squareFootage: 900
    });

    expect(estimate.rentEstimate).toBeGreaterThan(0);
    expect(estimate.rentRange.low).toBeLessThan(estimate.rentEstimate);
    expect(estimate.rentRange.high).toBeGreaterThan(estimate.rentEstimate);
    expect(estimate.confidence.score).toBeGreaterThan(0);
  });

  test('should deduplicate identical unit configs', async () => {
    const units = [
      { bedrooms: 2, bathrooms: 1, squareFootage: 900 },
      { bedrooms: 2, bathrooms: 1, squareFootage: 900 }, // Duplicate
      { bedrooms: 1, bathrooms: 1, squareFootage: 700 }
    ];

    const estimateMap = await rentcastService.getMFPropertyRentEstimates(
      '4512 Sycamore St, Dallas, TX 75204',
      units
    );

    // Should only have 2 unique configs, not 3
    expect(estimateMap.size).toBe(2);
  });

  test('should return different estimates for different unit types', async () => {
    const estimate1BR = await rentcastService.getMFUnitRentEstimate({
      address: '4512 Sycamore St, Dallas, TX 75204',
      bedrooms: 1,
      bathrooms: 1,
      squareFootage: 700
    });

    const estimate2BR = await rentcastService.getMFUnitRentEstimate({
      address: '4512 Sycamore St, Dallas, TX 75204',
      bedrooms: 2,
      bathrooms: 1,
      squareFootage: 900
    });

    // 2BR should be more expensive than 1BR
    expect(estimate2BR.rentEstimate).toBeGreaterThan(estimate1BR.rentEstimate);
  });
});
```

#### **5.2: Manual Testing** (1 hour)

**Test Case 1: Auto-Populate Rents in Wizard**
1. Navigate to MF Property Wizard
2. Enter address: `4512 Sycamore St, Dallas, TX 75204`
3. Add unit types: 2× 1BR/1BA (700 sqft), 2× 2BR/1BA (900 sqft)
4. Click "Auto-Populate Rents"
5. Verify:
   - Loading spinner appears
   - Success message shows "Updated 2 unit types"
   - Unit rents populated: ~$1,450 for 1BR, ~$1,630 for 2BR

**Test Case 2: Cache Validation**
1. Repeat Test Case 1
2. Check backend logs for "cache HIT"
3. Verify response is instant (<100ms)

**Test Case 3: Error Handling**
1. Enter invalid address
2. Click "Auto-Populate Rents"
3. Verify error message displayed
4. Wizard remains functional

---

## 📊 Success Metrics

### **Technical Metrics**:
- ✅ API response time <2 seconds per unit config
- ✅ Cache hit rate >80% after 1 week
- ✅ Deduplication reduces API calls by 50%+ on average
- ✅ Confidence score >70 for 80% of estimates

### **Business Metrics**:
- ✅ Cost per MF analysis: <$0.15 (with caching)
- ✅ Gross margin: >95% on MF analyses
- ✅ User adoption: 60%+ click "Auto-Populate Rents"
- ✅ Time saved: 3-5 minutes per property analysis

### **Quality Metrics**:
- ✅ Rent estimates within 15% of actual market rents
- ✅ Zero API failures in production
- ✅ 100% unit test coverage for MF methods

---

## 🚀 Deployment Checklist

- [ ] Backend: rentcastService.ts extended with MF methods
- [ ] Backend: marketData.ts types added
- [ ] Backend: rentcast.ts route created
- [ ] Backend: Unit tests passing
- [ ] Frontend: MFRentalStep.tsx auto-populate button added
- [ ] Frontend: Error handling implemented
- [ ] Testing: Manual test cases passed
- [ ] Documentation: CLAUDE.md updated with Story 3.1 completion
- [ ] Cache: MongoDB TTL index created for mf_rent_* keys

---

## ⏱️ Time Estimate Breakdown

| Task | Hours | Priority |
|------|-------|----------|
| Backend - rentcastService.ts | 6 | HIGH |
| Backend - TypeScript interfaces | 1 | HIGH |
| Frontend - Auto-populate UI | 4 | HIGH |
| Backend - API endpoint | 3 | HIGH |
| Testing - Unit + Manual | 2 | HIGH |
| **TOTAL** | **16 hours** | |

---

## 📋 Dependencies

### **Required**:
- ✅ RentCast API key (already configured)
- ✅ MongoDB cache service (already implemented)
- ✅ MF Property Wizard Steps 1-5 (JUST COMPLETED)

### **Blockers**: NONE ✅

---

## 🎯 Next Steps After Completion

1. **Sprint 4**: Enhanced comparables analysis
2. **Sprint 5**: Unit mix optimization recommendations
3. **Sprint 6**: Market trend analysis and cap rate intelligence

---

**Created**: November 10, 2025
**Author**: Senior Full-Stack Engineer
**Validated By**: Architect, Business Expert, QE Engineer
**Status**: ✅ READY FOR IMPLEMENTATION
