import mongoose from 'mongoose';
import { PortfolioAnalytics, IPortfolioAnalytics } from '../../models/PortfolioAnalytics';
import { Portfolio } from '../../models/Portfolio';
import { DealModel } from '../../models/Deal';

/**
 * Portfolio Analytics Service
 * Calculates and manages portfolio performance metrics
 */
export class PortfolioAnalyticsService {
  /**
   * Calculate and save portfolio analytics
   */
  async calculatePortfolioAnalytics(portfolioId: string): Promise<IPortfolioAnalytics> {
    try {
      if (!mongoose.Types.ObjectId.isValid(portfolioId)) {
        throw new Error('Invalid portfolio ID');
      }

      // Get portfolio details
      const portfolio = await Portfolio.findById(portfolioId);
      if (!portfolio) {
        throw new Error('Portfolio not found');
      }

      // Get all properties in the portfolio
      // Try both ObjectId and string formats for compatibility
      let properties = await DealModel.find({ 
        portfolioId: new mongoose.Types.ObjectId(portfolioId) 
      });

      // If no properties found with ObjectId, try with string
      if (properties.length === 0) {
        console.log(`⚠️ No properties found with ObjectId, trying string format...`);
        properties = await DealModel.find({ portfolioId: portfolioId });
        
        // If still no properties, check if portfolioId needs to be cast differently
        if (properties.length === 0) {
          console.log(`⚠️ Still no properties found, checking all deals with portfolioId...`);
          const allDealsWithPortfolio = await DealModel.find({ portfolioId: { $exists: true } });
          console.log(`Total deals with portfolioId field: ${allDealsWithPortfolio.length}`);
          
          // Find properties that match this portfolio
          properties = allDealsWithPortfolio.filter(deal => {
            if (!deal.portfolioId) return false;
            const dealPortfolioId = deal.portfolioId.toString();
            const targetId = portfolioId.toString();
            return dealPortfolioId === targetId;
          });
          
          console.log(`Properties matching after string comparison: ${properties.length}`);
        }
      }

      console.log(`\n🔄 Analytics calculation for portfolio ${portfolioId}:`);
      console.log(`- Portfolio name: ${portfolio.name}`);
      console.log(`- Found ${properties.length} properties in portfolio`);
      
      if (properties.length > 0) {
        properties.forEach((prop, i) => {
          console.log(`  Property ${i + 1}: ${prop.propertyName || prop.propertyAddress || 'Unnamed'} - $${prop.purchasePrice}`);
          console.log(`    Type: ${prop.propertyType}, Has analysis: ${!!prop.analysis}`);
          console.log(`    PortfolioId type: ${typeof prop.portfolioId}, value: ${prop.portfolioId}`);
          console.log(`    Monthly Rent: $${(prop as any).monthlyRent || 0}, Operating Expenses: $${(prop as any).monthlyOperatingExpenses || 0}`);
          console.log(`    Source: ${(prop as any).source}, isManualEntry: ${(prop as any).isManualEntry}`);
        });
      } else {
        console.log('⚠️ No properties found for this portfolio!');
        
        // Debug: Check all properties to see what portfolioIds they have
        const allPropsWithPortfolio = await DealModel.find({ portfolioId: { $exists: true } }).limit(5);
        console.log(`  Sample properties with portfolioId:`);
        allPropsWithPortfolio.forEach(p => {
          console.log(`    - ${p.propertyName}: portfolioId=${p.portfolioId} (type: ${typeof p.portfolioId})`);
        });
      }

      // Calculate aggregate metrics
      const metrics = {
        totalProperties: properties.length,
        totalValue: 0,
        totalEquity: 0,
        totalDebt: 0,
        monthlyRentalIncome: 0,
        monthlyExpenses: 0,
        monthlyNetCashFlow: 0,
        annualNetIncome: 0,
        averageCapRate: 0,
        averageCashOnCash: 0,
        totalSquareFeet: 0,
        averagePropertyAge: 0,
        vacancyRate: 5, // Default 5%
        occupancyRate: 95 // Default 95%
      };

      // Calculate metrics from properties
      if (properties.length > 0) {
        let totalCapRate = 0;
        let totalCashOnCash = 0;
        let totalAge = 0;
        let validCapRateCount = 0;
        let validCashOnCashCount = 0;
        let validAgeCount = 0;

        for (const property of properties) {
          // Value metrics
          const purchasePrice = property.purchasePrice || 0;
          const currentValue = purchasePrice; // Use purchase price as current value for now
          const loanAmount = purchasePrice - (property.downPayment || 0);
          
          // Apply ownership percentage (for fractional investments)
          const ownershipPercentage = (property.ownershipPercentage || 100) / 100;
          const adjustedValue = currentValue * ownershipPercentage;
          const adjustedDebt = loanAmount * ownershipPercentage;
          const adjustedEquity = (currentValue - loanAmount) * ownershipPercentage;
          
          metrics.totalValue += adjustedValue;
          metrics.totalDebt += adjustedDebt;
          metrics.totalEquity += adjustedEquity;

          // SIMPLIFIED: Use existing analysis data when available
          let monthlyRent = 0;
          let monthlyExpenses = 0;
          let monthlyNetCashFlow = 0;
          
          // Check if this is a manual property first (takes priority over analysis)
          const isManualProperty = (property as any).source === 'PORTFOLIO_MANUAL_ENTRY' || 
                                   (property as any).isManualEntry || 
                                   (property as any).monthlyOperatingExpenses !== undefined;
          
          // For analyzed properties - use the final calculated results (only if NOT manual)
          if (!isManualProperty && property.analysis?.monthlyAnalysis?.cashFlow !== undefined) {
            monthlyNetCashFlow = property.analysis.monthlyAnalysis.cashFlow;
            monthlyRent = property.analysis.monthlyAnalysis.income?.gross || (property as any).monthlyRent || 0;
            monthlyExpenses = property.analysis.monthlyAnalysis.expenses?.total || 0;
            console.log(`    ANALYZED Property ${property.propertyName}: cashFlow = $${monthlyNetCashFlow}, rent = $${monthlyRent}, expenses = $${monthlyExpenses}`);
          }
          // For manual properties - use user-provided values directly
          else {
            // Use basic monthlyRent from property data
            monthlyRent = (property as any).monthlyRent || 0;
            
            // For manual properties, use monthlyOperatingExpenses directly (not calculated)
            const manualProperty = property as any;
            console.log(`    🔍 MANUAL Property Debug - ${property.propertyName}:`);
            console.log(`      monthlyOperatingExpenses value: ${manualProperty.monthlyOperatingExpenses}`);
            console.log(`      monthlyOperatingExpenses type: ${typeof manualProperty.monthlyOperatingExpenses}`);
            console.log(`      monthlyOperatingExpenses undefined check: ${manualProperty.monthlyOperatingExpenses !== undefined}`);
            
            if (manualProperty.monthlyOperatingExpenses !== undefined && manualProperty.monthlyOperatingExpenses !== null) {
              monthlyExpenses = Number(manualProperty.monthlyOperatingExpenses) || 0;
              console.log(`      ✅ Using user-provided expenses: $${monthlyExpenses}`);
            } else {
              // Fallback to calculated expenses only if user didn't provide operating expenses
              console.log(`      ⚠️ User expenses not found, calculating fallback...`);
              monthlyExpenses = this.calculateMonthlyExpenses(property);
              console.log(`      📊 Calculated expenses: $${monthlyExpenses}`);
            }
            
            monthlyNetCashFlow = monthlyRent - monthlyExpenses;
            console.log(`    MANUAL Property ${property.propertyName}: rent = $${monthlyRent}, userExpenses = ${manualProperty.monthlyOperatingExpenses}, finalExpenses = $${monthlyExpenses}, cashFlow = $${monthlyNetCashFlow}`);
          }
          
          // Apply ownership percentage (for fractional investments)
          const adjustedRent = monthlyRent * ownershipPercentage;
          const adjustedExpenses = monthlyExpenses * ownershipPercentage;
          const adjustedCashFlow = monthlyNetCashFlow * ownershipPercentage;
          
          metrics.monthlyRentalIncome += adjustedRent;
          metrics.monthlyExpenses += adjustedExpenses;
          metrics.monthlyNetCashFlow += adjustedCashFlow;

          // Return metrics from analysis - try multiple locations
          let capRate = 0;
          let cashOnCash = 0;
          
          // Try keyMetrics first (most common)
          if (property.analysis?.keyMetrics?.capRate) {
            capRate = property.analysis.keyMetrics.capRate;
          }
          // Fallback to annualAnalysis
          else if (property.analysis?.annualAnalysis?.capRate) {
            capRate = property.analysis.annualAnalysis.capRate;
          }
          
          if (property.analysis?.keyMetrics?.cashOnCashReturn) {
            cashOnCash = property.analysis.keyMetrics.cashOnCashReturn;
          }
          // Fallback to annualAnalysis
          else if (property.analysis?.annualAnalysis?.cashOnCashReturn) {
            cashOnCash = property.analysis.annualAnalysis.cashOnCashReturn;
          }
          
          if (capRate > 0) {
            totalCapRate += capRate;
            validCapRateCount++;
            console.log(`    Found cap rate: ${capRate}% for ${property.propertyName}`);
          }
          
          if (cashOnCash !== 0 && isFinite(cashOnCash)) {
            totalCashOnCash += cashOnCash;
            validCashOnCashCount++;
            console.log(`    Found cash-on-cash: ${cashOnCash}% for ${property.propertyName}`);
          }

          // Property characteristics
          let squareFeet = 0;
          if (property.propertyType === 'SFR') {
            squareFeet = (property as any).squareFootage || 0;
          } else if (property.propertyType === 'MF') {
            squareFeet = (property as any).totalSqft || 0;
          }
          metrics.totalSquareFeet += squareFeet;
          
          if (property.yearBuilt) {
            const age = new Date().getFullYear() - property.yearBuilt;
            totalAge += age;
            validAgeCount++;
          }
        }

        // Calculate averages
        metrics.annualNetIncome = metrics.monthlyNetCashFlow * 12;
        metrics.averageCapRate = validCapRateCount > 0 ? totalCapRate / validCapRateCount : 0;
        metrics.averageCashOnCash = validCashOnCashCount > 0 ? totalCashOnCash / validCashOnCashCount : 0;
        metrics.averagePropertyAge = validAgeCount > 0 ? totalAge / validAgeCount : 0;
      }

      // Geographic distribution
      const geographicDistribution = this.calculateGeographicDistribution(properties);

      // Property type distribution
      const propertyTypeDistribution = this.calculatePropertyTypeDistribution(properties);

      // Performance indicators
      const performanceIndicators = {
        totalReturn: metrics.annualNetIncome + (metrics.totalEquity * 0.03), // Assuming 3% appreciation
        returnOnEquity: metrics.totalEquity > 0 ? (metrics.annualNetIncome / metrics.totalEquity) * 100 : 0,
        debtServiceCoverageRatio: this.calculateDSCR(properties),
        portfolioLTV: metrics.totalValue > 0 ? (metrics.totalDebt / metrics.totalValue) * 100 : 0
      };

      // Calculate concentration risk first
      const concentrationRisk = this.calculateConcentrationRisk(geographicDistribution);

      // Risk metrics
      const riskMetrics = {
        concentrationRisk: concentrationRisk,
        leverageRisk: performanceIndicators.portfolioLTV > 75 ? 'HIGH' : 
                      performanceIndicators.portfolioLTV > 60 ? 'MODERATE' : 'LOW',
        cashFlowStability: metrics.monthlyNetCashFlow > 0 ? 'POSITIVE' : 'NEGATIVE',
        maintenanceReserveAdequacy: this.calculateMaintenanceReserveAdequacy(properties)
      };

      // Create the summary object matching IPortfolioSummary
      const summary = {
        totalProperties: metrics.totalProperties,
        totalValue: metrics.totalValue,
        totalEquity: metrics.totalEquity,
        monthlyNetCashFlow: metrics.monthlyNetCashFlow,
        monthlyRentalIncome: metrics.monthlyRentalIncome,
        averageCapRate: metrics.averageCapRate,
        averageCashOnCash: metrics.averageCashOnCash,
        totalInvestment: metrics.totalValue - metrics.totalEquity // Total investment is value minus equity
      };

      // Create simple risk analysis
      const risk = {
        geographicConcentration: concentrationRisk === 'HIGH' ? 70 : concentrationRisk === 'MODERATE' ? 50 : 30,
        topMarket: geographicDistribution[0]?.location || 'Unknown',
        concentrationWarning: concentrationRisk === 'HIGH' ? 'High geographic concentration detected' : undefined,
        leverageRatio: metrics.totalValue > 0 ? (metrics.totalDebt / metrics.totalValue) : 0,
        cashFlowStability: metrics.monthlyNetCashFlow > 0 ? 1 : 0
      };

      // Create goal progress (simplified for now)
      const goalProgress = {};

      // Create AI insights (simplified for now)
      const aiInsights = {
        portfolioStrength: metrics.monthlyNetCashFlow > 0 ? 'Positive cash flow' : 'Negative cash flow',
        mainOpportunity: concentrationRisk === 'HIGH' ? 'Geographic diversification' : 'Increase portfolio size',
        nextSteps: [],
        riskWarnings: concentrationRisk === 'HIGH' ? ['High geographic concentration'] : [],
        goalAlignment: 'Portfolio metrics calculated'
      };

      // Create or update analytics record
      const analytics = await PortfolioAnalytics.findOneAndUpdate(
        { portfolioId: new mongoose.Types.ObjectId(portfolioId) },
        {
          portfolioId: new mongoose.Types.ObjectId(portfolioId),
          summary,
          risk,
          goalProgress,
          aiInsights,
          calculatedAt: new Date()
        },
        { upsert: true, new: true }
      );

      console.log(`Analytics calculated for portfolio ${portfolioId}`);
      
      // Return consistent structure following Data Dictionary
      // The analytics document already has 'summary' field as per our schema
      return analytics.toObject() as any;
    } catch (error: any) {
      console.error('Error calculating portfolio analytics:', error);
      throw new Error(`Failed to calculate portfolio analytics: ${error.message}`);
    }
  }

