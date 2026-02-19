# Real Estate Investment Intelligence Platform - Architecture Documentation V3.0

**Version**: 3.1 Multi-Family Analyzer Integration
**Last Updated**: October 28, 2025
**Status**: Production Ready (SFR + MF Backend Complete, MF Frontend Pending)

## 🏛️ System Overview

The Real Estate Investment Intelligence Platform is a sophisticated full-stack web application providing institutional-grade investment analysis with portfolio management capabilities. Built on React (frontend) and Node.js/Express (backend) with **strict architectural separation**: backend handles all business logic, frontend is purely for presentation.

## 🎯 Core Architectural Principles

### **1. Single Source of Truth**
- ✅ **Backend**: All business logic, calculations, scoring, and investment decisions
- ✅ **Frontend**: Pure presentation layer - display data, collect user input only
- ❌ **Eliminated**: No duplicate calculation logic in frontend

### **2. Data Integrity**
- **Database Schema**: MongoDB with Mongoose ODM, strict type validation
- **Professional Assessment**: Complete V3.0 scoring fields persisted
- **Portfolio Relationships**: Proper foreign key references and aggregation
- **Analysis Flags**: `isFullAnalysis` distinguishes full vs skinny calculations

### **3. Performance First**
- **Quick Calculations**: <50ms response time for core metrics
- **Skinny Metrics**: <20ms for portfolio property calculations
- **Caching Strategy**: MongoDB persistent cache with TTL
- **Parallel Processing**: Microservices architecture for AI analysis

## 📊 Technical Stack

### Frontend (React 19 + TypeScript)
```
├── Framework: React 19 with TypeScript
├── UI Library: Material-UI (MUI) v7
├── State Management: React Context API + Hooks
├── Routing: React Router v6 with protected routes
├── Build Tool: Vite
├── Data Visualization: Recharts
├── Authentication: JWT with secure storage
└── Business Logic: ❌ NONE - Backend handles all
```

### Backend (Node.js + Express + TypeScript)
```
├── Runtime: Node.js
├── Framework: Express.js with TypeScript
├── Database: MongoDB with Mongoose ODM
├── Authentication: JWT with bcrypt (12 salt rounds)
├── External APIs:
│   ├── FRED API: Economic indicators
│   ├── RentCast API: Property data
│   ├── Census API: Demographics
│   └── OpenAI API: AI insights (gpt-4o-mini)
├── Caching: MongoDB persistent cache
├── Logging: Winston
└── Testing: Jest + Custom test suites
```

## 🎯 Investment Decision Engine V3.0

### Professional Assessment Architecture
```typescript
interface ProfessionalAssessment {
  // Core Scores (0-100)
  dealQuality: number;           // Weighted average
  executionDifficulty: number;   // Implementation complexity
  dataReliability: number;       // Input confidence
  
  // Weighted Factors (sum = 100%)
  cashFlowScore: number;         // 35% weight
  irrScore: number;              // 25% weight
  marketStrengthScore: number;   // 15% weight
  debtStructureScore: number;    // 10% weight
  exitStrategyScore: number;     // 10% weight
  capRateScore: number;          // 3% weight
  propertyRiskScore: number;     // 2% weight
}
```

### Verdict Mapping
- **BUY**: Deal Quality ≥ 80 (Exceptional opportunity)
- **NEGOTIATE**: Deal Quality 65-79 (Good with improvements)
- **CAUTION**: Deal Quality 50-64 (Marginal, proceed carefully)
- **PASS**: Deal Quality < 50 (Below investment grade)

### Key Services
- `/backend/src/services/investment/investmentDecisionEngine.ts` - Main engine
- `/backend/src/services/investment/marketTierService.ts` - Market analysis
- `/backend/src/services/investment/propertyClassificationService.ts` - Property grading
- `/backend/src/services/investment/strategyAlignmentService.ts` - Goal alignment
- `/backend/src/services/investment/sensitivityAnalysisService.ts` - Deal sensitivity

