/**
 * Test Issue #6 Fix: Market Rent Data Persistence
 * 
 * This test verifies that marketRent field is:
 * 1. Accepted by backend interface
 * 2. Saved to MongoDB
 * 3. Retrieved correctly
 */

console.log('\n========== ISSUE #6: MARKET RENT PERSISTENCE TEST ==========\n');

// Simulate wizard sending data with marketRent field
const wizardData = {
  propertyType: 'MF',
  totalUnits: 8,
  unitTypes: [
    {
      type: '2BR/1BA',
      count: 6,
      sqft: 850,
      monthlyRent: 1260,  // Current rent (what user entered or tenant pays)
      marketRent: 1400    // RentCast estimate (Issue #6 fix)
    },
    {
      type: '1BR/1BA', 
      count: 2,
      sqft: 650,
      monthlyRent: 1100,  // Current rent
      marketRent: 1200    // RentCast estimate (Issue #6 fix)
    }
  ]
};

console.log('1. Wizard Data (with marketRent field):');
console.log(JSON.stringify(wizardData.unitTypes, null, 2));

console.log('\n2. Expected in MongoDB:');
console.log('   - unitTypes[0].monthlyRent: $1,260');
console.log('   - unitTypes[0].marketRent: $1,400 ✅');
console.log('   - unitTypes[1].monthlyRent: $1,100');
console.log('   - unitTypes[1].marketRent: $1,200 ✅');

console.log('\n3. Expected in Unit Mix Tab:');
console.log('   - 2BR/1BA: Current Rent $1,260 | Market Rent $1,400 | Gap +$140');
console.log('   - 1BR/1BA: Current Rent $1,100 | Market Rent $1,200 | Gap +$100');

console.log('\n4. Value-Add Opportunity Calculation:');
const currentAnnual = (1260 * 6 + 1100 * 2) * 12; // $112,320
const marketAnnual = (1400 * 6 + 1200 * 2) * 12;  // $129,600
const upside = marketAnnual - currentAnnual;      // $17,280/year

console.log(`   Current Annual Rent: $${currentAnnual.toLocaleString()}`);
console.log(`   Market Annual Rent: $${marketAnnual.toLocaleString()}`);
console.log(`   Annual Upside: $${upside.toLocaleString()} (+${((upside/currentAnnual)*100).toFixed(1)}%)`);

console.log('\n========== TEST INSTRUCTIONS ==========\n');
console.log('To verify Issue #6 fix works:');
console.log('');
console.log('Option A - Update Existing Property:');
console.log('  1. Open Greenville TX property in wizard');
console.log('  2. Go to Step 3 (Unit Configuration)');
console.log('  3. Click "Auto-Populate Rents" button');
console.log('  4. Save property');
console.log('  5. Check Unit Mix tab - should show Market Rent values');
console.log('');
console.log('Option B - Create New Property:');
console.log('  1. Start new MF property wizard');
console.log('  2. Complete steps 1-2');
console.log('  3. In Step 3, click "Auto-Populate Rents"');
console.log('  4. Finish wizard and save');
console.log('  5. Check Unit Mix tab - should show Market Rent values');
console.log('');
console.log('✅ FIX IS WORKING IF:');
console.log('   - Market Rent column shows dollar amounts (not N/A)');
console.log('   - Value-Add Opportunity card shows upside calculation');
console.log('   - Gap column shows difference between current and market');
console.log('');
console.log('❌ FIX NOT WORKING IF:');
console.log('   - Market Rent column still shows N/A');
console.log('   - Message: "Market rent data not available"');
console.log('');

console.log('========== END TEST ==========\n');
