import { BasePropertyAnalyzer, AnalysisAssumptions } from './BasePropertyAnalyzer';
import { FinancialCalculations } from '../utils/financialCalculations';
import { MultiFamilyData, MultiFamilyMetrics } from '../types/propertyTypes';
import { ExpenseBreakdown, SensitivityAnalysis, AnalysisResult } from '../types/analysis';
import { MarketDataResponse, MarketInsight, InvestmentTimingAnalysis } from '../types/marketData';
import { marketIntelligenceService } from '../services/marketIntelligenceService';
import { logger } from '../utils/logger';
import { ValidationWarning } from '../types/validation';

export class MultiFamilyAnalyzer extends BasePropertyAnalyzer<MultiFamilyData, MultiFamilyMetrics> {
  /**
   * Phase 1: Validation warnings collected during analysis
   * These warnings are returned to the frontend for user feedback
   */
  private validationWarnings: ValidationWarning[] = [];

  /**
   * Story 1.5: Validate property data for consistency
   * Checks for common data quality issues before analysis
   */
  private validatePropertyData(): void {
    console.log('[MF] Story 1.5: Validating property data consistency...');

    // Validation 1: Unit count mismatch (Architect review feedback)
    if (this.data.units && this.data.units.length !== this.data.totalUnits) {
      console.warn(
        `[MF] ⚠️ VALIDATION WARNING: Unit count mismatch detected!\n` +
        `  totalUnits field: ${this.data.totalUnits}\n` +
        `  units[] array length: ${this.data.units.length}\n` +
        `  → Using units[] array length (${this.data.units.length}) for calculations\n` +
        `  → Recommendation: Update totalUnits field to match actual unit count`
      );
    }

    if (this.data.unitTypes) {
      const aggregatedUnitCount = this.data.unitTypes.reduce((sum, type) => sum + type.count, 0);
      if (aggregatedUnitCount !== this.data.totalUnits) {
        console.warn(
          `[MF] ⚠️ VALIDATION WARNING: unitTypes[] count mismatch!\n` +
          `  totalUnits field: ${this.data.totalUnits}\n` +
          `  Sum of unitTypes[].count: ${aggregatedUnitCount}\n` +
          `  → Using aggregated count (${aggregatedUnitCount}) for calculations\n` +
          `  → Recommendation: Verify unit count data accuracy`
        );
      }
    }

    // Validation 2: Square footage mismatch (Architect review feedback)
    if (this.data.units) {
      const totalCalculatedSqft = this.data.units.reduce((sum, unit) => sum + unit.squareFeet, 0);
      const sqftDifference = Math.abs(totalCalculatedSqft - this.data.totalSqft);
      const sqftDifferencePercent = (sqftDifference / this.data.totalSqft) * 100;

      if (sqftDifferencePercent > 5) {
        console.warn(
          `[MF] ⚠️ VALIDATION WARNING: Square footage mismatch detected!\n` +
          `  totalSqft field: ${this.data.totalSqft.toLocaleString()} sq ft\n` +
          `  Sum of units[].squareFeet: ${totalCalculatedSqft.toLocaleString()} sq ft\n` +
          `  Difference: ${sqftDifference.toLocaleString()} sq ft (${sqftDifferencePercent.toFixed(1)}%)\n` +
          `  → Recommendation: Verify property square footage measurements`
        );
      }
    }

    if (this.data.unitTypes) {
      const totalCalculatedSqft = this.data.unitTypes.reduce((sum, type) => sum + (type.sqft * type.count), 0);
      const sqftDifference = Math.abs(totalCalculatedSqft - this.data.totalSqft);
      const sqftDifferencePercent = (sqftDifference / this.data.totalSqft) * 100;

      if (sqftDifferencePercent > 5) {
        console.warn(
          `[MF] ⚠️ VALIDATION WARNING: unitTypes[] square footage mismatch!\n` +
          `  totalSqft field: ${this.data.totalSqft.toLocaleString()} sq ft\n` +
          `  Sum of unitTypes[] sqft: ${totalCalculatedSqft.toLocaleString()} sq ft\n` +
          `  Difference: ${sqftDifference.toLocaleString()} sq ft (${sqftDifferencePercent.toFixed(1)}%)\n` +
          `  → Recommendation: Verify unit type square footage data`
        );
      }
    }

    // Validation 3: Rent reasonability checks
    const units = this.getNormalizedUnits();
    if (units.length > 0) {
      const avgRent = units.reduce((sum, u) => sum + u.currentRent, 0) / units.length;

      units.forEach((unit, index) => {
        if (unit.currentRent <= 0) {
          console.error(
            `[MF] ❌ ERROR: Unit ${index + 1} has invalid rent: $${unit.currentRent}/month\n` +
            `  → Rent must be greater than $0`
          );
        }

        // Warn if rent is >3x or <0.3x average (likely data entry error)
        if (avgRent > 0) {
          const rentRatio = unit.currentRent / avgRent;
          if (rentRatio > 3 || rentRatio < 0.3) {
            console.warn(
              `[MF] ⚠️ VALIDATION WARNING: Unit ${index + 1} rent appears unusual\n` +
              `  Unit rent: $${unit.currentRent.toLocaleString()}/month\n` +
              `  Average rent: $${avgRent.toFixed(2)}/month\n` +
              `  Ratio: ${rentRatio.toFixed(2)}x\n` +
              `  → Recommendation: Verify this rent is correct`
            );
          }
        }
      });
    }

    // Validation 4: Financial data reasonability
    if (this.data.purchasePrice <= 0) {
      console.error('[MF] ❌ ERROR: Purchase price must be greater than $0');
    }

    if (this.data.downPayment < 0) {
      console.error('[MF] ❌ ERROR: Down payment cannot be negative');
    }

    if (this.data.downPayment > this.data.purchasePrice) {
      console.error(
        `[MF] ❌ ERROR: Down payment ($${this.data.downPayment.toLocaleString()}) ` +
        `exceeds purchase price ($${this.data.purchasePrice.toLocaleString()})`
      );
    }

    const downPaymentPercent = (this.data.downPayment / this.data.purchasePrice) * 100;
    if (downPaymentPercent < 15 && this.data.totalUnits >= 5) {
      console.warn(
        `[MF] ⚠️ VALIDATION WARNING: Low down payment for commercial property\n` +
        `  Down payment: ${downPaymentPercent.toFixed(1)}%\n` +
        `  Commercial loans (5+ units) typically require 20-25% down\n` +
        `  → May face financing challenges`
      );
      this.validationWarnings.push({
        severity: 'MEDIUM',
        category: 'FINANCING',
        message: `Low down payment (${downPaymentPercent.toFixed(1)}%) for commercial property`,
        impact: 'May face financing challenges or higher interest rates',
        recommendation: 'Commercial loans (5+ units) typically require 20-25% down payment',
        affectedMetric: 'Financing'
      });
    }

    // Validation 5: Operating expenses reasonability by building type (Phase 1)
    if (this.data.buildingType && this.data.totalUnits > 0) {
      // Calculate monthly operating expenses per unit
      const monthlyTax = (this.data.purchasePrice * (this.data.propertyTaxRate || 0) / 100) / 12;
      const monthlyInsurance = (this.data.purchasePrice * (this.data.insuranceRate || 0) / 100) / 12;
      const monthlyMaintenance = this.data.maintenanceCost || 0;
      const monthlyPropertyMgmt = this.data.propertyManagementRate
        ? (this.getNormalizedUnits().reduce((sum, u) => sum + u.currentRent, 0) * this.data.propertyManagementRate / 100)
        : 0;

      // Calculate total utilities from commonAreaUtilities object
      const monthlyUtilities = this.data.commonAreaUtilities
        ? (this.data.commonAreaUtilities.electric || 0) +
          (this.data.commonAreaUtilities.water || 0) +
          (this.data.commonAreaUtilities.gas || 0) +
          (this.data.commonAreaUtilities.trash || 0)
        : 0;

      const totalMonthlyOpEx = monthlyTax + monthlyInsurance + monthlyMaintenance + monthlyPropertyMgmt + monthlyUtilities;
      const opExPerUnit = totalMonthlyOpEx / this.data.totalUnits;

      // Building type ranges (from Business Reality Check doc)
      const buildingTypeRanges: Record<string, { min: number; max: number; typical: string }> = {
        'GARDEN': { min: 250, max: 400, typical: '$250-400/unit/month' },
        'MID_RISE': { min: 450, max: 700, typical: '$450-700/unit/month' },
        'COMPLEX': { min: 300, max: 500, typical: '$300-500/unit/month' }
      };

      const range = buildingTypeRanges[this.data.buildingType];
      if (range) {
        if (opExPerUnit < range.min) {
          console.warn(
            `[MF] ⚠️ VALIDATION WARNING: Operating expenses appear low for ${this.data.buildingType}\n` +
            `  Operating expenses: $${opExPerUnit.toFixed(2)}/unit/month\n` +
            `  Typical range for ${this.data.buildingType}: ${range.typical}\n` +
            `  → Expenses may be underestimated`
          );
          this.validationWarnings.push({
            severity: 'MEDIUM',
            category: 'OPERATING_EXPENSES',
            message: `Operating expenses ($${opExPerUnit.toFixed(2)}/unit/month) appear low for ${this.data.buildingType} building`,
            impact: `Actual expenses may be ${((range.min - opExPerUnit) * this.data.totalUnits * 12).toFixed(0)} higher annually`,
            recommendation: `Typical range for ${this.data.buildingType}: ${range.typical}. Verify all expense categories are included.`,
            affectedMetric: 'Cash Flow, NOI'
          });
        } else if (opExPerUnit > range.max) {
          console.warn(
            `[MF] ⚠️ VALIDATION WARNING: Operating expenses appear high for ${this.data.buildingType}\n` +
            `  Operating expenses: $${opExPerUnit.toFixed(2)}/unit/month\n` +
            `  Typical range for ${this.data.buildingType}: ${range.typical}\n` +
            `  → Verify expense data accuracy`
          );
          this.validationWarnings.push({
            severity: 'LOW',
            category: 'OPERATING_EXPENSES',
            message: `Operating expenses ($${opExPerUnit.toFixed(2)}/unit/month) appear high for ${this.data.buildingType} building`,
            impact: `Higher expenses will reduce cash flow by $${((opExPerUnit - range.max) * this.data.totalUnits * 12).toFixed(0)}/year`,
            recommendation: `Typical range for ${this.data.buildingType}: ${range.typical}. This may indicate deferred maintenance or premium amenities.`,
            affectedMetric: 'Cash Flow, NOI'
          });
        }
      }
    }

    console.log('[MF] ✅ Data validation complete');
  }

