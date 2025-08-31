/**
 * Portfolio Property Metrics Service
 * 
 * Calculates essential financial metrics for manually added portfolio properties
 * across all supported property types to ensure consistency with SFR-analyzed 
 * properties in portfolio analytics.
 * 
 * Supports: SFR, Multi-Family, Commercial, Self-Storage, Mobile Home Parks, and more
 */

export interface PortfolioPropertyMetrics {
  keyMetrics: {
    capRate: number;
    cashOnCashReturn: number;
    totalReturn: number;
    monthlyRoi: number;
  };
  monthlyAnalysis: {
    income: {
      gross: number;
      net: number;
    };
    expenses: {
      total: number;
      breakdown: {
        mortgage: number;
        taxes: number;
        insurance: number;
        maintenance: number;
        management: number;
        utilities?: number;
        other: number;
      };
    };
    cashFlow: number;
  };
  annualAnalysis: {
    capRate: number;
    cashOnCashReturn: number;
    noi: number;
    totalInvestment: number;
  };
  isFullAnalysis: boolean; // System flag: false for portfolio-calculated
  calculatedAt: Date;
}

export class PortfolioPropertyMetricsService {
  
  /**
   * Main entry point - Calculate metrics for any property type
   */
  static calculatePortfolioMetrics(property: any): PortfolioPropertyMetrics {
    const propertyType = property.propertyType?.toUpperCase() || 'SFR';
    
    console.log(`Calculating portfolio metrics for ${propertyType}: ${property.propertyName}`);
    
    // Property type-specific income calculation with NaN protection
    const monthlyIncome = this.calculatePropertyIncome(property);
    const monthlyExpenses = this.calculatePropertyExpenses(property);
    const monthlyNetCashFlow = Number(monthlyIncome - monthlyExpenses.total) || 0;

    // Universal financial calculations with NaN protection
    const purchasePrice = Number(property.purchasePrice) || 0;
    const downPayment = Number(property.downPayment) || 0;
    const closingCosts = Number(property.closingCosts) || (purchasePrice * 0.025); // Default 2.5%
    const capitalInvestments = Number(property.capitalInvestments) || 0;
    
    const totalInvestment = downPayment + closingCosts + capitalInvestments;
    const annualNetCashFlow = monthlyNetCashFlow * 12;
    
    // Key metrics with NaN protection
    const capRate = (purchasePrice > 0 && isFinite(annualNetCashFlow)) ? (annualNetCashFlow / purchasePrice) * 100 : 0;
    const cashOnCashReturn = (totalInvestment > 0 && isFinite(annualNetCashFlow)) ? (annualNetCashFlow / totalInvestment) * 100 : 0;
    const monthlyRoi = (totalInvestment > 0 && isFinite(monthlyNetCashFlow)) ? (monthlyNetCashFlow / totalInvestment) * 100 : 0;
    
    // NOI calculation with NaN protection (excludes mortgage payments)
    const mortgageAmount = Number(monthlyExpenses?.breakdown?.mortgage) || 0;
    const noi = annualNetCashFlow + (mortgageAmount * 12);
    
    return {
      keyMetrics: {
        capRate: isFinite(capRate) ? Math.max(capRate, 0) : 0,
        cashOnCashReturn: isFinite(cashOnCashReturn) ? cashOnCashReturn : 0,
        totalReturn: isFinite(capRate) ? Math.max(capRate, 0) : 0, // Simplified for portfolio context
        monthlyRoi: isFinite(monthlyRoi) ? monthlyRoi : 0
      },
      monthlyAnalysis: {
        income: {
          gross: isFinite(monthlyIncome) ? monthlyIncome : 0,
          net: isFinite(monthlyIncome) ? monthlyIncome : 0 // Simplified - no vacancy adjustments for portfolio calc
        },
        expenses: monthlyExpenses,
        cashFlow: isFinite(monthlyNetCashFlow) ? monthlyNetCashFlow : 0
      },
      annualAnalysis: {
        capRate: isFinite(capRate) ? Math.max(capRate, 0) : 0,
        cashOnCashReturn: isFinite(cashOnCashReturn) ? cashOnCashReturn : 0,
        noi: isFinite(noi) ? noi : 0,
        totalInvestment: isFinite(totalInvestment) ? totalInvestment : 0
      },
      isFullAnalysis: false,
      calculatedAt: new Date()
    };
  }

