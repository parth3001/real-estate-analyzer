# SEO Foundation Plan

**Strategy:** Build 3 high-impact calculators that rank passively while you focus on B2B validation

**Timeline:** Week 1-3 (9 hours total build) → 6-12 months to rank → Passive traffic forever

**Last Updated:** January 29, 2026

---

## 🎯 The SEO Strategy

### Why Calculators (Not Blog Posts)?

**Calculators:**
- ✅ 9 hours to build (3 calculators)
- ✅ Evergreen (rank for years)
- ✅ High user intent (people ready to analyze)
- ✅ Natural backlinks (educators link to free tools)
- ✅ Set it and forget it (passive compounding)

**Blog Posts:**
- ❌ 200+ hours to write 50 posts
- ❌ Requires ongoing content creation
- ❌ Lower user intent (informational, not transactional)
- ❌ Harder to get backlinks
- ❌ Constant maintenance

**ROI Comparison:**
- Calculators: 9 hours → $75-255 MRR by Month 12 = **$8-28/hour**
- Blog posts: 200 hours → $500-1,500 MRR by Month 12 = **$2.50-7.50/hour**

**Calculators are 3-4x more time-efficient.**

---

## 📊 Target Keywords & Search Volume

| Calculator | Primary Keyword | Monthly Searches | Competition | Priority |
|-----------|----------------|------------------|-------------|----------|
| Rental Property Calculator | "rental property calculator" | 9,900 | Medium | Week 1 |
| Cap Rate Calculator | "cap rate calculator" | 8,100 | Low-Medium | Week 2 |
| Cash-on-Cash Calculator | "cash on cash return calculator" | 4,400 | Low | Week 3 |
| **TOTAL** | - | **22,400** | - | - |

---

## 🛠️ Calculator 1: Rental Property Calculator

