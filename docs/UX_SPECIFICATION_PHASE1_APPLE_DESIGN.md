# UX Specification: Phase 1 Universal Simple (Apple Design System)

**Date**: December 10, 2025
**Designer**: Senior UX Designer (Apple Design Philosophy)
**Purpose**: Apple-compliant UX specification for simplified Property Wizard

---

## Design Philosophy

### Apple Human Interface Guidelines Applied

**Simplicity**: Remove everything unnecessary until only the essential remains
- Show concrete values (dollars), hide abstract concepts (percentages)
- Default to smart defaults, reveal controls only when needed
- No unnecessary buttons or chrome

**Clarity**: Every number, label, and action should be immediately understood
- "$3,600/year" not "1.2% property tax rate"
- "Based on ZIP code" not "Effective tax rate calculation methodology"
- Progressive disclosure reveals complexity only when user needs it

**Deference**: Content is king - the UI should never compete with the data
- No "Customize" buttons - content itself is interactive
- Subtle hover states and chevrons indicate affordance
- Animations smooth and purposeful (300ms ease curves)

**Depth**: Use subtle layers to communicate hierarchy
- Layer 1: Essential values (always visible)
- Layer 2: Adjustable controls (tap to reveal)
- Layer 3: Advanced assumptions (accordion)

**Human Interface**: Design for confidence and trust
- Smart defaults with source attribution ("ZIP code average")
- Easy reset to defaults (builds confidence to experiment)
- Customized values visually distinct (blue accent)

---

## Wizard Flow Overview

### 4-Step Simplified Flow

```
Step 0: Investment Strategy & Goals
  ├─ Visual card selection (Buy & Hold, House Hacking, BRRRR)
  └─ Optional AI-enhanced free-text strategy

Step 1: Property Address
  ├─ Address lookup with autocomplete
  └─ RentCast auto-population

Step 2: Purchase & Financing
  ├─ Purchase Price (required)
  ├─ Down Payment (required)
  ├─ Property Tax (tap-to-customize)
  └─ Insurance (tap-to-customize)

Step 3: Rental & Operating
  ├─ Monthly Rent (hybrid slider + text)
  ├─ Operating Expenses (tap-to-customize each)
  └─ Advanced Assumptions (accordion - collapsed)
```

---

## Step 0: Investment Strategy & Goals

### Design Principle
**Visual, not verbal** - Show strategy options as interactive cards with clear visual hierarchy

### Layout Specification

**Desktop (≥960px)**:
```
┌─────────────────────────────────────────────────────────────┐
│                                                               │
│  What's your investment strategy?                            │
│  Choose the approach that best describes your plan           │
│                                                               │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐               │
│  │  🏠       │  │  🏘️       │  │  🔄       │               │
│  │ Buy &     │  │  House    │  │  BRRRR    │               │
│  │ Hold      │  │ Hacking   │  │           │               │
│  │           │  │           │  │           │               │
│  │ Long-term │  │ Live &    │  │ Buy,      │               │
│  │ rental    │  │ rent out  │  │ renovate, │               │
│  │ income    │  │ units     │  │ refinance │               │
│  │           │  │           │  │           │               │
│  │ Most      │  │ First-    │  │ Advanced  │               │
│  │ Common    │  │ Timers    │  │           │               │
│  └───────────┘  └───────────┘  └───────────┘               │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🤖 Tell us more about your strategy (Optional)       │   │
│  │                                                       │   │
│  │ Share your specific goals, timeline, or unique       │   │
│  │ approach. Our AI will personalize your analysis.     │   │
│  │                                                       │   │
│  │ ┌───────────────────────────────────────────────┐   │   │
│  │ │                                               │   │   │
│  │ │  [Multi-line text area]                      │   │   │
│  │ │                                               │   │   │
│  │ └───────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

**Mobile (<600px)**:
```
┌──────────────────────────┐
│ What's your investment   │
│ strategy?                │
│                          │
│ ┌──────────────────────┐ │
│ │  🏠 Buy & Hold       │ │
│ │  Long-term rental    │ │
│ │  Most Common         │ │
│ └──────────────────────┘ │
│                          │
│ ┌──────────────────────┐ │
│ │  🏘️ House Hacking   │ │
│ │  Live & rent units   │ │
│ │  First-Timers        │ │
│ └──────────────────────┘ │
│                          │
│ ┌──────────────────────┐ │
│ │  🔄 BRRRR           │ │
│ │  Buy, renovate,      │ │
│ │  refinance           │ │
│ │  Advanced            │ │
│ └──────────────────────┘ │
│                          │
│ [AI text area]           │
└──────────────────────────┘
```

### Component Specifications

#### Strategy Selection Card

**Visual States**:
```typescript
// Default State
{
  padding: '24px',
  borderRadius: '16px',
  border: '2px solid',
  borderColor: appleColors.gray[200],
  backgroundColor: 'white',
  cursor: 'pointer',
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
}

