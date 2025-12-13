# Implementation Plan: Phase 1 Universal Simple

**Date**: December 10, 2025
**Architect**: Principal Software Architect
**Purpose**: Detailed implementation plan with reusability analysis

---

## Executive Summary

### Scope
**Phase 1: Universal Simple** - Simplified Property Wizard for Buy & Hold strategy with progressive disclosure

### Timeline
**2 weeks** (10 working days)

### Approach
**Maximum Reusability** - Leverage existing components, create reusable patterns

### Risk
**LOW** - Frontend-only changes, no backend modifications

---

## Reusability Analysis

### ✅ Components We Can Reuse (As-Is or Minor Modifications)

| Component | File | Reuse Strategy | Modifications Needed |
|-----------|------|----------------|---------------------|
| **WizardStep** | `WizardStep.tsx` | ✅ **Reuse as-is** | None - perfect wrapper |
| **PropertyWizard** | `PropertyWizard.tsx` | ✅ **Modify** | Reorder steps, add Step 0 |
| **AddressStep** | `AddressStep.tsx` | ✅ **Reuse 95%** | Minor visual polish only |
| **RentalStep** | `RentalStep.tsx` | ✅ **Partial reuse** | Add hybrid slider component |
| **GoalsStrategyStep** | `GoalsStrategyStep.tsx` | ✅ **Refactor** | Simplify to visual cards |
| **InvestmentDecisionHero** | `InvestmentDecisionHero.tsx` | ✅ **Reuse as-is** | Already Apple-compliant |

### 🆕 New Components to Create

| Component | Purpose | Reusability | Complexity |
|-----------|---------|-------------|------------|
| **TapToExpandField** | Progressive disclosure pattern | ✅ **HIGH** | Medium |
| **HybridSliderInput** | Slider + text input | ✅ **HIGH** | Low |
| **StrategyCard** | Visual strategy selection | ✅ **MEDIUM** | Low |
| **ExpandableExpenses** | Operating expenses section | ✅ **MEDIUM** | Medium |
| **AdvancedAssumptionsAccordion** | Advanced options | ✅ **MEDIUM** | Low |

### ❌ Components to Deprecate (Not Delete)

| Component | Status | Reason |
|-----------|--------|--------|
| **AssumptionsStep** | ⚠️ **Deprecated** | Content redistributed to Steps 2-3 |
| **FinancialsStep** | 🔄 **Replace** | Replaced by enhanced Step 2 |

---

## Implementation Strategy

### Week 1: Core Components & Step 0-1

**Days 1-2: Reusable Component Library**
- Create `TapToExpandField.tsx`
- Create `HybridSliderInput.tsx`
- Create utility functions (`formatCurrency`, `appleEasing`)
- Test components in isolation (Storybook optional)

**Days 3-4: Step 0 (Strategy & Goals)**
- Create `StrategyCard.tsx`
- Refactor `GoalsStrategyStep.tsx` to use visual cards
- Keep AI-enhanced free text (existing logic)
- Integration testing

**Day 5: Step 1 (Address) Polish**
- Minor visual updates (12px radius, SF Pro font)
- Ensure consistency with Apple design system
- No functionality changes

---

### Week 2: Steps 2-3 & Testing

**Days 6-7: Step 2 (Purchase & Financing)**
- Create enhanced `FinancingStep.tsx`
- Integrate `TapToExpandField` for tax/insurance
- Keep smart defaults logic from `AssumptionsStep.tsx`
- Move property tax API call from Step 4 to Step 2

**Days 8-9: Step 3 (Rental & Operating)**
- Enhance `RentalStep.tsx` with hybrid slider
- Create `ExpandableExpenses.tsx` for operating costs
- Create `AdvancedAssumptionsAccordion.tsx`
- Move assumptions content from Step 4 to accordion

**Day 10: Integration Testing & Polish**
- End-to-end wizard flow testing
- Mobile responsive testing
- Accessibility audit (keyboard nav, screen readers)
- Performance optimization (memoization, lazy loading)

---

## Detailed Implementation Plan

## Component 1: TapToExpandField (Reusable Core Pattern)

### File Structure
```
/frontend/src/components/
├── common/
│   └── TapToExpandField/
│       ├── TapToExpandField.tsx
│       ├── TapToExpandField.test.tsx
│       └── index.ts
```

