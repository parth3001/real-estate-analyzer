# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased] - 2026-01-19

### 🎨 Investment Decision Engine UI Redesign

**Major User Interface Overhaul - Analytical Presentation**
- **BREAKING UI CHANGE**: Removed directive verdict messaging (BUY/NEGOTIATE/PASS/CAUTION badges)
- **NEW**: Lead with Deal Quality Score (0-100) from professional assessment
- **NEW**: Simplified Professional Calibration display (3 metrics as bullet list)
- **NEW**: AI-powered Key Analysis Insights with section headers (Cash Flow, Market Position, Improvements)
- **NEW**: Property-specific Verification Guide (3-step professional checklist)
- **Preserved**: All "View Details" functionality, tax summary, educational disclaimers
- **Zero Backend Changes**: 100% pure frontend UI redesign, all existing APIs unchanged

**Components Created**:
- `DealQualityHeader.tsx` - Neutral score presentation (replaces verdict badge)
- `SimplifiedCalibration.tsx` - 3-metric bullet list (Deal Quality, Execution Complexity, Data Completeness)
- `KeyAnalysisInsights.tsx` - AI commentary parser with section headers
- `VerificationGuide.tsx` - Property-specific 3-step verification checklist
- `verdictUtils.ts` - Helper functions for score context and AI content parsing

**Modified Components**:
- `InvestmentDecisionHero.tsx` - Integrated 4 new components, removed ~60 lines of verdict badge code

**Design Philosophy**:
- Apple-inspired neutral gray theme (no color-coded judgments)
- "Show what matters" not "Tell what to do" approach
- Analytical presentation reduces liability while maintaining educational value
- Professional calibration metrics provide transparency into scoring methodology

**Mobile Responsive**:
- All components tested on 375px viewport (iPhone SE)
- Verification Guide expanded by default on mobile (critical info)
- No horizontal scroll, proper touch targets (48px minimum)

**Backward Compatibility**:
- Handles missing `professionalAssessment` gracefully (shows info alert)
- Falls back to `primaryReason` if no AI content available
- Works with SFR, BRRRR, and Multi-Family property types
- All existing data structures unchanged

---

## [Previous Release] - 2026-01-08

### 🐛 Critical Bug Fix

**Issue #1: Operating Expense Fields Not Persisting After Save/Load**
- **Problem**: HOA Fees, Landlord-Paid Utilities, and CapEx Reserve fields displayed correctly on fresh analysis but disappeared after saving and reloading property
- **Root Cause**: MongoDB schema missing three fields in `expenses.breakdown` nested object (lines 578-598 in Deal.ts). Mongoose was stripping fields not defined in explicit nested schemas, even though parent schema had `strict: false`
- **Investigation**: Used backward tracing methodology (as Architect from claude.md) to identify that `tenantTurnover` field worked because it was added to breakdown schema when breakdown was created (July 2025), but the three new fields were never added to the schema
- **Solution**: Added `hoa`, `landlordUtilities`, and `sfrCapEx` to breakdown schema following exact same pattern as `tenantTurnover`
- **Files Modified**: `backend/src/models/Deal.ts` (3 lines added to breakdown schema)
- **Result**: All three operating expense fields now persist correctly through save/load cycles
- **Testing**: Confirmed fix working - fresh properties and saved properties both display all expense fields in "Financial Deep Dive → Monthly Cash Flow Analysis"
- **Documentation Updated**: DATA_DICTIONARY.md updated with complete breakdown field documentation

### ✨ New Features

**Operating Expense Fields for Buy & Hold**
- Added 3 new universal operating expense fields: `monthlyHOA`, `monthlyUtilities`, `monthlyCapEx`
- New input fields in Property Wizard (RentalStep): HOA Fees, Landlord-Paid Utilities, CapEx Reserve
- Educational alert explaining difference between Routine Maintenance vs Capital Expenditures
- Dynamic CapEx default: 5% of monthly rent for new properties (industry standard)
- Saved properties load with blank fields (no surprise changes to existing analyses)
- Added display of all operating expense fields in Financial Deep Dive table including Turnover Costs

### 🔄 Changes

**BRRRR Strategy Temporarily Disabled**
- BRRRR card hidden in strategy selection screen (pending UAT validation)
- Backend BRRRR code remains fully functional with backward compatibility
- Deprecated `capExReserveRate` and `capExReserveFixed` fields in favor of universal `monthlyCapEx`
- Fallback chain ensures old BRRRR analyses continue to work: `monthlyCapEx` → `capExReserveFixed` → `capExReserveRate` → 5% default

