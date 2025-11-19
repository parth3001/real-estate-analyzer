# Story 3.1 - QE Regression Testing Plan

**Date**: January 11, 2025
**Story**: RentCast Multi-Family Unit Rent Auto-Population
**QE Engineer**: Senior QE with 20 years experience
**Test Standard**: Gold Standard E2E Test (anna-tx-aggressive-investor-test.cy.js)

---

## 🎯 QE Testing Philosophy

**Core Principle**: "No compromise on quality standards"

As stated in CLAUDE.md:
> "You are a Senior QE Engineer with 20 years of experience including 12 years at Amazon AWS testing financial and data-intensive services, 5 years at Zillow working on real estate analytics platforms..."

**Gold Standard Test**: `/cypress/e2e/anna-tx-aggressive-investor-test.cy.js`
- ✅ **100% Pass Rate**: Consistent across multiple runs
- ✅ **Stable Duration**: 68 seconds execution time
- ✅ **Complete Coverage**: Full Property Wizard flow (7 screenshots)
- ✅ **Real Property Data**: Uses actual Anna, TX property (1837 Walnut Way)
- ✅ **Strategy Testing**: Tests aggressive investor profile with Investment Decision Engine v2.1
- ✅ **Production Ready**: Suitable for CI/CD automation

---

## 🔍 Regression Test Objective

**Primary Goal**: Validate that Story 3.1 changes (RentCast MF Integration) have NOT broken existing SFR analysis functionality.

**Critical Flows to Validate**:
1. ✅ Investment Decision Engine v2.1 - BUY/NEGOTIATE/CAUTION/PASS verdicts
2. ✅ Property Wizard - 4-step guided flow
3. ✅ RentCast Auto-Population - SFR property data fetch
4. ✅ Financial Calculations - IRR, Cap Rate, Cash-on-Cash, DSCR
5. ✅ AI Enhancement - GPT-4o-mini insights generation
6. ✅ Deal Persistence - MongoDB save/load operations

---

## 📋 Story 3.1 Changes That Could Impact SFR

### Backend Changes
1. **RentCast Service** (`/backend/src/services/rentcastService.ts`)
   - Added 6 new MF methods (lines 788-1010)
   - Risk: Could affect existing SFR RentCast integration
   - Mitigation: Methods are separate, but share same service instance

2. **Cache Service** (`/backend/src/services/cacheService.ts`)
   - Added 3 new MF cache methods (lines 88-137)
   - Risk: Could affect SFR cache keys or TTL
   - Mitigation: Uses different key format (includes unit config)

3. **Market Data Routes** (`/backend/src/routes/marketDataRoutes.ts`)
   - Added new `/api/market-data/mf-unit-rents` endpoint with authentication
   - Risk: Could affect existing SFR endpoints
   - Mitigation: Separate endpoint, shares auth middleware

4. **TypeScript Interfaces** (`/backend/src/types/marketData.ts`)
   - Added 4 new MF interfaces (lines 547-607)
   - Risk: None - type definitions don't affect runtime
   - Mitigation: N/A

### Frontend Changes
5. **MF Rental Step** (`/frontend/src/components/MFAnalysis/MFRentalStep.tsx`)
   - Added auto-populate functionality
   - Risk: None - MF-specific component
   - Mitigation: N/A

---

## 🧪 Test Execution Plan

### Step 1: Environment Verification
- [x] Backend running on port 3001
- [x] Frontend running on port 3000
- [ ] Cypress 15.2.0 binary installed and verified
- [ ] MongoDB connection established
- [ ] Admin user credentials available

### Step 2: Gold Standard Test Execution
**Command**:
```bash
./node_modules/.bin/cypress run \
  --spec "cypress/e2e/anna-tx-aggressive-investor-test.cy.js" \
  --config video=false \
  --browser chrome
```

**Expected Duration**: ~68 seconds

**Expected Outcome**:
- ✅ Test passes (1 passing)
- ✅ 7 screenshots captured
- ✅ Investment verdict generated (BUY, NEGOTIATE, or CAUTION)
- ✅ Property Quality Score between 40-90/100
- ✅ Financial metrics calculated (Cap Rate, IRR, Cash Flow)

### Step 3: Validation Checkpoints

**Investment Decision Engine Validation**:
- [ ] Verdict generated (BUY, NEGOTIATE, CAUTION, or PASS)
- [ ] Property Quality Score in expected range
- [ ] Strategy-aware logic applied (Aggressive investor profile)
- [ ] Walk-away price calculation validated

**Property Wizard Flow Validation**:
- [ ] Step 1: Address auto-population works (RentCast integration)
- [ ] Step 2: Financing calculations correct
- [ ] Step 3: Rental analysis displays
- [ ] Step 4: Long-term assumptions applied
- [ ] Step 5: Investment strategy captured

**Financial Calculations Validation**:
- [ ] Monthly cash flow calculated
- [ ] Cap rate within realistic range (3-12%)
- [ ] IRR calculated for 10-year projection
- [ ] Cash-on-Cash Return calculated
- [ ] DSCR calculated (if applicable)

**Data Integrity Validation**:
- [ ] Property data persisted to MongoDB
- [ ] AI insights generated (GPT-4o-mini)
- [ ] Screenshots captured successfully
- [ ] No console errors in logs

---

## 🚨 Failure Scenarios & Debugging

