#!/usr/bin/env node

const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/real-estate-analyzer');

const DealSchema = new mongoose.Schema({}, { strict: false });
const Deal = mongoose.model('Deal', DealSchema);

const PortfolioSchema = new mongoose.Schema({}, { strict: false });
const Portfolio = mongoose.model('Portfolio', PortfolioSchema);

async function checkPortfolioData() {
  try {
    console.log('🔍 Checking portfolio database...');
    
    // Find Test1 portfolio
    const portfolio = await Portfolio.findById('68a2a00d1c7eaa516bbccc66');
    if (!portfolio) {
      console.log('❌ Portfolio not found');
      return;
    }
    
    console.log(`✅ Found portfolio: ${portfolio.name}`);
    console.log(`   Goals: ${portfolio.goals?.primaryGoal}`);
    
    // Find deals associated with this portfolio
    console.log('\n🏠 Checking for properties...');
    const dealsWithPortfolio = await Deal.find({ portfolioId: portfolio._id });
    console.log(`   Found ${dealsWithPortfolio.length} properties with portfolioId`);
    
    if (dealsWithPortfolio.length > 0) {
      dealsWithPortfolio.forEach((deal, i) => {
        console.log(`   ${i + 1}. ${deal.propertyName} - $${deal.purchasePrice}`);
      });
    }
    
    // Check all deals for this user
    console.log('\n📊 Checking all user deals...');
    const allUserDeals = await Deal.find({ userId: portfolio.userId });
    console.log(`   Found ${allUserDeals.length} total deals for this user`);
    
    allUserDeals.forEach((deal, i) => {
      console.log(`   ${i + 1}. ${deal.propertyName} - $${deal.purchasePrice} (portfolioId: ${deal.portfolioId || 'none'})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    mongoose.disconnect();
  }
}

checkPortfolioData();