/**
 * Test AI Content Generation with Real Property Data
 */

const axios = require('axios');

async function testAIContent() {
  const propertyData = {
    propertyType: 'SFR',
    purchasePrice: 450000,
    downPayment: 90000,
    interestRate: 7.5,
    loanTerm: 30,
    monthlyRent: 3200,
    propertyTaxRate: 1.2,
    insuranceRate: 0.5,
    maintenanceCost: 2400,
    propertyManagementRate: 8,
    closingCosts: 5000,
    capitalInvestments: 0,
    yearBuilt: 2015,
    squareFootage: 2000,
    bedrooms: 3,
    bathrooms: 2,
    longTermAssumptions: {
      vacancyRate: 5,
      appreciationRate: 3,
      rentGrowthRate: 2.5,
      expenseGrowthRate: 2,
      projectionYears: 10,
      sellingCostRate: 7
    },
    goalsStrategy: {
      exitStrategy: 'sale',
      experienceLevel: 'intermediate',
      portfolioStrategy: 'cashflow',
      riskTolerance: 'moderate'
    }
  };

  try {
    console.log('Testing AI Content Generation...\n');
    console.log('Property Data:');
    console.log(`- Purchase Price: $${propertyData.purchasePrice.toLocaleString()}`);
    console.log(`- Monthly Rent: $${propertyData.monthlyRent.toLocaleString()}`);
    console.log(`- Down Payment: $${propertyData.downPayment.toLocaleString()}`);
    console.log('\n=================================\n');

    const response = await axios.post('http://localhost:3000/api/deals/analyze', propertyData);
    
    const { investmentDecision, analysis } = response.data;
    
    console.log('✅ INVESTMENT DECISION:');
    console.log(`Verdict: ${investmentDecision.verdict}`);
    console.log(`Deal Quality: ${investmentDecision.professionalAssessment?.dealQuality}/100`);
    console.log(`Primary Reason: ${investmentDecision.primaryReason}`);
    
    console.log('\n✅ AI ENHANCED CONTENT CHECK:');
    
    if (investmentDecision.aiEnhancedContent) {
      const aiContent = investmentDecision.aiEnhancedContent;
      
      // Check Reasoning Tab
      console.log('\n1. REASONING TAB:');
      console.log(`   Explanation: ${aiContent.reasoning?.explanation?.substring(0, 100)}...`);
      
      // Check for $0 values in reasoning
      const reasoningHasZero = JSON.stringify(aiContent.reasoning).includes('$0');
      console.log(`   ❌ Contains $0: ${reasoningHasZero ? 'YES - BUG!' : 'NO - Good'}`);
      
      // Check Action Plan Tab
      console.log('\n2. ACTION PLAN TAB:');
      console.log(`   Immediate Actions: ${aiContent.actionPlan?.immediateActions?.length || 0} items`);
      
      // Check for $0 values in action plan
      const actionPlanHasZero = JSON.stringify(aiContent.actionPlan).includes('$0');
      console.log(`   ❌ Contains $0: ${actionPlanHasZero ? 'YES - BUG!' : 'NO - Good'}`);
      
      // Check Capital Strategy Tab
      console.log('\n3. CAPITAL STRATEGY TAB:');
      console.log(`   Current Assessment: ${aiContent.capitalStrategy?.currentAssessment?.substring(0, 100)}...`);
      
      // Check for $0 values in capital strategy
      const capitalHasZero = JSON.stringify(aiContent.capitalStrategy).includes('$0');
      console.log(`   ❌ Contains $0: ${capitalHasZero ? 'YES - BUG!' : 'NO - Good'}`);
      
      // Check if real values are being used
      const capitalStrategyText = JSON.stringify(aiContent.capitalStrategy);
      const hasRealPurchasePrice = capitalStrategyText.includes('450,000') || capitalStrategyText.includes('450000');
      const hasRealRent = capitalStrategyText.includes('3,200') || capitalStrategyText.includes('3200');
      
      console.log(`   ✅ Has Real Purchase Price: ${hasRealPurchasePrice ? 'YES' : 'NO - Potential Issue'}`);
      console.log(`   ✅ Has Real Rent: ${hasRealRent ? 'YES' : 'NO - Potential Issue'}`);
      
      // Overall check
      const hasAnyZeroIssue = reasoningHasZero || actionPlanHasZero || capitalHasZero;
      
      console.log('\n=================================');
      if (hasAnyZeroIssue) {
        console.log('❌ AI CONTENT ISSUE: Found $0 values in AI-generated content!');
      } else {
        console.log('✅ AI CONTENT WORKING: No $0 values found, using real property data!');
      }
      
    } else {
      console.log('⚠️ No AI Enhanced Content found in response');
    }
    
  } catch (error) {
    console.error('Error testing AI content:', error.response?.data || error.message);
  }
}

testAIContent();