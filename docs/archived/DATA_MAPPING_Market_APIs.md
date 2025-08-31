# Market Data API - Complete Data Mapping Document

## 🔄 **Data Flow Overview**

```
External APIs → Backend Services → Database → Backend API → Frontend → UI Components
```

---

## 📊 **Layer 1: External API → Backend Service Mapping**

### **RentCast API Response → Internal Format**

#### **1.1 Property Rent Estimate**
```typescript
// RentCast API Response
{
  "address": "123 Main St, Austin, TX 78701",
  "rentEstimate": 2500,
  "rentEstimateRange": {
    "min": 2200,
    "max": 2800
  },
  "confidence": 85,
  "bedrooms": 3,
  "bathrooms": 2,
  "squareFootage": 1500,
  "propertyType": "Single Family",
  "lastUpdated": "2025-01-06T12:00:00Z"
}

// Mapped to Internal PropertyMarketData
{
  rentEstimate: 2500,
  rentRange: {
    low: 2200,    // renamed from 'min'
    high: 2800    // renamed from 'max'
  },
  marketPosition: 'At Market',  // calculated based on comparison
  confidence: 85,
  pricePerSqft: 1.67,  // calculated: 2500/1500
  lastUpdated: new Date("2025-01-06T12:00:00Z"),
  dataSource: 'RentCast'
}
```

#### **1.2 Comparable Properties**
```typescript
// RentCast Comparables Response
{
  "comparables": [{
    "address": "456 Oak St",
    "latitude": 30.2672,
    "longitude": -97.7431,
    "distance": 0.25,
    "lastSalePrice": 475000,
    "lastSaleDate": "2024-11-15",
    "squareFootage": 1600,
    "bedrooms": 3,
    "bathrooms": 2,
    "yearBuilt": 2018,
    "daysOnMarket": 45,
    "propertyType": "Single Family"
  }]
}

// Mapped to Internal ComparableProperty[]
[{
  address: "456 Oak St",
  distance: 0.25,
  salePrice: 475000,
  saleDate: new Date("2024-11-15"),
  pricePerSqft: 296.88,  // calculated: 475000/1600
  bedrooms: 3,
  bathrooms: 2,
  sqft: 1600,
  daysOnMarket: 45,
  propertyType: "Single Family",
  rentEstimate: undefined,  // optional field
  latitude: 30.2672,
  longitude: -97.7431,
  yearBuilt: 2018,
  lotSize: undefined
}]
```

#### **1.3 Market Trends**
```typescript
// RentCast Market Data Response
{
  "zipCode": "78701",
  "city": "Austin",
  "state": "TX",
  "rentData": {
    "medianRent": 2400,
    "averageRent": 2550,
    "rentGrowthRate": 5.2,
    "sampleSize": 150
  },
  "salesData": {
    "medianSalePrice": 525000,
    "averageSalePrice": 575000,
    "priceGrowthRate": 8.5,
    "averageDaysOnMarket": 35,
    "sampleSize": 85
  }
}

// Mapped to Internal MarketTrendData
{
  zipCode: "78701",
  city: "Austin",
  state: "TX",
  medianRent: 2400,
  averageRent: 2550,
  rentGrowthRate: 5.2,
  medianSalePrice: 525000,
  averageSalePrice: 575000,
  priceGrowthRate: 8.5,
  daysOnMarket: 35,
  inventoryLevel: 'Low',  // calculated: DOM < 30 = Low, 30-90 = Normal, >90 = High
  priceToRentRatio: 18.23,  // calculated: 525000/(2400*12)
  seasonalTrend: 'Spring Market - Increasing Activity',  // based on current month
  sampleSize: {
    rentals: 150,
    sales: 85
  },
  lastUpdated: new Date(),
  dataSource: 'RentCast'
}
```

### **FRED API Response → Internal Format**

#### **1.4 Economic Indicators**
```typescript
// Multiple FRED API Responses (combined)
{
  // Mortgage Rate Response
  "observations": [{
    "date": "2025-01-02",
    "value": "7.25"
  }]
}

// Mapped to Internal EconomicData
{
  currentMortgageRate: 7.25,
  mortgageRateTrend: 'Rising',  // calculated from historical data
  mortgageRateChange: 0.15,     // calculated: current - previous
  inflationRate: 3.2,            // from CPI series
  unemploymentRate: 4.1,         // from UNRATE series
  housingIndex: 315.5,           // from Case-Shiller
  housingIndexChange: 5.8,       // YoY percentage change
  economicGrowth: 2.3,           // GDP growth rate
  federalFundsRate: 5.5,         // from FEDFUNDS
  lastUpdated: new Date(),
  dataSource: 'FRED'
}
```

