# Feature #14 - Phase 0 Validation Tests

**Purpose**: Verify that Resend API and React-PDF work correctly before implementing the full feature.

**Time Required**: 10 minutes

---

## 🧪 Test 1: Resend Attachment Support

**What it tests**: Can our Resend API key send emails with PDF attachments?

### Steps:

1. **Edit the test file**:
   ```bash
   cd backend
   nano test-resend-attachment.js  # or use your editor
   ```

2. **Change line 16** to your email:
   ```javascript
   const TEST_EMAIL = 'your.email@gmail.com'; // ← Change this
   ```

3. **Run the test**:
   ```bash
   node test-resend-attachment.js
   ```

### Expected Output:

```
🔍 Testing Resend API with PDF attachment...

✅ Environment variables loaded
   API Key: re_abc123...
   From Email: noreply@reanalyzr.com
   Test Email: your.email@gmail.com

✅ Test PDF created
   Size: 409 bytes

📤 Sending test email with PDF attachment...
✅ Email sent successfully!

📧 Email Details:
   Email ID: re_xyz789...
   Recipient: your.email@gmail.com
   Attachment: resend-test.pdf (409 bytes)

🎉 SUCCESS! Your Resend API key supports PDF attachments.
```

### Verify:

- [ ] Check your email inbox (might be in spam folder)
- [ ] Email subject: "✅ Resend Attachment Test - REanalyzr"
- [ ] Email has a PDF attachment named `resend-test.pdf`
- [ ] PDF opens and displays "Resend Test PDF"

### If It Fails:

**Error: `RESEND_API_KEY not found`**
- Make sure your `.env` file has `RESEND_API_KEY=re_...`
- The `.env` file should be in the `/backend` directory

**Error: `Invalid API key`**
- Check that your API key is correct in `.env`
- Login to Resend dashboard to verify your API key

**Error: `From email domain not verified`**
- Login to Resend dashboard
- Verify your sending domain (reanalyzr.com)

---

## 🧪 Test 2: React-PDF Generation

**What it tests**: Can we generate professional PDFs with React components?

### Steps:

1. **Install React-PDF** (if not already installed):
   ```bash
   cd backend
   npm install @react-pdf/renderer
   ```

2. **Run the test**:
   ```bash
   node test-react-pdf.js
   ```

### Expected Output:

```
🔍 Testing React-PDF generation...

📄 Creating PDF document with React components...
⚙️  Rendering PDF to buffer...
✅ PDF generated successfully!

📊 Generation Metrics:
   Duration: 342ms
   File Size: 12 KB
   Buffer Length: 12,345 bytes

✅ Test PDF saved to: test-analysis.pdf

⚡ Performance Assessment:
   ✅ EXCELLENT: 342ms is well below target (P95 < 1000ms)

📦 File Size Assessment:
   ✅ EXCELLENT: 12KB is well within target (< 300KB)

🎉 SUCCESS! React-PDF is working correctly.
```

### Verify:

- [ ] File `test-analysis.pdf` created in `/backend` directory
- [ ] Open the PDF (should show a property analysis)
- [ ] Check that all numbers display correctly
- [ ] Check that the layout looks professional
- [ ] Generation time < 1000ms
- [ ] File size < 300KB

### If It Fails:

**Error: `Cannot find module '@react-pdf/renderer'`**
- Run: `npm install @react-pdf/renderer`

**Error: `Invalid React component`**
- This shouldn't happen with the test script
- If it does, there might be a version compatibility issue
- Check Node.js version (should be 18+)

---

## ✅ Phase 0 Complete Checklist

After running both tests successfully:

- [ ] ✅ Resend test email received with PDF attachment
- [ ] ✅ PDF attachment opens correctly
- [ ] ✅ React-PDF generated test-analysis.pdf
- [ ] ✅ PDF displays property analysis correctly
- [ ] ✅ Generation time < 1000ms
- [ ] ✅ File size reasonable (< 300KB)

**If all checks pass**: You're 100% ready to implement Feature #14! 🎉

---

## 🚀 Next Steps

1. **Review Implementation Guide**:
   ```bash
   open docs/FEATURE_14_IMPLEMENTATION_GUIDE.md
   ```

2. **Begin Day 1: Backend Foundation**:
   - Create `/backend/src/types/pdf.types.ts`
   - Create `/backend/src/models/AnonymousPdfRequest.ts`
   - Create `/backend/src/middleware/rateLimiter.ts`

3. **Follow 3-4 day timeline** from Executive Summary

---

## 🔍 Troubleshooting

### Both tests pass but you still have concerns?

**Question: "What if Resend has attachment size limits?"**
- Resend supports up to 40MB attachments
- Our PDFs will be 100-300KB (well below limit)
- No concerns here

**Question: "What if React-PDF doesn't match our screen design?"**
- The implementation guide uses Material-UI-like styling
- React-PDF supports flexbox, colors, borders, fonts
- We can match the screen design closely (95%+ accuracy)

**Question: "What about memory usage?"**
- Test your memory: `process.memoryUsage().heapUsed` before/after PDF generation
- Expected: ~2MB per generation
- Render free tier: 512MB (can handle 250+ concurrent generations)

### Need more help?

1. Check `/docs/FEATURE_14_IMPLEMENTATION_GUIDE.md` Section 15 (Troubleshooting)
2. Review Resend documentation: https://resend.com/docs/send-with-nodejs
3. Review React-PDF documentation: https://react-pdf.org/

---

**Test Script Version**: 1.0
**Last Updated**: 2026-02-28
**Estimated Runtime**: 10 minutes total
