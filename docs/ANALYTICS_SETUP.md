# Google Analytics 4 Setup Guide

This guide will walk you through setting up Google Analytics 4 (GA4) for tracking the conversion funnel on Reanalyzr.

## 📊 What's Being Tracked

Analytics tracking has been integrated into **7 pages** focused on the conversion funnel:

### **Anonymous Pages** (4 pages)
1. **Landing Page** - Homepage with calculator (`/`)
2. **Calculator** - Calculator start/completion events
3. **Sample Analysis** - Example analysis page (`/sample-analysis`)
4. **Pricing** - Pricing comparison page (`/pricing`)

### **Auth Entry Points** (2 pages)
5. **Register Page** - Signup funnel (`/register`)
6. **Login Page** - Login events (`/login`)

**Note**: Authenticated pages (Dashboard, Portfolio, Pipeline, etc.) are NOT tracked in Phase 1. This will be added in Phase 2 after gathering initial signup funnel data.

---

## 🎯 Events Tracked

### **Page Views**
- `page_view` - Tracked on all 7 pages listed above
- Parameters: `page_title`, `page_location`, `page_path`

### **Calculator Events**
- `calculator_started` - User changes first field in calculator
- `calculator_completed` - Analysis successfully generated
- Parameters: `strategy` (brrrr/buy-hold), `deal_score` (0-100), `timestamp`

### **CTA Clicks**
- `cta_click` - User clicks Beta CTA or Sample Analysis link
- Parameters: `cta_type` (beta_signup/sample_analysis/pricing), `location` (after_results, etc.)

### **Signup Funnel Events**
- `signup_started` - User starts typing in registration form
- `signup_completed` - Account created successfully
- `signup_failed` - Registration failed
- Parameters: `source` (direct/affiliate), `error_message` (for failures), `timestamp`

### **Login Events**
- `login_success` - User logs in successfully
- `login_failed` - Login attempt failed
- Parameters: `error_message` (for failures), `timestamp`

---

## 🚀 Setup Steps

### **Step 1: Create Google Analytics 4 Account**

