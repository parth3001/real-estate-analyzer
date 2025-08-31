# Real Estate Investment Intelligence Platform API Documentation

## Overview
This document outlines the API interfaces for the Real Estate Investment Intelligence Platform, including the V3.0 Professional Calibration Investment Decision Engine, AI enhanced messaging system, and institutional-grade analysis capabilities.

**Last Updated**: August 27, 2025 - V3.0 Professional Calibration & AI Content Pipeline Fix Complete

For a comprehensive listing of all data fields, their types, and usage, please refer to the [Data Dictionary](DATA_DICTIONARY.md).

## Performance & Concurrency

### Race Condition Prevention System

**Implementation Date**: 2025-07-28  
**Status**: ✅ Active in Production

The API implements a sophisticated race condition prevention system for interactive features to ensure data consistency and optimal performance.

#### Request ID Tracking

All analysis requests should implement client-side request tracking to prevent race conditions:

```typescript
// Generate unique request ID
const requestId = `analysis-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

// Track active request
setActiveRequestId(requestId);

// Validate response is from latest request
if (requestId === activeRequestId && response.status === 200) {
  // Process response
} else {
  // Discard outdated response
  console.log(`Request ${requestId} cancelled - newer request active`);
}
```

#### Best Practices for Interactive Features

1. **Debounced Full Analysis**: Only trigger full AI analysis for significant parameter changes (>10% change)
2. **Quick Calculations**: Use `/api/quick-calculate` for immediate UI feedback (<50ms)
3. **Request Cancellation**: Always check request validity before updating UI state
4. **Timeout Management**: Clear previous timeouts before setting new ones

#### Performance Metrics

- **Quick Calculations**: Target <50ms response time
- **Full Analysis**: Target <2s response time  
- **Race Condition Prevention**: 99.9% request consistency
- **Resource Usage**: Eliminated redundant concurrent analyses

## API Endpoints

### Enhanced Analysis Endpoints (NEW - August 2025)

The Real Estate Investment Intelligence Platform now provides professional-grade investment analysis through enhanced endpoints powered by the Investment Decision Engine and AI microservices architecture.

### Portfolio Intelligence API (V3.0 - Implemented August 2025)

Complete portfolio management with multi-property type support, skinny metrics calculator, and AI-enhanced insights.

#### Portfolio Management
```
GET    /api/portfolios                              - List user portfolios
POST   /api/portfolios                              - Create new portfolio
GET    /api/portfolios/:id                          - Get portfolio details
PUT    /api/portfolios/:id                          - Update portfolio
DELETE /api/portfolios/:id                          - Archive portfolio (soft delete)
POST   /api/portfolios/:id/recalculate-analytics    - Force recalculation of analytics
```

#### Property-Portfolio Integration
```
POST   /api/deals                                   - Create deal (with optional portfolioId)
PUT    /api/deals/:id                               - Update deal (can add/remove portfolioId)
GET    /api/deals?portfolioId=:id                   - Get portfolio properties
GET    /api/portfolios/available/:propertyId        - Get available portfolios for property
```

#### Portfolio Analytics
```
GET    /api/portfolios/:id/analytics                - Real-time portfolio analytics
POST   /api/portfolios/:id/properties/:propertyId   - Add property to portfolio  
DELETE /api/portfolios/:id/properties/:propertyId   - Remove property from portfolio
```

**Portfolio Analytics Response (V3.0):**
```json
{
  "portfolioId": "68af02011e9491a37a8ccaa7",
  "summary": {
    "totalProperties": 3,
    "totalValue": 950000,
    "monthlyRentalIncome": 5200,
    "monthlyNetCashFlow": 1250,
    "averageCapRate": 4.8,
    "averageCashOnCash": 8.2,
    "totalEquity": 580000,
    "fullAnalysisProperties": 2,
    "skinnyAnalysisProperties": 1
  },
  "riskAnalysis": {
    "geographicConcentration": "MODERATE",
    "concentrationScore": 65,
    "propertyTypeDistribution": {
      "SFR": 2,
      "COMMERCIAL_RETAIL": 1
    },
    "recommendations": ["Consider geographic diversification", "Strong property type mix"]
  },
  "goalProgress": {
    "primaryGoal": "CASH_FLOW_FOCUSED",
    "targetMonthlyIncome": 5000,
    "actualMonthlyIncome": 5200,
    "progressPercentage": 104,
    "onTrack": true
  },
  "aiInsights": {
    "portfolioHealth": "STRONG",
    "healthScore": 85,
    "portfolioStrength": "Excellent cash flow generation exceeding targets by 4%",
    "peerComparison": "Outperforming 78% of similar portfolios",
    "goalPathAnalysis": "On track to achieve $10K monthly income within 18 months",
    "opportunities": ["Consider refinancing Property A to improve leverage"],
    "risks": ["Single market concentration - consider expansion"]
  }
}
```

#### Professional Investment Analysis (V3.0 Enhanced)
```
POST /api/deals/analyze
```

**Purpose:** Complete professional property analysis with Investment Decision Engine and AI insights.

**Enhanced Features:**
- Professional investment verdict (BUY/NEGOTIATE/PASS) 
- Market-relative analysis using local median cap rates
- Walk-away price calculation using 3 methodologies
- Experience-level adjustments for novice/intermediate/expert investors
- Exit strategy-optimized recommendations
- Leverage optimization analysis
- AI-powered Intelligence Multiplier insights

**Request Body (V3.0 with Portfolio Context):**
```json
{
  "propertyType": "SFR",
  "propertyName": "Investment Property Analysis",
  "portfolioId": "68af02011e9491a37a8ccaa7",
  "ownershipPercentage": 100,
  "propertyAddress": {
    "street": "123 Investment St",
    "city": "Austin",
    "state": "TX",
    "zipCode": "78701"
  },
  "purchasePrice": 415000,
  "downPayment": 83000,
  "interestRate": 6.63,
  "loanTerm": 30,
  "monthlyRent": 3500,
  "propertyTaxRate": 1.83,
  "insuranceRate": 0.4,
  "maintenanceCost": 2400,
  "propertyManagementRate": 8,
  "squareFootage": 2800,
  "bedrooms": 4,
  "bathrooms": 3,
  "yearBuilt": 2018,
  "exitStrategy": {
    "primaryExitStrategy": "1031exchange",
    "portfolioStrategy": "cashflow",
    "marketTimingFlexibility": "flexible"
  },
  "longTermAssumptions": {
    "projectionYears": 10,
    "annualRentIncrease": 3,
    "annualPropertyValueIncrease": 4,
    "inflationRate": 2.5,
    "vacancyRate": 5,
    "sellingCostsPercentage": 8
  }
}
```

**Enhanced Response Structure (V3.0):**
```json
{
  "success": true,
  "_id": "deal123",
  "analysis": {
    "isFullAnalysis": true,
    "monthlyAnalysis": { /* standard monthly analysis */ },
    "keyMetrics": { /* enhanced key metrics */ },
    "longTermAnalysis": { /* long-term projections */ },
    "investmentDecision": {
      "verdict": "NEGOTIATE",
      "confidence": 72,
      "score": 68,
      "professionalAssessment": {
        "dealQuality": 68,
        "executionDifficulty": 45,
        "dataReliability": 90,
        "cashFlowScore": 75,
        "irrScore": 82,
        "marketStrengthScore": 65,
        "debtStructureScore": 70,
        "exitStrategyScore": 60,
        "capRateScore": 55,
        "propertyRiskScore": 80,
        "primaryInsight": "Solid opportunity with negotiation potential (68/100)",
        "strategicRecommendations": [
          "Negotiate 5-8% price reduction to improve returns",
          "Consider longer hold period for appreciation"
        ],
        "riskMitigation": [
          "Establish maintenance reserves",
          "Verify rent comparables"
        ],
        "opportunityMaximization": [
          "Refinance when rates improve",
          "Add value through strategic improvements"
        ]
      },
      "portfolioContext": {
        "portfolioId": "68af02011e9491a37a8ccaa7",
        "portfolioName": "Cash Flow Portfolio",
        "fitScore": 85,
        "fitLevel": "excellent",
        "fitAnalysis": "Aligns perfectly with cash flow goals",
        "diversificationImpact": "Reduces geographic concentration",
        "riskContribution": "reduces"
      },
      "primaryReason": "Deal Quality 68/100 indicates solid opportunity with negotiation potential",
      "secondaryReasons": [
        "Tier 2 - Balanced Growth Market: Dallas provides balanced appreciation and cash flow potential",
        "Class B - Standard investment-grade property (85% classification confidence)",
        "Strategy Alignment: GOOD (80/100) - balanced strategy in balanced market with 6-year hold period",
        "Fair market value analysis: Property priced at market median with 3% premium acceptable",
        "Mature property (2010) may require capital improvements within 5-10 years",
        "Strong cash flow buffer of $983 exceeds minimum $300 requirement"
      ],
      "keyRisks": [
        "Cash-on-cash return below optimal threshold for exit strategy",
        "Purchase price near upper limit of acceptable range"
      ],
      "actionPlan": [
        {
          "type": "immediate",
          "title": "Negotiate Purchase Price",
          "description": "Reduce purchase price to $385,000 to achieve 5.8% cash-on-cash return target",
          "priority": "high",
          "estimatedCost": "$30,000 price reduction",
          "expectedBenefit": "Achieve target returns for 1031 exchange strategy",
          "timeframe": "During contract negotiation"
        }
      ],
      "aiEnhancedContent": {
        "actionPlan": {
          "immediateActions": ["Review comparable sales for negotiation leverage"],
          "negotiationFocus": ["Price reduction", "Seller financing options"],
          "preparationItems": ["Secure financing pre-approval"],
          "timeframe": "30-45 days for optimization"
        },
        "capitalStrategy": {
          "currentAssessment": "Solid financing structure with room for improvement",
          "optimizedApproach": "Consider portfolio refinancing strategies",
          "recommendation": "Proceed with negotiated terms"
        },
        "timeline": {
          "phase1": "Negotiation and due diligence (30 days)",
          "phase2": "Closing and initial management setup (30 days)",
          "phase3": "Stabilization and optimization (90 days)"
        }
      },
      "marketContext": {
        "marketPosition": "Above median performance",
        "capRateComparison": 8.6,
        "rentToValueRatio": 1.01,
        "marketRisk": "medium"
      },
      "goalContext": {
        "exitStrategy": "1031exchange",
        "portfolioStrategy": "cashflow"
      }
    },
    "leverageAnalysis": {
      "scenarios": [ /* array of leverage scenarios */ ],
      "optimalScenario": {
        "downPaymentPercent": 25,
        "monthlyNetCashFlow": 1150,
        "cashOnCashReturn": 6.2,
        "leverageScore": 88
      },
      "opportunityCost": {
        "currentDeployment": {
          "cashInvested": 85000,
          "propertiesControlled": 1,
          "portfolioVelocity": 4.88
        },
        "optimalDeployment": {
          "cashInvested": 103750,
          "propertiesControlled": 1,
          "portfolioVelocity": 4.0
        },
        "opportunityCostAnnual": 2400
      }
    },
    "aiInsights": {
      "metricIntelligence": [ /* enhanced AI insights */ ],
      "riskBlindSpots": [ /* professional risk analysis */ ],
      "advancedStrategies": [ /* strategic recommendations */ ],
      "intelligenceScore": 92
    }
  }
}
```

### Investment Decision Response Structure

#### V3.0 Professional Assessment (August 2025)

The `investmentDecision` object now includes professional-grade weighted scoring:

```json
{
  "verdict": "CAUTION",
  "professionalAssessment": {
    "dealQuality": 61,
    "executionDifficulty": 70,
    "dataReliability": 80,
    
    "cashFlowScore": 25,
    "irrScore": 85,
    "marketStrengthScore": 85,
    "debtStructureScore": 53,
    "exitStrategyScore": 83,
    "capRateScore": 97,
    "propertyRiskScore": 75,
    
    "primaryInsight": "Below professional standards (61/100) - seek better opportunities",
    "strategicRecommendations": ["Negotiate rent increases or reduce purchase price", "Target longer hold period"],
    "riskMitigation": ["Low cash flow increases execution risk", "Debt service coverage requires monitoring"],
    "opportunityMaximization": ["Strong market position supports portfolio expansion"]
  },
  "aiEnhancedContent": {
    "actionPlan": {
      "immediateActions": ["Assess negative cash flow of $-505", "Address low DSCR of 0.62"],
      "negotiationFocus": ["Purchase price reduction", "Interest rate improvement"],
      "preparationItems": ["Secure 6-month reserves", "Verify rent comparables"],
      "timeframe": "30-45 days for optimization"
    },
    "capitalStrategy": {
      "currentAssessment": "Negative cash flow indicates payment stress risk",
      "optimizedApproach": "Structure financing to reduce monthly obligations",
      "alternativeOptions": ["Lower interest rate negotiation", "Extended loan term"],
      "recommendation": "Optimize capital structure before proceeding"
    }
  }
}
```

**V3.0 Weighted Professional Factors:**
- **Cash Flow** (35%): Monthly income stability and payment coverage
- **IRR Potential** (25%): Total return analysis with market-adjusted thresholds
- **Market Strength** (15%): Market tier analysis with property performance  
- **Debt Structure** (10%): DSCR, leverage, and financing quality
- **Exit Strategy** (10%): Liquidity options and value realization
- **Cap Rate** (3%): Current yield vs market median
- **Property Risk** (2%): Property class and age assessment

**V3.0 Verdict Thresholds (Deal Quality Based):**
- **BUY**: 80+ Deal Quality (Exceptional opportunity - proceed confidently)
- **NEGOTIATE**: 65-79 Deal Quality (Good opportunity with improvements needed)
- **CAUTION**: 50-64 Deal Quality (Marginal - proceed carefully with risk mitigation)
- **PASS**: <50 Deal Quality (Below investment grade - seek better opportunities)

The enhanced `investmentDecision` object also includes insights from market intelligence phases:

#### Phase 2A: Market Intelligence in `secondaryReasons`
```json
"Tier 2 - Balanced Growth Market: Dallas provides balanced appreciation and cash flow potential"
"Fair market value analysis: Property priced at market median with 3% premium acceptable"
"Market-relative cap rate: 6.5% vs 6.2% market median (+0.3% premium justified)"
```

**Market Classifications:**
- **Tier 1**: Premium appreciation markets (Austin, San Francisco, Seattle, etc.)
- **Tier 2**: Balanced growth markets (Dallas, Phoenix, Atlanta, etc.)  
- **Tier 3**: Cash flow focused markets (Anna TX, Tulsa OK, Birmingham AL, etc.)

#### Phase 2B: Property Classification in `secondaryReasons`
```json
"Class A - Premium high-quality property (89% classification confidence)"
"Class B - Standard investment-grade property (85% classification confidence)" 
"Class C - Value property with higher cash flow potential (80% classification confidence)"
"Mature property (2010) may require capital improvements within 5-10 years"
"Premium property attracts high-quality tenants with lower turnover risk"
```

**Property Classifications:**
- **Class A**: Premium properties (typically <10 years old, high-end finishes)
- **Class B**: Standard investment-grade (10-30 years old, solid condition)
- **Class C**: Value properties (30+ years old, higher management intensity)

#### Phase 3: Strategy Alignment in `secondaryReasons`
```json
"Strategy Alignment: EXCELLENT (95/100) - cashflow strategy in Tier 3 market with 7-year experienced approach"
"Strategy Alignment: GOOD (80/100) - balanced strategy in balanced market with appropriate hold period"
"Strategy Alignment: POOR (45/100) - cashflow strategy in appreciation market suggests geographic reallocation"
"Strategy Alignment: MISMATCH (25/100) - novice investor with Class C property requires experienced guidance"
```

**Strategy Alignment Levels:**
- **EXCELLENT** (90-100): Perfect strategy-market-experience fit
- **GOOD** (75-89): Solid alignment with minor optimization opportunities
- **FAIR** (60-74): Reasonable alignment with some mismatches to address
- **POOR** (40-59): Significant misalignments affecting returns
- **MISMATCH** (0-39): Critical conflicts requiring strategy adjustment

#### Enhanced `keyRisks` Array
```json
"keyRisks": [
  "Strategy misalignment increases execution risk",
  "Class C property requires experienced management - consider professional guidance",
  "Novice investor with high-maintenance property may face unexpected costs",
  "Hold period too short for appreciation strategy - extend to 5-7 years or switch focus",
  "Cash flow strategy in appreciation market - consider Tier 3 markets for better yields"
]
```

#### Fast AI Predictions (NEW)
```
POST /api/deals/quick-predictions
```

**Purpose:** Rapid AI analysis for immediate feedback (3-4 second response time vs previous 76 seconds).

**Request Body:**
```json
{
  "propertyData": { /* same as main analysis */ },
  "analysisType": "investment_decision"
}
```

**Response:**
```json
{
  "success": true,
  "predictions": {
    "investmentDecision": {
      "verdict": "NEGOTIATE",
      "confidence": 75,
      "reasoning": "Positive fundamentals with optimization opportunities"
    },
    "keyInsights": [
      "Strong cap rate performance vs market",
      "Cash flow meets safety requirements",
      "Price negotiation recommended for target returns"
    ],
    "processingTime": "3.2s"
  }
}
```

## Investment Decision Engine v2.1 - Enhanced Analysis

The Investment Decision Engine v2.1 provides **institutional-grade investment intelligence** through three integrated analysis phases:

- **Phase 2A**: Market Intelligence (Tier 1/2/3 classification)
- **Phase 2B**: Property Classification (A/B/C risk assessment)
- **Phase 3**: Strategy Alignment (Strategy-market fit analysis)

### Enhanced Investment Decision Analysis
```
POST /api/deals/analyze
```

**Purpose:** Primary endpoint for comprehensive investment analysis with sophisticated verdict system.

**Critical Fixes Applied (v2.1):**
- ✅ **Single Source of Truth**: All business logic handled in backend
- ✅ **Contradictory Messaging Eliminated**: Consistent verdict-to-message mapping
- ✅ **Score Consistency**: Unified 0-100 property quality scoring
- ✅ **Conservative Logic**: Walk-away price validation prevents overpaying

**Request Body:**
```json
{
  "propertyData": {
    "purchasePrice": 300000,
    "monthlyRent": 2200,
    "downPayment": 60000,
    "interestRate": 0.07
  },
  "userContext": {
    "experienceLevel": "intermediate",
    "exitStrategy": "refinance", 
    "portfolioStrategy": "cashflow",
    "riskTolerance": "moderate"
  },
  "enhancedGoals": {
    "freeTextStrategy": "House hacking strategy focusing on cash flow"
  }
}
```

**Response (v2.1 Format):**
```json
{
  "success": true,
  "data": {
    "investmentDecision": {
      "verdict": "BUY",
      "confidence": 75,
      "score": 68,
      "primaryReason": "Strong fundamentals with 12.0% return exceeding 6.5% target",
      "secondaryReasons": ["Positive cash flow of $400/month", "Cap rate above market average"],
      "keyRisks": ["Interest rate sensitivity", "Local market competition"],
      "walkAwayPrice": 280000,
      "improvementSuggestions": []
    },
    "analysis": { /* full property analysis */ },
    "processingTime": "850ms"
  }
}
```

#### Goal Enhancement Analysis  
```
POST /api/deals/analyze-goals
```

**Purpose:** AI-enhanced processing of free-text investment strategies.

**Request Body:**
```json
{
  "structuredGoals": {
    "exitStrategy": "refinance",
    "portfolioStrategy": "geographic", 
    "experienceLevel": "intermediate"
  },
  "freeTextStrategy": "Looking to invest out of state from California to Texas markets for better cash flow opportunities"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "enhancedGoals": {
      "aiEnhancedStrategy": "Geographic arbitrage strategy detected - investing from high-cost to lower-cost markets",
      "strategicInsights": [
        "Texas markets typically offer 6-8% cap rates vs California's 3-4%",
        "Consider property management requirements for out-of-state investing"
      ],
      "riskAdjustments": ["Factor travel costs for property visits", "Ensure local market knowledge"],
      "confidenceScore": 88,
      "processingMethod": "pattern"
    }
  }
}
```

### Interactive Analysis Endpoints

#### Quick Calculation (Real-time Updates)
```
POST /api/quick-calculate
```

**Purpose:** Ultra-fast financial calculations for real-time interactive analysis.

**Performance:** Target <50ms response time for immediate UI feedback.

**Request Body:**
```json
{
  "purchasePrice": 425000,
  "downPayment": 85000,
  "interestRate": 7.125,
  "monthlyRent": 2875,
  "propertyTaxRate": 1.25,
  "insuranceRate": 0.52,
  "maintenanceCost": 287,
  "propertyManagementRate": 8.5,
  "vacancyRate": 5,
  "requestId": "analysis-1643723456789-abc123"
}
```

**Response:**
```json
{
  "requestId": "analysis-1643723456789-abc123",
  "keyMetrics": {
    "monthlyIncome": 2875,
    "monthlyExpenses": 1158.51,
    "monthlyCashFlow": -535.28,
    "capRate": 4.95,
    "cashOnCashReturn": -7.56,
    "dscr": 0.77,
    "debtYield": 6.19,
    "grossYield": 8.12
  },
  "calculationTime": 23
}
```

#### Deal Optimization
```
POST /api/deals/:id/optimize
```

**Purpose:** Generate AI-powered optimization suggestions for underperforming deals.

**Request Body:**
```json
{
  "optimizationGoals": ["improve_cash_flow", "reduce_risk", "maximize_returns"],
  "constraints": {
    "maxPriceReduction": 0.15,
    "maxDownPaymentIncrease": 0.10
  }
}
```

**Response:**
```json
{
  "originalScore": 42,
  "optimizations": [
    {
      "strategy": "purchase_price_reduction",
      "description": "Reduce purchase price by 8.5% to improve cash flow",
      "changes": { "purchasePrice": 388250 },
      "impact": {
        "newScore": 67,
        "monthlyImprovement": 285.50,
        "capRateImprovement": 1.2
      },
      "feasibility": "high",
      "implementation": "Negotiate with seller citing comparable sales"
    }
  ]
}
```

#### Scenario Management
```
POST /api/scenarios
```

**Purpose:** Save analysis scenario with custom name for future comparison.

**Request Body:**
```json
{
  "dealId": "507f1f77bcf86cd799439011",
  "scenarioName": "Conservative Estimate",
  "propertyData": { /* complete property data */ },
  "analysis": { /* complete analysis results */ }
}
```

```
GET /api/scenarios/:dealId
```

**Purpose:** Retrieve all saved scenarios for a specific deal.

```
POST /api/scenarios/compare
```

**Purpose:** Compare multiple scenarios side-by-side.

**Request Body:**
```json
{
  "scenarioIds": ["scenario1", "scenario2", "scenario3"]
}
```

### Authentication Endpoints

#### User Registration
```
POST /api/auth/register
```

**Purpose:** Create a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "user",
    "isVerified": false
  },
  "accessToken": "jwt_token_here",
  "refreshToken": "refresh_token_here"
}
```

