/**
 * Resend API Attachment Test Script
 *
 * Purpose: Verify that our Resend API key supports PDF attachments
 * Runtime: ~5 seconds
 *
 * Usage:
 *   node test-resend-attachment.js
 *
 * Expected Output:
 *   ✅ Email sent successfully with PDF attachment
 *   📧 Email ID: re_abc123xyz...
 */

require('dotenv').config();
const { Resend } = require('resend');

// ============================================================
// Configuration
// ============================================================

const TEST_EMAIL = 'ppatel21@gmail.com'; // ← CHANGE THIS to your email
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@reanalyzr.com';

// ============================================================
// Create a Simple Test PDF Buffer
// ============================================================

function createTestPdfBuffer() {
  // This is a minimal valid PDF file (not using React-PDF yet, just testing Resend)
  // Real PDF starts with %PDF and ends with %%EOF
  const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/Font <<
/F1 <<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
>>
>>
>>
endobj
4 0 obj
<<
/Length 44
>>
stream
BT
/F1 24 Tf
100 700 Td
(Resend Test PDF) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000317 00000 n
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
409
%%EOF`;

  return Buffer.from(pdfContent, 'utf-8');
}

// ============================================================
// Test Resend API with Attachment
// ============================================================

async function testResendAttachment() {
  console.log('🔍 Testing Resend API with PDF attachment...\n');

  // Step 1: Check environment variables
  if (!process.env.RESEND_API_KEY) {
    console.error('❌ ERROR: RESEND_API_KEY not found in environment variables');
    console.error('   Make sure you have RESEND_API_KEY in your .env file\n');
    process.exit(1);
  }

  if (TEST_EMAIL === 'YOUR_EMAIL_HERE@gmail.com') {
    console.error('❌ ERROR: Please update TEST_EMAIL in this script to your actual email address\n');
    process.exit(1);
  }

  console.log('✅ Environment variables loaded');
  console.log(`   API Key: ${process.env.RESEND_API_KEY.substring(0, 10)}...`);
  console.log(`   From Email: ${FROM_EMAIL}`);
  console.log(`   Test Email: ${TEST_EMAIL}\n`);

  // Step 2: Initialize Resend
  const resend = new Resend(process.env.RESEND_API_KEY);

  // Step 3: Create test PDF
  const pdfBuffer = createTestPdfBuffer();
  console.log('✅ Test PDF created');
  console.log(`   Size: ${pdfBuffer.length} bytes\n`);

  // Step 4: Send email with attachment
  console.log('📤 Sending test email with PDF attachment...');

  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: TEST_EMAIL,
      subject: '✅ Resend Attachment Test - REanalyzr',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2196F3;">Resend Attachment Test Successful! ✅</h1>

          <p>If you're reading this email and can see the attached PDF, then your Resend API key <strong>fully supports PDF attachments</strong>.</p>

          <h2>What This Means:</h2>
          <ul>
            <li>✅ Your Resend API key is working correctly</li>
            <li>✅ PDF attachments are supported</li>
            <li>✅ You're ready to implement Feature #14</li>
          </ul>

          <h2>Next Steps:</h2>
          <ol>
            <li>Open the attached PDF to verify it displays correctly</li>
            <li>If the PDF opens and shows "Resend Test PDF", you're all set!</li>
            <li>Run the React-PDF test next: <code>node test-react-pdf.js</code></li>
          </ol>

          <hr style="margin: 20px 0; border: none; border-top: 1px solid #ccc;">

          <p style="color: #666; font-size: 12px;">
            This is an automated test email from REanalyzr Feature #14 implementation.
          </p>
        </div>
      `,
      attachments: [
        {
          filename: 'resend-test.pdf',
          content: pdfBuffer,
        },
      ],
    });

    console.log('✅ Email sent successfully!\n');
    console.log('📧 Email Details:');
    console.log(`   Email ID: ${result.data.id}`);
    console.log(`   Recipient: ${TEST_EMAIL}`);
    console.log(`   Attachment: resend-test.pdf (${pdfBuffer.length} bytes)\n`);

    console.log('🎉 SUCCESS! Your Resend API key supports PDF attachments.\n');
    console.log('Next Steps:');
    console.log('1. Check your email inbox (might be in spam)');
    console.log('2. Open the attached PDF to verify it displays correctly');
    console.log('3. If PDF opens successfully, run: node test-react-pdf.js\n');

  } catch (error) {
    console.error('❌ FAILED to send email with attachment\n');
    console.error('Error Details:');
    console.error(`   Type: ${error.name}`);
    console.error(`   Message: ${error.message}`);

    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Response: ${JSON.stringify(error.response.data, null, 2)}`);
    }

    console.error('\nPossible Issues:');
    console.error('1. Invalid RESEND_API_KEY (check .env file)');
    console.error('2. Resend account not verified');
    console.error('3. From email domain not verified in Resend');
    console.error('4. API key tier does not support attachments (unlikely)\n');

    process.exit(1);
  }
}

// ============================================================
// Run Test
// ============================================================

testResendAttachment();
