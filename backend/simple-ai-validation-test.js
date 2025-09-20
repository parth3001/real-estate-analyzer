/**
 * QE Engineer: Simple AI Validation Test
 * Quick validation to test AI independent calculation approach
 */

const OpenAI = require('openai');
require('dotenv').config();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const AI_PROMPT = `
You are a real estate financial analyst. Calculate these metrics for a property:

Property: $300,000 purchase price, 20% down ($60,000), 7% interest, 30 years
Monthly rent: $2,500
Property tax: 1.2% annually ($3,600/year = $300/month)
Insurance: 0.5% annually ($1,500/year = $125/month)
Maintenance: $200/month
Property management: 8% of rent ($200/month)
Vacancy rate: 5%

Calculate and return ONLY JSON format:
{
  "monthlyMortgage": 1599.25,
  "capRate": 5.2,
  "monthlyCashFlow": 475.75,
  "verdict": "BUY"
}

Use standard formulas:
- Monthly mortgage: PMT formula for $240k loan
- Cap rate: (Annual NOI / Purchase Price) × 100
- NOI = (Monthly rent × 12 × 0.95) - (Annual operating expenses, NO mortgage)
- Monthly cash flow = Effective monthly income - All monthly expenses
`;

async function testAIValidation() {
  try {
    console.log('🤖 QE ENGINEER: Simple AI Validation Test');
    console.log('Testing basic AI calculation capability...');

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "user", content: AI_PROMPT }
      ],
      temperature: 0.1,
      max_tokens: 500
    });

    const response = completion.choices[0].message.content;
    console.log('\\n🤖 AI Response:');
    console.log(response);

    // Try to parse JSON (handle markdown code blocks)
    try {
      // Remove markdown code block markers
      let cleanResponse = response.replace(/```json\\n?/g, '').replace(/```/g, '');
      console.log('Debug - cleaned response:', cleanResponse);

      const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
      console.log('Debug - JSON match:', jsonMatch ? jsonMatch[0] : 'No match');

      if (jsonMatch) {
        const aiResults = JSON.parse(jsonMatch[0]);
        console.log('\\n✅ AI Results Parsed:');
        console.log(`   Monthly Mortgage: $${aiResults.monthlyMortgage}`);
        console.log(`   Cap Rate: ${aiResults.capRate}%`);
        console.log(`   Monthly Cash Flow: $${aiResults.monthlyCashFlow}`);
        console.log(`   Verdict: ${aiResults.verdict}`);
        return true;
      } else {
        console.log('❌ No JSON match found');
        return false;
      }
    } catch (e) {
      console.log('❌ JSON parsing failed:', e.message);
      return false;
    }

  } catch (error) {
    console.error('❌ AI API Error:', error.message);
    return false;
  }
}

if (require.main === module) {
  testAIValidation()
    .then(success => {
      console.log(`\\n🎯 Simple AI Test: ${success ? 'SUCCESS' : 'FAILURE'}`);
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Error:', error.message);
      process.exit(1);
    });
}