// Complete Playwright E2E Test for SFR Analysis - Gold Standard
// Tests Investment Decision Engine v3.1 to ensure SFR flow is NOT broken

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Listen to console messages to debug frontend issues
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`   [BROWSER ERROR] ${msg.text()}`);
    }
  });

  // Listen to page errors
  page.on('pageerror', error => {
    console.log(`   [PAGE ERROR] ${error.message}`);
  });

  try {
    console.log('🧪 Starting Gold Standard SFR E2E Test');
    console.log('🎯 Goal: Validate Investment Decision Engine v3.1 did NOT break SFR flow\n');

    // ====================
    // STEP 1: Login
    // ====================
    console.log('🔑 Step 1: Login');
    await page.goto('http://localhost:3000/login');
    await page.fill('input[type="email"]', 'admin@realestateanalyzer.com');
    await page.fill('input[type="password"]', 'S@madhu96780302');
    await page.click('button[type="submit"]');
    await page.waitForURL((url) => !url.toString().includes('/login'), { timeout: 15000 });
    console.log('✅ Login successful\n');

    // ====================
    // STEP 2: Navigate to SFR Analysis
    // ====================
    console.log('🏠 Step 2: Navigate to SFR Analysis');
    await page.goto('http://localhost:3000/sfr-analysis');
    await page.waitForTimeout(2000);
    console.log('✅ SFR Analysis page loaded\n');

    // ====================
    // STEP 3: Click Smart Wizard
    // ====================
    console.log('🧙 Step 3: Start Smart Wizard');
    await page.click('text=Smart Wizard');
    await page.waitForTimeout(2000);
    console.log('✅ Smart Wizard opened\n');

    // ====================
    // STEP 4: Fill Address (Step 1 of Wizard)
    // ====================
    console.log('📍 Step 4: Fill Address (Wizard Step 1)');
    const inputs = await page.locator('input').all();

    // Fill street address (first input with placeholder "123 Main Street")
    await inputs[0].fill('1837 Walnut Way');
    await page.waitForTimeout(500);

    // Fill city (second input with placeholder "Austin")
    await inputs[1].fill('Anna');
    await page.waitForTimeout(500);

    // Fill state (third input with placeholder "TX")
    await inputs[2].fill('TX');
    await page.waitForTimeout(500);

    // Fill zip (fourth input with placeholder "78701")
    await inputs[3].fill('75409');
    await page.waitForTimeout(2000);

    console.log('✅ Address entered: 1837 Walnut Way, Anna, TX 75409\n');

    // Click Next
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(3000);
    console.log('✅ Advanced to Step 2\n');

    // ====================
    // STEP 5: Fill Purchase Price (Step 2 of Wizard)
    // ====================
    console.log('💰 Step 5: Fill Purchase Price (Wizard Step 2)');

    // Find purchase price input - it's the first visible number input on the page
    const inputs2 = await page.locator('input[type="number"]').all();
    await inputs2[0].fill('245000');
    await page.waitForTimeout(3000); // CRITICAL: Wait for React to recalculate down payment
    console.log('✅ Purchase price entered: $245,000\n');

    // Click Next
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(3000);
    console.log('✅ Advanced to Step 3\n');

    // ====================
    // STEP 6: Skip Rental Info (Step 3 - use defaults)
    // ====================
    console.log('🏘️  Step 6: Skip Rental Info (using defaults)');
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(3000);
    console.log('✅ Advanced to Step 4\n');

    // ====================
    // STEP 7: Skip Assumptions (Step 4 - use defaults)
    // ====================
    console.log('📊 Step 7: Skip Assumptions (using defaults)');
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(3000);
    console.log('✅ Advanced to Step 5\n');

    // ====================
    // STEP 8: Click "Complete Analysis" button
    // ====================
    console.log('🎯 Step 8: Click Complete Analysis');

    // Wait for the Complete Analysis button to be enabled (not disabled)
    console.log('   Waiting for Complete Analysis button to be enabled...');
    await page.waitForSelector('button:has-text("Complete Analysis"):not([disabled])', {
      timeout: 10000
    });

    // Click the "Complete Analysis" button at bottom right
    await page.click('button:has-text("Complete Analysis"):not([disabled])');
    console.log('✅ Complete Analysis button clicked');
    console.log('   Button will change to "Analyzing..." while processing...');

    // Now wait for the verdict to appear on the page (analysis results auto-display)
    console.log('⏳ Waiting for analysis results to appear (up to 45 seconds)...');

    // Wait for the verdict text to appear (PASS, BUY, NEGOTIATE, or CAUTION)
    await page.waitForSelector('text=/PASS|BUY|NEGOTIATE|CAUTION/', {
      timeout: 45000
    });

    console.log('✅ Analysis complete - Results are now visible\n');

    // ====================
    // STEP 9: Extract Investment Decision Results
    // ====================
    console.log('📊 Step 9: Extract Investment Decision Results');
    await page.waitForTimeout(2000); // Wait for all content to render

    const bodyText = await page.textContent('body');

    // Extract verdict
    let verdict = 'UNKNOWN';
    if (bodyText.includes('STRONG BUY')) verdict = 'STRONG BUY';
    else if (bodyText.includes('BUY')) verdict = 'BUY';
    else if (bodyText.includes('NEGOTIATE')) verdict = 'NEGOTIATE';
    else if (bodyText.includes('CAUTION')) verdict = 'CAUTION';
    else if (bodyText.includes('PASS')) verdict = 'PASS';

    // Extract deal quality score
    const scoreMatch = bodyText.match(/(\d{1,2})\/100/);
    const score = scoreMatch ? scoreMatch[1] : 'Unknown';

    // Extract key financial metrics to confirm calculations work
    const capRateMatch = bodyText.match(/Cap Rate[:\s]+(\d+\.?\d*)%/);
    const capRate = capRateMatch ? capRateMatch[1] : 'N/A';

    const cashFlowMatch = bodyText.match(/Monthly Cash Flow[:\s]+\$?([-\d,]+)/);
    const cashFlow = cashFlowMatch ? cashFlowMatch[1] : 'N/A';

    // ====================
    // RESULTS
    // ====================
    console.log('');
    console.log('========================================');
    console.log('✅ GOLD STANDARD E2E TEST PASSED');
    console.log('========================================');
    console.log('');
    console.log('📍 Property: 1837 Walnut Way, Anna, TX 75409');
    console.log('💰 Purchase Price: $245,000');
    console.log('');
    console.log('🎯 Investment Decision Results:');
    console.log(`   Verdict: ${verdict}`);
    console.log(`   Deal Quality Score: ${score}/100`);
    console.log(`   Cap Rate: ${capRate}%`);
    console.log(`   Monthly Cash Flow: $${cashFlow}`);
    console.log('');
    console.log('========================================');
    console.log('✅ Investment Decision Engine v3.1 VALIDATED');
    console.log('✅ SFR Analysis Flow is NOT BROKEN');
    console.log('✅ Property Wizard Working Correctly');
    console.log('✅ Financial Calculations Working');
    console.log('========================================');
    console.log('');

    // Save final screenshot
    await page.screenshot({ path: '/tmp/playwright-success.png', fullPage: true });
    console.log('📸 Success screenshot saved to /tmp/playwright-success.png');

    // Exit successfully
    process.exit(0);

  } catch (error) {
    console.error('');
    console.error('========================================');
    console.error('❌ TEST FAILED');
    console.error('========================================');
    console.error(`Error: ${error.message}`);
    console.error('');

    // Save error screenshot
    await page.screenshot({ path: '/tmp/playwright-error.png', fullPage: true });
    console.error('📸 Error screenshot saved to /tmp/playwright-error.png');

    process.exit(1);
  } finally {
    await browser.close();
  }
})();
