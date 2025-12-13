# 🚀 Feature Backlog

**Last Updated:** December 13, 2025
**Purpose:** Centralized tracking of future enhancements, feature requests, and strategic initiatives

---

## 📋 **Backlog Management**

**Priority Levels:**
- **P0 (Critical)**: Must have for core functionality - immediate implementation
- **P1 (High)**: Important features that significantly enhance user value - next sprint
- **P2 (Medium)**: Valuable enhancements - implement when capacity allows
- **P3 (Low)**: Nice-to-have features - implement during downtime/polish phase

**Status Indicators:**
- 🔴 Not Started
- 🟡 In Planning/Design
- 🟢 Ready for Implementation
- ✅ Complete

---

## 🎯 **P1 - High Priority Features**

### Feature #1: BRRRR & House Hacking Investment Decision Engines
**Status:** 🔴 Not Started
**Priority:** P1 - High (as of 12/13/2025)
**Added:** December 13, 2025
**Category:** Investment Analysis / Strategy Support

**Description:**
Extend the current Investment Decision Engine (v2.1) to support BRRRR (Buy, Rehab, Rent, Refinance, Repeat) and House Hacking investment strategies with specialized scoring, verdicts, and recommendations.

**Business Value:**
- **Target Users:** Intermediate to advanced investors (30% of user base)
- **Revenue Impact:** Expected to increase Professional tier conversion by 15%
- **Competitive Advantage:** First mover in strategy-specific AI decision engines
- **User Pain Point:** Current system optimized for Buy & Hold only, doesn't account for BRRRR refinance timing or house hacking owner-occupancy benefits

**Functional Requirements:**
1. **BRRRR Strategy Engine:**
   - Rehab cost estimation and ARV (After Repair Value) calculation
   - Refinance timing optimization (when to pull cash out)
   - Cash-on-cash return after refinance
   - BRRRR cycle completion scoring (ability to repeat)
   - Construction timeline impact on vacancy
   - 70% ARV rule validation

2. **House Hacking Strategy Engine:**
   - Owner-occupied unit revenue calculation
   - FHA/Conventional loan down payment optimization (3.5% vs 20%)
   - Live-in vs rent-out unit comparison
   - Tax benefit calculation (primary residence exclusions)
   - Utility cost sharing logic
   - House hacking "live for free" metric

3. **Strategy Selection UX:**
   - Strategy wizard step already exists (Step 0)
   - Conditional field display based on strategy
   - Strategy-specific help text and tooltips
   - Example properties for each strategy

**Technical Requirements:**
- Extend `investmentDecisionEngine.ts` with strategy modules
- Add BRRRR-specific calculations to `SFRAnalyzer.ts`
- Create house hacking utility cost sharing logic
- Update wizard validation for strategy-specific fields
- Add strategy-based AI messaging in `aiEnhancedMessaging.ts`

**Testing Requirements:**
- 10+ realistic BRRRR scenarios (various rehab costs, ARVs)
- 10+ house hacking scenarios (duplex, triplex, quadplex)
- Cross-validate with BRRRR calculators (BiggerPockets, REIPro)
- Verify FHA loan calculations against HUD guidelines

**Estimated Effort:** 2-3 weeks (80-120 hours)

**Dependencies:**
- None (can build on existing Investment Decision Engine)

**Related Documentation:**
- `/docs/PHASE1_STRATEGY_DYNAMIC_WIZARD_PROPOSAL.md` (deferred proposal)
- `/backend/src/services/investment/investmentDecisionEngine.ts`

**Notes:**
- Strategy-dynamic wizard was proposed but simplified to 80/20 approach
- This would be Phase 2 of that original vision
- Josh Lupo partnership opportunity (BRRRR expertise)

---

### Feature #2: Metrics UX Optimization (Josh's Feedback)
**Status:** 🔴 Not Started
**Priority:** P1 - High (user experience critical)
**Added:** December 13, 2025
**Category:** User Experience / Interface Design

**Description:**
Improve the presentation and usability of financial metrics based on Josh Lupo's expert feedback and user testing insights.

