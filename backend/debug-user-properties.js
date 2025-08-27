const mongoose = require('mongoose');
require('dotenv').config();

const dealSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  portfolioId: mongoose.Schema.Types.ObjectId,
  propertyName: String,
  propertyAddress: Object
}, { strict: false });

const portfolioSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  name: String,
  status: String,
  isArchived: Boolean
}, { strict: false });

const userSchema = new mongoose.Schema({
  email: String,
  username: String
}, { strict: false });

const Deal = mongoose.model('Deal', dealSchema);
const Portfolio = mongoose.model('Portfolio', portfolioSchema);
const User = mongoose.model('User', userSchema);

async function debugUserProperties() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Find the "dualmode" test user
    const user = await User.findOne({ 
      $or: [
        { email: { $regex: 'dualmode', $options: 'i' } },
        { username: { $regex: 'dualmode', $options: 'i' } }
      ]
    });
    
    console.log('Found user:', user ? {
      id: user._id,
      email: user.email,
      username: user.username
    } : 'NOT FOUND');
    
    if (!user) {
      console.log('❌ Dualmode user not found. Let me show all users:');
      const allUsers = await User.find({}).limit(10);
      allUsers.forEach(u => {
        console.log(`- ${u.email || u.username} (ID: ${u._id})`);
      });
      return;
    }
    
    console.log('\n🏠 Properties for this user:');
    const userProperties = await Deal.find({ userId: user._id });
    console.log(`Total properties: ${userProperties.length}`);
    
    userProperties.forEach((prop, index) => {
      console.log(`${index + 1}. ${prop.propertyName} (Portfolio ID: ${prop.portfolioId || 'NONE'})`);
    });
    
    console.log('\n📁 Portfolios for this user:');
    const userPortfolios = await Portfolio.find({ userId: user._id });
    console.log(`Total portfolios: ${userPortfolios.length}`);
    
    userPortfolios.forEach((portfolio, index) => {
      console.log(`${index + 1}. ${portfolio.name} - Status: ${portfolio.status} - Archived: ${portfolio.isArchived}`);
    });
    
    console.log('\n🔍 Princeton Property Details:');
    const princetonProp = await Deal.findOne({
      userId: user._id,
      $or: [
        { propertyName: { $regex: 'Princeton', $options: 'i' } },
        { 'propertyAddress.street': { $regex: 'Princeton', $options: 'i' } }
      ]
    });
    
    if (princetonProp) {
      console.log('Property found:', {
        id: princetonProp._id,
        name: princetonProp.propertyName,
        portfolioId: princetonProp.portfolioId
      });
      
      if (princetonProp.portfolioId) {
        const portfolio = await Portfolio.findById(princetonProp.portfolioId);
        console.log('Associated portfolio:', portfolio ? {
          name: portfolio.name,
          status: portfolio.status,
          isArchived: portfolio.isArchived
        } : 'NOT FOUND');
      }
    } else {
      console.log('Princeton property not found for this user');
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

debugUserProperties();