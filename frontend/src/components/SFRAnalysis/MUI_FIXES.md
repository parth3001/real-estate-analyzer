# MUI v7 TypeScript Fixes

## Issue Summary

There are several TypeScript errors in the codebase that need to be fixed before the production build can complete:

1. **Grid component errors**: MUI v7 requires the `component` prop for Grid components
2. **Type checking errors**: Several properties are possibly undefined
3. **Unused imports**: Several imports are declared but never used
4. **Type definition issues**: Issues with tenant turnover fees and other property types

## How to Fix

### 1. Grid Component Errors

In MUI v7, the Grid component requires a `component` prop. Update all Grid components like this:

```tsx
// From:
<Grid item xs={12} sm={6}>

// To:
<Grid component="div" item xs={12} sm={6}>
```

This needs to be done for all Grid components in:
- SensitivityAnalysisSection.tsx
- SFRPropertyForm.tsx
- Any other components using Grid

### 2. Type Checking for Possibly Undefined Values

Add proper null checks before accessing possibly undefined properties:

```tsx
// From:
if (formData.capitalInvestments < 0) newErrors.capitalInvestments = 'Capital investments cannot be negative';

// To:
if (formData.capitalInvestments !== undefined && formData.capitalInvestments < 0) {
  newErrors.capitalInvestments = 'Capital investments cannot be negative';
}
```

Do the same for:
- `formData.tenantTurnoverFees?.prepFees`
- `formData.tenantTurnoverFees?.realtorCommission`
- Other possibly undefined values

### 3. Update Property Types

Update the property types in `types/property.ts` to properly handle optional fields:

```tsx
export interface LongTermAssumptions {
  projectionYears: number;
  annualRentIncrease: number;
  annualPropertyValueIncrease: number;
  sellingCostsPercentage: number;
  inflationRate: number;
  vacancyRate: number;
  turnoverFrequency?: number; // Add this field
}
```

### 4. Remove Unused Imports

Remove or comment out unused imports:

```tsx
// From:
import {
  FormControl,
  FormHelperText,
  // other imports
} from '@mui/material';

// To:
import {
  // FormControl,
  // FormHelperText,
  // other imports
} from '@mui/material';
```

### 5. Fix Tenant Turnover Fees Type Issues

When setting tenant turnover fees, ensure both properties are set:

```tsx
// From:
tenantTurnoverFees: {
  prepFees: value,
  // realtorCommission is missing
}

// To:
tenantTurnoverFees: {
  prepFees: value,
  realtorCommission: formData.tenantTurnoverFees?.realtorCommission || 0
}
```

## Implementation Steps

1. First fix the Grid component issues by adding `component="div"` to all Grid components
2. Then fix the type checking issues with proper null checks
3. Update the property types to include missing fields
4. Remove unused imports
5. Fix the tenant turnover fees handling

These changes should resolve the TypeScript errors and allow the production build to complete successfully. 