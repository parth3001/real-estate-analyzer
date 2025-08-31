/**
 * Test V3.0 Deal Quality vs Confidence Independence
 * Verifies that Deal Quality and Confidence are calculated independently
 */

const { InvestmentDecisionEngine } = require('./src/services/investment/investmentDecisionEngine');

async function testConfidenceIndependence() {
    console.log('\n🧪 V3.0 Confidence Independence Test');
    console.log('=====================================');
    
    const engine = new InvestmentDecisionEngine();
    
    // Test Property 1: High quality property with complete data (should have high confidence)
    const highQualityProperty = {
        propertyName: 'High Quality Test Property',
        purchasePrice: 200000,
        monthlyRent: 2000,
        downPayment: 40000,
        interestRate: 6.5,
        loanTerm: 30,
        propertyTaxRate: 1.2,
        insuranceCost: 1200,
        maintenanceReserve: 200,
        propertyManagementRate: 8,
        vacancyRate: 5,
        yearBuilt: 2010,
        squareFootage: 1400,
        bedrooms: 3,
        bathrooms: 2,
        propertyType: 'SFR',
        propertyAddress: {
            street: '123 Test St',
            city: 'Orlando',
            state: 'FL',
            zipCode: '32801'
        }
    };
    
    // Test Property 2: Lower quality property with incomplete data (should have lower confidence)
    const lowQualityProperty = {
        propertyName: 'Low Quality Test Property',
        purchasePrice: 200000,
        monthlyRent: 1000, // Much lower rent, worse fundamentals
        downPayment: 40000,
        interestRate: 6.5,
        loanTerm: 30,
        propertyTaxRate: 2.5, // High tax rate
        insuranceCost: 800,
        maintenanceReserve: 100,
        propertyManagementRate: 10,
        vacancyRate: 8,
        // No yearBuilt, incomplete data
        squareFootage: 900,
        bedrooms: 2,
        bathrooms: 1,
        propertyType: 'SFR',
        propertyAddress: {
            street: '456 Poor St',
            city: 'Smalltown',
            state: 'OH',
            zipCode: '44444'
        }
    };
    
    // Mock user context
    const userContext = {
        availableCash: 50000,
        experienceLevel: 'intermediate',
        strategyContext: {
            portfolioStrategy: 'cashflow',
            exitStrategy: 'hold_longterm',
            riskApproach: 'balanced',
            holdPeriod: 10,
            marketTimingFlexibility: 'flexible'
        }
    };
    
    try {
        console.log('\n📊 Testing High Quality Property...');
        const result1 = await engine.generateInvestmentDecision(
            highQualityProperty,
            {}, // Basic analysis object
            {}, // Predictions
            { // Mock market intelligence with good data
                marketTier: { tier: 'A', name: 'Primary Market' },
                marketTrends: { averageRent: 1800, priceGrowth: 0.05 },
                economicIndicators: { medianHomePrice: 250000, unemployment: 3.5, populationGrowth: 2.1 },
                marketData: { capRates: [0.08, 0.09, 0.10], demographics: { population: 280000 } }
            },
            userContext
        );
        
        console.log('HIGH QUALITY RESULTS:');
        console.log(`  Deal Quality: ${result1.professionalAssessment?.dealQuality || 'N/A'}/100`);
        console.log(`  Confidence: ${result1.confidence}%`);
        console.log(`  Verdict: ${result1.verdict}`);
        console.log(`  Primary Reason: ${result1.primaryReason}`);
        
        console.log('\n📊 Testing Low Quality Property...');
        const result2 = await engine.generateInvestmentDecision(
            lowQualityProperty,
            {}, // Basic analysis object
            {}, // Predictions
            { // Mock market intelligence with limited data
                marketTier: { tier: 'C', name: 'Secondary Market' },
                marketTrends: { averageRent: 900 },
                economicIndicators: { medianHomePrice: 150000 },
                marketData: { capRates: [], demographics: null }
            },
            userContext
        );
        
        console.log('LOW QUALITY RESULTS:');
        console.log(`  Deal Quality: ${result2.professionalAssessment?.dealQuality || 'N/A'}/100`);
        console.log(`  Confidence: ${result2.confidence}%`);
        console.log(`  Verdict: ${result2.verdict}`);
        console.log(`  Primary Reason: ${result2.primaryReason}`);
        
        // Analyze results
        console.log('\n📋 INDEPENDENCE ANALYSIS:');
        const quality1 = result1.professionalAssessment?.dealQuality || 0;
        const confidence1 = result1.confidence;
        const quality2 = result2.professionalAssessment?.dealQuality || 0;
        const confidence2 = result2.confidence;
        
        console.log(`  Property 1 - Deal Quality: ${quality1}, Confidence: ${confidence1}`);
        console.log(`  Property 2 - Deal Quality: ${quality2}, Confidence: ${confidence2}`);
        
        // Check for independence
        const qualityDiff = Math.abs(quality1 - quality2);
        const confidenceDiff = Math.abs(confidence1 - confidence2);
        const areIndependent = Math.abs((quality1 - confidence1) - (quality2 - confidence2)) > 5;
        
        console.log(`  Quality Difference: ${qualityDiff} points`);
        console.log(`  Confidence Difference: ${confidenceDiff} points`);
        console.log(`  Are they independent? ${areIndependent ? '✅ YES' : '❌ NO'}`);
        
        if (areIndependent) {
            console.log('\n🎉 SUCCESS: Deal Quality and Confidence are calculated independently!');
            console.log('   - Deal Quality measures property investment attractiveness');
            console.log('   - Confidence measures certainty in our analysis');
        } else {
            console.log('\n⚠️  WARNING: Deal Quality and Confidence may still be linked');
            console.log('   - Check if confidence calculation needs further adjustment');
        }
        
        return {
            test1: { quality: quality1, confidence: confidence1, verdict: result1.verdict },
            test2: { quality: quality2, confidence: confidence2, verdict: result2.verdict },
            independent: areIndependent
        };
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('Stack:', error.stack);
        return null;
    }
}

// Run the test
if (require.main === module) {
    testConfidenceIndependence()
        .then(results => {
            if (results && results.independent) {
                process.exit(0); // Success
            } else {
                process.exit(1); // Failure
            }
        })
        .catch(err => {
            console.error('Test execution failed:', err);
            process.exit(1);
        });
}

module.exports = { testConfidenceIndependence };