  /**
   * Property type-specific income calculation
   */
  private static calculatePropertyIncome(property: any): number {
    const propertyType = property.propertyType?.toUpperCase() || 'SFR';
    
    switch (propertyType) {
      case 'SFR':
      case 'CONDO':
      case 'TOWNHOUSE':
        return this.calculateSingleFamilyIncome(property);
      
      case 'MF':
      case 'APARTMENT':
        return this.calculateMultiFamilyIncome(property);
      
      case 'COMMERCIAL_RETAIL':
      case 'COMMERCIAL_OFFICE':
      case 'COMMERCIAL_INDUSTRIAL':
      case 'COMMERCIAL_MIXED':
        return this.calculateCommercialIncome(property);
      
      case 'SELF_STORAGE':
        return this.calculateSelfStorageIncome(property);
      
      case 'MOBILE_HOME_PARK':
        return this.calculateMobileHomeParkIncome(property);
      
      case 'LAND':
        return this.calculateLandIncome(property);
      
      default:
        // Generic calculation for 'OTHER' or unknown types
        return property.monthlyRent || 0;
    }
  }

  /**
   * Property type-specific expense calculation
   */
  private static calculatePropertyExpenses(property: any): any {
    const propertyType = property.propertyType?.toUpperCase() || 'SFR';
    const purchasePrice = property.purchasePrice || 0;
    
    // Use exact user-provided values for manual portfolio properties
    const downPayment = Number(property.downPayment) || 0;
    const loanAmount = Math.max(purchasePrice - downPayment, 0);
    const interestRate = Number(property.interestRate) || 0;
    const loanTerm = Number(property.loanTerm) || 0;
    
    const monthlyMortgage = this.calculateMortgagePayment(loanAmount, interestRate, loanTerm);

    // Use exact user-provided rates, no defaults for manual portfolio properties
    const propertyTaxRate = (Number(property.propertyTaxRate) || 0) / 100;
    const insuranceRate = (Number(property.insuranceRate) || 0) / 100;
    
    let monthlyTaxes = (purchasePrice * propertyTaxRate) / 12;
    let monthlyInsurance = (purchasePrice * insuranceRate) / 12;

    // Property type-specific calculations
    let monthlyMaintenance = 0;
    let monthlyManagement = 0;
    let monthlyUtilities = 0;
    let monthlyOther = 0;

    switch (propertyType) {
      case 'SFR':
      case 'CONDO':
      case 'TOWNHOUSE':
        monthlyMaintenance = property.maintenanceCost || 0;
        monthlyManagement = property.managementCost || 0;
        break;
      
      case 'MF':
      case 'APARTMENT':
        monthlyMaintenance = property.maintenanceCost || 0;
        monthlyManagement = property.managementCost || 0;
        monthlyUtilities = property.utilitiesCost || 0;
        break;
      
      case 'COMMERCIAL_RETAIL':
      case 'COMMERCIAL_OFFICE':
      case 'COMMERCIAL_INDUSTRIAL':
      case 'COMMERCIAL_MIXED':
        // Triple net leases - tenant may pay taxes, insurance, CAM
        const tenantPaysNNN = property.leaseType === 'triple_net' || property.tenantPaysNNN;
        if (tenantPaysNNN) {
          monthlyTaxes = 0;
          monthlyInsurance = 0;
        }
        monthlyMaintenance = property.maintenanceCost || 0;
        monthlyManagement = property.managementCost || 0;
        monthlyUtilities = tenantPaysNNN ? 0 : (property.utilitiesCost || 0);
        break;
      
      case 'SELF_STORAGE':
        monthlyMaintenance = property.maintenanceCost || 0;
        monthlyManagement = property.managementCost || 0;
        monthlyUtilities = property.utilitiesCost || 0;
        break;
      
      case 'MOBILE_HOME_PARK':
        monthlyMaintenance = property.maintenanceCost || 0;
        monthlyManagement = property.managementCost || 0;
        monthlyUtilities = property.utilitiesCost || 0;
        break;
      
      case 'LAND':
        monthlyMaintenance = property.maintenanceCost || 0;
        monthlyManagement = property.managementCost || 0;
        break;
      
      default:
        monthlyMaintenance = property.maintenanceCost || 0;
        monthlyManagement = property.managementCost || 0;
    }

    const totalExpenses = monthlyMortgage + monthlyTaxes + monthlyInsurance + 
                         monthlyMaintenance + monthlyManagement + monthlyUtilities + monthlyOther;

    return {
      total: totalExpenses,
      breakdown: {
        mortgage: monthlyMortgage,
        taxes: monthlyTaxes,
        insurance: monthlyInsurance,
        maintenance: monthlyMaintenance,
        management: monthlyManagement,
        utilities: monthlyUtilities,
        other: monthlyOther
      }
    };
  }

