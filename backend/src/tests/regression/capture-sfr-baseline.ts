/**
 * SFR Baseline Capture Script - Story 2.4
 *
 * Purpose: Capture current SFR analysis output BEFORE implementing Story 2.4 changes
 * This baseline will be used to validate that SFR functionality remains 100% unchanged
 * after integrating MFDecisionEngine into the controller.
 *
 * Usage: npx ts-node backend/src/tests/regression/capture-sfr-baseline.ts
 */

import { SFRAnalyzer } from '../../analysis';
import { InvestmentDecisionEngine } from '../../services/investment/investmentDecisionEngine';
import { mockDealData } from '../fixtures/testData';
import { writeFileSync } from 'fs';
import { join } from 'path';

async function captureSFRBaseline() {
  console.log('🧪 QE ENGINEER: Capturing SFR baseline BEFORE Story 2.4...\n');

  try {
    // Step 1: Analyze SFR property using current implementation
    console.log('📊 Step 1: Running SFR analysis...');
    const assumptions = mockDealData.longTermAssumptions;

    const analyzer = new SFRAnalyzer(mockDealData as any, assumptions);
    const analysis = await analyzer.analyzeWithMarketIntelligence();

    console.log('✅ SFR analysis complete');
    console.log(`   Monthly Cash Flow: $${analysis.monthlyAnalysis?.cashFlow?.toFixed(2)}`);
    console.log(`   Cap Rate: ${analysis.keyMetrics?.capRate?.toFixed(2)}%`);
    console.log(`   IRR: ${analysis.keyMetrics?.irr?.toFixed(2)}%`);

    // Step 2: Generate investment decision using legacy engine
    console.log('\n🎯 Step 2: Generating investment decision (legacy engine)...');
    const decisionEngine = new InvestmentDecisionEngine();

    const userContext = {
      availableCash: mockSFRProperty.downPayment + mockSFRProperty.closingCosts || 90000,
      experienceLevel: 'intermediate' as const,
      riskTolerance: 'moderate' as const,
      investmentGoals: 'balanced' as const
    };

    const marketIntelligence = {
      marketData: analysis.marketData,
      marketInsights: analysis.marketInsights || null,
      investmentTiming: analysis.investmentTiming || null
    };

    const decision = await decisionEngine.generateInvestmentDecision(
      mockSFRProperty,
      analysis,
      null, // predictions
      marketIntelligence,
      userContext,
      {} // enhancedGoals
    );

    console.log('✅ Investment decision generated');
    console.log(`   Verdict: ${decision.verdict}`);
    console.log(`   Deal Quality: ${decision.professionalAssessment?.dealQuality}/100`);
    console.log(`   Confidence: ${decision.confidence}%`);
    console.log(`   Walk-Away Price: $${decision.marketPosition?.walkAwayPrice?.toLocaleString()}`);

    // Step 3: Create baseline snapshot
    console.log('\n📸 Step 3: Creating baseline snapshot...');
    const baseline = {
      capturedAt: new Date().toISOString(),
      story: 'PRE-2.4',
      testProperty: {
        propertyName: mockSFRProperty.propertyName,
        propertyType: mockSFRProperty.propertyType,
        purchasePrice: mockSFRProperty.purchasePrice,
        monthlyRent: mockSFRProperty.monthlyRent,
        downPayment: mockSFRProperty.downPayment
      },
      investmentDecision: {
        verdict: decision.verdict,
        confidence: decision.confidence,
        primaryReason: decision.primaryReason,
        marketPosition: {
          walkAwayPrice: decision.marketPosition?.walkAwayPrice,
          pricingContext: decision.marketPosition?.pricingContext
        },
        professionalAssessment: {
          dealQuality: decision.professionalAssessment?.dealQuality,
          cashFlowScore: decision.professionalAssessment?.cashFlowScore,
          irrScore: decision.professionalAssessment?.irrScore,
          capRateScore: decision.professionalAssessment?.capRateScore,
          marketStrengthScore: decision.professionalAssessment?.marketStrengthScore,
          debtStructureScore: decision.professionalAssessment?.debtStructureScore,
          exitStrategyScore: decision.professionalAssessment?.exitStrategyScore,
          propertyRiskScore: decision.professionalAssessment?.propertyRiskScore
        }
      },
      keyMetrics: {
        monthlyRent: analysis.monthlyAnalysis?.rental?.totalIncome,
        monthlyExpenses: analysis.monthlyAnalysis?.expenses?.totalExpenses,
        monthlyCashFlow: analysis.monthlyAnalysis?.cashFlow,
        capRate: analysis.keyMetrics?.capRate,
        cashOnCashReturn: analysis.keyMetrics?.cashOnCashReturn,
        irr: analysis.keyMetrics?.irr,
        dscr: analysis.keyMetrics?.dscr,
        totalInvestment: analysis.keyMetrics?.totalInvestment
      }
    };

    // Step 4: Save baseline to file
    const baselinePath = join(__dirname, 'sfr-baseline.json');
    writeFileSync(baselinePath, JSON.stringify(baseline, null, 2));

    console.log('✅ Baseline snapshot saved');
    console.log(`   Location: ${baselinePath}`);
    console.log('\n' + '='.repeat(70));
    console.log('📋 BASELINE SUMMARY');
    console.log('='.repeat(70));
    console.log(`Property: ${baseline.testProperty.propertyName}`);
    console.log(`Purchase Price: $${baseline.testProperty.purchasePrice?.toLocaleString()}`);
    console.log(`Monthly Rent: $${baseline.testProperty.monthlyRent?.toLocaleString()}`);
    console.log('');
    console.log(`Verdict: ${baseline.investmentDecision.verdict}`);
    console.log(`Deal Quality: ${baseline.investmentDecision.professionalAssessment.dealQuality}/100`);
    console.log(`Walk-Away Price: $${baseline.investmentDecision.marketPosition.walkAwayPrice?.toLocaleString()}`);
    console.log('');
    console.log(`Monthly Cash Flow: $${baseline.keyMetrics.monthlyCashFlow?.toFixed(2)}`);
    console.log(`Cap Rate: ${baseline.keyMetrics.capRate?.toFixed(2)}%`);
    console.log(`IRR: ${baseline.keyMetrics.irr?.toFixed(2)}%`);
    console.log(`DSCR: ${baseline.keyMetrics.dscr?.toFixed(2)}`);
    console.log('='.repeat(70));
    console.log('\n✅ SUCCESS: SFR baseline captured for regression testing');
    console.log('📝 Next Step: Senior Engineer can now implement Story 2.4');
    console.log('⚠️  IMPORTANT: Run regression tests after EVERY code change!\n');

  } catch (error) {
    console.error('\n❌ ERROR capturing baseline:', error);
    console.error('\nStack trace:', (error as Error).stack);
    process.exit(1);
  }
}

// Run the baseline capture
captureSFRBaseline();
