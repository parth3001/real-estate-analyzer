/**
 * Portfolio Performance Test Script (Issue #41)
 *
 * Tests the new MongoDB aggregation + caching implementation
 *
 * Usage:
 *   node test-portfolio-performance.js <userId>
 *
 * Example:
 *   node test-portfolio-performance.js 60a1234567890abcdef12345
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001';
const userId = process.argv[2];

if (!userId) {
  console.error('❌ Error: Please provide a userId');
  console.log('Usage: node test-portfolio-performance.js <userId>');
  console.log('Example: node test-portfolio-performance.js 60a1234567890abcdef12345');
  process.exit(1);
}

async function testPortfolioPerformance() {
  console.log('\n🧪 PORTFOLIO PERFORMANCE TEST (Issue #41)\n');
  console.log(`User ID: ${userId}\n`);

  try {
    // Test 1: Cold request (aggregation)
    console.log('Test 1: Cold Request (MongoDB Aggregation)');
    const start1 = Date.now();
    const response1 = await axios.get(`${BASE_URL}/api/portfolio/available/${userId}`);
    const duration1 = Date.now() - start1;

    console.log(`✅ Status: ${response1.status}`);
    console.log(`⏱️  Duration: ${duration1}ms`);
    console.log(`📊 Portfolios: ${response1.data.length}`);
    if (response1.data.length > 0) {
      console.log(`📁 Example: "${response1.data[0].name}" - ${response1.data[0].totalProperties} properties`);
    }
    console.log('');

    // Wait 1 second
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test 2: Warm request (cached)
    console.log('Test 2: Warm Request (Cached)');
    const start2 = Date.now();
    const response2 = await axios.get(`${BASE_URL}/api/portfolio/available/${userId}`);
    const duration2 = Date.now() - start2;

    console.log(`✅ Status: ${response2.status}`);
    console.log(`⏱️  Duration: ${duration2}ms`);
    console.log(`📊 Portfolios: ${response2.data.length}`);
    console.log('');

    // Performance analysis
    console.log('📈 PERFORMANCE ANALYSIS\n');
    console.log(`Cold Request:  ${duration1}ms ${duration1 < 2000 ? '✅ PASS (<2s target)' : '❌ FAIL'}`);
    console.log(`Warm Request:  ${duration2}ms ${duration2 < 200 ? '✅ PASS (<200ms target)' : '⚠️  OK'}`);
    console.log(`Cache Speedup: ${(duration1 / duration2).toFixed(1)}x faster`);
    console.log('');

    // Expected results
    console.log('🎯 EXPECTED PERFORMANCE (Issue #41)\n');
    console.log('Before fix:   27,000ms (N+1 query anti-pattern)');
    console.log('After (cold):    800ms (MongoDB aggregation)');
    console.log('After (warm):     50ms (cached)');
    console.log('');

    // Verdict
    if (duration1 < 2000 && duration2 < 200) {
      console.log('✅ SUCCESS - Performance fix working as expected!');
    } else if (duration1 < 5000) {
      console.log('⚠️  ACCEPTABLE - Performance improved but could be better');
      console.log('   (May be slower on local dev vs Render production)');
    } else {
      console.log('❌ ISSUE - Performance not as expected');
      console.log('   Check backend logs for errors');
    }

  } catch (error) {
    console.error('❌ TEST FAILED\n');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Error: ${error.response.data.message || error.response.data}`);
    } else if (error.request) {
      console.error('No response from server. Is backend running?');
      console.error('Run: cd backend && npm run dev');
    } else {
      console.error(`Error: ${error.message}`);
    }
    process.exit(1);
  }
}

testPortfolioPerformance();
