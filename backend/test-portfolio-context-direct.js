/**
 * Direct test of portfolio context generation
 * Tests the exact function that's failing
 */

const mongoose = require('mongoose');
require('dotenv').config();

async function testPortfolioContext() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // 1. Find Test_New portfolio
    const Portfolio = mongoose.model('Portfolio', new mongoose.Schema({}, { strict: false }), 'portfolios');
    const testPortfolio = await Portfolio.findOne({ name: 'Test_New' });
    
    if (!testPortfolio) {
      console.log('❌ Test_New portfolio not found');
      process.exit(1);
    }
    
    console.log('📁 PORTFOLIO FOUND:');
    console.log('  Name:', testPortfolio.name);
    console.log('  ID:', testPortfolio._id);
    console.log('  Goal:', testPortfolio.goals?.primaryGoal);
    console.log();

    // 2. Test the portfolioAnalyticsService directly
    const { portfolioAnalyticsService } = require('./dist/services/portfolio/portfolioAnalyticsService');
    
    console.log('📊 TESTING PORTFOLIO ANALYTICS SERVICE:');
    const analytics = await portfolioAnalyticsService.calculatePortfolioAnalytics(testPortfolio._id.toString());
    
    console.log('Analytics Result:');
    console.log('  Has analytics?', !!analytics);
    console.log('  Structure:', Object.keys(analytics || {}));
    
    // Check both possible structures
    console.log('\n🔍 CHECKING DATA STRUCTURES:');
    console.log('  analytics.summary exists?', !!analytics?.summary);
    console.log('  analytics.basicMetrics exists?', !!analytics?.basicMetrics);
    
    if (analytics?.summary) {
      console.log('\n✅ Summary Data:');
      console.log('  totalProperties:', analytics.summary.totalProperties);
      console.log('  monthlyNetCashFlow: $', Math.round(analytics.summary.monthlyNetCashFlow || 0));
      console.log('  totalValue: $', Math.round(analytics.summary.totalValue || 0));
    }
    
    if (analytics?.basicMetrics) {
      console.log('\n⚠️  BasicMetrics Data (LEGACY):');
      console.log('  totalProperties:', analytics.basicMetrics.totalProperties);
      console.log('  monthlyNetCashFlow: $', Math.round(analytics.basicMetrics.monthlyNetCashFlow || 0));
    }

    // 3. Check raw database for analytics
    console.log('\n📊 CHECKING RAW DATABASE:');
    const PortfolioAnalytics = mongoose.model('PortfolioAnalytics', new mongoose.Schema({}, { strict: false }), 'portfolioanalytics');
    const rawAnalytics = await PortfolioAnalytics.findOne({ portfolioId: testPortfolio._id });
    
    if (rawAnalytics) {
      const raw = rawAnalytics.toObject();
      console.log('  Raw analytics found');
      console.log('  Has summary?', !!raw.summary);
      console.log('  Has basicMetrics?', !!raw.basicMetrics);
      
      if (raw.summary) {
        console.log('  summary.totalProperties:', raw.summary.totalProperties);
        console.log('  summary.monthlyNetCashFlow:', raw.summary.monthlyNetCashFlow);
      }
      if (raw.basicMetrics) {
        console.log('  basicMetrics.totalProperties:', raw.basicMetrics.totalProperties);
        console.log('  basicMetrics.monthlyNetCashFlow:', raw.basicMetrics.monthlyNetCashFlow);
      }
    } else {
      console.log('  No analytics document found in database');
    }

    // 4. Check deals in portfolio
    console.log('\n🏠 CHECKING DEALS IN PORTFOLIO:');
    const Deal = mongoose.model('Deal', new mongoose.Schema({}, { strict: false }), 'deals');
    
    // Try both ObjectId and string queries
    const dealsById = await Deal.find({ portfolioId: testPortfolio._id });
    const dealsByString = await Deal.find({ portfolioId: testPortfolio._id.toString() });
    
    console.log(`  Deals found by ObjectId: ${dealsById.length}`);
    console.log(`  Deals found by string: ${dealsByString.length}`);
    
    // Check all deals to see portfolio references
    const allDeals = await Deal.find({});
    const dealsWithPortfolio = allDeals.filter(d => d.portfolioId);
    console.log(`  Total deals in database: ${allDeals.length}`);
    console.log(`  Deals with portfolioId: ${dealsWithPortfolio.length}`);
    
    // Check if our portfolio ID matches
    const matchingDeals = dealsWithPortfolio.filter(d => {
      const portfolioIdStr = d.portfolioId?.toString();
      const targetIdStr = testPortfolio._id.toString();
      return portfolioIdStr === targetIdStr;
    });
    console.log(`  Deals matching Test_New portfolio: ${matchingDeals.length}`);
    
    if (matchingDeals.length > 0) {
      console.log('\n  Sample deal in portfolio:');
      const sample = matchingDeals[0];
      console.log('    Address:', sample.propertyAddress?.street || 'N/A');
      console.log('    Cash Flow:', sample.analysis?.monthlyAnalysis?.cashFlow || 'N/A');
      console.log('    PortfolioId type:', typeof sample.portfolioId);
      console.log('    PortfolioId value:', sample.portfolioId);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testPortfolioContext();