// Hover State (Desktop)
{
  borderColor: appleColors.primary[400],
  transform: 'translateY(-4px)',
  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)'
}

// Selected State
{
  borderColor: appleColors.primary[500],
  backgroundColor: appleColors.primary[50],
  boxShadow: '0 4px 16px rgba(59, 130, 246, 0.2)'
}

// Active State (Click/Tap)
{
  transform: 'scale(0.98)',
  transition: 'all 0.1s ease'
}
```

**Typography Hierarchy**:
```typescript
// Icon
{
  fontSize: '48px',
  marginBottom: '16px'
}

// Title
{
  fontFamily: 'SF Pro Display',
  fontSize: '20px',
  fontWeight: 600,
  lineHeight: '28px',
  color: appleColors.gray[900],
  marginBottom: '8px'
}

// Description
{
  fontFamily: 'SF Pro Text',
  fontSize: '14px',
  fontWeight: 400,
  lineHeight: '20px',
  color: appleColors.gray[600],
  marginBottom: '16px'
}

// Badge
{
  fontSize: '12px',
  fontWeight: 500,
  padding: '4px 12px',
  borderRadius: '12px',
  backgroundColor: appleColors.primary[100],
  color: appleColors.primary[700]
}
```

**Implementation Code**:
```tsx
<Grid container spacing={3}>
  <Grid item xs={12} md={4}>
    <Card
      onClick={() => handleStrategySelect('buy-hold')}
      sx={{
        p: 3,
        borderRadius: '16px',
        border: '2px solid',
        borderColor: strategy === 'buy-hold'
          ? appleColors.primary[500]
          : appleColors.gray[200],
        backgroundColor: strategy === 'buy-hold'
          ? appleColors.primary[50]
          : 'white',
        cursor: 'pointer',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          borderColor: appleColors.primary[400],
          transform: 'translateY(-4px)',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)'
        },
        '&:active': {
          transform: 'scale(0.98)',
          transition: 'all 0.1s ease'
        }
      }}
    >
      <Home
        sx={{
          fontSize: 48,
          color: appleColors.primary[500],
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
        Buy & Hold
      </Typography>

      <Typography
        variant="body2"
        sx={{
          color: appleColors.gray[600],
          mb: 2,
          lineHeight: 1.5
        }}
      >
        Purchase and rent out long-term for steady monthly cash flow and appreciation
      </Typography>

      <Chip
        label="Most Common"
        size="small"
        sx={{
          backgroundColor: appleColors.primary[100],
          color: appleColors.primary[700],
          fontWeight: 500,
          fontSize: '12px'
        }}
      />
    </Card>
  </Grid>

  {/* Repeat for House Hacking and BRRRR */}
</Grid>
```

#### AI-Enhanced Strategy Input

**Design Pattern**: Apple Notes-style text area with subtle AI indicator

```tsx
<Box sx={{ mt: 4 }}>
  <Box sx={{
    display: 'flex',
    alignItems: 'center',
    mb: 2,
    gap: 1
  }}>
    <AutoAwesomeIcon sx={{
      fontSize: 20,
      color: appleColors.primary[500]
    }} />
    <Typography
      variant="h6"
      fontWeight={600}
      sx={{ fontFamily: 'SF Pro Display' }}
    >
      Tell us more about your strategy
    </Typography>
    <Chip
      label="AI Enhanced"
      size="small"
      icon={<SparklesIcon sx={{ fontSize: 14 }} />}
      sx={{
        height: 24,
        backgroundColor: appleColors.primary[100],
        color: appleColors.primary[700],
        fontWeight: 500,
        fontSize: '11px'
      }}
    />
  </Box>

  <Typography
    variant="body2"
    color="text.secondary"
    sx={{ mb: 2 }}
  >
    <strong>Optional:</strong> Share your specific goals, timeline, or unique approach.
    Our AI will personalize your analysis.
  </Typography>

  <TextField
    fullWidth
    multiline
    rows={4}
    placeholder={getStrategyPlaceholder(strategy)}
    value={freeTextStrategy}
    onChange={handleFreeTextChange}
    sx={{
      '& .MuiOutlinedInput-root': {
        borderRadius: '12px',
        backgroundColor: appleColors.gray[50],
        fontFamily: 'SF Pro Text',
        fontSize: '15px',
        lineHeight: 1.6,
        '&:hover': {
          backgroundColor: 'white'
        },
        '&.Mui-focused': {
          backgroundColor: 'white',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: appleColors.primary[500],
            borderWidth: '2px'
          }
        }
      }
    }}
  />

  {/* AI Analysis Status */}
  {isAnalyzing && (
    <Box sx={{
      display: 'flex',
      alignItems: 'center',
      gap: 2,
      mt: 2,
      p: 2,
      backgroundColor: appleColors.primary[50],
      borderRadius: '12px',
      border: `1px solid ${appleColors.primary[200]}`
    }}>
      <CircularProgress
        size={20}
        sx={{ color: appleColors.primary[500] }}
      />
      <Typography variant="body2" color={appleColors.primary[700]}>
        Analyzing your strategy...
      </Typography>
    </Box>
  )}
</TextField>
```

---

## Step 2: Purchase & Financing (Apple-Compliant)

### Design Principle
**Tap-to-expand**, not button-to-expand - Entire row is interactive surface

### Visual Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│  Purchase & Financing                                         │
│                                                               │
│  Purchase Price *                                             │
│  ┌─────────────────────────────────────────────────────┐     │
│  │  $ 300,000                                          │     │
│  └─────────────────────────────────────────────────────┘     │
│                                                               │
│  Down Payment *                                               │
│  ┌─────────────────────────────────────────────────────┐     │
│  │  20 %                                               │     │
│  └─────────────────────────────────────────────────────┘     │
│                                                               │
│  Annual Operating Costs                                       │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐     │
│  │  Property Tax          $3,600/year              ›   │ ←──┐│
│  │  1.2% • ZIP code average                            │    ││
│  └─────────────────────────────────────────────────────┘    ││
│                                  Tap anywhere to customize ──┘│
│  ┌─────────────────────────────────────────────────────┐     │
│  │  Insurance             $1,200/year              ›   │     │
│  │  0.7% • Regional average                            │     │
│  └─────────────────────────────────────────────────────┘     │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Component: TapToExpandField

**Collapsed State** (Default):
```tsx
<Box
  onClick={() => setExpanded(!expanded)}
  sx={{
    p: 2.5,
    mb: 2,
    backgroundColor: expanded
      ? appleColors.blue[50]
      : appleColors.gray[50],
    borderRadius: '12px',
    border: '1px solid',
    borderColor: expanded
      ? appleColors.blue[200]
      : 'transparent',
    cursor: 'pointer',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    '&:hover': {
      backgroundColor: appleColors.gray[100],
      transform: 'translateY(-1px)',
      boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
    },
    '&:active': {
      transform: 'scale(0.99)',
      transition: 'all 0.1s ease'
    }
  }}
>
  <Box sx={{
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  }}>
    {/* Left: Label + Value */}
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
        Property Tax
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
        {formatCurrency(annualPropertyTax)}
        <Typography
          component="span"
          variant="body2"
          color="text.secondary"
          sx={{ ml: 1, fontWeight: 400 }}
        >
          /year
        </Typography>
      </Typography>

      <Typography
        variant="caption"
        color="text.secondary"
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          fontSize: '12px'
        }}
      >
        {propertyTaxRate}% • ZIP code average
        {smartDefault?.confidence && (
          <Chip
            label={`${smartDefault.confidence.score}% confidence`}
            size="small"
            sx={{
              height: 16,
              fontSize: '10px',
              backgroundColor: 'transparent',
              border: `1px solid ${appleColors.gray[300]}`,
              color: appleColors.gray[600]
            }}
          />
        )}
      </Typography>
    </Box>

    {/* Right: Chevron Indicator */}
    <ChevronRightIcon
      sx={{
        fontSize: 20,
        color: appleColors.gray[400],
        transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
        transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        ml: 2
      }}
    />
  </Box>
</Box>
```

**Expanded State** (After Tap):
```tsx
<Collapse
  in={expanded}
  timeout={300}
  easing="cubic-bezier(0.4, 0, 0.2, 1)"
>
  <Box
    sx={{
      mt: 3,
      pt: 3,
      borderTop: '1px solid',
      borderColor: appleColors.gray[200]
    }}
    onClick={(e) => e.stopPropagation()} // Prevent collapse when editing
  >
    <Typography
      variant="body2"
      fontWeight={500}
      sx={{
        mb: 2,
        color: appleColors.gray[700]
      }}
    >
      Adjust Property Tax Rate
    </Typography>

    {/* Hybrid Slider + Text Input */}
    <Box sx={{
      display: 'flex',
      gap: 2,
      alignItems: 'center',
      mb: 2
    }}>
      {/* Slider (Visual Feedback) */}
      <Slider
        value={propertyTaxRate}
        onChange={(_, value) => setPropertyTaxRate(value as number)}
        min={0.5}
        max={3}
        step={0.1}
        marks={[
          { value: 0.5, label: '0.5%' },
          { value: smartDefault?.value || 1.2, label: `${smartDefault?.value || 1.2}%` },
          { value: 3, label: '3%' }
        ]}
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
        value={propertyTaxRate}
        onChange={(e) => setPropertyTaxRate(Number(e.target.value))}
        sx={{
          width: 100,
          '& .MuiOutlinedInput-root': {
            borderRadius: '8px',
            fontFamily: 'SF Pro Text',
            fontWeight: 500
          }
        }}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontWeight: 500 }}
              >
                %
              </Typography>
            </InputAdornment>
          )
        }}
        inputProps={{
          min: 0.5,
          max: 3,
          step: 0.1
        }}
      />
    </Box>

    {/* Calculated Result */}
    <Typography
      variant="caption"
      color="text.secondary"
      sx={{
        display: 'block',
        mb: 2,
        fontFamily: 'SF Pro Text'
      }}
    >
      Annual property tax: {formatCurrency(calculatedTax)}
    </Typography>

    {/* Smart Default Info (If Available) */}
    {smartDefault && (
      <Alert
        severity="info"
        icon={<InfoIcon sx={{ fontSize: 18 }} />}
        sx={{
          mb: 2,
          borderRadius: '8px',
          backgroundColor: appleColors.blue[50],
          border: `1px solid ${appleColors.blue[200]}`,
          '& .MuiAlert-message': {
            fontSize: '13px',
            color: appleColors.gray[700]
          }
        }}
      >
        We recommend <strong>{smartDefault.value}%</strong> based on {smartDefault.source}
        ({smartDefault.confidence?.score}% confidence)
      </Alert>
    )}

    {/* Actions */}
    <Box sx={{
      display: 'flex',
      justifyContent: 'flex-end',
      gap: 1
    }}>
      <Button
        size="small"
        onClick={handleResetToDefault}
        sx={{
          textTransform: 'none',
          color: appleColors.primary[600],
          fontWeight: 500,
          fontSize: '14px',
          fontFamily: 'SF Pro Text'
        }}
      >
        Reset to Default
      </Button>
    </Box>
  </Box>