### 🏗️ Technical Implementation

**Backend Architecture**
- Updated `BasePropertyAnalyzer` with property-type conditional (SFR only)
- Updated `financialCalculations` projection engine with SFR-specific expenses + inflation
- Updated `brrrAnalyzer` with backward compatibility fallback chain
- No database migration required (MongoDB schema-less design)
- Fixed 11 TypeScript compilation errors (type imports, constructor syntax, IRR null handling)

**Frontend Architecture**
- Updated `RentalStep.tsx` with 3 new expense input fields (+80 lines)
- Added useEffect for dynamic CapEx default (Option B: new properties only)
- Updated `StrategySelectionStep.tsx` (BRRRR card commented out)
- Updated type definitions in both backend and frontend `BasePropertyData`
- Fixed 17 TypeScript compilation errors (type imports, MF comparisons, callback types)

**Documentation**
- Updated `DATA_DICTIONARY.md` with new fields and deprecation notices
- Updated `DATA_MAPPING.md` with field migration table and fallback chain
- Created comprehensive unit test: `operating-expenses-jan-2026.test.ts`
- **Created comprehensive UAT plan**: `/docs/UAT_OPERATING_EXPENSES_JAN_2026.md` (12 test scenarios)

**Build Status**
- ✅ Backend TypeScript compilation: PASSING (0 errors)
- ✅ Frontend TypeScript compilation: PASSING (0 errors)
- ✅ Frontend production build: PASSING (7.94s, 12,734 modules)
- ✅ All 28 TypeScript errors fixed (11 backend, 17 frontend)

### 🔧 Critical Bug Fixes (2025-09-08)

**Cap Rate Scoring Formula Fix**
- **Issue**: Cap rate professional assessment always showing ~50/100 regardless of property performance
- **Root Cause**: Mathematical error in scoring formula - multiplier was 100x too small (20 instead of 2000)
- **Impact**: No differentiation between 3% and 10% cap rates in professional scoring
- **Solution**: Corrected multiplier in `investmentDecisionEngine.ts` line 1189
- **Result**: Proper 0-100 scoring range with meaningful differentiation (10 points per 50 basis points)

**Portfolio Fit Analysis Precision Fix**
- **Issue**: Floating-point precision errors displaying "$19.650000000000002/month" instead of "$19.65/month"
- **Root Cause**: JavaScript floating-point arithmetic not handled in frontend display layer
- **Solution**: Added `formatPortfolioFitText()` utility in `InvestmentDecisionHero.tsx` using `roundCurrency()` precision helper
- **Result**: All monetary values in portfolio context properly formatted to 2 decimal places

## [2.3.0] - 2025-08-03

### 🎯 **Phase 1: Real Market Data Integration - MAJOR ACCURACY IMPROVEMENT**

**🏠 Smart Rent Estimation System**
- **Replaced Mock Calculations**: Eliminated hardcoded $1.20/sqft calculation with intelligent market-driven estimates
- **Multi-Source Data Integration**: Combines RentCast property estimates, Census median rent data, and comparable property analysis
- **Intelligent Adjustments**: Automatic adjustments for bedrooms (+$150/bedroom above 3), property age (±5%), and market factors (±25%)
- **1% Rule Implementation**: Caps rent estimates at 1% of property value monthly for realistic projections
- **Confidence Scoring**: 60-85% confidence scores with source attribution and reliability indicators

**🔍 Property Wizard Enhancement**
- **Real-Time Market Analysis**: Automatic rent estimation when user enters property address
- **Data Source Transparency**: Shows which APIs contributed to estimates (RentCast, Census, fallbacks)
- **Market Range Display**: Provides ±10% confidence ranges for rent estimates
- **Graceful Fallbacks**: Maintains functionality even when external APIs are unavailable
- **Performance Optimization**: 120-day MongoDB caching reduces API costs and improves response times

**🌐 New API Endpoints**
- **`POST /api/wizard/rent-estimate`**: Generate intelligent rent estimates using real market data
- **Enhanced Property Lookup**: Integrated rent estimation into existing property lookup workflow
- **Health Monitoring**: New endpoints for monitoring API service health and performance

### Technical Implementation

