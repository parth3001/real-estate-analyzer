/**
 * React-PDF Generation Test Script (CommonJS Compatible)
 *
 * Purpose: Verify that @react-pdf/renderer can generate valid PDFs
 * Runtime: ~2 seconds
 *
 * Usage:
 *   node test-react-pdf-fixed.js
 */

const React = require('react');
const { Document, Page, Text, View, StyleSheet, pdf } = require('@react-pdf/renderer');
const fs = require('fs');
const path = require('path');

// ============================================================
// Test Data (Simulating Real Analysis)
// ============================================================

const mockAnalysis = {
  dealQualityScore: 87,
  scoreLabel: 'Above professional standards',
  propertyDetails: {
    address: '1837 Walnut Way, Anna, TX 75409',
    purchasePrice: 350000,
    squareFeet: 1800,
    bedrooms: 3,
    bathrooms: 2,
  },
  financing: {
    downPayment: 70000,
    downPaymentPercent: 20,
    interestRate: 7.5,
    loanTerm: 30,
    monthlyPayment: 1958.28,
  },
  rental: {
    monthlyRent: 2400,
    vacancyRate: 8,
    effectiveMonthlyIncome: 2208,
  },
  expenses: {
    propertyTax: 437.50,
    insurance: 150,
    maintenance: 120,
    propertyManagement: 192,
    hoa: 0,
    utilities: 0,
    totalMonthlyExpenses: 899.50,
  },
  cashFlow: {
    monthlyNetCashFlow: 350.22,
    annualNetCashFlow: 4202.64,
  },
  returns: {
    capRate: 7.2,
    cashOnCashReturn: 6.0,
    totalROI: 8.5,
  },
};

// ============================================================
// React-PDF Styles
// ============================================================

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    backgroundColor: '#FFFFFF',
  },
  header: {
    marginBottom: 20,
    borderBottom: '2pt solid #2196F3',
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: '#666666',
  },
  scoreSection: {
    marginTop: 20,
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#E8F5E9',
    borderRadius: 4,
  },
  scoreTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  scoreValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  scoreLabel: {
    fontSize: 12,
    color: '#2E7D32',
    marginTop: 5,
  },
  section: {
    marginTop: 15,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 10,
    borderBottom: '1pt solid #CCCCCC',
    paddingBottom: 5,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  label: {
    fontSize: 10,
    color: '#666666',
  },
  value: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#333333',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#999999',
    borderTop: '1pt solid #CCCCCC',
    paddingTop: 10,
  },
});

// ============================================================
// React-PDF Components (using React.createElement, no JSX)
// ============================================================

function AnalysisPdfDocument({ analysis }) {
  return React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: 'A4', style: styles.page },

      // Header
      React.createElement(
        View,
        { style: styles.header },
        React.createElement(Text, { style: styles.title }, 'REanalyzr Property Analysis'),
        React.createElement(Text, { style: styles.subtitle }, analysis.propertyDetails.address)
      ),

      // Deal Quality Score
      React.createElement(
        View,
        { style: styles.scoreSection },
        React.createElement(Text, { style: styles.scoreTitle }, 'Investment Decision Score'),
        React.createElement(Text, { style: styles.scoreValue }, `${analysis.dealQualityScore}/100`),
        React.createElement(Text, { style: styles.scoreLabel }, analysis.scoreLabel)
      ),

      // Property Details Section
      React.createElement(
        View,
        { style: styles.section },
        React.createElement(Text, { style: styles.sectionTitle }, 'Property Details'),
        React.createElement(
          View,
          { style: styles.row },
          React.createElement(Text, { style: styles.label }, 'Purchase Price'),
          React.createElement(Text, { style: styles.value }, `$${analysis.propertyDetails.purchasePrice.toLocaleString()}`)
        ),
        React.createElement(
          View,
          { style: styles.row },
          React.createElement(Text, { style: styles.label }, 'Square Feet'),
          React.createElement(Text, { style: styles.value }, `${analysis.propertyDetails.squareFeet.toLocaleString()} sq ft`)
        ),
        React.createElement(
          View,
          { style: styles.row },
          React.createElement(Text, { style: styles.label }, 'Bedrooms / Bathrooms'),
          React.createElement(Text, { style: styles.value }, `${analysis.propertyDetails.bedrooms} bd / ${analysis.propertyDetails.bathrooms} ba`)
        )
      ),

      // Financing Section
      React.createElement(
        View,
        { style: styles.section },
        React.createElement(Text, { style: styles.sectionTitle }, 'Financing'),
        React.createElement(
          View,
          { style: styles.row },
          React.createElement(Text, { style: styles.label }, 'Down Payment'),
          React.createElement(Text, { style: styles.value }, `$${analysis.financing.downPayment.toLocaleString()} (${analysis.financing.downPaymentPercent}%)`)
        ),
        React.createElement(
          View,
          { style: styles.row },
          React.createElement(Text, { style: styles.label }, 'Interest Rate'),
          React.createElement(Text, { style: styles.value }, `${analysis.financing.interestRate}%`)
        ),
        React.createElement(
          View,
          { style: styles.row },
          React.createElement(Text, { style: styles.label }, 'Monthly Payment'),
          React.createElement(Text, { style: styles.value }, `$${analysis.financing.monthlyPayment.toLocaleString()}`)
        )
      ),

      // Rental Income Section
      React.createElement(
        View,
        { style: styles.section },
        React.createElement(Text, { style: styles.sectionTitle }, 'Rental Income'),
        React.createElement(
          View,
          { style: styles.row },
          React.createElement(Text, { style: styles.label }, 'Monthly Rent'),
          React.createElement(Text, { style: styles.value }, `$${analysis.rental.monthlyRent.toLocaleString()}`)
        ),
        React.createElement(
          View,
          { style: styles.row },
          React.createElement(Text, { style: styles.label }, 'Vacancy Rate'),
          React.createElement(Text, { style: styles.value }, `${analysis.rental.vacancyRate}%`)
        ),
        React.createElement(
          View,
          { style: styles.row },
          React.createElement(Text, { style: styles.label }, 'Effective Monthly Income'),
          React.createElement(Text, { style: styles.value }, `$${analysis.rental.effectiveMonthlyIncome.toLocaleString()}`)
        )
      ),

      // Key Metrics Section
      React.createElement(
        View,
        { style: styles.section },
        React.createElement(Text, { style: styles.sectionTitle }, 'Key Investment Metrics'),
        React.createElement(
          View,
          { style: styles.row },
          React.createElement(Text, { style: styles.label }, 'Monthly Net Cash Flow'),
          React.createElement(Text, { style: styles.value }, `$${analysis.cashFlow.monthlyNetCashFlow.toLocaleString()}`)
        ),
        React.createElement(
          View,
          { style: styles.row },
          React.createElement(Text, { style: styles.label }, 'Annual Net Cash Flow'),
          React.createElement(Text, { style: styles.value }, `$${analysis.cashFlow.annualNetCashFlow.toLocaleString()}`)
        ),
        React.createElement(
          View,
          { style: styles.row },
          React.createElement(Text, { style: styles.label }, 'Cap Rate'),
          React.createElement(Text, { style: styles.value }, `${analysis.returns.capRate}%`)
        ),
        React.createElement(
          View,
          { style: styles.row },
          React.createElement(Text, { style: styles.label }, 'Cash-on-Cash Return'),
          React.createElement(Text, { style: styles.value }, `${analysis.returns.cashOnCashReturn}%`)
        )
      ),

      // Footer
      React.createElement(
        View,
        { style: styles.footer },
        React.createElement(Text, null, 'Generated by REanalyzr - Professional Real Estate Analysis'),
        React.createElement(Text, null, `reanalyzr.com | ${new Date().toLocaleDateString()}`)
      )
    )
  );
}

