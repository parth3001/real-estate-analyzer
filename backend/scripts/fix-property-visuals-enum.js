/**
 * Migration Script: Fix Property Visuals Enum Validation Error
 *
 * Problem: Some deals have propertyVisuals.source and propertyVisuals.apiStatus
 * set to null, which violates the enum constraint in the Mongoose schema.
 *
 * Solution: Remove propertyVisuals field from affected deals so they can be
 * re-analyzed with fresh visual data.
 *
 * Usage: node scripts/fix-property-visuals-enum.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

async function fixPropertyVisualsEnum() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/real-estate-analyzer';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Find all deals with invalid propertyVisuals (source or apiStatus is null)
    const DealsCollection = mongoose.connection.collection('deals');

    const invalidDeals = await DealsCollection.find({
      $or: [
        { 'propertyVisuals.source': null },
        { 'propertyVisuals.apiStatus': null }
      ]
    }).toArray();

    console.log(`\n📊 Found ${invalidDeals.length} deals with invalid propertyVisuals enum values`);

    if (invalidDeals.length === 0) {
      console.log('✅ No deals need fixing!');
      await mongoose.disconnect();
      return;
    }

    // Show affected deals
    console.log('\n🔍 Affected Deals:');
    invalidDeals.forEach((deal, i) => {
      console.log(`  ${i + 1}. Deal ID: ${deal._id}`);
      console.log(`     Address: ${deal.propertyAddress?.street || 'N/A'}`);
      console.log(`     Source: ${deal.propertyVisuals?.source}`);
      console.log(`     API Status: ${deal.propertyVisuals?.apiStatus}`);
    });

    // Fix: Remove propertyVisuals field entirely from these deals
    console.log('\n🔧 Removing invalid propertyVisuals fields...');

    const result = await DealsCollection.updateMany(
      {
        $or: [
          { 'propertyVisuals.source': null },
          { 'propertyVisuals.apiStatus': null }
        ]
      },
      {
        $unset: { propertyVisuals: "" }  // Remove the entire propertyVisuals field
      }
    );

    console.log(`\n✅ Fixed ${result.modifiedCount} deals`);
    console.log('   Deals can now be re-analyzed to fetch fresh property visuals');

    await mongoose.disconnect();
    console.log('✅ Migration complete!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
fixPropertyVisualsEnum();