## 🏢 Multi-Family Analyzer System (NEW - October 2025)

### Architecture Overview
```
User Input (MF Property) → MultiFamilyAnalyzer → Industry-Validated Metrics → Investment Decision Engine → Display
```

**Status**: ✅ Backend Complete (Stories 1.1-1.6), 📅 Frontend Pending (Stories 2.1-2.6)

### Core Components

#### 1. MultiFamilyAnalyzer (`/backend/src/analysis/MultiFamilyAnalyzer.ts`)
- **Extends**: `BasePropertyAnalyzer<MultiFamilyData, MultiFamilyMetrics>`
- **Pattern**: Property type extension (NOT separate application)
- **Integration**: Uses same `/api/deals/analyze` endpoint as SFR

**Key Calculation Methods**:
```typescript
// Story 1.2: Critical NOI calculation (institutional-grade)
protected calculateEffectiveGrossIncome(grossIncome: number): number {
  const vacancyLoss = grossIncome * (vacancyRate / 100);
  const creditLoss = grossIncome * 0.02;  // 2% industry standard
  return grossIncome - vacancyLoss - creditLoss;
}

protected calculateOperatingExpenses(grossIncome: number): number {
  // ✅ Vacancy excluded (reduces income, not an expense)
  return propertyTax + insurance + propertyManagement +
         maintenance + commonAreaUtilities + capEx;
}

// Story 1.3: Core financial metrics
protected calculatePropertySpecificMetrics(): MultiFamilyMetrics {
  const noi = effectiveGrossIncome - operatingExpenses;
  const capRate = (noi / purchasePrice) * 100;
  const dscr = noi / annualDebtService;
  const cashOnCashReturn = (annualCashFlow / totalInvestment) * 100;
  const oer = (operatingExpenses / effectiveGrossIncome) * 100;
  // ... + 8 advanced metrics from Story 1.4
}
```

#### 2. MultiFamilyData Interface (`/backend/src/types/propertyTypes.ts`)
```typescript
interface MultiFamilyData extends BasePropertyData {
  propertyType: 'MF';

  // Story 1.1: Building details
  totalUnits: number;         // 2-32 recommended range
  totalSqft: number;
  yearBuilt: number;
  buildingType?: 'SIDE_BY_SIDE' | 'STACKED' | 'MIXED' | 'COMPLEX';

  // Story 1.1: Dual input methods (competitive moat)
  units: Array<{              // Granular unit-level data
    unitNumber?: string;
    bedrooms: number;
    bathrooms: number;
    squareFeet: number;
    currentRent: number;
    marketRent?: number;      // RentCast integration
    isVacant?: boolean;
  }>;

  unitTypes?: Array<{         // Aggregated simplified input
    type: string;
    count: number;
    sqft: number;
    monthlyRent: number;
  }>;

  // Story 1.1: MF-specific expenses
  commonAreaUtilities: {
    electric: number;
    water: number;
    gas: number;
    trash: number;
  };
  maintenanceCostPerUnit: number;

  // Story 1.1: MF financing options
  loanType?: 'RESIDENTIAL' | 'COMMERCIAL';
  balloonPayment?: {
    years: number;
    amount?: number;
  };
}
```

