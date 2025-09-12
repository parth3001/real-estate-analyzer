# Backend Testing Organization

This directory will contain all backend test scripts, organized by category:

## Current Test Files (to be moved here)

**Financial & Verdict Testing:**
- `test-all-scoring-functions.js` - Core financial calculations validation
- `intelligent-verdict-testing.js` - Professional verdict boundary testing

**AI Content Validation:**
- `test-ai-content-validation.js` - Most comprehensive Investment Decision AI validation (7 tabs)
- `intelligent-portfolio-ai-validation.js` - Most sophisticated Portfolio AI validation (4 endpoints)
- `test-ai-content-fix.js` - Data corruption regression testing
- `test-phase4-ai.js` - Basic Portfolio API functionality testing

**Business Flow Testing:**
- `test-pipeline-portfolio-flow.js` - Comprehensive business flow validation
- `master-business-flow-test.js` - Master business flow orchestration

## Proposed Organization Structure

```
/tests/backend/
├── financial/                    # Financial accuracy & verdict testing
├── ai-validation/                # All AI content validation
├── integration/                  # Data flow & business processes  
├── core/                        # Shared utilities & orchestration
└── data/                        # Test data generators & scenarios
```

## Framework Design

See `/docs/COMPREHENSIVE_TEST_FRAMEWORK_DESIGN.md` for complete framework specifications.

## Next Steps

1. Move existing test files into organized structure
2. Consolidate duplicate tests
3. Implement unified test runner
4. Add performance benchmarks