  /**
   * Get normalized unit data - supports both unitTypes[] and units[] input methods
   * Story 1.1: Backward compatible with existing code while enabling granular analysis
   * Story 1.5: Added comprehensive logging and error handling
   */
  private getNormalizedUnits(): Array<{ bedrooms: number; bathrooms: number; squareFeet: number; currentRent: number; marketRent?: number; isVacant?: boolean }> {
    console.log('[MF] getNormalizedUnits: Determining input method...');

    // Method 1: Granular units[] (NEW - preferred for advanced features)
    if (this.data.units && this.data.units.length > 0) {
      console.log(`[MF] ✅ Using granular units[] input (${this.data.units.length} units)`);
      return this.data.units;
    }

    // Method 2: Aggregated unitTypes[] (EXISTING - backward compatible)
    if (this.data.unitTypes && this.data.unitTypes.length > 0) {
      console.log(`[MF] Using aggregated unitTypes[] input (${this.data.unitTypes.length} types)`);

      // Expand unitTypes into individual units for consistent processing
      const expandedUnits: Array<{ bedrooms: number; bathrooms: number; squareFeet: number; currentRent: number }> = [];

      this.data.unitTypes.forEach((unitType, typeIndex) => {
        console.log(`[MF]   Type ${typeIndex + 1}: "${unitType.type}" x${unitType.count}`);

        for (let i = 0; i < unitType.count; i++) {
          // Parse bedroom count from type string (e.g., "2bed/1bath" -> 2)
          const bedroomMatch = unitType.type.match(/(\d+)\s*(bed|br|bedroom)/i);
          const bedrooms = bedroomMatch ? parseInt(bedroomMatch[1]) : 2; // Default to 2

          // Parse bathroom count
          const bathroomMatch = unitType.type.match(/(\d+(?:\.\d+)?)\s*(bath|ba)/i);
          const bathrooms = bathroomMatch ? parseFloat(bathroomMatch[1]) : 1; // Default to 1

          // Warn if using defaults (parsing failed)
          if (!bedroomMatch || !bathroomMatch) {
            console.warn(
              `[MF] ⚠️ Parsing warning for "${unitType.type}":\n` +
              `  Bedrooms: ${bedroomMatch ? bedrooms : bedrooms + ' (default)'}\n` +
              `  Bathrooms: ${bathroomMatch ? bathrooms : bathrooms + ' (default)'}\n` +
              `  → Recommendation: Use format like "2bed/1bath" or "3BR 2BA"`
            );
          }

          expandedUnits.push({
            bedrooms,
            bathrooms,
            squareFeet: unitType.sqft,
            currentRent: unitType.monthlyRent
          });
        }
      });

      console.log(`[MF] ✅ Expanded ${this.data.unitTypes.length} unit types into ${expandedUnits.length} individual units`);
      return expandedUnits;
    }

    // Fallback: No units defined (should not happen in production)
    console.error(
      '[MF] ❌ CRITICAL ERROR: No unit data provided!\n' +
      '  Neither units[] nor unitTypes[] is defined\n' +
      '  → Cannot perform analysis without unit data\n' +
      '  → Returning empty array (calculations will be invalid)'
    );
    return [];
  }

  /**
   * Story 1.5: Override analyze() to add validation before calculation
   * CRITICAL FIX: Override to ensure annualAnalysis.noi matches keyMetrics.noi (EGI-based)
   */
  public analyze() {
    console.log('\n========== MULTI-FAMILY ANALYSIS START ==========');
    console.log(`[MF] Property: ${this.data.totalUnits}-unit building, ${this.data.totalSqft.toLocaleString()} sq ft`);
    console.log(`[MF] Purchase Price: $${this.data.purchasePrice.toLocaleString()}`);
    console.log(`[MF] Down Payment: $${this.data.downPayment.toLocaleString()} (${((this.data.downPayment / this.data.purchasePrice) * 100).toFixed(1)}%)`);

    // Phase 1: Clear previous validation warnings
    this.clearValidationWarnings();

    // Story 1.5: Validate data before analysis
    this.validatePropertyData();

    console.log('[MF] Starting base analysis calculations...\n');

    // Call parent analyze() method
    const result = super.analyze();

    // CRITICAL FIX: Override annualAnalysis.noi with MF-specific EGI-based NOI
    // This ensures annualAnalysis.noi matches keyMetrics.noi (single source of truth)
    const grossIncome = this.calculateGrossIncome(1);
    const effectiveGrossIncome = this.calculateEffectiveGrossIncome(grossIncome);
    const operatingExpenses = this.calculateOperatingExpenses(grossIncome);
    const correctNOI = effectiveGrossIncome - operatingExpenses;

    console.log('\n[MF] ⚠️ CRITICAL FIX: Correcting annualAnalysis.noi to match keyMetrics.noi');
    console.log(`  Base class NOI (vacancy only): $${result.annualAnalysis.noi.toLocaleString()}`);
    console.log(`  MF class NOI (EGI-based with credit loss): $${correctNOI.toLocaleString()}`);
    console.log(`  Difference: $${(result.annualAnalysis.noi - correctNOI).toLocaleString()} (2% credit loss)`);

    // Override annualAnalysis.noi to match keyMetrics.noi
    result.annualAnalysis.noi = correctNOI;

    // Recalculate cash flow based on correct NOI
    const monthlyMortgage = this.calculateMonthlyMortgage();
    const annualDebtService = monthlyMortgage * 12;
    const correctCashFlow = correctNOI - annualDebtService;

    result.annualAnalysis.cashFlow = correctCashFlow;
    result.monthlyAnalysis.cashFlow = correctCashFlow / 12;

    console.log(`  Corrected Annual Cash Flow: $${correctCashFlow.toLocaleString()}`);
    console.log(`  Corrected Monthly Cash Flow: $${(correctCashFlow / 12).toLocaleString()}`);
    console.log('[MF] ✅ Single source of truth restored: annualAnalysis.noi === keyMetrics.noi\n');

    console.log('\n[MF] ✅ Multi-family analysis complete');
    console.log('========== MULTI-FAMILY ANALYSIS END ==========\n');

    return result;
  }

