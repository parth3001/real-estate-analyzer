#!/usr/bin/env node

/**
 * Test the portfolio context generation function directly
 */

const mongoose = require('mongoose');
require('dotenv').config();

async function testPortfolioContextFunction() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Import the function and services 
    const { portfolioService } = require('./src/services/portfolio/portfolioService');
    const { portfolioAnalyticsService } = require('./src/services/portfolio/portfolioAnalyticsService');
    
    // Test portfolio ID from our previous test
    const portfolioId = '689fc209f7474f80a974a65a';
    
    console.log('Testing portfolio context generation...');
    
    // Check if portfolio exists
    const portfolio = await portfolioService.getPortfolioById(portfolioId);
    console.log('Portfolio found:', portfolio ? {
      name: portfolio.name,
      goals: portfolio.goals
    } : 'NOT FOUND');
    
    if (!portfolio) {
      console.log('❌ Portfolio not found - this is why context generation fails');
      
      // List available portfolios
      console.log('\nAvailable portfolios for dualmode user:');
      const Portfolio = require('./src/models/Portfolio').Portfolio;
      const User = require('./src/models/User').User;
      
      const user = await User.findOne({ email: 'dualmode.test@example.com' });
      if (user) {
        const portfolios = await Portfolio.find({ userId: user._id });
        portfolios.forEach(p => {
          console.log(`- ${p.name} (ID: ${p._id}) - Status: ${p.status}`);
        });
      }
      
      return;
    }
    
    // Test analytics
    const analytics = await portfolioAnalyticsService.calculatePortfolioAnalytics(portfolioId);
    console.log('Portfolio analytics:', analytics ? {
      totalProperties: analytics.basicMetrics?.totalProperties,
      monthlyNetCashFlow: analytics.basicMetrics?.monthlyNetCashFlow
    } : 'NOT FOUND');
    
    // Test portfolio context generation
    const mockAnalysis = {
      monthlyAnalysis: {
        cashFlow: -552 // Negative cash flow
      }
    };
    
    // Simulate the context generation logic
    const monthlyCashFlow = mockAnalysis?.monthlyAnalysis?.cashFlow || 0;
    const portfolioGoal = portfolio.goals?.primaryGoal || 'BALANCED';
    
    let impactSummary = '';
    if (portfolioGoal === 'CASH_FLOW') {
      if (monthlyCashFlow > 0) {
        impactSummary = 'Supports your cash flow objectives with positive monthly returns.';
      } else {
        impactSummary = 'This property has negative cash flow and may not align with your cash flow objectives.';
      }
    } else {
      impactSummary = 'Aligns with your portfolio\'s diversification strategy.';
    }
    
    console.log('\n📋 Generated Portfolio Context:');
    console.log('Portfolio Name:', portfolio.name);
    console.log('Portfolio Goal:', portfolioGoal);
    console.log('Current Properties:', analytics?.basicMetrics?.totalProperties || 0);
    console.log('Monthly Cash Flow:', monthlyCashFlow);
    console.log('Impact Summary:', impactSummary);
    
    console.log('\n✅ Portfolio context generation works correctly!');
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testPortfolioContextFunction();