**🛠️ Backend Architecture**
- **RentEstimationService**: New service class providing intelligent rent calculation methodology
- **Multi-Tier Data Sources**: 
  1. Census median rent data by ZIP code (Priority 1)
  2. RentCast property-specific estimates (Priority 2)  
  3. Regional fallback estimates (Priority 3)
- **MongoDB Caching**: Persistent 120-day cache for API responses
- **Error Handling**: Comprehensive fallback strategies for API failures

**🎨 Frontend Integration**
- **RentalStep Enhancement**: Real-time rent estimation with loading indicators and confidence display
- **Market Intelligence UI**: Shows rent ranges, confidence scores, and data sources
- **User Override Capability**: Maintains ability to manually adjust AI-suggested rents
- **Performance Indicators**: Loading states and success/error feedback

**📊 Accuracy Improvements**
- **Market-Driven Estimates**: Replaces generic calculations with location-specific data
- **Confidence Transparency**: Users see reliability scores (high/medium/low) for each estimate
- **Source Attribution**: Clear indication of which APIs provided the data
- **Fallback Quality**: Even fallback calculations now use improved methodology

### Data Flow Architecture

```
User Enters Address → Property Wizard Detects → 
Rent Estimation Service Called → 
├── Check MongoDB Cache (24hr TTL)
├── Census API: Median Rent by ZIP
├── RentCast API: Property-Specific Estimate  
├── Comparable Properties Analysis
└── Intelligent Adjustments Applied →
Final Estimate with Confidence Score → 
Frontend Display with Market Range
```

### Performance Metrics
- **Response Time**: <500ms with cache, <2s without cache
- **Accuracy**: 60-85% confidence vs 30% for previous fallback
- **API Cost Optimization**: 120-day caching reduces external API calls by ~99%
- **User Experience**: Seamless integration with existing Property Wizard workflow

### Bug Fixes
- Fixed TypeScript compilation errors in rent estimation service
- Resolved cache service method signature mismatches
- Corrected Census API parameter naming inconsistencies
- Fixed RentCast service method integration issues

### Documentation Updates
- **API.md**: Added comprehensive Property Wizard endpoints documentation
- **ARCHITECTURE.md**: Documented new Rent Estimation Service architecture
- **Calculation Methodology**: Detailed breakdown of rent estimation algorithms

## [2.2.0] - 2025-01-31

### 🚀 **Interactive Analysis Suite - MAJOR FEATURE RELEASE**

**🎯 Real-Time Property Analysis Revolution**
- **Interactive Analysis**: Transform static analysis into dynamic, real-time experience
- **Dynamic Sliders**: Adjust purchase price, down payment, interest rate, monthly rent with immediate feedback
- **Quick Calculation API**: Ultra-fast <50ms response times for instant parameter updates
- **Race Condition Prevention**: Sophisticated request tracking prevents conflicting concurrent calculations
- **Optimistic UI Updates**: Immediate visual feedback with backend validation

**🔧 Deal Optimizer - AI-Powered Deal Improvement**
- **Smart Deal Fixing**: "Fix This Deal" button appears for underperforming properties (score <55/100)
- **Multiple Optimization Strategies**: Purchase price reduction, down payment optimization, rent increase analysis
- **Cost-Benefit Analysis**: Each suggestion shows financial impact and feasibility
- **One-Click Application**: Apply improvements instantly with full analysis update
- **Before/After Comparison**: Visual side-by-side comparison of original vs optimized deals

**📊 Scenario Manager - Advanced Comparison System**
- **MongoDB Persistence**: Save unlimited scenarios with custom names (replaced localStorage)
- **Quick Load/Compare**: Instant scenario switching and side-by-side comparison (up to 3)
- **Comprehensive Comparison**: Key metrics tables, visual charts, risk assessments
- **Full Integration**: Works seamlessly with Interactive Analysis and Deal Optimizer
- **Data Integrity**: Complete analysis preservation including AI insights and projections

**⚡ Performance Architecture Overhaul**
- **Layered API Design**: 
  - Layer 1: Quick calculations (<50ms) - `/api/quick-calculate`
  - Layer 2: AI insights caching with smart invalidation
  - Layer 3: Full analysis with comprehensive data persistence
- **Request ID Tracking**: Prevents race conditions in concurrent analysis requests
- **Debounced Updates**: Intelligent update throttling prevents excessive calculations
- **Complete Storage Architecture**: <1s load times for saved properties