  /**
   * Phase 1: Get validation warnings collected during analysis
   * @returns Array of validation warnings to display to user
   */
  public getValidationWarnings(): ValidationWarning[] {
    return this.validationWarnings;
  }

  /**
   * Phase 1: Clear validation warnings before new analysis
   * Called at the start of analyze() to reset state
   */
  public clearValidationWarnings(): void {
    this.validationWarnings = [];
  }

  protected calculateGrossIncome(year: number): number {
    const growthFactor = Math.pow(1 + this.assumptions.annualRentIncrease / 100, year - 1);
    const units = this.getNormalizedUnits();

    const totalRent = units.reduce((total, unit) => {
      return total + (unit.currentRent * 12 * growthFactor);
    }, 0);

    console.log(`[MF] calculateGrossIncome (Year ${year}):`);
    console.log(`  Units: ${units.length}`);
    console.log(`  Growth Factor: ${growthFactor.toFixed(4)}`);
    console.log(`  Total Gross Income: $${totalRent.toLocaleString()}/year`);

    return totalRent;
  }

  /**
   * Calculate Effective Gross Income (EGI) - CRITICAL NOI FIX (Story 1.2)
   * Formula: EGI = Gross Income - Vacancy Loss - Credit Loss
   *
   * IMPORTANT: Vacancy reduces INCOME, not added to expenses
   */
  protected calculateEffectiveGrossIncome(grossIncome: number): number {
    const vacancyLoss = grossIncome * (this.assumptions.vacancyRate / 100);
    const creditLoss = grossIncome * 0.02; // 2% bad debt (industry standard)

    console.log('[MF] Gross Income:', grossIncome.toFixed(2));
    console.log('[MF] Vacancy Loss (5%):', vacancyLoss.toFixed(2));
    console.log('[MF] Credit Loss (2%):', creditLoss.toFixed(2));
    console.log('[MF] Effective Gross Income:', (grossIncome - vacancyLoss - creditLoss).toFixed(2));

    return grossIncome - vacancyLoss - creditLoss;
  }

  /**
   * Calculate Operating Expenses - CRITICAL NOI FIX (Story 1.2)
   *
   * IMPORTANT: Vacancy is NOT an operating expense - it reduces income
   * Operating expenses = Property Tax + Insurance + Management + Maintenance + Utilities + CapEx + Common Area Reserves + Turnover
   *
   * FIX (Issue #4): Now includes ALL expenses to match calculateProjections():
   * - Common Area Reserves (2% of EGI)
   * - Turnover Costs
   */
  protected calculateOperatingExpenses(grossIncome: number): number {
    const { purchasePrice, propertyTaxRate, insurancePerUnit, propertyManagementRate, maintenanceCostPerUnit, totalUnits } = this.data;

    // Calculate EGI first (needed for CapEx and Common Area Reserves)
    const effectiveGrossIncome = this.calculateEffectiveGrossIncome(grossIncome);

    // Calculate base expenses (NO VACANCY)
    const propertyTax = purchasePrice * (propertyTaxRate / 100);
    const insurance = (insurancePerUnit || 600) * totalUnits; // Annual insurance per unit × total units
    const propertyManagement = grossIncome * (propertyManagementRate / 100);

    // Calculate maintenance based on per-unit cost
    const maintenance = (maintenanceCostPerUnit || 100) * totalUnits * 12;

    // Common area expenses from commonAreaUtilities if present (monthly values, convert to annual)
    let commonAreaUtilities = 0;
    if (this.data.commonAreaUtilities) {
      commonAreaUtilities = (
        (this.data.commonAreaUtilities.electric || 0) +
        (this.data.commonAreaUtilities.water || 0) +
        (this.data.commonAreaUtilities.gas || 0) +
        (this.data.commonAreaUtilities.trash || 0)
      ) * 12; // Convert monthly to annual
    }

    // ✅ FIX: CapEx reserves should use EGI, not gross income (6% of EGI - Fannie Mae/Freddie Mac standard)
    const MF_CAPEX_RESERVE_RATE = 6;
    const capExReserves = effectiveGrossIncome * MF_CAPEX_RESERVE_RATE / 100;

    // ✅ FIX: Common area reserves (2% of EGI - industry standard for replacement reserves)
    const MF_COMMON_AREA_RESERVE_RATE = 2;
    const commonAreaReserves = effectiveGrossIncome * MF_COMMON_AREA_RESERVE_RATE / 100;

    // ✅ FIX: Turnover costs (matching calculateProjections logic)
    const turnoverFrequency = this.assumptions.turnoverFrequency || 3;
    const turnoverRate = 1 / turnoverFrequency;
    const prepFees = this.data.tenantTurnoverFees?.prepFees || 500;
    const realtorCommission = this.data.tenantTurnoverFees?.realtorCommission || 0.5;
    const monthlyRent = grossIncome / 12;
    const turnoverCosts = (prepFees + (monthlyRent * realtorCommission)) * turnoverRate;

    const totalExpenses = propertyTax + insurance + propertyManagement + maintenance +
                         commonAreaUtilities + capExReserves + commonAreaReserves + turnoverCosts;

    console.log('[MF] Operating Expenses (FIXED - Issue #4):');
    console.log('  Property Tax:', propertyTax.toFixed(2));
    console.log('  Insurance:', insurance.toFixed(2));
    console.log('  Property Management:', propertyManagement.toFixed(2));
    console.log('  Maintenance:', maintenance.toFixed(2));
    console.log('  Common Area Utilities:', commonAreaUtilities.toFixed(2));
    console.log('  CapEx Reserves (6% of EGI):', capExReserves.toFixed(2));
    console.log('  Common Area Reserves (2% of EGI):', commonAreaReserves.toFixed(2));
    console.log('  Turnover Costs:', turnoverCosts.toFixed(2));
    console.log('  Total (NO VACANCY):', totalExpenses.toFixed(2));

    return totalExpenses;
  }

  /**
   * Issue #5: Calculate per-unit-type financial metrics for Unit Mix Analysis
   *
   * Returns profitability breakdown by unit type (not averaged)
   * Example: 2BR units vs 1BR units - which is more profitable?
   *
   * @returns Array of per-unit-type metrics with income, opex, NOI, cash flow
   */
  private calculatePerUnitTypeMetrics(
    totalGrossIncome: number,
    totalOperatingExpenses: number,
    totalDebtService: number
  ): Array<{
    unitType: string;
    income: number;
    opex: number;
    noi: number;
    cashFlow: number;
  }> {
    const unitTypes = this.data.unitTypes || [];

    if (unitTypes.length === 0) {
      console.log('[MF] No unitTypes data available for per-unit-type metrics');
      return [];
    }

    console.log('\n[MF] ========== PER-UNIT-TYPE METRICS CALCULATION (Issue #5) ==========');

    return unitTypes.map(unit => {
      // Calculate annual gross income for this unit type
      const unitTypeGrossIncome = unit.monthlyRent * unit.count * 12;

      // Calculate proportional operating expenses
      // Operating expenses are proportional to income (industry standard approach)
      const opexRatio = totalOperatingExpenses / totalGrossIncome;
      const unitTypeOpex = unitTypeGrossIncome * opexRatio;

      // Calculate per-unit metrics for this unit type
      const perUnitIncome = unitTypeGrossIncome / unit.count;
      const perUnitOpex = unitTypeOpex / unit.count;
      const perUnitNOI = perUnitIncome - perUnitOpex;

      // Debt service is allocated equally per unit (standard approach)
      const perUnitDebtService = totalDebtService / this.data.totalUnits;
      const perUnitCashFlow = perUnitNOI - perUnitDebtService;

      console.log(`[MF] ${unit.type} (${unit.count} units @ $${unit.monthlyRent}/mo):`);
      console.log(`  Annual Income per Unit: $${perUnitIncome.toLocaleString()}`);
      console.log(`  Annual OpEx per Unit: $${perUnitOpex.toLocaleString()}`);
      console.log(`  Annual NOI per Unit: $${perUnitNOI.toLocaleString()}`);
      console.log(`  Annual Cash Flow per Unit: $${perUnitCashFlow.toLocaleString()}`);

      return {
        unitType: unit.type,
        income: perUnitIncome,
        opex: perUnitOpex,
        noi: perUnitNOI,
        cashFlow: perUnitCashFlow
      };
    });
  }

