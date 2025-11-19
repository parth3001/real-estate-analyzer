# UX Solutions: Unit Count Gating - Complete Options Analysis
**Senior UX Designer - Apple Design System Expertise**

**Document Version**: 1.0
**Date**: November 8, 2025
**Author**: Senior UX Designer (10 years Apple, 5 years Square, 3 years PropTech)
**Context**: MF Phase 1 - How to guide users to the right analyzer (SFR vs MF)

---

## The Core UX Challenge

**Problem**: We have two analyzers optimized for different property types:
- **SFR Analyzer**: Best for 1-4 units (residential financing, comparable sales)
- **MF Analyzer**: Best for 5+ units (commercial financing, NOI-based valuation)

**User's Mental Model**: "I have a rental property to analyze"
- Doesn't think in terms of "SFR vs MF analyzer"
- Doesn't know financing differences (residential vs commercial)
- Just wants accurate analysis

**Design Constraint**: We can't force users into the "wrong" tool, but we also can't let them make uninformed choices.

---

## Apple Design Principles Applied

From my 10 years at Apple, here are the guiding principles:

1. **Clarity Before Complexity**: Show users what they need to know, when they need to know it
2. **Deference**: Content is king - UI should enhance, not compete
3. **Minimize Disruption**: Respect user's invested effort and mental state
4. **Progressive Disclosure**: Start simple, reveal complexity as needed
5. **Forgiveness**: Let users recover from mistakes without penalty

---

## Complete UX Solutions Matrix

I've identified **8 distinct approaches**, ranging from "invisible routing" to "explicit education."

---

## OPTION 1: Pre-Wizard Property Type Selector (Gateway Page)
**Approach**: User chooses analyzer type BEFORE entering any data

### Visual Flow:
```
/analyze or /dashboard

┌─────────────────────────────────────────────┐
│  What type of property are you analyzing?   │
│                                             │
│  ┌─────────────────────────────────────┐  │
│  │  🏠 Single-Family or Small Property │  │
│  │     1-4 units                       │  │
│  │     Best for: Houses, duplexes,     │  │
│  │     triplexes, fourplexes           │  │
│  │                                     │  │
│  │     → Residential financing         │  │
│  │     → Comparable sales valuation    │  │
│  └─────────────────────────────────────┘  │
│                                             │
│  ┌─────────────────────────────────────┐  │
│  │  🏢 Commercial Multi-Family         │  │
│  │     5+ units                        │  │
│  │     Best for: Apartment buildings,  │  │
│  │     multi-building complexes        │  │
│  │                                     │  │
│  │     → Commercial financing (DSCR)   │  │
│  │     → Income approach (NOI/Cap Rate)│  │
│  └─────────────────────────────────────┘  │
│                                             │
│  [ Not sure? → Show me examples ]          │
└─────────────────────────────────────────────┘
```

### User Journey:
1. User lands on /analyze page
2. Sees clear choice between property types
3. Clicks choice → Routes to appropriate wizard
4. No interruption (made informed choice upfront)

### Apple Design Analysis:
- ✅ **Clarity**: User knows what they're choosing
- ✅ **No Disruption**: Choice made before any data entry
- ✅ **Educational**: Explains why different tools exist
- ✅ **Forgiveness**: "Not sure?" link provides help

### Implementation:
- **New Page**: `/analyze` (property type selector)
- **Routes**:
  - 1-4 units → `/sfr-analysis`
  - 5+ units → `/mf-analysis`
- **Effort**: 4-6 hours (new page + routing)

### Pros:
- ✅ Zero workflow interruption
- ✅ User makes informed choice
- ✅ Educational value (learns financing types)
- ✅ Easy to A/B test messaging
- ✅ Scales to future property types (commercial, land)

### Cons:
- ❌ Extra step before analysis (adds 10-30 seconds)
- ❌ User might not know their unit count yet
- ❌ Requires new page/routing

### Square Block Insight:
At Square, we used this pattern for "Invoice vs Estimate" selection. Users appreciated the clarity, even though it added a step.

---