---

## 💾 **Layer 2: Backend Service → Database Schema Mapping**

### **2.1 Analysis Document Structure**
```typescript
// MongoDB Document Structure
{
  _id: ObjectId("..."),
  propertyType: "SFR",
  // ... other existing fields ...
  
  analysis: {
    // ... existing analysis fields ...
    
    // NEW: Market Data Fields
    marketData: {
      property: {
        rentEstimate: 2500,
        rentRange: {
          low: 2200,
          high: 2800
        },
        valueEstimate: null,  // optional
        valueRange: {
          low: null,
          high: null
        },
        capRateEstimate: 5.7,
        marketPosition: "At Market",
        confidence: 85,
        pricePerSqft: 1.67,
        lastUpdated: ISODate("2025-01-06T12:00:00Z"),
        dataSource: "RentCast"
      },
      
      comparables: [{
        address: "456 Oak St",
        distance: 0.25,
        salePrice: 475000,
        saleDate: ISODate("2024-11-15"),
        pricePerSqft: 296.88,
        bedrooms: 3,
        bathrooms: 2,
        sqft: 1600,
        daysOnMarket: 45,
        propertyType: "Single Family",
        rentEstimate: null,
        latitude: 30.2672,
        longitude: -97.7431,
        yearBuilt: 2018,
        lotSize: null
      }],
      
      marketTrends: {
        zipCode: "78701",
        city: "Austin",
        state: "TX",
        medianRent: 2400,
        averageRent: 2550,
        rentGrowthRate: 5.2,
        medianSalePrice: 525000,
        averageSalePrice: 575000,
        priceGrowthRate: 8.5,
        daysOnMarket: 35,
        inventoryLevel: "Low",
        priceToRentRatio: 18.23,
        seasonalTrend: "Spring Market - Increasing Activity",
        sampleSize: {
          rentals: 150,
          sales: 85
        },
        lastUpdated: ISODate("2025-01-06T12:00:00Z"),
        dataSource: "RentCast"
      },
      
      economicIndicators: {
        currentMortgageRate: 7.25,
        mortgageRateTrend: "Rising",
        mortgageRateChange: 0.15,
        inflationRate: 3.2,
        unemploymentRate: 4.1,
        housingIndex: 315.5,
        housingIndexChange: 5.8,
        economicGrowth: 2.3,
        federalFundsRate: 5.5,
        lastUpdated: ISODate("2025-01-06T12:00:00Z"),
        dataSource: "FRED"
      },
      
      lastUpdated: ISODate("2025-01-06T12:00:00Z"),
      dataSource: ["RentCast", "FRED"]
    },
    
    marketInsights: [{
      category: "Market Position",
      insight: "Property rent is aligned with market median ($2,400), indicating fair market positioning.",
      impact: "Neutral",
      confidence: 85,
      dataSource: "RentCast",
      metrics: {
        propertyRent: 2500,
        marketMedian: 2400,
        differencePercent: 4.17
      },
      recommendation: null
    }],
    
    investmentTiming: {
      recommendation: "Buy",
      confidence: 75,
      reasoning: [
        "Strong rental market with 5.2% annual growth",
        "Property priced fairly compared to recent sales",
        "Rising mortgage rates suggest acting sooner"
      ],
      marketCycle: "Expansion",
      timingScore: 72,
      riskFactors: [
        "High mortgage rates at 7.25%",
        "Rapid price appreciation may slow"
      ],
      opportunities: [
        "Strong rent growth supports cash flow",
        "Limited inventory supports appreciation"
      ],
      marketSignals: {
        interestRateSignal: -0.4,
        inflationSignal: -0.1,
        housingSupplySignal: 0.6,
        economicGrowthSignal: 0.3,
        overallSignal: 0.35
      },
      nextReviewDate: ISODate("2025-04-06T12:00:00Z")
    }
  }
}
```

---

## 🔌 **Layer 3: Database → Backend API Response Mapping**

