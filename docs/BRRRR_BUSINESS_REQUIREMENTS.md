# BRRRR Strategy - Business Requirements

**Document Type**: Business Requirements Specification
**Version**: 2.0
**Date**: January 11, 2026
**Author**: Business Expert (Real Estate Investment Specialist - 20 years experience, $10M portfolio)
**Purpose**: Define WHAT the BRRRR analysis platform must do from a business perspective

---

## Document Purpose and Audience

This document describes the BRRRR (Buy, Rehab, Rent, Refinance, Repeat) investment strategy analysis requirements in **business language** for:

✅ **Real Estate Investors**: Understand what the platform calculates and why
✅ **CPAs and Tax Professionals**: Validate business logic and tax treatment
✅ **Lenders**: Confirm alignment with underwriting standards
✅ **Product Team**: Understand business value and decision-making
✅ **Architecture Team**: Foundation for translating to technical design
✅ **Engineering Team**: Context for implementation decisions

**This is NOT a technical specification.** Technical details (data types, formulas, APIs) belong in the Architecture and Technical Specification documents.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [The BRRRR Journey](#2-the-brrrr-journey)
3. [Key Business Concepts](#3-key-business-concepts)
4. [Business Rules](#4-business-rules)
5. [Industry Standards](#5-industry-standards)
6. [What Platform Does NOT Calculate](#6-what-platform-does-not-calculate)
7. [Success Metrics](#7-success-metrics)

---

## 1. EXECUTIVE SUMMARY

### What is BRRRR?

BRRRR is a real estate investment strategy where investors:
1. **Buy** a distressed property below market value
2. **Rehab** (renovate) the property to increase its value
3. **Rent** the property to generate monthly income
4. **Refinance** to pull out most (or all) of their invested capital
5. **Repeat** the process with the recovered capital

**The Core Promise**: Own a cash-flowing rental property with little to none of your money invested.

### Why Investors Use BRRRR

**Traditional Buy & Hold**:
- Buy property for $200K with $40K down payment (20%)
- $40K is tied up in this property forever
- To buy second property, need another $40K

**BRRRR Strategy**:
- Buy distressed property for $130K with $26K down
- Invest $30K in rehab
- Property now worth $200K
- Refinance at 75% of $200K = $150K new loan
- Original loan was $104K, refinance pays it off
- Receive $46K cash back
- **Total invested**: $56K (down payment + rehab)
- **Recovered**: $46K
- **Remaining in deal**: $10K
- **Capital Recovery**: 82%

Now you have $46K to do another BRRRR deal while still owning the first property.

### What This Platform Helps Investors Decide

**Primary Question**: Is this a good BRRRR deal?

**Key Decisions Platform Supports**:
1. **Should I buy this property at this price?** (70% Rule validation)
2. **How much capital will I recover?** (Capital Recovery Rate calculation)
3. **Will I achieve infinite return?** (100%+ capital recovery)
4. **What will my cash flow be after refinance?** (Trade-off analysis)
5. **How long must I wait?** (Seasoning period requirements)
6. **Will lenders approve my refinance?** (DSCR and LTV validation)

### The #1 BRRRR Metric

**Capital Recovery Rate**: What percentage of your invested money do you get back through refinancing?

- **Poor BRRRR**: 30-50% recovery (most money trapped)
- **Acceptable BRRRR**: 50-70% recovery (workable but not ideal)
- **Good BRRRR**: 70-85% recovery (strong execution)
- **Excellent BRRRR**: 85-100% recovery (near perfect)
- **Elite BRRRR**: 100%+ recovery (infinite return - ALL money back)

---

## 2. THE BRRRR JOURNEY

This section describes the investor's journey through each phase of a BRRRR deal and what the platform must calculate at each step.

---

### Phase 1: BUY (The Hunt for Value)

#### Business Goal
Find a distressed property significantly below market value that has forced appreciation potential through renovation.

#### What Investor Needs to Know

**Question 1: Am I paying too much?**
- Even if the seller accepts my offer, am I overpaying?
- What's the maximum I should pay for this property?
- Platform requirement: Calculate and display 70% Rule maximum purchase price

**Question 2: How much cash do I need to close?**
- Down payment (typically 15-25% for investment property)
- Closing costs (typically 2-3% of purchase price)
- Platform requirement: Calculate total cash needed to acquire property

**Question 3: What will my monthly mortgage payment be?**
- Based on purchase price, down payment, and current interest rates
- This payment continues during seasoning period (6-12 months)
- Platform requirement: Calculate original monthly mortgage payment

#### The 70% Rule (Industry Standard)

**Business Purpose**: Wholesale investor formula ensuring built-in equity margin

**The Formula**:
```
Maximum Purchase Price = (After Repair Value × 70%) - Rehab Budget
```

**Why 70%?**
- Ensures ~5% equity cushion after refinancing at 75% LTV
- Accounts for wholesaler margin if buying from wholesaler
- Protects against ARV estimation errors

**Real Example**:
- After Repair Value (ARV): $275,000
- Estimated Rehab Cost: $35,000
- **Maximum Purchase**: ($275,000 × 0.70) - $35,000 = **$157,500**
- Actual Purchase: $175,000
- **Analysis**: Paying $17,500 above 70% Rule (over by 11%)

**Platform Requirement**:
- Calculate 70% Rule maximum automatically
- Show warning if investor is paying above the limit
- Do NOT block analysis (experienced investors sometimes exceed this rule intentionally)
- Explain why they're over and the risk it creates

#### Business Rules for Purchase Phase

**Rule: Purchase Price Must Be Less Than ARV**
- **Why**: BRRRR requires forced appreciation (creating value through rehab)
- **Platform behavior**: Block analysis if ARV ≤ Purchase Price
- **Error message**: "ARV must be greater than purchase price. BRRRR strategy requires creating value through renovation."

**Rule: Down Payment Typical Range**
- **Industry standard**: 15-25% for investment properties
- **Lender requirements**: Minimum 15% (most conventional lenders)
- **Platform behavior**: Show warning if < 15% or > 30%
- **Why**: < 15% rarely available, > 30% unnecessarily ties up capital

**Rule: Closing Costs Estimation**
- **Industry standard**: 2-3% of purchase price
- **Components**: Title insurance, escrow, lender fees, appraisal, inspections
- **Platform behavior**: Default to 2.5%, allow user override
- **Why**: Varies by state and lender, but 2.5% is conservative average

---

### Phase 2: REHAB (The Value Creation)

#### Business Goal
Renovate the property to dramatically increase its value (forced appreciation), creating the equity needed for successful capital recovery.

#### What Investor Needs to Know

**Question 1: How much will rehab cost?**
- Depends on scope: Cosmetic, Moderate, Major, or Gut Rehab
- Platform requirement: Suggest budget range based on scope selected

**Question 2: What will the property be worth after rehab?**
- This is called ARV (After Repair Value)
- **MOST CRITICAL NUMBER IN BRRRR**
- If you overestimate ARV by even 10%, the deal fails
- Platform requirement: Warn if ARV estimate seems aggressive

**Question 3: Is my ARV realistic?**
- Compare to recent comparable sales
- Check if appreciation percentage is within normal range
- Platform requirement: Calculate ARV "lift" percentage and warn if extreme

#### ARV (After Repair Value) - The Make-or-Break Number

**Why ARV Matters More Than Anything**:

ARV determines:
- How much you can borrow when refinancing (75% of ARV)
- Therefore, how much capital you recover
- Whether you achieve infinite return or trap capital

**Real-World Example of ARV Miss**:
- Investor estimated ARV: $165,000
- Rehab budget: $35,000
- Expected refinance loan (75% LTV): $123,750
- **Appraiser came in at**: $152,000 (8% lower)
- Actual refinance loan: $114,000
- **Lost capital recovery**: $9,750 (8% miss cost $10K in trapped capital)

**ARV Lift Percentage**:
- **Definition**: How much the property value increases through renovation
- **Calculation**: (ARV - Purchase Price) / Purchase Price
- **Example**: Buy for $130K, rehab to $200K = 54% lift

**Platform Requirements for ARV Validation**:

**Warn if ARV lift < 20%**:
- Message: "ARV lift is only 18%. BRRRR typically requires 25-50% forced appreciation. Consider if BRRRR is the right strategy for this property."
- **Why**: With < 20% lift, traditional buy-and-hold may be better strategy

**Warn if ARV lift > 100%**:
- Message: "ARV assumes property will double in value through renovation. This is extremely aggressive. Verify comparable sales carefully."
- **Why**: Very high lifts are risky and often based on wishful thinking

**Industry Benchmarks for ARV Lift**:
- **Typical BRRRR**: 25-50% lift
- **Cosmetic rehab**: 10-20% lift (probably not worth BRRRR complexity)
- **Moderate rehab**: 20-35% lift (sweet spot)
- **Major rehab**: 35-70% lift (higher risk, higher reward)
- **Gut rehab**: 70%+ lift (highest risk, requires extensive experience)

#### Rehab Budget Guidelines

**Rehab Scope Categories**:

**Cosmetic Rehab** (10-15% of purchase price):
- Paint, carpet, fixtures, landscaping
- No structural work, no layout changes
- Timeline: 2-4 weeks
- ARV lift potential: 10-20%

**Moderate Rehab** (15-25% of purchase price):
- Kitchen and bathroom updates
- Flooring, windows, some electrical/plumbing
- No major structural work
- Timeline: 1-3 months
- ARV lift potential: 20-35%

**Major Rehab** (25-40% of purchase price):
- Full kitchen and bathroom remodels
- HVAC replacement, roof, significant electrical/plumbing
- Some layout changes
- Timeline: 3-6 months
- ARV lift potential: 35-70%

**Gut Rehab** (40-60% of purchase price):
- Down to studs renovation
- Everything replaced (electrical, plumbing, HVAC, structural)
- Major layout changes
- Timeline: 6-12 months
- ARV lift potential: 70%+ (can double property value)

**Platform Requirement**: Based on scope selected, suggest budget range and show if user's budget is within typical range.

#### Business Rules for Rehab Phase

**Rule: Rehab Contingency Buffer**
- **Industry standard**: Add 15-20% contingency for unexpected costs
- **Why**: You WILL find issues when walls are opened (old houses have surprises)
- **Platform behavior**: Recommend 15% contingency, show impact on capital recovery if costs overrun

**Rule: Warn if Rehab Exceeds 70% of Purchase Price**
- **Why**: Very risky - buying almost-teardown property
- **Risk**: If rehab goes over budget, entire deal can fail
- **Platform behavior**: Show warning but allow analysis (some investors specialize in heavy rehabs)

---

### Phase 3: RENT (The Income Generation)

#### Business Goal
Place a quality tenant at market rent to:
1. Generate monthly income during seasoning period
2. Satisfy lender requirement for refinancing (cannot refinance vacant property)
3. Create long-term cash flow after refinance

#### What Investor Needs to Know

**Question 1: What rent can I charge?**
- Must be based on comparable rental properties, not wishful thinking
- Platform requirement: Show market rent from RentCast API when available
- Platform requirement: Warn if investor's rent estimate exceeds market rent by > 10%

**Question 2: What are my monthly expenses?**
- Property tax (during seasoning: based on purchase price, after refinance: based on ARV)
- Insurance (always based on ARV - must cover full replacement cost)
- Maintenance (3-8% of rent typical)
- Capital expenditures (5-10% of rent for big-ticket items: roof, HVAC, etc.)
- Property management (8-10% of rent if not self-managing)
- HOA fees (if applicable)
- Utilities (if landlord-paid)
- Vacancy reserve (0% during seasoning, 5-10% after refinance)

**Question 3: Will I make or lose money each month?**
- During seasoning period (first 6-12 months)
- After refinance (long-term cash flow)
- Platform requirement: Calculate both and show the trade-off

#### Operating Expenses - The Details Matter

**Property Tax Treatment** (CRITICAL BUSINESS RULE):

**During Seasoning Period**:
- Calculate using **purchase price**
- **Why**: Tax assessor hasn't reassessed property yet (just purchased)
- **Business reality**: You'll pay tax based on old assessed value initially

**After Refinance**:
- Calculate using **After Repair Value (ARV)**
- **Why**: Refinance often triggers property tax reassessment
- **Business reality**: Higher property value = higher property taxes

**Real Example**:
- Purchase price: $175,000 at 1.5% tax rate = $2,625/year = $219/month
- ARV: $275,000 at 1.5% tax rate = $4,125/year = $344/month
- **Increase**: $125/month (57% jump) after refinance

**Platform Requirement**: Use purchase price for seasoning calculations, ARV for post-refinance projections.

---

**Insurance Coverage** (CRITICAL BUSINESS RULE):

**For Entire Hold Period** (Seasoning + Post-Refinance):
- Calculate using **After Repair Value (ARV)**
- **Why**: Must insure for full replacement cost after renovation
- **Lender requirement**: Insurance must equal or exceed loan amount (based on ARV)
- **Business reality**: If property burns down post-rehab, insurance must cover $275K replacement, not $175K purchase price

**Platform Requirement**: Use ARV for all insurance calculations throughout the analysis.

---

**Capital Expenditures (CapEx) Reserve**:

**What CapEx Covers**:
- Roof replacement (typically every 15-20 years)
- HVAC replacement (typically every 12-15 years)
- Water heater (typically every 10-12 years)
- Appliances (typically every 8-10 years)
- Foundation repairs (as needed)
- Major plumbing/electrical (as needed)

**NOT Covered by CapEx Reserve**:
- Routine maintenance (covered by maintenance reserve)
- Tenant damages (covered by security deposit)
- Cosmetic updates (owner's choice)

**Industry Standard**: 5-10% of monthly rent reserved for capital expenditures

**Platform Requirement**: Allow investor to specify CapEx reserve as:
- Monthly dollar amount (e.g., $150/month), OR
- Percentage of rent (e.g., 5%)
- Default to 5% of rent if not specified

---

**Property Management Fees**:

**Industry Standard**: 8-10% of collected rent

**Self-Management**:
- Investor can set to 0% if managing themselves
- **Warning**: Self-management has hidden time costs
- **Platform behavior**: Allow 0% but show what time is worth

**Professional Management**:
- Typical fee: 8% for experienced investor, 10% for new investor
- **What's included**: Tenant screening, rent collection, maintenance coordination, evictions
- **What's NOT included**: Leasing fee (typically 50% of first month's rent)

**CRITICAL BUSINESS RULE - How Management Fees Work**:
- Management fee is calculated as: Monthly Rent × Management Fee %
- **Deducted from rental income** (NOT added to operating expenses)
- This is important for proper accounting and lender DSCR calculations

**Example**:
- Monthly Rent: $3,260
- Management Fee (8%): $261
- **What you actually receive**: $2,999 (not $3,260)

**Platform Requirement**: Show management fee as deduction from rent, not as operating expense line item.

---

**Vacancy Reserve** (MOST MISUNDERSTOOD BUSINESS RULE):

**During Seasoning Period** (First 6-12 months):
- **Vacancy Rate: 0%** (NO vacancy applied)
- **Why**: YOU CANNOT REFINANCE A VACANT PROPERTY
- **Lender requirement**: Must show active lease + rental payment history
- **Business reality**: Investor waits to place tenant, then starts seasoning clock

**What This Means**:
- You don't start the 12-month seasoning countdown until tenant is placed
- If it takes 30 days to find a tenant after rehab, that's part of the rehab/stabilization phase
- The 12 months of "seasoning" assumes tenant is paying rent the entire time

**After Refinance** (Long-term projections):
- **Vacancy Rate: 5-10%** (normal vacancy applied)
- **Why**: Long-term projections must account for future tenant turnover
- **Industry standard**: 5% in strong markets, 10% conservative

**Platform Requirement**:
- Use 0% vacancy for seasoning period calculations
- Use investor-specified vacancy rate (default 5%) for post-refinance projections
- Explain why vacancy is different in these two phases

**Industry Validation**: Fannie Mae, Freddie Mac, all conventional lenders require tenant-occupied property for cash-out refinance.

---

#### Business Rules for Rental Phase

**Rule: Warn if Rent Exceeds Market by >10%**
- **Why**: Overestimating rent is second most common BRRRR mistake (after ARV)
- **Platform behavior**: Compare investor's rent to RentCast market data
- **Warning message**: "Your estimated rent is 15% above market average. Verify with 3+ comparable properties."

**Rule: Maintenance + CapEx Reserves Should Total 8-15% of Rent**
- **Why**: Under-reserving for repairs is #1 reason cash flow disappears
- **Platform behavior**: Show warning if combined reserves < 5% of rent
- **Industry standard**: New investors should use 15%, experienced investors 8-10%

---

### Phase 4: REFINANCE (The Capital Recovery)

#### Business Goal
After satisfying the lender's seasoning period requirement, refinance the property to recover as much invested capital as possible while maintaining adequate cash flow.

#### What Investor Needs to Know

**Question 1: How long must I wait to refinance?**
- Industry standard: 12 months (Fannie Mae requirement as of April 2023)
- Some DSCR lenders: 6 months (but higher interest rates)
- Platform requirement: Show seasoning period options (6, 9, 12, 18, 24 months) with warnings

**Question 2: How much capital will I recover?**
- **THE MOST IMPORTANT BRRRR CALCULATION**
- Depends on: ARV accuracy, refinance LTV %, and total capital invested
- Platform requirement: Calculate Capital Recovery Rate as primary metric

**Question 3: What will my new mortgage payment be?**
- Higher than original payment (borrowing more money)
- Impacts post-refinance cash flow
- Platform requirement: Show old vs new mortgage payment comparison

**Question 4: Will I still cash flow after refinance?**
- Trade-off: Higher capital recovery = Higher mortgage = Lower cash flow
- Some BRRRR deals have negative cash flow but high capital recovery (investor decision)
- Platform requirement: Show post-refinance cash flow projection with comparison to pre-refinance

**Question 5: Will lenders approve this refinance?**
- DSCR (Debt Service Coverage Ratio) must meet lender minimums
- Typically 1.20-1.25 DSCR required
- Platform requirement: Calculate DSCR and warn if below lender thresholds

#### The Seasoning Period - Why You Must Wait

**Business Purpose**: Lenders require proof that property is stabilized, tenant-occupied, and income-producing.

**What Lenders Need to See**:
1. **Active Lease Agreement**: Written lease with tenant
2. **Rental Payment History**: Bank statements showing 6-12 months of rent deposits
3. **Property Occupancy**: Cannot be vacant at time of refinance application
4. **Stable Value**: Property value has settled post-renovation

**Why This Exists**:
- Prevents "flip and bail" schemes (buy, inflate value, refinance, default)
- Ensures property genuinely supports the debt (rental income covers mortgage)
- Protects lender from fraud and unstable valuations

**Seasoning Period Options**:

**6 Months** (Aggressive):
- **Availability**: DSCR lenders, some portfolio lenders
- **Trade-off**: Higher interest rates (+0.5-1.0%)
- **Use case**: Experienced investor with strong relationship with portfolio lender
- **Platform warning**: "Fannie Mae requires 12 months. 6-month seasoning requires DSCR lender with higher rates."

**12 Months** (Standard):
- **Availability**: Fannie Mae, Freddie Mac, conventional lenders
- **Trade-off**: Industry standard, best rates
- **Use case**: Most BRRRR investors
- **Platform behavior**: Default to 12 months

**18-24 Months** (Conservative/Strategic):
- **Availability**: All lenders
- **Use case**: Waiting for better interest rate environment, building equity further
- **Platform behavior**: Calculate but don't recommend unless investor specifies

**Platform Requirement**: Offer dropdown with 6, 9, 12, 18, 24 month options. Default to 12. Show warnings for < 12.

#### What Happens During Seasoning Period

**Investor is Making Mortgage Payments** (on original loan):
- Paying down principal (small amount in early years)
- Paying interest (most of payment in early years)
- Platform requirement: Calculate loan balance after seasoning period

**Investor is Collecting Rent**:
- Gross rental income
- Minus property management fee
- Minus operating expenses (taxes, insurance, maintenance, etc.)
- **NO vacancy** (tenant must be in place entire seasoning period)

**Net Seasoning Cost Calculation**:
- Total holding costs during seasoning period
- Minus rental income collected during seasoning
- **Can be positive** (out-of-pocket costs - expenses exceed rent)
- **Can be negative** (profit - rent exceeds expenses)

**Real Example** (12-month seasoning):
```
Monthly mortgage: $908
Monthly operating expenses: $655
Total monthly costs: $1,563

Monthly rent: $3,260
Minus management (8%): $261
Net monthly rent: $2,999

Monthly profit: $2,999 - $1,563 = $1,436
12-month seasoning profit: $1,436 × 12 = $17,232

This REDUCES total capital invested (made money while waiting)
```

**Platform Requirement**: Calculate net seasoning cost and add (or subtract if profit) from total capital deployed.

#### Refinance LTV (Loan-to-Value) Options

**What is LTV?**
- Percentage of property value you can borrow
- Example: 75% LTV on $275K property = $206,250 loan

**LTV Options and Lender Requirements**:

**65% LTV** (Very Conservative):
- **Availability**: All lenders
- **Cash flow**: Highest (small loan = small payment)
- **Capital recovery**: Lowest (borrowing least amount)
- **Use case**: Rare for BRRRR (defeats purpose)

**70% LTV** (Conservative):
- **Availability**: Most conventional banks
- **Cash flow**: Good
- **Capital recovery**: Moderate
- **Use case**: Conservative investor prioritizing cash flow over capital recovery

**75% LTV** (Standard):
- **Availability**: Fannie Mae, Freddie Mac, most lenders
- **Cash flow**: Moderate
- **Capital recovery**: Good
- **Use case**: Most BRRRR investors (industry standard)
- **Platform behavior**: Default to 75%

**80% LTV** (Aggressive):
- **Availability**: DSCR lenders, some portfolio lenders
- **Cash flow**: Lowest (often negative)
- **Capital recovery**: Highest
- **Use case**: Experienced investor maximizing capital recovery
- **Trade-off**: Higher interest rates, lower cash flow

**Platform Requirement**:
- Allow investor to select LTV between 65-80%
- Default to 75%
- Warn if selecting 80% (mention higher rates, lower cash flow)
- Block if > 80% (not available in market)

#### Capital Recovery Rate - The North Star Metric

**Definition**: What percentage of your total invested capital do you recover through the refinance?

**The Calculation (Business Logic)**:

**Step 1: Calculate Total Capital Deployed**
```
Down Payment: $35,000
Closing Costs: $4,375
Rehab Budget: $35,000
Net Seasoning Cost: $6,452 (out-of-pocket during 12 months)
─────────────────
Total Capital Deployed: $80,827
```

**Note**: If you MADE money during seasoning (rent > expenses), that reduces total capital deployed.

**Step 2: Calculate Capital Recovered**
```
New Refinance Loan: $206,250 (75% of $275K ARV)
Minus Original Loan Balance: $138,800 (after 12 months of payments)
Minus Refinance Closing Costs: $5,156 (2.5% of new loan)
─────────────────
Net Cash Recovered: $62,294
```

**Step 3: Calculate Recovery Rate**
```
Capital Recovery Rate = ($62,294 / $80,827) × 100 = 77.1%
```

**What This Means**: Investor recovered 77% of invested capital. $18,533 remains in the deal.

**Platform Requirement**: Display Capital Recovery Rate prominently as the PRIMARY metric.

#### Capital Recovery Benchmarks

**< 50% Recovery** (Poor BRRRR):
- **Meaning**: More than half your money is trapped in this property
- **Business impact**: Can't do another BRRRR deal without new capital
- **Recommendation**: Consider traditional buy-and-hold instead
- **Platform behavior**: Show "Poor BRRRR execution" warning

**50-70% Recovery** (Acceptable BRRRR):
- **Meaning**: Recovered majority of capital, some remains invested
- **Business impact**: Can do another smaller BRRRR or need some additional capital
- **Recommendation**: Acceptable but not ideal
- **Platform behavior**: Show "Acceptable BRRRR" with suggestion to improve

**70-85% Recovery** (Good BRRRR):
- **Meaning**: Recovered most capital, strong execution
- **Business impact**: Can do similar-sized next deal
- **Recommendation**: Well-executed BRRRR
- **Platform behavior**: Show "Good BRRRR execution" positive feedback

**85-100% Recovery** (Excellent BRRRR):
- **Meaning**: Recovered nearly all capital, near-perfect execution
- **Business impact**: Can do next deal with almost no additional capital needed
- **Recommendation**: Excellent deal
- **Platform behavior**: Show "Excellent BRRRR" celebration

**100%+ Recovery** (Elite - Infinite Return):
- **Meaning**: Recovered ALL capital AND THEN SOME
- **Business impact**: Own cash-flowing asset with $0 of your money invested
- **Recommendation**: Holy grail of BRRRR
- **Platform behavior**: Show "🎉 Infinite Return Achieved!" prominent badge

**Platform Requirement**: Color-code and display benchmark tier with explanation of what it means for investor.

#### The BRRRR Trade-Off: Capital Recovery vs Cash Flow

**The Business Reality**: You cannot maximize both capital recovery AND cash flow.

**Why the Trade-Off Exists**:

**High Capital Recovery Path** (75-80% LTV):
- New loan is LARGE (borrowing more money)
- New mortgage payment is HIGH
- Operating expenses stay the same
- **Result**: Monthly cash flow DECREASES or goes NEGATIVE
- **But**: You have capital for next deal

**Lower Capital Recovery Path** (65-70% LTV):
- New loan is SMALLER (borrowing less money)
- New mortgage payment is LOWER
- Operating expenses stay the same
- **Result**: Monthly cash flow INCREASES
- **But**: More capital trapped in this property

**Real Example Comparison**:

**Scenario A: 80% LTV** (Maximize Capital Recovery):
```
New loan: $220,000 (80% of $275K)
New mortgage payment: $1,517/month
Monthly rent (after management): $2,999
Monthly operating expenses: $774
Monthly cash flow: $2,999 - $774 - $1,517 = $708/month

Capital recovered: $71,044
Capital recovery rate: 88%
Capital remaining: $9,783
```

**Scenario B: 70% LTV** (Prioritize Cash Flow):
```
New loan: $192,500 (70% of $275K)
New mortgage payment: $1,329/month
Monthly rent (after management): $2,999
Monthly operating expenses: $774
Monthly cash flow: $2,999 - $774 - $1,329 = $896/month

Capital recovered: $43,544
Capital recovery rate: 54%
Capital remaining: $37,283
```

**Analysis**:
- Scenario A: Higher recovery (88%), lower cash flow ($708/mo), can do next deal
- Scenario B: Lower recovery (54%), higher cash flow ($896/mo), capital trapped

**Which is Better?**

**Depends on Investor's Goal**:

**Goal: Scale Portfolio** (Build wealth through volume):
- Choose higher capital recovery (Scenario A)
- Accept lower cash flow
- Use recovered capital to buy next property
- Build equity across multiple properties

**Goal: Monthly Income** (Replace job income):
- Choose lower capital recovery (Scenario B)
- Maximize monthly cash flow
- Build slower but generate more passive income now
- Better for retirees or those needing current income

**Platform Requirement**:
- Show comparison of different LTV scenarios side-by-side
- Calculate capital recovery AND cash flow for each
- Explain the trade-off clearly
- Let investor decide based on their goals

#### DSCR (Debt Service Coverage Ratio) - Will Lenders Approve?

**What is DSCR?**
- Ratio of property's Net Operating Income to Annual Debt Service (mortgage payments)
- Lenders use this to determine if property can support the debt
- **Business meaning**: Can the property pay for itself?

**The Calculation (Business Logic)**:
```
Annual Rent: $3,260 × 12 = $39,120
Minus Operating Expenses: $774 × 12 = $9,288
Net Operating Income (NOI): $29,832

Annual Mortgage Payment: $1,394 × 12 = $16,728

DSCR = $29,832 / $16,728 = 1.78
```

**What DSCR Means**:
- **DSCR > 1.25**: Property generates 25%+ more income than debt service (lenders love this)
- **DSCR = 1.20**: Property generates 20% more than debt service (minimum for most lenders)
- **DSCR = 1.00**: Property exactly breaks even (concerning to lenders)
- **DSCR < 1.00**: Property loses money (lender will reject)

**Lender Requirements**:
- **Fannie Mae**: 1.25 DSCR minimum
- **Freddie Mac**: 1.20 DSCR minimum
- **DSCR Lenders**: 1.00-1.20 DSCR (hence the name "DSCR lenders")
- **Portfolio Lenders**: 1.00-1.15 DSCR (case-by-case)

**Why This Matters for BRRRR**:

Even if you WANT to borrow 80% LTV, lender might cap you at 72% LTV to maintain 1.25 DSCR.

**Example of DSCR Limiting LTV**:
```
You want: 80% LTV ($220K loan)
Mortgage at 80%: $1,517/month
Annual debt service: $18,204
NOI: $29,832
DSCR at 80%: $29,832 / $18,204 = 1.64 ✅ (lender approves)

Different property:
You want: 80% LTV ($220K loan)
Mortgage at 80%: $1,517/month
Annual debt service: $18,204
NOI: $18,000 (lower rent property)
DSCR at 80%: $18,000 / $18,204 = 0.99 ❌ (lender rejects)

Lender reduces to 70% LTV to achieve 1.25 DSCR
New loan: $192,500
Mortgage: $1,329/month
Annual debt service: $15,948
DSCR at 70%: $18,000 / $15,948 = 1.13 (still too low)

Lender reduces to 65% LTV:
New loan: $178,750
Mortgage: $1,234/month
Annual debt service: $14,808
DSCR at 65%: $18,000 / $14,808 = 1.22 ✅ (barely approves)
```

**Platform Requirement**:
- Calculate DSCR for selected LTV
- Show warning if DSCR < 1.25 (Fannie Mae standard)
- Show critical warning if DSCR < 1.00 (refinance will be rejected)
- Suggest maximum LTV that maintains 1.25 DSCR

#### Business Rules for Refinance Phase

**Rule: Seasoning Period Default to 12 Months**
- **Why**: Fannie Mae requirement changed from 6 to 12 months in April 2023
- **Platform behavior**: Default to 12 months, show warning if investor selects < 12

**Rule: Refinance LTV Range 65-80%**
- **Why**: 65% is minimum for meaningful capital recovery, 80% is market maximum
- **Platform behavior**: Allow selection between 65-80%, block if > 80%

**Rule: Refinance Closing Costs Typical 2-3%**
- **Components**: Appraisal, title, lender fees, recording
- **Platform behavior**: Default to 2.5%, allow override
- **Why**: Varies by lender and state, but 2.5% is conservative

**Rule: Cash-Out Refinance Rates Higher Than Purchase Rates**
- **Industry reality**: Cash-out refi rates typically 0.5-1.0% higher than purchase rates
- **Platform behavior**: Default refinance rate to current market rate + 0.5%
- **Why**: Lenders view cash-out as higher risk than purchase money

---

### Phase 5: REPEAT (The Scaling Strategy)

#### Business Goal
Use the recovered capital to acquire another BRRRR property while still owning the first property, building a portfolio of cash-flowing assets.

#### What Investor Needs to Know

**Question 1: How much capital do I have available for the next deal?**
- Capital recovered from refinance
- Minus any reserve cash investor wants to keep
- Platform requirement: Display "Capital Available for Next Deal"

**Question 2: What's my long-term return on this property?**
- IRR (Internal Rate of Return) over 10-15 years
- Total return if sold at year 10
- Platform requirement: Calculate 10-year and 15-year IRR and total returns

**Question 3: Should I hold long-term or sell?**
- Exit scenario analysis: What if I sell at year 3, 5, 7, 10, 15?
- Compare returns across different hold periods
- Platform requirement: Show exit scenario comparison table

**Question 4: How does this property perform relative to alternatives?**
- Compare to index fund returns (S&P 500 average: 10% annually)
- Compare to traditional rental (20% down, no refinance)
- Platform requirement: Show BRRRR vs Buy & Hold comparison

#### Long-Term Projections

**Assumptions Needed**:

**Property Value Appreciation**:
- **Conservative**: 2-3% annually (inflation-adjusted flat)
- **Moderate**: 3-4% annually (historical U.S. average)
- **Aggressive**: 5%+ annually (hot markets only)
- **Platform behavior**: Default to 3%, allow override with warning if > 5%

**Rental Income Growth**:
- **Conservative**: 2-3% annually (matches inflation)
- **Moderate**: 3-4% annually
- **Aggressive**: 5%+ annually
- **Platform behavior**: Default to 3%, typically matches appreciation rate

**Operating Expense Inflation**:
- **Conservative**: 3-4% annually (typically matches CPI)
- **Moderate**: 3% annually
- **Aggressive**: 2% annually (rare - expenses usually grow with inflation)
- **Platform behavior**: Default to 3%

**Projection Period**:
- **Short-term**: 5 years (flip/quick sale strategy)
- **Medium-term**: 10 years (build equity and income)
- **Long-term**: 15-30 years (retirement/legacy strategy)
- **Platform behavior**: Default to 10 years, allow selection up to 30 years

#### IRR (Internal Rate of Return)

**Business Definition**:
The annualized return on investment accounting for:
- Time value of money (money today worth more than money tomorrow)
- All cash flows (initial investment, monthly cash flows, final sale)
- Timing of cash flows (when money goes in and out)

**Why IRR Matters for BRRRR**:
- Standard comparison metric across all investment types
- Accounts for capital recovery event in year 1 (traditional rental doesn't have this)
- Comparable to stock market returns, bonds, other real estate

**IRR Interpretation**:
- **20%+ IRR**: Excellent real estate investment
- **15-20% IRR**: Good return
- **10-15% IRR**: Fair return (comparable to stock market)
- **< 10% IRR**: Below market, reconsider investment

**BRRRR vs Traditional Rental IRR**:

**BRRRR IRR is often HIGHER because**:
- Large capital recovery event in year 1 (cash injection)
- Can use recovered capital for additional deals (not captured in single-property IRR)
- Forces value creation through rehab (not just market appreciation)

**Platform Requirement**: Calculate and display 10-year and 15-year IRR prominently.

#### Exit Scenario Analysis

**Business Purpose**: Help investor understand optimal hold period.

**Scenarios to Calculate**:

**Year 3 Exit** (Short Hold):
- Property Value: Purchase + appreciation (3 years)
- Loan Balance: After 3 years of principal paydown
- Selling Costs: 6% (typical realtor commission + closing)
- Net Proceeds: Value - Loan - Costs
- IRR: Likely 8-12% (short hold period limits appreciation benefit)

**Year 5 Exit** (Medium Hold):
- More appreciation accumulated
- More principal paid down
- IRR: Likely 10-15%

**Year 7 Exit**:
- Appreciation compounds
- Loan balance dropping faster (amortization accelerates)
- IRR: Likely 12-18%

**Year 10 Exit**:
- Significant appreciation (34% increase at 3% annual)
- Loan balance significantly reduced
- IRR: Likely 15-20%

**Year 15 Exit** (Long Hold):
- Maximum appreciation benefit (56% increase at 3% annual)
- Loan nearly half paid off
- IRR: Likely 18-22%

**Platform Requirement**:
- Show comparison table of exit years 3, 5, 7, 10, 15
- Calculate property value, loan balance, net proceeds, IRR for each
- Highlight which hold period maximizes IRR
- Explain that longer hold usually better for BRRRR (capital recovery gives head start)

#### BRRRR vs Buy & Hold Comparison

**Business Purpose**: Show advantage of BRRRR strategy vs traditional rental.

**Traditional Buy & Hold** (baseline comparison):
- Purchase: $200K with 20% down ($40K)
- No rehab, no forced appreciation
- Rent: $1,800/month
- Never refinance (keep original loan)
- Cash flow: $400/month
- Capital Invested: $40K (trapped in deal)

**BRRRR Strategy** (same starting capital):
- Purchase: $130K with 20% down ($26K)
- Rehab: $30K
- Rent: $2,000/month
- Refinance: Recover $46K (82%)
- Cash flow: $200/month (lower due to higher mortgage)
- Capital Invested: $10K (most recovered)

**10-Year Comparison**:

**Buy & Hold**:
- Total cash flow: $400/mo × 120 = $48,000
- Property value increase: $200K → $269K (34%)
- Loan paydown: $44,000
- Equity: $269K - $156K = $113,000
- Total return: $48K + equity appreciation
- **But**: $40K still tied up in this one property

**BRRRR** (Single Property):
- Total cash flow: $200/mo × 120 = $24,000
- Property value increase: $200K → $269K (34%)
- Loan paydown: Similar
- Equity: Similar to Buy & Hold
- **Plus**: $46K available to buy another property

**BRRRR (With Repeat)**:
- Used $46K recovered to buy second BRRRR property
- Now own TWO properties vs one
- Combined cash flow: $400/month from both
- Combined equity: 2× the appreciation
- **Result**: 2× the wealth in same 10-year period

**Platform Requirement**:
- Show side-by-side comparison of BRRRR vs Buy & Hold
- Calculate assuming investor uses recovered capital for second BRRRR
- Highlight scaling advantage of BRRRR strategy

---

## 3. KEY BUSINESS CONCEPTS

### Infinite Return - The Holy Grail

**Definition**: Recovering 100% or more of your invested capital while still owning a cash-flowing asset.

**Business Meaning**: You own a rental property with literally $0 of your money invested.

**Real Example from Platform Validation**:
```
Total Capital Deployed: $122,500
  - Down Payment: $17,000
  - Closing Costs: $2,500
  - Rehab: $35,000
  - Seasoning Costs: $68,000

Capital Recovered: $55,750 (refinance payout)

Capital Recovery Rate: 103%

Result: INFINITE RETURN
```

**What This Means**:
- Investor got back MORE than they put in
- $3,750 "profit" plus ownership of asset
- All future cash flow is return on $0 investment (infinite return)
- All future appreciation is return on $0 investment (infinite return)

**The Trade-Off with Infinite Return**:

**Common Misconception**: Infinite return = unlimited cash flow

**Reality**: Infinite return properties often have LOW or NEGATIVE cash flow

**Why**:
- To achieve 100%+ recovery, you must refinance at high LTV (75-80%)
- High LTV = Large loan = High mortgage payment
- High mortgage payment often exceeds (or nearly equals) rental income
- Result: $0 to $100/month cash flow

**Real Example** (Memphis deal from Business Expert validation):
- Capital Recovery: 103% (infinite return achieved ✅)
- Monthly Cash Flow: $47/month (very low)
- **Was it worth it?**: YES
  - Recovered $134,000 for next deal
  - Still own cash-flowing asset
  - All appreciation is "free" (no capital invested)

**Platform Requirement**:
- Clearly display "🎉 Infinite Return Achieved!" when recovery ≥ 100%
- Show monthly cash flow alongside (so investor understands trade-off)
- Explain that infinite return is about capital recycling, not cash flow

### Forced Appreciation vs Market Appreciation

**Market Appreciation** (Traditional Buy & Hold):
- Buy property for $200K
- Wait 10 years
- Market appreciates 34% (3% annual)
- Property now worth $269K
- **Appreciation**: $69K (but took 10 years)

**Forced Appreciation** (BRRRR):
- Buy distressed property for $130K
- Invest $30K in rehab
- Property immediately worth $200K (after rehab)
- **Forced Appreciation**: $70K (created in 2-3 months)
- Then ALSO benefits from market appreciation over time

**The BRRRR Advantage**:
1. Create $70K in equity immediately through renovation (forced appreciation)
2. Then enjoy market appreciation on the HIGHER value ($200K, not $130K)
3. Year 10 value: $269K (34% appreciation on $200K base)

**Business Reality**:
- Forced appreciation is WHERE BRRRR CREATES VALUE
- Market appreciation is bonus (would happen anyway)
- This is why ARV accuracy is critical (forced appreciation only works if ARV is real)

**Platform Requirement**:
- Show forced appreciation amount (ARV - Purchase Price)
- Show forced appreciation percentage
- Explain this is value created through renovation, not market timing

### Geographic Arbitrage (Not Platform Feature Yet, But Concept Matters)

**Business Concept**: Buy BRRRR properties in markets where:
- **Purchase prices are lower** (can buy for $130K instead of $300K)
- **Rents are strong relative to prices** (rent-to-price ratio favorable)
- **Appreciation potential exists** (growing population, job growth)

**Examples of BRRRR-Friendly Markets** (historically):
- Indianapolis, IN (low prices, strong rents, stable appreciation)
- Memphis, TN (very low prices, decent rents, higher risk)
- Jacksonville, FL (moderate prices, strong growth)
- Kansas City, MO (low prices, stable economy)

**Examples of BRRRR-Difficult Markets**:
- San Francisco, CA (too expensive, rents don't justify prices)
- New York, NY (high prices, heavy regulations, low rent ratios)
- Los Angeles, CA (appreciation markets, not cash flow markets)

**Why This Matters for Requirements**:
- Platform should eventually support market comparison
- Help investors identify BRRRR-friendly markets
- Show rent-to-price ratios across markets

**Platform Future Enhancement**: Market analysis and comparison tools (not required for MVP).

---

## 4. BUSINESS RULES

This section documents FIRM business rules that must be followed in calculations.

### Rule 1: Property Tax Calculation Timing

**Business Rule**: Property tax calculation changes based on investment phase.

**During Seasoning Period**:
- **Use**: Purchase Price as tax base
- **Why**: Property was just purchased at purchase price, assessor hasn't reassessed yet
- **Business Reality**: Investor pays tax on old assessed value initially
- **Example**: $175K purchase × 1.5% = $2,625/year = $219/month

**After Refinance (Long-term Projections)**:
- **Use**: After Repair Value (ARV) as tax base
- **Why**: Refinance event often triggers property tax reassessment
- **Business Reality**: Assessor sees improved property, higher valuation, raises taxes
- **Example**: $275K ARV × 1.5% = $4,125/year = $344/month

**Impact**: Property tax can increase 30-60% after refinance. This reduces post-refinance cash flow.

**Platform Behavior**: Automatically use purchase price for seasoning, ARV for post-refinance. No user override needed (this is reality).

---

### Rule 2: Insurance Coverage Amount

**Business Rule**: Insurance based on ARV for entire hold period.

**All Phases (Seasoning + Post-Refinance)**:
- **Use**: After Repair Value (ARV) for insurance calculation
- **Why**: Must insure for full replacement cost after renovation complete
- **Lender Requirement**: Insurance must equal or exceed loan amount (based on ARV)
- **Business Reality**: If property burns down after $30K rehab, insurance must cover $200K rebuilt value, not $130K purchase price

**Example**:
- Purchase Price: $175K
- ARV: $275K
- **Insurance**: Based on $275K (entire hold period)
- **Monthly Premium**: ~$104/month

**Platform Behavior**: Use ARV for all insurance calculations. Do not change based on phase.

---

### Rule 3: Vacancy Rate Application by Phase

**Business Rule**: Vacancy treatment differs dramatically between seasoning and post-refinance.

**During Seasoning Period (6-12 months)**:
- **Vacancy Rate**: 0% (ZERO - no vacancy applied)
- **Why**: CANNOT refinance vacant property (Fannie Mae, Freddie Mac requirement)
- **Lender Requirement**: Must show active lease + 6-12 months rent payment history
- **Business Reality**: Investor waits to place tenant BEFORE starting seasoning countdown
- **If 30-day vacancy occurs**: That's part of stabilization phase, not seasoning period

**After Refinance (Long-term Projections)**:
- **Vacancy Rate**: 5-10% (investor-specified, default 5%)
- **Why**: Long-term projections must account for tenant turnover
- **Industry Standard**: 5% in strong markets, 10% conservative
- **Business Reality**: Properties will be vacant between tenants eventually

**Impact Example** (Austin TX property, 12-month seasoning, $3,260 rent):
- **With vacancy during seasoning** (WRONG): $3,260 × 10% × 12 = $3,912 understated income
- **Without vacancy during seasoning** (CORRECT): $0 vacancy loss during seasoning

**Platform Behavior**:
- Use 0% vacancy for seasoning calculations (hardcoded, no override)
- Use investor-specified vacancy (default 5%) for post-refinance
- Explain difference in UI ("Post-Refinance Vacancy Rate" label)

**Industry Validation**:
- Fannie Mae Selling Guide B2-1.3-01
- Freddie Mac CHOICERenovation requirements
- BiggerPockets BRRRR methodology
- Wall Street Prep real estate modeling standards

**Reference**: Architecture Decision Record ADR_BRRRR_SEASONING_VACANCY.md (December 2025)

---

### Rule 4: Management Fee Treatment

**Business Rule**: Property management fees are deducted from rental income, NOT added to operating expenses.

**Accounting Treatment**:
```
Gross Rental Income: $3,260
Minus Management Fee (8%): $261
= Net Rental Income: $2,999

Net Rental Income: $2,999
Minus Operating Expenses: $774
= Net Operating Income (NOI): $2,225
```

**NOT This** (Common Mistake):
```
Gross Rental Income: $3,260
Minus Operating Expenses: $774
Minus Management Fee: $261  ← WRONG: Don't add to OpEx
= Net Operating Income: $1,965 (incorrect)
```

**Why This Matters**:
- Proper accounting separates revenue deductions from operating expenses
- NOI calculation must follow industry standards (lenders, appraisers use this)
- DSCR calculations depend on correct NOI (lender approval)

**Real Estate Accounting Standard**:
- Management fee is "above the line" (reduces Effective Gross Income)
- Operating expenses are "below the line" (reduce EGI to get NOI)

**Platform Behavior**:
- Deduct management fee from gross rent before calculating NOI
- Do NOT include management fee in operating expense line items
- Show clearly in breakdown: "Net Rent (after management): $2,999"

---

### Rule 5: The 70% Rule Application

**Business Rule**: Calculate 70% Rule maximum purchase price and warn if exceeded, but do NOT block analysis.

**The Formula**:
```
Maximum Purchase Price = (After Repair Value × 0.70) - Rehab Budget
```

**Example**:
- ARV: $275,000
- Rehab Budget: $35,000
- **Maximum**: ($275,000 × 0.70) - $35,000 = $157,500
- Actual Purchase: $175,000
- **Over by**: $17,500 (11%)

**Platform Behavior When Investor Exceeds 70% Rule**:
- ✅ Show warning: "⚠️ Property purchase price exceeds 70% Rule by $17,500"
- ✅ Explain risk: "This reduces your equity cushion and capital recovery potential"
- ✅ Suggest action: "Negotiate purchase price or verify ARV is accurate"
- ❌ Do NOT block analysis (experienced investors sometimes exceed this intentionally)

**When Investors Might Violate 70% Rule** (legitimate reasons):
1. **Ultra-conservative ARV**: ARV estimate is very conservative, actual value may be higher
2. **Competitive market**: Can't negotiate lower, but confident in ARV
3. **Multiple exit strategies**: If BRRRR fails, can flip or traditional rental
4. **Strong market fundamentals**: Appreciation expected to close the gap

**Why Non-Blocking Is Correct**:
- 70% Rule is guideline, not law
- Experienced investors exceed this ~20% of time
- Platform should educate, not dictate

**Platform Requirement**: Calculate automatically, show warning clearly, allow investor to proceed.

---

### Rule 6: Capital Expenditure (CapEx) Reserve

**Business Rule**: Platform must allow investor to specify CapEx reserve and use it consistently.

**CapEx Definition**: Reserve for major repairs and replacements (not routine maintenance).

**What CapEx Covers**:
- Roof replacement (every 15-20 years)
- HVAC replacement (every 12-15 years)
- Water heater (every 10-12 years)
- Appliances (every 8-10 years)
- Foundation, plumbing, electrical major repairs

**Input Methods** (platform must support both):
1. **Monthly Dollar Amount**: Investor specifies exact amount (e.g., $150/month)
2. **Percentage of Rent**: Investor specifies percentage (e.g., 5% of rent)

**Default if Not Specified**: 5% of monthly rent

**Industry Standard**: 5-10% of rent depending on property age and condition

**Where CapEx Applies**:
- ✅ Post-Refinance operating expenses (YES - included)
- ❓ Seasoning period operating expenses (CURRENT: NO - missing from code, see Issue #63 resolution findings)

**Platform Behavior**:
- Accept `monthlyCapEx` field from user input
- If not provided, fall back to percentage of rent (default 5%)
- Include in post-refinance operating expense calculations
- **Question for Architecture**: Should CapEx be included in seasoning period expenses? (TBD - Phase 2b validation)

---

### Rule 7: Refinance LTV Limits

**Business Rule**: Refinance LTV must be between 65% and 80%, default 75%.

**Market Reality**:
- **65% LTV**: Very conservative, available from all lenders
- **70% LTV**: Conservative, most conventional banks
- **75% LTV**: Standard, Fannie Mae/Freddie Mac typical maximum
- **80% LTV**: Aggressive, DSCR lenders only, higher rates
- **> 80% LTV**: Not available in market for cash-out refinance on investment properties

**Platform Behavior**:
- Allow selection between 65-80%
- Default to 75% (industry standard)
- Block if user tries to enter > 80% (not available)
- Warn if selecting 80% (mention higher rates, DSCR lender required)

**Lender Requirements by LTV**:
- 65-70%: All lenders, best rates
- 71-75%: Most lenders, standard rates
- 76-80%: DSCR lenders only, rates +0.5-1.0%

---

### Rule 8: Seasoning Period Requirements

**Business Rule**: Seasoning period must be 6-24 months, default 12 months (Fannie Mae standard).

**Options**:
- 6 months: DSCR lenders only, higher rates
- 9 months: Some DSCR lenders
- **12 months**: Fannie Mae/Freddie Mac standard (DEFAULT)
- 18 months: Conservative/strategic delay
- 24 months: Very conservative

**Platform Behavior**:
- Offer dropdown with 6, 9, 12, 18, 24 month options
- Default to 12 months
- Show warning if < 12 months: "⚠️ Fannie Mae requires 12-month seasoning (as of April 2023). Shorter periods require DSCR lender with higher interest rates."

**Industry Change** (Important):
- **Before April 2023**: 6 months was acceptable for Fannie Mae
- **After April 2023**: 12 months minimum for Fannie Mae
- Platform must reflect current standards (12 months default)

---

### Rule 9: ARV Must Exceed Purchase Price

**Business Rule**: After Repair Value MUST be greater than Purchase Price. Block analysis if not.

**Why This Is Non-Negotiable**:
- BRRRR requires forced appreciation (creating value through renovation)
- If ARV ≤ Purchase Price, there's no value creation
- Strategy would fail (can't recover capital if no equity created)

**Platform Behavior**:
- Compare ARV to Purchase Price
- If ARV ≤ Purchase Price: Block analysis with error
- Error message: "After Repair Value must be greater than Purchase Price. BRRRR strategy requires creating value through renovation. If no renovation is needed, consider traditional Buy & Hold strategy instead."

**Edge Case**: ARV = Purchase Price
- This means no forced appreciation (just market holding value)
- Wrong strategy (should be traditional rental, not BRRRR)
- Platform correctly blocks this

---

### Rule 10: Refinance Closing Costs

**Business Rule**: Refinance closing costs typically 2-3% of new loan amount, default 2.5%.

**Components**:
- Appraisal: $400-600
- Title insurance: ~0.5% of loan
- Lender fees: $500-1,000
- Recording fees: $100-300
- Other closing costs: $200-500

**Total**: Typically 2-3% of new loan amount

**Platform Behavior**:
- Default to 2.5% of new loan amount
- Allow user to override if they have specific quote
- Deduct from capital recovered (net cash out = gross cash out - closing costs)

**Example**:
- New Loan: $206,250
- Closing Costs (2.5%): $5,156
- Original Loan Balance: $138,800
- **Net Cash Out**: $206,250 - $138,800 - $5,156 = $62,294

---

## 5. INDUSTRY STANDARDS

### Lender Requirements

#### Fannie Mae
- **Seasoning Period**: 12 months minimum (changed April 2023)
- **Maximum LTV**: 75% for cash-out refinance
- **Minimum DSCR**: 1.25
- **Tenant Occupancy**: Required (cannot refinance vacant property)
- **Rental Payment History**: 6-12 months required
- **Source**: Fannie Mae Selling Guide B2-1.3-01

#### Freddie Mac
- **Seasoning Period**: 12 months minimum
- **Maximum LTV**: 75% typical
- **Minimum DSCR**: 1.20
- **Program**: CHOICERenovation for BRRRR deals
- **Source**: Freddie Mac CHOICERenovation program requirements

#### DSCR Lenders (Non-QM)
- **Seasoning Period**: 6 months possible (not guaranteed)
- **Maximum LTV**: 75-80%
- **Minimum DSCR**: 1.00-1.20 (hence the name)
- **Interest Rate Premium**: +0.5-1.5% above conventional
- **Trade-off**: Faster seasoning but higher long-term cost

### Calculation Methodologies

#### BiggerPockets
- **Source**: Brandon Turner's BRRRR calculator and methodology
- **Capital Recovery Formula**: Matches platform's approach
- **70% Rule**: Standard wholesale formula used
- **Validation**: Platform calculations align with BiggerPockets standards

#### Wall Street Prep
- **Source**: Real Estate Financial Modeling course
- **Seasoning Cost Treatment**: No vacancy during tenant-occupied period
- **NOI Calculation**: Management fee deducted from income (not added to expenses)
- **Validation**: Platform follows institutional modeling standards

#### Real Estate CPA Standards
- **Operating Expense Categories**: Platform follows proper categorization
- **Tax Treatment**: Platform calculations suitable for CPA review (with disclaimers)
- **Depreciation**: Not calculated by platform (too complex, varies by investor)

### Conservative Assumptions (Industry Best Practices)

#### Appreciation
- **Conservative**: 2-3% annually (inflation-adjusted flat)
- **Moderate**: 3-4% annually (U.S. historical average)
- **Aggressive**: 5%+ annually (hot markets only, not sustainable)
- **Platform Default**: 3% (matches historical average)

#### Rent Growth
- **Conservative**: 2-3% annually (matches inflation)
- **Moderate**: 3-4% annually
- **Aggressive**: 5%+ annually
- **Platform Default**: 3% (typically matches appreciation)

#### Vacancy Rate
- **Conservative**: 10% (1.2 months vacant per year)
- **Moderate**: 5% (0.6 months vacant per year)
- **Aggressive**: 0% (assumes never vacant - unrealistic)
- **Platform Default**: 5% for post-refinance projections

#### Maintenance + CapEx Reserves
- **New Investors**: 15% of rent combined (8% maintenance + 7% CapEx)
- **Experienced Investors**: 8-10% of rent combined
- **Platform Default**: 10% combined (5% maintenance + 5% CapEx)

---

## 6. WHAT PLATFORM DOES NOT CALCULATE

### Tax Implications

**What Platform Does NOT Do**:
- ❌ Calculate income tax liability
- ❌ Calculate depreciation schedules
- ❌ Calculate depreciation recapture on sale
- ❌ Calculate capital gains tax (short-term vs long-term)
- ❌ Model 1031 exchange scenarios
- ❌ Calculate state-specific tax implications

**Why Not**:
- Tax situation varies dramatically by investor
- Depends on: Entity structure (LLC, S-Corp, individual), tax bracket, state, other income
- Changes every year based on tax law
- Requires CPA analysis for accuracy

**What Platform Shows Instead**:
- Pre-tax returns (cash flow, IRR, total return)
- Disclaimer: "Consult tax professional for tax implications"
- Educational content about tax concepts (not tax advice)

**Investor Must Consult CPA For**:
- Entity structuring (LLC vs S-Corp vs C-Corp)
- Depreciation strategy (cost segregation opportunities)
- Tax timing (when to sell, when to 1031 exchange)
- State tax implications

### Lender Approval Guarantees

**What Platform Does NOT Do**:
- ❌ Guarantee lender will approve refinance
- ❌ Pre-qualify investor with specific lenders
- ❌ Account for credit score impact on rates
- ❌ Model lender-specific overlays and requirements

**Why Not**:
- Credit score varies by investor (platform doesn't collect this)
- Cash reserves vary (lenders require 6+ months typically)
- Debt-to-income ratio varies (other debts not known)
- Lender overlays change frequently
- Each lender has unique requirements beyond DSCR/LTV

**What Platform Shows Instead**:
- Whether DSCR meets typical lender minimums (1.25 for Fannie Mae)
- Whether LTV is within market norms (65-80%)
- General approval likelihood based on deal metrics
- Disclaimer: "Pre-qualify with lender before starting project"

### Construction Management

**What Platform Does NOT Do**:
- ❌ Project manage renovation
- ❌ Track contractor progress
- ❌ Model permit delays
- ❌ Account for material cost fluctuations
- ❌ Predict actual rehab timeline

**Why Not**:
- Contractor reliability varies wildly
- Permit timing varies by jurisdiction
- Material costs fluctuate (especially lumber, copper)
- Hidden issues discovered during demo
- Weather delays, labor shortages, etc.

**What Platform Shows Instead**:
- Suggested rehab budget based on scope
- Recommended contingency (15-20%)
- Estimated timeline based on scope
- Warning if budget seems too low for scope selected

**Investor Must Do**:
- Get 3+ contractor quotes
- Add 15-20% contingency buffer
- Have backup capital for overruns
- Build relationships with reliable contractors
- Plan for 20-30% longer timeline than estimated

### Market Timing and Forecasting

**What Platform Does NOT Do**:
- ❌ Predict when to buy (market timing)
- ❌ Forecast market crashes or booms
- ❌ Model recession scenarios
- ❌ Predict interest rate movements
- ❌ Identify "the best" markets to invest in

**Why Not**:
- Market timing is impossible to predict reliably
- Macro economic conditions are complex and uncertain
- Local market dynamics vary wildly
- Platform is deal analysis tool, not market prediction tool

**What Platform Shows Instead**:
- Deal quality analysis (is this specific property a good BRRRR?)
- Sensitivity analysis (what if ARV is 10% lower? 10% higher?)
- Conservative assumptions (3% appreciation, not boom assumptions)
- Disclaimer: "Use conservative assumptions and don't try to time the market"

---

## 7. SUCCESS METRICS

### How to Measure If Platform Achieves Business Goals

#### Investor Success Metrics

**Primary Metric: Capital Recovery Accuracy**
- **Goal**: Investor's actual capital recovery matches platform prediction within ±5%
- **How to Measure**: Survey investors 12-18 months after deal completion
- **Success Threshold**: 80%+ of investors within ±5% of predicted recovery rate

**Secondary Metric: Deal Quality Prediction**
- **Goal**: Properties platform rated "Good" or "Excellent" BRRRR perform well in reality
- **How to Measure**: Track actual investor outcomes by platform rating
- **Success Threshold**: 75%+ of "Excellent" rated deals achieve 80%+ capital recovery

**Investor Satisfaction**:
- **Goal**: Investors trust platform for BRRRR analysis
- **How to Measure**: NPS score, repeat usage, referrals
- **Success Threshold**: NPS > 50, 60%+ of users analyze 3+ properties

#### Platform Accuracy Metrics

**Calculation Accuracy**:
- **Goal**: Platform calculations match industry standards (BiggerPockets, Wall Street Prep)
- **How to Measure**: Independent validation of sample calculations
- **Success Threshold**: 95%+ alignment with professional tools

**Business Rule Compliance**:
- **Goal**: Platform follows documented business rules consistently
- **How to Measure**: Automated testing of business rules (Phase 2c - Code Validation)
- **Success Threshold**: 100% of business rules implemented correctly

**Industry Standard Alignment**:
- **Goal**: Lenders and CPAs validate platform logic
- **How to Measure**: Professional review and endorsement
- **Success Threshold**: 3+ CPAs and 2+ lenders endorse methodology

#### User Experience Metrics

**Time to First Analysis**:
- **Goal**: Investor can complete first BRRRR analysis in < 10 minutes
- **How to Measure**: Track time from signup to first analysis complete
- **Success Threshold**: 70%+ complete within 10 minutes

**Decision Confidence**:
- **Goal**: Investors feel confident making investment decisions using platform
- **How to Measure**: Post-analysis survey "How confident are you in this analysis?"
- **Success Threshold**: 80%+ report "confident" or "very confident"

**Error Prevention**:
- **Goal**: Platform prevents common BRRRR mistakes through validation and warnings
- **How to Measure**: Track how often warnings prevented bad decisions
- **Success Threshold**: 50%+ of users adjust assumptions after seeing warnings

---

## NEXT STEPS

This business requirements document serves as the foundation for:

### Phase 2b: Architecture Validation (Next)
- Compare existing platform architecture to these business requirements
- Identify gaps where architecture doesn't support business needs
- Document architectural decisions and trade-offs
- Reference: `/docs/BRRRR_ARCHITECTURE_VALIDATION.md` (to be created)

### Phase 2c: Code Validation (Final)
- Compare actual code implementation to architecture design
- Identify discrepancies (like seasoning OpEx issues, formula differences)
- Document needed fixes with business justification
- Reference: `/docs/BRRRR_CODE_VALIDATION.md` (to be created)

### Continuous Improvement
- Update this document when:
  - Business rules change (e.g., Fannie Mae updates seasoning requirements)
  - New industry standards emerge
  - User feedback reveals misunderstandings
  - CPA or lender feedback suggests improvements
- Version control: Increment version number, document changes in revision history

---

## APPENDICES

### Appendix A: Glossary of Terms

**ARV (After Repair Value)**: Estimated property value after renovation completion

**Capital Recovery Rate**: Percentage of invested capital recovered through refinance

**DSCR (Debt Service Coverage Ratio)**: Ratio of Net Operating Income to annual mortgage payments

**Forced Appreciation**: Value created through renovation (not market appreciation)

**Infinite Return**: Achieving 100%+ capital recovery (own asset with $0 invested)

**LTV (Loan-to-Value)**: Loan amount as percentage of property value

**NOI (Net Operating Income)**: Rental income minus operating expenses

**Seasoning Period**: Mandatory waiting period before refinance (6-12 months)

**70% Rule**: Maximum purchase price formula ensuring equity margin

### Appendix B: Revision History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-01-11 | Initial technical document created | Business Expert |
| 2.0 | 2026-01-11 | Complete rewrite in business language | Business Expert |

### Appendix C: Related Documents

**Technical Specifications** (for technical team):
- `BRRRR_TECHNICAL_SPECIFICATIONS.md` - Detailed formulas, data types, APIs (to be extracted)

**Architecture Documentation**:
- `BRRRR_ARCHITECTURE_VALIDATION.md` - Architecture vs requirements validation (Phase 2b)

**Code Documentation**:
- `BRRRR_CODE_VALIDATION.md` - Code vs architecture validation (Phase 2c)

**Validation Reports**:
- `BRRRR_BUSINESS_EXPERT_VALIDATION.md` - Phase 1 backend validation (95% industry accuracy)
- `BRRRR_INDUSTRY_VALIDATION.md` - Industry standards research and validation

**Issue Tracking**:
- `/docs/ISSUE_TRACKER.md` - Issues #60-66 tracking and resolution

---

**END OF BUSINESS REQUIREMENTS DOCUMENT**

**Status**: ✅ Complete - Business requirements documented in business language

**Prepared By**: Business Expert (Real Estate Investment Specialist)
**Date**: January 11, 2026
**Purpose**: Foundation for Architecture Validation (Phase 2b) and Code Validation (Phase 2c)
