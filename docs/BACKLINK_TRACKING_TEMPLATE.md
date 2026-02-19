# Backlink Acquisition Tracking Template

**Purpose:** Track all backlink outreach efforts and acquired backlinks
**Created:** February 12, 2026
**Owner:** Parth Patel
**Update Frequency:** Weekly

---

## 📊 How to Use This Template

### **Step 1: Copy to Google Sheets or Excel**
1. Create new spreadsheet named "REanalyzr Backlink Tracker 2026"
2. Create 4 tabs:
   - Tab 1: "Outreach Tracker"
   - Tab 2: "Acquired Backlinks"
   - Tab 3: "Monthly Summary"
   - Tab 4: "Prospect Research"

### **Step 2: Update Weekly**
- Every Monday: Add new outreach from previous week
- Every Friday: Update status of pending outreach
- Monthly: Calculate Domain Authority changes, ranking improvements

### **Step 3: Track Key Metrics**
- Total backlinks acquired
- Response rate by tactic
- Domain Authority growth
- Keyword ranking improvements

---

## 📋 Tab 1: Outreach Tracker

### **Columns:**

| Column | Description | Example |
|--------|-------------|---------|
| **Outreach ID** | Unique identifier | OUT-001 |
| **Date Sent** | When email was sent | 2026-02-12 |
| **Prospect Name** | Person/company contacted | Josh Lupo |
| **Website** | Their website URL | theficouple.com |
| **Domain Authority (DA)** | Moz DA score | 35 |
| **Outreach Method** | Email/Form/Twitter/LinkedIn | Email |
| **Tactic** | Partner/Blogger/GuestPost/BrokenLink/etc | Partner Request |
| **Contact Email** | Their email address | josh@theficouple.com |
| **Template Used** | Which template from library | Template 1 - Josh Lupo |
| **Subject Line** | Email subject | Quick request: Backlink to REanalyzr |
| **Status** | Sent/Responded/Backlink Acquired/Rejected/No Response | Sent |
| **Response Date** | When they replied | 2026-02-15 |
| **Follow-Up 1 Date** | 7-day follow-up sent | 2026-02-19 |
| **Follow-Up 2 Date** | 14-day follow-up sent | 2026-02-26 |
| **Backlink Acquired?** | Yes/No | Yes |
| **Backlink URL** | Page linking to you | theficouple.com/resources |
| **Notes** | Any relevant details | Very responsive, great partner |

### **Status Values:**
- **Sent**: Email sent, waiting for response
- **Responded**: They replied (positive or negative)
- **Backlink Acquired**: They added the link (mark as success!)
- **Rejected**: They said no
- **No Response**: After 14 days, no reply
- **Negotiating**: Discussing details
- **Pending Approval**: They're considering it

### **Sample Pre-Populated Rows:**

#### **Priority #1: Josh Lupo**
```
OUT-001 | 2026-02-12 | Josh Lupo | theficouple.com | 35 | Email | Partner Request | josh@theficouple.com | Template 1 | Quick request: Backlink to REanalyzr | Sent | | | | | | Priority #1 - Already partner
```

#### **Tool Directories (Pre-populate 20)**
```
OUT-002 | 2026-02-12 | Product Hunt | producthunt.com | 92 | Submission | Tool Directory | | N/A | Submission: REanalyzr | Submitted | | | | | | Listing created
OUT-003 | 2026-02-12 | Capterra | capterra.com | 94 | Submission | Tool Directory | | N/A | Submission: REanalyzr | Submitted | | | | | | Pending review
OUT-004 | 2026-02-12 | G2 | g2.com | 91 | Submission | Tool Directory | | N/A | Submission: REanalyzr | Submitted | | | | | | Pending approval
OUT-005 | 2026-02-12 | AlternativeTo | alternativeto.net | 85 | Submission | Tool Directory | | N/A | Submission: REanalyzr | Submitted | | | | | | Listed as BP alternative
... (16 more directory rows)
```

---