#### User Login
```
POST /api/auth/login
```

**Purpose:** Authenticate user and receive access tokens.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123"
}
```

**Response:** Same as registration response.

#### Token Refresh
```
POST /api/auth/refresh
```

**Purpose:** Refresh expired access token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "refresh_token_here"
}
```

#### Get User Profile
```
GET /api/auth/profile
```

**Purpose:** Get current user's profile information.

**Headers:** `Authorization: Bearer <access_token>`

**Response:**
```json
{
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "user",
    "isVerified": false,
    "createdAt": "2025-07-13T19:14:40.000Z",
    "lastLogin": "2025-07-13T20:30:15.000Z"
  }
}
```

#### Update User Profile
```
PUT /api/auth/profile
```

**Purpose:** Update user's profile information.

**Headers:** `Authorization: Bearer <access_token>`

**Request Body:**
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "newemail@example.com"
}
```

#### Change Password
```
POST /api/auth/change-password
```

**Purpose:** Change user's password.

**Headers:** `Authorization: Bearer <access_token>`

**Request Body:**
```json
{
  "currentPassword": "OldPassword123",
  "newPassword": "NewPassword456"
}
```

### Admin Endpoints

#### Get All Users (Admin Only)
```
GET /api/admin/users
```

**Purpose:** Retrieve all users with statistics (admin only).

**Headers:** `Authorization: Bearer <admin_access_token>`

**Response:**
```json
{
  "message": "Users retrieved successfully",
  "users": [
    {
      "id": "507f1f77bcf86cd799439011",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "user",
      "isVerified": true,
      "createdAt": "2025-07-13T19:14:40.000Z",
      "lastLogin": "2025-07-13T20:30:15.000Z",
      "totalDeals": 5
    }
  ],
  "total": 1
}
```

#### Update User Role (Admin Only)
```
PUT /api/admin/users/:userId/role
```

**Purpose:** Change user's role (promote/demote admin).

**Headers:** `Authorization: Bearer <admin_access_token>`

**Request Body:**
```json
{
  "role": "admin"
}
```

#### Update User Status (Admin Only)
```
PUT /api/admin/users/:userId/status
```

**Purpose:** Update user's verification status.

**Headers:** `Authorization: Bearer <admin_access_token>`

**Request Body:**
```json
{
  "isVerified": true
}
```

#### Get System Statistics (Admin Only)
```
GET /api/admin/stats
```

**Purpose:** Get system-wide statistics.

**Headers:** `Authorization: Bearer <admin_access_token>`

**Response:**
```json
{
  "stats": {
    "users": {
      "total": 150,
      "admins": 3,
      "verified": 120,
      "recent": 15
    },
    "deals": {
      "total": 1250
    },
    "timestamp": "2025-07-13T20:30:15.000Z"
  }
}
```

### Property Wizard Endpoints

#### Property Lookup
```
POST /api/wizard/property-lookup
```

**Purpose:** Look up comprehensive property details by address using cached RentCast and Census APIs.

**Request Body:**
```json
{
  "address": "123 Main Street, Austin, TX 78701",
  "includeComparables": true,
  "includeMarketData": true,
  "includeTaxData": false,
  "includeInsuranceEstimate": false
}
```

**Response:**
```json
{
  "success": true,
  "propertyDetails": {
    "address": {
      "formatted": "123 Main Street, Austin, TX 78701",
      "standardized": {
        "street": "123 Main Street",
        "city": "Austin",
        "state": "TX",
        "zipCode": "78701",
        "formattedAddress": "123 Main Street, Austin, TX 78701"
      },
      "latitude": 30.2672,
      "longitude": -97.7431
    },
    "squareFootage": 2000,
    "bedrooms": 3,
    "bathrooms": 2,
    "yearBuilt": 2010,
    "propertyType": "SFR",
    "marketValue": 425000,
    "dataConfidence": {
      "squareFootage": {
        "score": 85,
        "source": "RentCast",
        "lastUpdated": "2025-08-03T20:30:00.000Z"
      }
    }
  },
  "rentEstimate": {
    "monthlyRent": 2875,
    "range": { "low": 2588, "high": 3163 },
    "confidence": 78,
    "marketPosition": "At Market"
  },
  "comparables": [
    {
      "address": "456 Oak Street, Austin, TX 78701",
      "distance": 0.3,
      "salePrice": 415000,
      "saleDate": "2025-06-15T00:00:00.000Z",
      "sqft": 1950,
      "bedrooms": 3,
      "bathrooms": 2
    }
  ],
  "marketData": {
    "zipCode": "78701",
    "medianRent": 2750,
    "medianSalePrice": 435000,
    "averageDaysOnMarket": 28,
    "priceToRentRatio": 158,
    "marketTrend": "Rising"
  },
  "apiCalls": {
    "successful": ["RentCast", "Census"],
    "failed": [],
    "cached": ["FRED"]
  }
}
```

#### Smart Rent Estimation
```
POST /api/wizard/rent-estimate
```

**Purpose:** Generate intelligent rent estimate using RentCast property data, Census market data, and machine learning adjustments.

**Features:**
- Real-time market data integration
- Intelligent adjustments for property characteristics
- Confidence scoring and reliability indicators
- Fallback calculations for API failures

**Request Body:**
```json
{
  "address": "123 Main Street, Austin, TX 78701",
  "squareFootage": 2000,
  "bedrooms": 3,
  "bathrooms": 2,
  "yearBuilt": 2010,
  "zipCode": "78701"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "value": 2875,
    "confidence": {
      "score": 78,
      "source": "Market Analysis (Square Footage, Bedrooms, Year Built, Property Value)",
      "reliability": "high"
    },
    "range": {
      "low": 2588,
      "high": 3163
    },
    "breakdown": {
      "baseRentPerSqft": 1.35,
      "adjustments": {
        "bedrooms": 0,
        "yearBuilt": 143.75,
        "marketFactor": 0
      },
      "capByValueRule": 0
    }
  }
}
```

**Calculation Methodology:**

1. **Base Rent per Sqft**: Sources from Census median rent and RentCast market data
2. **Property Adjustments**:
   - Extra bedrooms: +$150 per bedroom above 3
   - Age adjustments: ±5% for new (<10 years) or old (>40 years) properties
   - Market factor: ±25% based on comparable properties
3. **1% Rule Cap**: Rent capped at 1% of property value monthly
4. **Confidence Scoring**: Based on data availability and source reliability

#### Smart Defaults
```
POST /api/wizard/smart-defaults
```

**Purpose:** Get intelligent default values based on location and property type using cached economic and market data.

**Request Body:**
```json
{
  "zipCode": "78701",
  "propertyType": "SFR",
  "propertyValue": 425000,
  "squareFootage": 2000
}
```

**Response:**
```json
{
  "success": true,
  "defaults": {
    "downPaymentPercentage": 25,
    "closingCostPercentage": 2.5,
    "currentMortgageRate": 7.125,
    "managementFeePercentage": 8,
    "maintenanceReservePercentage": 5,
    "vacancyRatePercentage": 4,
    "propertyTaxRate": 1.9,
    "insuranceRate": 0.7,
    "appreciationRate": 4.2,
    "rentGrowthRate": 3.8,
    "inflationRate": 2.5,
    "dataSources": {
      "economic": "FRED",
      "market": "RentCast",
      "regional": "Census"
    },
    "confidence": {
      "economic": 95,
      "market": 82,
      "regional": 78
    },
    "lastUpdated": "2025-08-03T20:30:00.000Z"
  },
  "regionalContext": {
    "marketType": "Hot",
    "investmentTiming": "Favorable",
    "keyFactors": [
      "Strong job market growth in Austin metro",
      "Limited housing supply driving rent growth",
      "Below-average property tax rates for Texas"
    ]
  }
}
```

#### Address Validation
```
POST /api/wizard/validate-address
```

**Purpose:** Validate and standardize address format for property lookup.

**Request Body:**
```json
{
  "address": "123 Main St, Austin, TX",
  "validateOnly": true
}
```

**Response:**
```json
{
  "success": true,
  "isValid": true,
  "standardizedAddress": {
    "street": "123 Main St",
    "city": "Austin",
    "state": "TX",
    "zipCode": "",
    "formattedAddress": "123 Main St, Austin, TX"
  },
  "suggestions": []
}
```

#### Wizard Health Check
```
GET /api/wizard/health
```

**Purpose:** Check health status of wizard services and external API integrations.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-08-03T20:30:00.000Z",
  "services": {
    "fred": {
      "status": "healthy",
      "message": "FRED API operational"
    },
    "rentcast": {
      "status": "healthy", 
      "message": "RentCast API operational"
    },
    "aggregator": {
      "status": "healthy",
      "message": "PropertyDataAggregator operational"
    }
  },
  "version": "1.0.0-phase1"
}
```

