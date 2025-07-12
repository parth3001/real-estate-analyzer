# Phase 2: External API Integration Plan

## Overview
Transform the Property Wizard from mock data to real-time property intelligence by integrating professional real estate APIs.

## API Integration Priority

### 1. ATTOM Data API (Property Details & Tax Data)
**Purpose**: Comprehensive property details, tax assessments, property characteristics
**Endpoints**:
- Property Detail: `/property/detail` - Get property characteristics
- Property AVM: `/property/avm` - Automated valuation model
- Assessment: `/assessment/detail` - Tax assessment data
- Property Address: `/property/address` - Address standardization

**Data We'll Get**:
- Accurate square footage, bedrooms, bathrooms
- Year built, lot size, property type
- Tax assessed value and tax amount
- Property ownership history
- Building permits and improvements

**Implementation**:
```typescript
// backend/src/services/attomService.ts
interface AttomPropertyResponse {
  property: {
    address: StandardizedAddress;
    building: {
      size: { universalSize: number };
      rooms: { beds: number; baths: number };
      yearBuilt: number;
      construction: { type: string };
    };
    lot: { lotSize: number };
    assessment: {
      assessed: { assdTotalValue: number };
      tax: { taxAmount: number };
    };
  };
}
```

### 2. Insurance API Integration
**Options**:
1. **Steadily API** - Simple insurance estimates
2. **Cape Analytics** - AI-based property risk assessment
3. **BuildFax** - Property condition and permit history

**Data We'll Get**:
- Annual insurance premium estimates
- Risk factors (flood zone, wildfire risk, etc.)
- Property condition score
- Replacement cost estimates

### 3. Enhanced RentCast Integration
**Current**: Basic market data
**Enhanced**: Full property lookup with comparables

**New Features**:
- Address autocomplete and validation
- Detailed comparable properties with photos
- Rent estimate confidence bands
- Historical rent trends
- Neighborhood demographics

### 4. Tax Data Enhancement
**Options**:
1. **CoreLogic** - Comprehensive tax data
2. **Local County APIs** - Direct from source
3. **ATTOM Tax API** - Part of ATTOM suite

**Data We'll Get**:
- Current tax rate by address
- Tax payment history
- Special assessments
- Exemptions available

## Implementation Plan

### Day 1-2: ATTOM Service Setup
- [ ] Register for ATTOM API key
- [ ] Create attomService.ts with caching
- [ ] Implement property detail endpoint
- [ ] Add TypeScript interfaces
- [ ] Create test suite

### Day 3-4: ATTOM Integration
- [ ] Update PropertyDataAggregator to use ATTOM
- [ ] Map ATTOM data to wizard format
- [ ] Handle API errors gracefully
- [ ] Add confidence scoring based on data age
- [ ] Update frontend to show real data source

### Day 5-6: Insurance API
- [ ] Research and select insurance API
- [ ] Implement insurance service
- [ ] Add to wizard assumptions step
- [ ] Calculate more accurate insurance rates
- [ ] Show risk factors to user

### Day 7-8: Enhanced RentCast
- [ ] Implement address autocomplete
- [ ] Add detailed comparables view
- [ ] Show rent trends chart
- [ ] Add neighborhood insights
- [ ] Improve confidence scoring

### Day 9-10: Integration & Testing
- [ ] Connect all APIs in PropertyDataAggregator
- [ ] Implement fallback strategies
- [ ] Add comprehensive error handling
- [ ] Performance optimization
- [ ] End-to-end testing

## API Cost Management

### Caching Strategy
- **ATTOM**: Cache for 30 days (property details change slowly)
- **Insurance**: Cache for 7 days (rates update weekly)
- **RentCast**: Keep existing 1-month cache
- **Tax Data**: Cache for 90 days (updated quarterly)

### Rate Limiting
```typescript
// Implement rate limiting
const rateLimiter = {
  attom: { requests: 1000, period: 'day' },
  insurance: { requests: 500, period: 'day' },
  rentcast: { requests: 2000, period: 'month' }
};
```

### Cost Optimization
1. Check cache before API call
2. Batch requests when possible
3. Only fetch needed fields
4. Use webhook updates for changes
5. Implement usage analytics

## Data Confidence Scoring

### Confidence Factors
1. **Data Age**: How recent is the data?
2. **Source Reliability**: Direct source vs. estimated
3. **Completeness**: All fields populated?
4. **Consistency**: Multiple sources agree?

### Scoring Algorithm
```typescript
calculateConfidence(data: PropertyData): number {
  let score = 100;
  
  // Age penalty (lose 1 point per month old)
  const ageMonths = getDataAgeInMonths(data.lastUpdated);
  score -= Math.min(ageMonths, 20);
  
  // Source bonus/penalty
  if (data.source === 'county_records') score += 10;
  if (data.source === 'estimated') score -= 20;
  
  // Completeness bonus
  const completeness = getFieldCompleteness(data);
  score = score * completeness;
  
  return Math.max(0, Math.min(100, score));
}
```

## Frontend Updates

### Address Step Enhancements
- Add address autocomplete dropdown
- Show address validation status
- Display map preview
- Show property image if available

### New Data Display
- Show data source badges
- Add "Verified" checkmarks
- Display last updated dates
- Show confidence meters
- Add refresh button for stale data

### Error Handling
- Graceful fallbacks to estimates
- Clear error messages
- Retry failed lookups
- Manual override options

## Security Considerations

### API Key Management
```typescript
// Use environment variables
process.env.ATTOM_API_KEY
process.env.INSURANCE_API_KEY

// Implement key rotation
const getApiKey = (service: string): string => {
  return keyRotationService.getCurrentKey(service);
};
```

### Data Privacy
- Don't store PII unnecessarily
- Encrypt sensitive data at rest
- Implement data retention policies
- Add user consent for data lookups

## Success Metrics

### Technical Metrics
- API response time < 2 seconds
- Cache hit rate > 80%
- API availability > 99.5%
- Error rate < 1%

### Business Metrics
- Auto-population rate > 90%
- User time saved: 10+ minutes per property
- Data accuracy > 95%
- User satisfaction increase

## Rollout Plan

### Phase 2.1: Internal Testing
- Enable for development environment
- Test with 100 properties
- Gather accuracy metrics
- Fix edge cases

### Phase 2.2: Beta Release
- Enable for 10% of users
- Monitor API usage
- Gather feedback
- Optimize performance

### Phase 2.3: Full Release
- Enable for all users
- Marketing announcement
- Update documentation
- Monitor costs

## Next Steps

1. **Immediate**: Get API keys for ATTOM and insurance provider
2. **Tomorrow**: Start implementing ATTOM service
3. **This Week**: Complete basic property lookup
4. **Next Week**: Add insurance and enhanced features

Ready to begin with ATTOM API integration!