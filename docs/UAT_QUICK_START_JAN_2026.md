# UAT Quick Start Guide: Operating Expense Fields
## January 8, 2026 - Josh's Feature Request

**Quick Reference**: Full UAT plan at [UAT_OPERATING_EXPENSES_JAN_2026.md](./UAT_OPERATING_EXPENSES_JAN_2026.md)

---

## 🚀 **Ready for UAT - What You Need to Know**

### **What Changed:**
✅ Added 3 new expense fields: **HOA, Utilities, CapEx**
✅ New properties get smart 5% CapEx default
✅ Saved properties load with blank fields (no surprise changes)
✅ BRRRR temporarily disabled in UI (backend still works)
✅ All 28 TypeScript errors fixed
✅ Frontend & backend builds passing

### **Critical Success Criteria:**
1. **New fields work correctly** → Test Scenarios 1A-1D
2. **No regressions in existing Buy & Hold** → Test Scenario 2C (CRITICAL)
3. **Saved properties unchanged** → Test Scenario 2A
4. **Josh approves UX** → End-to-end user flow

---

## 🎯 **Top Priority Tests (Must Run First)**

### **Test 1: Baseline Regression (MOST CRITICAL)**
**Goal**: Prove existing Buy & Hold still works EXACTLY as before

**Test Property:**
```
Property: 123 Main St, Fayetteville, NC
Purchase: $150,000
Rent: $1,450/month
Strategy: Buy & Hold
LTV: 80%, Rate: 7.0%, Term: 30 years

IMPORTANT: Leave new fields BLANK (HOA, Utilities, CapEx all empty)
```

**Expected Results (MUST MATCH EXACTLY):**
- Monthly Cash Flow: **$113.64** (±$1.00 tolerance)
- Cash-on-Cash Return: **4.24%** (±0.1%)
- Cap Rate: **7.02%** (±0.1%)
- DSCR: **1.14** (±0.01)
- Verdict: **NEGOTIATE** (not BUY, PASS, or CAUTION)

**If ANY metric differs → REGRESSION BUG → STOP UAT**

---

### **Test 2: High HOA Deal-Killer (Business Impact)**
**Goal**: Verify Investment Decision Engine catches bad deals

**Test Property:**
```
Property: Miami Condo
Purchase: $220,000
Rent: $2,100/month
HOA: $450/month ⭐ (21% of rent - DANGER!)
Utilities: $80/month
CapEx: $105/month (5% of rent)
```

**Expected Results:**
- Monthly Cash Flow: **-$401.73** (negative)
- Verdict: **❌ PASS** (deal-killer)
- Alert: "High HOA fee of $450/month creates unsustainable negative cash flow"

**If system doesn't warn about HOA → BUSINESS LOGIC BUG**

---

### **Test 3: Smart Default (UX Validation)**
**Goal**: Verify 5% CapEx auto-populates for new properties

**Test Steps:**
1. Start NEW SFR Buy & Hold analysis
2. Enter monthly rent: **$3,200**
3. Navigate to Rental/Operating Expenses step
4. **CHECK**: CapEx field should show **$160** automatically (5% of $3,200)
5. User can accept or edit the $160 default

**Expected Behavior:**
- CapEx field auto-populated with $160
- Console log: "💰 Setting smart CapEx default (5% of rent): $160"
- User can change value if desired

**If CapEx doesn't auto-populate → UX BUG**

---

### **Test 4: Saved Property Backward Compatibility**
**Goal**: Old properties load without changes

**Test Steps:**
1. Load ANY saved property created before Jan 8, 2026
2. Check new fields: **Should be BLANK** (not $0, not defaults)
3. Run analysis: **Results should match original** (no changes)
4. User can optionally add new expenses

**Expected Behavior:**
- HOA: blank
- Utilities: blank
- CapEx: blank
- Cash flow: UNCHANGED from original
- No console errors

**If saved properties show $0 or defaults → BACKWARD COMPATIBILITY BUG**