**📈 Enhanced Calculation Transparency**
- **Industry Benchmarks**: Visual indicators for Cap Rate (4-8%), Cash-on-Cash (8-12%), DSCR (>1.25)
- **Detailed Breakdowns**: Click-to-expand calculation details for every metric
- **New Metrics Added**: Debt Yield (NOI/Loan Amount), Gross Yield (Annual Rent/Purchase Price)
- **Formula Visibility**: Hover tooltips showing calculation methodology
- **Risk Indicators**: Clear warnings when metrics fall outside viable ranges

**🎨 Advanced Risk Analysis**
- **Sensitivity Analysis**: Interactive sliders for rent/expense variations (±5%, ±10%, ±15%)
- **Stress Testing**: Recession scenarios, high vacancy impact, interest rate changes
- **Reserves Calculator**: Property-specific reserve recommendations based on risk profile
- **Visual Risk Heat Maps**: Color-coded impact zones showing downside scenarios
- **Break-Even Analysis**: Real-time break-even occupancy with viability warnings

**🔄 UX Innovation - Preview/Commit System**
- **Dual-State Architecture**: Clear separation between preview changes and committed analysis
- **"Apply Changes" Workflow**: Prominent button to commit parameter changes to main analysis
- **Visual State Indicators**: Clear UI feedback showing preview vs saved state across all tabs
- **Full App State Reload**: Complete analysis refresh ensures data consistency
- **UI Lockdown**: Prevents user interference during critical update operations

### Technical Implementation

**🛠️ Backend Architecture**
- **QuickCalculationService**: Optimized calculation engine for real-time updates
- **Request Tracking Middleware**: Prevents race conditions with unique request IDs
- **Enhanced Deal Controller**: Supports interactive analysis, scenarios, and optimization
- **AI Insights Caching**: Smart caching system reduces API calls and improves performance
- **MongoDB Schema Updates**: Complete scenario persistence with full analysis data

**🎨 Frontend Architecture**
- **DynamicSliders Component**: Real-time parameter adjustment with Material-UI sliders
- **DealsOptimizer Component**: AI-powered optimization suggestions with visual comparisons
- **ScenarioManager Component**: Comprehensive scenario management with MongoDB integration
- **PreviewModeComponent**: Reusable dual-state system for consistent UX patterns
- **Race Condition Prevention**: Client-side request tracking and response validation

**📊 Data Persistence & Integrity**
- **Complete Storage Architecture**: All calculated data persisted at save time (not recalculated)
- **MongoDB Scenario Storage**: Full scenario data including AI insights and projections  
- **Data Validation**: Comprehensive validation ensures calculation accuracy
- **Performance Monitoring**: Sub-second load times for all saved analyses

### Bug Fixes
- Fixed Interactive Analysis initial state showing zeros instead of current baseline
- Resolved Apply Changes not updating Overview tab due to API structure mismatch
- Fixed race conditions in concurrent analysis requests
- Corrected Scenario Manager prop mismatches and state synchronization
- Resolved UI calculation state inconsistencies

### Testing & Validation
- **Integration Tests**: All critical calculation tests passing (calculation-benchmarks 13/13, ai-score-validation 2/2)
- **Fixture Data Correction**: Updated reference property data with industry-standard vacancy handling
- **Performance Testing**: Verified <50ms quick calculation response times
- **Race Condition Testing**: Comprehensive testing of concurrent request scenarios

### Documentation Updates
- Updated user stories to reflect completed interactive features
- Enhanced API documentation with interactive endpoints and performance specifications
- Created comprehensive technical documentation for race condition prevention system
- Updated test inventory with current status and recent fixes

## [2.1.0] - 2025-07-19

### Intelligence Multiplier Feature ✨ NEW

**🧠 Professional Intelligence Analysis System**
- **Intelligence Multiplier**: Transform novice investors into professional-level thinkers
- **Intelligence Score**: 0-100 rating of analysis sophistication (default: 85)
- **Sophistication Levels**: Novice, Intermediate, Advanced, Professional
- **Professional Equivalent Value**: $1,500-3,000 analysis value proposition