#### 3. MultiFamilyMetrics Interface
```typescript
interface MultiFamilyMetrics extends CommonMetrics {
  // Story 1.3: Core MF metrics
  effectiveGrossIncome: number;
  grossIncome: number;
  operatingExpenses: number;
  noi: number;                    // Net Operating Income
  capRate: number;                // Capitalization Rate
  cashOnCashReturn: number;
  dscr: number;                   // Debt Service Coverage Ratio
  operatingExpenseRatio: number;

  // Story 1.4: Advanced MF metrics
  grm: number;                    // Gross Rent Multiplier (4-7 target)
  debtYield: number;              // Lender requirement: 10%+
  breakEvenOccupancy: number;     // Target: 60-75%
  economicVacancyRate: number;
  unitMixEfficiency: number;      // 0-100 optimization score
  commonAreaExpenseRatio: number;
  rentPerSqft: number;
  grossYield: number;

  // Story 1.4: Per-unit metrics
  pricePerUnit: number;
  noiPerUnit: number;
  cashFlowPerUnit: number;
  averageRentPerUnit: number;
  operatingExpensePerUnit: number;

  // Story 1.5: Data validation
  dataQuality?: {
    score: number;              // 0-100 data quality score
    warnings: string[];         // Non-blocking alerts
  };
}
```

### Industry Validation (Story 1.2 + Business Expert Review)

**Validated Against**:
- **Fannie Mae**: Multifamily underwriting standards, DSCR 1.25x minimum
- **Freddie Mac**: Multifamily guidelines, DSCR 1.20x minimum
- **HUD 221(d)(4)**: DSCR requirements (1.18x market-rate, 1.15x affordable)
- **JP Morgan**: NOI and cash flow calculation methodology
- **Wall Street Prep**: Real estate financial modeling standards
- **PropertyMetrics**: Commercial real estate analysis standards

**Accuracy**: 95%+ institutional-grade accuracy (October 2025 validation)

### Key Architectural Decisions

#### 1. Property Type Extension Pattern
```
✅ Same Deal model - different propertyType value ('SFR' vs 'MF')
✅ Same API endpoints - /api/deals/analyze handles both
✅ Same Property Wizard flow - conditional steps based on type
✅ Same Investment Decision Engine - MF-calibrated scoring
✅ Shared UI components - property-specific tabs
```

**Anti-Patterns Avoided**:
```
❌ Separate /api/multifamily/* endpoints
❌ Separate MFDeal model
❌ Separate MFPropertyWizard component tree
❌ Separate frontend routes
```

#### 2. Financial Precision Principle
- No intermediate rounding in calculations
- Full floating-point precision maintained
- Round only for display (frontend formatCurrency)
- Enforced in all 28+ MF metrics

#### 3. Data Validation System (Story 1.5)
```typescript
validatePropertyData(data: MultiFamilyData): ValidationResult {
  const warnings: string[] = [];
  let score = 100;

  // Unit count validation (2-32 recommended)
  if (data.totalUnits < 2 || data.totalUnits > 32) {
    warnings.push('Unit count outside recommended range');
    score -= 10;
  }

  // Square footage reasonability
  const totalSqftFromUnits = data.units.reduce(...);
  if (Math.abs(data.totalSqft - totalSqftFromUnits) > tolerance) {
    warnings.push('Square footage mismatch detected');
    score -= 15;
  }

  // Rent reasonability (currentRent vs marketRent)
  const rentDeviation = calculateRentDeviation(data.units);
  if (rentDeviation > 20%) {
    warnings.push('Significant rent vs market rent deviation');
    score -= 10;
  }

  return { score, warnings, proceedWithAnalysis: true };
}
```

**Philosophy**: Alerts, not blockers - analysis always proceeds

### Test Coverage (Story 1.6)

**Test Files** (5 comprehensive suites):
1. `MultiFamilyData-Interface.test.ts` - Interface validation
2. `MultiFamilyAnalyzer-NOI.test.ts` - NOI calculation validation
3. `MultiFamilyAnalyzer-NOI-Fix.test.ts` - Regression prevention
4. `MultiFamilyAnalyzer-Validation.test.ts` - Data validation tests
5. `MultiFamilyAnalyzer-Story1.4-Metrics.test.ts` - Advanced metrics

**Coverage**:
- ✅ 100% Story 1.1-1.6 implementation coverage
- ✅ All 28 metrics tested against industry benchmarks
- ✅ Edge cases: vacant units, missing data, extreme values
- ✅ Financial precision validation (no rounding errors)
- ✅ Industry standard compliance (Fannie Mae, Freddie Mac, HUD)

