const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/real-estate-analyzer');

// Import models
const PipelineDeal = require('./dist/models/PipelineDeal').PipelineDeal;

async function cleanupOrphanedPipelineDeals() {
  try {
    console.log('=== Cleanup Orphaned Pipeline Deals ===');
    
    // Find orphaned pipeline deals (have analysisId but analysis no longer exists)
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
    
    console.log(`Found ${orphanedDeals.length} orphaned pipeline deals to clean up:`);
    
    for (const deal of orphanedDeals) {
      console.log(`  - ${deal.dealName} (${deal._id}) - Analysis ID: ${deal.analysisId}`);
    }
    
    if (orphanedDeals.length > 0) {
      // Delete the orphaned pipeline deals
      const orphanedIds = orphanedDeals.map(deal => deal._id);
      
      const deleteResult = await PipelineDeal.deleteMany({
        _id: { $in: orphanedIds }
      });
      
      console.log(`\n✅ Successfully deleted ${deleteResult.deletedCount} orphaned pipeline deals.`);
      console.log(`The pipeline should now be clean!`);
    } else {
      console.log(`\n✅ No orphaned pipeline deals found. Pipeline is clean!`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

cleanupOrphanedPipelineDeals();