  // =============== PROPERTY TYPE-SPECIFIC INCOME CALCULATORS ===============

  private static calculateSingleFamilyIncome(property: any): number {
    return property.monthlyRent || 0;
  }

  private static calculateMultiFamilyIncome(property: any): number {
    // Option 1: Unit types with detailed breakdown
    if (property.unitTypes && Array.isArray(property.unitTypes)) {
      return property.unitTypes.reduce((total: number, unit: any) => {
        const unitRent = unit.monthlyRent || 0;
        const unitCount = unit.count || 0;
        const occupiedUnits = unit.occupied || unitCount;
        return total + (unitRent * occupiedUnits);
      }, 0);
    }
    
    // Option 2: Simple total units approach
    const totalUnits = property.totalUnits || 1;
    const averageRent = property.averageRentPerUnit || property.monthlyRent || 0;
    const occupancyRate = (property.occupancyRate || 95) / 100;
    
    return totalUnits * averageRent * occupancyRate;
  }

  private static calculateCommercialIncome(property: any): number {
    // Option 1: Lease rate per square foot
    if (property.leaseRatePerSqft && property.leasableSquareFootage) {
      const annualIncome = property.leaseRatePerSqft * property.leasableSquareFootage;
      return annualIncome / 12;
    }
    
    // Option 2: Monthly rent
    const occupancyRate = (property.occupancyRate || 90) / 100;
    return (property.monthlyRent || 0) * occupancyRate;
  }

  private static calculateSelfStorageIncome(property: any): number {
    // Option 1: Unit mix approach
    if (property.storageUnits && Array.isArray(property.storageUnits)) {
      return property.storageUnits.reduce((total: number, unit: any) => {
        const monthlyRate = unit.monthlyRate || 0;
        const occupiedCount = unit.occupiedCount || unit.totalCount || 0;
        return total + (monthlyRate * occupiedCount);
      }, 0);
    }
    
    // Option 2: Simple average approach
    const totalUnits = property.totalStorageUnits || 100;
    const averageRate = property.averageMonthlyRate || 75;
    const occupancyRate = (property.occupancyRate || 85) / 100;
    
    return totalUnits * averageRate * occupancyRate;
  }

  private static calculateMobileHomeParkIncome(property: any): number {
    const totalLots = property.totalLots || property.totalUnits || 1;
    const averageLotRent = property.averageLotRent || property.lotRent || 0;
    const occupancyRate = (property.occupancyRate || 90) / 100;
    
    return totalLots * averageLotRent * occupancyRate;
  }

  private static calculateLandIncome(property: any): number {
    // Land lease, agricultural lease, or billboard income
    return property.monthlyLandLease || property.monthlyRent || 0;
  }

  // =============== UTILITY CALCULATORS ===============

  private static calculateMFUtilities(property: any): number {
    if (property.commonAreaUtilities) {
      const utilities = property.commonAreaUtilities;
      return (utilities.electric || 0) + (utilities.water || 0) + 
             (utilities.gas || 0) + (utilities.trash || 0);
    }
    
    // Default estimate based on unit count
    const totalUnits = property.totalUnits || 1;
    return totalUnits * 15; // $15/unit estimate
  }