### Integration with Investment Decision Engine

**MF-Specific Calibration**:
- DSCR thresholds adjusted for commercial vs residential loans
- Cap rate scoring adjusted for property class (A/B/C)
- Cash flow weight increased (35% vs 30% for SFR)
- Market strength considers MF-specific factors (job growth, rent growth)

### Database Schema (Shared Deal Model)

**No changes required** - MultiFamilyData extends BasePropertyData:
```typescript
{
  _id: ObjectId,
  userId: ObjectId,
  propertyType: 'MF',           // Property type discrimination

  // MF-specific fields stored in property data
  totalUnits: 8,
  totalSqft: 8000,
  units: [...],                 // Unit-level granular data
  commonAreaUtilities: {...},

  // Same analysis structure as SFR
  analysis: {
    monthlyAnalysis: {...},
    keyMetrics: {
      noi: 45600,               // MF-specific metrics
      grm: 5.2,
      debtYield: 12.4,
      breakEvenOccupancy: 68,
      // ... all 28 MF metrics
    },
    investmentDecision: {
      verdict: 'BUY',
      professionalAssessment: {...}  // Same V3.0 structure
    }
  }
}
```

### API Endpoints (Shared with SFR)

**Analysis Endpoint**:
```
POST /api/deals/analyze
Request Body: MultiFamilyData | SFRData
Response: AnalysisResult<MultiFamilyMetrics | SFRMetrics>

// Backend automatically routes to correct analyzer based on propertyType
if (propertyData.propertyType === 'MF') {
  analyzer = new MultiFamilyAnalyzer(propertyData);
} else {
  analyzer = new SFRAnalyzer(propertyData);
}
```

### Frontend Integration (Pending - Stories 2.1-2.6)

**Planned Components**:
- Multi-Family Property Form (conditional wizard steps)
- Unit-level data entry interface
- MF-specific analysis results tabs
- Advanced metrics visualization
- Data validation UI feedback

**Shared Components**:
- Investment Decision Hero (same V3.0 display)
- Financial charts (shared with SFR)
- Deal persistence (same save/load flow)

### Performance Characteristics

**Backend Performance**:
- MF Analysis: ~150-200ms (vs SFR ~100-150ms)
- Additional time due to:
  - Unit-level calculations (8-32 units)
  - Advanced metrics (8 additional calculations)
  - Data validation system
- Still well under <500ms target

**Scalability**:
- Tested up to 50-unit properties (large multifamily)
- Performance degrades gracefully (<300ms for 50 units)
- No memory issues with unit arrays

## 🏢 Portfolio Intelligence System

### Architecture Overview
```
User Input → Portfolio Context → Analysis Engine → Aggregation → AI Insights → Display
```

### Database Schema

#### Portfolio Collection
```typescript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  name: string,
  description: string,
  status: 'ACTIVE' | 'ARCHIVED',
  goals: {
    primaryGoal: 'CASH_FLOW_FOCUSED' | 'WEALTH_BUILDING' | 'DIVERSIFICATION' | 'TAX_OPTIMIZATION',
    targetTimeline: string,
    riskTolerance: 'CONSERVATIVE' | 'MODERATE' | 'AGGRESSIVE',
    targetMonthlyIncome?: number,
    targetNetWorth?: number,
    geographicPreferences?: string[]
  },
  createdAt: Date,
  updatedAt: Date
}
```

#### Deal Collection (Enhanced)
```typescript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  portfolioId?: ObjectId (ref: Portfolio),  // Optional portfolio association
  ownershipPercentage: number,              // Default 100%
  propertyType: string,                     // Supports 13+ types
  source?: 'PORTFOLIO_MANUAL_ENTRY',        // Manual entry flag
  
  // Analysis results
  analysis: {
    isFullAnalysis: boolean,               // true=full, false=skinny
    monthlyAnalysis: {...},
    keyMetrics: {...},
    investmentDecision: {
      verdict: string,
      professionalAssessment: {...},       // V3.0 scoring
      portfolioContext?: {...}              // Portfolio fit analysis
    }
  }
}
```