### Implementation
```tsx
// TapToExpandField.tsx
import React, { useState } from 'react';
import {
  Box,
  Typography,
  Collapse,
  Chip
} from '@mui/material';
import { ChevronRight as ChevronRightIcon } from '@mui/icons-material';
import { appleColors, appleEasing } from '../../theme/appleDesignSystem';

interface TapToExpandFieldProps {
  label: string;
  value: number;
  displayValue: string;
  helperText: string;
  smartDefault?: {
    value: number;
    source: string;
    confidence?: { score: number };
  };
  isCustomized?: boolean;
  children: React.ReactNode;
}

export function TapToExpandField({
  label,
  displayValue,
  helperText,
  smartDefault,
  isCustomized,
  children
}: TapToExpandFieldProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Box
      onClick={() => setExpanded(!expanded)}
      sx={{
        p: 2.5,
        mb: 2,
        backgroundColor: expanded ? appleColors.blue[50] : appleColors.gray[50],
        borderRadius: '12px',
        border: '1px solid',
        borderColor: expanded ? appleColors.blue[200] : 'transparent',
        cursor: 'pointer',
        transition: `all 0.2s ${appleEasing.standard}`,
        '&:hover': {
          backgroundColor: appleColors.gray[100],
          transform: 'translateY(-1px)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
        },
        '&:active': {
          transform: 'scale(0.99)',
          transition: `all 0.1s ${appleEasing.sharp}`
        }
      }}
    >
      {/* Collapsed View */}
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start'
      }}>
        <Box sx={{ flex: 1 }}>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mb: 0.5,
              fontFamily: 'SF Pro Text',
              fontSize: '13px',
              fontWeight: 500
            }}
          >
            {label}
            {isCustomized && (
              <Chip
                label="Customized"
                size="small"
                sx={{
                  ml: 1,
                  height: 18,
                  fontSize: '10px',
                  fontWeight: 600,
                  backgroundColor: appleColors.blue[100],
                  color: appleColors.blue[700]
                }}
              />
            )}
          </Typography>

          <Typography
            variant="h6"
            fontWeight={600}
            sx={{
              fontFamily: 'SF Pro Display',
              fontSize: '20px',
              color: appleColors.gray[900],
              mb: 0.5
            }}
          >
            {displayValue}
          </Typography>

          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: 0.5
            }}
          >
            {helperText}
          </Typography>
        </Box>

        {/* Chevron Indicator */}
        <ChevronRightIcon
          sx={{
            fontSize: 20,
            color: appleColors.gray[400],
            transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: `transform 0.2s ${appleEasing.standard}`,
            ml: 2
          }}
        />
      </Box>

      {/* Expanded Edit View */}
      <Collapse
        in={expanded}
        timeout={300}
        easing={appleEasing.standard}
      >
        <Box
          sx={{
            mt: 3,
            pt: 3,
            borderTop: '1px solid',
            borderColor: appleColors.gray[200]
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </Box>
      </Collapse>
    </Box>
  );
}
```

### Usage Example
```tsx
<TapToExpandField
  label="Property Tax"
  displayValue="$3,600/year"
  helperText="1.2% • ZIP code average"
  smartDefault={{ value: 1.2, source: 'ZIP code data' }}
  isCustomized={propertyTaxRate !== 1.2}
>
  {/* Slider + text input goes here */}
  <PropertyTaxSlider
    value={propertyTaxRate}
    onChange={setPropertyTaxRate}
    smartDefault={1.2}
  />
</TapToExpandField>
```

---

## Component 2: HybridSliderInput (Reusable Pattern)

### File Structure
```
/frontend/src/components/
├── common/
│   └── HybridSliderInput/
│       ├── HybridSliderInput.tsx
│       ├── HybridSliderInput.test.tsx
│       └── index.ts
```

