# Test Infrastructure Documentation
**Test Engineering Team**
*Last Updated: December 12, 2024*

## Table of Contents
1. [Test Architecture Overview](#test-architecture-overview)
2. [Test Framework Core](#test-framework-core)
3. [Test Data Strategy](#test-data-strategy)
4. [Test Personas](#test-personas)
5. [Test Patterns & Best Practices](#test-patterns--best-practices)
6. [Test Scripts Inventory](#test-scripts-inventory)
7. [Common Issues & Solutions](#common-issues--solutions)
8. [Future Test Engineering Roadmap](#future-test-engineering-roadmap)

---

## Test Architecture Overview

### Test Framework Structure
```
/tests/
├── backend/
│   ├── core/                      # Core test framework
│   │   ├── test-framework-core.js # Base framework with auth, logging
│   │   └── master-test-runner.js  # Orchestrates all test suites
│   ├── expert-validation/         # Domain expert validation
│   │   └── expert-domain-validator.js # Sarah Mitchell persona
│   ├── financial/                 # Financial calculation tests
│   │   └── comprehensive-financial-suite.js
│   ├── portfolio-real-properties-test.js # Portfolio AI testing
│   └── wrappers/                  # Test suite wrappers
├── run-production-readiness.js    # Production gate validation
└── package.json                   # Test dependencies
```

### Test Design Philosophy
1. **Mirror Real User Workflows** - Never create artificial test-only patterns
2. **Expert Validation** - All outputs validated by domain expert personas
3. **Data-Driven Testing** - Use real property data from actual markets
4. **Production Gate Quality** - Tests must pass before deployment

---

## Test Framework Core

### Base Test Framework (`test-framework-core.js`)

**Purpose:** Provides reusable test infrastructure

**Key Components:**
```javascript
class TestFramework {
  constructor(suiteName) {
    this.logger = new TestLogger(suiteName);
    this.auth = new AuthManager();
    this.validator = new ResponseValidator();
    this.metrics = new MetricsCollector();
  }
  
  async initialize() {
    // Setup test environment
    // Authenticate test users
    // Validate backend connectivity
  }
  
  async runTest(testName, testFunction) {
    // Execute with error handling
    // Collect metrics
    // Log results
  }
}
```

**Authentication Strategy:**
- Admin User: `admin@realestateanalyzer.com` / `Spring@2025`
- Test User: `test@example.com` / `Test123!`
- Token management with automatic refresh

**Logging Standards:**
```javascript
logger.info('Test step description', { context });
logger.success('✅ Assertion passed', { actual, expected });
logger.error('❌ Test failed', { error, stack });
```

---

## Test Data Strategy

### Real Property Test Data
**Source:** Actual Zillow listings for realistic testing

```javascript
const REAL_ZILLOW_PROPERTIES = [
  {
    name: 'Anna, TX Single Family',
    address: '2110 Sweet Gum Dr, Anna, TX 75409',
    purchasePrice: 319999,
    propertyType: 'SFR',
    monthlyRent: 1500,
    capRate: 2.61,
    cashFlow: -796.67,
    marketTier: 'Secondary'
  },
  {
    name: 'Jersey City, NJ Condo',
    address: '250 Van Horne St #2, Jersey City, NJ 07304',
    purchasePrice: 425000,
    propertyType: 'SFR',
    monthlyRent: 1500,
    capRate: 0.20,
    cashFlow: -1913.38,
    marketTier: 'Primary'
  },
  {
    name: 'East Lansing, MI Property',
    address: '3040 Hamlet Cir, East Lansing, MI 48823',
    purchasePrice: 349900,
    propertyType: 'SFR',
    monthlyRent: 1500,
    capRate: 2.23,
    cashFlow: -983.57,
    marketTier: 'College Town'
  }
];
```

### Portfolio Test Configurations
```javascript
const PORTFOLIO_CONFIGS = [
  {
    strategy: 'CASH_FLOW',
    name: 'Monthly Income Portfolio',
    goals: {
      primaryGoal: 'CASH_FLOW',
      targetMonthlyIncome: 3000,
      targetTimeline: '5 years',
      riskTolerance: 'MODERATE'
    }
  },
  {
    strategy: 'WEALTH_BUILDING',
    name: 'Long-term Wealth Portfolio',
    goals: {
      primaryGoal: 'WEALTH_BUILDING',
      targetNetWorth: 1000000,
      targetTimeline: '10-15 years',
      riskTolerance: 'AGGRESSIVE'
    }
  }
];
```

---

## Test Personas

### Sarah Mitchell, CRE - Expert Domain Validator
**Experience:** 20 years, $10M+ AUM
**Purpose:** Validates all investment decisions and AI recommendations

**Investment Philosophy:**
```javascript
{
  cashFlowMinimum: 200,      // $200+/month minimum
  capRateMinimum: 5.0,       // 5%+ cap rate required
  dscrMinimum: 1.2,          // 1.2x debt coverage
  leverageMaximum: 80,       // Max 80% LTV
  marketDiversification: true,
  exitStrategyRequired: true
}
```

**Validation Method:**
```javascript
async validateAIRecommendations(portfolioData) {
  // Check cash flow standards
  // Verify cap rate requirements
  // Assess strategy alignment
  // Evaluate risk management
  // Return expert verdict
}
```

---

## Test Patterns & Best Practices

### Pattern 0: ALWAYS Inspect Before Testing
```javascript
// ✅ MANDATORY FIRST STEP: Understand the system
async function beforeWritingAnyTest() {
  // 1. Check available routes
  await inspectFile('/backend/src/routes/*.ts');
  
  // 2. Read existing documentation
  await inspectFile('/docs/*.md');
  
  // 3. Understand data models
  await inspectFile('/backend/src/models/*.ts');
  
  // 4. Review existing tests for patterns
  await inspectFile('/tests/**/*.js');
  
  // 5. Trace UI network calls if needed
  // Open browser DevTools → Network tab → Perform action → Copy as cURL
}
```

**Test Engineer Checklist Before Writing Tests:**
- [ ] Have I read the route definitions?
- [ ] Have I checked existing platform documentation?
- [ ] Do I understand the data models?
- [ ] Have I traced actual UI API calls?
- [ ] Am I using the correct endpoints (not guessing)?

### Pattern 1: Real Workflow Testing
```javascript
// ✅ CORRECT: Mirror actual UI workflow
async function testPortfolioCreation() {
  // 1. Create deals first (like UI does)
  const deals = await createDeals(properties);
  
  // 2. Create portfolio
  const portfolio = await createPortfolio(config);
  
  // 3. Add deals to portfolio
  for (const deal of deals) {
    await addPropertyToPortfolio(portfolio.id, deal.id);
  }
  
  // 4. Wait for analytics
  await wait(3000);
  
  // 5. Verify analytics calculated
  const analytics = await getPortfolioAnalytics(portfolio.id);
  assert(analytics.totalProperties > 0);
}
```

### Pattern 2: Expert Validation Integration
```javascript
async function validateWithExpert(aiContent, portfolioData) {
  const expertValidator = new ExpertDomainValidator();
  const validation = await expertValidator.validateAIRecommendations({
    aiRecommendations: aiContent,
    portfolioStrategy: portfolioData.goals.primaryGoal,
    monthlyFlow: portfolioData.analytics.monthlyNetCashFlow,
    capRate: portfolioData.analytics.averageCapRate
  });
  
  assert(validation.expertApproved, 
    `Sarah Mitchell rejected: ${validation.reasoning}`);
}
```

### Pattern 3: Production Readiness Gate
```javascript
const QUALITY_GATES = {
  portfolioAI: {
    minSuccessRate: 90,
    maxResponseTime: 5000,
    expertApprovalRate: 80
  },
  financialCalculations: {
    accuracyThreshold: 99.9,
    maxDeviationPercent: 0.1
  }
};
```

---

## Test Scripts Inventory

### Core Test Suites

| Script | Purpose | Status | Expert Validation |
|--------|---------|--------|-------------------|
| `portfolio-real-properties-test.js` | Portfolio AI with real properties | ✅ Active | Yes |
| `expert-domain-validator.js` | Sarah Mitchell validation logic | ✅ Active | N/A |
| `comprehensive-financial-suite.js` | Financial calculation accuracy | ✅ Active | Yes |
| `run-production-readiness.js` | Production gate orchestrator | ✅ Active | Yes |

### Test Execution Commands
```bash
# Run all production readiness tests
npm run test:production-readiness

# Run specific test suite
node tests/backend/portfolio-real-properties-test.js

# Run with expert validation only
node tests/backend/expert-validation/expert-domain-validator.js

# Generate test report
npm run test:report
```

---

## Common Issues & Solutions

### Issue 1: Portfolio Analytics Show $0
**Root Cause:** Using wrong API endpoint
- ❌ `/api/deals/analyze` - Analysis only, no persistence
- ✅ `/api/deals` - Creates and saves with ID

**Solution:**
```javascript
// Create and save deal first
const deal = await axios.post('/api/deals', propertyData);
// Then add to portfolio
await axios.post(`/api/portfolios/${portfolioId}/properties`, {
  propertyId: deal.data._id
});
```

### Issue 2: Expert Validation Failures
**Root Cause:** AI recommendations not meeting professional standards
**Metrics:** 0% expert approval rate

**Solution:**
- Ensure portfolio has real property data
- Wait for analytics calculation
- Pass complete portfolio context to AI

### Issue 3: Test Timeouts
**Root Cause:** AI endpoints take 15-30s per call
**Solution:** Increase timeout to 300s for AI tests
```javascript
const response = await axios.get(url, {
  timeout: 300000 // 5 minutes
});
```

---

## Future Test Engineering Roadmap

### Phase 1: Current (Completed)
- ✅ Core test framework
- ✅ Expert validation integration
- ✅ Portfolio AI testing
- ✅ Production readiness gates

### Phase 2: Next Sprint
- [ ] Pipeline to Portfolio conversion testing
- [ ] Multi-family property testing
- [ ] Performance benchmarking suite
- [ ] Load testing for AI endpoints

### Phase 3: Q1 2025
- [ ] E2E Cypress test automation
- [ ] Visual regression testing
- [ ] API contract testing
- [ ] Chaos engineering tests

### Phase 4: Q2 2025
- [ ] ML model validation framework
- [ ] Data quality monitoring
- [ ] Security penetration testing
- [ ] Compliance validation suite

---

## Test Metrics & KPIs

### Current Test Coverage
- API Endpoints: 78% covered
- Business Logic: 82% covered
- Expert Validation: 100% for critical paths
- Portfolio AI: 87.5% success rate

### Quality Metrics
- Average Test Execution Time: 4.2 minutes
- False Positive Rate: <2%
- Expert Approval Rate: 27.9% (needs improvement)
- Production Gate Pass Rate: 91%

---

## Reusable Test Utilities

### Wait for Async Operations
```javascript
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Usage
await wait(3000); // Wait for analytics calculation
```

### Retry with Backoff
```javascript
async function retryWithBackoff(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await wait(Math.pow(2, i) * 1000);
    }
  }
}
```

### Test Data Generators
```javascript
function generatePropertyData(overrides = {}) {
  return {
    propertyName: faker.address.streetAddress(),
    purchasePrice: faker.number.int({ min: 200000, max: 500000 }),
    monthlyRent: faker.number.int({ min: 1500, max: 3000 }),
    ...defaultPropertyData,
    ...overrides
  };
}
```

---

*This documentation represents the complete test infrastructure design and should be maintained as the single source of truth for test engineering practices.*