**📊 Metric Intelligence Transformation**
- **8 Key Metrics Transformed**: Monthly Cash Flow, Cap Rate, Cash-on-Cash Return, DSCR, Expense Ratio, Break-Even Occupancy, 1% Rule, Gross Rent Multiplier
- **Professional Insights**: Each metric includes novice view vs. pro insight
- **Actionable Intelligence**: Specific action items, benchmarks, and warnings
- **Risk Levels**: Low, Medium, High, Critical indicators

**🚨 Risk Blind Spots Analysis**
- **15 Risk Categories**: Comprehensive coverage of risks novices typically miss
- **Risk Assessment**: Probability, impact, and mitigation strategies
- **Priority Levels**: Critical, High, Medium, Low prioritization
- **Professional Mitigation**: Specific strategies to protect investments

**🔧 Advanced Professional Strategies**
- **Tax Optimization**: Cost segregation, depreciation strategies
- **Value-Add Improvements**: ROI-focused property enhancements
- **Financing Optimization**: Refinancing and leverage strategies
- **Portfolio Synergy**: Diversification and portfolio building
- **Market Timing**: Entry/exit optimization strategies

**💡 Opportunity Cost Analysis**
- **Alternative Investments**: Compare to other investment options
- **Market Alternatives**: Different property types and locations
- **Timing Alternatives**: Buy now vs. wait analysis
- **Risk/Return Profiles**: Comprehensive alternative comparisons

**📈 Competitive Intelligence**
- **Market Insights**: Local trends and patterns
- **Winning Strategies**: What successful investors do
- **Common Mistakes**: Pitfalls to avoid
- **Investor Behavior**: Market participant analysis

**🛠️ Technical Enhancements**
- **AI Service Updates**: Enhanced parsing for Intelligence Multiplier data
- **OpenAI Integration**: Increased max_tokens from 2000 to 4000
- **MongoDB Schema**: Added all Intelligence Multiplier fields for persistence
- **TypeScript Types**: Complete type definitions for all new features
- **Error Handling**: Robust parsing with fallback data

**💾 Data Persistence**
- **Complete Storage**: All Intelligence Multiplier data saved to MongoDB
- **Instant Loading**: Saved deals load with all professional insights
- **No Re-analysis**: Permanent storage eliminates repeated API calls
- **Historical Tracking**: Compare insights over time

**🎨 UI/UX Improvements**
- **IntelligenceMultiplier Component**: New React component with Material-UI
- **Apple Design System**: Professional styling and interactions
- **Accordion Interface**: Organized, expandable insight sections
- **Visual Indicators**: Progress bars, badges, and status cards
- **Integration**: Seamlessly integrated into AnalysisResults display

### Bug Fixes
- Fixed Intelligence Score extraction from AI responses
- Resolved parsing issues for truncated AI responses
- Fixed TypeScript compilation errors with function declarations
- Corrected data display issues in frontend components

### Documentation
- Created comprehensive INTELLIGENCE_MULTIPLIER.md documentation
- Updated TypeScript interfaces documentation
- Enhanced API documentation for new endpoints
- Added troubleshooting guide for common issues

## [2.0.0] - 2025-07-13

### Phase 1.1: Authentication & User Foundation ✅ COMPLETED

**🔐 Complete Authentication System Implementation**
- **JWT-based Authentication**: Secure token-based authentication with bcrypt password hashing (12 salt rounds)
- **User Management**: Complete user registration, login, profile management, and password change functionality
- **Role-Based Access Control**: Admin and user roles with proper authorization middleware
- **Protected Routes**: Frontend and backend route guards with automatic redirects
- **Session Management**: Token refresh capabilities and secure storage
- **Security Features**: Input validation, audit logging, and comprehensive error handling

**👤 User Interface & Experience**
- **Authentication Pages**: Professional login/register forms with Material-UI components
- **Profile Management**: Complete user profile page with edit capabilities
- **Settings Page**: User preferences, password change, notifications management
- **Navigation Updates**: User avatars, dropdowns, and role-based menu items

**👨‍💼 Admin User Management Dashboard**
- **User Overview**: Comprehensive admin dashboard showing all users with statistics
- **User Administration**: Role promotion/demotion, verification status management
- **User Analytics**: Property counts, join dates, last login tracking
- **Search & Filter**: User search capabilities with real-time filtering
- **Secure Operations**: Confirmation dialogs and audit logging for all admin actions

