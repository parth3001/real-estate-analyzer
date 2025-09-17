// Direct backend analysis for Anna, TX property
// This bypasses the UI and directly calls the Investment Decision Engine

const axios = require('axios');

async function analyzeAnnaTxProperty() {
  console.log('🎯 DIRECT BACKEND ANALYSIS: Anna, TX Property');
  console.log('=====================================');
  
  const propertyData = {
    address: {
      street: '1837 Walnut Way',
      city: 'Anna',
      state: 'TX',
      zipCode: '75409'
    },
    propertyDetails: {
      bedrooms: 3,
      bathrooms: 2,
      yearBuilt: 2005,
      squareFootage: 1847,
      propertyType: 'Single Family'
    },
    financials: {
      purchasePrice: 245000,
      downPaymentPercent: 20,
      loanAmount: 196000,
      interestRate: 7.5,
      loanTermYears: 30,
      monthlyRent: 2100, // Estimated for Anna, TX area
      propertyTaxRate: 1.8, // Texas typical
      insurance: 150, // Monthly
      maintenance: 200, // Monthly
      vacancy: 5 // Percent
    },
    investmentGoals: {
      riskTolerance: 'Low',
      investmentGoal: 'Cash Flow Focus',
      timeHorizon: 'Long-term'
    }
  };

  console.log(`📍 Property: ${propertyData.address.street}, ${propertyData.address.city}, ${propertyData.address.state} ${propertyData.address.zipCode}`);
  console.log(`💰 Purchase Price: $${propertyData.financials.purchasePrice.toLocaleString()}`);
  console.log(`🏠 Estimated Rent: $${propertyData.financials.monthlyRent}/month`);
  console.log(`🏦 Down Payment: ${propertyData.financials.downPaymentPercent}% ($${(propertyData.financials.purchasePrice * propertyData.financials.downPaymentPercent / 100).toLocaleString()})`);
  console.log(`📊 Interest Rate: ${propertyData.financials.interestRate}%`);
  console.log('=====================================');

  try {
    // Call the backend analysis endpoint
    const response = await axios.post('http://localhost:3001/api/deals/analyze', {
      propertyData: propertyData,
      userProfile: propertyData.investmentGoals
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    if (response.data && response.data.analysis) {
      const analysis = response.data.analysis;
      
      console.log('🎯 INVESTMENT ANALYSIS RESULTS:');
      console.log('=====================================');
      console.log(`📊 Investment Verdict: ${analysis.verdict || 'Unknown'}`);
      console.log(`🏆 Property Quality Score: ${analysis.score || 'Unknown'}/100`);
      
      if (analysis.financialMetrics) {
        const metrics = analysis.financialMetrics;
        console.log(`📈 Cap Rate: ${metrics.capRate || 'Unknown'}%`);
        console.log(`💵 Monthly Cash Flow: $${metrics.monthlyCashFlow || 'Unknown'}`);
        console.log(`📊 IRR: ${metrics.irr || 'Unknown'}%`);
        console.log(`💎 Cash-on-Cash Return: ${metrics.cashOnCashReturn || 'Unknown'}%`);
        console.log(`🏦 Monthly Payment: $${metrics.monthlyPayment || 'Unknown'}`);
        console.log(`💸 Total Monthly Expenses: $${metrics.totalExpenses || 'Unknown'}`);
      }
      
      console.log('=====================================');
      console.log('🏘️ ANNA, TX MARKET CONTEXT:');
      console.log('• Location: Dallas-Fort Worth suburban area');
      console.log('• Market Type: Growing family community');
      console.log('• Demographics: Good schools, family-oriented');
      console.log('• Typical Rent: $1,800-2,200 for 3BR homes');
      console.log('• Cap Rate Range: 6-8% typical for area');
      console.log('• Investment Appeal: Buy-and-hold friendly');
      
      // Calculate basic validation metrics
      const annualRent = propertyData.financials.monthlyRent * 12;
      const grossYield = ((annualRent / propertyData.financials.purchasePrice) * 100).toFixed(2);
      const monthlyMortgage = calculateMortgage(propertyData.financials.loanAmount, propertyData.financials.interestRate, propertyData.financials.loanTermYears);
      const estimatedExpenses = monthlyMortgage + (propertyData.financials.propertyTaxRate / 100 * propertyData.financials.purchasePrice / 12) + propertyData.financials.insurance + propertyData.financials.maintenance;
      const estimatedCashFlow = propertyData.financials.monthlyRent - estimatedExpenses;
      
      console.log('=====================================');
      console.log('📊 EXPERT VALIDATION CALCULATIONS:');
      console.log(`📈 Gross Yield: ${grossYield}%`);
      console.log(`🏦 Estimated Monthly Mortgage: $${Math.round(monthlyMortgage)}`);
      console.log(`💸 Estimated Total Expenses: $${Math.round(estimatedExpenses)}`);
      console.log(`💵 Estimated Cash Flow: $${Math.round(estimatedCashFlow)}`);
      
      // Expert assessment
      console.log('=====================================');
      console.log('✅ EXPERT VALIDATION ASSESSMENT:');
      
      if (grossYield >= 8.5) {
        console.log('🔥 EXCELLENT: Gross yield >8.5% - Strong cash flow potential');
      } else if (grossYield >= 7.0) {
        console.log('👍 GOOD: Gross yield 7-8.5% - Solid for Dallas suburbs');
      } else if (grossYield >= 6.0) {
        console.log('⚠️ MODERATE: Gross yield 6-7% - Average for market');
      } else {
        console.log('❌ POOR: Gross yield <6% - Below market expectations');
      }
      
      if (estimatedCashFlow > 300) {
        console.log('💰 Strong positive cash flow projected');
      } else if (estimatedCashFlow > 0) {
        console.log('💵 Modest positive cash flow projected');
      } else {
        console.log('⚠️ Negative cash flow risk');
      }
      
      console.log('=====================================');
      
    } else {
      console.log('❌ No analysis data received from backend');
    }
    
  } catch (error) {
    console.log('❌ Backend analysis failed:', error.message);
    console.log('🔄 Performing manual calculation...');
    
    // Manual calculation as fallback
    const annualRent = propertyData.financials.monthlyRent * 12;
    const grossYield = ((annualRent / propertyData.financials.purchasePrice) * 100).toFixed(2);
    const monthlyMortgage = calculateMortgage(propertyData.financials.loanAmount, propertyData.financials.interestRate, propertyData.financials.loanTermYears);
    const monthlyTax = (propertyData.financials.propertyTaxRate / 100 * propertyData.financials.purchasePrice / 12);
    const totalExpenses = monthlyMortgage + monthlyTax + propertyData.financials.insurance + propertyData.financials.maintenance;
    const cashFlow = propertyData.financials.monthlyRent - totalExpenses;
    const capRate = ((annualRent - (totalExpenses - monthlyMortgage) * 12) / propertyData.financials.purchasePrice * 100).toFixed(2);
    
    console.log('📊 MANUAL CALCULATION RESULTS:');
    console.log('=====================================');
    console.log(`📈 Gross Yield: ${grossYield}%`);
    console.log(`📊 Cap Rate: ${capRate}%`);
    console.log(`🏦 Monthly Mortgage: $${Math.round(monthlyMortgage)}`);
    console.log(`🏠 Monthly Tax: $${Math.round(monthlyTax)}`);
    console.log(`💸 Total Monthly Expenses: $${Math.round(totalExpenses)}`);
    console.log(`💵 Monthly Cash Flow: $${Math.round(cashFlow)}`);
    
    // Manual verdict assessment
    let verdict = 'UNKNOWN';
    if (grossYield >= 8.5 && cashFlow > 300) {
      verdict = 'BUY';
    } else if (grossYield >= 7.0 && cashFlow > 100) {
      verdict = 'NEGOTIATE';
    } else if (grossYield >= 6.0 && cashFlow > 0) {
      verdict = 'CAUTION';
    } else {
      verdict = 'PASS';
    }
    
    console.log(`🎯 Manual Assessment Verdict: ${verdict}`);
    console.log('=====================================');
  }
}

function calculateMortgage(principal, rate, years) {
  const monthlyRate = rate / 100 / 12;
  const numPayments = years * 12;
  return principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1);
}

// Run the analysis
analyzeAnnaTxProperty().catch(console.error);