1. Go to [Google Analytics](https://analytics.google.com)
2. Click **"Start measuring"** (or **"Admin"** if you already have an account)
3. Create a new **Account**:
   - Account Name: `Reanalyzr`
   - Data sharing settings: Select based on your preferences
4. Create a new **Property**:
   - Property Name: `Reanalyzr Production`
   - Time zone: Your timezone (e.g., `United States/Pacific`)
   - Currency: `USD`
5. Fill in business details:
   - Industry: `Real Estate & Construction`
   - Business size: Select appropriate size
6. Business objectives: Select `Generate leads` and `Examine user behavior`

---

### **Step 2: Create Data Stream**

1. After creating the property, click **"Web"** under Platform selection
2. Configure web stream:
   - Website URL: `https://reanalyzr.com`
   - Stream name: `Reanalyzr Website`
3. **Enhanced measurement**: Leave enabled (automatic events like scroll, outbound clicks, etc.)
4. Click **"Create stream"**

---

### **Step 3: Get Your Measurement ID**

1. After creating the stream, you'll see your **Measurement ID**
   - Format: `G-XXXXXXXXXX` (starts with `G-`)
   - Example: `G-ABC123DEF4`
2. **Copy this ID** - you'll need it in the next step

---

### **Step 4: Update index.html with Your Measurement ID**

1. Open `/frontend/index.html`
2. Find lines 47-55 (Google Analytics 4 section)
3. **Replace BOTH instances** of `G-XXXXXXXXXX` with your actual Measurement ID:

```html
<!-- Google Analytics 4 -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-YOUR_ACTUAL_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-YOUR_ACTUAL_ID');
</script>
```

**Example** (if your ID is `G-ABC123DEF4`):
```html
<script async src="https://www.googletagmanager.com/gtag/js?id=G-ABC123DEF4"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-ABC123DEF4');
</script>
```

4. **Save the file**

---

### **Step 5: Deploy to Production**

1. Commit your changes:
```bash
git add frontend/index.html
git commit -m "feat: Add Google Analytics tracking with Measurement ID"
git push origin main
```

2. Deploy to Render (or your hosting provider)
3. Wait for deployment to complete (~3-5 minutes)

---

### **Step 6: Verify Tracking is Working**

1. Go to **Google Analytics** → **Reports** → **Realtime**
2. Open your deployed site in a new tab: `https://reanalyzr.com`
3. You should see **1 active user** appear in the Realtime report within 30 seconds
4. Test events:
   - Navigate to different pages → See `page_view` events
   - Use calculator → See `calculator_started` and `calculator_completed`
   - Click Beta CTA → See `cta_click` event
   - Register an account → See `signup_started` and `signup_completed`

**If you don't see events:**
- Check browser console for errors (F12)
- Verify Measurement ID is correct in `index.html`
- Disable ad blockers (they block Google Analytics)
- Try incognito/private browsing mode
- Wait 24 hours - GA4 sometimes has delays for new properties

---

## 📈 Viewing Analytics Data

### **Real-Time Reports** (immediate data)
1. Go to **Reports** → **Realtime**
2. See live users and events as they happen
3. Useful for testing and verifying tracking

### **Standard Reports** (24-48 hour delay)
1. **Acquisition** → **User acquisition** - Where users come from
2. **Engagement** → **Events** - All tracked events (calculator_started, signup_completed, etc.)
3. **Engagement** → **Pages and screens** - Most visited pages
4. **Retention** → **User retention** - How many users return

### **Custom Reports** (create your own)
1. Go to **Explore** → **Free form**
2. Drag and drop metrics and dimensions
3. Example: Signup conversion funnel
   - Dimensions: Event name
   - Metrics: Event count
   - Filter: signup_started → signup_completed

---

## 🎯 Key Metrics to Monitor (200 Signup Goal by End of 2026)

### **Conversion Funnel Metrics**
1. **Landing Page Visits** (`page_view` where page_title = 'landing')
2. **Calculator Starts** (`calculator_started` event count)
3. **Calculator Completions** (`calculator_completed` event count)
4. **Signup Starts** (`signup_started` event count)
5. **Signup Completions** (`signup_completed` event count)

### **Conversion Rates to Track**
- **Calculator Start Rate**: calculator_started / page_view (landing)
- **Calculator Completion Rate**: calculator_completed / calculator_started
- **Signup Start Rate**: signup_started / calculator_completed
- **Signup Completion Rate**: signup_completed / signup_started
- **Overall Conversion**: signup_completed / page_view (landing)

### **Monthly Signup Target**
- **Goal**: 200 signups by December 31, 2026
- **Timeline**: ~11 months (Jan 2026 - Dec 2026)
- **Required**: ~18 signups per month average

### **Sample Conversion Funnel Example**
```
1000 Landing Page Visits
  ↓ (60% start calculator)
600 Calculator Starts
  ↓ (80% complete analysis)
480 Calculator Completions
  ↓ (30% click Beta CTA)
144 Signup Starts
  ↓ (70% complete signup)
100 Signups

Overall Conversion: 10% (100/1000)
```

**If you're getting 18 signups/month with 10% conversion:**
- You need ~180 landing page visits per month
- Or ~6 visits per day

---

## 🔍 Troubleshooting

### **Events Not Appearing**
1. **Check browser console** (F12) - Look for `[Analytics]` logs in development
2. **Disable ad blockers** - uBlock Origin, AdBlock Plus block GA4
3. **Verify Measurement ID** - Must match GA4 property exactly
4. **Clear cache** - Hard reload (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)
5. **Wait 24-48 hours** - New GA4 properties sometimes have delays

### **Duplicate Events**
- React Strict Mode causes double renders in development
- This is normal and won't happen in production
- Events are deduplicated on GA4 side using timestamps

### **Real-Time Shows "0 Users"**
- GA4 Real-Time requires 30-60 seconds to update
- Try refreshing the Real-Time report
- Ensure you're visiting the correct domain (not localhost)

---

## 🛡️ Privacy & Compliance

### **Google Analytics 4 is GDPR/CCPA Compliant**
- No PII (personally identifiable information) is tracked
- Email addresses, names are NOT sent to GA4
- Only anonymous event data and user behavior

### **Ad Blockers**
- ~25-40% of users have ad blockers
- Analytics will NOT track these users
- This is expected and acceptable for conversion funnel analysis

### **Cookie Consent** (Future Enhancement)
- Phase 1: No cookie banner required (GA4 uses minimal cookies)
- Phase 2: Add cookie consent banner if targeting EU users
- Recommended tools: CookieYes, OneTrust, Termly

---

## 📚 Additional Resources

- **Google Analytics 4 Documentation**: https://support.google.com/analytics/answer/9304153
- **GA4 Event Tracking Guide**: https://support.google.com/analytics/answer/9322688
- **GA4 Realtime Report**: https://support.google.com/analytics/answer/9271392
- **Custom Reports (Explore)**: https://support.google.com/analytics/answer/9327736

---

## ✅ Next Steps After Setup

1. **Monitor for 1-2 weeks** - Gather baseline conversion data
2. **Identify drop-off points** - Where do users abandon the funnel?
3. **A/B test improvements** - Test changes to improve conversion
4. **Optimize based on data** - Use real user behavior to guide decisions

**Key Question to Answer:**
> "Where are users dropping off in the conversion funnel, and why?"

Once you have 200+ landing page visits, you'll have statistically significant data to optimize the funnel and hit your 200 signup goal by end of 2026.
