# Bug Fixes Documentation

## Maintenance Cost Display Bug Fix (2025-07-12)

### Issue Description
**Problem**: Maintenance costs were not displaying in the yearly projections table when using the Property Wizard, showing $0 for all projection years despite backend correctly calculating values.

**Symptoms**:
- Manual form entry: Maintenance costs displayed correctly in projections
- Wizard form entry: Maintenance costs showed $0 in yearly projections table
- Backend logs showed correct calculations (5% × $1,995 × 12 = $1,197)
- Frontend logs showed "Using user-provided maintenance value: 0"

### Root Cause Analysis

**Data Flow Issue**:
1. **Wizard Submission**: PropertyWizard.tsx sends `maintenanceCost: 0` alongside `maintenanceReservePercentage: 5`
2. **Backend Calculation**: deals.ts correctly calculates `maintenanceCost = $1,197` from percentage
3. **Frontend Override**: AnalysisResults.tsx `preserveUserInputValues()` function overwrote backend calculations with `propertyData.maintenanceCost: 0`

**Key Code Paths**:
```javascript
// Problem: Frontend overriding backend calculations
if (propertyData.maintenanceCost !== undefined) {
  // This was always true, even when maintenanceCost was 0 from wizard
  analysis.monthlyAnalysis.expenses.maintenance = propertyData.maintenanceCost; // 0
}
```

### Solution Implementation

#### Backend Changes (`backend/src/controllers/deals.ts`)
1. **Removed premature deletion**: Stopped deleting calculated `maintenanceCost` after wizard conversion
2. **Preserved calculated values**: Ensured `maintenanceCost = $1,197` is passed to SFRAnalyzer

```javascript
// BEFORE (problematic):
delete dealData.maintenanceCost; // Remove this so frontend doesn't override calculated values

// AFTER (fixed):
// Keep the calculated maintenanceCost instead of deleting it
```

#### Frontend Changes (`frontend/src/components/SFRAnalysis/AnalysisResults.tsx`)
1. **Enhanced logic**: Only override when meaningful user input exists
2. **Wizard detection**: Distinguish between wizard data (0) and manual input (> 0)

```javascript
// BEFORE (problematic):
if (propertyData.maintenanceCost !== undefined) {
  // Always overwrote with 0 from wizard
}

// AFTER (fixed):
if (propertyData.maintenanceCost !== undefined && propertyData.maintenanceCost > 0) {
  // Only override when user provides meaningful value
} else {
  // Preserve backend-calculated values
}
```

### Verification Steps

**Test Case 1: Wizard Flow**
1. Use Property Wizard with 5% maintenance reserve
2. Backend calculates: 5% × $1,995 × 12 = $1,197
3. Frontend preserves calculated values
4. ✅ Yearly projections show $1,197, $1,220, $1,245, etc.

**Test Case 2: Manual Flow**
1. Enter maintenance cost manually ($100)
2. Frontend preserves user input
3. ✅ Yearly projections show $1,200 annually

**Console Log Verification**:
```
// Before fix:
"Using user-provided maintenance value: 0"
"Updated projections maintenance - Year 1: 0"

// After fix:
"Skipping maintenance override - using backend calculated values (propertyData.maintenanceCost: 0)"
// Maintenance values preserved from backend: 1197, 1220.94, 1245.36, etc.
```

### Impact Assessment

**✅ Fixed**:
- Yearly projections table displays maintenance costs correctly
- Wizard-calculated percentages work as intended
- Manual maintenance entries still preserved
- Data consistency between backend calculations and frontend display

**✅ Preserved**:
- Manual form functionality unchanged
- Existing saved deals unaffected
- Backward compatibility maintained

### Files Modified

1. **`backend/src/controllers/deals.ts`** - Line 256: Removed deletion of calculated maintenanceCost
2. **`frontend/src/components/SFRAnalysis/AnalysisResults.tsx`** - Lines 205-226: Enhanced preserveUserInputValues logic
3. **`frontend/src/components/SFRAnalysis/PropertyWizard.tsx`** - Lines 270-273: Simplified wizard data submission

### Prevention Measures

**Code Review Guidelines**:
- Verify data flow between wizard percentages and absolute values
- Test both wizard and manual form submissions
- Check console logs for data override warnings
- Ensure backend calculations are preserved in frontend

**Testing Protocol**:
- Always test maintenance cost display in yearly projections
- Verify both wizard (percentage) and manual (absolute) inputs
- Check that backend logs match frontend display values

### Related Documentation

- [DATA_MAPPING.md](./DATA_MAPPING.md) - Property Wizard Data Mapping section
- [CHANGELOG.md](./CHANGELOG.md) - Version history entry
- Backend logs: Search for "WIZARD DATA CONVERSION" for detailed calculation logs