### Service Layer Architecture

#### 1. Portfolio Service (`/backend/src/services/portfolioService.ts`)
- **CRUD Operations**: Create, read, update, archive portfolios
- **Property Management**: Add/remove properties from portfolios
- **User Scoping**: Ensures users only access their portfolios
- **Status Management**: Active/archived portfolio states

#### 2. Portfolio Analytics Service (`/backend/src/services/portfolio/portfolioAnalyticsService.ts`)
- **Financial Aggregation**: Sum of all property metrics
- **Risk Analysis**: Geographic concentration, property type distribution
- **Goal Progress**: Tracking against user-defined targets
- **Performance Metrics**: Portfolio-level cap rate, cash-on-cash, ROI
- **Edge Case Handling**: Prevents $Infinity calculations with validation

#### 3. Portfolio Property Metrics Service (`/backend/src/services/portfolio/portfolioPropertyMetricsService.ts`)
- **Skinny Calculator**: Fast metrics for manual properties
- **Multi-Property Support**: SFR, MF, Commercial, Self-Storage, Mobile Home Parks
- **User Data Priority**: Uses exact user-provided values, no overrides
- **Calculation Methods**:
  ```typescript
  calculatePortfolioMetrics(property) → {
    keyMetrics: { capRate, cashOnCashReturn, totalReturn, monthlyRoi },
    monthlyAnalysis: { income, expenses, cashFlow },
    annualAnalysis: { capRate, cashOnCashReturn, noi },
    isFullAnalysis: false
  }
  ```

#### 4. Enhanced Portfolio AI Service (`/backend/src/services/portfolio/enhancedPortfolioAI.ts`)
- **AI Insights Generation**: GPT-4o-mini integration
- **Peer Comparison**: Compare against similar portfolios
- **Goal Path Analysis**: Progress tracking and recommendations
- **Health Check**: Portfolio health assessment
- **Dynamic Content**: Avoids generic responses with property-specific analysis

### API Endpoints

#### Portfolio Management
- `POST /api/portfolios` - Create portfolio
- `GET /api/portfolios` - List user portfolios
- `GET /api/portfolios/:id` - Get portfolio details
- `PUT /api/portfolios/:id` - Update portfolio
- `DELETE /api/portfolios/:id` - Archive portfolio (soft delete)
- `POST /api/portfolios/:id/recalculate-analytics` - Force recalculation

#### Property-Portfolio Integration
- `POST /api/deals` - Create deal (with optional portfolioId)
- `PUT /api/deals/:id` - Update deal (can add/remove portfolioId)
- `GET /api/deals?portfolioId=:id` - Get portfolio properties
- `GET /api/portfolios/available/:propertyId` - Get available portfolios for property

### Frontend Components

#### Portfolio Dashboard (`/frontend/src/pages/PortfolioDashboard.tsx`)
- **Apple Design System**: Clean, intuitive interface
- **Real-time Updates**: Instant reflection of property changes
- **Property Cards**: Show income, expenses, cash flow with source badges
- **AI Insights Cards**: Health check, peer comparison, goal path
- **Action Menus**: View details, edit, remove properties

#### Portfolio Creation Wizard (`/frontend/src/components/Portfolio/ApplePortfolioWizard.tsx`)
- **3-Step Process**: Name → Goals → Targets
- **Goal Templates**: Pre-configured for common strategies
- **Validation**: Real-time form validation
- **Time to Complete**: <5 minutes for 80% of users

#### Manual Property Modal (`/frontend/src/components/Portfolio/AddManualPropertyModal.tsx`)
- **Multi-Property Types**: Dropdown with 13+ property types
- **Minimal Required Fields**: Only essential data needed
- **User Data Priority**: No smart defaults or overrides
- **Ownership Percentage**: Support for partial ownership