**Business Value:**
- **User Pain Point:** Information overload, unclear metric hierarchy
- **Engagement Impact:** Better UX increases time on site by 25%+
- **Conversion Impact:** Clearer metrics improve upgrade intent
- **Professional Credibility:** Institutional-grade UX builds trust

**Functional Requirements:**
1. **Metric Prioritization:**
   - Tier 1 (Hero Metrics): Cash Flow, Cap Rate, Cash-on-Cash, Deal Quality
   - Tier 2 (Supporting): DSCR, IRR, Debt Yield, GRM
   - Tier 3 (Advanced): Break-Even Occupancy, Operating Expense Ratio, Turnover Impact
   - Progressive disclosure: Show Tier 1 immediately, Tier 2/3 on expand

2. **Visual Hierarchy:**
   - Larger cards for Tier 1 metrics
   - Color-coded performance indicators (green/yellow/red zones)
   - Trend arrows for projected changes
   - Comparative benchmarks ("Above Market Average")

3. **Contextual Help:**
   - Inline tooltips with plain-English explanations
   - "Good/Fair/Poor" range indicators for each metric
   - "Why This Matters" micro-content
   - Strategy-specific metric recommendations (BRRRR cares about ARV, House Hacking cares about owner-occupancy savings)

4. **Mobile Optimization:**
   - Vertical card stacking on mobile
   - Swipeable metric carousel option
   - Collapsible advanced metrics section
   - Touch-friendly info buttons

**Design Requirements:**
- Follow Apple Design System principles (Clarity, Deference, Simplicity)
- A/B test metric layouts with 5+ user testers
- Accessibility: WCAG 2.1 AA compliance for color contrast
- Performance: <100ms render time for all metric cards

**Technical Requirements:**
- Refactor `AnalysisResults.tsx` metric card grid
- Create reusable `MetricCard` component with tier system
- Implement progressive disclosure with smooth animations
- Add metric tooltip component library

**Testing Requirements:**
- User testing with 10+ investors (novice to expert)
- Mobile device testing (iOS Safari, Android Chrome)
- Accessibility audit (screen reader, keyboard navigation)
- Performance profiling (React DevTools Profiler)

**Estimated Effort:** 1-2 weeks (40-80 hours)

**Dependencies:**
- Josh Lupo UX feedback (pending consolidation)
- User testing recruitment

**Related Documentation:**
- `/docs/UX_SPECIFICATION_PHASE1_APPLE_DESIGN.md`
- `/frontend/src/components/SFRAnalysis/AnalysisResults.tsx`

**Notes:**
- Josh's feedback document needs to be consolidated into actionable specs
- Consider partnership with UX researcher for formal testing

---

### Feature #8: Saved Properties List UX Improvement
**Status:** 🔴 Not Started
**Priority:** P1 - High (as of 12/13/2025)
**Added:** December 13, 2025
**Category:** User Experience / Interface Design

**Description:**
Improve the saved properties list interface to make opening saved properties more accessible and intuitive. Current design has view button positioned too far right, creating poor UX and requiring excessive scrolling/scanning on all device sizes.

**Business Value:**
- **User Pain Point:** Critical friction in core workflow - users frequently access saved properties
- **Engagement Impact:** Poor UX discourages property comparison and portfolio tracking
- **Mobile Impact:** Far-right button placement especially problematic on mobile (52% of traffic)
- **Retention Risk:** Frustrating core interactions drive users to competitor tools

**Current State Issues:**
- View button positioned far right in list row
- Requires horizontal scanning to find action button
- Poor mobile experience (button off-screen on smaller devices)
- Inconsistent with card-based property input wizard UX
- Low information density in list view

**Functional Requirements:**
1. **Improved Button Placement:**
   - Move view button closer to property name/address
   - Consider icon button instead of text button (space efficiency)
   - Explore hover/click entire row to open (desktop)
   - Tap entire card to open (mobile)

2. **Layout Redesign Options:**
   - **Option A - Card Layout:** Property cards with prominent "View Analysis" button
   - **Option B - Compact List:** Thumbnail + name + key metric + inline action buttons
   - **Option C - Hybrid:** List on desktop, cards on mobile
   - **Option D - Action Menu:** Three-dot menu with view/edit/delete options