  protected calculatePropertySpecificMetrics(): MultiFamilyMetrics {
    console.log('\n[MF] ========== PROPERTY-SPECIFIC METRICS CALCULATION ==========');

    const monthlyMortgage = this.calculateMonthlyMortgage();
    const annualDebtService = monthlyMortgage * 12;
    const grossIncome = this.calculateGrossIncome(1);
    const effectiveGrossIncome = this.calculateEffectiveGrossIncome(grossIncome);
    const operatingExpenses = this.calculateOperatingExpenses(grossIncome);

    // CRITICAL: NOI = EGI - Operating Expenses (NOT Gross Income - Operating Expenses)
    const noi = effectiveGrossIncome - operatingExpenses;

    console.log('[MF] NOI Calculation (Story 1.2 - CRITICAL FIX):');
    console.log('  Gross Income:', `$${grossIncome.toLocaleString()}`);
    console.log('  EGI (after vacancy + credit loss):', `$${effectiveGrossIncome.toLocaleString()}`);
    console.log('  Operating Expenses:', `$${operatingExpenses.toLocaleString()}`);
    console.log('  NOI:', `$${noi.toLocaleString()}`);

    const cashFlow = FinancialCalculations.calculateCashFlow(noi, annualDebtService);
    const totalInvestment = this.data.downPayment + (this.data.closingCosts || 0) + (this.data.capitalInvestments || 0);

    console.log('[MF] Cash Flow Calculation:');
    console.log('  NOI:', `$${noi.toLocaleString()}`);
    console.log('  Annual Debt Service:', `$${annualDebtService.toLocaleString()}`);
    console.log('  Cash Flow:', `$${cashFlow.toLocaleString()}/year ($${(cashFlow / 12).toLocaleString()}/month)`);

    // Calculate IRR or use a default if calculation fails
    let irr = -99;
    try {
      irr = FinancialCalculations.calculateIRR(this.getIRRCashFlows());
      console.log('[MF] IRR:', `${irr.toFixed(2)}%`);
    } catch (error) {
      console.error('[MF] ❌ ERROR calculating IRR:', error);
      console.warn('[MF] ⚠️ Using default IRR value of -99');
    }

    const loanAmount = this.data.purchasePrice - this.data.downPayment;
    console.log('[MF] Loan Details:');
    console.log('  Loan Amount:', `$${loanAmount.toLocaleString()}`);
    console.log('  Interest Rate:', `${this.data.interestRate}%`);
    console.log('  Loan Term:', `${this.data.loanTerm} years`);
    console.log('  Monthly Payment:', `$${monthlyMortgage.toLocaleString()}`);

    // Calculate per-unit metrics
    const pricePerUnit = this.data.purchasePrice / this.data.totalUnits;
    const noiPerUnit = noi / this.data.totalUnits;
    const cashFlowPerUnit = cashFlow / this.data.totalUnits;
    const averageRentPerUnit = grossIncome / (this.data.totalUnits * 12);

    console.log('\n[MF] Per-Unit Metrics:');
    console.log('  Price per Unit:', `$${pricePerUnit.toLocaleString()}`);
    console.log('  NOI per Unit:', `$${noiPerUnit.toLocaleString()}/year`);
    console.log('  Cash Flow per Unit:', `$${cashFlowPerUnit.toLocaleString()}/year`);
    console.log('  Average Rent per Unit:', `$${averageRentPerUnit.toLocaleString()}/month`);

    // Calculate common metrics
    const capRate = this.calculateCapRate(noi);
    const cashOnCashReturn = this.calculateCashOnCashReturn(cashFlow, totalInvestment);
    const dscr = this.calculateDSCR(noi, annualDebtService);
    const operatingExpenseRatio = FinancialCalculations.calculateOperatingExpenseRatio(
      operatingExpenses,
      effectiveGrossIncome
    );

    console.log('\n[MF] Key Investment Metrics:');
    console.log('  Cap Rate:', `${capRate.toFixed(2)}%`);
    console.log('  Cash-on-Cash Return:', `${cashOnCashReturn.toFixed(2)}%`);
    console.log('  DSCR:', dscr.toFixed(2));
    console.log('  Operating Expense Ratio:', `${operatingExpenseRatio.toFixed(2)}%`);

    // Calculate advanced MF metrics (Story 1.4 - extracted to dedicated methods)
    console.log('\n[MF] ========== ADVANCED MF METRICS (STORY 1.4) ==========');
    const grm = this.calculateGrossRentMultiplier(this.data.purchasePrice, grossIncome);
    const debtYield = this.calculateDebtYield(noi, loanAmount);
    const breakEvenOccupancy = this.calculateBreakEvenOccupancy(operatingExpenses, annualDebtService, grossIncome);
    const rentPerSqft = this.calculateRentPerSqft(grossIncome, this.data.totalSqft);
    const grossYield = this.calculateGrossYield(grossIncome, this.data.purchasePrice);
    console.log('[MF] ========== END ADVANCED MF METRICS ==========');

    // Calculate per-unit-type metrics (Issue #5 - Story 4.2 Unit Mix Analysis)
    const perUnitTypeMetrics = this.calculatePerUnitTypeMetrics(
      grossIncome,
      operatingExpenses,
      annualDebtService
    );

    const metrics: MultiFamilyMetrics = {
      noi,
      capRate,
      cashOnCashReturn,
      irr,
      dscr,
      operatingExpenseRatio,
      totalInvestment,

      // Per-unit metrics (averaged across all units)
      pricePerUnit,
      pricePerSqft: FinancialCalculations.calculatePricePerSqFt(
        this.data.purchasePrice,
        this.data.totalSqft
      ),
      noiPerUnit,
      cashFlowPerUnit,
      averageRentPerUnit,
      operatingExpensePerUnit: operatingExpenses / this.data.totalUnits,

      // Per-unit-type metrics (Issue #5 - Story 4.2 Unit Mix Analysis)
      // Breakdown by unit type (2BR vs 1BR, etc.) for profitability comparison
      perUnitTypeMetrics,

      // Advanced MF metrics (Story 1.4 - placeholders for now, will implement in Story 1.4)
      grm,
      debtYield,
      breakEvenOccupancy,
      rentPerSqft,
      unitMixEfficiency: this.calculateUnitMixEfficiency(),
      economicVacancyRate: this.calculateEconomicVacancyRate(grossIncome, effectiveGrossIncome),
      grossYield,

      // Efficiency metrics
      commonAreaExpenseRatio: this.calculateCommonAreaExpenseRatio(),

      // Context fields for NOI calculation clarity
      effectiveGrossIncome,
      grossIncome,
      operatingExpenses
    };

    console.log('\n[MF] ✅ Property-specific metrics calculated successfully');
    console.log('[MF] ========== END METRICS CALCULATION ==========\n');

    return metrics;
  }

  /**
   * Get expense breakdown for display purposes
   * NOTE: Vacancy is shown separately as an income reduction, NOT as an expense
   */
  protected getExpenseBreakdown(grossIncome: number): ExpenseBreakdown {
    const { purchasePrice, propertyTaxRate, insurancePerUnit, propertyManagementRate, maintenanceCostPerUnit, totalUnits } = this.data;

    // Calculate monthly expenses (NO VACANCY)
    const propertyTax = (purchasePrice * (propertyTaxRate / 100)) / 12;
    const insurance = ((insurancePerUnit || 600) * totalUnits) / 12; // Annual insurance per unit ÷ 12
    const propertyManagement = (grossIncome * (propertyManagementRate / 100)) / 12;
    const maintenance = ((maintenanceCostPerUnit || 100) * totalUnits);

    // Common area utilities (already monthly from input data)
    let utilities = 0;
    let commonAreaElectricity = 0;
    let waterSewer = 0;
    let garbage = 0;

    if (this.data.commonAreaUtilities) {
      commonAreaElectricity = this.data.commonAreaUtilities.electric || 0;
      waterSewer = this.data.commonAreaUtilities.water || 0;
      utilities = this.data.commonAreaUtilities.gas || 0;
      garbage = this.data.commonAreaUtilities.trash || 0;
    }

    // CapEx - 6% of monthly gross income
    const capEx = (grossIncome / 12) * 0.06;

    // Vacancy is shown as 0 in expense breakdown (it's an income reduction, not an expense)
    const vacancy = 0;
    
    return {
      propertyTax,
      insurance,
      maintenance,
      propertyManagement,
      vacancy,
      utilities,
      commonAreaElectricity,
      landscaping: 0,
      waterSewer,
      garbage,
      marketingAndAdvertising: 0,
      repairsAndMaintenance: maintenance,
      capEx,
      other: 0
    };
  }

