/**
 * Test Portfolio Fit Analysis floating-point precision fix
 * Validates that frontend formatting function correctly handles precision issues
 */

// Simulate the frontend function
function roundCurrency(value) {
  if (value === undefined || value === null || isNaN(value)) return 0;
  const multiplier = Math.pow(10, 2);
  return Math.round(value * multiplier) / multiplier;
}

function formatPortfolioFitText(text) {
  if (!text) return '';
  
  // Match monetary values like $19.650000000000002 and format them properly
  return text.replace(/\$(\d+\.?\d*)/g, (match, amount) => {
    const numericValue = parseFloat(amount);
    if (isNaN(numericValue)) return match;
    
    // Use roundCurrency to fix floating-point precision
    const roundedValue = roundCurrency(numericValue);
    return `$${roundedValue.toFixed(2)}`;
  });
}

console.log('🧪 Testing Portfolio Fit Analysis Precision Fix\n');

// Test cases
const testCases = [
  {
    name: 'Original problematic text',
    input: 'This property serves as a fair starter investment with positive cash flow of $19.650000000000002/month.',
    expected: 'This property serves as a fair starter investment with positive cash flow of $19.65/month.'
  },
  {
    name: 'Multiple monetary values',
    input: 'Property generates $19.650000000000002/month and costs $1234.9999999999998 to maintain.',
    expected: 'Property generates $19.65/month and costs $1235.00 to maintain.'
  },
  {
    name: 'Integer values should remain unchanged',
    input: 'This property costs $100 per month with $50 maintenance.',
    expected: 'This property costs $100.00 per month with $50.00 maintenance.'
  },
  {
    name: 'No monetary values',
    input: 'This is a great property in a good location.',
    expected: 'This is a great property in a good location.'
  },
  {
    name: 'Edge case: $0 values',
    input: 'This property has $0.00 cash flow and $0 expenses.',
    expected: 'This property has $0.00 cash flow and $0.00 expenses.'
  }
];

let passedTests = 0;
let totalTests = testCases.length;

testCases.forEach((testCase, index) => {
  console.log(`Test ${index + 1}: ${testCase.name}`);
  console.log(`Input:    "${testCase.input}"`);
  
  const result = formatPortfolioFitText(testCase.input);
  console.log(`Output:   "${result}"`);
  console.log(`Expected: "${testCase.expected}"`);
  
  const passed = result === testCase.expected;
  console.log(`Status:   ${passed ? '✅ PASS' : '❌ FAIL'}`);
  
  if (passed) passedTests++;
  console.log('');
});

console.log(`📊 Test Results: ${passedTests}/${totalTests} tests passed`);

if (passedTests === totalTests) {
  console.log('🎉 All tests passed! Portfolio Fit Analysis precision fix is working correctly.');
} else {
  console.log('❌ Some tests failed. Review the implementation.');
}

console.log('\n🔍 Additional verification:');
const problematicValue = 19.650000000000002;
const fixedValue = roundCurrency(problematicValue);
console.log(`Original value: ${problematicValue}`);
console.log(`Fixed value: ${fixedValue}`);
console.log(`Formatted: $${fixedValue.toFixed(2)}`);