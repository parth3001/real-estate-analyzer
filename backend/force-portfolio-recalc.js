/**
 * Force portfolio analytics recalculation
 */

const mongoose = require('mongoose');
require('dotenv').config();

async function forceRecalculation() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Import the compiled service
    const { portfolioAnalyticsService } = require('./dist/services/portfolio/portfolioAnalyticsService');

    const portfolioId = '68a7cef03b389ec982b013ff'; // Test_New portfolio ID
    
    console.log('🔄 FORCING PORTFOLIO ANALYTICS RECALCULATION...');
    console.log('Portfolio ID:', portfolioId);
    
    // Force recalculation
    const analytics = await portfolioAnalyticsService.calculatePortfolioAnalytics(portfolioId);
    
    console.log('\n✅ RECALCULATION COMPLETE!');
    console.log('\nUpdated Analytics:');
    console.log('  Total Properties:', analytics.summary?.totalProperties || 0);
    console.log('  Monthly Cash Flow: $', Math.round(analytics.summary?.monthlyNetCashFlow || 0));
    console.log('  Total Value: $', Math.round(analytics.summary?.totalValue || 0));
    console.log('  Average Cap Rate:', (analytics.summary?.averageCapRate || 0).toFixed(2) + '%');
    
    await mongoose.connection.close();
    console.log('\n🎉 Portfolio analytics updated successfully!');
    
  } catch (error) {
    console.error('❌ Recalculation failed:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

forceRecalculation();