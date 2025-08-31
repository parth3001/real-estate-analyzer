/**
 * Direct test of V3.0 Confidence Independence Fix
 * This tests the API directly to verify Deal Quality and Confidence are calculated independently
 */

const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function testConfidenceIndependence() {
    console.log('\n🧪 V3.0 Deal Quality vs Confidence Independence Test');
    console.log('=====================================================');
    
    try {
        // Test Property 1: High quality property with complete market data
        const highQualityData = {
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
            },
            longTermAssumptions: {
                projectionYears: 10,
                annualRentIncrease: 3,
                annualPropertyValueIncrease: 4,
                inflationRate: 2.5,
                vacancyRate: 5,
                sellingCostsPercentage: 8
            }
        };
        
        // Test Property 2: Lower quality property (worse fundamentals)
        const lowQualityData = {
            ...highQualityData,
            propertyName: 'Low Quality Test Property',
            purchasePrice: 200000,
            monthlyRent: 1000,  // Much worse rent ratio
            propertyTaxRate: 2.5,  // Higher taxes
            yearBuilt: 1970,  // Older property
            propertyAddress: {
                street: '456 Poor St',
                city: 'Smalltown',
                state: 'OH',
                zipCode: '44444'
            }
        };
        
        // Test Property 3: Good fundamentals but less market data (for confidence testing)
        const limitedDataProperty = {
            ...highQualityData,
            propertyName: 'Limited Market Data Property',
            monthlyRent: 1800,  // Good rent ratio
            propertyAddress: {
                street: '789 Remote St',
                city: 'UnknownTown',
                state: 'WY',
                zipCode: '82001'
            }
        };
        
        console.log('\n📊 Testing Property 1: High Quality with Complete Data...');
        const response1 = await axios.post(`${API_URL}/deals/analyze`, highQualityData, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        const result1 = response1.data;
        
        const dealQuality1 = result1.analysis?.investmentDecision?.professionalAssessment?.dealQuality || 0;
        const confidence1 = result1.analysis?.investmentDecision?.confidence || 0;
        const verdict1 = result1.analysis?.investmentDecision?.verdict || 'N/A';
        
        console.log(`  Deal Quality: ${dealQuality1}/100`);
        console.log(`  Confidence: ${confidence1}%`);
        console.log(`  Verdict: ${verdict1}`);
        console.log(`  Delta: ${Math.abs(dealQuality1 - confidence1)} (should be different)`);
        
        console.log('\n📊 Testing Property 2: Low Quality Property...');
        const response2 = await axios.post(`${API_URL}/deals/analyze`, lowQualityData, {
            headers: { 'Content-Type': 'application/json' }
        });
        const result2 = response2.data;
        
        const dealQuality2 = result2.analysis?.investmentDecision?.professionalAssessment?.dealQuality || 0;
        const confidence2 = result2.analysis?.investmentDecision?.confidence || 0;
        const verdict2 = result2.analysis?.investmentDecision?.verdict || 'N/A';
        
        console.log(`  Deal Quality: ${dealQuality2}/100`);
        console.log(`  Confidence: ${confidence2}%`);
        console.log(`  Verdict: ${verdict2}`);
        console.log(`  Delta: ${Math.abs(dealQuality2 - confidence2)} (should be different)`);
        
        console.log('\n📊 Testing Property 3: Good Property with Limited Market Data...');
        const response3 = await axios.post(`${API_URL}/deals/analyze`, limitedDataProperty, {
            headers: { 'Content-Type': 'application/json' }
        });
        const result3 = response3.data;
        
        const dealQuality3 = result3.analysis?.investmentDecision?.professionalAssessment?.dealQuality || 0;
        const confidence3 = result3.analysis?.investmentDecision?.confidence || 0;
        const verdict3 = result3.analysis?.investmentDecision?.verdict || 'N/A';
        
        console.log(`  Deal Quality: ${dealQuality3}/100`);
        console.log(`  Confidence: ${confidence3}%`);
        console.log(`  Verdict: ${verdict3}`);
        console.log(`  Delta: ${Math.abs(dealQuality3 - confidence3)} (should be different)`);
        
        // Analysis
        console.log('\n📋 INDEPENDENCE ANALYSIS:');
        console.log('=========================');
        
        // Check if Deal Quality and Confidence are independent
        const areEqual1 = dealQuality1 === confidence1;
        const areEqual2 = dealQuality2 === confidence2;
        const areEqual3 = dealQuality3 === confidence3;
        
        if (!areEqual1 && !areEqual2 && !areEqual3) {
            console.log('✅ SUCCESS: Deal Quality and Confidence are calculated independently!');
            console.log('   - Deal Quality measures property investment attractiveness (0-100)');
            console.log('   - Confidence measures certainty in our analysis (30-95%)');
            console.log('   - They change independently based on different factors');
            
            // Show how they vary differently
            console.log('\n📊 Variation Analysis:');
            console.log(`   Property 1: Quality=${dealQuality1}, Confidence=${confidence1}, Spread=${Math.abs(dealQuality1 - confidence1)}`);
            console.log(`   Property 2: Quality=${dealQuality2}, Confidence=${confidence2}, Spread=${Math.abs(dealQuality2 - confidence2)}`);
            console.log(`   Property 3: Quality=${dealQuality3}, Confidence=${confidence3}, Spread=${Math.abs(dealQuality3 - confidence3)}`);
            
            // Check confidence description
            if (result1.analysis?.investmentDecision?.confidenceDescription) {
                console.log('\n💡 Confidence Descriptions:');
                console.log(`   Property 1 (${confidence1}%): ${result1.analysis.investmentDecision.confidenceDescription}`);
                console.log(`   Property 2 (${confidence2}%): ${result2.analysis.investmentDecision.confidenceDescription}`);
                console.log(`   Property 3 (${confidence3}%): ${result3.analysis.investmentDecision.confidenceDescription}`);
            }
        } else {
            console.log('❌ ISSUE DETECTED: Some properties still show identical Deal Quality and Confidence');
            if (areEqual1) console.log(`   Property 1: Both are ${dealQuality1}`);
            if (areEqual2) console.log(`   Property 2: Both are ${dealQuality2}`);
            if (areEqual3) console.log(`   Property 3: Both are ${dealQuality3}`);
            console.log('\n   This suggests the fix may not be fully applied.');
        }
        
        return {
            property1: { dealQuality: dealQuality1, confidence: confidence1, verdict: verdict1 },
            property2: { dealQuality: dealQuality2, confidence: confidence2, verdict: verdict2 },
            property3: { dealQuality: dealQuality3, confidence: confidence3, verdict: verdict3 },
            allIndependent: !areEqual1 && !areEqual2 && !areEqual3
        };
        
    } catch (error) {
        console.error('❌ Test failed:', error.response?.data?.error || error.message);
        if (error.code === 'ECONNREFUSED') {
            console.log('\n⚠️  Backend server is not running. Please start it with: npm run dev');
        }
        return null;
    }
}

// Run the test
if (require.main === module) {
    testConfidenceIndependence()
        .then(results => {
            if (results && results.allIndependent) {
                console.log('\n🎉 V3.0 Fix Verified: Deal Quality and Confidence are independent!');
                process.exit(0);
            } else {
                console.log('\n⚠️  Test completed but independence not fully verified.');
                process.exit(1);
            }
        })
        .catch(err => {
            console.error('Test execution failed:', err);
            process.exit(1);
        });
}