#### Wizard Analytics
```
GET /api/wizard/stats
```

**Purpose:** Get usage statistics and feature status for monitoring.

**Response:**
```json
{
  "timestamp": "2025-08-03T20:30:00.000Z",
  "uptime": 86400,
  "environment": "production",
  "phase": "Phase 1 - Foundation",
  "features": {
    "propertyLookup": "enabled",
    "smartDefaults": "enabled", 
    "addressValidation": "basic",
    "externalApis": "cached (FRED, RentCast)",
    "costOptimization": "MongoDB caching active"
  }
}
```

### Census Data

#### Get Demographic Data
```
GET /api/census/demographics
```

**Purpose:** Retrieves demographic data for a specified location from the US Census Bureau API.

**Query Parameters:**

| Parameter | Type   | Description                                |
|-----------|--------|--------------------------------------------|
| zip       | string | ZIP code (e.g., "94043")                  |
| state     | string | State code (e.g., "CA")                   |
| county    | string | County code or name                        |
| city      | string | City name                                  |
| tract     | string | Census tract                               |
| year      | number | Census data year (defaults to most recent) |
| dataset   | string | Census dataset (defaults to "acs/acs5")    |

**Response:**
```json
{
  "totalPopulation": 28000,
  "medianAge": 35.4
}
```