### Implementation
```tsx
// HybridSliderInput.tsx
import React from 'react';
import {
  Box,
  Slider,
  TextField,
  Typography,
  InputAdornment
} from '@mui/material';
import { appleColors } from '../../theme/appleDesignSystem';

interface HybridSliderInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  unit: 'currency' | 'percentage';
  marks?: { value: number; label: string | React.ReactNode }[];
  helperText?: string;
}

export function HybridSliderInput({
  label,
  value,
  onChange,
  min,
  max,
  step,
  unit,
  marks,
  helperText
}: HybridSliderInputProps) {
  return (
    <Box>
      <Typography
        variant="body2"
        fontWeight={500}
        sx={{
          mb: 2,
          fontFamily: 'SF Pro Text',
          color: appleColors.gray[700]
        }}
      >
        {label}
      </Typography>

      <Box sx={{
        display: 'flex',
        gap: 3,
        alignItems: 'center'
      }}>
        {/* Slider (Visual Feedback) */}
        <Slider
          value={value}
          onChange={(_, newValue) => onChange(newValue as number)}
          min={min}
          max={max}
          step={step}
          marks={marks}
          sx={{
            flex: 1,
            color: appleColors.primary[500],
            '& .MuiSlider-thumb': {
              width: 20,
              height: 20,
              backgroundColor: 'white',
              border: `2px solid ${appleColors.primary[500]}`,
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              '&:hover, &.Mui-focusVisible': {
                boxShadow: `0 0 0 8px ${appleColors.primary[100]}`
              }
            },
            '& .MuiSlider-track': {
              height: 4,
              borderRadius: 2
            },
            '& .MuiSlider-rail': {
              height: 4,
              borderRadius: 2,
              backgroundColor: appleColors.gray[200]
            }
          }}
        />

        {/* Text Input (Precise Control) */}
        <TextField
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          sx={{
            width: unit === 'currency' ? 140 : 100,
            '& .MuiOutlinedInput-root': {
              borderRadius: '10px',
              backgroundColor: 'white',
              fontFamily: 'SF Pro Text',
              fontWeight: 600,
              fontSize: '18px'
            }
          }}
          InputProps={{
            startAdornment: unit === 'currency' && (
              <InputAdornment position="start">
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  $
                </Typography>
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <Typography variant="body2" color="text.secondary">
                  {unit === 'percentage' ? '%' : '/mo'}
                </Typography>
              </InputAdornment>
            )
          }}
          inputProps={{ min, max, step }}
        />
      </Box>

      {helperText && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            mt: 1.5,
            display: 'block',
            fontSize: '12px'
          }}
        >
          {helperText}
        </Typography>
      )}
    </Box>
  );
}
```

---

## Component 3: StrategyCard (Step 0)

### File Structure
```
/frontend/src/components/
├── SFRAnalysis/
│   └── StrategySelection/
│       ├── StrategyCard.tsx
│       ├── StrategySelectionStep.tsx (refactored GoalsStrategyStep)
│       └── index.ts
```

### Implementation
```tsx
// StrategyCard.tsx
import React from 'react';
import {
  Card,
  Box,
  Typography,
  Chip
} from '@mui/material';
import { SvgIconComponent } from '@mui/icons-material';
import { appleColors } from '../../../theme/appleDesignSystem';

interface StrategyCardProps {
  icon: SvgIconComponent;
  title: string;
  description: string;
  badge: string;
  badgeColor: 'primary' | 'success' | 'warning';
  isSelected: boolean;
  onClick: () => void;
}

export function StrategyCard({
  icon: Icon,
  title,
  description,
  badge,
  badgeColor,
  isSelected,
  onClick
}: StrategyCardProps) {
  const colorMap = {
    primary: appleColors.primary,
    success: appleColors.green,
    warning: appleColors.orange
  };

  const colors = colorMap[badgeColor];

  return (
    <Card
      onClick={onClick}
      sx={{
        p: 3,
        borderRadius: '16px',
        border: '2px solid',
        borderColor: isSelected ? colors[500] : appleColors.gray[200],
        backgroundColor: isSelected ? colors[50] : 'white',
        cursor: 'pointer',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          borderColor: colors[400],
          transform: 'translateY(-4px)',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)'
        },
        '&:active': {
          transform: 'scale(0.98)',
          transition: 'all 0.1s ease'
        }
      }}
    >
      <Icon
        sx={{
          fontSize: 48,
          color: colors[500],
          mb: 2
        }}
      />

      <Typography
        variant="h6"
        fontWeight={600}
        sx={{
          fontFamily: 'SF Pro Display',
          color: appleColors.gray[900],
          mb: 1
        }}
      >
        {title}
      </Typography>

      <Typography
        variant="body2"
        sx={{
          color: appleColors.gray[600],
          mb: 2,
          lineHeight: 1.5,
          minHeight: '60px'
        }}
      >
        {description}
      </Typography>

      <Chip
        label={badge}
        size="small"
        sx={{
          backgroundColor: colors[100],
          color: colors[700],
          fontWeight: 500,
          fontSize: '12px'
        }}
      />
    </Card>
  );
}
```

