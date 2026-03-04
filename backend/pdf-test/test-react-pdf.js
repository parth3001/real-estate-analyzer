/**
 * React-PDF Generation Test Script
 *
 * Purpose: Verify that @react-pdf/renderer can generate valid PDFs with our analysis data
 * Runtime: ~2 seconds
 *
 * Usage:
 *   npm install @react-pdf/renderer  # Run this first if not installed
 *   node test-react-pdf.js
 *
 * Expected Output:
 *   ✅ PDF generated successfully
 *   📄 test-analysis.pdf created (check the file)
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
// React-PDF Components
// ============================================================

const AnalysisPdfDocument = ({ analysis }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>REanalyzr Property Analysis</Text>
        <Text style={styles.subtitle}>{analysis.propertyDetails.address}</Text>
      </View>

      {/* Deal Quality Score */}
      <View style={styles.scoreSection}>
        <Text style={styles.scoreTitle}>Investment Decision Score</Text>
        <Text style={styles.scoreValue}>{analysis.dealQualityScore}/100</Text>
        <Text style={styles.scoreLabel}>{analysis.scoreLabel}</Text>
      </View>

      {/* Property Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Property Details</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Purchase Price</Text>
          <Text style={styles.value}>${analysis.propertyDetails.purchasePrice.toLocaleString()}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Square Feet</Text>
          <Text style={styles.value}>{analysis.propertyDetails.squareFeet.toLocaleString()} sq ft</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Bedrooms / Bathrooms</Text>
          <Text style={styles.value}>{analysis.propertyDetails.bedrooms} bd / {analysis.propertyDetails.bathrooms} ba</Text>
        </View>
      </View>

      {/* Financing */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Financing</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Down Payment</Text>
          <Text style={styles.value}>${analysis.financing.downPayment.toLocaleString()} ({analysis.financing.downPaymentPercent}%)</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Interest Rate</Text>
          <Text style={styles.value}>{analysis.financing.interestRate}%</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Monthly Payment</Text>
          <Text style={styles.value}>${analysis.financing.monthlyPayment.toLocaleString()}</Text>
        </View>
      </View>

      {/* Rental Income */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Rental Income</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Monthly Rent</Text>
          <Text style={styles.value}>${analysis.rental.monthlyRent.toLocaleString()}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Vacancy Rate</Text>
          <Text style={styles.value}>{analysis.rental.vacancyRate}%</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Effective Monthly Income</Text>
          <Text style={styles.value}>${analysis.rental.effectiveMonthlyIncome.toLocaleString()}</Text>
        </View>
      </View>

      {/* Key Metrics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Key Investment Metrics</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Monthly Net Cash Flow</Text>
          <Text style={styles.value}>${analysis.cashFlow.monthlyNetCashFlow.toLocaleString()}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Annual Net Cash Flow</Text>
          <Text style={styles.value}>${analysis.cashFlow.annualNetCashFlow.toLocaleString()}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Cap Rate</Text>
          <Text style={styles.value}>{analysis.returns.capRate}%</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Cash-on-Cash Return</Text>
          <Text style={styles.value}>{analysis.returns.cashOnCashReturn}%</Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text>Generated by REanalyzr - Professional Real Estate Analysis</Text>
        <Text>reanalyzr.com | {new Date().toLocaleDateString()}</Text>
      </View>
    </Page>
  </Document>
);

// ============================================================
// Test React-PDF Generation
// ============================================================

async function testReactPdfGeneration() {
  console.log('🔍 Testing React-PDF generation...\n');

  const startTime = Date.now();

  try {
    // Step 1: Create PDF document
    console.log('📄 Creating PDF document with React components...');
    const doc = <AnalysisPdfDocument analysis={mockAnalysis} />;

    // Step 2: Render to buffer
    console.log('⚙️  Rendering PDF to buffer...');
    const pdfBuffer = await pdf(doc).toBuffer();

    const duration = Date.now() - startTime;
    const fileSizeKB = Math.round(pdfBuffer.length / 1024);

    console.log('✅ PDF generated successfully!\n');

    // Step 3: Save to file for inspection
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

    process.exit(1);
  }
}

// ============================================================
// Run Test
// ============================================================

testReactPdfGeneration();