  private calculateCommonAreaExpenseRatio(): number {
    if (!this.data.commonAreaUtilities || !this.data.totalSqft) return 0;
    
    const commonAreaExpenses = 
      (this.data.commonAreaUtilities.electric || 0) +
      (this.data.commonAreaUtilities.water || 0) +
      (this.data.commonAreaUtilities.gas || 0) +
      (this.data.commonAreaUtilities.trash || 0);
      
    return this.data.totalSqft > 0 ? (commonAreaExpenses / this.data.totalSqft) * 100 : 0;
  }

  /**
   * Calculate Gross Rent Multiplier (Story 1.4)
   * Quick valuation metric comparing price to gross rental income
   *
   * Formula: GRM = Purchase Price / Gross Annual Income
   * Benchmark: 4-7 is typical for residential MF properties
   * Lower GRM = Better value (paying less per dollar of income)
   */
  private calculateGrossRentMultiplier(purchasePrice: number, grossIncome: number): number {
    if (grossIncome <= 0) {
      console.warn('[MF] ⚠️ Cannot calculate GRM: grossIncome is zero');
      return 0;
    }

    const grm = purchasePrice / grossIncome;

    console.log('[MF] Gross Rent Multiplier (GRM) Calculation:');
    console.log('  Purchase Price:', `$${purchasePrice.toLocaleString()}`);
    console.log('  Gross Annual Income:', `$${grossIncome.toLocaleString()}`);
    console.log('  GRM:', grm.toFixed(2));

    if (grm < 4) {
      console.warn(
        `[MF] ⚠️ Unusually low GRM (${grm.toFixed(2)})\n` +
        `  Typical range: 4-7\n` +
        `  → May indicate below-market rents or overestimated income`
      );
    } else if (grm > 7) {
      console.warn(
        `[MF] ⚠️ High GRM (${grm.toFixed(2)})\n` +
        `  Typical range: 4-7\n` +
        `  → Property may be overpriced relative to income potential`
      );
    }

    return grm;
  }

  /**
   * Calculate Debt Yield (Story 1.4)
   * Lender's risk metric - NOI as percentage of loan amount
   *
   * Formula: Debt Yield = (NOI / Loan Amount) * 100
   * Lender Requirement: Typically 10%+ for commercial loans
   * Higher = Better (less risky for lender)
   */
  private calculateDebtYield(noi: number, loanAmount: number): number {
    if (loanAmount <= 0) {
      console.warn(
        '[MF] ⚠️ Cannot calculate Debt Yield: loanAmount is zero\n' +
        '  → Property purchased with 100% cash (no debt)'
      );
      return 0;
    }

    if (noi < 0) {
      console.warn(
        `[MF] ⚠️ Negative NOI detected: $${noi.toLocaleString()}\n` +
        '  → Property is losing money\n' +
        '  → Debt Yield will be negative'
      );
    }

    const debtYield = (noi / loanAmount) * 100;

    console.log('[MF] Debt Yield Calculation:');
    console.log('  NOI:', `$${noi.toLocaleString()}`);
    console.log('  Loan Amount:', `$${loanAmount.toLocaleString()}`);
    console.log('  Debt Yield:', `${debtYield.toFixed(2)}%`);

    if (debtYield < 10 && debtYield > 0) {
      console.warn(
        `[MF] ⚠️ Low debt yield (${debtYield.toFixed(2)}%)\n` +
        `  Lenders typically require 10%+ for commercial loans\n` +
        `  → May face financing challenges or require larger down payment`
      );
    }

    return debtYield;
  }

  /**
   * Calculate Break-Even Occupancy (Story 1.4)
   * Minimum occupancy needed to cover expenses + debt service
   *
   * Formula: BEO = ((Operating Expenses + Debt Service) / Gross Income) * 100
   * Lower = Better (more cushion for vacancy)
   * Typical: 60-75% for stable properties
   */
  private calculateBreakEvenOccupancy(operatingExpenses: number, annualDebtService: number, grossIncome: number): number {
    if (grossIncome <= 0) {
      console.warn('[MF] ⚠️ Cannot calculate Break-Even Occupancy: grossIncome is zero');
      return 0;
    }

    const breakEvenOccupancy = ((operatingExpenses + annualDebtService) / grossIncome) * 100;

    console.log('[MF] Break-Even Occupancy Calculation:');
    console.log('  Operating Expenses:', `$${operatingExpenses.toLocaleString()}`);
    console.log('  Annual Debt Service:', `$${annualDebtService.toLocaleString()}`);
    console.log('  Gross Annual Income:', `$${grossIncome.toLocaleString()}`);
    console.log('  Break-Even Occupancy:', `${breakEvenOccupancy.toFixed(2)}%`);

    if (breakEvenOccupancy > 85) {
      console.warn(
        `[MF] ⚠️ High break-even occupancy (${breakEvenOccupancy.toFixed(2)}%)\n` +
        `  Typical range: 60-75%\n` +
        `  → Very little cushion for vacancy - risky investment`
      );
    } else if (breakEvenOccupancy < 60) {
      console.log(
        `[MF] ✅ Excellent break-even occupancy (${breakEvenOccupancy.toFixed(2)}%)\n` +
        `  → Strong cushion for vacancy and market fluctuations`
      );
    }

    return breakEvenOccupancy;
  }

  /**
   * Calculate Rent per Square Foot (Story 1.4)
   * Market comparison metric - monthly rent per square foot
   *
   * Formula: Rent/SF = (Gross Monthly Income / Total Square Feet)
   * Used for market comparisons and unit mix analysis
   */
  private calculateRentPerSqft(grossIncome: number, totalSqft: number): number {
    if (totalSqft <= 0) {
      console.warn('[MF] ⚠️ Cannot calculate Rent per Sq Ft: totalSqft is zero');
      return 0;
    }

    const rentPerSqft = (grossIncome / 12) / totalSqft;

    console.log('[MF] Rent per Square Foot Calculation:');
    console.log('  Gross Monthly Income:', `$${(grossIncome / 12).toLocaleString()}`);
    console.log('  Total Square Feet:', `${totalSqft.toLocaleString()} sq ft`);
    console.log('  Rent per Sq Ft:', `$${rentPerSqft.toFixed(2)}/month`);

    return rentPerSqft;
  }

  /**
   * Calculate Gross Yield (Story 1.4)
   * Annual rental income as percentage of purchase price
   *
   * Formula: Gross Yield = (Gross Annual Income / Purchase Price) * 100
   * Does NOT account for expenses - use Cap Rate for net yield
   * Benchmark: 8-12% typical for MF properties
   */
  private calculateGrossYield(grossIncome: number, purchasePrice: number): number {
    if (purchasePrice <= 0) {
      console.warn('[MF] ⚠️ Cannot calculate Gross Yield: purchasePrice is zero');
      return 0;
    }

    const grossYield = (grossIncome / purchasePrice) * 100;

    console.log('[MF] Gross Yield Calculation:');
    console.log('  Gross Annual Income:', `$${grossIncome.toLocaleString()}`);
    console.log('  Purchase Price:', `$${purchasePrice.toLocaleString()}`);
    console.log('  Gross Yield:', `${grossYield.toFixed(2)}%`);

    if (grossYield < 6) {
      console.warn(
        `[MF] ⚠️ Low gross yield (${grossYield.toFixed(2)}%)\n` +
        `  Typical range: 8-12%\n` +
        `  → Income may be below market or property overpriced`
      );
    }

    return grossYield;
  }