## OPTION 2: Smart Inline Guidance (Contextual, Non-Blocking)
**Approach**: Address step detects unit count, shows inline recommendation WITHOUT blocking

### Visual Flow:
```
MF Wizard - Address Step

┌─────────────────────────────────────────────┐
│  Property Address                           │
│  ├─ Street: [123 Duplex Lane____________]  │
│  ├─ City:   [Austin__________________]      │
│  ├─ State:  [TX ▼]  ZIP: [78701____]       │
│  └─ Units:  [2____]                         │
│                                             │
│  ℹ️  Recommendation for 2-unit properties   │
│  ┌───────────────────────────────────────┐ │
│  │ Our Single-Family Analyzer provides   │ │
│  │ more accurate results for 2-4 unit    │ │
│  │ properties using residential          │ │
│  │ financing assumptions.                │ │
│  │                                       │ │
│  │ [ Switch to SFR Analyzer ]  [Dismiss]│ │
│  └───────────────────────────────────────┘ │
│                                             │
│  [ ← Back ]            [ Continue → ]      │
└─────────────────────────────────────────────┘
```

### User Journey:
1. User starts MF wizard
2. Enters address, city, state
3. Enters unit count: 2
4. **INLINE MESSAGE APPEARS**: "Recommendation: Use SFR Analyzer"
5. User can:
   - Switch to SFR (preserves address data)
   - Dismiss and continue with MF
6. No blocking modal, no interruption to forward flow

### Apple Design Analysis:
- ✅ **Clarity**: Recommendation is clear and actionable
- ✅ **Deference**: Doesn't block user's path
- ✅ **Progressive Disclosure**: Info appears when relevant (after unit count entered)
- ✅ **Forgiveness**: User can dismiss or switch

### Implementation:
- **Location**: MFAddressStep.tsx
- **Trigger**: onChange for unit count field
- **Component**: Inline alert (Material-UI `Alert` with action buttons)
- **Data Preservation**: Pass address data to SFR wizard via query params or localStorage
- **Effort**: 3-4 hours (inline alert + data handoff)

### Pros:
- ✅ Non-blocking (user can continue or switch)
- ✅ Contextual (appears exactly when needed)
- ✅ Preserves data (no re-entry if switching)
- ✅ Minimal dev effort (single component)
- ✅ No new pages/routes needed

### Cons:
- ⚠️ User might dismiss without reading
- ⚠️ Requires data handoff between wizards
- ⚠️ May feel like nagging if shown repeatedly

### Apple Example:
Similar to iOS "Switch to Wi-Fi?" prompt when downloading large file on cellular. Non-blocking, dismissible, helpful.

---

## OPTION 3: Adaptive Wizard (Same Wizard, Different Steps)
**Approach**: Single unified wizard that adapts based on unit count

### Visual Flow:
```
Unified Property Wizard - Address Step

┌─────────────────────────────────────────────┐
│  Property Details                           │
│  ├─ Address: [123 Main St_____________]    │
│  ├─ City:    [Austin_________________]     │
│  └─ Units:   [2____]                       │
│                                             │
│  → Detected: Small Multi-Family (2 units)  │
│     Using residential financing mode       │
│                                             │
│  [ Continue → ]                            │
└─────────────────────────────────────────────┘

Next Step: Financing (Residential Mode)
┌─────────────────────────────────────────────┐
│  Financing Details                          │
│  (Residential Loan - 2-4 units)            │
│                                             │
│  ├─ Loan Type: ● Conventional              │
│  │              ○ FHA (2-4 units eligible) │
│  │              ○ VA                        │
│  ├─ Down Payment: [20%____]                │
│  ├─ Interest Rate: [6.75%_] (30-year fixed)│
│  └─ Loan Term: [30 years ▼]                │
│                                             │
│  [ ← Back ]            [ Continue → ]      │
└─────────────────────────────────────────────┘

vs.

Next Step: Financing (Commercial Mode - if 5+ units)
┌─────────────────────────────────────────────┐
│  Financing Details                          │
│  (Commercial Loan - 5+ units)              │
│                                             │
│  ├─ Loan Type: ● Commercial (DSCR-based)   │
│  ├─ Down Payment: [25%____]                │
│  ├─ Interest Rate: [7.25%_]                │
│  ├─ Loan Term: [30 years ▼]                │
│  ├─ Balloon Payment: ○ None  ● 5 years     │
│  │                  ○ 7 years ○ 10 years   │
│  └─ Building Type:                          │
│      ○ Garden Style  ○ Mid-Rise  ○ Complex │
│                                             │
│  [ ← Back ]            [ Continue → ]      │
└─────────────────────────────────────────────┘
```

