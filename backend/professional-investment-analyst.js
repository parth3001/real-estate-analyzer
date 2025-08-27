#!/usr/bin/env node

/**
 * Professional Investment Analyst Agent
 * 
 * Acts as a $20M+ portfolio institutional investor to systematically evaluate
 * the platform's Investment Decision Engine reliability across all stored properties.
 * 
 * Purpose:
 * - Validate decision engine accuracy vs professional standards
 * - Identify patterns in false positives/negatives
 * - Generate calibration recommendations
 * - Create comprehensive reliability report
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Professional Investment Criteria (Institutional Standards)
const PROFESSIONAL_CRITERIA = {
  // Cash Flow Requirements
  MIN_MONTHLY_CASH_FLOW: 200,        // Minimum $200/month positive cash flow
  MIN_CASH_FLOW_BUFFER: 250,         // Preferred $250+ buffer for expenses
  
  // Return Requirements  
  MIN_CAP_RATE: 6.0,                 // 6%+ cap rate minimum
  MIN_CASH_ON_CASH: 8.0,             // 8%+ cash-on-cash return minimum
  EXCELLENT_CASH_ON_CASH: 12.0,      // 12%+ considered excellent
  
  // Risk Metrics
  MIN_DSCR: 1.25,                    // 1.25+ debt service coverage
  STRONG_DSCR: 1.5,                  // 1.5+ considered strong
  MAX_EXPENSE_RATIO: 50.0,           // <50% operating expense ratio
  
  // Market Standards
  MIN_1_PERCENT_RULE: 1.0,           // 1%+ rent-to-price ratio
  MAX_BREAK_EVEN_OCCUPANCY: 85.0,    // <85% break-even occupancy
  
  // Long-term Performance
  MIN_IRR: 10.0,                     // 10%+ IRR minimum
  EXCELLENT_IRR: 15.0,               // 15%+ IRR excellent
  MIN_10_YEAR_ROI: 150.0,           // 150%+ total ROI over 10 years
};

class ProfessionalInvestmentAnalyst {
  constructor() {
    this.dealSchema = new mongoose.Schema({}, { strict: false });
    this.Deal = mongoose.model('Deal', this.dealSchema);
    this.results = [];
    this.summary = {
      total_properties: 0,
      decision_agreement: 0,
      false_positives: 0,      // Platform says BUY/NEGOTIATE, should be PASS
      false_negatives: 0,      // Platform says PASS/NEGOTIATE, should be BUY
      correct_decisions: 0,
      accuracy_rate: 0
    };
  }

  async connectDatabase() {
    try {
      await mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
      console.log('✅ Connected to MongoDB Atlas');
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
      process.exit(1);
    }
  }

  // Professional assessment based on institutional investment criteria
  assessPropertyProfessionally(property) {
    const analysis = property.analysis;
    if (!analysis) {
      return { verdict: 'NO_ANALYSIS', confidence: 0, reasoning: ['No analysis data available'] };
    }

    const metrics = {
      monthlyAmount: analysis.monthlyAnalysis?.cashFlow || 0,
      capRate: (analysis.keyMetrics?.capRate || 0) * 100,
      cashOnCash: (analysis.keyMetrics?.cashOnCashReturn || 0) * 100,
      dscr: analysis.keyMetrics?.dscr || 0,
      expenseRatio: analysis.operatingExpenseRatio || 50,
      irr: analysis.longTermAnalysis?.exitAnalysis?.irr || 0,
      totalROI: analysis.longTermAnalysis?.exitAnalysis?.totalROI || 0,
      rentToPrice: (property.monthlyRent / property.purchasePrice) * 100 || 0
    };

    let score = 0;
    let reasoning = [];
    let concerns = [];
    let strengths = [];

    // Cash Flow Assessment (35 points)
    if (metrics.monthlyAmount > PROFESSIONAL_CRITERIA.MIN_CASH_FLOW_BUFFER) {
      score += 35;
      strengths.push(`Strong cash flow buffer: $${metrics.monthlyAmount}/month`);
    } else if (metrics.monthlyAmount > PROFESSIONAL_CRITERIA.MIN_MONTHLY_CASH_FLOW) {
      score += 25;
      reasoning.push(`Adequate cash flow: $${metrics.monthlyAmount}/month`);
    } else if (metrics.monthlyAmount > 0) {
      score += 15;
      concerns.push(`Minimal cash flow: $${metrics.monthlyAmount}/month`);
    } else {
      concerns.push(`Negative cash flow: $${metrics.monthlyAmount}/month`);
    }

    // Return Assessment (30 points)
    if (metrics.cashOnCash >= PROFESSIONAL_CRITERIA.EXCELLENT_CASH_ON_CASH) {
      score += 30;
      strengths.push(`Excellent cash-on-cash: ${metrics.cashOnCash.toFixed(2)}%`);
    } else if (metrics.cashOnCash >= PROFESSIONAL_CRITERIA.MIN_CASH_ON_CASH) {
      score += 20;
      strengths.push(`Good cash-on-cash: ${metrics.cashOnCash.toFixed(2)}%`);
    } else if (metrics.cashOnCash >= 5.0) {
      score += 10;
      reasoning.push(`Below-target cash-on-cash: ${metrics.cashOnCash.toFixed(2)}%`);
    } else {
      concerns.push(`Poor cash-on-cash: ${metrics.cashOnCash.toFixed(2)}%`);
    }

    if (metrics.capRate >= PROFESSIONAL_CRITERIA.MIN_CAP_RATE) {
      score += 10;
      strengths.push(`Strong cap rate: ${metrics.capRate.toFixed(2)}%`);
    } else {
      concerns.push(`Below-market cap rate: ${metrics.capRate.toFixed(2)}%`);
    }

    // Risk Assessment (20 points)
    if (metrics.dscr >= PROFESSIONAL_CRITERIA.STRONG_DSCR) {
      score += 20;
      strengths.push(`Strong debt coverage: ${metrics.dscr.toFixed(2)}`);
    } else if (metrics.dscr >= PROFESSIONAL_CRITERIA.MIN_DSCR) {
      score += 15;
      reasoning.push(`Adequate debt coverage: ${metrics.dscr.toFixed(2)}`);
    } else {
      concerns.push(`Weak debt coverage: ${metrics.dscr.toFixed(2)}`);
    }

    // Long-term Performance (15 points)
    if (metrics.irr >= PROFESSIONAL_CRITERIA.EXCELLENT_IRR) {
      score += 15;
      strengths.push(`Exceptional IRR: ${metrics.irr.toFixed(2)}%`);
    } else if (metrics.irr >= PROFESSIONAL_CRITERIA.MIN_IRR) {
      score += 10;
      strengths.push(`Good IRR: ${metrics.irr.toFixed(2)}%`);
    } else if (metrics.irr > 0) {
      score += 5;
      reasoning.push(`Below-target IRR: ${metrics.irr.toFixed(2)}%`);
    } else {
      concerns.push(`Poor long-term returns`);
    }

    // Determine professional verdict
    let professionalVerdict;
    let confidence;
    
    if (score >= 80) {
      professionalVerdict = 'BUY';
      confidence = Math.min(95, 75 + (score - 80));
    } else if (score >= 60) {
      professionalVerdict = 'NEGOTIATE';
      confidence = Math.min(80, 50 + (score - 60));
    } else {
      professionalVerdict = 'PASS';
      confidence = Math.min(90, 30 + Math.max(0, 60 - score));
    }

    return {
      verdict: professionalVerdict,
      confidence,
      score,
      metrics,
      reasoning: [...strengths, ...reasoning, ...concerns],
      strengths,
      concerns
    };
  }

  // Compare platform vs professional assessment
  compareAssessments(platformVerdict, professionalAssessment, property) {
    const platform = platformVerdict.toUpperCase();
    const professional = professionalAssessment.verdict;
    
    let agreement = 'DISAGREE';
    let issueType = null;
    let severity = 'LOW';

    // Exact match
    if (platform === professional) {
      agreement = 'AGREE';
      this.summary.correct_decisions++;
    }
    // Both are positive (BUY or NEGOTIATE)
    else if ((platform === 'BUY' || platform === 'NEGOTIATE') && 
             (professional === 'BUY' || professional === 'NEGOTIATE')) {
      agreement = 'PARTIAL_AGREE';
      this.summary.correct_decisions += 0.5;
    }
    // Platform too conservative (False Negative)
    else if (platform === 'PASS' && (professional === 'BUY' || professional === 'NEGOTIATE')) {
      issueType = 'FALSE_NEGATIVE';
      severity = professional === 'BUY' ? 'HIGH' : 'MEDIUM';
      this.summary.false_negatives++;
    }
    // Platform too aggressive (False Positive)  
    else if ((platform === 'BUY' || platform === 'NEGOTIATE') && professional === 'PASS') {
      issueType = 'FALSE_POSITIVE';
      severity = platform === 'BUY' ? 'HIGH' : 'MEDIUM';
      this.summary.false_positives++;
    }
    // Other disagreements
    else {
      issueType = 'VERDICT_MISMATCH';
      severity = 'MEDIUM';
    }

    return {
      agreement,
      issueType,
      severity,
      platformVerdict: platform,
      professionalVerdict: professional,
      platformConfidence: property.analysis?.investmentDecision?.confidence || 0,
      professionalConfidence: professionalAssessment.confidence,
      professionalScore: professionalAssessment.score
    };
  }

  async analyzeAllProperties() {
    console.log('🏠 Professional Investment Analyst - Starting Evaluation');
    console.log('📊 Analyzing all stored properties against institutional standards\\n');

    try {
      // Only analyze properties from last 10 days to avoid stale test data
      const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
      const properties = await this.Deal.find({
        createdAt: { $gte: tenDaysAgo }
      }).sort({ createdAt: -1 });
      
      this.summary.total_properties = properties.length;

      if (properties.length === 0) {
        console.log('❌ No recent properties found in database (last 10 days)');
        console.log(`📅 Searching for properties created since: ${tenDaysAgo.toISOString()}`);
        return;
      }

      console.log(`📅 Found ${properties.length} properties from last 10 days to analyze\\n`);

      for (let i = 0; i < properties.length; i++) {
        const property = properties[i];
        console.log(`\\n🏠 Property ${i + 1}/${properties.length}: ${property.propertyName || 'Unnamed'}`);
        console.log(`📍 Address: ${property.propertyAddress?.street || ''}, ${property.propertyAddress?.city || ''}, ${property.propertyAddress?.state || ''}`);
        console.log(`💰 Purchase: $${property.purchasePrice?.toLocaleString()} | Rent: $${property.monthlyRent?.toLocaleString()}`);

        if (!property.analysis) {
          console.log('⚠️  No analysis data - skipping');
          continue;
        }

        // Get platform verdict
        const platformVerdict = property.analysis.investmentDecision?.verdict || 'NO_VERDICT';
        const platformReason = property.analysis.investmentDecision?.primaryReason || 'No reason provided';
        
        // Get professional assessment
        const professionalAssessment = this.assessPropertyProfessionally(property);
        
        // Compare assessments
        const comparison = this.compareAssessments(platformVerdict, professionalAssessment, property);

        // Display results
        console.log(`\\n🤖 Platform: ${comparison.platformVerdict} (${comparison.platformConfidence}% confidence)`);
        console.log(`👨‍💼 Professional: ${comparison.professionalVerdict} (${comparison.professionalConfidence}% confidence, Score: ${professionalAssessment.score}/100)`);
        console.log(`📈 Agreement: ${comparison.agreement}${comparison.issueType ? ` - ${comparison.issueType} (${comparison.severity} severity)` : ''}`);
        
        if (professionalAssessment.strengths.length > 0) {
          console.log(`✅ Strengths: ${professionalAssessment.strengths.join(', ')}`);
        }
        if (professionalAssessment.concerns.length > 0) {
          console.log(`⚠️  Concerns: ${professionalAssessment.concerns.join(', ')}`);
        }

        // Store detailed results
        this.results.push({
          property: {
            name: property.propertyName || 'Unnamed',
            address: `${property.propertyAddress?.street || ''}, ${property.propertyAddress?.city || ''}, ${property.propertyAddress?.state || ''}`,
            price: property.purchasePrice,
            rent: property.monthlyRent
          },
          platform: {
            verdict: comparison.platformVerdict,
            confidence: comparison.platformConfidence,
            reason: platformReason,
            aiScore: property.analysis.aiInsights?.investmentScore || 0
          },
          professional: professionalAssessment,
          comparison,
          metrics: professionalAssessment.metrics
        });

        if (comparison.agreement === 'AGREE') {
          this.summary.decision_agreement++;
        }
      }

      this.generateSummaryReport();
      
    } catch (error) {
      console.error('❌ Analysis failed:', error.message);
    }
  }

  generateSummaryReport() {
    console.log('\\n\\n📊 PROFESSIONAL INVESTMENT ANALYST REPORT');
    console.log('=' .repeat(60));
    
    this.summary.accuracy_rate = (this.summary.correct_decisions / this.summary.total_properties) * 100;
    
    console.log(`\\n🎯 DECISION ENGINE RELIABILITY:`);
    console.log(`   Total Properties Analyzed: ${this.summary.total_properties}`);
    console.log(`   Correct Decisions: ${this.summary.correct_decisions} (${this.summary.accuracy_rate.toFixed(1)}%)`);
    console.log(`   Exact Agreement: ${this.summary.decision_agreement}/${this.summary.total_properties}`);
    
    console.log(`\\n🚨 DECISION ERRORS:`);
    console.log(`   False Negatives: ${this.summary.false_negatives} (Missing good deals)`);
    console.log(`   False Positives: ${this.summary.false_positives} (Recommending bad deals)`);
    
    // Analyze patterns
    const criticalIssues = this.results.filter(r => r.comparison.severity === 'HIGH');
    const falseNegatives = this.results.filter(r => r.comparison.issueType === 'FALSE_NEGATIVE');
    const falsePositives = this.results.filter(r => r.comparison.issueType === 'FALSE_POSITIVE');
    
    console.log(`\\n🔍 CRITICAL ISSUES (${criticalIssues.length}):`);
    criticalIssues.forEach(result => {
      console.log(`   ${result.property.name}: Platform ${result.platform.verdict} vs Professional ${result.professional.verdict}`);
      console.log(`   └─ ${result.comparison.issueType} - Professional Score: ${result.professional.score}/100`);
    });
    
    if (falseNegatives.length > 0) {
      console.log(`\\n❌ FALSE NEGATIVES - MISSING OPPORTUNITIES:`);
      falseNegatives.forEach(result => {
        console.log(`   ${result.property.name} (Score: ${result.professional.score}/100)`);
        console.log(`   └─ IRR: ${result.metrics.irr?.toFixed(2)}%, Cash Flow: $${result.metrics.monthlyAmount}/month`);
      });
    }
    
    if (falsePositives.length > 0) {
      console.log(`\\n⚠️  FALSE POSITIVES - RECOMMENDING BAD DEALS:`);
      falsePositives.forEach(result => {
        console.log(`   ${result.property.name} (Score: ${result.professional.score}/100)`);
        console.log(`   └─ ${result.professional.concerns.join(', ')}`);
      });
    }
    
    console.log(`\\n💡 PROFESSIONAL RECOMMENDATIONS:`);
    if (this.summary.accuracy_rate >= 90) {
      console.log(`   ✅ EXCELLENT: Decision engine is highly reliable`);
    } else if (this.summary.accuracy_rate >= 75) {
      console.log(`   ⚠️  GOOD: Minor calibration needed`);
    } else if (this.summary.accuracy_rate >= 60) {
      console.log(`   🚨 CONCERNING: Significant recalibration required`);
    } else {
      console.log(`   ❌ CRITICAL: Decision engine unreliable - major fixes needed`);
    }
    
    if (this.summary.false_negatives > this.summary.false_positives) {
      console.log(`   📉 CONSERVATIVE BIAS: Platform missing profitable opportunities`);
      console.log(`   🔧 FIX: Relax cash flow buffer and return thresholds`);
    } else if (this.summary.false_positives > this.summary.false_negatives) {
      console.log(`   📈 AGGRESSIVE BIAS: Platform recommending risky deals`);
      console.log(`   🔧 FIX: Strengthen risk assessment criteria`);
    }
    
    console.log('\\n' + '='.repeat(60));
  }

  async disconnect() {
    await mongoose.disconnect();
    console.log('\\n✅ Database connection closed');
  }
}

// Run the analysis
async function runProfessionalAnalysis() {
  const analyst = new ProfessionalInvestmentAnalyst();
  
  try {
    await analyst.connectDatabase();
    await analyst.analyzeAllProperties();
  } catch (error) {
    console.error('❌ Professional analysis failed:', error);
  } finally {
    await analyst.disconnect();
  }
}

// Execute if run directly
if (require.main === module) {
  runProfessionalAnalysis();
}

module.exports = { ProfessionalInvestmentAnalyst, PROFESSIONAL_CRITERIA };