  /**
   * Calculate Unit Mix Efficiency (Story 1.4)
   * Measures how well current unit mix captures market potential
   *
   * Formula: (Current Rent / Market Rent Potential) * 100
   * 100% = Fully optimized, <100% = Revenue opportunity, >100% = Above market
   */
  private calculateUnitMixEfficiency(): number {
    const units = this.getNormalizedUnits();

    if (units.length === 0) {
      console.warn('[MF] ⚠️ Cannot calculate Unit Mix Efficiency: no units defined');
      return 0;
    }

    const currentRent = units.reduce((total, unit) => total + unit.currentRent, 0);
    const marketRentPotential = units.reduce((total, unit) => {
      return total + (unit.marketRent || unit.currentRent);
    }, 0);

    if (marketRentPotential === 0) {
      console.warn('[MF] ⚠️ Cannot calculate Unit Mix Efficiency: no market rent data');
      return 100;
    }

    const efficiency = (currentRent / marketRentPotential) * 100;

    console.log('[MF] Unit Mix Efficiency Calculation:');
    console.log('  Current Monthly Rent:', `$${currentRent.toLocaleString()}`);
    console.log('  Market Rent Potential:', `$${marketRentPotential.toLocaleString()}`);
    console.log('  Efficiency:', `${efficiency.toFixed(2)}%`);

    if (efficiency < 95) {
      const monthlyUpside = marketRentPotential - currentRent;
      console.warn(
        `[MF] ⚠️ Below-market rents detected (${efficiency.toFixed(2)}% efficiency)\n` +
        `  Monthly upside: $${monthlyUpside.toLocaleString()}\n` +
        `  Annual upside: $${(monthlyUpside * 12).toLocaleString()}`
      );
    }

    return efficiency;
  }

  /**
   * Calculate Economic Vacancy Rate (Story 1.4)
   * Measures total income loss from vacancy + credit loss as a percentage
   *
   * Formula: ((Gross Income - EGI) / Gross Income) * 100
   * Includes physical vacancy + credit loss + concessions
   */
  private calculateEconomicVacancyRate(grossIncome: number, effectiveGrossIncome: number): number {
    if (grossIncome <= 0) {
      console.warn('[MF] ⚠️ Cannot calculate Economic Vacancy Rate: grossIncome is zero');
      return 0;
    }

    const totalLoss = grossIncome - effectiveGrossIncome;
    const economicVacancyRate = (totalLoss / grossIncome) * 100;

    console.log('[MF] Economic Vacancy Rate Calculation:');
    console.log('  Gross Potential Income:', `$${grossIncome.toLocaleString()}`);
    console.log('  Effective Gross Income:', `$${effectiveGrossIncome.toLocaleString()}`);
    console.log('  Total Income Loss:', `$${totalLoss.toLocaleString()}`);
    console.log('  Economic Vacancy Rate:', `${economicVacancyRate.toFixed(2)}%`);

    if (economicVacancyRate > 10) {
      console.warn(
        `[MF] ⚠️ High economic vacancy rate (${economicVacancyRate.toFixed(2)}%)\n` +
        `  Typical range: 5-7%\n` +
        `  → Review vacancy assumptions and credit loss estimates`
      );
    }

    return economicVacancyRate;
  }

  /**
   * CRITICAL IRR FIX: Override calculateProjections for MF-specific expenses
   *
   * Base class calculateProjections() only includes basic SFR expenses:
   * - Property tax, insurance, maintenance, property management, turnover
   *
   * MF properties require additional operating expenses:
   * - CapEx reserves (6% of EGI)
   * - Common area utilities (electric, water, gas, trash)
   * - Common area reserves (2% of revenue)
   *
   * Without this override, projections had null cash flows → IRR = 0%
   */
  protected calculateProjections(): import('../types/analysis').YearlyProjection[] {
    const monthlyMortgage = this.calculateMonthlyMortgage();
    const annualDebtService = monthlyMortgage * 12;
    const projections: import('../types/analysis').YearlyProjection[] = [];
    let currentPropertyValue = this.data.purchasePrice;
    let currentLoanBalance = this.data.purchasePrice - this.data.downPayment;

    console.log('\n[MF] ========== MF PROJECTIONS CALCULATION ==========');
    console.log('[MF] Using MultiFamilyAnalyzer override for accurate MF expenses');

    const basePropertyTax = this.data.purchasePrice * (this.data.propertyTaxRate / 100);
    const baseInsurance = (this.data.insurancePerUnit || 600) * this.data.totalUnits; // ✅ FIX: Use insurancePerUnit, not insuranceRate

    for (let year = 1; year <= this.assumptions.projectionYears; year++) {
      console.log(`\n[MF] --- YEAR ${year} PROJECTION ---`);

      // Calculate gross income with rent growth
      const grossIncome = this.calculateGrossIncome(year);

      // Calculate EGI (after vacancy and credit loss)
      const effectiveGrossIncome = this.calculateEffectiveGrossIncome(grossIncome);

      // Expense inflation
      const expenseInflationFactor = Math.pow(1 + (this.assumptions.annualExpenseIncrease || 2.5) / 100, year - 1);

      // Basic expenses (inflated)
      const propertyTax = basePropertyTax * expenseInflationFactor;
      const insurance = baseInsurance * expenseInflationFactor;
      const maintenance = (this.data.maintenanceCostPerUnit || 0) * this.data.totalUnits * 12 * expenseInflationFactor;

      // Income-based expenses
      const propertyManagement = grossIncome * (this.data.propertyManagementRate / 100);

      // MF-SPECIFIC: Common area utilities
      const commonAreaUtilities = this.data.commonAreaUtilities
        ? ((this.data.commonAreaUtilities.electric || 0) +
           (this.data.commonAreaUtilities.water || 0) +
           (this.data.commonAreaUtilities.gas || 0) +
           (this.data.commonAreaUtilities.trash || 0)) * 12 * expenseInflationFactor
        : 0;

      // MF-SPECIFIC: CapEx reserves (6% of EGI - industry standard)
      const MF_CAPEX_RESERVE_RATE = 6; // Fannie Mae/Freddie Mac standard
      const capExReserves = effectiveGrossIncome * MF_CAPEX_RESERVE_RATE / 100;

      // MF-SPECIFIC: Common area reserves (2% of EGI - industry standard)
      const MF_COMMON_AREA_RESERVE_RATE = 2; // Industry standard for replacement reserves
      const commonAreaReserves = effectiveGrossIncome * MF_COMMON_AREA_RESERVE_RATE / 100;

      // Turnover costs
      const turnoverFrequency = this.assumptions.turnoverFrequency || 3;
      const turnoverRate = 1 / turnoverFrequency;
      const prepFees = (this.data.tenantTurnoverFees?.prepFees || 500) * expenseInflationFactor;
      const realtorCommission = this.data.tenantTurnoverFees?.realtorCommission || 0.5;
      const monthlyRent = grossIncome / 12;
      const turnoverCosts = (prepFees + (monthlyRent * realtorCommission)) * turnoverRate;

      // Total operating expenses (MF-complete)
      const operatingExpenses =
        propertyTax +
        insurance +
        maintenance +
        propertyManagement +
        commonAreaUtilities +
        capExReserves +
        commonAreaReserves +
        turnoverCosts;

      // Calculate NOI and Cash Flow
      const noi = effectiveGrossIncome - operatingExpenses;
      const capitalImprovements = year === 1 ? (this.data.capitalInvestments || 0) : 0;
      const cashFlow = noi - annualDebtService - capitalImprovements;

      console.log(`[MF] Year ${year} Complete Calculation:`, {
        grossIncome,
        effectiveGrossIncome,
        operatingExpenses,
        breakdown: {
          propertyTax,
          insurance,
          maintenance,
          propertyManagement,
          commonAreaUtilities,
          capExReserves,
          commonAreaReserves,
          turnoverCosts
        },
        noi,
        annualDebtService,
        capitalImprovements,
        cashFlow
      });

      // Property appreciation
      currentPropertyValue *= (1 + this.assumptions.annualPropertyValueIncrease / 100);

      // Mortgage amortization
      const interestPaid = currentLoanBalance * (this.data.interestRate / 100);
      const principalPaid = annualDebtService - interestPaid;
      currentLoanBalance = Math.max(0, currentLoanBalance - principalPaid);

      const vacancyAmount = grossIncome * (this.assumptions.vacancyRate / 100);
      const appreciation = currentPropertyValue - this.data.purchasePrice;

      projections.push({
        year,
        propertyValue: currentPropertyValue,
        grossIncome,
        operatingExpenses,
        noi,
        debtService: annualDebtService,
        cashFlow,
        equity: currentPropertyValue - currentLoanBalance,
        mortgageBalance: currentLoanBalance,
        totalReturn: cashFlow + appreciation,
        propertyTax,
        insurance,
        maintenance,
        propertyManagement,
        vacancy: vacancyAmount,
        realtorBrokerageFee: 0,
        grossRent: grossIncome,
        appreciation,
        turnoverCosts,
        capitalImprovements
      });
    }

    console.log('[MF] ========== PROJECTIONS COMPLETE ==========\n');
    return projections;
  }