**🛠️ Technical Infrastructure**
- **Backend Architecture**: 
  - User model with MongoDB/Mongoose integration
  - Authentication service with JWT token management
  - Auth middleware with optional and required authentication
  - Admin controller with role-based endpoints
  - UserRepository following repository pattern
- **Frontend Architecture**:
  - AuthContext for global authentication state
  - Protected route components with role validation
  - Token management with automatic refresh
  - API interceptors for seamless authentication

**📊 Data & API Enhancements**
- **Database Updates**: Added userId field to Deal model for user-specific data
- **API Endpoints**: Complete REST API for authentication and admin operations
- **Data Migration**: Migrated existing deals to admin user account
- **Smoke Tests**: Updated testing suite to work with authentication

**🔧 Development & Deployment**
- **Production Ready**: Deployed and tested in production environment
- **Environment Variables**: Secure JWT secret management for production
- **TypeScript**: Full type safety across frontend and backend
- **Documentation**: Updated architecture, API, and data dictionary documentation

### Recently Completed ✅
- **Property Wizard Implementation** - Complete 4-step guided property analysis wizard
  - ✅ AddressStep with RentCast API integration for auto-population
  - ✅ FinancialsStep with smart defaults for purchase and financing
  - ✅ RentalStep with market-based rent estimates and expense calculations
  - ✅ AssumptionsStep with intelligent long-term projection defaults
  - ✅ Backend PropertyDataAggregator service for data orchestration
  - ✅ Wizard API endpoints for property lookup and validation
  - ✅ Data conversion pipeline from wizard format to SFR analysis

### Fixed
- **Maintenance Cost Display Bug** - Fixed issue where maintenance costs were not displaying in yearly projections table when using Property Wizard
  - **Root Cause**: Frontend `preserveUserInputValues` function was overriding backend-calculated maintenance values with 0 from wizard form data
  - **Backend Fix**: Modified wizard data conversion in `deals.ts` to properly calculate and preserve maintenance cost (5% × monthly rent × 12)
  - **Frontend Fix**: Updated `AnalysisResults.tsx` to only override backend calculations when user provides meaningful maintenance values (> 0)
  - **Impact**: Yearly projections table now correctly displays maintenance costs ($1,197+ annually) for all 10 projection years
  - **Data Flow**: Wizard → Backend calculation (5% × $1,995 × 12 = $1,197) → Frontend display (preserves calculated values)
  - **Files Modified**: 
    - `backend/src/controllers/deals.ts`: Removed premature deletion of calculated maintenanceCost
    - `frontend/src/components/SFRAnalysis/AnalysisResults.tsx`: Enhanced preserveUserInputValues logic
    - `frontend/src/components/SFRAnalysis/PropertyWizard.tsx`: Simplified wizard data submission

## [1.2.0] - 2025-07-06 - Phase 1 Complete ✅

### Added - PHASE 1 COMPLETION ✅
- **PHASE 1 COMPLETION** - Enhanced AI Analysis with Market Intelligence and Score Breakdown
- **Score Breakdown Visualization** - Detailed 4-category scoring system with transparent methodology:
  - Cash Flow Analysis (0-25 points): Monthly cash flow performance and sustainability
  - Market Position Analysis (0-25 points): Property positioning vs. local market medians
  - Financial Metrics Analysis (0-25 points): Cap rate, cash-on-cash return, DSCR evaluation
  - Risk Assessment Analysis (0-25 points): Market volatility, property condition, and investment risks
- **Market Analysis Integration** - Comprehensive market analysis utilities (`marketAnalysis.ts`) with:
  - Market positioning calculations (property vs. median values)
  - Affordability analysis using 3x income rule
  - Market dynamics assessment (vacancy rates, demand levels)
  - Demographic insights (population trends, age profiles, income stability)
- **Enhanced Market Intelligence** - AI analysis now includes:
  - Property positioning relative to local market medians
  - Affordability analysis based on median household income
  - Demographic-driven investment insights
  - Market timing and competitive environment analysis
  - Rent optimization recommendations based on local data
- **Advanced Scoring Algorithm** - Sophisticated score calculation engine with:
  - Transparent scoring methodology with detailed reasoning
  - Market-adjusted scoring based on local conditions
  - Risk-adjusted performance metrics
  - Benchmark comparisons against industry standards
- **Census Data Integration** - Market Context tab with comprehensive Census data integration
- **Enhanced AI Prompts** - Expert-level prompts with market analysis integration:
  - 25+ years real estate analyst persona
  - Strategic investment insights beyond basic metrics
  - Market context integration with census data
  - Investment timing and competitive environment analysis