## 📋 Tab 2: Acquired Backlinks

### **Columns:**

| Column | Description | Example |
|--------|-------------|---------|
| **Backlink ID** | Unique identifier | BL-001 |
| **Date Acquired** | When link went live | 2026-02-15 |
| **Source Website** | Site linking to you | theficouple.com |
| **Source URL** | Exact page with your link | theficouple.com/resources |
| **Destination URL** | Your page being linked | reanalyzr.com/rental-property-calculator |
| **Domain Authority (DA)** | Moz DA of source | 35 |
| **Page Authority (PA)** | Moz PA of source page | 28 |
| **Link Type** | dofollow / nofollow | dofollow |
| **Anchor Text** | Text of the link | free rental property calculator |
| **Link Context** | in-content / sidebar / footer / header | in-content |
| **Acquisition Method** | Partner/Blogger/GuestPost/Directory/etc | Partner Request |
| **Outreach ID** | Links to Outreach Tracker | OUT-001 |
| **Link Status** | Live / Lost / Broken | Live |
| **Last Checked** | Last verification date | 2026-02-20 |
| **SEO Value** | High / Medium / Low | High |
| **Notes** | Additional context | Placed in main resources section |

### **SEO Value Calculation:**
```
High SEO Value:
- DA 40+ + dofollow + in-content + relevant context

Medium SEO Value:
- DA 20-40 + dofollow + in-content OR sidebar
- DA 40+ + nofollow + in-content

Low SEO Value:
- DA <20 + dofollow
- Any DA + nofollow + footer
```

### **Sample Pre-Populated Row:**
```
BL-001 | 2026-02-15 | theficouple.com | theficouple.com/resources | reanalyzr.com/rental-property-calculator | 35 | 28 | dofollow | free rental property calculator | in-content | Partner Request | OUT-001 | Live | 2026-02-20 | High | Josh added to main resources page
```

---

## 📋 Tab 3: Monthly Summary

### **Section 1: Backlink Acquisition by Month**

| Month | New Backlinks | Cumulative Total | DA Growth | Target | On Track? |
|-------|---------------|------------------|-----------|--------|-----------|
| Feb 2026 | 0 | 0 | 15 (baseline) | 15 | - |
| Mar 2026 | 15 | 15 | 22 | 15 | ✅ Yes |
| Apr 2026 | 20 | 35 | 30 | 35 | ✅ Yes |
| May 2026 | 25 | 60 | 38 | 60 | ✅ Yes |
| **90-Day Total** | **60** | **60** | **38** | **60** | **✅ On Track** |

### **Section 2: Backlinks by Tactic**

| Tactic | Outreach Sent | Responses | Backlinks Acquired | Success Rate |
|--------|---------------|-----------|---------------------|--------------|
| Partner Request (Josh) | 1 | 1 | 1 | 100% |
| Tool Directories | 20 | 10 | 9 | 45% |
| Real Estate Bloggers | 30 | 5 | 3 | 10% |
| Guest Posts | 20 | 8 | 8 | 40% |
| Broken Link Building | 25 | 10 | 7 | 28% |
| Resource Pages | 50 | 6 | 5 | 10% |
| YouTube Partnerships | 16 | 12 | 8 | 50% |
| Agent Partnerships | 20 | 8 | 7 | 35% |
| **Total** | **182** | **60** | **48** | **26% avg** |

### **Section 3: Domain Authority by Source**

| DA Range | Backlinks Acquired | % of Total |
|----------|-------------------|------------|
| DA 80-100 | 5 | 8% |
| DA 60-79 | 8 | 13% |
| DA 40-59 | 12 | 20% |
| DA 20-39 | 25 | 42% |
| DA <20 | 10 | 17% |
| **Total** | **60** | **100%** |

### **Section 4: Link Type Distribution**

| Link Type | Count | % of Total |
|-----------|-------|------------|
| Dofollow | 45 | 75% |
| Nofollow | 15 | 25% |

