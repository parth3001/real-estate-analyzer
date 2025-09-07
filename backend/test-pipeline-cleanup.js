const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/real-estate-analyzer');

// Import models
const PipelineDeal = require('./dist/models/PipelineDeal').PipelineDeal;
const Deal = require('./dist/models/Deal').DealModel;

async function testPipelineCleanup() {
  try {
    console.log('=== Pipeline Cleanup Test ===');
    
    // Find all pipeline deals for the test user
    const pipelineDeals = await PipelineDeal.find({}).populate('analysisId');
    
    console.log(`\nFound ${pipelineDeals.length} total pipeline deals:`);
    
    for (const deal of pipelineDeals) {
      console.log(`\nPipeline Deal: ${deal.dealName}`);
      console.log(`  - ID: ${deal._id}`);
      console.log(`  - Analysis ID: ${deal.analysisId || 'None'}`);
      console.log(`  - Analysis Status: ${deal.analysisStatus}`);
      console.log(`  - Stage: ${deal.currentStage}`);
      
      if (deal.analysisId) {
        // Check if the referenced analysis still exists
        const analysisExists = await Deal.findById(deal.analysisId);
        console.log(`  - Analysis exists: ${!!analysisExists}`);
        
        if (!analysisExists) {
          console.log(`  ⚠️  ORPHANED PIPELINE DEAL - Analysis ${deal.analysisId} no longer exists!`);
          
          // This is what we should clean up
          console.log(`  🗑️  Should delete this pipeline deal`);
        }
      }
    }
    
    // Find deals that were recently deleted (orphaned pipeline deals)
    const orphanedDeals = await PipelineDeal.aggregate([
      {
        $lookup: {
          from: 'deals',
          localField: 'analysisId',
          foreignField: '_id',
          as: 'analysis'
        }
      },
      {
        $match: {
          analysisId: { $exists: true },
          analysis: { $size: 0 } // No matching analysis found
        }
      }
    ]);
    
    console.log(`\n=== ORPHANED PIPELINE DEALS ===`);
    console.log(`Found ${orphanedDeals.length} orphaned pipeline deals:`);
    
    for (const deal of orphanedDeals) {
      console.log(`  - ${deal.dealName} (${deal._id}) - Analysis ID: ${deal.analysisId}`);
    }
    
    if (orphanedDeals.length > 0) {
      console.log(`\n🔧 To fix this, we should delete these ${orphanedDeals.length} orphaned pipeline deals.`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testPipelineCleanup();