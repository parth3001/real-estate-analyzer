/**
 * projectionFixer.ts
 * 
 * This utility ensures that year-by-year projections correctly apply inflation
 * to expenses like property tax, insurance, and maintenance.
 * 
 * The fixer follows the architecture principle that:
 * "Future expenses with inflation" should always be recalculated when a deal is loaded.
 */

/**
 * Ensures that expenses in projections have proper inflation applied.
 * This fixes a common issue where saved deals might have flat expenses across all years.
 * 
 * @param projections - The array of yearly projections to check and fix
 * @param inflationRate - The annual inflation rate to apply (percentage)
 * @returns The fixed projections array with inflation properly applied
 */
export function ensureExpenseInflation(
  projections: any[], 
  inflationRate: number = 2.0
): any[] {
  if (!projections || !Array.isArray(projections) || projections.length <= 1) {
    console.log('FIXER: Invalid projections array, returning as-is');
    return projections;
  }

  const firstYear = projections[0];
  const lastYear = projections[projections.length - 1];
  
  // For saved deals, ALWAYS apply the inflation fix regardless of existing ratio
  // This ensures consistency between new and saved deals
  
  console.log(`FIXER: FORCING inflation fix at ${inflationRate}% to ensure consistency`);
  console.log(`FIXER DEBUG - BEFORE: PropertyTax Year 1: ${firstYear.propertyTax?.toFixed(2) || 0}, Year ${projections.length}: ${lastYear.propertyTax?.toFixed(2) || 0}`);
  
  // Apply inflation to each year's expenses
  const fixedProjections = projections.map((year, index) => {
    if (index === 0) {
      // Keep first year as-is
      return year;
    }
    
    // Calculate inflation factor for this year
    const inflationFactor = Math.pow(1 + inflationRate / 100, index);
    
    // Apply inflation to expense items
    const fixedYear = {
      ...year,
      propertyTax: firstYear.propertyTax * inflationFactor,
      insurance: firstYear.insurance * inflationFactor,
      maintenance: firstYear.maintenance * inflationFactor,
    };
    
    // Recalculate operating expenses
    fixedYear.operatingExpenses = (
      fixedYear.propertyTax +
      fixedYear.insurance +
      fixedYear.maintenance +
      fixedYear.propertyManagement +
      fixedYear.vacancy
    );
    
    // Recalculate NOI (Net Operating Income)
    const effectiveGrossIncome = 
      (year.grossRent || year.grossIncome) * 
      (1 - (year.vacancyRate || (year.vacancy / (year.grossRent || year.grossIncome)) || 0));
    
    fixedYear.noi = effectiveGrossIncome - fixedYear.operatingExpenses;
    
    // Recalculate cash flow
    fixedYear.cashFlow = fixedYear.noi - (year.debtService || 0);
    
    return fixedYear;
  });
  
  // Add debug output after applying the fix
  if (fixedProjections.length > 0) {
    const firstYearFixed = fixedProjections[0];
    const lastYearFixed = fixedProjections[fixedProjections.length - 1];
    console.log(`FIXER DEBUG - AFTER: PropertyTax Year 1: ${firstYearFixed.propertyTax.toFixed(2)}, Year ${fixedProjections.length}: ${lastYearFixed.propertyTax.toFixed(2)}, Ratio: ${(lastYearFixed.propertyTax / firstYearFixed.propertyTax).toFixed(2)}x`);
  }
  
  return fixedProjections;
}

/**
 * Checks if projections array needs to be regenerated due to missing or incorrect data
 * 
 * @param projections - The projections array to check
 * @returns boolean indicating if regeneration is needed
 */
export function shouldRegenerateProjections(projections: any[]): boolean {
  // Always regenerate if projections are missing or empty
  if (!projections || !Array.isArray(projections) || projections.length === 0) {
    console.log('FIXER: Projections missing or empty, should regenerate');
    return true;
  }
  
  // Check for missing essential properties in first projection
  const firstYear = projections[0];
  if (!firstYear || 
      typeof firstYear.propertyTax === 'undefined' ||
      typeof firstYear.insurance === 'undefined' ||
      typeof firstYear.noi === 'undefined') {
    console.log('FIXER: Projections missing essential properties, should regenerate');
    return true;
  }
  
  return false;
}

export default {
  ensureExpenseInflation,
  shouldRegenerateProjections
}; 