**Target:** 70%+ dofollow (SEO value)

### **Section 5: Anchor Text Distribution**

| Anchor Text Type | Count | % of Total | Target |
|------------------|-------|------------|--------|
| Branded (REanalyzr) | 24 | 40% | 40% ✅ |
| Naked URL (reanalyzr.com) | 18 | 30% | 30% ✅ |
| Keyword (rental calculator) | 12 | 20% | 20% ✅ |
| Generic (click here) | 6 | 10% | 10% ✅ |
| **Total** | **60** | **100%** | **✅ Healthy** |

---

## 📋 Tab 4: Prospect Research

### **Purpose:** Store prospects BEFORE outreach

### **Columns:**

| Column | Description | Example |
|--------|-------------|---------|
| **Prospect ID** | Unique identifier | PROS-001 |
| **Name** | Person/company | Coach Carson |
| **Website** | Their URL | coachcarson.com |
| **Domain Authority** | Moz DA | 42 |
| **Type** | Blogger/Directory/Agent/etc | Blogger |
| **Contact Method** | Email/Form/Twitter/LinkedIn | Email |
| **Contact Info** | Email or form URL | carson@coachcarson.com |
| **Relevance** | High/Medium/Low | High |
| **Notes** | Why they're a good target | Teaches rental analysis, uses Excel |
| **Priority** | 1 (High) / 2 (Medium) / 3 (Low) | 1 |
| **Status** | Research/Ready/Contacted/Skip | Ready |
| **Added to Outreach Tracker?** | Yes/No | No |

### **Research Categories:**

**Category 1: Tool Directories (20 Targets)**
```
PROS-001 | Product Hunt | producthunt.com | 92 | Directory | Submission | N/A | High | DA 92 backlink | 1 | Ready | No
PROS-002 | Capterra | capterra.com | 94 | Directory | Submission | N/A | High | DA 94 backlink | 1 | Ready | No
... (18 more)
```

**Category 2: Real Estate Bloggers (30 Targets)**
```
PROS-021 | Coach Carson | coachcarson.com | 42 | Blogger | Email | carson@email.com | High | Teaches rental analysis | 1 | Ready | No
PROS-022 | Afford Anything | affordanything.com | 51 | Blogger | Form | contact form URL | High | FIRE + RE investing | 1 | Ready | No
... (28 more)
```

**Category 3: Guest Post Targets (20 Targets)**
```
PROS-051 | BiggerPockets Blog | biggerpockets.com | 79 | Blog | Form | submit form URL | High | Huge audience, competitive | 2 | Research | No
... (19 more)
```

**Category 4: Broken Link Targets (25 Targets)**
```
PROS-071 | [Blog Name] | example.com | 35 | Blogger | Email | email@example.com | Medium | Links to dead RentalCalc.com | 2 | Ready | No
... (24 more)
```

---

## 📊 Key Metrics to Track

### **Weekly Tracking (Every Monday)**

1. **Outreach Sent This Week**
   - Target: 10-15 emails per week
   - Actual: ___ emails sent

2. **Responses Received This Week**
   - Target: 2-3 responses (15-20% response rate)
   - Actual: ___ responses

3. **Backlinks Acquired This Week**
   - Target: 3-5 backlinks
   - Actual: ___ backlinks