  private getIRRCashFlows(): number[] {
    const projections = this.calculateProjections();
    const exitAnalysis = this.calculateExitAnalysis(projections);
    const totalInvestment = this.data.downPayment + (this.data.closingCosts || 0) + (this.data.capitalInvestments || 0);

    const cashFlows = [
      -totalInvestment,
      ...projections.map(year => year.cashFlow),
      exitAnalysis.netProceedsFromSale
    ];

    console.log('[MF] IRR Cash Flows:', cashFlows);

    return cashFlows;
  }

  /**
   * Normalize MF Analysis Output for Frontend (Story 1.3)
   * Flattens nested data structures and ensures all required properties exist
   *
   * Frontend Requirements:
   * - Flat expense object (no nested breakdown)
   * - Monthly income as object (gross, effective, vacancyLoss)
   * - Per-unit metrics readily accessible
   * - Sensitivity analysis included
   */
  private normalizeOutput(result: AnalysisResult<MultiFamilyMetrics>): AnalysisResult<MultiFamilyMetrics> {
    console.log('[MF] Normalizing analysis output for frontend...');

    // Deep clone to avoid mutating original
    const normalized = JSON.parse(JSON.stringify(result)) as AnalysisResult<MultiFamilyMetrics>;

    // Flatten expense breakdown for easier frontend access
    if (normalized.monthlyAnalysis?.expenses?.breakdown) {
      const breakdown = normalized.monthlyAnalysis.expenses.breakdown;

      normalized.monthlyAnalysis.expenses = {
        ...normalized.monthlyAnalysis.expenses,
        propertyTax: breakdown.propertyTax,
        insurance: breakdown.insurance,
        maintenance: breakdown.maintenance,
        propertyManagement: breakdown.propertyManagement,
        commonAreaElectricity: breakdown.commonAreaElectricity || 0,
        waterSewer: breakdown.waterSewer || 0,
        utilities: breakdown.utilities || 0,
        garbage: breakdown.garbage || 0,
        capEx: breakdown.capEx,
        mortgage: normalized.monthlyAnalysis.expenses.debt
          ? { total: normalized.monthlyAnalysis.expenses.debt }
          : (normalized.monthlyAnalysis.expenses as any).mortgage || { total: 0 }
      } as any;
    }

    // Calculate monthly expenses total (MF-specific categories)
    if (normalized.monthlyAnalysis?.expenses) {
      const exp = normalized.monthlyAnalysis.expenses as any;
      normalized.monthlyAnalysis.expenses.total =
        (exp.mortgage?.total || 0) +
        (exp.propertyTax || 0) +
        (exp.insurance || 0) +
        (exp.maintenance || 0) +
        (exp.propertyManagement || 0) +
        (exp.commonAreaElectricity || 0) +
        (exp.waterSewer || 0) +
        (exp.utilities || 0) +
        (exp.garbage || 0) +
        (exp.capEx || 0);
    }

    // Convert monthly income to object (MF has Gross vs EGI distinction)
    if (normalized.monthlyAnalysis?.income && typeof normalized.monthlyAnalysis.income === 'number') {
      const monthlyGross = normalized.keyMetrics.grossIncome / 12;
      const monthlyEffective = normalized.keyMetrics.effectiveGrossIncome / 12;

      normalized.monthlyAnalysis.income = {
        gross: monthlyGross,
        effective: monthlyEffective,
        vacancyLoss: monthlyGross - monthlyEffective
      } as any;
    }

    // Add per-unit metrics for frontend (MF-specific)
    if (normalized.keyMetrics && !('perUnit' in normalized.keyMetrics)) {
      (normalized.keyMetrics as any).perUnit = {
        price: normalized.keyMetrics.pricePerUnit,
        noi: normalized.keyMetrics.noiPerUnit,
        cashFlow: normalized.keyMetrics.cashFlowPerUnit,
        rent: normalized.keyMetrics.averageRentPerUnit,
        operatingExpense: normalized.keyMetrics.operatingExpensePerUnit
      };
    }

    // Add sensitivity analysis
    normalized.sensitivityAnalysis = this.calculateSensitivityAnalysis();

    console.log('[MF] ✅ Output normalized for frontend:', {
      hasMonthlyExpenses: !!normalized.monthlyAnalysis?.expenses,
      hasFlattenedExpenses: !!(normalized.monthlyAnalysis?.expenses as any)?.propertyTax,
      hasIncomeObject: typeof normalized.monthlyAnalysis?.income === 'object',
      hasPerUnitMetrics: !!(normalized.keyMetrics as any)?.perUnit,
      hasSensitivityAnalysis: !!normalized.sensitivityAnalysis
    });

    return normalized;
  }

  /**
   * Fetch Market Data for Multi-Family Property (Story 1.3)
   * Integrates with RentCast for market intelligence and comparable properties
   *
   * Returns:
   * - Market data: Comparable MF properties, cap rates, rent trends
   * - Market insights: "Above/below market" analysis
   * - Investment timing: Buy/hold/wait signals
   */
  private async fetchMarketData(): Promise<{
    marketData: MarketDataResponse | null;
    marketInsights: MarketInsight[];
    investmentTiming: InvestmentTimingAnalysis | null;
  }> {
    try {
      const address = `${this.data.propertyAddress.street}, ${this.data.propertyAddress.city}, ${this.data.propertyAddress.state} ${this.data.propertyAddress.zipCode}`;

      logger.info(`[MF] Fetching market data for multi-family property: ${address} (${this.data.totalUnits} units)`);

      // Fetch comprehensive market data (MF-specific parameters)
      const marketData = await marketIntelligenceService.getComprehensiveMarketData({
        address,
        zipCode: this.data.propertyAddress.zipCode,
        city: this.data.propertyAddress.city,
        state: this.data.propertyAddress.state,
        propertyType: 'Multi-Family', // ← CRITICAL: Multi-family
        includeEconomicData: true,
        maxComparables: 10,
        radius: 0.5
      });

      // Generate MF-specific market insights
      const marketInsights = await marketIntelligenceService.generateMarketInsights(
        this.data,
        marketData
      );

      // Analyze investment timing (same as SFR)
      const investmentTiming = await marketIntelligenceService.analyzeInvestmentTiming(marketData);

      logger.info(`[MF] ✅ Successfully fetched market intelligence: ${marketInsights.length} insights generated`);

      return {
        marketData,
        marketInsights,
        investmentTiming
      };
    } catch (error) {
      logger.error('[MF] ❌ Failed to fetch market data for multi-family analysis:', error);

      // Return empty data to allow analysis to continue (graceful degradation)
      return {
        marketData: null,
        marketInsights: [],
        investmentTiming: null
      };
    }
  }

  /**
   * Analyze Multi-Family Property with Market Intelligence (Story 1.3)
   * Combines base analysis with market data for enhanced insights
   *
   * Returns:
   * - Full analysis result (metrics, projections, exit analysis)
   * - Market data (comparable properties, trends)
   * - Market insights ("12% below market cap rate - BUY signal!")
   * - Investment timing (buy/hold/wait recommendation)
   */
  public async analyzeWithMarketIntelligence(): Promise<AnalysisResult<MultiFamilyMetrics> & {
    marketData?: MarketDataResponse;
    marketInsights?: MarketInsight[];
    investmentTiming?: InvestmentTimingAnalysis;
  }> {
    logger.info('[MF] Starting multi-family analysis with market intelligence...');

    // Step 1: Perform base MF analysis
    const result = super.analyze();

    // Step 2: Normalize output for frontend
    const normalizedResult = this.normalizeOutput(result);

    // Step 3: Fetch market intelligence data
    const { marketData, marketInsights, investmentTiming } = await this.fetchMarketData();

    // Step 4: Enhance the result with market intelligence
    const enhancedResult = {
      ...normalizedResult,
      ...(marketData && { marketData }),
      ...(marketInsights.length > 0 && { marketInsights }),
      ...(investmentTiming && { investmentTiming })
    };

    logger.info('[MF] ✅ Multi-family analysis completed with market intelligence enhancement');

    return enhancedResult;
  }