  private static calculateMortgagePayment(loanAmount: number, annualRate: number, termYears: number): number {
    if (loanAmount <= 0) return 0;
    
    const monthlyRate = annualRate / 100 / 12;
    const totalPayments = termYears * 12;
    
    if (monthlyRate === 0) return loanAmount / totalPayments;
    
    const monthlyPayment = loanAmount * 
      (monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) / 
      (Math.pow(1 + monthlyRate, totalPayments) - 1);
    
    return monthlyPayment;
  }

  /**
   * Update Deal object with calculated portfolio metrics
   */
  static async updateDealWithPortfolioMetrics(dealId: string): Promise<void> {
    const { DealModel: Deal } = require('../../models/Deal');
    
    try {
      const deal = await Deal.findById(dealId);
      if (!deal) {
        throw new Error(`Deal not found: ${dealId}`);
      }

      // Only calculate for manually added portfolio properties (no existing analysis)
      if (!deal.analysis && deal.portfolioId) {
        console.log(`🧮 Calculating portfolio metrics for: ${deal.propertyName} (${deal.propertyType})`);
        
        const metrics = this.calculatePortfolioMetrics(deal);
        
        // Store metrics in analysis field (same structure as SFR analysis)
        deal.analysis = {
          keyMetrics: metrics.keyMetrics,
          monthlyAnalysis: metrics.monthlyAnalysis,
          annualAnalysis: metrics.annualAnalysis,
          isFullAnalysis: metrics.isFullAnalysis,
          calculatedAt: metrics.calculatedAt
        };
        
        await deal.save();
        console.log(`✅ Portfolio metrics calculated: Cap Rate ${metrics.keyMetrics.capRate.toFixed(2)}%, Cash Flow $${metrics.monthlyAnalysis.cashFlow.toFixed(2)}`);
      } else if (deal.analysis && deal.portfolioId) {
        console.log(`⏭️  Skipping ${deal.propertyName} - already has analysis data`);
      }
    } catch (error) {
      console.error(`❌ Error updating deal ${dealId} with portfolio metrics:`, error);
      throw error;
    }
  }

  /**
   * Calculate metrics for all manual properties in a portfolio
   */
  static async calculatePortfolioPropertyMetrics(portfolioId: string): Promise<void> {
    const { DealModel: Deal } = require('../../models/Deal');
    
    try {
      console.log(`🔍 Finding manual properties in portfolio: ${portfolioId}`);
      
      // Find all properties in this portfolio without analysis data
      const manualProperties = await Deal.find({
        portfolioId: portfolioId,
        analysis: { $exists: false }
      });

      console.log(`📊 Found ${manualProperties.length} manually added properties needing metrics calculation`);

      if (manualProperties.length === 0) {
        console.log(`✅ No manual properties found - all properties have analysis data`);
        return;
      }

      // Calculate metrics for each property
      let successCount = 0;
      for (const property of manualProperties) {
        try {
          await this.updateDealWithPortfolioMetrics(property._id.toString());
          successCount++;
        } catch (error) {
          console.error(`❌ Failed to calculate metrics for ${property.propertyName}:`, error);
        }
      }

      console.log(`✅ Portfolio property metrics calculation complete: ${successCount}/${manualProperties.length} properties processed`);
    } catch (error) {
      console.error(`❌ Error calculating portfolio property metrics:`, error);
      throw error;
    }
  }

  /**
   * Batch update all portfolios with missing metrics
   */
  static async recalculateAllPortfolioMetrics(): Promise<void> {
    const { Portfolio } = require('../../models/Portfolio');
    
    try {
      const portfolios = await Portfolio.find({ status: 'ACTIVE' });
      console.log(`🔄 Starting metrics recalculation for ${portfolios.length} active portfolios`);
      
      let totalProcessed = 0;
      for (const portfolio of portfolios) {
        try {
          await this.calculatePortfolioPropertyMetrics(portfolio._id.toString());
          totalProcessed++;
        } catch (error) {
          console.error(`❌ Error processing portfolio ${portfolio.name}:`, error);
        }
      }
      
      console.log(`🎉 Batch metrics calculation complete: ${totalProcessed}/${portfolios.length} portfolios processed`);
    } catch (error) {
      console.error(`❌ Error in batch portfolio metrics calculation:`, error);
      throw error;
    }
  }
}