---

## 📝 Blog System Architecture (Added February 2026)

### Overview
Static markdown-based content system for SEO-driven blog articles. No CMS, no database — plain `.md` files with YAML frontmatter loaded at build time via Vite's `import.meta.glob`.

### Design Decision
Chose static markdown over a CMS because:
- No additional infrastructure (no Contentful, no Sanity, no backend changes)
- Editable by non-engineers (plain text files)
- Zero runtime dependencies — parsed entirely at build time
- Automatically code-split by Vite

### Key Files

| File | Purpose |
|------|---------|
| `/frontend/src/content/blog/*.md` | Blog post source files (YAML frontmatter + markdown body) |
| `/frontend/src/utils/blogUtils.ts` | Browser-safe frontmatter parser + `getAllPosts()` / `getPostBySlug()` |
| `/frontend/src/pages/BlogListPage.tsx` | Route: `/blog` — lists all posts as cards |
| `/frontend/src/pages/BlogPostPage.tsx` | Route: `/blog/:slug` — renders individual post with full SEO |
| `/frontend/src/pages/BRRRRCalculatorPage.tsx` | Route: `/brrrr-calculator` — SEO wrapper around UniversalCalculator |
| `/frontend/public/blog/` | Static image assets referenced by blog posts |
| `/frontend/public/sitemap.xml` | Updated with `/blog` and `/blog/:slug` entries (priority 0.8) |

### Frontmatter Schema
```yaml
---
title: string          # Page <title> and H1
slug: string           # URL path: /blog/{slug}
date: string           # ISO date (YYYY-MM-DD)
description: string    # Meta description (155 chars max)
keywords: string[]     # Meta keywords array
readingTime: string    # Display only (e.g. "10 min read")
---
```

### Technical Notes
- **Browser-safe parser**: `gray-matter` was removed — it uses Node.js `Buffer` which crashes in the browser. Replaced with inline regex parser in `blogUtils.ts`.
- **Vite import**: Uses `import.meta.glob('../content/blog/*.md', { as: 'raw', eager: true })` — statically imports all `.md` files at build time.
- **Adding new posts**: Drop a `.md` file in `/frontend/src/content/blog/` — it appears automatically on next build.
- **SEO per post**: `BlogPostPage.tsx` sets `<title>`, `<meta description>`, `<link rel="canonical">`, `og:title`, `og:description`, `og:url`, `og:type`, `article:published_time` dynamically from frontmatter.

### BRRRRCalculatorPage SEO Wrapper
`UniversalCalculator` is shared across `/brrrr-calculator`, `/calculator/buy-hold`, and `/calculator` routes. BRRRR-specific SEO tags (title, canonical, og:url, JSON-LD FAQ schema) are applied via a thin `BRRRRCalculatorPage` wrapper rather than inside `UniversalCalculator` directly — preventing BRRRR tags from appearing on buy-hold routes.

### Routes Added to App.tsx
```
/blog                    → BlogListPage
/blog/:slug              → BlogPostPage
/brrrr-calculator        → BRRRRCalculatorPage (wraps UniversalCalculator)
```

---

## 🔄 Data Flow Architecture

### Full Analysis Flow (SFR Property)
```
1. User Input (Wizard/Form)
   ↓
2. POST /api/deals/analyze
   ↓
3. SFRAnalyzer.analyzeWithMarketIntelligence()
   ↓
4. Investment Decision Engine (V3.0 Assessment)
   ↓
5. AI Insights Generation (if not cached)
   ↓
6. Save to Database (isFullAnalysis: true)
   ↓
7. Return Complete Analysis
```