### Improved - PHASE 1 ENHANCEMENTS ✅
- **AI Service Architecture** - Complete integration of market analysis with AI insights generation
- **Market Intelligence Processing** - AI service now calculates comprehensive market analysis when Census data is available
- **Enhanced Prompting** - Prompts include market dynamics, affordability assessments, and demographic insights
- **Score Transparency** - Score breakdown provides detailed scoring methodology with explanations for each category
- **Error Handling** - Robust error handling and logging for market analysis integration
- **Performance Optimization** - Efficient market calculation algorithms with fallback mechanisms
- **Data Integration** - Seamless integration between census data, market analysis, and AI insights

### Added (Previous)
- **MAJOR: OpenAI API Upgrade** - Upgraded from v3.2.1 to v5.8.2 with modern API structure
- **Enhanced AI Models** - Switched from legacy models to GPT-4o-mini for better performance and cost efficiency
- **Enhanced AI Prompts** - Implemented sophisticated enhanced AI prompts with strategic investment analysis
- Enhanced AI analysis with strategic insights beyond basic metrics
- New AI analysis fields: investor fit, strategic insights, competitive advantage, wealth building potential, market cycle analysis, financing recommendations, portfolio fit analysis, opportunity cost analysis
- Improved value-add opportunities with implementation difficulty and strategic priority ratings
- **JSON Response Format** - Added structured JSON response format for reliable AI output parsing
- **Enhanced Error Handling** - Improved AI service error handling and fallback mechanisms
- Updated frontend component to display enhanced AI analysis
- Updated documentation in AI_PROMPT_ENHANCEMENT.md

### Changed
- **BREAKING: OpenAI Client Initialization** - Updated from `Configuration` and `OpenAIApi` to modern `OpenAI` client
- **API Method Updates** - Migrated from `createChatCompletion()` to `chat.completions.create()`
- **Model Upgrades** - Replaced `gpt-3.5-turbo` and `text-davinci-003` with `gpt-4o-mini`
- **Token Limits** - Increased max_tokens from 1500 to 2000 for more comprehensive analysis
- **Response Format** - Added `response_format: { type: "json_object" }` for reliable JSON parsing
- Enhanced AI service to use enhanced prompts from `enhancedAIPrompts.ts`
- Updated JavaScript controller files to use modern OpenAI API syntax

### Improved
- Significantly enhanced AI prompt specificity and detail level
- Added expert positioning for more authoritative analysis
- Required concrete numbers, percentages, and dollar amounts in AI analysis
- Improved numerical formatting with locale-aware thousands separators
- Enhanced comparative context against industry benchmarks
- Required detailed, actionable recommendations with quantified impact
- Added sophisticated risk assessment with quantified downside scenarios
- **Performance** - GPT-4o-mini provides faster response times than legacy models
- **Cost Efficiency** - New model is more cost-effective while providing better analysis quality
- **Reliability** - Structured JSON responses reduce parsing errors

### Technical Debt Resolved
- Removed dependency on deprecated OpenAI v3 API methods
- Updated all OpenAI integrations to use latest best practices
- Improved type safety in AI service components
- Enhanced error handling throughout AI integration pipeline

## [2.0.0] - 2025-07-05

### Added
- **Major OpenAI API Upgrade**: Complete migration from v3.2.1 to v5.8.2
- **Enhanced AI Analysis**: Sophisticated investment analysis with strategic insights
- **Modern AI Models**: GPT-4o-mini for improved analysis quality and speed
- **Structured AI Responses**: JSON response format for reliable data parsing
- **Enhanced Prompts**: Expert-level prompting for authoritative real estate analysis

### Changed
- **BREAKING**: OpenAI client initialization and API methods completely updated
- **BREAKING**: AI service architecture modernized for v5+ API
- All AI integrations migrated to modern OpenAI standards
- Enhanced AI prompts provide significantly more detailed and actionable analysis

### Improved
- AI analysis now provides expert-level strategic insights with specific metrics
- Better error handling and fallback mechanisms for AI services
- Improved cost efficiency with GPT-4o-mini model
- Enhanced reliability with structured JSON response format
- Better performance with optimized API calls and response handling

### Fixed
- Resolved compatibility issues with legacy OpenAI API
- Fixed AI response parsing reliability
- Improved error handling for AI service failures