#### Get Income Data
```
GET /api/census/income
```

**Purpose:** Retrieves income data for a specified location from the US Census Bureau API.

**Query Parameters:**

| Parameter | Type   | Description                                |
|-----------|--------|--------------------------------------------|
| zip       | string | ZIP code (e.g., "94043")                  |
| state     | string | State code (e.g., "CA")                   |
| county    | string | County code or name                        |
| city      | string | City name                                  |
| tract     | string | Census tract                               |
| year      | number | Census data year (defaults to most recent) |
| dataset   | string | Census dataset (defaults to "acs/acs5")    |

**Response:**
```json
{
  "medianHouseholdIncome": 85000,
  "perCapitaIncome": 45000
}
```

#### Get Housing Data
```
GET /api/census/housing
```

**Purpose:** Retrieves housing data for a specified location from the US Census Bureau API.

**Query Parameters:**

| Parameter | Type   | Description                                |
|-----------|--------|--------------------------------------------|
| zip       | string | ZIP code (e.g., "94043")                  |
| state     | string | State code (e.g., "CA")                   |
| county    | string | County code or name                        |
| city      | string | City name                                  |
| tract     | string | Census tract                               |
| year      | number | Census data year (defaults to most recent) |
| dataset   | string | Census dataset (defaults to "acs/acs5")    |