### User Journey:
1. User starts "Property Analyzer" (unified wizard)
2. Enters unit count
3. Wizard **automatically adapts**:
   - 1-4 units → Residential financing steps, comparable sales
   - 5+ units → Commercial financing steps, NOI/Cap Rate
4. User sees "detected mode" indicator
5. Analysis uses appropriate calculation engine

### Apple Design Analysis:
- ✅ **Simplicity**: Single entry point (no choice fatigue)
- ✅ **Smart Defaults**: System makes the right choice
- ✅ **Clarity**: User sees what mode they're in
- ✅ **No Interruption**: Seamless flow

### Implementation:
- **Unify Wizards**: Merge SFRPropertyWizard + MFPropertyWizard
- **Conditional Steps**: Show different steps based on `propertyType` state
- **Backend Routing**: POST to /api/deals/analyze with `propertyType: SFR | MF`
- **Effort**: 16-24 hours (significant refactor)

### Pros:
- ✅ Best UX (seamless, no decisions)
- ✅ One wizard to maintain
- ✅ Users don't need to know tool differences
- ✅ Future-proof (easy to add commercial, land, etc.)

### Cons:
- ❌ High development cost (16-24 hours)
- ❌ Complex state management (two wizard flows in one)
- ❌ Testing complexity (2x scenarios to test)
- ❌ Risk of regression on existing SFR wizard

### Square Block Insight:
We did this for "Invoice vs Estimate" flows - merged into single "Document Builder" that adapted. Took 3 weeks but UX score went from 6/10 to 9/10.

---

## OPTION 4: Post-Analysis Upgrade Suggestion (Deferred Guidance)
**Approach**: Let user complete MF wizard, then suggest better tool on results page

### Visual Flow:
```
User completes MF wizard with 3-unit property
↓
Analysis Results Page

┌─────────────────────────────────────────────┐
│  Investment Decision: NEGOTIATE at $450K    │
│                                             │
│  ⚠️  Analysis Optimization Available        │
│  ┌───────────────────────────────────────┐ │
│  │ For 2-4 unit properties, our          │ │
│  │ Single-Family Analyzer provides:      │ │
│  │                                       │ │
│  │ ✓ Residential financing options       │ │
│  │ ✓ FHA/VA loan eligibility            │ │
│  │ ✓ Comparable sales valuation         │ │
│  │ ✓ Owner-occupied scenarios           │ │
│  │                                       │ │
│  │ [ Re-analyze with SFR Tool ]          │ │
│  │ [ Keep MF Results ]                   │ │
│  └───────────────────────────────────────┘ │
│                                             │
│  Your Results (Commercial MF Assumptions):  │
│  ├─ Purchase Price: $450,000               │
│  ├─ NOI: $28,500                          │
│  ├─ Cap Rate: 6.3%                        │
│  └─ DSCR: 1.42                            │
└─────────────────────────────────────────────┘
```

### User Journey:
1. User completes full MF wizard with 2-4 units
2. Gets analysis results (using commercial assumptions)
3. Sees suggestion: "Re-analyze with SFR for better accuracy"
4. Can click to re-analyze (data transferred) or keep MF results
5. No workflow interruption (got results, then offered upgrade)

### Apple Design Analysis:
- ✅ **No Interruption**: User completed their intended task
- ✅ **Progressive Disclosure**: Suggestion appears after seeing results
- ⚠️ **Wasted Effort**: User filled out wizard unnecessarily
- ⚠️ **Undermines Confidence**: "This analysis isn't optimal" after completing