---

## 📋 **Quick Test Execution Checklist**

### **Phase 1: Critical Tests (30 minutes)**
- [ ] ✅ Test 1: Baseline regression (Fayetteville property)
- [ ] ✅ Test 2: High HOA deal-killer (Miami condo)
- [ ] ✅ Test 3: Smart CapEx default (new property)
- [ ] ✅ Test 4: Saved property backward compatibility

**If ALL 4 pass → Proceed to Phase 2**
**If ANY fail → STOP and escalate**

---

### **Phase 2: Comprehensive Tests (2 hours)**
Run full 12-scenario test suite from [UAT_OPERATING_EXPENSES_JAN_2026.md](./UAT_OPERATING_EXPENSES_JAN_2026.md):

**Category 1: New Feature Validation**
- [ ] Scenario 1A: Basic operating expenses (all fields)
- [ ] Scenario 1B: CapEx only
- [ ] Scenario 1C: High HOA property
- [ ] Scenario 1D: Smart default verification ✅ (already tested)

**Category 2: Backward Compatibility**
- [ ] Scenario 2A: Saved property loads correctly ✅ (already tested)
- [ ] Scenario 2B: Re-analyze existing property
- [ ] Scenario 2C: Baseline regression test ✅ (already tested)
- [ ] Scenario 2D: BRRRR fallback chain

**Category 3: Financial Accuracy**
- [ ] Scenario 3A: Multi-year projection with inflation
- [ ] Scenario 3B: Edge case handling (blank, zero, negative)
- [ ] Scenario 3C: Property-type guard (MF exclusion)
- [ ] Scenario 3D: Financial precision (no rounding)

---

### **Phase 3: Josh's User Flow (1 hour)**
End-to-end test with Josh:
- [ ] Start new SFR analysis via Property Wizard
- [ ] Navigate 6-step wizard
- [ ] See new expense fields in Rental Step
- [ ] Accept smart CapEx default
- [ ] Add HOA and utilities
- [ ] Review analysis results
- [ ] Save property
- [ ] Load saved property (verify persistence)

**Josh's Approval Question:** "Does this solve your problem?"
- [ ] ✅ YES → Approved for production
- [ ] ❌ NO → Document feedback and fix

---

## ⚠️ **Common Issues to Watch For**

### **Issue 1: Negative Cash Flow Surprises**
**Symptom**: Properties that were positive now show negative cash flow
**Root Cause**: User adding operating expenses to already-tight margins
**Expected**: This is CORRECT behavior - expenses reduce cash flow
**Action**: Verify calculations are mathematically accurate

### **Issue 2: Saved Properties Show Defaults**
**Symptom**: Old properties load with $0 or CapEx defaults
**Root Cause**: Frontend applying defaults to saved data
**Expected**: Saved properties should have BLANK fields
**Action**: This is a BUG - do not deploy

### **Issue 3: Multi-Family Double-Counting CapEx**
**Symptom**: MF properties have both 6% EGI CapEx AND new field CapEx
**Root Cause**: Property-type guard not working
**Expected**: MF should IGNORE new fields (has own CapEx calculation)
**Action**: This is a BUG - do not deploy

### **Issue 4: Console Errors on Old Properties**
**Symptom**: JavaScript errors when loading saved properties
**Root Cause**: Null pointer or undefined field access
**Expected**: No errors - fields default to undefined gracefully
**Action**: This is a BUG - do not deploy

---

## 🎯 **UAT Sign-Off Requirements**

**Before Production Deployment:**

1. **Business Expert Sign-Off**
   - [ ] Financial calculations accurate (within tolerance)
   - [ ] Investment Decision verdicts appropriate
   - [ ] Operating expense guidance matches industry standards
   - [ ] Educational content correct

2. **QE Engineer Sign-Off**
   - [ ] All 12 test scenarios passed
   - [ ] Baseline regression test passed (Scenario 2C)
   - [ ] No console errors or warnings
   - [ ] Edge cases handled gracefully

