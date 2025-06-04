import axios from 'axios';

const BASE_URL = process.env.TEST_API_URL || 'http://localhost:3001';

const REQUIRED_FIELDS = [
  'monthlyAnalysis',
  'annualAnalysis',
  'longTermAnalysis',
  'keyMetrics',
];

async function testEndpoint(endpoint: string, method: 'get' | 'post' = 'get', data?: any) {
  try {
    const res = await axios({ method, url: `${BASE_URL}${endpoint}`, data });
    console.log(`[PASS] ${method.toUpperCase()} ${endpoint}`);
    return res.data;
  } catch (err: any) {
    console.error(`[FAIL] ${method.toUpperCase()} ${endpoint}:`, err.response?.data || err.message);
    return null;
  }
}

function checkRequiredFields(obj: any, label: string) {
  let allPresent = true;
  for (const field of REQUIRED_FIELDS) {
    if (!(field in obj)) {
      console.error(`[FAIL] ${label}: Missing field '${field}'`);
      allPresent = false;
    } else {
      console.log(`[PASS] ${label}: Field '${field}' present`);
    }
  }
  return allPresent;
}

export async function runApiSmokeTests() {
  console.log('Running API smoke tests...');
  // 1. Test SFR sample endpoint
  const sfr = await testEndpoint('/api/deals/sample-sfr');
  // 2. Test MF sample endpoint
  const mf = await testEndpoint('/api/deals/sample-mf');
  // 3. Test SFR analysis
  if (sfr) {
    const sfrAnalysis = await testEndpoint('/api/deals/analyze', 'post', sfr);
    if (sfrAnalysis) checkRequiredFields(sfrAnalysis, 'SFR Analysis');
  }
  // 4. Test MF analysis
  if (mf) {
    const mfAnalysis = await testEndpoint('/api/deals/analyze', 'post', mf);
    if (mfAnalysis) checkRequiredFields(mfAnalysis, 'MF Analysis');
  }
  console.log('API smoke tests complete.');
} 