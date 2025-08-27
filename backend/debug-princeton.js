const mongoose = require('mongoose');
require('dotenv').config();

// Import the Deal model
const { Deal } = require('./src/models/Deal');

async function findPrincetonProperty() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Find the Princeton property
    const property = await Deal.findOne({
      $or: [
        { propertyName: { $regex: 'Princeton', $options: 'i' } },
        { 'propertyAddress.street': { $regex: '1105.*Princeton', $options: 'i' } }
      ]
    });
    
    if (property) {
      console.log('Found Princeton property:');
      console.log('ID:', property._id);
      console.log('Property Name:', property.propertyName);
      console.log('Address:', property.propertyAddress?.street);
      console.log('Portfolio ID:', property.portfolioId);
      console.log('User ID:', property.userId);
      console.log('Created At:', property.createdAt);
      console.log('---');
      
      // Check if portfolioId exists and find that portfolio
      if (property.portfolioId) {
        const Portfolio = require('./src/models/Portfolio').Portfolio;
        const portfolio = await Portfolio.findById(property.portfolioId);
        
        if (portfolio) {
          console.log('Associated Portfolio:');
          console.log('Portfolio ID:', portfolio._id);
          console.log('Portfolio Name:', portfolio.name);
          console.log('Portfolio Status:', portfolio.status);
          console.log('Portfolio Archived:', portfolio.isArchived);
        } else {
          console.log('Portfolio not found - orphaned reference!');
          console.log('This property references a deleted/non-existent portfolio');
        }
      }
    } else {
      console.log('Princeton property not found');
      
      // Let's search for all properties to see what we have
      const allProperties = await Deal.find({}).limit(10);
      console.log('All properties (first 10):');
      allProperties.forEach(prop => {
        console.log(`- ${prop.propertyName || 'Unnamed'} (${prop.propertyAddress?.street || 'No address'})`);
      });
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

findPrincetonProperty();