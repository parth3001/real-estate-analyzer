/**
 * Issue #76 - AI Directive Language Validation (Integration Test)
 *
 * Validates that the full SFR analysis flow produces NO directive language
 * in any AI-generated content when users provide investment goals.
 *
 * This integration test simulates the exact scenario that triggered Issue #76:
 * - User analyzes a 59/100 quality property
 * - User adds goal: "$1,000 monthly cash flow"
 * - AI should provide analytical context WITHOUT saying "recommended CAUTION"
 */

import { connect TestDB, closeTestDB, clearTestDB } from '../setup/testDatabase';
import { SFRAnalyzer } from '../../analysis/SFRAnalyzer';
import { SFRData } from '../../types/propertyTypes';

describe('Issue #76 - AI Directive Language Validation (Integration)', () => {
  beforeAll(async () => {
    await connectTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
  });

  /**
   * Helper: Validate content has NO directive language
   */
  const validateNoDirectiveLanguage = (content: string, location: string) => {
    const forbiddenPatterns = [
      { pattern: /\brecommend/i, name: 'recommend' },
      { pattern: /\bcaution\b/i, name: 'CAUTION (as verdict)' },
      { pattern: /should (buy|pass|negotiate)/i, name: 'should buy/pass/negotiate' },
      { pattern: /algorithm (recommends|suggests|advises)/i, name: 'algorithm recommends' },
      { pattern: /\b(we|I) (recommend|suggest|advise)\b/i, name: 'we/I recommend' }
    ];

    forbiddenPatterns.forEach(({ pattern, name }) => {
      if (pattern.test(content)) {
        const match = content.match(pattern);
        throw new Error(
          `DIRECTIVE LANGUAGE DETECTED in ${location}:\n` +
          `Pattern: ${name}\n` +
          `Matched: "${match?.[0]}"\n` +
          `Full content: "${content}"`
        );
      }
    });
  };

  /**
   * Helper: Validate analytical language IS present
   */
  const validateAnalyticalLanguage = (content: string, location: string) => {
    const analyticalPatterns = [
      /analysis|assessment|indicates|shows|demonstrates/i
    ];

    const hasAnalytical = analyticalPatterns.some(p => p.test(content));
    if (!hasAnalytical) {
      throw new Error(
        `NO ANALYTICAL LANGUAGE in ${location}. Expected phrases like "analysis shows", "indicates", "assessment".\n` +
        `Content: "${content}"`
      );
    }
  };

  test('Full SFR analysis with user goal produces NO directive language', async () => {
    // This property triggered Issue #76: 59/100 quality with user goal "$1,000 monthly cash flow"
    const propertyData: Partial<SFRData> = {
      purchasePrice: 300000,
      downPayment: 60000,
      interestRate: 7,
      loanTerm: 30,
      monthlyRent: 2400,
      propertyTax: 3000,
      insurance: 1200,
      hoaFees: 0,
      maintenance: 2400,
      vacancy: 5,
      propertyManagement: 8,
      propertyType: 'SFR',
      squareFootage: 1800,
      bedrooms: 3,
      bathrooms: 2,
      yearBuilt: 2005,
      address: '123 Test St',
      city: 'Test City',
      state: 'TX',
      zipCode: '75001',
      // USER GOAL - This is what triggered the "recommended CAUTION" issue
      enhancedGoals: {
        strategy: '$1,000 monthly cash flow',
        portfolioStrategy: 'cash flow focused',
        riskTolerance: 'conservative',
        holdPeriod: 10
      },
      exitStrategy: {
        primaryExitStrategy: 'long-term rental',
        holdPeriod: 10
      }
    };

    console.log('\n🔍 Testing Issue #76 Scenario:');
    console.log('=====================================');
    console.log(`Property: $${propertyData.purchasePrice?.toLocaleString()}`);
    console.log(`User Goal: "${propertyData.enhancedGoals?.strategy}"`);

    const sfrAnalyzer = new SFRAnalyzer();
    const analysis = await sfrAnalyzer.analyze(propertyData as SFRData);

    expect(analysis).toBeDefined();
    expect(analysis.investmentDecision).toBeDefined();

    const decision = analysis.investmentDecision;
    const dealQuality = decision.professionalAssessment?.dealQuality ?? 0;

    console.log(`\nDeal Quality Score: ${dealQuality}/100`);
    console.log(`Monthly Cash Flow: $${Math.round(analysis.monthlyAnalysis.cashFlow)}`);

    // CRITICAL TEST: Validate goalBasedReasoning has NO directive language
    if (decision.goalBasedReasoning) {
      console.log(`\n📝 Goal-Based Reasoning:\n"${decision.goalBasedReasoning}"\n`);

      // Must NOT contain directive language
      validateNoDirectiveLanguage(decision.goalBasedReasoning, 'investmentDecision.goalBasedReasoning');

      // Must CONTAIN analytical language
      validateAnalyticalLanguage(decision.goalBasedReasoning, 'investmentDecision.goalBasedReasoning');

      // Must reference Deal Quality score
      expect(decision.goalBasedReasoning).toContain(`${dealQuality}/100`);

      console.log('✅ No directive language detected');
      console.log('✅ Analytical framing confirmed');
      console.log(`✅ Deal Quality score (${dealQuality}/100) referenced`);
    }

    // Validate primaryReason also has no directive language
    if (decision.primaryReason) {
      validateNoDirectiveLanguage(decision.primaryReason, 'investmentDecision.primaryReason');
    }

    // Validate secondaryReasons
    decision.secondaryReasons?.forEach((reason, i) => {
      validateNoDirectiveLanguage(reason, `investmentDecision.secondaryReasons[${i}]`);
    });

    // Validate keyRisks
    decision.keyRisks?.forEach((risk, i) => {
      validateNoDirectiveLanguage(risk, `investmentDecision.keyRisks[${i}]`);
    });

    console.log('\n✅ INTEGRATION TEST PASSED: Issue #76 Fixed');
    console.log('All AI-generated content uses analytical language only.\n');
  });

  test('Multiple user goal variations produce consistent analytical framing', async () => {
    const userGoals = [
      '$500 monthly cash flow',
      '$2,000 monthly cash flow',
      '12% IRR target',
      'Passive income for retirement',
      'Appreciation focus in emerging market'
    ];

    console.log('\n🔍 Testing multiple user goal variations:');

    for (const goal of userGoals) {
      const propertyData: Partial<SFRData> = {
        purchasePrice: 300000,
        downPayment: 60000,
        interestRate: 7,
        loanTerm: 30,
        monthlyRent: 2400,
        propertyTax: 3000,
        insurance: 1200,
        maintenance: 2400,
        vacancy: 5,
        propertyManagement: 8,
        propertyType: 'SFR',
        squareFootage: 1800,
        bedrooms: 3,
        bathrooms: 2,
        yearBuilt: 2005,
        address: '123 Test St',
        city: 'Test City',
        state: 'TX',
        zipCode: '75001',
        enhancedGoals: {
          strategy: goal,
          portfolioStrategy: 'balanced',
          riskTolerance: 'moderate'
        }
      };

      const sfrAnalyzer = new SFRAnalyzer();
      const analysis = await sfrAnalyzer.analyze(propertyData as SFRData);
      const decision = analysis.investmentDecision;

      console.log(`\n  Goal: "${goal}"`);

      if (decision.goalBasedReasoning) {
        // Each goal variation must have NO directive language
        validateNoDirectiveLanguage(decision.goalBasedReasoning, `Goal: "${goal}"`);
        validateAnalyticalLanguage(decision.goalBasedReasoning, `Goal: "${goal}"`);

        console.log(`  ✅ Analytical framing confirmed`);
      }
    }

    console.log('\n✅ All user goal variations passed validation\n');
  });

  test('Low quality property (30/100) avoids PASS directive', async () => {
    const propertyData: Partial<SFRData> = {
      purchasePrice: 400000,  // Overpriced
      downPayment: 80000,
      interestRate: 8.5,      // High rate
      loanTerm: 30,
      monthlyRent: 2000,      // Low rent
      propertyTax: 5000,      // High taxes
      insurance: 2000,
      maintenance: 3000,
      vacancy: 10,
      propertyManagement: 10,
      propertyType: 'SFR',
      squareFootage: 1600,
      bedrooms: 2,
      bathrooms: 1,
      yearBuilt: 1975,
      address: '456 Test St',
      city: 'Test City',
      state: 'TX',
      zipCode: '75002',
      enhancedGoals: {
        strategy: 'Cash flow positive property',
        portfolioStrategy: 'income focused'
      }
    };

    const sfrAnalyzer = new SFRAnalyzer();
    const analysis = await sfrAnalyzer.analyze(propertyData as SFRData);
    const decision = analysis.investmentDecision;
    const dealQuality = decision.professionalAssessment?.dealQuality ?? 0;

    console.log(`\n📊 Low Quality Property Test:`);
    console.log(`   Deal Quality: ${dealQuality}/100`);
    console.log(`   Expected: <35 (below professional standards)`);

    // Even for low quality deals, NO directive language
    if (decision.goalBasedReasoning) {
      validateNoDirectiveLanguage(decision.goalBasedReasoning, 'Low quality property reasoning');
      validateAnalyticalLanguage(decision.goalBasedReasoning, 'Low quality property reasoning');

      // Should NOT say "PASS" or "we recommend passing"
      expect(decision.goalBasedReasoning).not.toMatch(/\bpass\b/i);

      console.log(`   ✅ No PASS directive detected`);
      console.log(`   ✅ Analytical language used for low quality assessment`);
    }
  });

  test('Strong property (80/100) avoids BUY directive', async () => {
    const propertyData: Partial<SFRData> = {
      purchasePrice: 250000,  // Good price
      downPayment: 50000,
      interestRate: 6.5,      // Good rate
      loanTerm: 30,
      monthlyRent: 2800,      // Strong rent
      propertyTax: 2500,
      insurance: 1000,
      maintenance: 1500,
      vacancy: 5,
      propertyManagement: 8,
      propertyType: 'SFR',
      squareFootage: 2000,
      bedrooms: 4,
      bathrooms: 2,
      yearBuilt: 2015,
      address: '789 Test St',
      city: 'Test City',
      state: 'TX',
      zipCode: '75003',
      enhancedGoals: {
        strategy: 'Build wealth through appreciation and cash flow',
        portfolioStrategy: 'balanced growth'
      }
    };

    const sfrAnalyzer = new SFRAnalyzer();
    const analysis = await sfrAnalyzer.analyze(propertyData as SFRData);
    const decision = analysis.investmentDecision;
    const dealQuality = decision.professionalAssessment?.dealQuality ?? 0;

    console.log(`\n📊 Strong Property Test:`);
    console.log(`   Deal Quality: ${dealQuality}/100`);
    console.log(`   Expected: >=80 (strong fundamentals)`);

    // Even for strong deals, NO directive language
    if (decision.goalBasedReasoning) {
      validateNoDirectiveLanguage(decision.goalBasedReasoning, 'Strong property reasoning');
      validateAnalyticalLanguage(decision.goalBasedReasoning, 'Strong property reasoning');

      // Should NOT say "BUY" or "we recommend buying"
      expect(decision.goalBasedReasoning).not.toMatch(/\b(should )?buy\b/i);

      console.log(`   ✅ No BUY directive detected`);
      console.log(`   ✅ Analytical language used for strong quality assessment`);
    }
  });
});