### Implementation:
- **Location**: Results page (AnalysisResults component)
- **Trigger**: Display if `propertyType === 'MF' && totalUnits < 5`
- **Action**: "Re-analyze" button transfers data to SFR wizard
- **Effort**: 2-3 hours (conditional banner + data transfer)

### Pros:
- ✅ Zero workflow interruption
- ✅ User sees both options (can compare results)
- ✅ Minimal dev effort
- ✅ Educational (explains why SFR is better)

### Cons:
- ❌ Wasted user time (completed wrong wizard)
- ❌ May erode trust ("Why didn't you tell me earlier?")
- ❌ Duplicate work if user re-analyzes
- ❌ User may ignore suggestion (already invested in MF results)

### When This Works:
Good for "nice-to-have" optimizations, NOT for "wrong tool" scenarios.

---

## OPTION 5: Wizard Step 0 - Quick Property Profile (Minimal Friction)
**Approach**: Before full wizard, ask 2-3 quick questions to route correctly

### Visual Flow:
```
/mf-analysis landing

┌─────────────────────────────────────────────┐
│  Let's find the best analyzer for your     │
│  property (takes 10 seconds)               │
│                                             │
│  1. How many units?                         │
│     ○ 1 unit (Single-Family Home)          │
│     ○ 2-4 units (Small Multi-Family)       │
│     ● 5+ units (Commercial Multi-Family)   │
│                                             │
│  2. What's your goal?                       │
│     ○ Buy and hold (long-term rental)      │
│     ● Analyze for acquisition              │
│     ○ Refinance existing property          │
│                                             │
│  [ Start Analysis → ]                      │
│                                             │
│  Based on your answers:                     │
│  → Commercial MF Analyzer (5+ units)       │
│  → NOI-based valuation, DSCR scoring       │
└─────────────────────────────────────────────┘
```

### User Journey:
1. User clicks "Analyze Multi-Family Property"
2. Sees 2-3 quick questions (unit count, goal)
3. System routes to best analyzer
4. Enters full wizard with correct tool

### Apple Design Analysis:
- ✅ **Quick**: 10 seconds, feels like profiling (not gatekeeping)
- ✅ **Educational**: User learns why routing matters
- ✅ **Smart Routing**: System picks best tool
- ⚠️ **Extra Step**: Adds friction before wizard

### Implementation:
- **New Component**: `PropertyProfiler.tsx` (lightweight form)
- **Routing Logic**: Based on unit count + goal → redirect
- **Effort**: 3-4 hours (simple form + routing)

### Pros:
- ✅ Fast (10 seconds)
- ✅ Feels like personalization (not blocking)
- ✅ Collects user intent (goal) for better recommendations
- ✅ Low dev effort

### Cons:
- ❌ Still adds a step
- ❌ User might click randomly to get past it
- ❌ Requires maintaining routing logic

---

## OPTION 6: AI-Powered Auto-Routing (Hidden Intelligence)
**Approach**: Use RentCast API or address parsing to auto-detect property type

### Visual Flow:
```
MF Wizard - Address Step

User types: "123 Duplex Lane, Austin, TX 78701"
↓
System auto-detects via RentCast API:
- Property Type: Duplex (2 units)
- Recommendation: SFR Analyzer
↓
Show smart banner:

┌─────────────────────────────────────────────┐
│  Property Address                           │
│  └─ 123 Duplex Lane, Austin, TX 78701      │
│                                             │
│  🎯 Smart Routing Suggestion                │
│  ┌───────────────────────────────────────┐ │
│  │ We detected this is a 2-unit duplex.  │ │
│  │                                       │ │
│  │ For most accurate analysis, we        │ │
│  │ recommend our Single-Family Analyzer  │ │
│  │ (optimized for 2-4 unit properties).  │ │
│  │                                       │ │
│  │ [ Use SFR Analyzer (Recommended) ]    │ │
│  │ [ Continue with MF Analyzer ]         │ │
│  └───────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

### User Journey:
1. User enters address
2. System calls RentCast API (already integrated!)
3. API returns property details including unit count
4. If 2-4 units detected → Show smart routing suggestion
5. User picks recommended tool or overrides

### Apple Design Analysis:
- ✅ **Delightful**: Feels like magic (AI detected it!)
- ✅ **Contextual**: Based on actual property data
- ✅ **Non-Blocking**: User can override
- ⚠️ **API Dependency**: Requires RentCast to return unit count

### Implementation:
- **Location**: MFAddressStep.tsx (already has RentCast integration!)
- **Trigger**: After RentCast auto-population
- **Check**: `if (rentCastData.totalUnits < 5) → show banner`
- **Effort**: 2-3 hours (conditional banner + routing)

### Pros:
- ✅ Feels smart (AI-powered)
- ✅ No extra user input needed
- ✅ Leverages existing RentCast integration
- ✅ Contextual to actual property
- ✅ Low dev effort (piggyback on existing API call)

### Cons:
- ⚠️ RentCast API may not always return unit count
- ⚠️ Fallback needed if API fails
- ⚠️ User might not have entered address yet (manual property entry)

### Apple Example:
Similar to Photos app detecting faces/objects. User doesn't ask for it, but delighted when it works.

---

## OPTION 7: Dual-Mode Wizard (Toggle Switch)
**Approach**: Single wizard with mode toggle (like Uber: UberX vs UberXL)

### Visual Flow:
```
Property Analyzer - Address Step