**Response:**
```json
{
  "totalHousingUnits": 12000,
  "occupancyRate": 0.95,
  "vacancyRate": 0.05,
  "ownerOccupied": 7000,
  "renterOccupied": 4400,
  "medianHomeValue": 450000,
  "medianRent": 1800
}
```

#### Get Comprehensive Census Data
```
GET /api/census/comprehensive
```

**Purpose:** Retrieves comprehensive census data (demographics, income, housing) for a specified location.

**Query Parameters:**

| Parameter | Type   | Description                                |
|-----------|--------|--------------------------------------------|
| zip       | string | ZIP code (e.g., "94043")                  |
| state     | string | State code (e.g., "CA")                   |
| county    | string | County code or name                        |
| city      | string | City name                                  |
| tract     | string | Census tract                               |
| year      | number | Census data year (defaults to most recent) |
| dataset   | string | Census dataset (defaults to "acs/acs5")    |

**Response:**
```json
{
  "demographics": {
    "totalPopulation": 28000,
    "medianAge": 35.4
  },
  "income": {
    "medianHouseholdIncome": 85000,
    "perCapitaIncome": 45000
  },
  "housing": {
    "totalHousingUnits": 12000,
    "occupancyRate": 0.95,
    "vacancyRate": 0.05,
    "ownerOccupied": 7000,
    "renterOccupied": 4400,
    "medianHomeValue": 450000,
    "medianRent": 1800
  }
}
```

### Property Analysis

#### Analyze Property (Enhanced with AI)
```
POST /api/analyze/:type
```

**Purpose:** Analyze a property with comprehensive financial metrics and AI-powered insights

**Parameters:**
- `type`: Property type (`sfr` for Single Family Rental, `mf` for Multi-Family)

#### Legacy Analyze Property
```
POST /api/deals/analyze
```

**Purpose:** Legacy analysis endpoint (deprecated - use /api/analyze/:type instead)

**Request Body:**
```json
{
  "propertyType": "SFR",
  "propertyName": "Sample SFR Property",
  "propertyAddress": {
    "street": "123 Main St",
    "city": "Anytown",
    "state": "CA",
    "zipCode": "12345"
  },
  "purchasePrice": 300000,
  "downPayment": 60000,
  "interestRate": 4.5,
  "loanTerm": 30,
  "monthlyRent": 2500,
  "propertyTaxRate": 1.2,
  "insuranceRate": 0.5,
  "maintenanceCost": 150,
  "propertyManagementRate": 8,
  "squareFootage": 1500,
  "bedrooms": 3,
  "bathrooms": 2,
  "yearBuilt": 2010,
  "closingCosts": 5000,
  "capitalInvestments": 5000,
  "tenantTurnoverFees": {
    "prepFees": 750,
    "realtorCommission": 0.5
  },
  "longTermAssumptions": {
    "annualRentIncrease": 3,
    "annualExpenseIncrease": 2,
    "annualPropertyValueIncrease": 3,
    "sellingCosts": 6,
    "projectionYears": 10,
    "vacancyRate": 5
  }
}
```

