const mongoose = require('mongoose');
require('dotenv').config();

const dealSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  portfolioId: mongoose.Schema.Types.ObjectId,
  propertyName: String
}, { strict: false });

const portfolioSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  name: String,
  status: String
}, { strict: false });

const Deal = mongoose.model('Deal', dealSchema);
const Portfolio = mongoose.model('Portfolio', portfolioSchema);

async function fixPrincetonProperty() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Find Princeton property
    const princetonProp = await Deal.findOne({
      propertyName: { $regex: 'Princeton', $options: 'i' }
    });
    
    if (!princetonProp) {
      console.log('Princeton property not found');
      return;
    }
    
    console.log('Found Princeton property:', {
      id: princetonProp._id,
      name: princetonProp.propertyName,
      portfolioId: princetonProp.portfolioId
    });
    
    if (princetonProp.portfolioId) {
      // Find the portfolio
      const portfolio = await Portfolio.findById(princetonProp.portfolioId);
      console.log('Associated portfolio:', portfolio ? {
        id: portfolio._id,
        name: portfolio.name,
        status: portfolio.status
      } : 'NOT FOUND');
      
      // Remove the portfolio reference from Princeton property
      await Deal.updateOne(
        { _id: princetonProp._id },
        { $unset: { portfolioId: 1 } }
      );
      
      console.log('✅ Removed portfolio reference from Princeton property');
      console.log('Princeton is now available for portfolio assignment!');
    } else {
      console.log('Princeton property has no portfolio reference');
    }
    
    // Verify the fix
    const updatedProp = await Deal.findById(princetonProp._id);
    console.log('Verification - Princeton portfolioId:', updatedProp.portfolioId || 'NONE');
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixPrincetonProperty();