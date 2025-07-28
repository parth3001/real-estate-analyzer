# Project Context for Claude

## 🎯 **Strategic Vision**
**Evolving from single-family analyzer to comprehensive multi-asset investment platform**
- Target: Multi-family, commercial (retail/office/industrial), alternative assets (self-storage, mobile homes, data centers)
- Mission: Transform novice investors into professional-level thinkers with institutional-grade analysis

## 🏗️ **Current Architecture**
- **Frontend**: React 19 + TypeScript + Material-UI v7 + Vite
- **Backend**: Node.js + Express + TypeScript + MongoDB
- **Database**: MongoDB with Mongoose ODM
- **APIs**: FRED (economic data) + RentCast (property data) + Census API
- **Caching**: MongoDB persistent cache with TTL
- **AI**: OpenAI GPT-4o-mini with Intelligence Multiplier enhancement

## 🔌 **Active External Integrations**
- **FRED API**: Mortgage rates, inflation, housing index, unemployment, GDP
- **RentCast API**: Property rent estimates, comparable properties, market trends
- **Census API**: Demographic and housing data by ZIP code
- **OpenAI API**: Enhanced AI analysis with market intelligence

### **Planned API Integrations**
- **ATTOM Data API**: Comprehensive property details, tax assessments, ownership history
- **Insurance APIs**: Risk assessment automation (Steadily, Cape Analytics, or BuildFax)
- **Enhanced RentCast**: Address autocomplete and expanded property data

## 💰 **Revenue Model (Subscription Tiers)**
- **Free Tier**: $0/month - 3 analyses/month, basic features
- **Professional**: $49/month - Unlimited analyses, AI insights, market data
- **Enterprise**: $149/month - Team features, advanced analytics, priority support
- **Institutional**: $399/month - API access, custom integrations, white-label options

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
├── controllers/deals.ts        # Analysis orchestration (main controller)
├── models/Deal.ts              # MongoDB schemas
└── types/                      # Backend TypeScript types

/docs/                          # 📚 CRITICAL REFERENCE DOCUMENTS
```

[... rest of the existing file content remains the same ...]

## 📝 **Claude's Memory Log**
- Added `memorize` note as a placeholder memory entry