  /**
   * Calculate Sensitivity Analysis for Multi-Family Property (Story 1.3)
   * Tests best/worst case scenarios for investment decision validation
   *
   * Scenarios:
   * - Best: +5% income, -5% expenses, -2% vacancy (min 3%), -0.5% interest, +20% appreciation
   * - Worst: -5% income, +10% expenses, +5% vacancy, +1% interest, -30% appreciation
   *
   * Commercial lenders require worst-case DSCR > 1.25 for loan approval
   */
  protected calculateSensitivityAnalysis(): SensitivityAnalysis {
    console.log('[MF] ========== SENSITIVITY ANALYSIS ==========');

    // Base case metrics
    const grossIncome = this.calculateGrossIncome(1);
    const effectiveGrossIncome = this.calculateEffectiveGrossIncome(grossIncome);
    const operatingExpenses = this.calculateOperatingExpenses(grossIncome);
    const noi = effectiveGrossIncome - operatingExpenses;
    const annualDebtService = this.calculateMonthlyMortgage() * 12;
    const cashFlow = noi - annualDebtService;
    const totalInvestment = this.data.downPayment + (this.data.closingCosts || 0) + (this.data.capitalInvestments || 0);

    console.log('[MF] Base Case:');
    console.log('  Gross Income:', `$${grossIncome.toLocaleString()}`);
    console.log('  EGI:', `$${effectiveGrossIncome.toLocaleString()}`);
    console.log('  Operating Expenses:', `$${operatingExpenses.toLocaleString()}`);
    console.log('  NOI:', `$${noi.toLocaleString()}`);
    console.log('  Cash Flow:', `$${cashFlow.toLocaleString()}`);

    // Best case scenario (MF-specific parameters)
    const bestCaseIncome = grossIncome * 1.05; // +5% income
    const bestCaseExpenses = operatingExpenses * 0.95; // -5% expenses
    const bestCaseVacancy = Math.max(3, this.assumptions.vacancyRate - 2); // -2% vacancy (min 3% for MF)
    const bestCaseCreditLoss = 0.015; // 1.5% (better than 2% base)

    const bestCaseEGI = bestCaseIncome * (1 - bestCaseVacancy / 100) * (1 - bestCaseCreditLoss);
    const bestCaseNOI = bestCaseEGI - bestCaseExpenses;

    // Calculate best case mortgage with lower interest rate (-0.5%)
    const loanAmount = this.data.purchasePrice - this.data.downPayment;
    const bestCaseInterest = Math.max(this.data.interestRate - 0.5, 0);
    const bestCaseMonthlyMortgage = FinancialCalculations.calculateMortgage(
      loanAmount,
      bestCaseInterest,
      this.data.loanTerm
    );
    const bestCaseDebtService = bestCaseMonthlyMortgage * 12;
    const bestCaseCashFlow = bestCaseNOI - bestCaseDebtService;

    const bestCaseMetrics = {
      noi: bestCaseNOI,
      cashFlow: bestCaseCashFlow,
      cashOnCashReturn: FinancialCalculations.calculateCashOnCashReturn(bestCaseCashFlow, totalInvestment),
      dscr: FinancialCalculations.calculateDSCR(bestCaseNOI, bestCaseDebtService),
      noiPerUnit: bestCaseNOI / this.data.totalUnits,
      cashFlowPerUnit: bestCaseCashFlow / this.data.totalUnits
    };

    console.log('[MF] Best Case (+5% income, -5% expenses, -2% vacancy):');
    console.log('  Vacancy Rate:', `${bestCaseVacancy.toFixed(1)}%`);
    console.log('  Interest Rate:', `${bestCaseInterest.toFixed(2)}%`);
    console.log('  NOI:', `$${bestCaseNOI.toLocaleString()}`);
    console.log('  Cash Flow:', `$${bestCaseCashFlow.toLocaleString()}`);
    console.log('  CoC Return:', `${bestCaseMetrics.cashOnCashReturn.toFixed(2)}%`);
    console.log('  DSCR:', bestCaseMetrics.dscr.toFixed(2));

    // Worst case scenario (MF-specific parameters)
    const worstCaseIncome = grossIncome * 0.95; // -5% income
    const worstCaseExpenses = operatingExpenses * 1.1; // +10% expenses
    const worstCaseVacancy = this.assumptions.vacancyRate + 5; // +5% vacancy (more risk for MF)
    const worstCaseCreditLoss = 0.03; // 3% (higher defaults)

    const worstCaseEGI = worstCaseIncome * (1 - worstCaseVacancy / 100) * (1 - worstCaseCreditLoss);
    const worstCaseNOI = worstCaseEGI - worstCaseExpenses;

    // Calculate worst case mortgage with higher interest rate (+1%)
    const worstCaseInterest = this.data.interestRate + 1.0;
    const worstCaseMonthlyMortgage = FinancialCalculations.calculateMortgage(
      loanAmount,
      worstCaseInterest,
      this.data.loanTerm
    );
    const worstCaseDebtService = worstCaseMonthlyMortgage * 12;
    const worstCaseCashFlow = worstCaseNOI - worstCaseDebtService;

    const worstCaseMetrics = {
      noi: worstCaseNOI,
      cashFlow: worstCaseCashFlow,
      cashOnCashReturn: FinancialCalculations.calculateCashOnCashReturn(worstCaseCashFlow, totalInvestment),
      dscr: FinancialCalculations.calculateDSCR(worstCaseNOI, worstCaseDebtService),
      noiPerUnit: worstCaseNOI / this.data.totalUnits,
      cashFlowPerUnit: worstCaseCashFlow / this.data.totalUnits
    };

    console.log('[MF] Worst Case (-5% income, +10% expenses, +5% vacancy):');
    console.log('  Vacancy Rate:', `${worstCaseVacancy.toFixed(1)}%`);
    console.log('  Interest Rate:', `${worstCaseInterest.toFixed(2)}%`);
    console.log('  NOI:', `$${worstCaseNOI.toLocaleString()}`);
    console.log('  Cash Flow:', `$${worstCaseCashFlow.toLocaleString()}`);
    console.log('  CoC Return:', `${worstCaseMetrics.cashOnCashReturn.toFixed(2)}%`);
    console.log('  DSCR:', worstCaseMetrics.dscr.toFixed(2));

    // CRITICAL: Warn if worst-case DSCR < 1.25 (commercial lending requirement)
    if (worstCaseMetrics.dscr < 1.25) {
      console.warn(
        `[MF] ⚠️ CRITICAL: Worst-case DSCR (${worstCaseMetrics.dscr.toFixed(2)}) below lender requirement (1.25)\n` +
        `  → Property may not qualify for commercial financing\n` +
        `  → Recommendation: Increase down payment or negotiate lower price`
      );
    }

    console.log('[MF] ========== END SENSITIVITY ANALYSIS ==========');

    // Calculate total returns for each scenario (simplified)
    const projectionYears = this.assumptions.projectionYears;
    const baseTotalReturn = cashFlow * projectionYears + (this.data.purchasePrice * Math.pow(1 + this.assumptions.annualPropertyValueIncrease / 100, projectionYears) - this.data.purchasePrice);
    const bestCaseTotalReturn = bestCaseCashFlow * projectionYears + (this.data.purchasePrice * Math.pow(1.035, projectionYears) - this.data.purchasePrice); // +20% appreciation = 3.5% * 1.2 = 4.2%
    const worstCaseTotalReturn = worstCaseCashFlow * projectionYears + (this.data.purchasePrice * Math.pow(1.0245, projectionYears) - this.data.purchasePrice); // -30% appreciation = 3.5% * 0.7 = 2.45%

    return {
      bestCase: {
        cashFlow: bestCaseCashFlow,
        cashOnCashReturn: bestCaseMetrics.cashOnCashReturn,
        totalReturn: bestCaseTotalReturn,
        noi: bestCaseNOI,
        dscr: bestCaseMetrics.dscr,
        vacancyRate: bestCaseVacancy,
        interestRate: bestCaseInterest,
        appreciationRate: this.assumptions.annualPropertyValueIncrease * 1.2
      },
      worstCase: {
        cashFlow: worstCaseCashFlow,
        cashOnCashReturn: worstCaseMetrics.cashOnCashReturn,
        totalReturn: worstCaseTotalReturn,
        noi: worstCaseNOI,
        dscr: worstCaseMetrics.dscr,
        vacancyRate: worstCaseVacancy,
        interestRate: worstCaseInterest,
        appreciationRate: this.assumptions.annualPropertyValueIncrease * 0.7
      }
    };
  }
} 