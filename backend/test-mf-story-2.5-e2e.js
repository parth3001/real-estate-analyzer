#!/usr/bin/env node
/**
 * QE Test Suite: Story 2.5 - MF Decision Engine AI Enhancement
 * Using CORRECT credentials: dualmode.test@example.com / TestUser123!
 */

const fs = require('fs');

const MF_PAYLOAD = JSON.parse(fs.readFileSync('/tmp/mf-test-payload.json', 'utf8'));

async function testStory25() {
  console.log('\n🧪 QE TEST SUITE: STORY 2.5 - MF AI ENHANCEMENT');
  console.log('='.repeat(60));
  console.log('');

  try {
    // Step 1: Login with CORRECT credentials
    console.log('Step 1: Logging in with existing user...');
    const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'dualmode.test@example.com',
        password: 'TestUser123!'
      })
    });

    if (!loginResponse.ok) {
      const errorText = await loginResponse.text();
      throw new Error(`Login failed: HTTP ${loginResponse.status} - ${errorText}`);
    }

    const loginData = await loginResponse.json();
    const token = loginData.accessToken; // ← Fixed: was loginData.token

    if (!token) {
      throw new Error('No token received from login');
    }

    console.log('✅ Token obtained');
    console.log('');

    // Step 2: Send MF analysis request
    console.log('Step 2: Sending MF analysis request...');
    const response = await fetch('http://localhost:3001/api/deals/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(MF_PAYLOAD)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();

    if (data.error) {
      console.error('❌ API ERROR:', data.error);
      process.exit(1);
    }

    console.log('✅ Response received');
    console.log('');

    const { investmentDecision: id, analysis: a, keyMetrics } = data;

    // Step 3: Validate Story 2.5 acceptance criteria
    console.log('Step 3: Validating Story 2.5 acceptance criteria...');
    console.log('='.repeat(60));
    console.log('');

    const tests = [];

    // Test 1: Verdict (Core 80%)
    const test1 = {
      name: 'Test 1: Verdict Generation',
      pass: !!id?.verdict,
      value: id?.verdict || 'NONE'
    };
    tests.push(test1);
    console.log(`${test1.pass ? '✅' : '❌'} ${test1.name}`);
    console.log(`   Verdict: ${test1.value}`);
    console.log('');

    // Test 2: Deal Quality Score (Core 80%)
    const test2 = {
      name: 'Test 2: Deal Quality Score',
      pass: id?.professionalAssessment?.dealQuality !== undefined,
      value: id?.professionalAssessment?.dealQuality
    };
    tests.push(test2);
    console.log(`${test2.pass ? '✅' : '❌'} ${test2.name}`);
    console.log(`   Score: ${test2.value !== undefined ? test2.value + '/100' : 'NONE'}`);
    console.log('');

    // Test 3: Walk-Away Price (Core 80%)
    const test3 = {
      name: 'Test 3: Walk-Away Price',
      pass: !!id?.marketPosition?.walkAwayPrice,
      value: id?.marketPosition?.walkAwayPrice
    };
    tests.push(test3);
    console.log(`${test3.pass ? '✅' : '❌'} ${test3.name}`);
    console.log(`   Price: ${test3.value ? '$' + test3.value.toLocaleString() : 'NONE'}`);
    console.log('');

    // Test 4: AI Enhanced Content (STORY 2.5 - AI 20%)
    const test4 = {
      name: 'Test 4: AI Enhanced Content (Story 2.5)',
      pass: !!id?.aiEnhancedContent,
      value: id?.aiEnhancedContent
    };
    tests.push(test4);
    console.log(`${test4.pass ? '✅' : '❌'} ${test4.name} ⭐️`);
    console.log(`   Present: ${test4.pass ? 'YES' : 'NO'}`);
    if (test4.pass && test4.value.reasoning) {
      const reasoning = typeof test4.value.reasoning === 'string'
        ? test4.value.reasoning
        : JSON.stringify(test4.value.reasoning);
      console.log(`   Reasoning: "${reasoning.substring(0, 100)}..."`);
    }
    console.log('');

    // Test 5: Goal-Based Reasoning (STORY 2.5 - AI 20%)
    const test5 = {
      name: 'Test 5: Goal-Based Reasoning (Story 2.5)',
      pass: !!id?.goalBasedReasoning,
      value: id?.goalBasedReasoning
    };
    tests.push(test5);
    console.log(`${test5.pass ? '✅' : '❌'} ${test5.name} ⭐️`);
    console.log(`   Present: ${test5.pass ? 'YES' : 'NO'}`);
    if (test5.pass && test5.value) {
      const reasoning = typeof test5.value === 'string'
        ? test5.value
        : JSON.stringify(test5.value);
      console.log(`   Reasoning: "${reasoning.substring(0, 100)}..."`);
    }
    console.log('');

    // Test 6: Core MF Metrics
    const test6 = {
      name: 'Test 6: Core MF Metrics (NOI, Cap Rate, DSCR)',
      pass: !!(keyMetrics?.noi && keyMetrics?.capRate && keyMetrics?.dscr),
      value: keyMetrics
    };
    tests.push(test6);
    console.log(`${test6.pass ? '✅' : '❌'} ${test6.name}`);
    if (test6.pass) {
      console.log(`   NOI: $${test6.value.noi.toLocaleString()}/year`);
      console.log(`   Cap Rate: ${test6.value.capRate.toFixed(2)}%`);
      console.log(`   DSCR: ${test6.value.dscr.toFixed(2)}x`);
    } else {
      console.log(`   Status: MISSING (Backend calculation issue - NOT Story 2.5)`);
    }
    console.log('');

    // Summary
    const passed = tests.filter(t => t.pass).length;
    const failed = tests.length - passed;

    console.log('='.repeat(60));
    console.log('🏁 STORY 2.5 TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Passed: ${passed}/${tests.length}`);
    console.log(`❌ Failed: ${failed}/${tests.length}`);
    console.log('');

    if (failed === 0) {
      console.log('🎉 ALL TESTS PASSED - STORY 2.5 COMPLETE!');
      console.log('');
      console.log('✅ MF Decision Engine (100% - Core 80% + AI 20%):');
      console.log('   • Investment verdict (BUY/NEGOTIATE/CAUTION/PASS)');
      console.log('   • Deal quality score (0-100)');
      console.log('   • Walk-away price calculation');
      console.log('   • ⭐️ AI-enhanced content (reasoning, action plan, capital strategy)');
      console.log('   • ⭐️ Goal-based personalized recommendations');
      console.log('   • Core MF metrics (NOI, Cap Rate, DSCR)');
      console.log('');
      console.log('🚀 Backend Stories 1.1-2.5: 100% COMPLETE');
      console.log('📅 Ready for Story 3.1: Frontend MF Property Form');
      console.log('');
      process.exit(0);
    } else {
      console.log('⚠️  TESTS FAILED');
      console.log('');
      console.log('Failed Tests:');
      tests.filter(t => !t.pass).forEach(t => {
        console.log(`  ❌ ${t.name}`);
      });
      console.log('');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ TEST EXECUTION ERROR:', error.message);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run tests
testStory25();