### Skinny Metrics Flow (Manual Portfolio Property)
```
1. User Input (AddManualPropertyModal)
   ↓
2. POST /api/deals (with portfolioId)
   ↓
3. PortfolioPropertyMetricsService.calculatePortfolioMetrics()
   ↓
4. Save to Database (isFullAnalysis: false)
   ↓
5. Update Portfolio Analytics
   ↓
6. Return Property with Metrics
```

### Portfolio Analytics Flow
```
1. Property Change Event
   ↓
2. Fetch All Portfolio Properties
   ↓
3. Separate by isFullAnalysis flag
   ↓
4. Aggregate Metrics
   ↓
5. Calculate Portfolio-Level Metrics
   ↓
6. Generate AI Insights (if needed)
   ↓
7. Cache Results
   ↓
8. Return Analytics
```

## 🛡️ Security Architecture

### Authentication & Authorization
- **JWT Tokens**: Secure token-based auth with refresh strategy
- **Password Security**: bcrypt with 12 salt rounds
- **Role-Based Access**: User/Admin separation
- **Portfolio Scoping**: Users only access their own data
- **API Rate Limiting**: Prevents abuse of external APIs

### Data Protection
- **Input Validation**: Comprehensive validation on all endpoints
- **SQL Injection Prevention**: Parameterized queries with Mongoose
- **XSS Protection**: Input sanitization and output encoding
- **CORS Configuration**: Restricted origin access
- **Environment Variables**: Sensitive data in .env files

## 📈 Performance Metrics

### Response Time Targets
| Operation | Target | Actual |
|-----------|--------|--------|
| Quick Calculation | <50ms | ~30ms |
| Skinny Metrics | <20ms | ~15ms |
| Full Analysis | <6s | ~4s |
| Portfolio Dashboard | <200ms | ~87ms |
| AI Insights | <5s | ~3s (cached: 0ms) |
| Professional Assessment | <50ms | ~40ms |

### Scalability
- **Properties per Portfolio**: 50+ with optimized aggregation
- **Concurrent Users**: 100+ with current infrastructure
- **Database Size**: Optimized for 100K+ properties
- **Cache Hit Rate**: >80% for market data

## 🧪 Testing Architecture

### Test Coverage
- **Unit Tests**: Core business logic (>95% coverage)
- **Integration Tests**: API endpoints and services (>90% coverage)
- **E2E Tests**: Critical user flows (Cypress)
- **Edge Case Tests**: Bulletproof validation for $Infinity bugs
- **Performance Tests**: Response time validation

### Critical Test Suites
- `test-portfolio-complete-workflow.js` - Master test with edge cases
- `realistic-verdict-test.js` - V3.0 verdict calibration
- `test-portfolio-skinny-metrics-validation.js` - Multi-property validation
- `metrics-consistency-test.js` - Financial calculation consistency

## 🚀 Deployment Architecture

### Environment Configuration
```
Development: Local MongoDB, mock external APIs
Staging: MongoDB Atlas, limited API calls
Production: MongoDB Atlas, full API integration
```

### Infrastructure
- **Frontend**: Deployed to Vercel/Netlify
- **Backend**: Node.js on AWS EC2/Heroku
- **Database**: MongoDB Atlas (M10 cluster)
- **File Storage**: AWS S3 for documents
- **Monitoring**: Winston logs + CloudWatch

## 📋 Future Architecture Considerations

### Planned Enhancements
1. **GraphQL API**: Replace REST for better query efficiency
2. **Redis Cache**: In-memory caching for hot data
3. **WebSocket Support**: Real-time portfolio updates
4. **Microservices**: Separate AI services for better scaling
5. **Event-Driven Architecture**: Property change events

### Technical Debt
1. **TypeScript Migration**: Complete backend TypeScript conversion
2. **Test Coverage**: Increase E2E test coverage
3. **API Versioning**: Implement proper API versioning
4. **Documentation**: OpenAPI/Swagger specification

---

**Architecture Version**: 3.0  
**Status**: Production Ready  
**Next Review**: Q4 2025