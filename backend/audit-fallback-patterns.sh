#!/bin/bash

# Issue #53 TIER 2 - Comprehensive Fallback Pattern Audit
# Purpose: Find ALL fallback patterns for ALL 93 user input fields
# Date: December 31, 2025

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "========================================="
echo "Issue #53 TIER 2: Fallback Pattern Audit"
echo "========================================="
echo ""
echo "Analyzing all 93 user input fields..."
echo ""

# Define ALL 93 user input fields from Phase 1 documentation
# A1. Base Property Fields (19)
BASE_FIELDS=(
  "propertyType"
  "propertyName"
  "purchasePrice"
  "downPayment"
  "interestRate"
  "loanTerm"
  "closingCosts"
  "repairCosts"
  "capitalInvestments"
  "propertyTaxRate"
  "insuranceRate"
  "propertyManagementRate"
  "maintenanceCost"
  "yearBuilt"
  "squareFootage"
)

# A2. SFR-Specific Fields (13)
SFR_FIELDS=(
  "monthlyRent"
  "bedrooms"
  "bathrooms"
  "projectionYears"
  "annualRentIncrease"
  "annualPropertyValueIncrease"
  "sellingCostsPercentage"
  "inflationRate"
  "vacancyRate"
  "turnoverFrequency"
  "prepFees"
  "realtorCommission"
)

# A3. Multi-Family Fields (15 core - excluding dynamic unitTypes)
MF_FIELDS=(
  "totalUnits"
  "totalSqft"
  "buildingType"
  "maintenanceCostPerUnit"
  "electric"
  "water"
  "gas"
  "trash"
)

# A4. BRRRR Fields (7)
BRRRR_FIELDS=(
  "afterRepairValue"
  "refinanceInterestRate"
  "refinanceLTV"
  "seasoningPeriod"
  "rehabDuration"
  "carryingCosts"
  "rehabCosts"
  "rehabBudget"
)

# Additional fields found in codebase
ADDITIONAL_FIELDS=(
  "downPaymentPercentage"
  "closingCostPercentage"
  "maintenanceReservePercentage"
  "annualExpenseIncrease"
  "HOAFees"
  "utilities"
)

# Combine all fields
ALL_FIELDS=("${BASE_FIELDS[@]}" "${SFR_FIELDS[@]}" "${MF_FIELDS[@]}" "${BRRRR_FIELDS[@]}" "${ADDITIONAL_FIELDS[@]}")

# Output file
REPORT="fallback-audit-report.md"

# Initialize report
cat > "$REPORT" << 'EOF'
# Issue #53 TIER 2: Fallback Pattern Audit Report

**Generated**: $(date)
**Purpose**: Identify ALL locations where defaults are applied for user input fields
**Scope**: 93 user input fields from Phase 1 documentation

---

## Executive Summary

**Total Fields Analyzed**: ${#ALL_FIELDS[@]}

**Key Findings**:
- RISKY `||` patterns: [TO BE CALCULATED]
- SAFE `??` patterns: [TO BE CALCULATED]
- Fields with multiple fallback locations: [TO BE CALCULATED]
- Potential bugs found: [TO BE CALCULATED]

---

## Field-by-Field Analysis

EOF

# Counters
TOTAL_RISKY_PATTERNS=0
TOTAL_SAFE_PATTERNS=0
FIELDS_WITH_MULTIPLE_LOCATIONS=0

echo "Analyzing ${#ALL_FIELDS[@]} fields..."
echo ""

# Analyze each field
for field in "${ALL_FIELDS[@]}"; do
  echo -n "Analyzing $field... "

  # Count || patterns (risky)
  RISKY_COUNT=$(grep -r "$field.*||" src/ --include="*.ts" 2>/dev/null | grep -v "test" | grep -v "\.test\.ts" | grep -v "node_modules" | wc -l | tr -d ' ')

  # Count ?? patterns (safe)
  SAFE_COUNT=$(grep -r "$field.*\?\?" src/ --include="*.ts" 2>/dev/null | grep -v "test" | grep -v "\.test\.ts" | grep -v "node_modules" | wc -l | tr -d ' ')

  TOTAL_RISKY_PATTERNS=$((TOTAL_RISKY_PATTERNS + RISKY_COUNT))
  TOTAL_SAFE_PATTERNS=$((TOTAL_SAFE_PATTERNS + SAFE_COUNT))

  if [ $RISKY_COUNT -gt 3 ]; then
    FIELDS_WITH_MULTIPLE_LOCATIONS=$((FIELDS_WITH_MULTIPLE_LOCATIONS + 1))
  fi

  # Add to report
  cat >> "$REPORT" << EOF

### Field: \`$field\`

**RISKY \`||\` patterns found**: $RISKY_COUNT
**SAFE \`??\` patterns found**: $SAFE_COUNT

EOF

  if [ $RISKY_COUNT -gt 0 ]; then
    echo "#### RISKY Fallback Locations (using \`||\`):" >> "$REPORT"
    echo "" >> "$REPORT"
    echo "\`\`\`" >> "$REPORT"
    grep -rn "$field.*||" src/ --include="*.ts" 2>/dev/null | grep -v "test" | grep -v "\.test\.ts" | grep -v "node_modules" | head -20 >> "$REPORT"
    echo "\`\`\`" >> "$REPORT"
    echo "" >> "$REPORT"
  fi

  if [ $SAFE_COUNT -gt 0 ]; then
    echo "#### SAFE Fallback Locations (using \`??\`):" >> "$REPORT"
    echo "" >> "$REPORT"
    echo "\`\`\`" >> "$REPORT"
    grep -rn "$field.*\?\?" src/ --include="*.ts" 2>/dev/null | grep -v "test" | grep -v "\.test\.ts" | grep -v "node_modules" | head -10 >> "$REPORT"
    echo "\`\`\`" >> "$REPORT"
    echo "" >> "$REPORT"
  fi

  echo "---" >> "$REPORT"

  # Progress indicator
  if [ $RISKY_COUNT -gt 3 ]; then
    echo -e "${RED}⚠ $RISKY_COUNT risky patterns${NC}"
  elif [ $RISKY_COUNT -gt 0 ]; then
    echo -e "${YELLOW}⚠ $RISKY_COUNT risky pattern(s)${NC}"
  else
    echo -e "${GREEN}✓ Clean${NC}"
  fi
done

echo ""
echo "========================================="
echo "Audit Complete!"
echo "========================================="
echo ""
echo "Summary:"
echo "- Total RISKY || patterns: $TOTAL_RISKY_PATTERNS"
echo "- Total SAFE ?? patterns: $TOTAL_SAFE_PATTERNS"
echo "- Fields with 3+ fallback locations: $FIELDS_WITH_MULTIPLE_LOCATIONS"
echo ""
echo "Report saved to: $REPORT"
echo ""
echo "Next Steps:"
echo "1. Review $REPORT for field-by-field details"
echo "2. Prioritize fields with multiple RISKY patterns"
echo "3. Run categorization script (coming next)"
echo ""