### Target Keyword Analysis
- **Primary:** "rental property calculator" (9,900 searches/month)
- **Secondary:** "rental property analysis calculator", "rental income calculator"
- **User intent:** Beginners analyzing first rental property
- **Competition:** Medium (BiggerPockets #1, but room for #3-5)

### Technical Spec

**Frontend Form (inputs):**
```typescript
interface RentalCalculatorInputs {
  // Purchase Details
  purchasePrice: number;
  downPaymentPercent: number;
  interestRate: number;
  loanTerm: number; // 15 or 30 years
  closingCosts: number; // % of purchase price

  // Income
  monthlyRent: number;
  otherMonthlyIncome: number; // parking, laundry, storage

  // Expenses
  propertyTaxAnnual: number;
  insuranceAnnual: number;
  hoaMonthly: number;
  maintenancePercent: number; // % of monthly rent
  vacancyPercent: number; // % of monthly rent
  propertyManagementPercent: number; // % of monthly rent
  utilitiesMonthly: number;
}
```

**Output Display:**
```typescript
interface RentalCalculatorOutputs {
  // Primary Metrics (above fold)
  monthlyCashFlow: number; // GREEN if positive, RED if negative
  capRate: number;
  cashOnCashReturn: number;

  // Secondary Metrics (below fold)
  totalCashNeeded: number;
  monthlyMortgagePayment: number;
  monthlyOperatingExpenses: number;
  noi: number; // Net Operating Income

  // Investment Quality
  verdict: "Good Deal" | "Fair Deal" | "Poor Deal"; // based on cash flow + cap rate
}
```

**Page Structure:**
```
URL: /calculators/rental-property-calculator

Layout:
- H1: "Free Rental Property Calculator"
- Subheading: "Analyze cash flow, cap rate, and ROI in 60 seconds"
- Calculator form (left side on desktop, full width mobile)
- Results display (right side, live updates as you type)
- CTA: "Want detailed analysis with Investment Decision Engine? Sign up free"
- FAQ section (below calculator)
- Educational content: "How to use this calculator"
```

**SEO Optimization:**
```html
<title>Free Rental Property Calculator | Analyze Cash Flow & ROI in 60 Seconds</title>
<meta name="description" content="Free rental property calculator with instant cash flow, cap rate, and ROI analysis. No signup required. Institutional-grade calculations for real estate investors.">

<h1>Rental Property Calculator</h1>
<h2>Calculate Cash Flow, Cap Rate, and Return on Investment</h2>

<!-- Schema Markup -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "Rental Property Calculator",
  "applicationCategory": "FinanceApplication",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  }
}
</script>

<!-- FAQ Schema -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "How do I calculate rental property cash flow?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Monthly cash flow = Monthly rent - (Mortgage + Property tax + Insurance + HOA + Maintenance + Vacancy + Property management)"
      }
    }
  ]
}
</script>
```

**FAQ Section (SEO + User Value):**
- How do I calculate rental property cash flow?
- What is a good cap rate for rental property?
- What is cash-on-cash return?
- How much cash do I need to buy a rental property?
- What expenses should I include in rental property analysis?

**Time to Build:** 4 hours
- Frontend form: 1.5 hours (reuse existing components)
- Calculation logic: 1 hour (reuse existing financial calculations)
- SEO optimization: 1 hour (meta tags, schema, FAQ)
- Testing: 30 minutes

---

## 🛠️ Calculator 2: Cap Rate Calculator

### Target Keyword Analysis
- **Primary:** "cap rate calculator" (8,100 searches/month)
- **Secondary:** "capitalization rate calculator", "real estate cap rate calculator"
- **User intent:** Investors comparing deals, quick cap rate check
- **Competition:** Low-Medium (easier to rank than rental calculator)

### Technical Spec

**Frontend Form (ultra-simple):**
```typescript
interface CapRateInputs {
  annualRentalIncome: number;
  annualOperatingExpenses: number;
  purchasePrice: number;
}
```

**Output Display:**
```typescript
interface CapRateOutputs {
  capRate: number;
  noi: number;
  benchmark: "Excellent" | "Good" | "Fair" | "Poor";
  marketAverage: number; // based on property type
}
```

**Page Structure:**
```
URL: /calculators/cap-rate-calculator

Layout:
- H1: "Cap Rate Calculator"
- Subheading: "Calculate capitalization rate instantly"
- Ultra-simple form (3 inputs only)
- Large cap rate output display
- Benchmark comparison: "6.5% cap rate is Good for residential rental"
- Chart: Cap rate by property type (SFR 5-7%, MF 4-6%, etc.)
- CTA: "Want detailed property analysis? Free beta"
- FAQ section
```

**SEO Optimization:**
```html
<title>Cap Rate Calculator | Free Capitalization Rate Calculator for Real Estate</title>
<meta name="description" content="Free cap rate calculator. Calculate capitalization rate, compare benchmarks, understand if your deal is good. Instant results.">

<h1>Cap Rate Calculator</h1>
<h2>Calculate Capitalization Rate for Real Estate Investments</h2>
```

**FAQ Section:**
- What is cap rate in real estate?
- How do you calculate cap rate?
- What is a good cap rate for rental property?
- Cap rate vs cash-on-cash return - what's the difference?
- How to use cap rate to compare properties?

**Time to Build:** 3 hours
- Frontend form: 1 hour (very simple, 3 inputs)
- Calculation logic: 30 minutes (cap rate = NOI / Purchase Price × 100)
- SEO optimization: 1 hour
- Testing: 30 minutes

---

## 🛠️ Calculator 3: Cash-on-Cash Return Calculator

### Target Keyword Analysis
- **Primary:** "cash on cash return calculator" (4,400 searches/month)
- **Secondary:** "cash on cash calculator", "real estate cash on cash return"
- **User intent:** Investors measuring ROI on invested capital
- **Competition:** Low (very few dedicated calculators)

### Technical Spec

**Frontend Form (simplest):**
```typescript
interface CashOnCashInputs {
  annualCashFlow: number; // before tax
  totalCashInvested: number; // down payment + closing + repairs
}
```

**Output Display:**
```typescript
interface CashOnCashOutputs {
  cashOnCashReturn: number;
  benchmark: "Excellent (15%+)" | "Good (10-15%)" | "Fair (5-10%)" | "Poor (<5%)";
  comparisonMetrics: {
    vsCapRate?: string;
    vsIRR?: string;
  };
}
```

**Page Structure:**
```
URL: /calculators/cash-on-cash-return-calculator

Layout:
- H1: "Cash-on-Cash Return Calculator"
- Subheading: "Calculate your real estate ROI"
- Simplest form (2 inputs only)
- Large CoC percentage output
- Benchmark: "15%+ cash-on-cash return is Excellent"
- Comparison chart: CoC vs other metrics
- CTA: "Calculate all investment metrics - Free beta"
- FAQ section
```

**SEO Optimization:**
```html
<title>Cash-on-Cash Return Calculator | Real Estate ROI Calculator</title>
<meta name="description" content="Free cash-on-cash return calculator for rental properties. Calculate ROI on your invested capital. Includes benchmarks and comparisons.">

<h1>Cash-on-Cash Return Calculator</h1>
<h2>Calculate Real Estate Return on Investment</h2>
```

**FAQ Section:**
- What is cash-on-cash return?
- How do you calculate cash-on-cash return?
- What is a good cash-on-cash return for rental property?
- Cash-on-cash vs cap rate - what's the difference?
- How to improve cash-on-cash return?

**Time to Build:** 2 hours
- Frontend form: 30 minutes (only 2 inputs)
- Calculation logic: 15 minutes (CoC = Annual Cash Flow / Total Cash Invested × 100)
- SEO optimization: 45 minutes
- Testing: 30 minutes

---

## 📈 Expected SEO Performance Timeline

### Month 1-3 (Indexing Phase)
- Google discovers and indexes pages
- **Traffic:** 0-10 visitors/month
- **Rankings:** Not ranking yet (#100+)
- **Action:** Submit to Google Search Console, build internal links

### Month 4-6 (Early Movement)
- Pages start appearing in search results
- **Traffic:** 50-200 visitors/month total (all 3 calculators)
- **Rankings:** #30-50 for target keywords
- **Action:** Monitor progress, add FAQ content

### Month 7-9 (Acceleration)
- Rankings improve as Google validates quality
- **Traffic:** 300-800 visitors/month
- **Rankings:** #15-30 for target keywords
- **Action:** Optimize underperforming pages

### Month 10-12 (Harvest Phase)
- Calculators ranking on first page
- **Traffic:** 800-2,000 visitors/month
- **Rankings:** #8-15 for target keywords
- **Conversions:** 10-15% signup rate → 80-300 free signups/month

### Month 12+ (Compounding)
- Established authority, stable rankings
- **Traffic:** 1,500-3,800 visitors/month (conservative)
- **Rankings:** #5-10 for target keywords
- **Conversions:** 150-570 signups/month → 5-17 paid users @ $14.99 = **$75-255 MRR**

---

## 🎬 YouTube Content Integration

### Cross-Promotion Strategy

**Calculator Pages → YouTube:**
- Embed relevant YouTube videos on calculator pages
- "Watch: How to analyze rental properties (video tutorial)"
- Increases time on page (SEO ranking factor)

**YouTube Videos → Calculators:**
- Every video description includes calculator links
- "Free calculator: reanalyzr.com/calculators/rental-property-calculator"
- Drives traffic from YouTube to website

**YouTube Shorts → Awareness:**
- 15-60 second tips using calculators
- "Quick tip: Use our free cap rate calculator to compare deals"
- Call-to-action: "Link in bio"

### Video Content Ideas (Aligned with Calculators)

**Rental Property Calculator Videos:**
- "How to Analyze a Rental Property in 5 Minutes"
- "Rental Property Calculator Tutorial (Free Tool)"
- "Cash Flow Analysis for Beginners"

**Cap Rate Calculator Videos:**
- "What is Cap Rate and Why It Matters"
- "How to Calculate Cap Rate (Free Calculator)"
- "Cap Rate vs Cash-on-Cash Return Explained"

**Cash-on-Cash Calculator Videos:**
- "Measure Your Real Estate ROI (Cash-on-Cash Return)"
- "Free Cash-on-Cash Return Calculator Tutorial"
- "Is 10% Cash-on-Cash Return Good?"

### SEO Benefit of YouTube
- YouTube videos rank in Google search results
- Dual presence: Website calculator + YouTube video
- More "real estate" in search results
- Brand awareness compounds

---

## 📊 Google Search Console Tracking Plan

### Metrics to Monitor (Monthly)

**Impressions:**
- How many times your pages appear in search results
- Target Month 3: 1,000-5,000 impressions/month
- Target Month 6: 5,000-15,000 impressions/month
- Target Month 12: 20,000-50,000 impressions/month

**Clicks:**
- How many people click from search results to your site
- Target Month 3: 10-50 clicks/month
- Target Month 6: 100-300 clicks/month
- Target Month 12: 800-2,000 clicks/month

**Average Position:**
- Where you rank for target keywords
- Target Month 3: #50-100 (early indexing)
- Target Month 6: #20-40 (climbing)
- Target Month 12: #8-15 (first page)

**CTR (Click-Through Rate):**
- Impressions → Clicks conversion rate
- Target: 5-10% (industry average for calculators)
- Optimize if below 3% (improve title tags, meta descriptions)

### Keywords to Track

**Primary:**
- rental property calculator
- cap rate calculator
- cash on cash return calculator

**Secondary:**
- rental property analysis calculator
- capitalization rate calculator
- real estate cash on cash calculator
- rental income calculator
- investment property calculator

### Monthly Review Checklist

**Every month, check:**
- [ ] Total impressions (trending up?)
- [ ] Total clicks (growing?)
- [ ] Average position (improving?)
- [ ] Top performing pages (which calculator ranks best?)
- [ ] Top queries (what keywords are working?)
- [ ] CTR by page (any optimization opportunities?)

**Action items based on data:**
- Low impressions → Improve keyword targeting, add FAQ content
- Low CTR → Improve title tags and meta descriptions
- Good impressions but low clicks → Optimize for featured snippets
- One calculator performing better → Double down, replicate strategy

---

## 🔗 Internal Linking Strategy

### Homepage → Calculators
```html
<section>
  <h2>Free Real Estate Calculators</h2>
  <a href="/calculators/rental-property-calculator">Rental Property Calculator</a>
  <a href="/calculators/cap-rate-calculator">Cap Rate Calculator</a>
  <a href="/calculators/cash-on-cash-return-calculator">Cash-on-Cash Return Calculator</a>
</section>
```

### Calculator → Calculator (Cross-Linking)
```html
<!-- On Rental Property Calculator page -->
<section>
  <h3>Related Calculators</h3>
  <p>Also try our <a href="/calculators/cap-rate-calculator">Cap Rate Calculator</a>
  and <a href="/calculators/cash-on-cash-return-calculator">Cash-on-Cash Return Calculator</a>.</p>
</section>
```

### Calculator → Full Analysis (Conversion)
```html
<div class="cta">
  <h3>Want Detailed Analysis?</h3>
  <p>This calculator gives you basic metrics. For institutional-grade analysis
  with Investment Decision Engine (BUY/NEGOTIATE/PASS verdicts), try our full platform.</p>
  <a href="/sfr-analysis" class="button">Analyze Full Deal - Free Beta</a>
</div>
```

---

## 📋 Week 1-3 Build Checklist

### Week 1: Rental Property Calculator
- [ ] Create `/calculators/rental-property-calculator` page
- [ ] Build frontend form (11 inputs)
- [ ] Implement calculation logic (cash flow, cap rate, CoC)
- [ ] Add results display (live updates)
- [ ] SEO optimization (title, meta, H1-H2, schema markup)
- [ ] Add FAQ section (5 questions)
- [ ] Test on mobile
- [ ] Submit to Google Search Console

### Week 2: Cap Rate Calculator
- [ ] Create `/calculators/cap-rate-calculator` page
- [ ] Build frontend form (3 inputs)
- [ ] Implement cap rate calculation
- [ ] Add benchmark comparison
- [ ] SEO optimization
- [ ] Add FAQ section
- [ ] Test on mobile
- [ ] Internal linking setup

### Week 3: Cash-on-Cash Calculator
- [ ] Create `/calculators/cash-on-cash-return-calculator` page
- [ ] Build frontend form (2 inputs)
- [ ] Implement CoC calculation
- [ ] Add benchmark display
- [ ] SEO optimization
- [ ] Add FAQ section
- [ ] Test on mobile
- [ ] Cross-link all 3 calculators

### Week 3: Final Setup
- [ ] Submit all pages to Google Search Console
- [ ] Verify sitemap includes calculator pages
- [ ] Add calculators to homepage navigation
- [ ] YouTube video descriptions updated with calculator links
- [ ] Google Analytics tracking verified

---

## 🎯 Success Metrics

### Month 3 Success
- ✅ All 3 calculators live and indexed
- ✅ Google Search Console tracking active
- ✅ 100-500 total impressions/month
- ✅ 5-20 clicks/month (early signal)

### Month 6 Success
- ✅ 5,000-15,000 impressions/month
- ✅ 100-300 clicks/month
- ✅ Rankings #20-40 for target keywords
- ✅ 10-30 free signups/month from calculators

### Month 12 Success
- ✅ 20,000-50,000 impressions/month
- ✅ 800-2,000 clicks/month
- ✅ Rankings #5-10 for target keywords
- ✅ 80-300 free signups/month
- ✅ **5-17 paid users @ $14.99/month = $75-255 MRR passive**

---

**This SEO foundation runs passively while you focus on B2B validation. Set it and forget it for 6-12 months.**

---

**Document Version:** 1.0
**Last Updated:** January 29, 2026
**Owner:** Parth Patel