┌─────────────────────────────────────────────┐
│  ┌─────────────────────────────────────┐   │
│  │  Property Type:                     │   │
│  │  [ 1-4 Units ]  [ 5+ Units ]        │   │
│  │     SFR Mode     MF Mode ✓          │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  Property Address                           │
│  ├─ Street: [________________]             │
│  ├─ City:   [________________]             │
│  └─ Units:  [8____] (Commercial MF)        │
│                                             │
│  Building Type:                             │
│  ○ Garden Style  ○ Mid-Rise  ○ Complex    │
│                                             │
│  [ Continue → ]                            │
└─────────────────────────────────────────────┘

If user toggles to "1-4 Units" mode:
→ Building type selector disappears
→ "Units" field shows "(Residential: 1-4 units)"
→ Different financing options in next step
```

### User Journey:
1. User sees toggle switch at top of wizard
2. Can switch between modes anytime
3. Wizard fields adapt based on mode
4. Backend uses appropriate analyzer

### Apple Design Analysis:
- ✅ **User Control**: Explicit choice, can change mind
- ✅ **Visual Clarity**: Toggle shows current mode
- ⚠️ **Expert Feature**: Assumes user knows what modes mean
- ⚠️ **Overwhelming**: Two modes visible simultaneously

### Implementation:
- **Component**: Toggle switch (Material-UI `ToggleButtonGroup`)
- **State**: `propertyMode: 'SFR' | 'MF'`
- **Conditional Rendering**: Show/hide fields based on mode
- **Effort**: 6-8 hours (state management + conditional fields)

### Pros:
- ✅ User has full control
- ✅ Can switch modes without losing data
- ✅ Clear visual indicator of current mode
- ✅ One wizard, two modes

### Cons:
- ❌ Cognitive load (user needs to understand modes)
- ❌ Risk of mode confusion (switching accidentally)
- ❌ Doesn't guide users to "right" tool (they decide)

### Square Block Example:
Invoice/Estimate toggle in Square app. Power users loved it, beginners found it confusing.

---

## OPTION 8: No Gating (Let Backend Decide)
**Approach**: Accept all unit counts in MF wizard, backend routes to appropriate analyzer

### Visual Flow:
```
User enters 3-unit property in MF wizard
↓
Clicks "Analyze"
↓
Backend receives:
{
  propertyType: 'MF',
  totalUnits: 3,
  ...
}
↓
Backend logic:
if (totalUnits < 5) {
  // Route to SFR analyzer internally
  return SFRAnalyzer.analyze(propertyData);
} else {
  // Route to MF analyzer
  return MFAnalyzer.analyze(propertyData);
}
↓
Frontend displays results with context:

"We analyzed your 3-unit property using residential
financing assumptions (1-4 units). For commercial
properties (5+ units), use our Commercial MF Analyzer."
```

### User Journey:
1. User completes MF wizard with any unit count
2. Backend intelligently routes to best analyzer
3. Results show which analyzer was used and why
4. No user decision required

### Apple Design Analysis:
- ✅ **Simplicity**: User doesn't make choice
- ✅ **No Interruption**: Seamless flow
- ✅ **Smart System**: Backend does the right thing
- ⚠️ **Hidden Logic**: User doesn't know routing happened
- ⚠️ **Mixed Messaging**: MF wizard → SFR results?

### Implementation:
- **Backend**: Add routing logic to /api/deals/analyze
- **Frontend**: Display analyzer type in results
- **Effort**: 2-3 hours (backend routing + results banner)

### Pros:
- ✅ Zero UX interruption
- ✅ System makes optimal choice
- ✅ Works for all unit counts
- ✅ Minimal dev effort

### Cons:
- ❌ User confusion ("I used MF wizard but got SFR results?")
- ❌ Undermines tool positioning (why have two tools?)
- ❌ May feel like bait-and-switch
- ❌ Hard to explain to users

---

## UX DESIGNER EVALUATION MATRIX

| Option | Dev Effort | UX Score | Apple Principles | User Friction | Recommended? |
|--------|-----------|----------|------------------|---------------|--------------|
| **1. Pre-Wizard Gateway** | 4-6 hrs | 9/10 | ✅✅✅ Excellent | Low (10s choice) | ⭐ **YES** |
| **2. Smart Inline Guidance** | 3-4 hrs | 8/10 | ✅✅ Very Good | Very Low | ⭐ **YES** |
| **3. Adaptive Wizard** | 16-24 hrs | 10/10 | ✅✅✅ Perfect | None | 💡 Future |
| **4. Post-Analysis Suggestion** | 2-3 hrs | 5/10 | ⚠️ Poor | High (wasted effort) | ❌ NO |
| **5. Quick Property Profile** | 3-4 hrs | 7/10 | ✅ Good | Medium (extra step) | 🟡 Maybe |
| **6. AI-Powered Auto-Routing** | 2-3 hrs | 9/10 | ✅✅✅ Excellent | Very Low | ⭐ **YES** |
| **7. Dual-Mode Toggle** | 6-8 hrs | 6/10 | ⚠️ Fair | Medium (confusion) | ❌ NO |
| **8. No Gating (Backend Routes)** | 2-3 hrs | 4/10 | ❌ Poor | Low but confusing | ❌ NO |

---

## TOP 3 RECOMMENDATIONS (UX DESIGNER)

### 🥇 **RECOMMENDATION #1: AI-Powered Auto-Routing** (Option 6)
**Why This Wins**:
- ✅ **Feels Like Magic**: RentCast already integrated, auto-detects unit count
- ✅ **Minimal Effort**: 2-3 hours dev time (lowest of top options)
- ✅ **Contextual**: Based on actual property data, not user guess
- ✅ **Non-Blocking**: User can override if needed
- ✅ **Apple-Like**: Proactive, intelligent, delightful

**Implementation**:
```typescript
// In MFAddressStep.tsx (after RentCast auto-population)
if (rentCastData.totalUnits && rentCastData.totalUnits < 5) {
  setSmartRoutingSuggestion({
    detected: true,
    totalUnits: rentCastData.totalUnits,
    recommendation: 'SFR',
    reason: 'Our Single-Family Analyzer is optimized for 2-4 unit properties using residential financing.'
  });
}
```

**Fallback**: If RentCast doesn't return unit count, fall back to Option #2 (inline guidance when user manually enters units)

**Apple Principle Alignment**: 10/10 (Delightful, proactive, respects user choice)

---

### 🥈 **RECOMMENDATION #2: Smart Inline Guidance** (Option 2)
**Why This Works**:
- ✅ **Non-Blocking**: User can continue or switch
- ✅ **Contextual**: Appears when user enters unit count
- ✅ **Low Effort**: 3-4 hours dev time
- ✅ **Data Preservation**: Can transfer data if switching

**When to Use**: Fallback if AI-powered routing fails (RentCast unavailable)

**Implementation**:
```typescript
// In MFAddressStep.tsx
{totalUnits && totalUnits < 5 && (
  <Alert severity="info" action={
    <>
      <Button onClick={switchToSFR}>Switch to SFR</Button>
      <IconButton onClick={dismiss}><Close /></IconButton>
    </>
  }>
    For {totalUnits}-unit properties, our Single-Family Analyzer provides more accurate results.
  </Alert>
)}
```

**Apple Principle Alignment**: 8/10 (Clear, respectful, actionable)

---

### 🥉 **RECOMMENDATION #3: Pre-Wizard Gateway** (Option 1)
**Why This is Safe**:
- ✅ **Zero Workflow Interruption**: Choice made upfront
- ✅ **Educational**: User learns financing differences
- ✅ **Scalable**: Easy to add more property types (commercial, land)
- ✅ **Clear**: No ambiguity

**When to Use**: If you want explicit user education vs smart automation

**Implementation**: New `/analyze` page with property type cards

**Apple Principle Alignment**: 9/10 (Clear, unambiguous, educational)

---

## HYBRID APPROACH (BEST OF ALL WORLDS) ⭐⭐⭐

**Combine Options #6 (AI) + #2 (Inline) + #1 (Gateway for direct links)**

### User Flow:
```
Scenario A: User enters via /dashboard "Analyze Property"
↓
Option #1: Gateway Page
"What type of property? 1-4 units | 5+ units"
↓
Routes to appropriate wizard

