# Project Context for Claude

## 🏗️ **Current Architecture**
- **Frontend**: React 19 + TypeScript + Material-UI v7 + Vite
- **Backend**: Node.js + Express + TypeScript + MongoDB
- **Database**: MongoDB with Mongoose ODM
- **APIs**: FRED (economic data) + RentCast (property data) + Census API
- **Caching**: MongoDB persistent cache with TTL
- **AI**: OpenAI GPT-4 for enhanced property insights

## 🔌 **Active External Integrations**
- **FRED API**: Mortgage rates, inflation, housing index, unemployment, GDP
- **RentCast API**: Property rent estimates, comparable properties, market trends
- **Census API**: Demographic and housing data by ZIP code
- **OpenAI API**: Enhanced AI analysis with market intelligence

## 📊 **Current Data Flow**
```
SFRPropertyForm (manual 60+ fields) → POST /api/deals/analyze → 
SFRAnalyzer + Market Intelligence → Enhanced Analysis → AnalysisResults Display
```

## 🗂️ **Key Directory Structure**
```
/frontend/src/
├── components/SFRAnalysis/     # Main SFR analysis components
├── types/property.ts           # TypeScript interfaces
├── services/api.ts             # Frontend API layer
└── pages/SFRAnalysis.tsx       # Main SFR page

/backend/src/
├── services/                   # Core business logic
│   ├── fredService.ts          # ✅ FRED API integration
│   ├── rentcastService.ts      # ✅ RentCast API integration  
│   ├── marketIntelligenceService.ts # Orchestrates market data
│   ├── cacheService.ts         # MongoDB caching layer
│   └── aiService.ts            # Enhanced AI insights
├── routes/deals.ts             # Deal analysis endpoints
├── controllers/dealController.ts # Analysis orchestration
├── models/Deal.ts              # MongoDB schemas
└── types/                      # Backend TypeScript types

/docs/                          # 📚 CRITICAL REFERENCE DOCUMENTS
```

## 📚 **Critical /docs Folder - Always Reference These**

### **Architecture & Technical Documents**
- `ARCHITECTURE.md` - Complete system architecture overview
- `API.md` - API endpoint documentation and specifications
- `DATA_DICTIONARY.md` - Comprehensive data field definitions
- `DATA_MAPPING.md` - Data transformation and mapping rules
- `DATA_MAPPING_Market_APIs.md` - External API response mappings
- `TYPESCRIPT_RULES.md` - TypeScript coding standards

### **Implementation & Integration Plans**
- `PROPERTY_WIZARD_ARCHITECTURE.md` - Complete wizard architecture (79 pages)
- `PROPERTY_WIZARD_IMPLEMENTATION_PLAN.md` - Phase-by-phase implementation
- `INTEGRATION_PLAN_Market_APIs_Remaining.md` - Remaining API integrations
- `TECHNICAL_PLAN_Market_API_Integration.md` - Technical integration details

### **Business & Analysis Documents**
- `PRD.md` - Product Requirements Document
- `real_estate_metrics_list.md` - Complete metrics calculations
- `NEW_METRICS_MAPPING.md` - Enhanced metrics implementation
- `comprehensive_mf_strategy.md` - Multi-family analysis strategy

### **Enhancement & AI Documents**
- `AI_INSIGHTS_UI_ENHANCEMENT.md` - AI interface improvements
- `AI_PROMPT_ENHANCEMENT.md` - AI prompt optimization
- `SFR_AI_ENHANCEMENT_PLAN.md` - SFR-specific AI enhancements

### **Development & Phase Tracking**
- `PHASE_PLAN.md` - Overall project phases
- `PHASE_1_COMPLETION_SUMMARY.md` - Phase 1 completion status
- `MILESTONE.md` - Project milestones and deliverables
- `CHANGELOG.md` - Version history and changes

## 🔧 **Current Services & Capabilities**

### **Existing Services (Reusable)**
- ✅ **FredService**: 
  - Current mortgage rates, trends, economic indicators
  - Cached data with smart fallbacks
  - Health check and rate limit management

- ✅ **RentcastService**: 
  - Property rent estimates with confidence scoring
  - Comparable properties (sales & rental)
  - Market trends by ZIP code
  - MongoDB caching (1 month TTL)

- ✅ **MarketIntelligenceService**:
  - Orchestrates FRED + RentCast data
  - Comprehensive market analysis
  - Investment timing recommendations