---

## File Modifications Summary

### Files to Modify

| File | Changes | Lines Changed | Complexity |
|------|---------|---------------|------------|
| **PropertyWizard.tsx** | Reorder steps, add Step 0 | ~50 lines | Low |
| **AddressStep.tsx** | Visual polish only | ~10 lines | Low |
| **GoalsStrategyStep.tsx** | Refactor to visual cards | ~200 lines | Medium |
| **FinancialsStep.tsx** | Replace with new enhanced version | ~300 lines | High |
| **RentalStep.tsx** | Add hybrid slider, expenses | ~150 lines | Medium |
| **AssumptionsStep.tsx** | Deprecate (keep file, mark deprecated) | ~5 lines | Low |

### Files to Create

| File | Purpose | Lines | Complexity |
|------|---------|-------|------------|
| **TapToExpandField.tsx** | Reusable progressive disclosure | ~150 lines | Medium |
| **HybridSliderInput.tsx** | Reusable slider+text | ~120 lines | Low |
| **StrategyCard.tsx** | Visual strategy selection | ~80 lines | Low |
| **ExpandableExpenses.tsx** | Operating expenses section | ~200 lines | Medium |
| **AdvancedAssumptionsAccordion.tsx** | Advanced options | ~150 lines | Low |
| **appleEasing.ts** | Animation timing utilities | ~30 lines | Low |

---

## Data Flow & State Management

### Current State Structure (PropertyWizard.tsx)
```typescript
interface WizardState {
  step: number;
  data: SFRPropertyData;
  smartDefaults: Record<string, SmartDefaultValue>;
  validation: StepValidation;
}
```

### New State Additions (Step 0)
```typescript
interface WizardState {
  step: number; // 0-3 (was 1-5)
  data: SFRPropertyData & {
    // NEW: Strategy selection
    strategy: 'buy-hold' | 'house-hack' | 'brrrr';
    freeTextStrategy?: string;
    aiEnhancedGoals?: EnhancedGoalContext;
  };
  smartDefaults: Record<string, SmartDefaultValue>;
  validation: StepValidation;
}
```

### Smart Defaults Migration
```typescript
// MOVE FROM: AssumptionsStep.tsx (lines 54-226)
// MOVE TO: FinancialsStep.tsx

// Property Tax API call (keep logic, move location)
useEffect(() => {
  if (state.data.propertyAddress?.zipCode && state.data.purchasePrice) {
    fetchPropertyTaxEstimate();
  }
}, [state.data.propertyAddress, state.data.purchasePrice]);
```

---

## Reusable Utilities & Theme

### Apple Design System Extensions

**File**: `/frontend/src/theme/appleDesignSystem.ts`

```typescript
// ADD: Animation easing curves
export const appleEasing = {
  standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
  enter: 'cubic-bezier(0, 0, 0.2, 1)',
  exit: 'cubic-bezier(0.4, 0, 1, 1)',
  sharp: 'cubic-bezier(0.4, 0, 0.6, 1)'
};

// ADD: Animation durations
export const appleDurations = {
  shortest: 150,
  shorter: 200,
  short: 250,
  standard: 300,
  complex: 375
};

// ADD: Helper functions
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}

export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}
```

---

## Testing Strategy

### Component Unit Tests

**TapToExpandField.test.tsx**:
```typescript
describe('TapToExpandField', () => {
  it('renders collapsed by default', () => {
    render(<TapToExpandField {...props} />);
    expect(screen.getByText('Property Tax')).toBeInTheDocument();
    expect(screen.queryByRole('slider')).not.toBeInTheDocument();
  });

  it('expands on click', () => {
    render(<TapToExpandField {...props} />);
    fireEvent.click(screen.getByText('Property Tax'));
    expect(screen.getByRole('slider')).toBeInTheDocument();
  });

  it('shows customized badge when value differs from default', () => {
    render(<TapToExpandField {...props} isCustomized={true} />);
    expect(screen.getByText('Customized')).toBeInTheDocument();
  });
});
```

### Integration Tests

