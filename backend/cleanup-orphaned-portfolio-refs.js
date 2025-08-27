/**
 * Cleanup script to remove orphaned portfolio references from properties
 * This script finds properties that reference portfolios that no longer exist
 * and removes those references.
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Define minimal schemas directly
const dealSchema = new mongoose.Schema({
  portfolioId: { type: mongoose.Schema.Types.ObjectId, ref: 'Portfolio' },
  propertyName: String,
  propertyAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String
  }
}, { strict: false });

const portfolioSchema = new mongoose.Schema({
  name: String,
  status: String,
  isArchived: Boolean
}, { strict: false });

const Deal = mongoose.model('Deal', dealSchema);
const Portfolio = mongoose.model('Portfolio', portfolioSchema);

async function cleanupOrphanedReferences() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Find all properties with portfolioId
    const propertiesWithPortfolio = await Deal.find({ 
      portfolioId: { $exists: true, $ne: null } 
    });
    
    console.log(`Found ${propertiesWithPortfolio.length} properties with portfolio references`);
    
    let orphanedCount = 0;
    let cleanedCount = 0;
    
    for (const property of propertiesWithPortfolio) {
      // Check if the referenced portfolio exists
      const portfolio = await Portfolio.findById(property.portfolioId);
      
      if (!portfolio) {
        console.log(`Orphaned reference found: ${property.propertyName || 'Unnamed'} (${property.propertyAddress?.street || 'No address'}) -> ${property.portfolioId}`);
        
        // Remove the orphaned reference
        await Deal.updateOne(
          { _id: property._id },
          { $unset: { portfolioId: 1 } }
        );
        
        orphanedCount++;
        cleanedCount++;
        console.log(`✅ Cleaned orphaned reference for property: ${property.propertyName}`);
      } else {
        console.log(`✓ Valid reference: ${property.propertyName} -> ${portfolio.name} (${portfolio.status})`);
      }
    }
    
    console.log('\n📊 Cleanup Summary:');
    console.log(`Total properties checked: ${propertiesWithPortfolio.length}`);
    console.log(`Orphaned references found: ${orphanedCount}`);
    console.log(`References cleaned: ${cleanedCount}`);
    
    if (cleanedCount > 0) {
      console.log('\n✅ Properties are now available for portfolio assignment!');
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error during cleanup:', error);
    process.exit(1);
  }
}

// Run cleanup if called directly
if (require.main === module) {
  cleanupOrphanedReferences();
}

module.exports = { cleanupOrphanedReferences };