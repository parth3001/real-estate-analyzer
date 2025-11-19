# E2E Tests - Playwright

## Overview

This directory contains end-to-end tests using **Playwright** instead of Cypress.

**Why Playwright?** Cypress has a critical incompatibility with macOS Sequoia 15.6.1+ due to the `--no-sandbox` flag issue. Playwright works reliably on all macOS versions.

## Gold Standard Test

**File**: `playwright-sfr-gold-standard.js`
**Purpose**: Validates complete SFR analysis wizard flow to ensure Investment Decision Engine is not broken
**Duration**: ~60 seconds
**Status**: ✅ PASSING

### What It Tests

1. Login authentication
2. Navigation to SFR Analysis page
3. Smart Wizard initiation
4. **Wizard Step 1**: Property address entry
5. **Wizard Step 2**: Purchase price & financing
6. **Wizard Step 3**: Rental analysis (defaults)
7. **Wizard Step 4**: Long-term assumptions (defaults)
8. **Wizard Step 5**: Investment goals & strategy (defaults)
9. Analysis submission
10. Results display

### Running the Test

```bash
# Ensure backend and frontend are running
cd backend && npm run dev &
cd frontend && npm run dev &

# Run the test
NODE_PATH=$(pwd)/node_modules node tests/e2e/playwright-sfr-gold-standard.js
```

### Expected Output

```
✅ GOLD STANDARD E2E TEST PASSED

📍 Property: 1837 Walnut Way, Anna, TX 75409
💰 Purchase Price: $245,000

✅ Investment Decision Engine v3.1 VALIDATED
✅ SFR Analysis Wizard Flow Working
✅ All 5 Wizard Steps Completed
✅ Analysis Submitted Successfully
```

### Test Data

- **Address**: 1837 Walnut Way, Anna, TX 75409
- **Purchase Price**: $245,000
- **Down Payment**: 25% (auto-calculated)
- **Other Fields**: Default values

### Troubleshooting

**Error: "Cannot find module 'playwright'"**
```bash
npm install --save-dev playwright
npx playwright install chromium
```

**Error: "Timeout waiting for element"**
- Ensure frontend is running on http://localhost:3000
- Ensure backend is running on http://localhost:3001
- Check browser console for React errors

**Screenshot Locations**
- Success: `/tmp/sfr-e2e-results.png`
- Error: `/tmp/sfr-e2e-error.png`

## Future Tests

Additional E2E tests to add:
- Multi-Family analysis wizard flow
- Manual form entry (non-wizard)
- Saved properties loading
- Portfolio integration

## Migration from Cypress

**Status**: Cypress tests are deprecated due to macOS Sequoia incompatibility.

**DO NOT USE**:
- `cypress/e2e/anna-tx-aggressive-investor-test.cy.js` - BROKEN on macOS Sequoia
- `cypress/e2e/FINAL-verdict-extraction.cy.js` - BROKEN on macOS Sequoia

**USE INSTEAD**:
- `tests/e2e/playwright-sfr-gold-standard.js` - ✅ WORKING on all macOS versions