**Response:**
```json
{
  "monthlyAnalysis": {
    "income": {
      "gross": 2500,
      "effective": 2375
    },
    "expenses": {
      "propertyTax": 300,
      "insurance": 125,
      "maintenance": 150,
      "propertyManagement": 200,
      "vacancy": 125,
      "tenantTurnover": 52,
      "mortgage": {
        "total": 1216,
        "principal": 182,
        "interest": 1034
      },
      "total": 2168
    },
    "cashFlow": 259
  },
  "annualAnalysis": {
    "effectiveGrossIncome": 28500,
    "operatingExpenses": 10800,
    "noi": 17700,
    "debtService": 14592,
    "cashFlow": 3108
  },
  "longTermAnalysis": {
    "projections": [
      {
        "year": 1,
        "grossRent": 28500,
        "operatingExpenses": 10800,
        "noi": 17700,
        "debtService": 14592,
        "cashFlow": 3108,
        "propertyValue": 300000,
        "mortgageBalance": 237818,
        "equity": 62182,
        "propertyTax": 3600,
        "insurance": 1500,
        "maintenance": 1800,
        "propertyManagement": 2400,
        "vacancy": 1500,
        "turnoverCosts": 625,
        "capitalImprovements": 5000,
        "appreciation": 9000,
        "totalReturn": 12108
      },
      // Additional years omitted for brevity
    ],
    "returns": {
      "irr": 18.21,
      "totalCashFlow": 40950,
      "totalAppreciation": 103143,
      "totalReturn": 144093,
      "totalInvestment": 65000,
      "totalAdditionalInvestment": 15000
    },
    "exitAnalysis": {
      "projectedSalePrice": 403143,
      "sellingCosts": 24189,
      "mortgagePayoff": 199811,
      "netProceedsFromSale": 179143,
      "returnOnInvestment": 220.24
    },
    "projectionYears": 10
  },
  "keyMetrics": {
    "noi": 17760,
    "capRate": 5.9,
    "cashOnCashReturn": 4.78,
    "irr": 18.21,
    "dscr": 1.21,
    "operatingExpenseRatio": 42.5,
    "totalInvestment": 65000,
    "pricePerSqFt": 200,
    "rentPerSqFt": 1.67,
    "grossRentMultiplier": 10,
    "returnOnImprovements": 8.5,
    "turnoverCostImpact": 1.2
  },
  "aiInsights": {
    "summary": "This property represents a solid investment opportunity with $259 monthly cash flow and a 5.9% cap rate, positioned 12% below market median pricing, making it suitable for income-focused investors seeking stable returns with moderate appreciation potential.",
    "investmentScore": 75,
    "investorFit": "Best suited for income-focused investors with 3-5 year investment horizons seeking stable cash flow with moderate appreciation. Ideal for portfolio diversification with 15-25% allocation to real estate.",
    "strengths": [
      "Strong monthly cash flow of $259 representing 4.78% cash-on-cash return above market average of 4.2%",
      "Excellent market positioning at 12% below area median home value of $340,000",
      "Solid cap rate of 5.9% exceeding market average of 5.2% for similar properties",
      "DSCR of 1.21 provides comfortable debt service coverage above lender requirements"
    ],
    "weaknesses": [
      "Property age of 15 years may result in $200-400 monthly maintenance increases over next 5 years",
      "Property tax rate of 1.2% slightly above county average of 1.1%, adding $360 annually",
      "Expense ratio of 43% approaches upper limit of acceptable range (35-45%)",
      "Break-even occupancy of 87% leaves limited margin for extended vacancies"
    ],
    "recommendations": [
      "Establish $15,000 capital reserve fund for major maintenance items (HVAC, roof) expected within 3-5 years",
      "Consider refinancing if rates drop below 4% to improve cash flow by approximately $150/month",
      "Implement property management system to reduce vacancy periods and optimize rent collection",
      "Evaluate market rent increases of 3-5% annually based on local demographics and income growth"
    ],
    "riskAssessment": "Moderate risk profile with primary concerns being property age-related maintenance costs and market rental volatility. Downside scenario shows potential for $50-100 monthly cash flow reduction if major repairs coincide with vacancy periods.",
    "strategicInsights": "Property demonstrates strong fundamentals with defensive characteristics suitable for conservative portfolios. Below-market purchase price provides built-in equity cushion of approximately $40,000, while positive cash flow supports debt service during market downturns.",
    "competitiveAdvantage": "Location in established neighborhood with 95% occupancy rates provides stable rental demand. Property's condition and recent updates position it favorably against 40% of area rentals requiring significant improvements.",
    "wealthBuildingPotential": "Conservative wealth building vehicle with projected $31,000 equity accumulation over 5 years through mortgage paydown and 3% annual appreciation. Total return potential of $55,000 including cash flow represents 85% ROI over holding period.",
    "marketCycleAnalysis": "Local market in mid-cycle expansion phase with population growth of 2.1% annually and median income increases of 4.2%. Optimal acquisition timing with 3-5 year appreciation runway before next cycle peak.",
    "financingRecommendations": "Current 4.5% financing is competitive but monitor for refinancing opportunities below 4.0% which would improve cash flow by $150/month and IRR by 1.8 percentage points.",
    "portfolioFitAnalysis": "Excellent diversification asset with low correlation to stock market volatility. Recommended allocation of 15-20% of investment portfolio for risk-adjusted returns and inflation hedging characteristics.",
    "opportunityCostAnalysis": "Expected 12.3% IRR compares favorably to S&P 500 historical 10.5% with lower volatility. Superior to bond yields of 4.8% while providing inflation protection and tax advantages through depreciation.",
    "marketTrendPrediction": "Expect continued rental demand growth driven by local job market expansion and limited new construction. Rental rates likely to increase 3-4% annually over next 3 years based on income growth and housing supply constraints.",
    "optimalExitStrategy": "Hold for 5-7 years to maximize mortgage paydown and appreciation. Exit timing should coincide with market peak indicators: rent growth slowing below 2% annually and cap rate compression below 5.5%.",
    "recommendedHoldPeriod": "5-7 years optimal hold period to balance equity accumulation with market cycle timing. Consider sale when IRR peaks around year 6-7 or if market fundamentals deteriorate significantly.",
    "valueAddOpportunities": [
      {
        "improvement": "Kitchen renovation with modern appliances and finishes",
        "estimatedCost": "$12,000-15,000",
        "potentialRoiPercent": "18-22%",
        "rentIncreasePotential": "$150-200/month",
        "valueIncreasePotential": "$25,000-30,000",
        "implementationDifficulty": "medium",
        "strategicPriority": "high"
      },
      {
        "improvement": "Energy efficiency upgrades (windows, insulation, HVAC)",
        "estimatedCost": "$8,000-12,000",
        "potentialRoiPercent": "15-20%",
        "rentIncreasePotential": "$75-100/month",
        "valueIncreasePotential": "$15,000-20,000",
        "implementationDifficulty": "medium",
        "strategicPriority": "medium"
      }
    ],
    "notes": "Property benefits from established neighborhood character and proximity to employment centers. Consider local zoning changes that might allow ADU development for additional income potential."
  }
}
```

#### Get Sample SFR Data
```
GET /api/deals/sample-sfr
```

**Purpose:** Get sample data for a Single-Family Rental property

**Response:** A complete SFR property data object with sample values

### Saved Properties (V3.0 Enhanced)

#### Get All Properties
```
GET /api/deals
GET /api/deals?portfolioId=:id
```

**Purpose:** Retrieve all saved properties or filter by portfolio

**Query Parameters:**
- `portfolioId` (optional): Filter properties by portfolio ID
- `propertyType` (optional): Filter by property type (SFR, MF, COMMERCIAL_*, etc.)
- `isFullAnalysis` (optional): Filter by analysis type (true/false)

**Response (V3.0):**
```json
[
  {
    "_id": "655e1a2bc3f7b8d4e9f0a1b2",
    "propertyName": "Sample SFR Property",
    "propertyType": "SFR",
    "portfolioId": "68af02011e9491a37a8ccaa7",
    "ownershipPercentage": 100,
    "source": "FULL_ANALYSIS",
    "propertyAddress": {
      "street": "123 Main St",
      "city": "Anytown",
      "state": "CA",
      "zipCode": "12345"
    },
    "purchasePrice": 300000,
    "downPayment": 60000,
    // Additional property data...
    "analysis": {
      "isFullAnalysis": true,
      "keyMetrics": {
        "capRate": 5.9,
        "cashOnCashReturn": 4.78,
        "monthlyRoi": 0.4
      },
      "investmentDecision": {
        "verdict": "NEGOTIATE",
        "professionalAssessment": {
          "dealQuality": 68
        }
      }
    },
    "createdAt": "2025-06-15T14:30:00.000Z",
    "updatedAt": "2025-08-30T14:30:00.000Z"
  },
  {
    "_id": "655e1a2bc3f7b8d4e9f0a1b3",
    "propertyName": "Manual Retail Property",
    "propertyType": "COMMERCIAL_RETAIL",
    "portfolioId": "68af02011e9491a37a8ccaa7",
    "ownershipPercentage": 100,
    "source": "PORTFOLIO_MANUAL_ENTRY",
    "purchasePrice": 450000,
    "monthlyRent": 3200,
    "monthlyOperatingExpenses": 850,
    "analysis": {
      "isFullAnalysis": false,
      "keyMetrics": {
        "capRate": 6.2,
        "cashOnCashReturn": 8.1,
        "monthlyRoi": 0.68
      },
      "monthlyAnalysis": {
        "income": { "gross": 3200, "net": 3200 },
        "expenses": { "total": 1150 },
        "cashFlow": 2050
      }
    },
    "createdAt": "2025-08-28T10:15:00.000Z",
    "updatedAt": "2025-08-28T10:15:00.000Z"
  }
]
```

#### Get Property by ID
```
GET /api/deals/:id
```

**Purpose:** Retrieve a saved property by ID

**Response:** Complete property and analysis object

#### Create Property (V3.0 Enhanced)
```
POST /api/deals
```

**Purpose:** Save a new property analysis (full or skinny)

**Request Body for Full Analysis:**
```json
{
  "propertyType": "SFR",
  "propertyName": "Investment Property",
  "portfolioId": "68af02011e9491a37a8ccaa7",
  "purchasePrice": 300000,
  "monthlyRent": 2500,
  // ... complete property data
  "analysis": {
    "isFullAnalysis": true,
    // ... complete analysis object
  }
}
```

**Request Body for Manual Portfolio Property (Skinny Analysis):**
```json
{
  "propertyType": "COMMERCIAL_RETAIL",
  "propertyName": "Manual Retail Store",
  "portfolioId": "68af02011e9491a37a8ccaa7",
  "ownershipPercentage": 100,
  "source": "PORTFOLIO_MANUAL_ENTRY",
  "purchasePrice": 450000,
  "monthlyRent": 3200,
  "monthlyOperatingExpenses": 850,
  "downPayment": 90000,
  "interestRate": 6.5,
  "loanTerm": 25
}
```

**Response (V3.0):**
```json
{
  "_id": "655e1a2bc3f7b8d4e9f0a1b2",
  "message": "Property saved successfully",
  "analysisType": "full",
  "portfolioUpdated": true,
  "analysis": {
    "isFullAnalysis": true,
    "keyMetrics": {
      "capRate": 5.9,
      "cashOnCashReturn": 4.78,
      "totalReturn": 12.3,
      "monthlyRoi": 0.4
    },
    "investmentDecision": {
      "verdict": "NEGOTIATE",
      "professionalAssessment": {
        "dealQuality": 68
      }
    }
  }
}
```