  /**
   * Calculate monthly expenses for a property
   */
  private calculateMonthlyExpenses(property: any): number {
    // Use calculated monthly expenses from analysis if available
    if (property.analysis?.monthlyAnalysis?.expenses?.total) {
      return property.analysis.monthlyAnalysis.expenses.total;
    }

    // Fallback calculation if analysis not available
    let totalExpenses = 0;

    // Calculate mortgage payment - with proper validation to prevent Infinity
    const purchasePrice = property.purchasePrice || 0;
    const downPayment = property.downPayment || 0;
    const loanAmount = purchasePrice - downPayment;
    const interestRate = property.interestRate || 0;
    const loanTerm = property.loanTerm || 0;
    
    // Only calculate mortgage if we have valid loan parameters
    if (loanAmount > 0 && interestRate > 0 && loanTerm > 0) {
      const monthlyRate = interestRate / 100 / 12;
      const loanTermMonths = loanTerm * 12;
      
      if (monthlyRate > 0 && loanTermMonths > 0 && isFinite(monthlyRate) && isFinite(loanTermMonths)) {
        const monthlyPayment = loanAmount * 
          (monthlyRate * Math.pow(1 + monthlyRate, loanTermMonths)) / 
          (Math.pow(1 + monthlyRate, loanTermMonths) - 1);
        
        // Validate the result before adding
        if (isFinite(monthlyPayment) && monthlyPayment > 0) {
          totalExpenses += monthlyPayment;
        }
      }
    }

    // Operating expenses (convert annual to monthly) - with validation
    const propertyTaxRate = property.propertyTaxRate || 0;
    const insuranceRate = property.insuranceRate || 0;
    
    if (purchasePrice > 0 && propertyTaxRate >= 0 && isFinite(propertyTaxRate)) {
      const propertyTax = (purchasePrice * propertyTaxRate / 100) / 12;
      if (isFinite(propertyTax)) {
        totalExpenses += propertyTax;
      }
    }
    
    if (purchasePrice > 0 && insuranceRate >= 0 && isFinite(insuranceRate)) {
      const insurance = (purchasePrice * insuranceRate / 100) / 12;
      if (isFinite(insurance)) {
        totalExpenses += insurance;
      }
    }

    // Property management (percentage of monthly rent) - with validation
    let monthlyRent = 0;
    if (property.propertyType === 'SFR') {
      monthlyRent = property.monthlyRent || 0;
    } else if (property.propertyType === 'MF') {
      const unitTypes = property.unitTypes || [];
      monthlyRent = unitTypes.reduce((total: number, unit: any) => 
        total + ((unit.monthlyRent || 0) * (unit.occupied || 0)), 0);
    }
    
    const propertyManagementRate = property.propertyManagementRate || 0;
    if (monthlyRent > 0 && propertyManagementRate >= 0 && isFinite(propertyManagementRate)) {
      const propertyManagement = monthlyRent * propertyManagementRate / 100;
      if (isFinite(propertyManagement)) {
        totalExpenses += propertyManagement;
      }
    }

    // Maintenance - with validation
    if (property.propertyType === 'SFR') {
      const maintenanceCost = property.maintenanceCost || 0;
      if (isFinite(maintenanceCost) && maintenanceCost >= 0) {
        totalExpenses += maintenanceCost;
      }
    } else if (property.propertyType === 'MF') {
      const totalUnits = property.totalUnits || 1;
      const maintenancePerUnit = property.maintenanceCostPerUnit || 0;
      const maintenanceTotal = totalUnits * maintenancePerUnit;
      if (isFinite(maintenanceTotal) && maintenanceTotal >= 0) {
        totalExpenses += maintenanceTotal;
      }
    }

    // Final validation to ensure we never return Infinity or NaN
    return isFinite(totalExpenses) && totalExpenses >= 0 ? totalExpenses : 0;
  }

