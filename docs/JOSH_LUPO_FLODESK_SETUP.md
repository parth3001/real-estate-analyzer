# Josh Lupo Flodesk Integration Setup Guide

## Overview
This guide explains how to connect your Flodesk email capture page to your custom Reanalyzr landing page at `theficouple.reanalyzr.com`.

## Quick Setup (2 Minutes)

### Step 1: Update Your Flodesk Thank You Page Redirect

In your Flodesk form settings (https://tiny-band-666.myflodesk.com/03bb499a-6150-41dc-aec3-576542ddfa36):

1. Go to **Form Settings** → **Thank You Page**
2. Select **Redirect to URL**
3. Paste this redirect URL:

```
https://theficouple.reanalyzr.com?email={{email}}&name={{name}}
```

**Important**: The `{{email}}` and `{{name}}` are Flodesk merge tags - Flodesk will automatically replace them with the subscriber's actual email and name.

### Step 2: Test the Flow

1. Go to your Flodesk page: https://tiny-band-666.myflodesk.com/03bb499a-6150-41dc-aec3-576542ddfa36
2. Enter test email/name (use your own email)
3. Submit the form
4. You should be redirected to theficouple.reanalyzr.com with:
   - Personalized welcome: "Welcome, Josh! 👋" (using the name you entered)
   - Email and name pre-filled when you click "Start Free Analysis"

---

## User Flow After Integration

### What Your Subscribers Experience:

1. **Your Flodesk Page** (https://tiny-band-666.myflodesk.com/...)
   - Subscriber enters email and name
   - Clicks submit

2. **Automatic Redirect to Your Landing Page** (theficouple.reanalyzr.com)
   - Sees personalized welcome: "Welcome, [FirstName]! 👋"
   - Sees your branded landing page with trust signals
   - Clicks "Start Free Analysis" button

3. **Pre-Filled Signup Form**
   - Email already filled in (from Flodesk)
   - First name already filled in
   - Last name already filled in (if provided)
   - Subscriber only needs to create a password
   - Automatically tracked as YOUR referral (JOSH_LUPO affiliate code)

4. **Ready to Analyze Deals**
   - Gets 10 free analyses (instead of standard 3)
   - Attribution badge shows "Recommended by The FI Couple" throughout their journey
   - All their signups tracked to your affiliate account

---

## Alternative Setup Options

### Option A: Landing Page First (RECOMMENDED)
**Redirect URL**: `https://theficouple.reanalyzr.com?email={{email}}&name={{name}}`

**Pros**:
- Subscribers see your branded landing page with trust signals
- Personalized welcome message builds connection
- Explains what Reanalyzr does before signup
- Higher conversion due to warm introduction

**Cons**:
- Extra click (landing page → signup)

### Option B: Direct to Signup (FASTER)
**Redirect URL**: `https://theficouple.reanalyzr.com/register?email={{email}}&name={{name}}`

**Pros**:
- One less click
- Faster time to account creation

**Cons**:
- Skips branded landing page
- Less context for what they're signing up for
- Lower conversion for cold subscribers

**Our Recommendation**: Use **Option A** (landing page first). The personalized welcome and trust signals significantly increase conversion rates, especially for subscribers who may not remember signing up on your Flodesk page.

---

## Testing Your Setup

### Test Checklist:

1. ✅ **Test Flodesk Form**
   - Go to your Flodesk page
   - Enter test email/name
   - Verify redirect works

2. ✅ **Verify Personalization**
   - Check that "Welcome, [YourName]! 👋" appears
   - Confirm it's using the name you entered in Flodesk

3. ✅ **Test Pre-Filled Signup**
   - Click "Start Free Analysis"
   - Verify email is pre-filled
   - Verify first/last name are pre-filled
   - Create a password and complete signup

4. ✅ **Confirm Affiliate Tracking**
   - After signup, you should see "Recommended by The FI Couple" badge in header
   - User should get 10 free analyses (check dashboard)

---

## Troubleshooting

### Issue: Redirect Not Working
**Solution**: Make sure you're using the EXACT URL format including merge tags:
```
https://theficouple.reanalyzr.com?email={{email}}&name={{name}}
```

### Issue: Name Not Pre-Filling
**Possible Cause**: Flodesk form doesn't collect "name" field
**Solution**: In Flodesk form builder, ensure you have a "Name" field (it can be "First Name" or "Full Name")

### Issue: Email Not Pre-Filling
**Possible Cause**: Typo in merge tag
**Solution**: Make sure it's `{{email}}` not `{email}` or `{{Email}}`

---

## What Happens Behind the Scenes

When someone signs up through your Flodesk page:

1. **Affiliate Code Captured**: User gets tagged with `JOSH_LUPO` affiliate code
2. **Enhanced Free Tier**: Gets 10 free analyses instead of 3
3. **Attribution Tracking**: All their activity tracked to your partnership
4. **Badge Visibility**: "Recommended by The FI Couple" shows throughout their journey
5. **Future Payment Integration**: When we add payment features, you'll automatically get credit for referrals

---

## Example URLs

### Landing Page with Pre-Fill (Recommended):
```
https://theficouple.reanalyzr.com?email=investor@example.com&name=Sarah%20Johnson
```
Result: Shows landing page, personalized "Welcome, Sarah! 👋"

### Direct to Signup with Pre-Fill:
```
https://theficouple.reanalyzr.com/register?email=investor@example.com&name=Sarah%20Johnson
```
Result: Skips landing, goes straight to signup form with email/name filled

### Landing Page WITHOUT Pre-Fill (If Someone Shares Your Link):
```
https://theficouple.reanalyzr.com
```
Result: Shows landing page, no personalization, but still tracks as your referral

---

## Support

If you run into any issues or have questions:
- Email: parth@thereanalyzr.com
- Test thoroughly before announcing to your audience
- We can hop on a quick call to walk through setup if needed

---

## Next Steps After Setup

1. **Test the Full Flow** - Go through it yourself to see the experience
2. **Promote to Your Audience** - Share your Flodesk page with your community
3. **Monitor Results** - We'll provide affiliate dashboard in future (for now, we can send you weekly reports)
4. **Feedback Loop** - Let us know what your users think so we can optimize

---

## Your Custom Branding Summary

**Subdomain**: theficouple.reanalyzr.com
**Affiliate Code**: JOSH_LUPO
**Free Analyses**: 10 (vs standard 3)
**Badge**: "Recommended by The FI Couple"
**Landing Page**: Custom branded with your colors and messaging

Ready to launch! 🚀