3. **Quick Actions:**
   - View (primary action)
   - Edit (rerun analysis with modifications)
   - Duplicate (analyze similar property)
   - Delete (with confirmation)
   - Share (if social sharing implemented)

4. **Enhanced Information Display:**
   - Property address + photo thumbnail
   - Last analyzed date
   - Deal Quality score badge (94/100 BUY)
   - Key metric preview (Cash Flow: $567/mo, Cap Rate: 9.5%)
   - Investment strategy indicator (Buy & Hold, BRRRR, House Hack)

5. **Sorting & Filtering:**
   - Sort by: Date analyzed, Deal Quality, Cash Flow, Cap Rate
   - Filter by: Strategy, Verdict (BUY/NEGOTIATE/PASS), Date range
   - Search by address

**Design Requirements (Apple Design System):**
- **Clarity:** Property name and action buttons immediately scannable
- **Deference:** Content (property data) more prominent than chrome (buttons)
- **Simplicity:** Remove unnecessary elements, focus on primary action (View)
- **Depth:** Use subtle shadows/elevation for card hierarchy
- **Accessibility:** Touch targets 44x44px minimum (iOS HIG)

**Technical Requirements:**
- Refactor saved properties list component
- Implement responsive layout (cards on mobile, list/cards on desktop)
- Add sorting and filtering logic
- Optimize for performance (virtualized list if 100+ properties)
- Add loading states and skeleton screens
- Implement swipe actions on mobile (swipe left = delete, swipe right = duplicate)

**UX Testing Requirements:**
- A/B test card vs list layout (5+ users)
- Mobile device testing (iOS Safari, Android Chrome)
- Desktop browser testing (Chrome, Safari, Firefox)
- Accessibility audit (keyboard navigation, screen reader)
- Click heatmap analysis to validate button placement

**Performance Requirements:**
- List render time: <200ms for 50 properties
- Smooth scrolling (60fps)
- Lazy loading for property thumbnails
- Virtualized list for 100+ properties

**Estimated Effort:** 1 week (40 hours)

**Dependencies:**
- None (standalone UX improvement)

**Related Files:**
- `/frontend/src/pages/SavedDeals.tsx` (main saved properties page)
- `/frontend/src/components/PropertyList.tsx` (if exists)
- `/frontend/src/components/PropertyCard.tsx` (if exists)

**Design Inspiration:**
- Zillow saved homes (card layout with clear actions)
- Redfin favorites (list layout with inline actions)
- Apple Mail (swipe actions on mobile)
- Google Keep (card-based list with quick actions)

**Notes:**
- This is a high-friction point in user workflow
- Quick win for user satisfaction (low effort, high impact)
- Mobile-first design critical (52% of traffic)
- Consider adding batch actions (compare 2-3 properties side-by-side)

---

## 🎯 **P2 - Medium Priority Features**

### Feature #3: Calculation Accuracy Transparency (Help & Documentation)
**Status:** 🔴 Not Started
**Priority:** P2 - Medium
**Added:** December 13, 2025
**Category:** Trust & Transparency / Education

**Description:**
Create comprehensive documentation explaining how the platform achieves institutional-grade accuracy in financial calculations, including formulas, validation methods, and industry standard compliance.

**Business Value:**
- **Trust Building:** Transparent methodology increases user confidence
- **Professional Credibility:** Appeals to CPAs, lenders, investors who verify calculations
- **Competitive Advantage:** Most competitors don't document their calculation methods
- **SEO Value:** Technical content attracts organic search traffic

**Functional Requirements:**
1. **Help & Documentation Section:**
   - "How We Calculate" main page
   - Individual metric explanations (one page per metric)
   - Formula documentation with examples
   - Industry standard references (Fannie Mae, Freddie Mac, NREIG)
   - Validation methodology (hand calculations, cross-checking)

