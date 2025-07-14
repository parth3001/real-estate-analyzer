import axios from 'axios';
import { logger } from './utils/logger';

const BASE_URL = process.env.TEST_API_URL || 'http://localhost:3001';

// Test credentials
const TEST_CREDENTIALS = {
  email: process.env.SMOKE_TEST_EMAIL || 'admin@realestateanalyzer.com',
  password: process.env.SMOKE_TEST_PASSWORD || 'Spring@2025'
};

let authToken: string | null = null;

const REQUIRED_FIELDS = [
  'monthlyAnalysis',
  'annualAnalysis',
  'longTermAnalysis',
  'keyMetrics',
];

async function authenticateForTests(): Promise<boolean> {
  try {
    logger.info('[AUTH] Authenticating for smoke tests...');
    const res = await axios({
      method: 'post',
      url: `${BASE_URL}/api/auth/login`,
      data: TEST_CREDENTIALS,
      timeout: 5000
    });
    
    if (res.data?.accessToken) {
      authToken = res.data.accessToken;
      logger.info(`[AUTH] Successfully authenticated as ${TEST_CREDENTIALS.email}`);
      return true;
    } else {
      logger.warn('[AUTH] No access token received');
      return false;
    }
  } catch (err: any) {
    logger.warn('[AUTH] Authentication failed:', err.response?.data || err.message);
    return false;
  }
}

async function testEndpoint(endpoint: string, method: 'get' | 'post' = 'get', data?: any) {
  try {
    const headers: any = {
      'Content-Type': 'application/json'
    };
    
    // Add auth header if we have a token and endpoint requires auth
    if (authToken && !endpoint.includes('/auth/')) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    const res = await axios({ 
      method, 
      url: `${BASE_URL}${endpoint}`, 
      data,
      headers,
      timeout: 5000 // 5 second timeout
    });
    logger.info(`[PASS] ${method.toUpperCase()} ${endpoint}`);
    return res.data;
  } catch (err: any) {
    const status = err.response?.status;
    const message = err.response?.data?.error || err.message;
    
    if (status === 401) {
      logger.warn(`[FAIL] ${method.toUpperCase()} ${endpoint}: Unauthorized (${message})`);
    } else {
      logger.warn(`[FAIL] ${method.toUpperCase()} ${endpoint}: ${status ? `${status} - ` : ''}${message}`);
    }
    
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
    logger.info('🧪 Running API smoke tests...');
    
    // Only run tests in development or if explicitly enabled
    if (process.env.NODE_ENV === 'production' && process.env.RUN_SMOKE_TESTS !== 'true') {
      logger.info('Skipping smoke tests in production. Set RUN_SMOKE_TESTS=true to enable.');
      return;
    }
    
    // 0. Authenticate first
    const authSuccess = await authenticateForTests();
    if (!authSuccess) {
      logger.warn('⚠️  Authentication failed - some tests may fail');
    }
    
    // 1. Test health endpoint (no auth required)
    await testEndpoint('/api/health');
    
    // 2. Test SFR sample endpoint (requires auth)
    const sfr = await testEndpoint('/api/deals/sample-sfr');
    
    // 3. Test MF sample endpoint (requires auth)
    const mf = await testEndpoint('/api/deals/sample-mf');
    
    // 4. Test deals endpoint (requires auth)
    await testEndpoint('/api/deals');
    
    // 5. Test SFR analysis (requires auth)
    if (sfr) {
      const sfrAnalysis = await testEndpoint('/api/deals/analyze', 'post', sfr);
      if (sfrAnalysis) checkRequiredFields(sfrAnalysis, 'SFR Analysis');
    }
    
    // 6. Test MF analysis (requires auth)
    if (mf) {
      const mfAnalysis = await testEndpoint('/api/deals/analyze', 'post', mf);
      if (mfAnalysis) checkRequiredFields(mfAnalysis, 'MF Analysis');
    }
    
    // 7. Test wizard endpoints (requires auth)
    await testEndpoint('/api/wizard/health');
    
    logger.info('✅ API smoke tests complete.');
  } catch (error) {
    // Catch any unexpected errors to prevent the app from crashing
    logger.error('❌ Error running smoke tests:', error);
  }
}