**PropertyWizard.test.tsx** (enhanced):
```typescript
describe('PropertyWizard - Phase 1', () => {
  it('renders 4 steps (Step 0-3)', () => {
    render(<PropertyWizard onComplete={mockOnComplete} />);
    expect(screen.getByText('Investment Strategy & Goals')).toBeInTheDocument();
  });

  it('allows strategy selection in Step 0', () => {
    render(<PropertyWizard onComplete={mockOnComplete} />);
    fireEvent.click(screen.getByText('Buy & Hold'));
    expect(mockOnUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ strategy: 'buy-hold' })
    );
  });

  it('applies smart defaults in Step 2', async () => {
    // Test property tax API call and auto-population
  });

  it('completes full wizard flow', async () => {
    // E2E test: Step 0 → Step 1 → Step 2 → Step 3 → Complete
  });
});
```

---

## Migration & Deprecation Strategy

### Deprecating AssumptionsStep.tsx

**DO NOT DELETE** - Mark as deprecated for backward compatibility

```typescript
// AssumptionsStep.tsx
/**
 * @deprecated This step has been deprecated in Phase 1.
 * Content has been redistributed:
 * - Property Tax/Insurance → Step 2 (FinancialsStep)
 * - Operating Expenses → Step 3 (RentalStep)
 * - Advanced Assumptions → Step 3 Accordion
 *
 * This file is kept for reference and potential rollback.
 * DO NOT USE in new code.
 */

import React from 'react';
import { Alert } from '@mui/material';

const AssumptionsStep: React.FC = () => {
  return (
    <Alert severity="warning">
      This step has been deprecated. Please use the simplified wizard.
    </Alert>
  );
};

export default AssumptionsStep;
```

### PropertyWizard.tsx Step Configuration

```typescript
// OLD (5 steps)
const steps = [
  { component: AddressStep },
  { component: FinancialsStep },
  { component: RentalStep },
  { component: AssumptionsStep }, // ← DEPRECATED
  { component: GoalsStrategyStep }
];

// NEW (4 steps)
const steps = [
  { component: StrategySelectionStep }, // ← NEW (Step 0)
  { component: AddressStep },
  { component: EnhancedFinancialsStep }, // ← ENHANCED
  { component: EnhancedRentalStep }      // ← ENHANCED
];
```

---

## Performance Optimization

### Lazy Loading Strategy
```typescript
// PropertyWizard.tsx
import React, { lazy, Suspense } from 'react';

const StrategySelectionStep = lazy(() => import('./StrategySelection/StrategySelectionStep'));
const AddressStep = lazy(() => import('./AddressStep'));
const EnhancedFinancialsStep = lazy(() => import('./EnhancedFinancialsStep'));
const EnhancedRentalStep = lazy(() => import('./EnhancedRentalStep'));

// Render with Suspense
<Suspense fallback={<CircularProgress />}>
  {currentStep === 0 && <StrategySelectionStep {...props} />}
  {currentStep === 1 && <AddressStep {...props} />}
  {currentStep === 2 && <EnhancedFinancialsStep {...props} />}
  {currentStep === 3 && <EnhancedRentalStep {...props} />}
</Suspense>
```

### Memoization
```typescript
// TapToExpandField.tsx - Prevent unnecessary re-renders
export const TapToExpandField = React.memo(({ ... }) => {
  // Component logic
});

// PropertyWizard.tsx - Memoize expensive calculations
const calculatedTax = useMemo(
  () => (purchasePrice * taxRate / 100),
  [purchasePrice, taxRate]
);
```

---

## Rollback Strategy

### If Phase 1 Needs to Be Rolled Back

**Option 1: Feature Flag** (Recommended)
```typescript
// .env
REACT_APP_ENABLE_SIMPLIFIED_WIZARD=true

// PropertyWizard.tsx
const useSimplifiedWizard = process.env.REACT_APP_ENABLE_SIMPLIFIED_WIZARD === 'true';

return useSimplifiedWizard ? (
  <SimplifiedWizard />
) : (
  <LegacyWizard />
);
```

**Option 2: Git Branch**
- Keep `main` branch as-is during development
- Develop Phase 1 in `feature/simplified-wizard` branch
- Merge only after full QA approval

**Option 3: Component Versioning**
```
/frontend/src/components/SFRAnalysis/
├── v1/ (legacy - 5 steps)
│   ├── PropertyWizard.tsx
│   ├── AssumptionsStep.tsx
│   └── ...
├── v2/ (Phase 1 - 4 steps)
│   ├── PropertyWizard.tsx
│   ├── StrategySelectionStep.tsx
│   └── ...
```

---