4. **Follow-Ups Needed This Week**
   - 7-day follow-ups: ___ (from last week's outreach)
   - 14-day follow-ups: ___ (from 2 weeks ago)

### **Monthly Tracking (1st of each month)**

1. **Total Backlinks**
   - Month 1 Target: 15
   - Month 2 Target: 35 cumulative
   - Month 3 Target: 60 cumulative
   - Actual: ___

2. **Domain Authority**
   - Check via Moz Link Explorer
   - Baseline (Feb): ~15
   - Month 1: Target 22, Actual: ___
   - Month 2: Target 30, Actual: ___
   - Month 3: Target 38, Actual: ___

3. **Keyword Rankings** (Google Search Console)
   - "rental property calculator": Position ___
   - "brrrr calculator": Position ___
   - "cap rate calculator": Position ___

4. **Organic Traffic** (Google Analytics)
   - Total organic sessions: ___
   - Signups from organic: ___
   - Conversion rate: ___%

---

## 🎯 Success Criteria

### **Month 1 Success**
- ✅ 15 backlinks acquired
- ✅ Josh Lupo backlink live
- ✅ 5+ tool directory backlinks
- ✅ Domain Authority +5-7 points
- ✅ 50+ outreach emails sent
- ✅ 15-20% response rate

### **Month 2 Success**
- ✅ 35 total backlinks (15 + 20)
- ✅ 3-5 guest posts published
- ✅ Domain Authority 28-32
- ✅ First Page 2 ranking (#15-20) for any keyword
- ✅ 100+ organic visitors/month

### **Month 3 Success**
- ✅ 60 total backlinks
- ✅ Research report published
- ✅ Domain Authority 35-40
- ✅ First Page 1 ranking (#8-10) for long-tail keyword
- ✅ 400-800 organic visitors/month

---

## 📋 Weekly Checklist

**Every Monday Morning:**
- [ ] Review last week's outreach status
- [ ] Send 7-day follow-ups to non-responders
- [ ] Add new prospects to research tab (if needed)
- [ ] Plan this week's outreach (10-15 emails)

**Every Wednesday:**
- [ ] Send 5-7 outreach emails
- [ ] Respond to any responses from Mon-Wed

**Every Friday:**
- [ ] Send 5-7 outreach emails
- [ ] Update "Acquired Backlinks" tab with new links
- [ ] Check backlink status (are live links still live?)
- [ ] Update monthly summary metrics

---

## 🔍 Quality Control Checks

### **Weekly Link Verification (Every Friday)**
- [ ] Check 5-10 recent backlinks are still live
- [ ] Verify dofollow status hasn't changed
- [ ] Screenshot backlinks for records

### **Monthly Audit (1st of Month)**
- [ ] Audit anchor text distribution (40/30/20/10 healthy?)
- [ ] Check DA distribution (are we getting quality links?)
- [ ] Review response rates by tactic (what's working?)
- [ ] Adjust strategy based on data

---

## 📝 Notes Section

### **What's Working**
- Josh Lupo backlink: Instant success (partner relationship)
- Tool directories: 45% acceptance rate (high)
- Guest posts: 40% pitch acceptance (strong)

### **What's Not Working**
- Resource pages: Only 10% success rate (low priority)
- Cold blogger outreach: 15% response rate (expected)

### **Lessons Learned**
- Personalization matters: Generic emails get ignored
- Existing relationships convert at 80%+ (prioritize partners)
- Follow-ups work: 10-15% of follow-ups result in responses

### **Strategy Adjustments**
- Month 2: Focus more on guest posts (40% acceptance)
- Month 2: Reduce resource page outreach (low ROI)
- Month 3: Leverage B2B partnerships for YouTube backlinks

---

## 🎯 Action Items

**This Week (Week 1):**
- [ ] Email Josh Lupo for backlink (Priority #1)
- [ ] Submit to Product Hunt
- [ ] Submit to Capterra
- [ ] Submit to G2
- [ ] Submit to AlternativeTo
- [ ] Submit to 15 more directories

**Next Week (Week 2):**
- [ ] Research 30 real estate bloggers
- [ ] Check directory submission status
- [ ] Follow up with Josh if needed

**Week 3:**
- [ ] Send 15 blogger outreach emails
- [ ] 7-day follow-ups from Week 2

**Week 4:**
- [ ] Resource page targeting (20 sites)
- [ ] 7-day follow-ups from Week 3
- [ ] Monthly summary review

---

**Document Version:** 1.0
**Last Updated:** February 12, 2026
**Next Review:** Weekly (every Monday)

**Pro Tip:** Keep this spreadsheet open on Monday mornings - it's your backlink command center!