  /**
   * Calculate geographic distribution
   */
  private calculateGeographicDistribution(properties: any[]): any[] {
    const distribution = new Map<string, { count: number; value: number }>();

    for (const property of properties) {
      const location = property.propertyAddress?.city || 'Unknown';
      const existing = distribution.get(location) || { count: 0, value: 0 };
      
      existing.count++;
      existing.value += property.purchasePrice || 0;
      
      distribution.set(location, existing);
    }

    return Array.from(distribution.entries()).map(([location, data]) => ({
      location,
      propertyCount: data.count,
      totalValue: data.value,
      percentage: properties.length > 0 ? (data.count / properties.length) * 100 : 0
    }));
  }

  /**
   * Calculate property type distribution
   */
  private calculatePropertyTypeDistribution(properties: any[]): any[] {
    const distribution = new Map<string, { count: number; value: number }>();

    for (const property of properties) {
      const type = property.propertyType || 'Single Family';
      const existing = distribution.get(type) || { count: 0, value: 0 };
      
      existing.count++;
      existing.value += property.purchasePrice || 0;
      
      distribution.set(type, existing);
    }

    return Array.from(distribution.entries()).map(([type, data]) => ({
      type,
      count: data.count,
      totalValue: data.value,
      percentage: properties.length > 0 ? (data.count / properties.length) * 100 : 0
    }));
  }