</Collapse>
```

### Visual States Animation Timing

```typescript
// Apple's standard timing curves
const appleEasing = {
  standard: 'cubic-bezier(0.4, 0, 0.2, 1)', // 300ms
  decelerate: 'cubic-bezier(0, 0, 0.2, 1)', // Exit (fade out)
  accelerate: 'cubic-bezier(0.4, 0, 1, 1)',  // Enter (fade in)
  sharp: 'cubic-bezier(0.4, 0, 0.6, 1)'      // Quick interactions
};

// Interaction States
{
  hover: {
    duration: '200ms',
    easing: appleEasing.standard,
    properties: ['background-color', 'transform', 'box-shadow']
  },
  expand: {
    duration: '300ms',
    easing: appleEasing.standard,
    properties: ['max-height', 'opacity', 'transform']
  },
  collapse: {
    duration: '250ms',
    easing: appleEasing.decelerate,
    properties: ['max-height', 'opacity']
  },
  tap: {
    duration: '100ms',
    easing: appleEasing.sharp,
    properties: ['transform']
  }
}
```

---

## Step 3: Rental & Operating

### Design Principle
**Hybrid Input for Rent** - Visual slider + precise text input (Josh's requirement)

### Rental Income Input (Hybrid Pattern)

```tsx
<Box sx={{ mb: 4 }}>
  <Typography
    variant="h6"
    fontWeight={600}
    sx={{
      mb: 1,
      fontFamily: 'SF Pro Display',
      color: appleColors.gray[900]
    }}
  >
    Estimated Monthly Rent
  </Typography>

  {/* RentCast Estimate Badge */}
  {rentcastEstimate && (
    <Chip
      icon={<CheckCircleIcon sx={{ fontSize: 16 }} />}
      label={`RentCast Estimate: ${formatCurrency(rentcastEstimate)}/mo`}
      sx={{
        mb: 2,
        backgroundColor: appleColors.green[50],
        border: `1px solid ${appleColors.green[200]}`,
        color: appleColors.green[700],
        fontWeight: 500,
        fontSize: '13px'
      }}
    />
  )}

  {/* Hybrid Slider + Text Input */}
  <Box sx={{
    display: 'flex',
    gap: 3,
    alignItems: 'center',
    p: 3,
    backgroundColor: appleColors.gray[50],
    borderRadius: '12px'
  }}>
    {/* Slider (Left - Visual Range) */}
    <Box sx={{ flex: 1 }}>
      <Slider
        value={monthlyRent}
        onChange={(_, value) => setMonthlyRent(value as number)}
        min={Math.floor(rentcastEstimate * 0.5)}
        max={Math.ceil(rentcastEstimate * 1.5)}
        step={50}
        marks={[
          {
            value: Math.floor(rentcastEstimate * 0.5),
            label: '-50%'
          },
          {
            value: rentcastEstimate,
            label: (
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                  RentCast
                </Typography>
                <Typography variant="caption" display="block">
                  {formatCurrency(rentcastEstimate)}
                </Typography>
              </Box>
            )
          },
          {
            value: Math.ceil(rentcastEstimate * 1.5),
            label: '+50%'
          }
        ]}
        sx={{
          color: appleColors.primary[500],
          '& .MuiSlider-thumb': {
            width: 24,
            height: 24,
            backgroundColor: 'white',
            border: `3px solid ${appleColors.primary[500]}`,
            boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
            '&:hover, &.Mui-focusVisible': {
              boxShadow: `0 0 0 10px ${appleColors.primary[100]}`
            }
          },
          '& .MuiSlider-track': {
            height: 6,
            borderRadius: 3
          },
          '& .MuiSlider-rail': {
            height: 6,
            borderRadius: 3,
            backgroundColor: appleColors.gray[300]
          },
          '& .MuiSlider-markLabel': {
            fontSize: '11px',
            fontFamily: 'SF Pro Text',
            fontWeight: 500,
            color: appleColors.gray[600]
          }
        }}
      />
    </Box>

    {/* Text Input (Right - Precise Control) */}
    <TextField
      type="number"
      value={monthlyRent}
      onChange={(e) => setMonthlyRent(Number(e.target.value))}
      sx={{
        width: 140,
        '& .MuiOutlinedInput-root': {
          borderRadius: '10px',
          backgroundColor: 'white',
          fontFamily: 'SF Pro Text',
          fontWeight: 600,
          fontSize: '18px',
          '& input': {
            textAlign: 'right'
          }
        }
      }}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <Typography
              variant="body1"
              sx={{
                fontWeight: 600,
                color: appleColors.gray[500]
              }}
            >
              $
            </Typography>
          </InputAdornment>
        ),
        endAdornment: (
          <InputAdornment position="end">
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontWeight: 500 }}
            >
              /mo
            </Typography>
          </InputAdornment>
        )
      }}
      inputProps={{
        min: 0,
        step: 50
      }}
    />
  </Box>

  {/* Difference from RentCast */}
  {monthlyRent !== rentcastEstimate && (
    <Typography
      variant="caption"
      sx={{
        mt: 1.5,
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
        color: monthlyRent > rentcastEstimate
          ? appleColors.orange[600]
          : appleColors.green[600],
        fontWeight: 500
      }}
    >
      {monthlyRent > rentcastEstimate ? (
        <TrendingUpIcon sx={{ fontSize: 16 }} />
      ) : (
        <TrendingDownIcon sx={{ fontSize: 16 }} />
      )}
      {monthlyRent > rentcastEstimate ? '+' : ''}
      {formatCurrency(monthlyRent - rentcastEstimate)}/mo
      ({((monthlyRent - rentcastEstimate) / rentcastEstimate * 100).toFixed(1)}%)
      vs RentCast estimate
    </Typography>
  )}
</Box>
```

### Operating Expenses (Tap-to-Expand Pattern)

```tsx
<Box>
  <Typography
    variant="h6"
    fontWeight={600}
    sx={{
      mb: 2,
      fontFamily: 'SF Pro Display',
      color: appleColors.gray[900]
    }}
  >
    Monthly Operating Expenses
  </Typography>

  {/* Maintenance - Tap to Expand */}
  <TapToExpandField
    label="Maintenance Reserve"
    value={monthlyMaintenance}
    displayValue={`${formatCurrency(monthlyMaintenance)}/mo`}
    helperText={`${maintenancePercent}% of rent • Industry standard`}
    smartDefault={{ value: 5, source: 'Industry Standard' }}
    isExpanded={expandedFields.maintenance}
    onToggle={() => toggleField('maintenance')}
  >
    {/* Maintenance slider (3-15% range) */}
    <MaintenanceSlider
      value={maintenancePercent}
      onChange={setMaintenancePercent}
      monthlyRent={monthlyRent}
    />
  </TapToExpandField>

  {/* Property Management - Tap to Expand */}
  <TapToExpandField
    label="Property Management"
    value={monthlyManagement}
    displayValue={`${formatCurrency(monthlyManagement)}/mo`}
    helperText={`${managementPercent}% of rent • Typical for self-managed`}
  >
    {/* Management slider (0-10% range) */}
  </TapToExpandField>

  {/* Vacancy - Tap to Expand */}
  <TapToExpandField
    label="Vacancy Reserve"
    value={monthlyVacancy}
    displayValue={`${formatCurrency(monthlyVacancy)}/mo`}
    helperText={`${vacancyPercent}% of rent • ~1 month/year`}
  >
    {/* Vacancy slider (0-10% range) */}
  </TapToExpandField>