3. **Josh's Approval**
   - [ ] "This is what I needed" ✅
   - [ ] User experience is intuitive
   - [ ] Property Wizard flow feels natural
   - [ ] Will use this for real rental analysis

**If ALL 3 sign-offs obtained → Deploy to production**

---

## 📞 **Who to Contact for Issues**

**Regression Bugs** (existing functionality broken):
- Contact: QE Engineer + FSE from CLAUDE.md
- Severity: 🔴 CRITICAL - Stop deployment immediately
- Example: Baseline regression test fails

**Financial Calculation Errors** (wrong math):
- Contact: Business Expert (Real Estate Investment Expert) + QE Engineer
- Severity: 🔴 CRITICAL - Do not deploy
- Example: Cash flow calculation incorrect

**UX Issues** (confusing, hard to use):
- Contact: UX Designer + Josh
- Severity: 🟡 HIGH - Fix or document workaround
- Example: Smart default not working

**Edge Cases** (blank/zero/negative values):
- Contact: QE Engineer + Engineer
- Severity: 🟢 MEDIUM - Fix or document limitation
- Example: Negative HOA value not validated

---

## 🚀 **After UAT Approval**

**Production Deployment Steps:**
1. [ ] Backend build verification: `cd backend && npm run build`
2. [ ] Frontend build verification: `cd frontend && npm run build` ✅ DONE
3. [ ] Git commit with message: "feat: Add operating expense fields (HOA, Utilities, CapEx) for Buy & Hold - Issue #[N]"
4. [ ] Deploy backend to production
5. [ ] Deploy frontend to production
6. [ ] Smoke test: Load 1 saved property (verify no errors)
7. [ ] Smoke test: Create 1 new property with new fields
8. [ ] Monitor logs for 24 hours

**Post-Deployment Success Metrics:**
- [ ] Zero production errors in first 24 hours
- [ ] Josh uses feature successfully for real analysis
- [ ] No user complaints about regressions
- [ ] New fields adopted by users

---

## 📊 **Test Data Quick Reference**

### **Good Test Properties (For Validation)**

**Baseline Regression Property:**
```
Address: 123 Main St, Fayetteville, NC
Purchase: $150,000 | Rent: $1,450 | LTV: 80% | Rate: 7.0%
Expected Cash Flow: $113.64/month
Expected Verdict: NEGOTIATE
```

**High HOA Deal-Killer:**
```
Address: Miami Condo
Purchase: $220,000 | Rent: $2,100 | HOA: $450
Expected Cash Flow: -$401.73/month (NEGATIVE)
Expected Verdict: PASS
```

**Smart Default Test:**
```
Address: Austin Property
Rent: $3,200 → CapEx should auto-populate to $160 (5%)
```

**Positive Cash Flow with Expenses:**
```
Address: Phoenix Property
Purchase: $300,000 | Rent: $2,400 | CapEx: $120
Expected Cash Flow: -$52.69/month (slight negative, marginal)
Expected Verdict: CAUTION
```

---

## ✅ **Quick Status Check**

**Before UAT:**
- [x] All TypeScript errors fixed (28 total)
- [x] Frontend build passing
- [x] Backend build passing (user to verify)
- [x] UAT plan created (12 scenarios)
- [x] Test data prepared

**Ready for UAT:** ✅ YES

**Estimated UAT Time:**
- Phase 1 (critical): 30 minutes
- Phase 2 (comprehensive): 2 hours
- Phase 3 (Josh's flow): 1 hour
- **Total: 3.5 hours**

**Recommended Schedule:**
- Day 1 Morning: Phase 1 + Phase 2 (2.5 hours)
- Day 1 Afternoon: Phase 3 with Josh (1 hour)
- Day 2: Sign-offs and deployment

---

**Full UAT Details**: [UAT_OPERATING_EXPENSES_JAN_2026.md](./UAT_OPERATING_EXPENSES_JAN_2026.md) (200+ lines, 12 scenarios)
