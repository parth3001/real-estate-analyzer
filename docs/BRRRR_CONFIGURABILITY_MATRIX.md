# BRRRR Input Configurability Matrix
**Quick Reference: What's a Smart Default vs User Input**

**Date**: December 16, 2025
**Purpose**: Clarify which BRRRR fields are configurable by users vs system defaults
**Context**: Response to "Seasoning period can be configurable, isn't it?"

---

## 🎯 **Answer: YES - Almost Everything is User Configurable**

### **Design Philosophy**:
- ✅ **Smart Defaults**: Pre-filled with industry standards (reduce cognitive load)
- ✅ **User Override**: Every field can be customized (power user control)
- ✅ **Progressive Disclosure**: Advanced fields hidden by default (Josh's feedback)

---

## 📊 **BRRRR Field Configurability Matrix**

### **Category 1: Always Visible, Always Editable**

| Field | Smart Default | User Can Edit? | Validation Range |
|-------|---------------|----------------|------------------|
| **Purchase Price** | None (user must enter) | ✅ YES | $1 - $10M |
| **Rehab Budget** | Based on scope (10-50%) | ✅ YES | $0 - $1M |
| **Rehab Scope** | "Moderate" | ✅ YES (dropdown) | Cosmetic/Moderate/Major/Gut |
| **After Repair Value (ARV)** | None (user must enter) | ✅ YES | Must be > Purchase Price |
| **Refinance LTV** | 75% | ✅ YES | 65-80% |
| **Seasoning Period** | **12 months** | ✅ **YES (dropdown)** | 6, 9, 12, 18, 24 months |

---

### **Category 2: Hidden by Default, Editable if User Expands**

| Field | Smart Default | User Can Edit? | Where Hidden? |
|-------|---------------|----------------|---------------|
| **Rehab Timeline** | Based on scope (1-6 mo) | ✅ YES | "Advanced Rehab Details" accordion |
| **Contingency %** | 15% | ✅ YES | "Advanced Rehab Details" accordion |
| **Contractor Experience** | "Experienced" | ✅ YES | "Advanced Rehab Details" accordion |
| **Refinance Interest Rate** | Current FRED rate (7.0%) | ✅ YES | "Advanced Refinance Options" |
| **Refinance Closing Costs** | 2.5% of loan | ✅ YES | "Advanced Refinance Options" |
| **Refinance Loan Term** | 360 months (30 yrs) | ✅ YES | "Advanced Refinance Options" |

---

### **Category 3: Calculated, Not Editable**

| Field | How Calculated | User Can Edit? |
|-------|----------------|----------------|
| **Capital Recovered** | Refi proceeds - mortgage balance | ❌ NO (calculated) |
| **Capital Remaining** | Total investment - capital recovered | ❌ NO (calculated) |
| **Capital Recovery Rate** | (Recovered / Total) × 100 | ❌ NO (calculated) |
| **Infinite Return Status** | Capital recovery ≥ 100% | ❌ NO (calculated) |
| **Post-Refi Cash Flow** | Rent - new mortgage - opex | ❌ NO (calculated) |
| **Effective CoC Return** | Annual CF / capital remaining | ❌ NO (calculated) |

---

## 🔧 **Seasoning Period: Detailed Configurability**

### **Your Question**: "Seasoning period can be configurable, isn't it?"

**Answer**: ✅ **YES - FULLY CONFIGURABLE**

### **UX Design for Seasoning Period Input**:

```tsx
<Box sx={{ mb: 3 }}>
  <Typography variant="body2" color="text.secondary" gutterBottom>
    Seasoning Period
  </Typography>

  <Select
    value={seasoningPeriod}
    onChange={(e) => setSeasoningPeriod(Number(e.target.value))}
    fullWidth
  >
    <MenuItem value={6}>
      6 months (DSCR lenders only)
    </MenuItem>
    <MenuItem value={9}>
      9 months (Some DSCR lenders)
    </MenuItem>
    <MenuItem value={12}>
      12 months (Fannie Mae requirement) ⭐ RECOMMENDED
    </MenuItem>
    <MenuItem value={18}>
      18 months (Very conservative)
    </MenuItem>
    <MenuItem value={24}>
      24 months (Delayed refinance strategy)
    </MenuItem>
  </Select>

  {seasoningPeriod < 12 && (
    <Alert severity="warning" sx={{ mt: 1 }}>
      ⚠️ Fannie Mae requires 12-month seasoning (as of April 2023).
      6-9 months only works with DSCR lenders. Higher rates may apply.
    </Alert>
  )}

  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
    Time required before refinancing. Fannie Mae: 12 months minimum.
    DSCR lenders: 6 months typical (higher rates).
  </Typography>
</Box>
```

---

### **Why Default to 12 Months (Not 6)**:

#### **Before Industry Validation**:
- Our planning doc: 6 months default
- Rationale: "Typical BRRRR timeline"

#### **After Industry Validation** (from BRRRR_INDUSTRY_VALIDATION.md):
- ✅ **Fannie Mae changed rules April 2023**: 12-month minimum
- ✅ **DSCR lenders**: Still allow 6 months (but higher interest rates)
- ✅ **Conservative approach**: Default to 12 months protects beginners

#### **User Can Still Select 6 Months**:
- Dropdown shows all options: 6, 9, 12, 18, 24 months
- Warning shows if user picks <12 months
- System calculates correctly for ANY seasoning period selected

---

## 🎨 **Progressive Disclosure Strategy**

### **Step 1: Minimal Input (Novice-Friendly)**
```
Required Fields (Always Visible):
✅ Purchase Price
✅ Rehab Budget
✅ Rehab Scope (dropdown)
✅ After Repair Value
✅ Refinance LTV (75% default shown)
✅ Seasoning Period (12 months default shown)

User clicks "Analyze" → Gets full BRRRR analysis
```

### **Step 2: Power User Customization (Hidden by Default)**
```
[⚙️ Advanced Refinance Options] ← Expandable accordion
├─ Refinance Interest Rate (7.0% default)
├─ Refinance Loan Term (360 months default)
├─ Refinance Closing Costs (2.5% default)
└─ Minimum DSCR Requirement (1.25 default)

[🛠️ Advanced Rehab Details] ← Expandable accordion
├─ Rehab Timeline (2 months default for "Moderate")
├─ Contingency Percentage (15% default)
├─ Contractor Experience (dropdown)
└─ Rehab Budget Breakdown (kitchen, bath, etc.)

[📊 ARV Confidence Factors] ← Expandable accordion
├─ Professional Appraisal? (Yes/No)
├─ Comparable Sales Count (0-10)
├─ Comps Date Range (<90 days recommended)
└─ Upload Comps (optional)
```

---

## 📝 **Smart Defaults: How They Work**

### **Example 1: Seasoning Period**
```typescript
// User selects strategy = "BRRRR"
const defaultSeasoningPeriod = 12; // Fannie Mae standard (updated from 6)

// BUT user can change via dropdown
<Select value={seasoningPeriod} onChange={handleChange}>
  <MenuItem value={6}>6 months</MenuItem>
  <MenuItem value={12}>12 months ⭐</MenuItem>
  {/* etc */}
</Select>

// System uses WHATEVER user selected (not forced to default)
```

### **Example 2: Rehab Budget**
```typescript
// Smart default based on scope
if (rehabScope === 'cosmetic') {
  defaultRehabBudget = purchasePrice * 0.10; // 10% suggestion
}

// Display to user
<TextField
  label="Rehab Budget"
  value={rehabBudget}
  onChange={(e) => setRehabBudget(Number(e.target.value))}
  helperText={`Suggested: $${defaultRehabBudget.toFixed(0)} for ${rehabScope} scope`}
/>

// User can ignore suggestion and type ANY number
```

### **Example 3: Refinance LTV**
```typescript
// Smart default
const defaultRefinanceLTV = 75; // Industry standard

// Validation range
const minLTV = 65;
const maxLTV = 80;

// User input
<TextField
  type="number"
  value={refinanceLTV}
  onChange={(e) => {
    const newValue = Number(e.target.value);
    if (newValue >= minLTV && newValue <= maxLTV) {
      setRefinanceLTV(newValue);
    }
  }}
  helperText="Fannie Mae max: 75%, DSCR lenders: up to 80%"
  inputProps={{ min: minLTV, max: maxLTV, step: 1 }}
/>
```

---

## ✅ **Summary: User Control Philosophy**

### **Design Principle**: **"Smart Defaults, Full Control"**

1. ✅ **Novice users**: Accept all defaults → Get analysis in 5 minutes
2. ✅ **Intermediate users**: Adjust 2-3 key fields (seasoning, LTV, rehab budget)
3. ✅ **Power users**: Expand all accordions → Customize everything

### **Every BRRRR Field is Configurable**:
- ✅ Seasoning Period: 6-24 months (dropdown)
- ✅ Refinance LTV: 65-80% (slider or input)
- ✅ Rehab Budget: $0-$1M (input)
- ✅ Contingency: 5-30% (input)
- ✅ Contractor Experience: Dropdown (none/DIY/experienced/licensed)
- ✅ Refinance Rate: Manual override FRED default
- ✅ ARV: User's estimate (with comps validation)

### **Nothing is Forced**:
- ❌ System never locks fields
- ❌ System never overrides user input
- ❌ System only SUGGESTS defaults (user can ignore)

---

## 🎯 **Implementation Note for Engineer**

When you build the BRRRR wizard:

```typescript
// CORRECT approach
const [seasoningPeriod, setSeasoningPeriod] = useState(12); // Default
// User can change via dropdown → system uses new value ✅

// WRONG approach (don't do this)
const seasoningPeriod = 12; // Hardcoded
// User cannot change ❌
```

**Every BRRRR parameter should be:**
1. ✅ State variable (useState)
2. ✅ Bound to input/dropdown (value prop)
3. ✅ Has onChange handler (user can edit)
4. ✅ Has smart default (pre-filled)
5. ✅ Has validation (min/max ranges)

---

## 🔄 **Why This Matters**

### **Scenario: Conservative Investor**
```
User Input:
- Seasoning Period: 18 months (wants to be extra safe)
- Refinance LTV: 70% (lower than 75% default)
- Contingency: 20% (higher than 15% default)

System Response:
✅ Calculates with 18-month seasoning
✅ Uses 70% LTV for refinance
✅ Reflects 20% contingency in budget
→ Shows very conservative capital recovery projection
```

### **Scenario: Aggressive DSCR Borrower**
```
User Input:
- Seasoning Period: 6 months (DSCR lender confirmed)
- Refinance LTV: 80% (DSCR max)
- Contingency: 10% (minimal)

System Response:
⚠️ Shows warning about 6-month seasoning (Fannie Mae requirement)
⚠️ Shows warning about 80% LTV (higher rate likely)
✅ Calculates with user's inputs anyway
→ Shows optimistic capital recovery (but with risk warnings)
```

---

## 📌 **Pin for Later: UX Implementation Details**

When UX Designer persona activates for BRRRR wizard design:

**Key Decisions to Make**:
1. Dropdown vs Slider vs Text Input (for each field)
2. Where to place "Advanced Options" accordions
3. How to show smart defaults without cluttering
4. When to show validation warnings (inline vs modal)
5. Mobile layout for 12+ BRRRR-specific fields

**Recommendation**: Follow Property Wizard pattern:
- Step 2: Basic BRRRR fields (purchase, rehab, ARV)
- Step 2B: Refinance parameters (LTV, seasoning, rate)
- Expandable accordions for advanced options

---

**Document Status**: ✅ **CONFIGURABILITY CLARIFIED**
**Answer to Your Question**: **YES - Seasoning period (and all BRRRR fields) are fully user-configurable**
**Smart Default**: 12 months (industry standard as of 2024)
**User Override**: Dropdown with 6, 9, 12, 18, 24 month options

**Next Action**: When implementing, ensure ALL fields are configurable via state management, not hardcoded.