## Implementation Checklist

### Week 1
- [ ] **Day 1**: Create `TapToExpandField.tsx` + tests
- [ ] **Day 1**: Create `HybridSliderInput.tsx` + tests
- [ ] **Day 2**: Add `appleEasing` utilities to theme
- [ ] **Day 2**: Create `formatCurrency` helpers
- [ ] **Day 3**: Create `StrategyCard.tsx`
- [ ] **Day 3**: Refactor `GoalsStrategyStep.tsx` → `StrategySelectionStep.tsx`
- [ ] **Day 4**: Integration test Step 0
- [ ] **Day 4**: Add AI analysis integration to Step 0
- [ ] **Day 5**: Polish `AddressStep.tsx` (visual only)
- [ ] **Day 5**: Week 1 review & QA

### Week 2
- [ ] **Day 6**: Create `EnhancedFinancialsStep.tsx`
- [ ] **Day 6**: Migrate property tax API from AssumptionsStep
- [ ] **Day 7**: Integrate `TapToExpandField` for tax/insurance
- [ ] **Day 7**: Test Step 2 smart defaults
- [ ] **Day 8**: Enhance `RentalStep.tsx` with hybrid slider
- [ ] **Day 8**: Create `ExpandableExpenses.tsx`
- [ ] **Day 9**: Create `AdvancedAssumptionsAccordion.tsx`
- [ ] **Day 9**: Migrate assumptions from Step 4 to accordion
- [ ] **Day 10**: Full E2E testing
- [ ] **Day 10**: Mobile testing, accessibility audit
- [ ] **Day 10**: Performance optimization, final QA

---

## Success Criteria

### Functional Requirements
- ✅ 4-step wizard (Step 0-3) functional
- ✅ Strategy selection (visual cards) working
- ✅ Property tax/insurance tap-to-expand working
- ✅ Hybrid slider for rent working
- ✅ Advanced assumptions accordion working
- ✅ Smart defaults migrated and functional
- ✅ All existing features preserved (RentCast, AI analysis)

### UX Requirements
- ✅ Apple Design System compliant (12px radius, SF Pro font, etc.)
- ✅ Animations smooth (300ms standard easing)
- ✅ Mobile responsive (44px touch targets)
- ✅ Accessible (WCAG 2.1 AA, keyboard nav)

### Performance Requirements
- ✅ Time to interactive: <2s
- ✅ Component render time: <16ms (60fps)
- ✅ Wizard completion time: <5 minutes (Josh's requirement)

### Quality Requirements
- ✅ Test coverage: >80% for new components
- ✅ Zero TypeScript errors
- ✅ Zero console warnings
- ✅ Lighthouse score: >90

---

## Risk Mitigation

### Risk 1: Breaking Existing Functionality
**Mitigation**:
- Keep `AssumptionsStep.tsx` as-is (deprecated, not deleted)
- Feature flag for easy rollback
- Comprehensive regression testing

### Risk 2: Smart Defaults API Breaks
**Mitigation**:
- Graceful fallback to hardcoded defaults
- Error handling for API failures
- Maintain existing smart defaults logic

### Risk 3: Mobile UX Issues
**Mitigation**:
- Test on real devices (iPhone, Android)
- Touch target validation (44px minimum)
- Responsive testing at all breakpoints

### Risk 4: Performance Degradation
**Mitigation**:
- Lazy loading for step components
- React.memo for expensive components
- useMemo for calculations
- Performance profiling before/after

---

## Summary

### High Reusability Wins
1. ✅ **WizardStep.tsx** - Reuse as-is (perfect wrapper)
2. ✅ **AddressStep.tsx** - 95% reuse (minor polish)
3. ✅ **InvestmentDecisionHero.tsx** - 100% reuse (already Apple-compliant)
4. ✅ **Smart defaults logic** - Migrate, don't rewrite

### New Reusable Components
1. **TapToExpandField** - Progressive disclosure (use in Steps 2-3)
2. **HybridSliderInput** - Slider + text (use in Step 3, future steps)
3. **StrategyCard** - Visual selection (use in Step 0, future features)

### Implementation Efficiency
- **2 weeks** vs 4+ weeks if built from scratch
- **~1,200 lines new code** vs 3,000+ lines
- **60% code reuse** (existing components + logic)

---

**Document Version**: 1.0
**Last Updated**: December 10, 2025
**Status**: ✅ Ready for implementation