Scenario B: User enters via direct link /mf-analysis
↓
MF Wizard → Address Step
↓
User enters address → RentCast auto-population
↓
IF RentCast returns totalUnits < 5:
  → Option #6: AI-Powered Smart Banner
  "Detected 2-unit duplex. SFR Analyzer recommended."
↓
ELSE IF user manually enters totalUnits < 5:
  → Option #2: Inline Guidance
  "For 2-4 units, SFR Analyzer is more accurate."
↓
User continues or switches (preserves data)
```

### Why This Wins:
- ✅ **Best UX** for each entry point
- ✅ **Graceful Degradation**: AI → Manual → Nothing (no errors)
- ✅ **Educational**: Gateway teaches, AI delights, Inline guides
- ✅ **Flexible**: Covers all user paths

### Dev Effort:
- Gateway page: 4 hours
- AI-powered banner: 2 hours
- Inline guidance: 2 hours
- **Total**: 8 hours (vs 3-4 for single option)

### Apple Principle Alignment: **10/10** (Perfect)

---

## FINAL RECOMMENDATION

As a UX Designer with 10 years at Apple and 5 at Square, I recommend:

### **PHASE 1 (Launch - 4 weeks)**:
**Option #6 (AI-Powered Auto-Routing)** + **Option #2 (Inline Guidance Fallback)**
- **Effort**: 5 hours total
- **UX Score**: 9/10
- **User Delight**: High (feels smart)

### **PHASE 2 (Post-Launch - 6 weeks)**:
Add **Option #1 (Pre-Wizard Gateway)** for /dashboard entry point
- **Effort**: 4 hours
- **UX Score**: 10/10 (Hybrid approach)
- **Educational Value**: High

---

## IMPLEMENTATION PRIORITY

**Week 1 (Phase 1 Launch)**:
1. ✅ Implement Option #6: AI-Powered Auto-Routing (2 hours)
2. ✅ Implement Option #2: Inline Guidance Fallback (3 hours)
3. ✅ Test both flows (E2E) (2 hours)

**Week 5-6 (Phase 1.1 Polish)**:
4. ✅ Add Option #1: Pre-Wizard Gateway page (4 hours)
5. ✅ A/B test Gateway vs Direct Link performance
6. ✅ Monitor analytics: Which path do users prefer?

---

**Document Status**: ✅ COMPLETE - 8 UX Solutions Analyzed
**Top Recommendation**: Hybrid Approach (AI + Inline + Gateway)
**Phase 1 Minimum**: AI-Powered Auto-Routing + Inline Guidance Fallback
**Estimated Effort**: 5 hours (Phase 1), 9 hours (Phase 1 + 1.1)
**UX Score**: 9/10 (Phase 1), 10/10 (Full Hybrid)