- ✅ **CacheService**:
  - MongoDB persistent caching
  - TTL management by data type
  - Cache warming and health monitoring

### **Data Types & Interfaces**
- **SFRPropertyData**: 63 fields covering property, financial, assumptions
- **Analysis**: Comprehensive analysis results with market intelligence
- **MarketData**: FRED + RentCast combined market intelligence
- **AIInsights**: Enhanced AI analysis with strategic recommendations

## 🎯 **Current Project Status**

### **Recently Completed**
- ✅ Enhanced AI analysis with market intelligence integration
- ✅ MongoDB caching system for external APIs
- ✅ Fixed AI content repetition and formatting issues
- ✅ Property wizard architecture design (comprehensive 79-page document)
- ✅ Phase-by-phase implementation plan (7-week roadmap)

### **Active Development**
- 🚧 **Property Wizard Phase 1**: Foundation & infrastructure setup
- 🚧 Working within existing codebase structure
- 🚧 Enhancing existing services rather than replacing

### **Planned (Property Wizard)**
- 📋 4-step wizard: Address → Financials → Rental → Assumptions
- 📋 External API integration: ATTOM, Insurance APIs, Tax APIs
- 📋 Smart defaults engine based on location/property type
- 📋 Progressive enhancement of existing analysis pipeline

## 🚨 **Critical Integration Points**

### **Existing Analysis Pipeline (DO NOT BREAK)**
```
SFRPropertyForm → dealController.analyzeDeal() → SFRAnalyzer → 
Market Intelligence Enhancement → AI Insights → AnalysisResults
```

### **Current API Endpoints**
- `POST /api/deals/analyze` - Main analysis endpoint (KEEP UNCHANGED)
- `GET /api/deals/sample-sfr` - Sample data loading
- `GET /api/market-data/*` - Market intelligence endpoints

### **Data Compatibility Requirements**
- All wizard outputs must match existing `SFRPropertyData` interface
- Analysis results must maintain current `Analysis` type structure
- AI insights must preserve existing `AIInsights` format

## 🔍 **Before Any Major Changes - Always Check**

### **Core Files to Review**
1. `/frontend/src/components/SFRAnalysis/SFRPropertyForm.tsx` - Current form implementation
2. `/frontend/src/types/property.ts` - Data type definitions
3. `/backend/src/services/fredService.ts` - FRED API integration
4. `/backend/src/services/rentcastService.ts` - RentCast API integration
5. `/backend/src/controllers/dealController.ts` - Analysis orchestration
6. `/backend/src/models/Deal.ts` - Database schema

### **Documentation to Reference**
1. `/docs/ARCHITECTURE.md` - System overview
2. `/docs/DATA_DICTIONARY.md` - Field definitions
3. `/docs/PROPERTY_WIZARD_ARCHITECTURE.md` - Wizard specifications
4. `/docs/API.md` - API contracts

## 💡 **Development Guidelines**

### **Code Quality Standards**
- TypeScript strict mode enabled
- 100% type coverage required
- Comprehensive error handling
- Structured logging with correlation IDs
- Unit tests for all services

### **API Integration Best Practices**
- Respect rate limits with intelligent queuing
- Implement exponential backoff for retries
- Validate all external API responses
- Never log sensitive data (API keys, user info)
- Graceful degradation when APIs fail

### **Data Quality Principles**
- Always provide confidence scoring for auto-populated data
- Allow manual override for any auto-populated field
- Maintain audit trail of data sources and modifications
- Validate data ranges and business rules

## 🔄 **When Starting Work Session**

### **Context Refresh Protocol**
1. Read this CLAUDE.md file
2. Check recent changes in relevant /docs files
3. Review current implementation of files I'll be modifying
4. Understand data flow impact of planned changes
5. Verify compatibility with existing analysis pipeline

### **Common Commands for Context**
- `LS /docs` - Check available documentation
- `Read key service files` - Understand current capabilities
- `Check existing types/interfaces` - Ensure compatibility
- `Review API endpoints` - Understand integration points

---

## 📌 **Remember: /docs Folder is the Single Source of Truth**

The `/docs` folder contains comprehensive documentation that should ALWAYS be referenced:
- Architecture decisions and rationale
- Complete API specifications and data mappings
- Implementation strategies and technical plans
- Business requirements and metric definitions
- Development guidelines and coding standards

**Never assume - always check the docs first!**