### **3.1 Analysis API Response**
```typescript
// GET /api/analyze/sfr Response
{
  "propertyData": { /* original input */ },
  "analysis": {
    "monthlyAnalysis": { /* existing */ },
    "annualAnalysis": { /* existing */ },
    "keyMetrics": { /* existing */ },
    "longTermAnalysis": { /* existing */ },
    "aiInsights": { /* existing */ },
    
    // NEW: Market Intelligence Fields
    "marketData": {
      "property": { /* from DB */ },
      "comparables": [ /* from DB */ ],
      "marketTrends": { /* from DB */ },
      "economicIndicators": { /* from DB */ },
      "location": {
        "address": "123 Main St, Austin, TX 78701",
        "zipCode": "78701",
        "city": "Austin",
        "state": "TX"
      },
      "lastUpdated": "2025-01-06T12:00:00Z",
      "dataSource": ["RentCast", "FRED"]
    },
    
    "marketInsights": [ /* from DB */ ],
    
    "investmentTiming": { /* from DB */ }
  }
}
```

---

## 🎨 **Layer 4: Frontend API → State Management**

### **4.1 Frontend Type Definitions**
```typescript
// frontend/src/types/analysis.ts
export interface AnalysisResult {
  // ... existing fields ...
  marketData?: MarketDataResponse;
  marketInsights?: MarketInsight[];
  investmentTiming?: InvestmentTimingAnalysis;
}

// frontend/src/types/marketData.ts (new file)
export interface MarketDataResponse {
  property: PropertyMarketData;
  comparables: ComparableProperty[];
  marketTrends: MarketTrendData;
  economicIndicators: EconomicData;
  location: LocationData;
  lastUpdated: string;  // Note: string in frontend, Date in backend
  dataSource: string[];
}
```

### **4.2 Redux/State Structure**
```typescript
// If using Redux or Context
interface AnalysisState {
  currentAnalysis: {
    // ... existing fields ...
    marketData: MarketDataResponse | null;
    marketInsights: MarketInsight[] | null;
    investmentTiming: InvestmentTimingAnalysis | null;
  };
  marketDataLoading: boolean;
  marketDataError: string | null;
}
```

---

## 🖼️ **Layer 5: State → UI Component Props**

### **5.1 Component Props Mapping**
```typescript
// MarketIntelligenceSection.tsx
interface MarketIntelligenceSectionProps {
  marketData: MarketDataResponse;
  marketInsights: MarketInsight[];
  investmentTiming: InvestmentTimingAnalysis;
}

// Usage in AnalysisResults.tsx
<MarketIntelligenceSection
  marketData={analysis.marketData}
  marketInsights={analysis.marketInsights}
  investmentTiming={analysis.investmentTiming}
/>
```

### **5.2 Display Transformations**
```typescript
// Format for display
const formatters = {
  currency: (value: number) => new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(value),
  
  percentage: (value: number) => `${value.toFixed(1)}%`,
  
  date: (value: string) => new Date(value).toLocaleDateString(),
  
  distance: (miles: number) => `${miles.toFixed(1)} mi`
};

// Component display example
<Typography variant="h6">
  Median Rent: {formatters.currency(marketData.marketTrends.medianRent)}
</Typography>
<Typography variant="body2">
  Growth Rate: {formatters.percentage(marketData.marketTrends.rentGrowthRate)}
</Typography>
```

---

## 🔐 **Data Validation & Error Handling**

### **Validation at Each Layer**

1. **API Response Validation**
```typescript
// Validate RentCast response
if (!response.data || typeof response.data.rentEstimate !== 'number') {
  throw new Error('Invalid RentCast response');
}
```

2. **Database Validation**
```typescript
// Mongoose schema validation
marketData: {
  type: {
    property: {
      rentEstimate: { type: Number, required: true, min: 0 },
      confidence: { type: Number, required: true, min: 0, max: 100 }
    }
  },
  required: false  // Market data is optional
}
```

3. **Frontend Validation**
```typescript
// Component guards
if (!marketData || !marketData.property) {
  return <NoMarketDataMessage />;
}
```

### **Error States**
```typescript
// Graceful degradation
const defaultMarketData: MarketDataResponse = {
  property: {
    rentEstimate: 0,
    rentRange: { low: 0, high: 0 },
    marketPosition: 'Unknown',
    confidence: 0,
    lastUpdated: new Date(),
    dataSource: 'None'
  },
  comparables: [],
  marketTrends: { /* defaults */ },
  economicIndicators: { /* defaults */ },
  location: { /* from input */ },
  lastUpdated: new Date().toISOString(),
  dataSource: []
};
```

---

## 📋 **Data Mapping Checklist**

- [ ] External API response parsing
- [ ] Internal type transformations
- [ ] Database schema alignment
- [ ] API response serialization
- [ ] Frontend type definitions
- [ ] Display formatting functions
- [ ] Error state handling
- [ ] Default/fallback values
- [ ] Validation at each layer
- [ ] Date/timezone handling

This complete data mapping ensures consistency across all layers of the application.