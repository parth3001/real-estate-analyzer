/**
 * Debug script to check manual property in portfolio
 * Run this to see what's happening with your "business" property
 */
const mongoose = require('mongoose');

// Connect to database
mongoose.connect('mongodb://localhost:27017/real_estate_analyzer')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

async function debugManualProperty() {
  try {
    const { DealModel } = require('./src/models/Deal');
    
    console.log('\n🔍 DEBUGGING MANUAL PROPERTY ISSUE');
    console.log('==================================');
    
    // Find your Test_New portfolio
    const Portfolio = require('./src/models/Portfolio').Portfolio;
    const portfolio = await Portfolio.findOne({ name: 'Test_New' });
    
    if (!portfolio) {
      console.log('❌ Portfolio "Test_New" not found');
      return;
    }
    
    console.log(`✅ Found portfolio: ${portfolio.name} (ID: ${portfolio._id})`);
    
    // Find all properties in this portfolio
    const properties = await DealModel.find({ 
      $or: [
        { portfolioId: portfolio._id },
        { portfolioId: portfolio._id.toString() }
      ]
    });
    
    console.log(`\n📊 Properties in portfolio: ${properties.length}`);
    
    properties.forEach((prop, i) => {
      console.log(`\n--- Property ${i + 1}: ${prop.propertyName} ---`);
      console.log(`Type: ${prop.propertyType}`);
      console.log(`Purchase Price: $${prop.purchasePrice}`);
      console.log(`Monthly Rent: $${prop.monthlyRent}`);
      console.log(`Monthly Operating Expenses: $${prop.monthlyOperatingExpenses}`);
      console.log(`Source: ${prop.source}`);
      console.log(`isManualEntry: ${prop.isManualEntry}`);
      console.log(`Has Analysis: ${!!prop.analysis}`);
      console.log(`Portfolio ID: ${prop.portfolioId} (type: ${typeof prop.portfolioId})`);
      
      // Calculate expected cash flow
      const rent = prop.monthlyRent || 0;
      const expenses = prop.monthlyOperatingExpenses || 0;
      const expectedCashFlow = rent - expenses;
      console.log(`Expected Cash Flow: $${expectedCashFlow} (${rent} - ${expenses})`);
    });
    
    // Now test the analytics calculation
    console.log('\n🧮 TESTING ANALYTICS CALCULATION');
    console.log('================================');
    
    const { PortfolioAnalyticsService } = require('./src/services/portfolio/portfolioAnalyticsService');
    const analytics = await new PortfolioAnalyticsService().calculatePortfolioAnalytics(portfolio._id.toString());
    
    console.log(`\n📈 Portfolio Analytics Results:`);
    console.log(`Total Properties: ${analytics.summary.totalProperties}`);
    console.log(`Total Value: $${analytics.summary.totalValue}`);
    console.log(`Monthly Rental Income: $${analytics.summary.monthlyRentalIncome}`);
    console.log(`Monthly Net Cash Flow: $${analytics.summary.monthlyNetCashFlow}`);
    
    if (analytics.summary.monthlyNetCashFlow === 0 && properties.length > 0) {
      console.log('\n❌ ISSUE FOUND: Cash flow is $0 despite having properties!');
      console.log('This suggests the analytics calculation is not including manual properties properly.');
    } else {
      console.log('\n✅ Analytics appear to be working correctly.');
    }
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  } finally {
    mongoose.disconnect();
  }
}

debugManualProperty();