**Response for Manual Property:**
```json
{
  "_id": "655e1a2bc3f7b8d4e9f0a1b3",
  "message": "Manual property added to portfolio successfully",
  "analysisType": "skinny",
  "portfolioUpdated": true,
  "analysis": {
    "isFullAnalysis": false,
    "keyMetrics": {
      "capRate": 6.2,
      "cashOnCashReturn": 8.1,
      "totalReturn": 14.8,
      "monthlyRoi": 0.68
    },
    "monthlyAnalysis": {
      "income": { "gross": 3200 },
      "expenses": { "total": 1150 },
      "cashFlow": 2050
    }
  }
}
```

#### Update Property
```
PUT /api/deals/:id
```

**Purpose:** Update an existing property

**Request Body:** Updated property data with analysis

**Response:**
```json
{
  "_id": "655e1a2bc3f7b8d4e9f0a1b2",
  "message": "Property updated successfully"
}
```

#### Delete Property
```
DELETE /api/deals/:id
```

**Purpose:** Delete a property by ID

**Response:**
```json
{
  "message": "Property deleted successfully"
}
```

## Data Structures

### Analysis Interface
The core analysis interface that represents a complete property analysis:

```typescript
interface Analysis {
  monthlyAnalysis: MonthlyAnalysis;
  annualAnalysis: AnnualAnalysis;
  longTermAnalysis: LongTermAnalysis;
  keyMetrics: KeyMetrics;
  aiInsights?: AIInsights;
}
```

### Monthly Analysis
Represents monthly financial metrics:
```typescript
interface MonthlyAnalysis {
  income: {
    gross: number;
    effective: number;
  };
  expenses: {
    operating: number;
    debt: number;
    total: number;
    breakdown: {
      propertyTax: number;
      insurance: number;
      maintenance: number;
      propertyManagement: number;
      vacancy: number;
      tenantTurnover: number;
      utilities?: number;
      commonAreaElectricity?: number;
      landscaping?: number;
      waterSewer?: number;
      garbage?: number;
      marketingAndAdvertising?: number;
      repairsAndMaintenance?: number;
      capEx?: number;
      other?: number;
    };
  };
  cashFlow: number;
}
```

### Annual Analysis
Represents annual financial metrics:
```typescript
interface AnnualAnalysis {
  income: number;
  expenses: number;
  noi: number;
  debtService: number;
  cashFlow: number;
  effectiveGrossIncome: number;
  operatingExpenses: number;
}
```

### Long Term Analysis
Represents long-term projections and returns:
```typescript
interface LongTermAnalysis {
  projections: YearlyProjection[];
  exitAnalysis: ExitAnalysis;
  returns: {
    irr: number;
    totalCashFlow: number;
    totalAppreciation: number;
    totalReturn: number;
    totalInvestment: number;
    totalAdditionalInvestment: number;
  };
  projectionYears: number;
}
```

### Yearly Projection
Individual year metrics in long-term analysis:
```typescript
interface YearlyProjection {
  year: number;
  propertyValue: number;
  grossIncome: number;
  operatingExpenses: number;
  noi: number;
  debtService: number;
  cashFlow: number;
  equity: number;
  mortgageBalance: number;
  totalReturn: number;
  propertyTax: number;
  insurance: number;
  maintenance: number;
  propertyManagement: number;
  vacancy: number;
  turnoverCosts: number;
  capitalImprovements: number;
  realtorBrokerageFee?: number;
  grossRent: number;
  appreciation: number;
}
```

### Exit Analysis
```typescript
interface ExitAnalysis {
  projectedSalePrice: number;
  sellingCosts: number;
  mortgagePayoff: number;
  netProceedsFromSale: number;
  returnOnInvestment: number;
}
```

### Key Metrics
```typescript
interface CommonMetrics {
  noi: number;
  capRate: number;
  cashOnCashReturn: number;
  irr: number;
  dscr: number;
  operatingExpenseRatio: number;
  totalInvestment: number;
}
```

### Property-Specific Metrics

#### SFR Metrics
```typescript
interface SFRMetrics extends KeyMetrics {
  pricePerSqFt: number;
  rentPerSqFt: number;
  grossRentMultiplier: number;
  afterRepairValueRatio?: number;
  rehabROI?: number;
}
```

#### Multi-Family Metrics
```typescript
interface MultiFamilyMetrics extends KeyMetrics {
  pricePerUnit: number;
  pricePerSqft: number;
  noiPerUnit: number;
  averageRentPerUnit: number;
  operatingExpensePerUnit: number;
  commonAreaExpenseRatio: number;
  unitMixEfficiency?: number;
  economicVacancyRate: number;
}
```

### AI Insights
```typescript
interface AIInsights {
  // Core Analysis
  summary: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  investmentScore: number | null;
  riskAssessment?: string;
  
  // PHASE 1 ENHANCEMENT: Score Breakdown System ✅
  scoreBreakdown?: {
    cashFlow: {
      score: number;
      max: number;
      reason: string;
    };
    marketPosition: {
      score: number;
      max: number;
      reason: string;
    };
    financialMetrics: {
      score: number;
      max: number;
      reason: string;
    };
    riskAssessment: {
      score: number;
      max: number;
      reason: string;
    };
  };
  
  // PHASE 1 ENHANCEMENT: Market Intelligence ✅
  marketPositioning?: {
    propertyValue: number;
    marketMedian: number;
    percentageDiff: number;
    position: string;
    competitiveAdvantage: string;
  };
  
  marketInsights?: string[];
  
  // Enhanced Strategic Analysis (v2.0+)
  investorFit?: string;
  strategicInsights?: string;
  competitiveAdvantage?: string;
  wealthBuildingPotential?: string;
  marketCycleAnalysis?: string;
  financingRecommendations?: string;
  portfolioFitAnalysis?: string;
  opportunityCostAnalysis?: string;
  
  // Property-Specific Analysis
  unitMixAnalysis?: string; // For Multi-Family properties
  marketPositionAnalysis?: string;
  
  // Future Performance
  marketTrendPrediction?: string;
  optimalExitStrategy?: string;
  recommendedHoldPeriod?: string;
  
  // Value Enhancement
  valueAddOpportunities?: ValueAddOpportunity[];
  
  // Additional Context
  notes?: string;
}

interface ValueAddOpportunity {
  improvement: string;
  estimatedCost: string;
  potentialRoiPercent: string;
  rentIncreasePotential: string;
  valueIncreasePotential: string;
  implementationDifficulty?: 'easy' | 'medium' | 'hard';
  strategicPriority?: 'high' | 'medium' | 'low';
}
```

## Property Data Structures

### Base Property Data
```typescript
interface BasePropertyData {
  propertyType: 'SFR' | 'MF';
  propertyName: string;
  propertyAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  purchasePrice: number;
  downPayment: number;
  interestRate: number;
  loanTerm: number;
  closingCosts?: number;
  repairCosts?: number;
  propertyTaxRate: number;
  insuranceRate: number;
  maintenanceCost: number;
  propertyManagementRate: number;
  capitalInvestments?: number;
  tenantTurnoverFees?: {
    prepFees: number;
    realtorCommission: number;
  };
  longTermAssumptions: LongTermAssumptions;
}
```

### SFR Property Data
```typescript
interface SFRData extends BasePropertyData {
  propertyType: 'SFR';
  monthlyRent: number;
  squareFootage: number;
  bedrooms: number;
  bathrooms: number;
  yearBuilt: number;
  condition?: string;
  afterRepairValue?: number;
  renovationCosts?: number;
  longTermAssumptions?: {
    projectionYears: number;
    annualRentIncrease: number;
    annualPropertyValueIncrease: number;
    inflationRate: number;
    vacancyRate: number;
    sellingCostsPercentage: number;
    turnoverFrequency?: number;
  };
}
```

