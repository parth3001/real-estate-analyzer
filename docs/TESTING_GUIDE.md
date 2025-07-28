# Real Estate Analyzer - Comprehensive Testing Guide

## 🎯 Overview
This document provides a complete guide to all testing suites in the Real Estate Analyzer application. Use this guide to ensure all tests pass before deploying or making significant changes.

## 📋 Quick Test Commands

### Run All Tests (Recommended Before Deploy)
```bash
# From project root
npm run test:all
```

### Individual Test Suites

#### Backend Tests
```bash
cd backend

# Unit Tests
npm test                          # Run all Jest tests
npm run test:quick               # Run only changed tests

# Integration Tests
npm run test:integration         # All integration tests
npm run test:financial          # Financial calculation accuracy
npm run test:benchmarks         # Performance benchmarks
npm run test:display-bugs       # Display accuracy tests

# Coverage
npm run test:coverage           # Generate coverage report

# Specific Features
npm test -- quickCalculation    # Quick calculation tests
npm test -- aiService          # AI service tests
npm test -- externalServices   # External API tests
```

#### Frontend Tests
```bash
cd frontend

# Vitest Tests
npm test                        # Run all tests in watch mode
npm test -- --run              # Run once without watch
npm run test:ui                # Run with UI
npm run coverage              # Generate coverage report

# Specific Components
npm test DynamicSliders        # Interactive sliders tests
npm test DealFixer            # Deal fixer tests
npm test ScenarioManager      # Scenario manager tests
npm test financialCalculations # Financial calc tests
```

#### E2E Tests (Cypress)
```bash
cd backend

# Headless (CI)
npm run test:e2e:headless

# Interactive (Development)
npm run test:e2e:open

# Custom Orchestrator
npm run test:e2e              # Amazon-grade test orchestrator
```

## 🧪 Test Categories

### 1. **Unit Tests**
Tests individual functions and components in isolation.

#### Backend Unit Tests
- `src/tests/unit/` - Pure unit tests
- `src/services/__tests__/` - Service unit tests
- `src/utils/__tests__/` - Utility function tests

#### Frontend Unit Tests
- `src/utils/__tests__/` - Utility tests
- `src/components/**/__tests__/` - Component tests

### 2. **Integration Tests**
Tests how different parts of the system work together.

#### Backend Integration Tests
- `src/tests/integration/externalServices.test.ts` - External API integration
- `src/tests/integration/financial-accuracy.test.ts` - Financial calculation accuracy
- `src/tests/integration/calculation-benchmarks.test.ts` - Performance benchmarks
- `src/tests/integration/quickCalculation.test.ts` - Quick calc endpoint
- `src/tests/integration/display-accuracy.test.ts` - UI data accuracy
- `src/tests/integration/documentation-consistency.test.ts` - Docs validation

#### Frontend Integration Tests
- `src/components/SFRAnalysis/__tests__/InteractiveScenarioModeling.integration.test.tsx`

### 3. **E2E Tests**
Tests complete user workflows from UI to database.

#### Cypress Tests
- `cypress/e2e/property-analysis.cy.js` - Property analysis workflow
- `cypress/e2e/user-authentication.cy.js` - Auth workflows
- `cypress/e2e/saved-properties.cy.js` - Property management
- `cypress/e2e/interactive-analysis.cy.js` - Interactive features

### 4. **Performance Tests**
Ensures the application meets performance requirements.

- Quick calculation response time (<50ms)
- Full analysis response time (<5s)
- Frontend render performance
- Database query performance

### 5. **API Tests**
Tests REST API endpoints directly.

- Authentication endpoints
- Property analysis endpoints
- Quick calculation endpoints
- Market data endpoints
- Wizard endpoints

## 🔍 Test Coverage Requirements

### Minimum Coverage Targets
- **Overall**: 70%
- **Critical Paths**: 90%
  - Financial calculations
  - Property analysis
  - Authentication
  - Data persistence

### Coverage Reports
```bash
# Backend coverage
cd backend && npm run test:coverage

# Frontend coverage
cd frontend && npm run coverage

# View reports
open backend/coverage/lcov-report/index.html
open frontend/coverage/index.html
```

## 🚨 Critical Test Suites

These MUST pass before any deployment:

1. **Financial Accuracy Tests**
   ```bash
   cd backend && npm run test:financial
   ```
   - Validates all financial calculations
   - Ensures accuracy within 0.01%

2. **Display Accuracy Tests**
   ```bash
   cd backend && npm run test:display-bugs
   ```
   - Ensures UI displays correct data
   - Validates data transformations

3. **Quick Calculation Tests**
   ```bash
   cd backend && npm test -- quickCalculation
   ```
   - Validates <50ms response time
   - Ensures calculation accuracy

4. **AI Service Tests**
   ```bash
   cd backend && npm test -- aiService
   ```
   - Validates AI insights generation
   - Tests error handling and fallbacks

## 🔧 Test Environment Setup

### Prerequisites
```bash
# Install dependencies
cd backend && npm install
cd ../frontend && npm install

# Environment variables
cp .env.example .env
# Configure test database and API keys
```

### Test Database
Tests use a separate MongoDB instance:
- Connection: `mongodb://localhost:27017/real-estate-test`
- Auto-cleared before each test suite
- No production data affected

### Mock Services
- External APIs are mocked in tests
- No real API calls during testing
- Predictable test data

## 📊 Test Execution Order

For comprehensive testing, run in this order:

1. **Quick Smoke Tests** (2 min)
   ```bash
   cd backend && npm run test:quick
   cd ../frontend && npm test -- --run
   ```

2. **Critical Path Tests** (5 min)
   ```bash
   cd backend
   npm run test:financial
   npm run test:display-bugs
   npm test -- quickCalculation
   ```

3. **Full Backend Suite** (10 min)
   ```bash
   cd backend && npm test
   ```

4. **Full Frontend Suite** (5 min)
   ```bash
   cd frontend && npm test -- --run
   ```

5. **E2E Tests** (15 min)
   ```bash
   cd backend && npm run test:e2e:headless
   ```

6. **Performance Benchmarks** (5 min)
   ```bash
   cd backend && npm run test:benchmarks
   ```

## 🐛 Common Test Issues

### Frontend: "EMFILE: too many open files"
**Solution**:
```bash
# macOS
ulimit -n 4096

# Or run tests in smaller batches
npm test DynamicSliders -- --run
npm test financialCalculations -- --run
```

### Backend: Module not found errors
**Solution**:
```bash
# Rebuild TypeScript
npm run build

# Clear Jest cache
npx jest --clearCache
```

### Cypress: Connection refused
**Solution**:
```bash
# Ensure servers are running
cd backend && npm run dev
cd ../frontend && npm run dev

# Then run Cypress
npm run test:e2e:open
```

## 🚀 CI/CD Integration

### GitHub Actions Workflow
```yaml
- name: Backend Tests
  run: |
    cd backend
    npm ci
    npm run test:coverage
    
- name: Frontend Tests
  run: |
    cd frontend
    npm ci
    npm test -- --run --coverage
    
- name: E2E Tests
  run: |
    cd backend
    npm run test:e2e:headless
```

### Pre-commit Hooks
```bash
# Run before every commit
cd backend && npm run test:pre-commit
```

## 📝 Writing New Tests

### Test File Naming
- Unit tests: `*.test.ts` or `*.spec.ts`
- Integration tests: `*.integration.test.ts`
- E2E tests: `*.cy.js`

### Test Structure
```typescript
describe('Feature Name', () => {
  describe('Specific Function', () => {
    it('should do something specific', () => {
      // Arrange
      const input = createTestData();
      
      // Act
      const result = functionUnderTest(input);
      
      // Assert
      expect(result).toMatchExpected();
    });
  });
});
```

### Test Data
- Use fixtures for consistent test data
- Located in `tests/fixtures/`
- Never use production data

## 📈 Test Metrics

Track these metrics over time:
- Test execution time
- Test coverage percentage
- Test failure rate
- Flaky test count

## 🔄 Continuous Improvement

1. **Weekly**: Review test coverage reports
2. **Monthly**: Audit slow tests for optimization
3. **Quarterly**: Update test documentation
4. **Per Release**: Full regression test suite

---

## Quick Reference Card

```bash
# Before any commit
cd backend && npm run test:pre-commit

# Before deployment
npm run test:all

# After major changes
cd backend && npm run test:full-validation

# Performance check
cd backend && npm run test:benchmarks

# Quick health check
cd backend && npm run test:quick
```

Last Updated: January 2025