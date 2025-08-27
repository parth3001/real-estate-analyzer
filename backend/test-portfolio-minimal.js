/**
 * Minimal test to check portfolio analytics data structure
 */

const mongoose = require('mongoose');
require('dotenv').config();

async function testMinimal() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Direct query without models to avoid conflicts
    const db = mongoose.connection.db;
    
    // 1. Find Test_New portfolio
    const portfoliosCollection = db.collection('portfolios');
    const testPortfolio = await portfoliosCollection.findOne({ name: 'Test_New' });
    
    if (!testPortfolio) {
      console.log('❌ Test_New portfolio not found');
      process.exit(1);
    }
    
    console.log('📁 PORTFOLIO FOUND:');
    console.log('  Name:', testPortfolio.name);
    console.log('  ID:', testPortfolio._id);
    console.log('  Goal:', testPortfolio.goals?.primaryGoal);
    console.log();

    // 2. Check portfolio analytics document
    console.log('📊 CHECKING PORTFOLIO ANALYTICS:');
    const analyticsCollection = db.collection('portfolioanalytics');
    const analytics = await analyticsCollection.findOne({ portfolioId: testPortfolio._id });
    
    if (analytics) {
      console.log('  ✅ Analytics document found');
      console.log('  Document structure:', Object.keys(analytics));
      console.log('\n  🔍 Data Fields:');
      console.log('    Has summary?', !!analytics.summary);
      console.log('    Has basicMetrics?', !!analytics.basicMetrics);
      
      if (analytics.summary) {
        console.log('\n  ✅ Summary Data (CORRECT):');
        console.log('    totalProperties:', analytics.summary.totalProperties);
        console.log('    monthlyNetCashFlow:', analytics.summary.monthlyNetCashFlow);
        console.log('    totalValue:', analytics.summary.totalValue);
        console.log('    averageCapRate:', analytics.summary.averageCapRate);
      }
      
      if (analytics.basicMetrics) {
        console.log('\n  ⚠️  BasicMetrics Data (LEGACY):');
        console.log('    totalProperties:', analytics.basicMetrics.totalProperties);
        console.log('    monthlyNetCashFlow:', analytics.basicMetrics.monthlyNetCashFlow);
      }
    } else {
      console.log('  ❌ No analytics document found');
    }

    // 3. Check deals in portfolio
    console.log('\n🏠 CHECKING DEALS IN PORTFOLIO:');
    const dealsCollection = db.collection('deals');
    
    // Count deals with this portfolioId
    const dealsInPortfolio = await dealsCollection.find({ 
      portfolioId: testPortfolio._id 
    }).toArray();
    
    console.log(`  Deals found with portfolioId (ObjectId): ${dealsInPortfolio.length}`);
    
    // Try string match as backup
    const allDeals = await dealsCollection.find({}).toArray();
    const matchingDeals = allDeals.filter(d => {
      if (!d.portfolioId) return false;
      return d.portfolioId.toString() === testPortfolio._id.toString();
    });
    
    console.log(`  Deals found with portfolioId (string match): ${matchingDeals.length}`);
    
    if (matchingDeals.length > 0) {
      console.log('\n  Sample deals in portfolio:');
      matchingDeals.slice(0, 3).forEach((deal, i) => {
        console.log(`    ${i + 1}. ${deal.propertyAddress?.street || 'Unknown'}`);
        console.log(`       Cash Flow: $${deal.analysis?.monthlyAnalysis?.cashFlow || 'N/A'}/mo`);
        console.log(`       Cap Rate: ${deal.analysis?.keyMetrics?.capRate || 'N/A'}%`);
      });
    }
    
    // 4. Manual calculation check
    if (matchingDeals.length > 0) {
      console.log('\n📈 MANUAL CALCULATION CHECK:');
      const totalCashFlow = matchingDeals.reduce((sum, deal) => {
        return sum + (deal.analysis?.monthlyAnalysis?.cashFlow || 0);
      }, 0);
      
      const totalValue = matchingDeals.reduce((sum, deal) => {
        return sum + (deal.purchasePrice || 0);
      }, 0);
      
      console.log('  Calculated from deals:');
      console.log('    Total Properties:', matchingDeals.length);
      console.log('    Total Monthly Cash Flow: $', Math.round(totalCashFlow));
      console.log('    Total Portfolio Value: $', Math.round(totalValue));
      
      if (analytics?.summary) {
        console.log('\n  Compare with stored analytics:');
        console.log('    Stored Properties:', analytics.summary.totalProperties, 
                    matchingDeals.length === analytics.summary.totalProperties ? '✅' : '❌');
        console.log('    Stored Cash Flow: $', Math.round(analytics.summary.monthlyNetCashFlow || 0),
                    Math.abs(totalCashFlow - (analytics.summary.monthlyNetCashFlow || 0)) < 1 ? '✅' : '❌');
      }
    }
    
    await mongoose.connection.close();
    console.log('\n✅ Test complete');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testMinimal();