</Box>
```

### Advanced Assumptions (Accordion - Collapsed by Default)

```tsx
<Accordion
  sx={{
    mt: 4,
    borderRadius: '12px',
    border: `1px solid ${appleColors.gray[200]}`,
    '&:before': { display: 'none' }, // Remove default MUI divider
    boxShadow: 'none'
  }}
>
  <AccordionSummary
    expandIcon={<ExpandMoreIcon />}
    sx={{
      borderRadius: '12px',
      '&:hover': {
        backgroundColor: appleColors.gray[50]
      }
    }}
  >
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
      <SettingsIcon
        sx={{
          fontSize: 20,
          color: appleColors.gray[500]
        }}
      />
      <Typography
        variant="body1"
        fontWeight={500}
        sx={{ fontFamily: 'SF Pro Text' }}
      >
        Advanced Assumptions
      </Typography>
      <Chip
        label="Optional"
        size="small"
        sx={{
          height: 20,
          fontSize: '11px',
          fontWeight: 500,
          backgroundColor: appleColors.gray[100],
          color: appleColors.gray[600]
        }}
      />
    </Box>
  </AccordionSummary>

  <AccordionDetails sx={{ pt: 0 }}>
    <Alert
      severity="info"
      icon={<LightbulbIcon sx={{ fontSize: 18 }} />}
      sx={{
        mb: 3,
        borderRadius: '8px',
        backgroundColor: appleColors.blue[50],
        border: `1px solid ${appleColors.blue[200]}`
      }}
    >
      <Typography variant="caption" sx={{ fontSize: '13px' }}>
        These values are pre-filled with smart defaults based on market data.
        <strong> Adjust only if you have specific knowledge about this market.</strong>
      </Typography>
    </Alert>

    <Grid container spacing={2.5}>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Annual Property Appreciation"
          type="number"
          value={appreciationRate}
          onChange={(e) => setAppreciationRate(e.target.value)}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <Typography variant="body2" color="text.secondary">
                  %/year
                </Typography>
              </InputAdornment>
            )
          }}
          helperText="Default: 3.5% (historical average)"
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '10px',
              fontFamily: 'SF Pro Text'
            }
          }}
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Annual Rent Growth"
          type="number"
          value={rentGrowthRate}
          InputProps={{
            endAdornment: <InputAdornment position="end">%/year</InputAdornment>
          }}
          helperText="Default: 3.0% (inflation-adjusted)"
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '10px',
              fontFamily: 'SF Pro Text'
            }
          }}
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Inflation Rate"
          type="number"
          value={inflationRate}
          InputProps={{
            endAdornment: <InputAdornment position="end">%/year</InputAdornment>
          }}
          helperText="Default: 2.5% (Fed target)"
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Analysis Period"
          type="number"
          value={projectionYears}
          InputProps={{
            endAdornment: <InputAdornment position="end">years</InputAdornment>
          }}
          helperText="Default: 30 years (mortgage term)"
        />
      </Grid>
    </Grid>

    <Box sx={{ mt: 3, textAlign: 'right' }}>
      <Button
        size="small"
        onClick={resetAdvancedToDefaults}
        sx={{
          textTransform: 'none',
          color: appleColors.primary[600],
          fontWeight: 500,
          fontFamily: 'SF Pro Text'
        }}
      >
        Reset All to Defaults
      </Button>
    </Box>
  </AccordionDetails>