2. **Accuracy Certification:**
   - Business Expert certification statement (from Issue #29 resolution)
   - Industry standard compliance matrix
   - Variance tolerance disclosure (<0.5%)
   - Third-party validation (if applicable)

3. **Educational Content:**
   - "Understanding Cap Rate" tutorials
   - "What is DSCR and Why It Matters" explainers
   - Video walkthrough of calculation methodology (optional)
   - FAQ section for common calculation questions

4. **Interactive Examples:**
   - Live calculator showing formula step-by-step
   - Sample property with full calculation breakdown
   - Comparison to industry calculators (BiggerPockets, Bankrate)

**Content Requirements:**
- 15-20 metric explanation pages
- 5-10 educational articles
- Video script (if video produced)
- FAQ database (20+ questions)

**Technical Requirements:**
- Create `/help-docs` route outside login wall
- Build documentation CMS or markdown-based system
- Add search functionality to help section
- Mobile-responsive documentation layout

**SEO Requirements:**
- Keyword research for calculation-related queries
- Meta descriptions and title tags
- Internal linking strategy
- Schema markup for FAQ content

**Estimated Effort:** 1 week (40 hours)

**Dependencies:**
- Content writing (can be done by FSE using Issue #29 verification as template)
- SEO strategy (keyword research)

**Related Files:**
- `/ISSUE_TRACKER.md` (Issue #29 - calculation verification)
- `/docs/MF_METRICS_REFERENCE.md` (multi-family metric definitions - can adapt)

**Notes:**
- Issue #29 resolution contains excellent certification content to repurpose
- Consider partnership with real estate educator for video content

---

### Feature #4: Help & Documentation Outside Login (SEO Optimization)
**Status:** 🔴 Not Started
**Priority:** P2 - Medium
**Added:** December 13, 2025
**Category:** SEO / Content Marketing / User Acquisition

**Description:**
Move Help & Documentation section outside the authentication wall to improve SEO, drive organic traffic, and allow prospective users to evaluate platform quality before signing up.

**Business Value:**
- **SEO Impact:** Public content ranks in Google, drives organic traffic
- **User Acquisition:** Educational content is top-of-funnel lead generation
- **Conversion Funnel:** Users who read help docs convert 3x higher than cold signups
- **Brand Authority:** Publicly available expertise builds industry credibility

**Functional Requirements:**
1. **Public Documentation Site:**
   - URL structure: `/docs/`, `/help/`, `/guides/`
   - No login required to view
   - Clear CTA to "Try Free Analysis" throughout
   - Example analyses embedded in content

2. **Content Categories:**
   - Getting Started Guides
   - Calculation Methodology
   - Investment Strategy Guides
   - Metric Definitions
   - FAQ / Troubleshooting
   - Video Tutorials (if created)

3. **SEO Optimization:**
   - Target keywords: "rental property calculator", "cap rate calculator", "investment property analysis"
   - Long-tail content: "How to calculate cash-on-cash return"
   - Internal linking to free trial signup
   - Schema markup (Article, HowTo, FAQ)

4. **User Flow:**
   - User lands on "How to Calculate Cap Rate" article
   - Article explains formula with examples
   - CTA: "Calculate Your Property's Cap Rate Free" → Wizard signup
   - After signup, redirect to wizard with context retained

**Technical Requirements:**
- Create public routes (currently behind auth)
- Build landing page templates for educational content
- Implement sitemap.xml generation
- Add Google Analytics event tracking for doc engagement
- Create structured data (JSON-LD) for SEO

**Content Requirements:**
- 25-30 help articles (repurpose from Feature #3)
- 10-15 strategy guides
- 5-10 video transcripts (if videos created)
- 50+ FAQ entries

**SEO Strategy:**
- Keyword research (Ahrefs, SEMrush)
- Competitor content gap analysis
- Backlink outreach to real estate blogs
- Guest posting on BiggerPockets, REtipster

**Estimated Effort:** 2 weeks (80 hours)

**Dependencies:**
- Feature #3 (content must exist first)
- SEO keyword research
- Google Search Console setup

**Related Files:**
- `/frontend/src/App.tsx` (routing configuration)
- `/frontend/src/pages/` (create public doc pages)

**Notes:**
- BiggerPockets Calculator gets 500K+ visits/month from organic search
- This is long-term growth strategy, not immediate ROI
- Consider content calendar (2-3 new articles/month)

---

### Feature #5: Social Sharing Strategy Overhaul
**Status:** 🔴 Not Started
**Priority:** P2 - Medium
**Added:** December 13, 2025
**Category:** Viral Growth / Social Media / User Acquisition

**Description:**
Redesign and optimize social sharing functionality to drive viral growth, including updating Twitter to X, adding new platforms, and creating shareable property analysis cards.

**Current State:**
- Social share buttons exist on landing page (Facebook, LinkedIn, Twitter)
- Twitter needs to be updated to X (brand change)
- No sharing from property analysis results
- No custom share images/cards

**Functional Requirements:**
1. **Platform Updates:**
   - ✅ Facebook (keep)
   - ✅ LinkedIn (keep)
   - ❌ Twitter → ✅ **X** (rebrand, update logo/link)
   - 🆕 Instagram Stories (shareable image card)
   - 🆕 WhatsApp (mobile sharing)
   - 🆕 Email (mailto with pre-filled message)

2. **Shareable Content:**
   - Property analysis summary card (image)
   - "I just analyzed a property with 16% CoC return!" social post template
   - Deal Quality score badge ("94/100 BUY verdict")
   - Investment Decision Hero card as image
   - Long-term projection chart

3. **Share Card Design:**
   - Branded template with logo
   - Key metrics displayed (Cap Rate, Cash Flow, ROI)
   - Verdict badge (BUY/NEGOTIATE/CAUTION)
   - CTA: "Analyze Your Property Free at [URL]"
   - Property address (optional, privacy toggle)

4. **Sharing Triggers:**
   - Post-analysis screen: "Share your results"
   - After positive verdict: "Tell your network about this deal"
   - Milestone achievements: "You've analyzed 10 properties!"
   - Referral incentive: "Share to unlock premium feature"

5. **Tracking & Analytics:**
   - Share button click tracking (Google Analytics)
   - Referral source attribution (UTM parameters)
   - Viral coefficient measurement (shares per user)
   - Conversion tracking (share → signup)

**Technical Requirements:**
- Update social share buttons (X logo, URL)
- Build shareable image generator (HTML to Canvas API)
- Implement Open Graph meta tags for rich previews
- Add Twitter/X Card meta tags
- Create share tracking event system
- Build referral link generator with UTM codes

**Design Requirements:**
- Social share card templates (3-5 variations)
- X logo integration (brand guidelines)
- Instagram Story template (1080x1920px)
- Mobile-optimized share sheet

**Viral Growth Strategy:**
1. **Incentivize Sharing:**
   - "Share to unlock AI insights" (freemium gate)
   - Referral program: "Get 1 month free for 3 referrals"
   - Leaderboard: "Top shared properties this week"

2. **Make Sharing Easy:**
   - One-click share from results page
   - Pre-filled post templates
   - Automatic image generation
   - Mobile native share sheet integration

3. **Optimize for Virality:**
   - Highlight impressive metrics (16% CoC!)
   - Social proof badges ("Join 15,000+ investors")
   - FOMO triggers ("Found an amazing deal")
   - Clear CTA ("Try it free")

4. **Platforms Priority:**
   - **X (Twitter):** Real estate investor community active here
   - **LinkedIn:** Professional credibility, B2B partnerships
   - **Facebook Groups:** BiggerPockets, local REI groups
   - **Instagram:** Visual property cards, younger investors
   - **WhatsApp:** International markets, mobile-first

**Growth Projections:**
- Current: 0 social shares/month (no in-app sharing)
- Target: 500+ shares/month within 6 months
- Viral coefficient goal: 0.3 (each user brings 0.3 new users)
- Expected traffic increase: 20-30% from social referrals

**Estimated Effort:** 1.5 weeks (60 hours)

**Dependencies:**
- Design team for share card templates
- X (Twitter) developer account for Card validation
- Analytics tracking setup

**Related Files:**
- `/frontend/src/pages/LandingPage.tsx` (current share buttons)
- `/frontend/src/components/SFRAnalysis/AnalysisResults.tsx` (add sharing)

**Notes:**
- X (formerly Twitter) rebrand must be implemented (current Twitter branding is outdated)
- Instagram sharing requires image generation (server-side rendering)
- Consider TikTok for younger investor demographic (future)

---

## 🎯 **P2 - Medium Priority Features** (continued)

### Feature #9: Property Image Integration
**Status:** 🔴 Not Started
**Priority:** P2 - Medium (Visual Enhancement / User Engagement)
**Added:** December 13, 2025
**Category:** Data Integration / Visual Enhancement

**Description:**
Integrate property images from Google Street View, Zillow, or similar APIs to display property photos on saved properties list and throughout the platform. Visual representation helps users quickly identify properties and increases engagement.

**Business Value:**
- **User Engagement**: Property images increase time on site by 40%+ (industry data)
- **Memory Aid**: Visual recognition faster than reading addresses
- **Professional Appearance**: Matches Zillow/Redfin user expectations
- **Conversion**: Properties with images get 2x more clicks (user behavior data)

**Functional Requirements:**
1. **Image Source Options:**
   - **Google Street View API** (most reliable, costs $7/1000 requests)
   - **Zillow API** (if property listed, free tier available)
   - **RentCast API Enhancement** (may include property images)
   - **User Upload** (manual fallback for unlisted properties)

2. **Display Locations:**
   - Saved Properties List (card/row thumbnail)
   - Property Analysis Results (hero image)
   - Property Wizard Address Step (preview after address entry)
   - Investment Decision Hero card (contextual visual)

3. **Image Handling:**
   - Default placeholder if no image available (property icon or map pin)
   - Lazy loading for performance (load images as user scrolls)
   - Caching in MongoDB (avoid repeated API calls)
   - Responsive image sizes (thumbnail, medium, large)

4. **Integration Points:**
   - Fetch during RentCast API call (piggyback on existing request)
   - Store image URL in property document
   - CDN optimization for fast loading (Cloudinary, imgix)

**Technical Requirements:**
- **Google Street View API Integration:**
  ```typescript
  const imageUrl = `https://maps.googleapis.com/maps/api/streetview?size=400x300&location=${address}&key=${API_KEY}`;
  ```
- **Image Storage**: Store URL in property schema (not binary data)
- **Fallback Logic**: If API fails, show placeholder SVG icon
- **Performance**: Lazy load with IntersectionObserver API
- **Caching**: MongoDB TTL index (7-day cache for image URLs)

**UI/UX Considerations:**
- **Row Layout Impact**: 60px thumbnail on left side of row (doesn't break layout)
- **Card Layout Impact**: Hero image at top of card (natural card enhancement)
- **Mobile**: Smaller thumbnails (40px) for performance
- **Accessibility**: Alt text with property address

**Design Requirements:**
- Image aspect ratio: 4:3 (standard property photo ratio)
- Thumbnail sizes: 60x45px (row), 320x240px (card), 640x480px (details)
- Border radius: 8px (matches card design)
- Loading state: Gray skeleton with pulse animation

**API Cost Analysis:**
- **Google Street View**: $7 per 1,000 requests
- **Estimated Usage**: 500 properties/month = $3.50/month
- **Free Tier**: First $200/month free (28,000 requests)
- **Verdict**: Extremely affordable for startup phase

**Estimated Effort:** 1 week (40 hours)

**Dependencies:**
- Google Cloud Platform account setup
- Street View API key configuration
- Image storage strategy decision (URL vs CDN)

**Related Files:**
- `/backend/src/services/propertyImageService.ts` (new)
- `/backend/src/models/Deal.ts` (add imageUrl field)
- `/frontend/src/components/PropertyImage.tsx` (new reusable component)
- `/frontend/src/pages/SavedProperties.tsx` (add image display)

**Design Inspiration:**
- Zillow saved homes (large images in cards)
- Redfin favorites (small thumbnails in rows)
- Apple Maps (Street View integration)

**Notes:**
- **Row vs Card Decision**: Images work in BOTH layouts
  - **Row Layout**: 60px thumbnail on left, text on right (Gmail attachment style)
  - **Card Layout**: Hero image at top, content below (Airbnb style)
- Image integration does NOT dictate layout choice
- Can implement images after layout decision is made
- Start with placeholder icons, add images later (progressive enhancement)

---

## 🎯 **P3 - Low Priority Features**

### Feature #6: PDF Report Download
**Status:** 🔴 Not Started
**Priority:** P3 - Low (long-term goal)
**Added:** December 13, 2025
**Category:** User Experience / Professional Tools

**Description:**
Allow users to download a professionally formatted PDF report of their property analysis, suitable for sharing with partners, lenders, or team members.

**Business Value:**
- **Professional Tier Feature:** Incentive for paid subscription upgrade
- **User Retention:** Downloaded reports increase platform stickiness
- **B2B Appeal:** Real estate professionals need shareable reports
- **Competitive Parity:** Most competitors offer PDF export

**Functional Requirements:**
1. **Report Content:**
   - Property summary (address, purchase price, key details)
   - Investment Decision Hero card
   - Monthly cash flow analysis
   - All financial metrics
   - Long-term projections (10-20 years)
   - Exit analysis
   - AI insights (if available)
   - Market intelligence data

2. **Report Formatting:**
   - Professional branded header/footer
   - Logo and company information
   - Page numbers and table of contents
   - Charts and graphs (rendered as images)
   - Color-coded metrics (green/yellow/red)
   - Investor disclaimer (educational purposes only)

3. **Download Options:**
   - Full report (15-20 pages)
   - Executive summary (2-3 pages)
   - Custom report builder (select sections)
   - Batch download (multiple properties)

4. **Subscription Gating:**
   - Free tier: Executive summary only (marketing preview)
   - Professional tier: Full report, unlimited downloads
   - Enterprise tier: White-label branding option

**Technical Requirements:**
- PDF generation library (jsPDF, PDFKit, or Puppeteer)
- Server-side rendering for charts/graphs
- Template system for report layouts
- Cloud storage for generated PDFs (S3, Cloudinary)
- Download tracking and analytics

**Design Requirements:**
- Professional report template design
- Print-optimized styling (A4/Letter size)
- Brand guidelines integration
- Chart/graph rendering at high resolution

**Performance Requirements:**
- PDF generation: <10 seconds for full report
- File size: <5MB for full report
- Concurrent generation: Support 10+ simultaneous requests

**Estimated Effort:** 2 weeks (80 hours)

**Dependencies:**
- PDF generation library evaluation and selection
- Design team for report template
- Cloud storage setup for PDF hosting

**Related Files:**
- `/frontend/src/components/SFRAnalysis/AnalysisResults.tsx` (source data)
- New: `/backend/src/services/pdfGenerationService.ts`

**Notes:**
- This is a common user request but not critical for MVP
- Consider partnership with existing PDF generation service (DocRaptor, Apryse)
- White-label option is strong B2B selling point

---

### Feature #7: Census Data Integration - User-Facing Value
**Status:** 🔴 Not Started
**Priority:** P3 - Low
**Added:** December 13, 2025
**Category:** Market Intelligence / User Education

**Description:**
Rename and redesign the current Census Data Integration test page to provide user-facing value, transforming technical data into actionable market insights for property investors.

**Current State:**
- Census data integration exists at `/census-test` (technical test page)
- Displays raw demographic and housing data
- Not user-friendly, looks like developer tool
- Hidden from main navigation

**Business Value:**
- **Market Intelligence:** Demographic data informs investment decisions
- **Competitive Advantage:** Most calculators don't include market context
- **Educational Value:** Teach users what demographic trends matter
- **Data Differentiation:** Census data is free but rarely presented well

**Functional Requirements:**
1. **Rename & Rebrand:**
   - Current: "Census Data Integration Test"
   - New: "Market Intelligence Dashboard" or "Neighborhood Insights"
   - Route: `/market-insights/:zipcode` or `/neighborhood/:zipcode`

2. **User-Friendly Presentation:**
   - Population trends (growing/declining)
   - Median household income
   - Renter vs owner occupancy rates
   - Age demographics (young professionals, families, retirees)
   - Employment statistics
   - Education levels
   - Housing affordability metrics

3. **Investment Insights:**
   - "Strong rental market" indicators (high renter %, young professionals)
   - "Appreciation potential" indicators (population growth, income growth)
   - "Family-friendly area" indicators (schools, median age)
   - Risk flags (declining population, high poverty rate)

4. **Visual Design:**
   - Charts and graphs (population trend line, income distribution)
   - Color-coded indicators (green = favorable, red = unfavorable)
   - Map integration (neighborhood boundaries)
   - Comparative benchmarks (vs county average, vs state average)

5. **Integration with Property Analysis:**
   - Auto-populate market insights when analyzing property
   - Show census data in Analysis Results sidebar
   - Include in Investment Decision context
   - AI insights reference census data ("Area has 15% population growth")

**Technical Requirements:**
- Refactor census test page into production component
- Add data visualization library (Chart.js, Recharts)
- Integrate with property analysis workflow
- Cache census data per ZIP code (reduce API calls)

**Content Requirements:**
- Investment interpretation guide for each metric
- "What This Means" tooltips for technical data
- Educational content: "How to Use Demographics in Investment Decisions"

**Design Requirements:**
- Dashboard layout (cards, charts, metrics)
- Mobile-responsive design
- Print-friendly format (include in PDF reports)

**Estimated Effort:** 1 week (40 hours)

**Dependencies:**
- Census API rate limits (ensure compliance)
- Design team for dashboard layout
- Content writer for metric interpretations

**Related Files:**
- `/frontend/src/pages/CensusTest.tsx` (existing test page)
- `/backend/src/services/censusService.ts` (backend integration)

**Notes:**
- Census data is already integrated (backend complete)
- This is mostly frontend UX/design work
- Low priority because it's "nice to have", not core functionality
- Could become P2 if market intelligence becomes competitive differentiator

---

## 📊 **Backlog Summary**

| Priority | Feature | Status | Estimated Effort | Business Impact |
|----------|---------|--------|------------------|-----------------|
| **P1** | BRRRR & House Hacking Engines | 🔴 Not Started | 2-3 weeks | High (revenue + differentiation) |
| **P1** | Metrics UX Optimization | 🔴 Not Started | 1-2 weeks | High (user experience) |
| **P1** | Saved Properties List UX | 🟢 In Progress | 1 week | High (core workflow friction) |
| **P2** | Calculation Accuracy Docs | 🔴 Not Started | 1 week | Medium (trust + SEO) |
| **P2** | Help Docs Outside Login | 🔴 Not Started | 2 weeks | Medium (SEO + acquisition) |
| **P2** | Social Sharing Strategy | 🔴 Not Started | 1.5 weeks | Medium (viral growth) |
| **P2** | Property Image Integration | 🔴 Not Started | 1 week | Medium (visual enhancement) |
| **P3** | PDF Report Download | 🔴 Not Started | 2 weeks | Low (professional feature) |
| **P3** | Census Data User Value | 🔴 Not Started | 1 week | Low (market intelligence) |

**Total Estimated Effort:** 12.5 - 15.5 weeks (500-620 hours)

---

## 🎯 **Next Actions**

**User Will Pick Features When Ready:**
- No auto-prioritization beyond P1/P2/P3 designation
- User will select specific features to implement
- Backlog is maintained for reference and planning

**Current Focus (as of 12/13/2025):**
- ✅ Issue #29 (Loan Amount Discrepancy) - RESOLVED
- ⏳ Remaining Issue Tracker bugs (Issues #25-#30)
- ⏳ Debug logging cleanup (optional)

**When Ready to Start New Features:**
1. User selects feature from backlog
2. Create detailed implementation plan
3. Break into tasks with TodoWrite
4. Execute and test
5. Update backlog status

---

## 📝 **Feature Request Process**

**To Add New Features to Backlog:**
1. Describe feature goal and user value
2. Specify priority (P1/P2/P3)
3. Add to appropriate section in this document
4. Include business impact and estimated effort
5. User reviews and approves addition

**To Promote Feature to Active Development:**
1. User selects feature from backlog
2. FSE creates detailed technical specification
3. Architect reviews architecture impact (if needed)
4. UX Designer creates mockups (if UI changes)
5. TodoWrite task breakdown
6. Begin implementation

---

**Document Maintained By:** FSE (Full-Stack Engineer)
**Review Cadence:** Monthly or as needed
**Last Review:** December 13, 2025