## [1.9.0] - 2023-09-25

### Added
- Capital Investments and Tenant Turnover Fees implementation:
  - Added fields to property form for capital improvements and tenant turnover costs
  - Updated analysis calculations to include these costs in financial metrics
  - Added new metrics: Return on Improvements and Turnover Cost Impact
  - Enhanced expense breakdown chart to include tenant turnover costs
  - Updated yearly projections to show turnover costs and capital improvements
  - Updated documentation (API, Data Dictionary, Data Mapping)

### Fixed
- Fixed TypeScript errors in AnalysisResults component
- Corrected property access and type definitions in analysis interfaces
- Resolved conditional React Hook usage issue
- Improved expense breakdown chart handling for mortgage data
- Fixed data structure references throughout the analysis components
- Added proper type checking for optional fields
- Removed duplicate type definitions and unused imports
- Cleaned up unused code in MultiFamilyAnalysis component:
  - Removed unused axios import
  - Removed unused backupFormData function
  - Integrated form data backup into handleAnalyze function
- Improved MultiFamilyAnalysisResults component:
  - Removed unused getScoreColor function
  - Integrated color logic directly into component styling
  - Enhanced investment score display with theme colors
- Updated analysis type definitions to match actual data structure:
  - Added proper monthly analysis types with gross rent
  - Updated annual analysis with effective gross income
  - Added yearly projections with detailed metrics
  - Enhanced key metrics interface with new fields
  - Fixed AI insights investment score to be nullable

### Changed
- Improved error handling for missing or invalid expense data
- Enhanced type safety in analysis results display
- Optimized chart data processing
- Streamlined analysis type definitions
- Improved code organization and removed dead code
- Enhanced form data persistence strategy
- Updated analysis results display to match design:
  - Added top metrics cards
  - Enhanced key metrics grid
  - Improved monthly and annual analysis tables
  - Added tabbed chart interface

### Added
- Better null checking for expense breakdown data
- Type-safe handling of mortgage object structure
- Filtering for zero-value expenses in charts
- Improved TypeScript type definitions for analysis results
- Direct localStorage integration for form data recovery
- New metrics display components:
  - Monthly cash flow card
  - Cap rate indicator
  - Cash on cash return display
  - DSCR calculation

## [1.8.1] - 2023-09-16

### Fixed
- Improved Return on Improvements metric calculation:
  - Added estimated 8% return for capital investments when before/after NOI comparison is not available
  - Enhanced logging for better diagnostics
  - Updated documentation to reflect the dual calculation approach

## [1.8.0] - 2023-09-15

### Fixed
- Fixed calculation inconsistencies in the real estate analyzer:
  - Added proper handling of capital investments in total investment calculations
  - Fixed total cash flow calculation in exit analysis
  - Ensured capital improvements are correctly accounted for in year 1 cash flow
  - Added detailed logging for cash flow calculations
  - Added validation function to ensure consistency between calculated values
  - Modified the frontend `fixLongTermReturns` function to be a minimal fallback for legacy saved deals
  - Added clear comments that all new calculations should be done in the backend
  - Fixed total return calculation to correctly subtract the total investment

### Added
- Added comprehensive logging to help diagnose calculation issues
- Added validation checks to ensure consistency between different parts of the analysis
- Implemented Return on Improvements metric to measure the effectiveness of capital investments
- Implemented Turnover Cost Impact metric to show the impact of tenant turnover on property income
- Added documentation for new metrics in DATA_DICTIONARY.md 

## [1.0.0] - 2025-06-01

### Added
- Full OpenAI API integration for AI-powered insights
- Comprehensive property analysis with financial metrics
- Interactive data visualization with dynamic charts
- TypeScript support throughout the application
- Environment-based configuration
- Secure API key handling
- Error handling with graceful fallbacks

### Changed
- Improved OpenAI client initialization to be on-demand
- Enhanced error handling in deals controller
- Updated documentation to reflect current features
- Refactored expense breakdown chart handling
- Improved TypeScript type definitions

### Fixed
- OpenAI API key handling and initialization
- Type definition conflicts and missing interfaces
- React component lifecycle issues
- Data transformation and display inconsistencies

## [0.1.0] - Initial Release

### Added
- Basic property analysis functionality
- Frontend React application setup
- Backend Express server setup
- Initial documentation 