#!/usr/bin/env node

/**
 * Database Migration: Add isFullAnalysis Flag
 * 
 * Adds isFullAnalysis flag to existing deal analysis records to distinguish
 * between full SFR analysis and portfolio skinny calculations.
 * 
 * Migration ensures backward compatibility with existing SFR properties.
 */

const mongoose = require('mongoose');
require('dotenv').config();

async function runMigration() {
  try {
    console.log('🔄 Starting Analysis Type Flag Migration...\n');
    
    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB successfully\n');
    
    // Get deals collection
    const db = mongoose.connection.db;
    const dealsCollection = db.collection('deals');
    
    // Find existing deals with analysis but no isFullAnalysis flag
    console.log('🔍 Finding deals with existing analysis data...');
    const existingAnalysisDeals = await dealsCollection.find({
      analysis: { $exists: true },
      "analysis.isFullAnalysis": { $exists: false }
    }).toArray();
    
    console.log(`📊 Found ${existingAnalysisDeals.length} deals with existing analysis data`);
    
    if (existingAnalysisDeals.length === 0) {
      console.log('✅ No migration needed - all deals already have isFullAnalysis flag');
      return;
    }
    
    // Show sample of what will be updated
    console.log('\n📋 Sample deals to be updated:');
    existingAnalysisDeals.slice(0, 3).forEach(deal => {
      console.log(`   - ${deal.propertyName} (${deal.propertyType}) - ID: ${deal._id}`);
    });
    
    if (existingAnalysisDeals.length > 3) {
      console.log(`   ... and ${existingAnalysisDeals.length - 3} more`);
    }
    
    // Update all existing analysis records to mark them as full analysis
    console.log('\n🔄 Adding isFullAnalysis: true flag to existing properties...');
    const updateResult = await dealsCollection.updateMany(
      {
        analysis: { $exists: true },
        "analysis.isFullAnalysis": { $exists: false }
      },
      {
        $set: { "analysis.isFullAnalysis": true }
      }
    );
    
    console.log(`✅ Migration completed successfully!`);
    console.log(`   📊 Updated ${updateResult.modifiedCount} deals`);
    console.log(`   🎯 All existing analysis records now marked as full analysis (isFullAnalysis: true)`);
    
    // Verify the migration
    console.log('\n🔍 Verifying migration results...');
    const verificationCount = await dealsCollection.countDocuments({
      analysis: { $exists: true },
      "analysis.isFullAnalysis": true
    });
    
    console.log(`✅ Verification: ${verificationCount} deals now have isFullAnalysis: true`);
    
    const remainingMissing = await dealsCollection.countDocuments({
      analysis: { $exists: true },
      "analysis.isFullAnalysis": { $exists: false }
    });
    
    if (remainingMissing === 0) {
      console.log('🎉 Migration verification passed - all analysis records have isFullAnalysis flag');
    } else {
      console.log(`⚠️  Warning: ${remainingMissing} deals still missing isFullAnalysis flag`);
    }
    
    console.log('\n📈 Migration Summary:');
    console.log('==================');
    console.log(`✅ Existing SFR Properties: ${updateResult.modifiedCount} deals → isFullAnalysis: true`);
    console.log('✅ Future Portfolio Properties: Will get → isFullAnalysis: false (via service)');
    console.log('✅ Backward Compatibility: Maintained for all existing analysis data');
    console.log('✅ System Ready: Portfolio Property Metrics Service can now distinguish analysis types');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n📡 Disconnected from MongoDB');
    console.log('🎯 Migration complete - ready for Portfolio Property Metrics Service!');
  }
}

// Run the migration
if (require.main === module) {
  runMigration().catch(console.error);
}

module.exports = { runMigration };