### Scenario 1: Test Fails - RentCast Integration Broken
**Symptoms**: Address auto-population doesn't work in Step 1
**Root Cause**: MF methods broke SFR RentCast integration
**Debug Steps**:
1. Check backend logs for RentCast API errors
2. Verify `rentcastService.ts` SFR methods unchanged
3. Check cache service for key conflicts
4. Review API response format

**Rollback Plan**: Revert `rentcastService.ts` and `cacheService.ts` changes

### Scenario 2: Test Fails - Investment Decision Engine Broken
**Symptoms**: No verdict generated or incorrect verdict
**Root Cause**: Backend changes affected decision engine
**Debug Steps**:
1. Check `investmentDecisionEngine.ts` for modifications
2. Verify financial calculations unchanged
3. Review strategy adaptation logic
4. Check IRR scoring thresholds

**Rollback Plan**: Revert all backend service changes

### Scenario 3: Test Fails - Authentication Issues
**Symptoms**: 401 Unauthorized errors
**Root Cause**: New authenticate middleware broke existing endpoints
**Debug Steps**:
1. Check `marketDataRoutes.ts` for auth middleware changes
2. Verify JWT token generation
3. Review auth middleware application to SFR endpoints

**Rollback Plan**: Revert `marketDataRoutes.ts` authentication changes

### Scenario 4: Test Fails - Database Connection Issues
**Symptoms**: MongoDB connection errors
**Root Cause**: New schemas or models broke database
**Debug Steps**:
1. Check `Deal.ts` model for changes
2. Verify MongoDB connection string
3. Review schema validations

**Rollback Plan**: Revert model changes

---

## 📊 Test Results Template

### Execution Summary
- **Date**: [TO BE FILLED]
- **Duration**: [TO BE FILLED]
- **Status**: [PASS / FAIL]
- **Cypress Version**: 15.2.0
- **Node Version**: v23.11.0
- **Browser**: Chrome

### Test Outcome
```
Running:  anna-tx-aggressive-investor-test.cy.js
  Anna, TX Property - Aggressive Investor Validation
    ✓ should analyze same Anna, TX property with Aggressive Investor profile (68s)

  1 passing (68s)
```

### Extracted Test Data
**Property**: 1837 Walnut Way, Anna, TX 75409
**Purchase Price**: $245,000
**Investment Verdict**: [TO BE FILLED]
**Property Quality Score**: [TO BE FILLED] /100
**Cap Rate**: [TO BE FILLED]%
**Monthly Cash Flow**: $[TO BE FILLED]
**IRR**: [TO BE FILLED]%
**Cash-on-Cash Return**: [TO BE FILLED]%

### Screenshots Captured
1. ✓ Dashboard
2. ✓ Step 1 - Address & Details
3. ✓ Step 2 - Financing
4. ✓ Step 3 - Rental Analysis
5. ✓ Step 4 - Assumptions
6. ✓ Step 5 - Strategy
7. ✓ Final Results

### Backend Logs Analysis
- [ ] No errors in RentCast service
- [ ] No errors in Investment Decision Engine
- [ ] No errors in AI service
- [ ] No errors in database operations
- [ ] MongoDB queries executed successfully

### Regression Verdict
- [ ] **PASS**: SFR functionality unchanged, Story 3.1 safe to deploy
- [ ] **FAIL**: SFR functionality broken, Story 3.1 requires fixes

---

## ✅ QE Sign-Off Criteria

**Story 3.1 can be approved for production ONLY IF**:
1. ✅ Gold standard test passes (1 passing, 0 failing)
2. ✅ Investment Decision Engine generates valid verdict
3. ✅ Property Wizard completes all 5 steps
4. ✅ RentCast auto-population works for SFR
5. ✅ Financial calculations within expected ranges
6. ✅ No errors in backend logs
7. ✅ All 7 screenshots captured successfully

**If ANY criterion fails**:
- ❌ **Story 3.1 NOT approved for production**
- 🔧 **Remediation required before deployment**
- 📋 **Root cause analysis mandatory**

---

## 📝 Cypress Installation Status

**Current Issue**: Cypress 15.2.0 binary download in progress (59% complete as of last check)

**Node Version Compatibility Warning**:
- Current: Node v23.11.0
- Required: Node 20.x, 22.x, or 24.x
- Impact: Cypress may have compatibility issues

**Resolution**:
- Cypress installation will complete in ~95 seconds
- Once installed, gold standard test will be executed immediately
- Results will be documented in this plan

---

## 🎯 Next Steps (Post-Test)

### If Test PASSES ✅
1. Document test results in this file
2. Update `/docs/STORY_3.1_COMPLETION_SUMMARY.md` with QE sign-off
3. Mark Story 3.1 as **PRODUCTION READY**
4. Proceed with manual MF testing
5. Schedule Story 3.1 deployment

### If Test FAILS ❌
1. Document failure scenario and root cause
2. Create GitHub issue with detailed debugging info
3. Implement fix based on rollback plan
4. Re-run gold standard test
5. Repeat until test passes

---

**QE Engineer Notes**:
- Gold standard test is non-negotiable for quality assurance
- Backend API tests are NOT sufficient for regression validation
- E2E tests validate the complete user flow including frontend, backend, database, and external APIs
- Investment Decision Engine accuracy is business-critical and must be validated end-to-end

---

**Status**: ⏳ Awaiting Cypress installation completion
**Next Action**: Execute gold standard test once Cypress binary is ready
**Estimated Completion**: 2-3 minutes from installation finish
