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
User Choice: Property Wizard OR Manual Form
    ↓
Property Wizard (4-step guided) → RentCast Auto-population → Wizard API
    OR
SFRPropertyForm (manual 60+ fields) → Direct input
    ↓
POST /api/deals/analyze → SFRAnalyzer + Market Intelligence → 
Enhanced AI Analysis (GPT-4o-mini) → AnalysisResults Display + Deal Persistence
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

- ✅ **PropertyWizard Services**:
  - PropertyDataAggregator for intelligent data compilation
  - Address validation and property lookup
  - Smart defaults based on location and property type
  - Data conversion from wizard format to SFR analysis format

### **Data Types & Interfaces**
- **SFRPropertyData**: 63 fields covering property, financial, assumptions
- **Analysis**: Comprehensive analysis results with market intelligence
- **MarketData**: FRED + RentCast combined market intelligence
- **AIInsights**: Enhanced AI analysis with strategic recommendations

## 🎯 **Current Project Status (Updated July 12, 2025)**

### **✅ COMPLETED & WORKING IN PRODUCTION**
- ✅ **Property Wizard**: Complete 4-step guided analysis (Address → Financials → Rental → Assumptions)
- ✅ **Enhanced AI Analysis**: Market intelligence integration with GPT-4o-mini
- ✅ **SFR Analysis Engine**: Comprehensive 60+ field analysis with real-time market data
- ✅ **External API Integrations**: FRED, RentCast, Census APIs working with MongoDB caching
- ✅ **Market Intelligence**: Orchestrated data from multiple sources with intelligent insights
- ✅ **Deal Persistence**: Save/load analyses with MongoDB storage
- ✅ **Smart Defaults**: Location-based intelligent auto-population
- ✅ **Maintenance Cost Bug Fix**: Wizard maintenance costs display correctly in projections

### **🔲 CURRENT GAPS (Next Development Priorities)**
- ❌ **User Authentication**: No user accounts, properties not user-specific
- ❌ **Multi-Family Frontend**: Backend analysis exists but frontend is placeholder
- ❌ **Data Export**: No PDF reports or analysis sharing capabilities
- ❌ **Portfolio Management**: No multi-property tracking or comparison tools

### **🚧 PARTIALLY COMPLETE**
- 🔄 **Multi-Family Analysis**: Backend complete, frontend needs implementation
- 🔄 **Advanced Features**: Export, collaboration, portfolio management planned

## 🚨 **Critical Integration Points**

### **Existing Analysis Pipeline (DO NOT BREAK)**
```
SFRPropertyForm → dealController.analyzeDeal() → SFRAnalyzer → 
Market Intelligence Enhancement → AI Insights → AnalysisResults
```

### **Current API Endpoints**
- `POST /api/deals/analyze` - Main analysis endpoint for all property types
- `GET /api/deals` - List all saved properties 
- `GET /api/deals/:id` - Get specific saved property
- `POST /api/deals` - Save new property analysis
- `PUT /api/deals/:id` - Update existing property
- `DELETE /api/deals/:id` - Delete property
- `GET /api/deals/sample-sfr` - Load sample SFR data
- `GET /api/deals/sample-mf` - Load sample Multi-Family data
- `POST /api/wizard/property-lookup` - Property Wizard RentCast lookup
- `POST /api/wizard/smart-defaults` - Intelligent defaults generation
- `GET /api/market-data/*` - Market intelligence endpoints
- `GET /api/census/*` - Census demographic data endpoints

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