// ============================================================
// Test React-PDF Generation
// ============================================================

async function testReactPdfGeneration() {
  console.log('🔍 Testing React-PDF generation...\n');

  const startTime = Date.now();

  try {
    // Step 1: Create PDF document
    console.log('📄 Creating PDF document with React components...');
    const doc = React.createElement(AnalysisPdfDocument, { analysis: mockAnalysis });

    // Step 2: Render to blob/buffer
    console.log('⚙️  Rendering PDF to blob...');
    const pdfBlob = await pdf(doc).toBlob();

    // Step 3: Convert blob to buffer
    const arrayBuffer = await pdfBlob.arrayBuffer();
    const pdfBuffer = Buffer.from(arrayBuffer);

    const duration = Date.now() - startTime;
    const fileSizeKB = Math.round(pdfBuffer.length / 1024);

    console.log('✅ PDF generated successfully!\n');

    // Step 4: Save to file for inspection
    const outputPath = path.join(__dirname, 'test-analysis.pdf');
    fs.writeFileSync(outputPath, pdfBuffer);

    console.log('📊 Generation Metrics:');
    console.log(`   Duration: ${duration}ms`);
    console.log(`   File Size: ${fileSizeKB} KB`);
    console.log(`   Buffer Length: ${pdfBuffer.length.toLocaleString()} bytes\n`);

    console.log('✅ Test PDF saved to: test-analysis.pdf\n');

    // Step 4: Performance Assessment
    console.log('⚡ Performance Assessment:');
    if (duration < 500) {
      console.log(`   ✅ EXCELLENT: ${duration}ms is well below target (P95 < 1000ms)`);
    } else if (duration < 1000) {
      console.log(`   ✅ GOOD: ${duration}ms meets target (P95 < 1000ms)`);
    } else {
      console.log(`   ⚠️  WARNING: ${duration}ms exceeds target (P95 < 1000ms)`);
      console.log('   Consider optimizing PDF complexity or running on faster hardware');
    }

    // Step 5: Size Assessment
    console.log('\n📦 File Size Assessment:');
    if (fileSizeKB < 200) {
      console.log(`   ✅ EXCELLENT: ${fileSizeKB}KB is well within target (< 300KB)`);
    } else if (fileSizeKB < 300) {
      console.log(`   ✅ GOOD: ${fileSizeKB}KB meets target (< 300KB)`);
    } else {
      console.log(`   ⚠️  WARNING: ${fileSizeKB}KB exceeds target (< 300KB)`);
      console.log('   Consider reducing image sizes or simplifying layout');
    }

    console.log('\n🎉 SUCCESS! React-PDF is working correctly.\n');
    console.log('Next Steps:');
    console.log('1. Open test-analysis.pdf to verify the layout looks good');
    console.log('2. Check that all numbers are formatted correctly');
    console.log('3. If everything looks good, you\'re ready to implement Feature #14!\n');

    return true;

  } catch (error) {
    console.error('❌ FAILED to generate PDF\n');
    console.error('Error Details:');
    console.error(`   Type: ${error.name}`);
    console.error(`   Message: ${error.message}`);
    console.error(`   Stack: ${error.stack}\n`);

    console.error('Possible Issues:');
    console.error('1. @react-pdf/renderer not installed (run: npm install @react-pdf/renderer)');
    console.error('2. Invalid React component structure');
    console.error('3. Styling errors in StyleSheet\n');

    return false;
  }
}

// ============================================================
// Run Test
// ============================================================

testReactPdfGeneration()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