### Long Term Assumptions
```typescript
interface LongTermAssumptions {
  annualRentIncrease: number;
  annualExpenseIncrease: number;
  annualPropertyValueIncrease: number;
  vacancyRate: number;
  sellingCosts: number;
  projectionYears: number;
}
```

## Calculations

### Monthly Calculations

1. **Monthly Mortgage Payment**
   ```javascript
   const monthlyPayment = (principal, annualRate, years) => {
     const monthlyRate = annualRate / 12 / 100;
     const numPayments = years * 12;
     return (principal * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
            (Math.pow(1 + monthlyRate, numPayments) - 1);
   };
   ```

2. **Monthly Operating Expenses**
   ```javascript
   const monthlyOperatingExpenses = 
     propertyTax + 
     insurance + 
     maintenance + 
     propertyManagement + 
     vacancy;
   ```

3. **Monthly Cash Flow**
   ```javascript
   const monthlyCashFlow = effectiveGrossIncome - operatingExpenses - mortgagePayment;
   ```

### Annual Calculations

1. **Cap Rate**
   ```javascript
   const capRate = (annualNOI, purchasePrice) => {
     return (annualNOI / purchasePrice) * 100;
   };
   ```

2. **Cash on Cash Return**
   ```javascript
   const cashOnCash = (annualCashFlow, totalInvestment) => {
     return (annualCashFlow / totalInvestment) * 100;
   };
   ```

3. **DSCR (Debt Service Coverage Ratio)**
   ```javascript
   const dscr = (annualNOI, annualDebtService) => {
     return annualNOI / annualDebtService;
   };
   ```

4. **Return on Improvements**
   ```javascript
   const returnOnImprovements = (noiWithImprovements, noiWithoutImprovements, capitalInvestments) => {
     // If we have before/after NOI data
     if (noiWithoutImprovements > 0) {
       return ((noiWithImprovements - noiWithoutImprovements) / capitalInvestments) * 100;
     }
     // Otherwise use estimated 8% return
     return 8.0;
   };
   ```

5. **Turnover Cost Impact**
   ```javascript
   const turnoverCostImpact = (annualTurnoverCosts, grossIncome) => {
     return (annualTurnoverCosts / grossIncome) * 100;
   };
   ```

### Long-term Calculations

1. **Property Value Growth**
   ```javascript
   const propertyValueInYear = (initialValue, appreciationRate, year) => {
     return initialValue * Math.pow(1 + appreciationRate / 100, year - 1);
   };
   ```

2. **Rent Growth**
   ```javascript
   const rentInYear = (initialRent, rentGrowthRate, year) => {
     return initialRent * Math.pow(1 + rentGrowthRate / 100, year - 1);
   };
   ```

3. **Expense Growth**
   ```javascript
   const expenseInYear = (initialExpense, expenseGrowthRate, year) => {
     return initialExpense * Math.pow(1 + expenseGrowthRate / 100, year - 1);
   };
   ```

4. **Mortgage Balance**
   ```javascript
   const mortgageBalanceAfterYears = (principal, annualRate, termYears, yearsElapsed) => {
     const monthlyRate = annualRate / 12 / 100;
     const totalPayments = termYears * 12;
     const paymentsMade = yearsElapsed * 12;
     const monthlyPayment = calculateMonthlyMortgage(principal, annualRate, termYears);
     
     return principal * Math.pow(1 + monthlyRate, paymentsMade) -
            (monthlyPayment / monthlyRate) * (Math.pow(1 + monthlyRate, paymentsMade) - 1);
   };
   ```

5. **Internal Rate of Return (IRR)**
   ```javascript
   const calculateIRR = (cashFlows, iterations = 1000, guess = 0.1) => {
     // Implementation of Newton-Raphson method for IRR approximation
   };
   ```

## Investment Decision Engine API Details (NEW)

### Confidence Score Calculation

The Investment Decision Engine calculates confidence scores using a multi-factor algorithm:

```javascript
const calculateConfidence = (baseScore, adjustments) => {
  let confidence = baseScore;
  
  // Apply all adjustments cumulatively
  adjustments.forEach(adjustment => {
    confidence += adjustment;
  });
  
  // Enforce bounds: 30% minimum, 95% maximum
  return Math.max(30, Math.min(95, Math.round(confidence)));
};
```

### Walk-Away Price Calculation

The system calculates maximum acceptable price using three methods:

```javascript
const calculateWalkAwayPrice = (noi, treasuryRate, comparableAverage, monthlyRent) => {
  const treasuryMethod = noi / (treasuryRate + 0.03);
  const comparableMethod = comparableAverage * 0.95;
  const incomeMethod = monthlyRent * 100;
  
  return Math.min(treasuryMethod, comparableMethod, incomeMethod);
};
```

### Market-Relative Analysis

```javascript
const analyzeMarketPosition = (propertyCapRate, marketMedianCapRate) => {
  const difference = propertyCapRate - marketMedianCapRate;
  
  if (difference <= -0.015) return 'PASS'; // >1.5% below median
  if (difference <= -0.005) return 'NEGOTIATE'; // 0.5-1.5% below
  return 'BUY_CONSIDERATION'; // At or above median
};
```

## Error Handling & Validation

### Standard Error Response Format

All endpoints return standardized error responses:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Purchase price must be a positive number",
    "field": "purchasePrice",
    "details": {
      "received": -100000,
      "expected": "number > 0"
    }
  },
  "timestamp": "2025-08-08T21:15:30.000Z"
}
```

### Common Error Codes

| Code | HTTP Status | Description | Resolution |
|------|-------------|-------------|------------|
| `VALIDATION_ERROR` | 400 | Invalid input data | Check request body against schema |
| `MISSING_REQUIRED_FIELD` | 400 | Required field missing | Include all required fields |
| `INVESTMENT_ENGINE_ERROR` | 500 | Decision engine failure | Retry with valid data |
| `AI_SERVICE_TIMEOUT` | 503 | AI service unavailable | Retry request |
| `MARKET_DATA_UNAVAILABLE` | 502 | External API failure | Market data temporarily unavailable |
| `LEVERAGE_CALCULATION_ERROR` | 500 | Leverage analysis failure | Check property financials |

### Input Validation Rules

#### Property Data Validation
```typescript
interface PropertyValidation {
  purchasePrice: number; // > 0, < 50,000,000
  monthlyRent: number;   // > 0, < purchasePrice/12
  downPayment: number;   // > 0, <= purchasePrice * 0.5
  interestRate: number;  // 0.01 <= rate <= 0.20 (1-20%)
  propertyTaxRate: number; // 0 <= rate <= 0.05 (0-5%)
  squareFootage: number; // > 0, < 50,000
}
```

#### Exit Strategy Validation
```typescript
interface ExitStrategyValidation {
  primaryExitStrategy: 'sale' | 'refinance' | '1031exchange' | 'estate' | 'flexible';
  portfolioStrategy: 'first' | 'geographic' | 'cashflow' | 'appreciation' | 'diversification';
  marketTimingFlexibility: 'flexible' | 'somewhat' | 'constrained' | 'independent';
}
```

### Performance Guidelines

#### Response Time Targets
- **Quick Predictions**: < 4 seconds (average 3.2s)
- **Full Analysis**: < 15 seconds (average 8-12s)
- **Interactive Updates**: < 200ms

#### Rate Limiting
- **Authenticated Users**: 100 requests/hour
- **Premium Users**: 500 requests/hour
- **Enterprise Users**: Unlimited

### API Versioning

Current API version: `v1`

All endpoints support versioning via header:
```
Accept: application/json; version=1
```

Future breaking changes will increment version numbers and maintain backward compatibility for 6 months.

### Authentication Requirements

#### Protected Endpoints
- All `/api/deals/*` endpoints require authentication
- `/api/scenarios/*` endpoints require authentication
- Public endpoints: health checks and API documentation

#### Required Headers
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
Accept: application/json
```

### Caching Strategy

#### Client-Side Caching
- Market data: Cache for 30 minutes
- Analysis results: No caching (always fresh)
- User preferences: Cache indefinitely until changed

#### Server-Side Caching
- RentCast API data: 30 days
- FRED economic data: 1 day
- Market intelligence: Tied to underlying data cache

This comprehensive API documentation ensures developers can successfully integrate with the Real Estate Investment Intelligence Platform's enhanced capabilities. 