  /**
   * Calculate Debt Service Coverage Ratio
   */
  private calculateDSCR(properties: any[]): number {
    let totalNOI = 0;
    let totalDebtService = 0;

    for (const property of properties) {
      // Calculate monthly rent based on property type
      let monthlyRent = 0;
      if (property.propertyType === 'SFR') {
        monthlyRent = property.monthlyRent || 0;
      } else if (property.propertyType === 'MF') {
        const unitTypes = property.unitTypes || [];
        monthlyRent = unitTypes.reduce((total: number, unit: any) => 
          total + (unit.monthlyRent * unit.occupied), 0);
      }

      // Calculate operating expenses (excluding debt service)
      const totalMonthlyExpenses = this.calculateMonthlyExpenses(property);
      
      // Calculate mortgage payment separately - with proper validation
      const purchasePrice = property.purchasePrice || 0;
      const downPayment = property.downPayment || 0;
      const loanAmount = purchasePrice - downPayment;
      const interestRate = property.interestRate || 0;
      const loanTerm = property.loanTerm || 0;
      
      let monthlyDebtService = 0;
      if (loanAmount > 0 && interestRate > 0 && loanTerm > 0) {
        const monthlyRate = interestRate / 100 / 12;
        const loanTermMonths = loanTerm * 12;
        
        if (monthlyRate > 0 && loanTermMonths > 0 && isFinite(monthlyRate) && isFinite(loanTermMonths)) {
          const payment = loanAmount * 
            (monthlyRate * Math.pow(1 + monthlyRate, loanTermMonths)) / 
            (Math.pow(1 + monthlyRate, loanTermMonths) - 1);
          
          if (isFinite(payment) && payment > 0) {
            monthlyDebtService = payment;
          }
        }
      }

      // NOI = Rental Income - Operating Expenses (excluding debt service)
      const operatingExpenses = totalMonthlyExpenses - monthlyDebtService;
      const monthlyNOI = monthlyRent - operatingExpenses;
      
      totalNOI += monthlyNOI * 12;
      totalDebtService += monthlyDebtService * 12;
    }

    return totalDebtService > 0 ? totalNOI / totalDebtService : 0;
  }

  /**
   * Calculate concentration risk
   */
  private calculateConcentrationRisk(geographicDistribution: any[]): string {
    if (geographicDistribution.length === 0) return 'LOW';
    
    const maxConcentration = Math.max(...geographicDistribution.map(d => d.percentage));
    
    if (maxConcentration > 70) return 'HIGH';
    if (maxConcentration > 50) return 'MODERATE';
    return 'LOW';
  }

  /**
   * Calculate maintenance reserve adequacy
   */
  private calculateMaintenanceReserveAdequacy(properties: any[]): string {
    const totalMonthlyRent = properties.reduce((sum, p) => sum + (p.monthlyRent || 0), 0);
    const recommendedReserve = totalMonthlyRent * 0.1; // 10% of monthly rent
    
    // This would need actual reserve data from the portfolio
    // For now, return a default
    return 'ADEQUATE';
  }
}

export const portfolioAnalyticsService = new PortfolioAnalyticsService();