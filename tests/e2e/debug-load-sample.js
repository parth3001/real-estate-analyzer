// Debug script to see what happens after Load Sample
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Login
    console.log('🔑 Logging in...');
    await page.goto('http://localhost:3000/login');
    await page.fill('input[type="email"]', 'admin@realestateanalyzer.com');
    await page.fill('input[type="password"]', 'S@madhu96780302');
    await page.click('button[type="submit"]');
    await page.waitForURL((url) => !url.toString().includes('/login'), { timeout: 15000 });
    console.log('✅ Login successful\n');

    // Navigate to SFR Analysis
    console.log('🏠 Navigating to SFR Analysis...');
    await page.goto('http://localhost:3000/sfr-analysis');
    await page.waitForTimeout(2000);
    console.log('✅ Page loaded\n');

    // Take screenshot BEFORE Load Sample
    await page.screenshot({ path: '/tmp/before-load-sample.png', fullPage: true });
    console.log('📸 Screenshot saved: /tmp/before-load-sample.png\n');

    // Click Load Sample
    console.log('📋 Clicking Load Sample...');
    await page.click('button:has-text("Load Sample")');
    await page.waitForTimeout(3000);
    console.log('✅ Load Sample clicked\n');

    // Take screenshot AFTER Load Sample
    await page.screenshot({ path: '/tmp/after-load-sample.png', fullPage: true });
    console.log('📸 Screenshot saved: /tmp/after-load-sample.png\n');

    // Get all buttons on the page
    console.log('🔍 Looking for buttons on page...\n');
    const buttons = await page.locator('button').all();
    console.log(`Found ${buttons.length} buttons:\n`);

    for (let i = 0; i < buttons.length; i++) {
      const text = await buttons[i].textContent();
      const isDisabled = await buttons[i].isDisabled();
      const isVisible = await buttons[i].isVisible();
      if (text && text.trim()) {
        console.log(`Button ${i}: "${text.trim()}" (disabled: ${isDisabled}, visible: ${isVisible})`);
      }
    }

    // Check body text for analysis-related keywords
    console.log('\n🔍 Checking page content...\n');
    const bodyText = await page.textContent('body');

    const keywords = ['Analyze', 'Calculate', 'Submit', 'Results', 'Manual Form', 'Smart Wizard'];
    keywords.forEach(keyword => {
      if (bodyText.includes(keyword)) {
        console.log(`✅ Found keyword: "${keyword}"`);
      }
    });

    // Try to find any form of analyze button with multiple selectors
    console.log('\n🔍 Testing different button selectors...\n');
    const selectors = [
      'button:has-text("Analyze Property")',
      'button:has-text("Analyze")',
      'button:has-text("Run Analysis")',
      'button:has-text("Calculate")',
      'button[type="submit"]',
      'button:has-text("Submit")'
    ];

    for (const selector of selectors) {
      try {
        const count = await page.locator(selector).count();
        console.log(`Selector "${selector}": ${count} matches`);
        if (count > 0) {
          const isDisabled = await page.locator(selector).first().isDisabled();
          console.log(`  First match disabled: ${isDisabled}`);
        }
      } catch (e) {
        console.log(`Selector "${selector}": Error - ${e.message}`);
      }
    }

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    await page.screenshot({ path: '/tmp/debug-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();