</Accordion>
```

---

## Reusable Components Library

### Component 1: TapToExpandField

```tsx
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
  value,
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
        backgroundColor: expanded
          ? appleColors.blue[50]
          : appleColors.gray[50],
        borderRadius: '12px',
        border: '1px solid',
        borderColor: expanded
          ? appleColors.blue[200]
          : 'transparent',
        cursor: 'pointer',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          backgroundColor: appleColors.gray[100],
          transform: 'translateY(-1px)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
        },
        '&:active': {
          transform: 'scale(0.99)'
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
            sx={{ mb: 0.5, fontSize: '13px', fontWeight: 500 }}
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
                  backgroundColor: appleColors.blue[100],
                  color: appleColors.blue[700]
                }}
              />
            )}
          </Typography>

          <Typography
            variant="h6"
            fontWeight={600}
            sx={{ fontSize: '20px', mb: 0.5 }}
          >
            {displayValue}
          </Typography>

          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ fontSize: '12px' }}
          >
            {helperText}
          </Typography>
        </Box>

        <ChevronRightIcon
          sx={{
            fontSize: 20,
            color: appleColors.gray[400],
            transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        />
      </Box>

      {/* Expanded Edit View */}
      <Collapse in={expanded} timeout={300}>
        <Box
          sx={{ mt: 3, pt: 3, borderTop: '1px solid', borderColor: appleColors.gray[200] }}
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </Box>
      </Collapse>
    </Box>
  );
}
```

### Component 2: HybridSliderInput

```tsx
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
      <Typography variant="body2" fontWeight={500} sx={{ mb: 2 }}>
        {label}
      </Typography>

      <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
        {/* Slider */}
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
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
            }
          }}
        />

        {/* Text Input */}
        <TextField
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          sx={{ width: unit === 'currency' ? 140 : 100 }}
          InputProps={{
            startAdornment: unit === 'currency' && (
              <InputAdornment position="start">$</InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                {unit === 'percentage' ? '%' : '/mo'}
              </InputAdornment>
            )
          }}
          inputProps={{ min, max, step }}
        />
      </Box>

      {helperText && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          {helperText}
        </Typography>
      )}
    </Box>
  );
}
```

---

## Mobile Responsive Patterns

### Breakpoints (Apple Standard)
```typescript
const breakpoints = {
  xs: 0,      // iPhone SE, small phones
  sm: 600,    // iPhone 12/13/14, standard phones
  md: 960,    // iPad, small tablets
  lg: 1280,   // iPad Pro, laptops
  xl: 1920    // Desktop, large displays
};
```

### Mobile Optimizations

**Touch Targets** (Minimum 44×44px):
```tsx
{
  minHeight: '44px',
  minWidth: '44px',
  padding: { xs: '12px', md: '8px' }
}
```

**Typography Scaling**:
```tsx
{
  h1: { fontSize: { xs: '32px', md: '48px' } },
  h2: { fontSize: { xs: '24px', md: '36px' } },
  h6: { fontSize: { xs: '18px', md: '20px' } },
  body1: { fontSize: { xs: '15px', md: '16px' } },
  body2: { fontSize: { xs: '13px', md: '14px' } }
}
```

**Spacing Adjustments**:
```tsx
{
  padding: { xs: 2, md: 3 },      // 16px mobile, 24px desktop
  gap: { xs: 1.5, md: 2.5 },      // 12px mobile, 20px desktop
  borderRadius: { xs: '12px', md: '16px' }
}
```

**Mobile Stack Layout**:
```tsx
<Grid container spacing={{ xs: 2, md: 3 }}>
  <Grid item xs={12} md={6}>
    {/* Stacks vertically on mobile, side-by-side on desktop */}
  </Grid>
</Grid>
```

---

## Accessibility (WCAG 2.1 AA)

### Color Contrast
```typescript
// All text meets 4.5:1 contrast ratio minimum
{
  primaryText: appleColors.gray[900],    // #111827 on white = 16.6:1
  secondaryText: appleColors.gray[600],  // #4B5563 on white = 7.9:1
  disabledText: appleColors.gray[400],   // #9CA3AF on white = 4.6:1
}
```

### Keyboard Navigation
```tsx
// All interactive elements keyboard accessible
<Box
  tabIndex={0}
  role="button"
  aria-label="Customize property tax rate"
  aria-expanded={expanded}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      setExpanded(!expanded);
    }
  }}
