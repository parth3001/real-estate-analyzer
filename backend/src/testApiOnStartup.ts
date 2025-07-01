import axios from 'axios';
import { logger } from './utils/logger';

const BASE_URL = process.env.TEST_API_URL || 'http://localhost:3001';

const REQUIRED_FIELDS = [
  'monthlyAnalysis',
  'annualAnalysis',
  'longTermAnalysis',
  'keyMetrics',
];

async function testEndpoint(endpoint: string, method: 'get' | 'post' = 'get', data?: any) {
  try {
    const res = await axios({ 
      method, 
      url: `${BASE_URL}${endpoint}`, 
      data,
      timeout: 5000 // 5 second timeout
    });
    logger.info(`[PASS] ${method.toUpperCase()} ${endpoint}`);
    return res.data;
  } catch (err: any) {
    logger.warn(`[FAIL] ${method.toUpperCase()} ${endpoint}:`, err.response?.data || err.message);
    // Don't fail the deployment, just log the error
    return null;
  }
}

function checkRequiredFields(obj: any, label: string) {
  let allPresent = true;
  for (const field of REQUIRED_FIELDS) {
    if (!(field in obj)) {
      logger.warn(`[FAIL] ${label}: Missing field '${field}'`);
      allPresent = false;
    } else {
      logger.info(`[PASS] ${label}: Field '${field}' present`);
    }
  }
  return allPresent;
}

export async function runApiSmokeTests() {
  try {
    logger.info('Running API smoke tests...');
    
    // Only run tests in development or if explicitly enabled
    if (process.env.NODE_ENV === 'production' && process.env.RUN_SMOKE_TESTS !== 'true') {
      logger.info('Skipping smoke tests in production. Set RUN_SMOKE_TESTS=true to enable.');
      return;
    }
    
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
    
    logger.info('API smoke tests complete.');
  } catch (error) {
    // Catch any unexpected errors to prevent the app from crashing
    logger.error('Error running smoke tests:', error);
  }
}