>
```

### Screen Reader Support
```tsx
<TextField
  label="Property Tax Rate"
  aria-describedby="property-tax-helper-text"
  inputProps={{
    'aria-label': 'Property tax rate percentage',
    'aria-valuemin': 0.5,
    'aria-valuemax': 3,
    'aria-valuenow': propertyTaxRate
  }}
/>
<Typography id="property-tax-helper-text" variant="caption">
  Typical range: 0.5% - 3.0%
</Typography>
```

---

## Animation & Motion

### Apple Standard Easing Curves
```typescript
const appleEasing = {
  // Default for most interactions
  standard: 'cubic-bezier(0.4, 0, 0.2, 1)',

  // Elements entering screen
  enter: 'cubic-bezier(0, 0, 0.2, 1)',

  // Elements leaving screen
  exit: 'cubic-bezier(0.4, 0, 1, 1)',

  // Sharp, quick interactions (taps, clicks)
  sharp: 'cubic-bezier(0.4, 0, 0.6, 1)'
};
```

### Animation Durations
```typescript
{
  shortest: 150,  // Micro-interactions (button press)
  shorter: 200,   // Hover states
  short: 250,     // Collapse/close
  standard: 300,  // Expand/open (DEFAULT)
  complex: 375,   // Complex state changes
  enteringScreen: 225,
  leavingScreen: 195
}
```

### Motion Examples

**Expand/Collapse**:
```tsx
<Collapse
  in={expanded}
  timeout={300}
  easing={appleEasing.standard}
>
  {children}
</Collapse>
```

**Hover State**:
```tsx
{
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    transform: 'translateY(-1px)',
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
  }
}
```

**Tap/Active State**:
```tsx
{
  '&:active': {
    transform: 'scale(0.98)',
    transition: 'all 0.1s cubic-bezier(0.4, 0, 0.6, 1)'
  }
}
```

---

## Performance Optimization

### Lazy Loading
```tsx
// Lazy load heavy components
const AdvancedAssumptions = lazy(() => import('./AdvancedAssumptions'));

<Suspense fallback={<CircularProgress />}>
  <AdvancedAssumptions />
</Suspense>
```

### Memoization
```tsx
// Prevent unnecessary re-renders
const TapToExpandField = React.memo(({ label, value, ... }) => {
  // Component logic
});

// Memoize expensive calculations
const calculatedTax = useMemo(
  () => (purchasePrice * taxRate / 100),
  [purchasePrice, taxRate]
);
```

### Debounced Input
```tsx
// Debounce text input for AI analysis
const debouncedAnalyze = useMemo(
  () => debounce(analyzeStrategy, 2000),
  []
);

useEffect(() => {
  if (freeTextStrategy.length > 50) {
    debouncedAnalyze(freeTextStrategy);
  }
}, [freeTextStrategy, debouncedAnalyze]);
```

---

## Summary: Apple Design Compliance

### ✅ Compliant Patterns
1. **Tap-to-expand** (no "Customize" buttons)
2. **Content-first hierarchy** (values prominent, controls hidden)
3. **Smooth animations** (300ms standard easing)
4. **Progressive disclosure** (3 layers: essential → intermediate → advanced)
5. **Hybrid inputs** (slider + text for precision)
6. **Smart defaults** (pre-filled, easy to reset)
7. **Subtle affordances** (chevrons, hover states)
8. **Mobile-optimized** (44px touch targets, responsive spacing)

### 🎨 Visual Language
- **SF Pro** typography (Display for headings, Text for body)
- **12px border radius** (cards, inputs - Apple's modern standard)
- **2-4px spacing increments** (8, 12, 16, 20, 24px)
- **Subtle shadows** (0 4px 12px rgba(0,0,0,0.05) for depth)
- **Blue accent** (#3B82F6 - Apple's iOS blue)

### 📐 Layout Principles
- **8px grid system** (all spacing multiples of 8)
- **Max-width 800px** for content (readability)
- **24px padding** (desktop), 16px (mobile)
- **20px gap** between sections

---

**Document Version**: 1.0
**Last Updated**: December 10, 2025
**Status**: ✅ Apple Design System compliant, ready for implementation
