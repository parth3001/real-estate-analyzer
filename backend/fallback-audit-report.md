# Issue #53 TIER 2: Fallback Pattern Audit Report

**Generated**: $(date)
**Purpose**: Identify ALL locations where defaults are applied for user input fields
**Scope**: 93 user input fields from Phase 1 documentation

---

## Executive Summary

**Total Fields Analyzed**: ${#ALL_FIELDS[@]}

**Key Findings**:
- RISKY `||` patterns: [TO BE CALCULATED]
- SAFE `??` patterns: [TO BE CALCULATED]
- Fields with multiple fallback locations: [TO BE CALCULATED]
- Potential bugs found: [TO BE CALCULATED]

---

## Field-by-Field Analysis


### Field: `propertyType`

**RISKY `||` patterns found**: 10
**SAFE `??` patterns found**: 180

#### RISKY Fallback Locations (using `||`):

```
src/controllers/pipelineController.ts:327:    if (deal.propertyType !== 'SFR' || deal.strategy !== 'BUY_HOLD') {
src/routes/wizardRoutes.ts:100:      propertyType: req.body.propertyType || 'SFR',
src/services/rentcastService.ts:390:        propertyType: comp.propertyType || 'Unknown',
src/services/rentcastService.ts:421:        propertyType: comp.propertyType || 'Unknown',
src/services/rentcastService.ts:1001:      propertyType: comp.propertyType || 'Unknown',
src/services/portfolio/portfolioPropertyMetricsService.ts:53:    const propertyType = property.propertyType?.toUpperCase() || 'SFR';
src/services/portfolio/portfolioPropertyMetricsService.ts:110:    const propertyType = property.propertyType?.toUpperCase() || 'SFR';
src/services/portfolio/portfolioPropertyMetricsService.ts:147:    const propertyType = property.propertyType?.toUpperCase() || 'SFR';
src/services/portfolio/portfolioAnalyticsService.ts:435:      const type = property.propertyType || 'Single Family';
src/services/portfolio/enhancedPortfolioAI.ts:411:      const propertyType = prop.propertyType || 'Unknown';
```

#### SAFE Fallback Locations (using `??`):

```
src/types/marketData.ts:16:  propertyType: string;
src/types/marketData.ts:38:  propertyType: string;
src/types/marketData.ts:99:    propertyType: string;
src/types/marketData.ts:161:    propertyType: string;
src/types/marketData.ts:246:  propertyType: string;
src/types/marketData.ts:454:  propertyType?: 'SFR' | 'Condo' | 'Townhouse' | 'Multi-Family';
src/types/marketData.ts:466:  propertyType?: string;
src/types/marketData.ts:589:  propertyType: string;
src/types/wizardTypes.ts:6:import { SFRData, PropertyAddress } from './propertyTypes';
src/types/wizardTypes.ts:34:    propertyType?: string;
```

---

### Field: `propertyName`

**RISKY `||` patterns found**: 5
**SAFE `??` patterns found**: 37

#### RISKY Fallback Locations (using `||`):

```
src/controllers/deals.ts:401:        dealProperty: deal.propertyName || 'No name',
src/controllers/deals.ts:494:    if (!dealData.propertyName || dealData.propertyName.trim() === '') {
src/controllers/deals.ts:787:        propertyName: updatedDeal.dealName || updatedDeal.propertyName,
src/services/portfolio/portfolioService.ts:191:        console.log(`  ${i + 1}. ${prop.propertyName} (portfolioId: ${prop.portfolioId || 'none'})`);
src/services/portfolio/portfolioAnalyticsService.ts:61:          console.log(`  Property ${i + 1}: ${prop.propertyName || prop.propertyAddress || 'Unnamed'} - $${prop.purchasePrice}`);
```

#### SAFE Fallback Locations (using `??`):

```
src/models/Deal.ts:439:  propertyName: string;
src/models/Deal.ts:1116:  propertyName: { type: String, required: true },
src/models/PipelineDeal.ts:519:    .populate('analysisId', 'propertyName analysis.investmentDecision')
src/controllers/portfolios.ts:133:        propertyName: prop.propertyName,
src/controllers/deals.ts:401:        dealProperty: deal.propertyName || 'No name',
src/controllers/deals.ts:494:    if (!dealData.propertyName || dealData.propertyName.trim() === '') {
src/controllers/deals.ts:498:        dealData.propertyName = `${streetNumber} ${dealData.propertyAddress.city}`;
src/controllers/deals.ts:500:        dealData.propertyName = `${dealData.propertyType} Property - ${new Date().toLocaleDateString()}`;
src/controllers/deals.ts:502:      logger.info('Auto-generated property name:', dealData.propertyName);
src/controllers/deals.ts:506:      propertyName: dealData.propertyName,
```

---

### Field: `purchasePrice`

**RISKY `||` patterns found**: 25
**SAFE `??` patterns found**: 371

#### RISKY Fallback Locations (using `||`):

```
src/analysis/MultiFamilyAnalyzer.ts:154:      const monthlyTax = (this.data.purchasePrice * (this.data.propertyTaxRate || 0) / 100) / 12;
src/analysis/MultiFamilyAnalyzer.ts:155:      const monthlyInsurance = (this.data.purchasePrice * (this.data.insuranceRate || 0) / 100) / 12;
src/prompts/enhancedAIPrompts.ts:197:  const dealPrice = dealData.purchasePrice || 0;
src/prompts/enhancedAIPrompts.ts:640:  const dealPrice = dealData.purchasePrice || 0;
src/controllers/wizardController.ts:45:      purchasePrice: wizardData.propertyData.purchasePrice || 0,
src/controllers/wizardController.ts:142:      purchasePrice: wizardData.propertyData.purchasePrice || 0,
src/controllers/commandCenter.ts:112:          totalValue += deal.purchasePrice || 0;
src/routes/quickAnalysis.ts:20:    if (!propertyData.purchasePrice || !propertyData.monthlyRent) {
src/routes/analyzeRoutes.ts:212:        loanAmount: (formData.purchasePrice || 0) - (formData.downPayment || 0),
src/routes/analyzeRoutes.ts:224:        loanAmount: (formData.purchasePrice || 0) - (formData.downPayment || 0),
src/services/investment/sensitivityAnalysisService.ts:383:      const priceDiff = propertyData.purchasePrice - (baseAnalysis.propertyData?.purchasePrice || 0);
src/services/investment/strategyAlignmentService.ts:496:      optimalReturn = currentReturn + (propertyMetrics.purchasePrice || 400000) * 0.02; // 2% additional appreciation
src/services/education/taxEducationService.ts:103:    const purchasePrice = propertyData?.purchasePrice || 400000;
src/services/education/taxEducationService.ts:239:    const purchasePrice = propertyData?.purchasePrice || 400000;
src/services/portfolio/portfolioPropertyMetricsService.ts:63:    const purchasePrice = Number(property.purchasePrice) || 0;
src/services/portfolio/portfolioPropertyMetricsService.ts:148:    const purchasePrice = property.purchasePrice || 0;
src/services/portfolio/portfolioService.ts:680:              totalValue += property.purchasePrice || 0;
src/services/portfolio/portfolioAnalyticsService.ts:107:          const purchasePrice = property.purchasePrice || 0;
src/services/portfolio/portfolioAnalyticsService.ts:109:          const loanAmount = purchasePrice - (property.downPayment || 0);
src/services/portfolio/portfolioAnalyticsService.ts:326:    const purchasePrice = property.purchasePrice || 0;
```

#### SAFE Fallback Locations (using `??`):

```
src/types/propertyTypes.ts:53:  purchasePrice: number;
src/analysis/BasePropertyAnalyzer.ts:38:      purchasePrice: data.purchasePrice,
src/analysis/BasePropertyAnalyzer.ts:41:      loanAmount: data.purchasePrice - data.downPayment,
src/analysis/BasePropertyAnalyzer.ts:48:      this.data.purchasePrice,
src/analysis/BasePropertyAnalyzer.ts:60:      propertyTax: this.data.purchasePrice * (this.data.propertyTaxRate / 100),
src/analysis/BasePropertyAnalyzer.ts:61:      insurance: this.data.purchasePrice * (this.data.insuranceRate / 100),
src/analysis/BasePropertyAnalyzer.ts:75:    return FinancialCalculations.calculateCapRate(noi, this.data.purchasePrice);
src/analysis/BasePropertyAnalyzer.ts:98:      this.data.purchasePrice;                        // Fallback to purchase price for Buy & Hold
src/analysis/BasePropertyAnalyzer.ts:100:    let currentLoanBalance = this.data.purchasePrice - this.data.downPayment;
src/analysis/BasePropertyAnalyzer.ts:104:      purchasePrice: this.data.purchasePrice,
```

---

### Field: `downPayment`

**RISKY `||` patterns found**: 26
**SAFE `??` patterns found**: 131

#### RISKY Fallback Locations (using `||`):

```
src/analysis/BasePropertyAnalyzer.ts:42:      totalInvestment: data.downPayment + (data.closingCosts || 0)
src/analysis/MultiFamilyAnalyzer.ts:545:    const totalInvestment = this.data.downPayment + (this.data.closingCosts || 0) + (this.data.capitalInvestments || 0);
src/analysis/MultiFamilyAnalyzer.ts:1125:    const totalInvestment = this.data.downPayment + (this.data.closingCosts || 0) + (this.data.capitalInvestments || 0);
src/analysis/MultiFamilyAnalyzer.ts:1346:    const totalInvestment = this.data.downPayment + (this.data.closingCosts || 0) + (this.data.capitalInvestments || 0);
src/analysis/SFRAnalyzer.ts:210:    const totalInvestment = this.data.downPayment + (this.data.closingCosts || 0);
src/analysis/SFRAnalyzer.ts:363:    const totalInvestment = this.data.downPayment + (this.data.closingCosts || 0);
src/prompts/aiPrompts.ts:11:  const totalInvestment = dealData.downPayment + (dealData.closingCosts || 0);
src/prompts/aiPrompts.ts:263:  const totalInvestment = dealData.downPayment + (dealData.closingCosts || 0);
src/prompts/enhancedAIPrompts.ts:11:  const totalInvestment = dealData.downPayment + (dealData.closingCosts || 0);
src/prompts/enhancedAIPrompts.ts:501:  const totalInvestment = dealData.downPayment + (dealData.closingCosts || 0);
src/controllers/wizardController.ts:46:      downPayment: wizardData.propertyData.downPayment || 0,
src/controllers/wizardController.ts:143:      downPayment: wizardData.propertyData.downPayment || 0,
src/controllers/deals.ts:700:        downPayment: dealData.downPayment || 0,
src/routes/analyzeRoutes.ts:212:        loanAmount: (formData.purchasePrice || 0) - (formData.downPayment || 0),
src/routes/analyzeRoutes.ts:213:        totalInvestment: (formData.downPayment || 0) + (formData.closingCosts || 0)
src/routes/analyzeRoutes.ts:224:        loanAmount: (formData.purchasePrice || 0) - (formData.downPayment || 0),
src/routes/analyzeRoutes.ts:225:        totalInvestment: (formData.downPayment || 0) + (formData.closingCosts || 0),
src/services/investment/leverageOptimizer.ts:315:      return scenarios.find(s => s.downPaymentPercent === 100) || scenarios[0];
src/services/investment/leverageOptimizer.ts:319:    return scenarios.find(s => s.downPaymentPercent === 20) || scenarios[2];
src/services/education/taxEducationService.ts:241:    const downPayment = propertyData?.downPayment || Math.round(purchasePrice * 0.2);
```

#### SAFE Fallback Locations (using `??`):

```
src/types/wizardTypes.ts:106:    downPaymentPercentage: number;
src/types/propertyTypes.ts:54:  downPayment: number;
src/analysis/BasePropertyAnalyzer.ts:39:      downPayment: data.downPayment,
src/analysis/BasePropertyAnalyzer.ts:41:      loanAmount: data.purchasePrice - data.downPayment,
src/analysis/BasePropertyAnalyzer.ts:42:      totalInvestment: data.downPayment + (data.closingCosts || 0)
src/analysis/BasePropertyAnalyzer.ts:49:      this.data.downPayment
src/analysis/BasePropertyAnalyzer.ts:100:    let currentLoanBalance = this.data.purchasePrice - this.data.downPayment;
src/analysis/BasePropertyAnalyzer.ts:109:      downPayment: this.data.downPayment,
src/analysis/BasePropertyAnalyzer.ts:298:    const totalInvestment = this.data.downPayment + 
src/analysis/BasePropertyAnalyzer.ts:313:        downPayment: this.data.downPayment,
```

---

### Field: `interestRate`

**RISKY `||` patterns found**: 12
**SAFE `??` patterns found**: 87

#### RISKY Fallback Locations (using `||`):

```
src/controllers/wizardController.ts:47:      interestRate: wizardData.propertyData.interestRate || 7.5,
src/controllers/wizardController.ts:144:      interestRate: wizardData.propertyData.interestRate || 7.5,
src/controllers/deals.ts:701:        interestRate: dealData.interestRate || 7.0,
src/services/investment/investmentDecisionEngine.ts:1206:    const interestRate = optimalScenario.interestRate || 0.07;
src/services/investment/investmentDecisionEngine.ts:1303:    const interestRate = optimalScenario.interestRate || 0.07;
src/services/investment/sensitivityAnalysisService.ts:230:    const currentRate = propertyData.interestRate || 7.0;
src/services/investment/leverageOptimizer.ts:164:    const interestRate = propertyData.interestRate || 0.07; // 7% default
src/services/investment/leverageOptimizer.ts:451:    const currentRate = propertyData.interestRate || 0.07;
src/services/ai/services/predictionOrchestrator.ts:112:      mortgageRate: dealData.interestRate || 7.0,
src/services/portfolio/portfolioPropertyMetricsService.ts:153:    const interestRate = Number(property.interestRate) || 0;
src/services/portfolio/portfolioAnalyticsService.ts:329:    const interestRate = property.interestRate || 0;
src/services/portfolio/portfolioAnalyticsService.ts:477:      const interestRate = property.interestRate || 0;
```

#### SAFE Fallback Locations (using `??`):

```
src/types/marketData.ts:394:    interestRateSignal: number; // -1 to 1
src/types/propertyTypes.ts:55:  interestRate: number;
src/types/analysis.ts:312:    interestRate: number;
src/types/analysis.ts:322:    interestRate: number;
src/analysis/BasePropertyAnalyzer.ts:53:      this.data.interestRate,
src/analysis/BasePropertyAnalyzer.ts:131:      interestRate: this.data.interestRate,
src/analysis/BasePropertyAnalyzer.ts:252:      const interestPaid = currentLoanBalance * (this.data.interestRate / 100);
src/analysis/MultiFamilyAnalyzer.ts:565:    debug('  Interest Rate:', `${this.data.interestRate}%`);
src/analysis/MultiFamilyAnalyzer.ts:1087:      const interestPaid = currentLoanBalance * (this.data.interestRate / 100);
src/analysis/MultiFamilyAnalyzer.ts:1366:    const bestCaseInterest = Math.max(this.data.interestRate - 0.5, 0);
```

---

### Field: `loanTerm`

**RISKY `||` patterns found**: 8
**SAFE `??` patterns found**: 61

#### RISKY Fallback Locations (using `||`):

```
src/controllers/wizardController.ts:48:      loanTerm: wizardData.propertyData.loanTerm || 30,
src/controllers/wizardController.ts:145:      loanTerm: wizardData.propertyData.loanTerm || 30,
src/controllers/deals.ts:702:        loanTermYears: dealData.loanTerm || 30
src/services/investment/investmentDecisionEngine.ts:1224:    const loanTerm = optimalScenario.loanTermYears || 30;
src/services/investment/investmentDecisionEngine.ts:1321:    const loanTerm = optimalScenario.loanTermYears || 30;
src/services/portfolio/portfolioPropertyMetricsService.ts:154:    const loanTerm = Number(property.loanTerm) || 0;
src/services/portfolio/portfolioAnalyticsService.ts:330:    const loanTerm = property.loanTerm || 0;
src/services/portfolio/portfolioAnalyticsService.ts:478:      const loanTerm = property.loanTerm || 0;
```

#### SAFE Fallback Locations (using `??`):

```
src/types/propertyTypes.ts:56:  loanTerm: number;
src/analysis/BasePropertyAnalyzer.ts:54:      this.data.loanTerm
src/analysis/BasePropertyAnalyzer.ts:132:      loanTerm: this.data.loanTerm,
src/analysis/MultiFamilyAnalyzer.ts:566:    debug('  Loan Term:', `${this.data.loanTerm} years`);
src/analysis/MultiFamilyAnalyzer.ts:1370:      this.data.loanTerm
src/analysis/MultiFamilyAnalyzer.ts:1406:      this.data.loanTerm
src/analysis/SFRAnalyzer.ts:235:      this.data.loanTerm
src/analysis/SFRAnalyzer.ts:265:      this.data.loanTerm
src/utils/financialCalculations.ts:794:          data.loanTerm
src/utils/financialCalculations.ts:807:          data.loanTerm
```

---

### Field: `closingCosts`

**RISKY `||` patterns found**: 25
**SAFE `??` patterns found**: 49

#### RISKY Fallback Locations (using `||`):

```
src/analysis/BasePropertyAnalyzer.ts:42:      totalInvestment: data.downPayment + (data.closingCosts || 0)
src/analysis/BasePropertyAnalyzer.ts:110:      closingCosts: this.data.closingCosts || 0,
src/analysis/BasePropertyAnalyzer.ts:299:                           (this.data.closingCosts || 0) + 
src/analysis/BasePropertyAnalyzer.ts:314:        closingCosts: this.data.closingCosts || 0,
src/analysis/BasePropertyAnalyzer.ts:345:                           (this.data.closingCosts || 0) + 
src/analysis/BasePropertyAnalyzer.ts:366:      closingCosts: this.data.closingCosts || 0,
src/analysis/MultiFamilyAnalyzer.ts:545:    const totalInvestment = this.data.downPayment + (this.data.closingCosts || 0) + (this.data.capitalInvestments || 0);
src/analysis/MultiFamilyAnalyzer.ts:1125:    const totalInvestment = this.data.downPayment + (this.data.closingCosts || 0) + (this.data.capitalInvestments || 0);
src/analysis/MultiFamilyAnalyzer.ts:1346:    const totalInvestment = this.data.downPayment + (this.data.closingCosts || 0) + (this.data.capitalInvestments || 0);
src/analysis/SFRAnalyzer.ts:40:      this.data.closingCosts || 0,
src/analysis/SFRAnalyzer.ts:210:    const totalInvestment = this.data.downPayment + (this.data.closingCosts || 0);
src/analysis/SFRAnalyzer.ts:363:    const totalInvestment = this.data.downPayment + (this.data.closingCosts || 0);
src/prompts/aiPrompts.ts:11:  const totalInvestment = dealData.downPayment + (dealData.closingCosts || 0);
src/prompts/aiPrompts.ts:263:  const totalInvestment = dealData.downPayment + (dealData.closingCosts || 0);
src/prompts/enhancedAIPrompts.ts:11:  const totalInvestment = dealData.downPayment + (dealData.closingCosts || 0);
src/prompts/enhancedAIPrompts.ts:501:  const totalInvestment = dealData.downPayment + (dealData.closingCosts || 0);
src/controllers/wizardController.ts:62:      closingCosts: wizardData.propertyData.closingCosts || 0,
src/controllers/wizardController.ts:165:      closingCosts: wizardData.propertyData.closingCosts || 0,
src/routes/analyzeRoutes.ts:213:        totalInvestment: (formData.downPayment || 0) + (formData.closingCosts || 0)
src/routes/analyzeRoutes.ts:225:        totalInvestment: (formData.downPayment || 0) + (formData.closingCosts || 0),
```

#### SAFE Fallback Locations (using `??`):

```
src/types/propertyTypes.ts:62:  closingCosts?: number;
src/analysis/BasePropertyAnalyzer.ts:40:      closingCosts: data.closingCosts,
src/analysis/BasePropertyAnalyzer.ts:42:      totalInvestment: data.downPayment + (data.closingCosts || 0)
src/analysis/BasePropertyAnalyzer.ts:110:      closingCosts: this.data.closingCosts || 0,
src/analysis/BasePropertyAnalyzer.ts:299:                           (this.data.closingCosts || 0) + 
src/analysis/BasePropertyAnalyzer.ts:314:        closingCosts: this.data.closingCosts || 0,
src/analysis/BasePropertyAnalyzer.ts:345:                           (this.data.closingCosts || 0) + 
src/analysis/BasePropertyAnalyzer.ts:366:      closingCosts: this.data.closingCosts || 0,
src/analysis/MultiFamilyAnalyzer.ts:545:    const totalInvestment = this.data.downPayment + (this.data.closingCosts || 0) + (this.data.capitalInvestments || 0);
src/analysis/MultiFamilyAnalyzer.ts:1125:    const totalInvestment = this.data.downPayment + (this.data.closingCosts || 0) + (this.data.capitalInvestments || 0);
```

---

### Field: `repairCosts`

**RISKY `||` patterns found**: 2
**SAFE `??` patterns found**: 9

#### RISKY Fallback Locations (using `||`):

```
src/services/investment/investmentDecisionEngine.ts:1685:            repairCosts: propertyData.repairCosts || 0,
src/services/taxCalculationService.ts:497:           (propertyData.repairCosts || 0) +
```

#### SAFE Fallback Locations (using `??`):

```
src/types/propertyTypes.ts:91:  repairCosts?: number;
src/models/Deal.ts:451:  repairCosts?: number;
src/models/Deal.ts:1146:  repairCosts: { type: Number },
src/services/investment/investmentDecisionEngine.ts:1685:            repairCosts: propertyData.repairCosts || 0,
src/services/taxCalculationService.ts:89:  repairCosts: number;
src/services/taxCalculationService.ts:248:          repairCosts: propertyData.repairCosts,
src/services/taxCalculationService.ts:270:          repairCosts: propertyData.repairCosts,
src/services/taxCalculationService.ts:273:        `purchasePrice + closingCosts + repairCosts + capitalInvestments = ${propertyData.purchasePrice} + ${propertyData.closingCosts} + ${propertyData.repairCosts} + ${propertyData.capitalInvestments}`,
src/services/taxCalculationService.ts:497:           (propertyData.repairCosts || 0) +
```

---

### Field: `capitalInvestments`

**RISKY `||` patterns found**: 21
**SAFE `??` patterns found**: 42

#### RISKY Fallback Locations (using `||`):

```
src/analysis/BasePropertyAnalyzer.ts:111:      capitalInvestments: this.data.capitalInvestments || 0,
src/analysis/BasePropertyAnalyzer.ts:228:      const capitalImprovements = year === 1 ? (this.data.capitalInvestments || 0) : 0;
src/analysis/BasePropertyAnalyzer.ts:300:                           (this.data.capitalInvestments || 0);
src/analysis/BasePropertyAnalyzer.ts:315:        capitalInvestments: this.data.capitalInvestments || 0
src/analysis/BasePropertyAnalyzer.ts:346:                           (this.data.capitalInvestments || 0);
src/analysis/BasePropertyAnalyzer.ts:367:      capitalInvestments: this.data.capitalInvestments || 0
src/analysis/BasePropertyAnalyzer.ts:424:          totalAdditionalInvestment: this.data.capitalInvestments || 0
src/analysis/MultiFamilyAnalyzer.ts:545:    const totalInvestment = this.data.downPayment + (this.data.closingCosts || 0) + (this.data.capitalInvestments || 0);
src/analysis/MultiFamilyAnalyzer.ts:1060:      const capitalImprovements = year === 1 ? (this.data.capitalInvestments || 0) : 0;
src/analysis/MultiFamilyAnalyzer.ts:1125:    const totalInvestment = this.data.downPayment + (this.data.closingCosts || 0) + (this.data.capitalInvestments || 0);
src/analysis/MultiFamilyAnalyzer.ts:1346:    const totalInvestment = this.data.downPayment + (this.data.closingCosts || 0) + (this.data.capitalInvestments || 0);
src/analysis/SFRAnalyzer.ts:41:      this.data.capitalInvestments || 0
src/analysis/SFRAnalyzer.ts:64:    const capitalInvestments = this.data.capitalInvestments || 0;
src/utils/financialCalculations.ts:556:    if (!capitalInvestments || capitalInvestments === 0) return 0;
src/utils/financialCalculations.ts:814:        data.capitalInvestments || 0
src/controllers/wizardController.ts:63:      capitalInvestments: wizardData.propertyData.capitalInvestments || 0,
src/controllers/wizardController.ts:166:      capitalInvestments: wizardData.propertyData.capitalInvestments || 0,
src/services/investment/investmentDecisionEngine.ts:1686:            capitalInvestments: propertyData.capitalInvestments || 0,
src/services/portfolio/portfolioPropertyMetricsService.ts:66:    const capitalInvestments = Number(property.capitalInvestments) || 0;
src/services/taxCalculationService.ts:498:           (propertyData.capitalInvestments || 0);
```

#### SAFE Fallback Locations (using `??`):

```
src/types/propertyTypes.ts:63:  capitalInvestments?: number;
src/analysis/BasePropertyAnalyzer.ts:111:      capitalInvestments: this.data.capitalInvestments || 0,
src/analysis/BasePropertyAnalyzer.ts:228:      const capitalImprovements = year === 1 ? (this.data.capitalInvestments || 0) : 0;
src/analysis/BasePropertyAnalyzer.ts:300:                           (this.data.capitalInvestments || 0);
src/analysis/BasePropertyAnalyzer.ts:315:        capitalInvestments: this.data.capitalInvestments || 0
src/analysis/BasePropertyAnalyzer.ts:346:                           (this.data.capitalInvestments || 0);
src/analysis/BasePropertyAnalyzer.ts:367:      capitalInvestments: this.data.capitalInvestments || 0
src/analysis/BasePropertyAnalyzer.ts:424:          totalAdditionalInvestment: this.data.capitalInvestments || 0
src/analysis/MultiFamilyAnalyzer.ts:545:    const totalInvestment = this.data.downPayment + (this.data.closingCosts || 0) + (this.data.capitalInvestments || 0);
src/analysis/MultiFamilyAnalyzer.ts:1060:      const capitalImprovements = year === 1 ? (this.data.capitalInvestments || 0) : 0;
```

---

### Field: `propertyTaxRate`

**RISKY `||` patterns found**: 6
**SAFE `??` patterns found**: 45

#### RISKY Fallback Locations (using `||`):

```
src/analysis/MultiFamilyAnalyzer.ts:154:      const monthlyTax = (this.data.purchasePrice * (this.data.propertyTaxRate || 0) / 100) / 12;
src/controllers/wizardController.ts:49:      propertyTaxRate: wizardData.propertyData.actualPropertyTaxRate || wizardData.propertyData.propertyTaxRate || 1.2,
src/controllers/wizardController.ts:146:      propertyTaxRate: wizardData.propertyData.actualPropertyTaxRate || wizardData.propertyData.propertyTaxRate || 1.2,
src/controllers/deals.ts:698:                        (dealData.propertyTaxRate + dealData.insuranceRate + dealData.maintenanceCost + dealData.propertyManagementRate) / 12 || 
src/services/portfolio/portfolioPropertyMetricsService.ts:159:    const propertyTaxRate = (Number(property.propertyTaxRate) || 0) / 100;
src/services/portfolio/portfolioAnalyticsService.ts:350:    const propertyTaxRate = property.propertyTaxRate || 0;
```

#### SAFE Fallback Locations (using `??`):

```
src/types/wizardTypes.ts:116:    propertyTaxRate: number; // % of property value
src/types/propertyTypes.ts:57:  propertyTaxRate: number;
src/analysis/BasePropertyAnalyzer.ts:60:      propertyTax: this.data.purchasePrice * (this.data.propertyTaxRate / 100),
src/analysis/BasePropertyAnalyzer.ts:112:      propertyTaxRate: this.data.propertyTaxRate,
src/analysis/BasePropertyAnalyzer.ts:136:    const basePropertyTaxForYear1 = this.data.purchasePrice * (this.data.propertyTaxRate / 100);
src/analysis/BasePropertyAnalyzer.ts:463:      propertyTax: this.data.purchasePrice * (this.data.propertyTaxRate / 100) / 12,
src/analysis/MultiFamilyAnalyzer.ts:154:      const monthlyTax = (this.data.purchasePrice * (this.data.propertyTaxRate || 0) / 100) / 12;
src/analysis/MultiFamilyAnalyzer.ts:399:    const { purchasePrice, propertyTaxRate, insurancePerUnit, propertyManagementRate, maintenanceCostPerUnit, totalUnits } = this.data;
src/analysis/MultiFamilyAnalyzer.ts:405:    const propertyTax = purchasePrice * (propertyTaxRate / 100);
src/analysis/MultiFamilyAnalyzer.ts:669:    const { purchasePrice, propertyTaxRate, insurancePerUnit, propertyManagementRate, maintenanceCostPerUnit, totalUnits } = this.data;
```

---

### Field: `insuranceRate`

**RISKY `||` patterns found**: 6
**SAFE `??` patterns found**: 44

#### RISKY Fallback Locations (using `||`):

```
src/analysis/MultiFamilyAnalyzer.ts:155:      const monthlyInsurance = (this.data.purchasePrice * (this.data.insuranceRate || 0) / 100) / 12;
src/controllers/wizardController.ts:50:      insuranceRate: wizardData.propertyData.insuranceRate || DEFAULT_INSURANCE_RATE_PERCENTAGE, // FIX Issue #27: Changed from 0.7 to 0.35
src/controllers/wizardController.ts:147:      insuranceRate: wizardData.propertyData.insuranceRate || DEFAULT_INSURANCE_RATE_PERCENTAGE, // FIX Issue #27: Changed from 0.7 to 0.35
src/controllers/deals.ts:698:                        (dealData.propertyTaxRate + dealData.insuranceRate + dealData.maintenanceCost + dealData.propertyManagementRate) / 12 || 
src/services/portfolio/portfolioPropertyMetricsService.ts:160:    const insuranceRate = (Number(property.insuranceRate) || 0) / 100;
src/services/portfolio/portfolioAnalyticsService.ts:351:    const insuranceRate = property.insuranceRate || 0;
```

#### SAFE Fallback Locations (using `??`):

```
src/types/wizardTypes.ts:117:    insuranceRate: number; // % of property value
src/types/propertyTypes.ts:58:  insuranceRate: number;
src/analysis/BasePropertyAnalyzer.ts:61:      insurance: this.data.purchasePrice * (this.data.insuranceRate / 100),
src/analysis/BasePropertyAnalyzer.ts:113:      insuranceRate: this.data.insuranceRate,
src/analysis/BasePropertyAnalyzer.ts:137:    const baseInsuranceForYear1 = this.data.purchasePrice * (this.data.insuranceRate / 100);
src/analysis/BasePropertyAnalyzer.ts:464:      insurance: this.data.purchasePrice * (this.data.insuranceRate / 100) / 12,
src/analysis/MultiFamilyAnalyzer.ts:155:      const monthlyInsurance = (this.data.purchasePrice * (this.data.insuranceRate || 0) / 100) / 12;
src/analysis/MultiFamilyAnalyzer.ts:1001:    const baseInsurance = (this.data.insurancePerUnit || 600) * this.data.totalUnits; // ✅ FIX: Use insurancePerUnit, not insuranceRate
src/analysis/SFRAnalyzer.ts:85:      insurance: this.data.purchasePrice * (this.data.insuranceRate / 100),
src/analysis/SFRAnalyzer.ts:343:      insurance: Math.round((this.data.purchasePrice * (this.data.insuranceRate / 100) / 12) * 100) / 100,
```

---

### Field: `propertyManagementRate`

**RISKY `||` patterns found**: 6
**SAFE `??` patterns found**: 37

#### RISKY Fallback Locations (using `||`):

```
src/controllers/wizardController.ts:55:      propertyManagementRate: wizardData.propertyData.propertyManagementRate || 8,
src/controllers/wizardController.ts:149:      propertyManagementRate: wizardData.propertyData.propertyManagementRate || 8,
src/controllers/deals.ts:698:                        (dealData.propertyTaxRate + dealData.insuranceRate + dealData.maintenanceCost + dealData.propertyManagementRate) / 12 || 
src/services/investment/investmentDecisionEngine.ts:1992:        propertyManagementRate: propertyData.propertyManagementRate || 0,
src/services/investment/brrrAnalyzer.ts:303:    const managementRate = inputs.propertyManagementRate || 0;
src/services/portfolio/portfolioAnalyticsService.ts:377:    const propertyManagementRate = property.propertyManagementRate || 0;
```

#### SAFE Fallback Locations (using `??`):

```
src/types/propertyTypes.ts:60:  propertyManagementRate: number;
src/analysis/BasePropertyAnalyzer.ts:63:      propertyManagement: grossIncome * (this.data.propertyManagementRate / 100)
src/analysis/BasePropertyAnalyzer.ts:115:      propertyManagementRate: this.data.propertyManagementRate
src/analysis/BasePropertyAnalyzer.ts:195:      const propertyManagement = grossIncome * (this.data.propertyManagementRate / 100);
src/analysis/BasePropertyAnalyzer.ts:466:      propertyManagement: grossIncome * (this.data.propertyManagementRate / 100) / 12,
src/analysis/MultiFamilyAnalyzer.ts:157:      const monthlyPropertyMgmt = this.data.propertyManagementRate
src/analysis/MultiFamilyAnalyzer.ts:158:        ? (this.getNormalizedUnits().reduce((sum, u) => sum + u.currentRent, 0) * this.data.propertyManagementRate / 100)
src/analysis/MultiFamilyAnalyzer.ts:399:    const { purchasePrice, propertyTaxRate, insurancePerUnit, propertyManagementRate, maintenanceCostPerUnit, totalUnits } = this.data;
src/analysis/MultiFamilyAnalyzer.ts:407:    const propertyManagement = grossIncome * (propertyManagementRate / 100);
src/analysis/MultiFamilyAnalyzer.ts:669:    const { purchasePrice, propertyTaxRate, insurancePerUnit, propertyManagementRate, maintenanceCostPerUnit, totalUnits } = this.data;
```

---

### Field: `maintenanceCost`

**RISKY `||` patterns found**: 19
**SAFE `??` patterns found**: 86

#### RISKY Fallback Locations (using `||`):

```
src/analysis/MultiFamilyAnalyzer.ts:156:      const monthlyMaintenance = this.data.maintenanceCost || 0;
src/analysis/MultiFamilyAnalyzer.ts:410:    const maintenance = (maintenanceCostPerUnit || 100) * totalUnits * 12;
src/analysis/MultiFamilyAnalyzer.ts:675:    const maintenance = ((maintenanceCostPerUnit || 100) * totalUnits);
src/analysis/MultiFamilyAnalyzer.ts:1018:      const maintenance = (this.data.maintenanceCostPerUnit || 100) * this.data.totalUnits * 12 * expenseInflationFactor;
src/controllers/wizardController.ts:54:      ) || wizardData.propertyData.maintenanceCost || 0,
src/controllers/wizardController.ts:148:      maintenanceCost: maintenanceCost || wizardData.propertyData.maintenanceCost || 0,
src/controllers/deals.ts:240:  let maintenanceCost = dealData.maintenanceCost || 0;
src/controllers/deals.ts:698:                        (dealData.propertyTaxRate + dealData.insuranceRate + dealData.maintenanceCost + dealData.propertyManagementRate) / 12 || 
src/routes/analyzeRoutes.ts:22:  let maintenanceCost = wizardData.maintenanceCost || 0;
src/services/investment/investmentDecisionEngine.ts:1991:        maintenanceCost: propertyData.maintenanceCost || 0,
src/services/portfolio/portfolioPropertyMetricsService.ts:175:        monthlyMaintenance = property.maintenanceCost || 0;
src/services/portfolio/portfolioPropertyMetricsService.ts:181:        monthlyMaintenance = property.maintenanceCost || 0;
src/services/portfolio/portfolioPropertyMetricsService.ts:196:        monthlyMaintenance = property.maintenanceCost || 0;
src/services/portfolio/portfolioPropertyMetricsService.ts:202:        monthlyMaintenance = property.maintenanceCost || 0;
src/services/portfolio/portfolioPropertyMetricsService.ts:208:        monthlyMaintenance = property.maintenanceCost || 0;
src/services/portfolio/portfolioPropertyMetricsService.ts:214:        monthlyMaintenance = property.maintenanceCost || 0;
src/services/portfolio/portfolioPropertyMetricsService.ts:219:        monthlyMaintenance = property.maintenanceCost || 0;
src/services/portfolio/portfolioAnalyticsService.ts:387:      const maintenanceCost = property.maintenanceCost || 0;
src/services/portfolio/portfolioAnalyticsService.ts:393:      const maintenancePerUnit = property.maintenanceCostPerUnit || 0;
```

#### SAFE Fallback Locations (using `??`):

```
src/types/propertyTypes.ts:59:  maintenanceCost: number;
src/types/propertyTypes.ts:181:  maintenanceCostPerUnit: number;  // Monthly per-unit maintenance budget
src/analysis/BasePropertyAnalyzer.ts:62:      maintenance: this.data.maintenanceCost,
src/analysis/BasePropertyAnalyzer.ts:114:      maintenanceCost: this.data.maintenanceCost,
src/analysis/BasePropertyAnalyzer.ts:142:      maintenanceCost: this.data.maintenanceCost
src/analysis/BasePropertyAnalyzer.ts:187:      const maintenance = this.data.maintenanceCost * expenseInflationFactor;
src/analysis/BasePropertyAnalyzer.ts:465:      maintenance: this.data.maintenanceCost / 12,
src/analysis/MultiFamilyAnalyzer.ts:156:      const monthlyMaintenance = this.data.maintenanceCost || 0;
src/analysis/MultiFamilyAnalyzer.ts:399:    const { purchasePrice, propertyTaxRate, insurancePerUnit, propertyManagementRate, maintenanceCostPerUnit, totalUnits } = this.data;
src/analysis/MultiFamilyAnalyzer.ts:410:    const maintenance = (maintenanceCostPerUnit || 100) * totalUnits * 12;
```

---

### Field: `yearBuilt`

**RISKY `||` patterns found**: 14
**SAFE `??` patterns found**: 77

#### RISKY Fallback Locations (using `||`):

```
src/analysis/SFRAnalyzer.ts:133:    const propertyAge = new Date().getFullYear() - (this.data.yearBuilt || 2000);
src/prompts/aiPrompts.ts:74:- Year Built: ${dealData.yearBuilt || 'N/A'} ${propertyAge ? `(${propertyAge} years old)` : ''}
src/prompts/aiPrompts.ts:354:- Year Built: ${dealData.yearBuilt || 'N/A'} ${propertyAge ? `(${propertyAge} years old)` : ''}
src/prompts/enhancedAIPrompts.ts:81:- Year Built: ${dealData.yearBuilt || 'N/A'} ${propertyAge ? `(${propertyAge} years old)` : ''}
src/controllers/wizardController.ts:74:      yearBuilt: wizardData.propertyData.yearBuilt || new Date().getFullYear() - 20,
src/controllers/wizardController.ts:155:      yearBuilt: wizardData.propertyData.yearBuilt || new Date().getFullYear() - 20,
src/services/investment/investmentDecisionEngine.ts:420:        propertyData.yearBuilt || new Date().getFullYear() - 10
src/services/investment/investmentDecisionEngine.ts:737:      propertyData.yearBuilt || new Date().getFullYear() - 10
src/services/investment/investmentDecisionEngine.ts:820:      propertyData.yearBuilt || new Date().getFullYear() - 10, // Default if not provided
src/services/investment/investmentDecisionEngine.ts:838:      propertyData.yearBuilt || new Date().getFullYear() - 10,
src/services/investment/investmentDecisionEngine.ts:849:      propertyAge: new Date().getFullYear() - (propertyData.yearBuilt || new Date().getFullYear() - 10),
src/services/investment/investmentDecisionEngine.ts:2321:      yearBuilt: propertyData.yearBuilt || new Date().getFullYear(),
src/services/investment/investmentDecisionEngine.ts:2328:      propertyAgeRisk: this.assessPropertyAgeRisk(propertyData.yearBuilt || new Date().getFullYear())
src/services/ai/services/predictionOrchestrator.ts:113:      yearBuilt: dealData.yearBuilt || 2000,
```

#### SAFE Fallback Locations (using `??`):

```
src/types/marketData.ts:43:  yearBuilt?: number;
src/types/marketData.ts:104:    yearBuilt?: number;
src/types/marketData.ts:160:    yearBuilt?: number;
src/types/marketData.ts:250:  yearBuilt?: number;
src/types/wizardTypes.ts:32:    yearBuilt?: number;
src/types/propertyTypes.ts:87:  yearBuilt: number;
src/types/propertyTypes.ts:149:  yearBuilt: number;
src/analysis/SFRAnalyzer.ts:133:    const propertyAge = new Date().getFullYear() - (this.data.yearBuilt || 2000);
src/models/Deal.ts:449:  yearBuilt: number;
src/models/Deal.ts:914:      yearBuilt: Number,
```

---

### Field: `squareFootage`

**RISKY `||` patterns found**: 10
**SAFE `??` patterns found**: 77

#### RISKY Fallback Locations (using `||`):

```
src/prompts/enhancedAIPrompts.ts:82:- Square Footage: ${dealData.squareFootage || 'N/A'}
src/controllers/wizardController.ts:71:      squareFootage: wizardData.propertyData.squareFootage || 0,
src/controllers/wizardController.ts:152:      squareFootage: wizardData.propertyData.squareFootage || 0,
src/services/pipeline/pipelineService.ts:388:          squareFootage: (analysis as any).squareFootage || (analysis as any).totalSqft,
src/services/rentEstimationService.ts:92:    const squareFootage = propertyDetails.squareFootage || RentEstimationService.DEFAULT_AVG_SQFT;
src/services/rentEstimationService.ts:293:    const squareFootage = propertyDetails.squareFootage || RentEstimationService.DEFAULT_AVG_SQFT;
src/services/rentcastService.ts:388:        sqft: comp.squareFootage || 0,
src/services/rentcastService.ts:419:        sqft: comp.squareFootage || 0,
src/services/rentcastService.ts:1004:      squareFootage: comp.squareFootage || 0,
src/services/portfolio/portfolioAnalyticsService.ts:209:            squareFeet = (property as any).squareFootage || 0;
```

#### SAFE Fallback Locations (using `??`):

```
src/types/marketData.ts:15:  squareFootage?: number;
src/types/marketData.ts:41:  squareFootage?: number;
src/types/marketData.ts:102:    squareFootage?: number;
src/types/marketData.ts:158:    squareFootage: number;
src/types/marketData.ts:469:  squareFootage?: number;
src/types/marketData.ts:557:  squareFootage: number;
src/types/marketData.ts:592:  squareFootage: number;
src/types/marketData.ts:606:  squareFootage: number;
src/types/wizardTypes.ts:29:    squareFootage?: number;
src/types/wizardTypes.ts:98:  squareFootage?: number;
```

---

### Field: `monthlyRent`

**RISKY `||` patterns found**: 33
**SAFE `??` patterns found**: 233

#### RISKY Fallback Locations (using `||`):

```
src/prompts/aiPrompts.ts:329:    acc[key].totalRent += (unit.monthlyRent || 0);
src/controllers/wizardController.ts:70:      monthlyRent: wizardData.propertyData.monthlyRent || 0,
src/controllers/wizardController.ts:151:      monthlyRent: wizardData.propertyData.monthlyRent || 0,
src/controllers/wizardController.ts:321:  if (!monthlyRent || !maintenanceReservePercentage) {
src/controllers/deals.ts:696:        monthlyRent: dealData.monthlyRent || dealData.rentalIncome || 0,
src/services/predictionEngine.ts:239:      : (dealData as MultiFamilyData).unitTypes?.reduce((total, unit) => total + (unit.monthlyRent * unit.count), 0) || 0;
src/services/predictionEngine.ts:288:      : (dealData as MultiFamilyData).unitTypes?.reduce((total, unit) => total + (unit.monthlyRent * unit.count), 0) || 0;
src/services/predictionEngine.ts:297:MARKET POSITION: ${monthlyRent > (marketData.medianRent || monthlyRent) ? 'Above Market' : 'At/Below Market'}
src/services/investment/investmentDecisionEngine.ts:961:    const monthlyRent = propertyData.monthlyRent || 0;
src/services/investment/investmentDecisionEngine.ts:2540:    const grossRent = propertyData.monthlyRent || 0;
src/services/investment/investmentDecisionEngine.ts:2917:    const rentToPriceCheck = this.assessRentToPriceRatio(propertyData.monthlyRent || 0, propertyData.purchasePrice);
src/services/investment/sensitivityAnalysisService.ts:178:    const currentRent = propertyData.monthlyRent || 0;
src/services/investment/sensitivityAnalysisService.ts:392:      const rentDiff = (propertyData.monthlyRent || 0) - (baseAnalysis.propertyData?.monthlyRent || 0);
src/services/education/taxEducationService.ts:104:    const monthlyRent = propertyData?.monthlyRent || Math.round(purchasePrice * 0.007); // 0.7% rent ratio if not provided
src/services/education/taxEducationService.ts:240:    const monthlyRent = propertyData?.monthlyRent || Math.round(purchasePrice * 0.007);
src/services/aiService.ts:183:          : (dealData as MultiFamilyData).unitTypes?.reduce((total, unit) => total + (unit.monthlyRent * unit.count), 0) || 0;
src/services/ai/aiOrchestrator.ts:356:    const monthlyRent = analysis.monthlyAnalysis?.income?.gross || 0;
src/services/ai/services/coreAnalysisService.ts:108:        total + (unit.monthlyRent * unit.count), 0) || 0;
src/services/ai/services/predictionOrchestrator.ts:369:        total + (unit.monthlyRent * unit.count), 0) || 0;
src/services/portfolio/portfolioPropertyMetricsService.ts:139:        return property.monthlyRent || 0;
```

#### SAFE Fallback Locations (using `??`):

```
src/types/wizardTypes.ts:52:    monthlyRent: number;
src/types/propertyTypes.ts:83:  monthlyRent: number;
src/types/propertyTypes.ts:157:    monthlyRent: number;   // Current rent per unit (what tenant actually pays)
src/analysis/BasePropertyAnalyzer.ts:205:      const monthlyRentForYear = grossIncome / 12;
src/analysis/BasePropertyAnalyzer.ts:213:      const turnoverCosts = (inflatedPrepFees + (monthlyRentForYear * realtorCommission)) * turnoverRate;
src/analysis/BasePropertyAnalyzer.ts:216:        monthlyRentForYear,
src/analysis/BasePropertyAnalyzer.ts:223:          commissionPart: (monthlyRentForYear * realtorCommission) * turnoverRate
src/analysis/BasePropertyAnalyzer.ts:447:    const monthlyRent = grossIncome / 12;
src/analysis/BasePropertyAnalyzer.ts:459:    const annualTurnoverCost = (prepFees + (monthlyRent * realtorCommission)) * turnoverRate;
src/analysis/MultiFamilyAnalyzer.ts:265:            currentRent: unitType.monthlyRent
```

---

### Field: `bedrooms`

**RISKY `||` patterns found**: 9
**SAFE `??` patterns found**: 80

#### RISKY Fallback Locations (using `||`):

```
src/prompts/aiPrompts.ts:76:- Bedrooms: ${dealData.bedrooms || 'N/A'}
src/prompts/enhancedAIPrompts.ts:83:- Bedrooms: ${dealData.bedrooms || 'N/A'}
src/controllers/wizardController.ts:72:      bedrooms: wizardData.propertyData.bedrooms || 3,
src/controllers/wizardController.ts:153:      bedrooms: wizardData.propertyData.bedrooms || 3,
src/routes/marketDataRoutes.ts:381:      if (!unit.bedrooms || !unit.bathrooms || !unit.squareFootage) {
src/routes/marketDataRoutes.ts:389:      if (typeof unit.bedrooms !== 'number' || typeof unit.bathrooms !== 'number' || typeof unit.squareFootage !== 'number') {
src/services/rentcastService.ts:386:        bedrooms: comp.bedrooms || 0,
src/services/rentcastService.ts:417:        bedrooms: comp.bedrooms || 0,
src/services/rentcastService.ts:1002:      bedrooms: comp.bedrooms || 0,
```

#### SAFE Fallback Locations (using `??`):

```
src/types/marketData.ts:13:  bedrooms?: number;
src/types/marketData.ts:39:  bedrooms?: number;
src/types/marketData.ts:100:    bedrooms?: number;
src/types/marketData.ts:156:    bedrooms: number;
src/types/marketData.ts:242:  bedrooms: number;
src/types/marketData.ts:467:  bedrooms?: number;
src/types/marketData.ts:555:  bedrooms: number;
src/types/marketData.ts:590:  bedrooms: number;
src/types/marketData.ts:604:  bedrooms: number;
src/types/wizardTypes.ts:30:    bedrooms?: number;
```

---

### Field: `bathrooms`

**RISKY `||` patterns found**: 9
**SAFE `??` patterns found**: 68

#### RISKY Fallback Locations (using `||`):

```
src/prompts/aiPrompts.ts:77:- Bathrooms: ${dealData.bathrooms || 'N/A'}
src/prompts/enhancedAIPrompts.ts:84:- Bathrooms: ${dealData.bathrooms || 'N/A'}
src/controllers/wizardController.ts:73:      bathrooms: wizardData.propertyData.bathrooms || 2,
src/controllers/wizardController.ts:154:      bathrooms: wizardData.propertyData.bathrooms || 2,
src/routes/marketDataRoutes.ts:381:      if (!unit.bedrooms || !unit.bathrooms || !unit.squareFootage) {
src/routes/marketDataRoutes.ts:389:      if (typeof unit.bedrooms !== 'number' || typeof unit.bathrooms !== 'number' || typeof unit.squareFootage !== 'number') {
src/services/rentcastService.ts:387:        bathrooms: comp.bathrooms || 0,
src/services/rentcastService.ts:418:        bathrooms: comp.bathrooms || 0,
src/services/rentcastService.ts:1003:      bathrooms: comp.bathrooms || 0,
```

#### SAFE Fallback Locations (using `??`):

```
src/types/marketData.ts:14:  bathrooms?: number;
src/types/marketData.ts:40:  bathrooms?: number;
src/types/marketData.ts:101:    bathrooms?: number;
src/types/marketData.ts:157:    bathrooms: number;
src/types/marketData.ts:243:  bathrooms: number;
src/types/marketData.ts:468:  bathrooms?: number;
src/types/marketData.ts:556:  bathrooms: number;
src/types/marketData.ts:591:  bathrooms: number;
src/types/marketData.ts:605:  bathrooms: number;
src/types/wizardTypes.ts:31:    bathrooms?: number;
```

---

### Field: `projectionYears`

**RISKY `||` patterns found**: 14
**SAFE `??` patterns found**: 53

#### RISKY Fallback Locations (using `||`):

```
src/prompts/aiPrompts.ts:32:  const projectionYears = analysis?.longTermAnalysis?.projectionYears || 10;
src/prompts/aiPrompts.ts:282:  const projectionYears = analysis?.longTermAnalysis?.projectionYears || 10;
src/prompts/enhancedAIPrompts.ts:41:  const projectionYears = analysis?.longTermAnalysis?.projectionYears || 10;
src/prompts/enhancedAIPrompts.ts:511:  const projectionYears = analysis?.longTermAnalysis?.projectionYears || 10;
src/controllers/wizardController.ts:76:        projectionYears: wizardData.propertyData.longTermAssumptions?.projectionYears || 10,
src/controllers/wizardController.ts:157:        projectionYears: wizardData.propertyData.longTermAssumptions?.projectionYears || 10,
src/controllers/wizardController.ts:191:      projectionYears: sfrData.longTermAssumptions.projectionYears || 10,
src/controllers/deals.ts:945:      projectionYears: dealData.longTermAssumptions?.projectionYears || 10,
src/controllers/deals.ts:1603:      projectionYears: dealData.longTermAssumptions?.projectionYears || 10,
src/routes/analyzeRoutes.ts:234:      projectionYears: formData.longTermAssumptions?.projectionYears || 5,
src/services/investment/investmentDecisionEngine.ts:405:      holdPeriod: propertyData.longTermAssumptions?.projectionYears || 6,
src/services/investment/investmentDecisionEngine.ts:1562:      holdPeriod: propertyData.longTermAssumptions?.projectionYears || 10,
src/services/investment/investmentDecisionEngine.ts:2733:    const financialProjectionYears = propertyData.longTermAssumptions?.projectionYears || 10;
src/services/investment/investmentDecisionEngine.ts:3267:    const holdPeriod = propertyData.longTermAssumptions?.projectionYears || 10;
```

#### SAFE Fallback Locations (using `??`):

```
src/types/propertyTypes.ts:93:    projectionYears: number;
src/types/propertyTypes.ts:193:    projectionYears: number;
src/types/propertyTypes.ts:241:  projectionYears: number;
src/types/analysis.ts:301:  projectionYears: number;
src/analysis/BasePropertyAnalyzer.ts:19:  projectionYears: number;
src/analysis/BasePropertyAnalyzer.ts:119:      projectionYears: this.assumptions.projectionYears,
src/analysis/BasePropertyAnalyzer.ts:165:      : this.assumptions.projectionYears;  // Buy & Hold/MF: User's modeling period
src/analysis/BasePropertyAnalyzer.ts:169:      userInputYears: this.assumptions.projectionYears,
src/analysis/BasePropertyAnalyzer.ts:426:        projectionYears: this.assumptions.projectionYears
src/analysis/MultiFamilyAnalyzer.ts:1003:    for (let year = 1; year <= this.assumptions.projectionYears; year++) {
```

---

### Field: `annualRentIncrease`

**RISKY `||` patterns found**: 8
**SAFE `??` patterns found**: 24

#### RISKY Fallback Locations (using `||`):

```
src/utils/financialCalculations.ts:749:      data.longTermAssumptions?.annualRentIncrease || 3,
src/utils/financialCalculations.ts:841:      data.longTermAssumptions?.annualRentIncrease || 3,
src/controllers/wizardController.ts:77:        annualRentIncrease: wizardData.propertyData.longTermAssumptions?.annualRentIncrease || 3,
src/controllers/wizardController.ts:158:        annualRentIncrease: wizardData.propertyData.longTermAssumptions?.annualRentIncrease || 3,
src/controllers/wizardController.ts:192:      annualRentIncrease: sfrData.longTermAssumptions.annualRentIncrease || 2,
src/controllers/deals.ts:946:      annualRentIncrease: dealData.longTermAssumptions?.annualRentIncrease || 2,
src/controllers/deals.ts:1604:      annualRentIncrease: dealData.longTermAssumptions?.annualRentIncrease || 2,
src/routes/analyzeRoutes.ts:235:      annualRentIncrease: formData.longTermAssumptions?.annualRentIncrease || 3,
```

#### SAFE Fallback Locations (using `??`):

```
src/types/propertyTypes.ts:94:    annualRentIncrease: number;
src/types/propertyTypes.ts:194:    annualRentIncrease: number;
src/types/propertyTypes.ts:242:  annualRentIncrease: number;
src/analysis/BasePropertyAnalyzer.ts:20:  annualRentIncrease: number;
src/analysis/BasePropertyAnalyzer.ts:120:      annualRentIncrease: this.assumptions.annualRentIncrease,
src/analysis/MultiFamilyAnalyzer.ts:355:    const growthFactor = Math.pow(1 + this.assumptions.annualRentIncrease / 100, year - 1);
src/utils/financialCalculations.ts:749:      data.longTermAssumptions?.annualRentIncrease || 3,
src/utils/financialCalculations.ts:841:      data.longTermAssumptions?.annualRentIncrease || 3,
src/models/Deal.ts:14:  annualRentIncrease: number;
src/prompts/aiPrompts.ts:132:- Annual Rent Increase: ${dealData.longTermAssumptions?.annualRentIncrease ?? 2}%
```

---

### Field: `annualPropertyValueIncrease`

**RISKY `||` patterns found**: 8
**SAFE `??` patterns found**: 32

#### RISKY Fallback Locations (using `||`):

```
src/controllers/wizardController.ts:78:        annualPropertyValueIncrease: wizardData.propertyData.longTermAssumptions?.annualPropertyValueIncrease || 3,
src/controllers/wizardController.ts:159:        annualPropertyValueIncrease: wizardData.propertyData.longTermAssumptions?.annualPropertyValueIncrease || 3,
src/controllers/wizardController.ts:194:      annualPropertyValueIncrease: sfrData.longTermAssumptions.annualPropertyValueIncrease || 3,
src/controllers/deals.ts:948:      annualPropertyValueIncrease: dealData.longTermAssumptions?.annualPropertyValueIncrease || 3,
src/controllers/deals.ts:1606:      annualPropertyValueIncrease: dealData.longTermAssumptions?.annualPropertyValueIncrease || 3,
src/routes/analyzeRoutes.ts:237:      annualPropertyValueIncrease: formData.longTermAssumptions?.annualPropertyValueIncrease || 3,
src/services/predictionEngine.ts:363:    const appreciationRate = analysis?.longTermAssumptions?.annualPropertyValueIncrease || 3;
src/services/investment/investmentDecisionEngine.ts:417:      expectedAppreciation: propertyData.longTermAssumptions?.annualPropertyValueIncrease || 0.03,
```

#### SAFE Fallback Locations (using `??`):

```
src/types/propertyTypes.ts:95:    annualPropertyValueIncrease: number;
src/types/propertyTypes.ts:195:    annualPropertyValueIncrease: number;
src/types/propertyTypes.ts:244:  annualPropertyValueIncrease: number;
src/analysis/BasePropertyAnalyzer.ts:22:  annualPropertyValueIncrease: number;
src/analysis/BasePropertyAnalyzer.ts:122:      annualPropertyValueIncrease: this.assumptions.annualPropertyValueIncrease,
src/analysis/BasePropertyAnalyzer.ts:250:      currentPropertyValue *= (1 + this.assumptions.annualPropertyValueIncrease / 100);
src/analysis/MultiFamilyAnalyzer.ts:1084:      currentPropertyValue *= (1 + this.assumptions.annualPropertyValueIncrease / 100);
src/analysis/MultiFamilyAnalyzer.ts:1441:    const baseTotalReturn = cashFlow * projectionYears + (this.data.purchasePrice * Math.pow(1 + this.assumptions.annualPropertyValueIncrease / 100, projectionYears) - this.data.purchasePrice);
src/analysis/MultiFamilyAnalyzer.ts:1454:        appreciationRate: this.assumptions.annualPropertyValueIncrease * 1.2
src/analysis/MultiFamilyAnalyzer.ts:1464:        appreciationRate: this.assumptions.annualPropertyValueIncrease * 0.7
```

---

### Field: `sellingCostsPercentage`

**RISKY `||` patterns found**: 6
**SAFE `??` patterns found**: 15

#### RISKY Fallback Locations (using `||`):

```
src/controllers/wizardController.ts:79:        sellingCostsPercentage: wizardData.propertyData.longTermAssumptions?.sellingCostsPercentage || 6,
src/controllers/wizardController.ts:160:        sellingCostsPercentage: wizardData.propertyData.longTermAssumptions?.sellingCostsPercentage || 6,
src/controllers/wizardController.ts:195:      sellingCosts: sfrData.longTermAssumptions.sellingCostsPercentage || 6,
src/controllers/deals.ts:949:      sellingCosts: dealData.longTermAssumptions?.sellingCostsPercentage || 6,
src/controllers/deals.ts:1607:      sellingCosts: dealData.longTermAssumptions?.sellingCostsPercentage || 6,
src/routes/analyzeRoutes.ts:238:      sellingCosts: formData.longTermAssumptions?.sellingCostsPercentage || 6,
```

#### SAFE Fallback Locations (using `??`):

```
src/types/propertyTypes.ts:98:    sellingCostsPercentage: number;
src/types/propertyTypes.ts:198:    sellingCostsPercentage: number;
src/types/propertyTypes.ts:245:  sellingCostsPercentage: number;
src/models/Deal.ts:16:  sellingCostsPercentage: number;
src/controllers/wizardController.ts:79:        sellingCostsPercentage: wizardData.propertyData.longTermAssumptions?.sellingCostsPercentage || 6,
src/controllers/wizardController.ts:160:        sellingCostsPercentage: wizardData.propertyData.longTermAssumptions?.sellingCostsPercentage || 6,
src/controllers/wizardController.ts:195:      sellingCosts: sfrData.longTermAssumptions.sellingCostsPercentage || 6,
src/controllers/deals.ts:949:      sellingCosts: dealData.longTermAssumptions?.sellingCostsPercentage || 6,
src/controllers/deals.ts:1484:      sellingCostsPercentage: 6,
src/controllers/deals.ts:1566:      sellingCostsPercentage: 6,
```

---

### Field: `inflationRate`

**RISKY `||` patterns found**: 11
**SAFE `??` patterns found**: 44

#### RISKY Fallback Locations (using `||`):

```
src/utils/financialCalculations.ts:763:      inflationRate: assumptions.annualExpenseIncrease || 2
src/utils/financialCalculations.ts:855:      inflationRate: assumptions.annualExpenseIncrease || 2
src/prompts/enhancedAIPrompts.ts:160:- Inflation Rate: ${marketIntelligence.marketData.economicIndicators?.inflationRate || 0}%
src/prompts/enhancedAIPrompts.ts:603:- Inflation Rate: ${marketIntelligence.marketData.economicIndicators?.inflationRate || 0}%
src/controllers/wizardController.ts:80:        inflationRate: wizardData.propertyData.longTermAssumptions?.inflationRate || 2.5,
src/controllers/wizardController.ts:161:        inflationRate: wizardData.propertyData.longTermAssumptions?.inflationRate || 2.5,
src/controllers/wizardController.ts:193:      annualExpenseIncrease: sfrData.longTermAssumptions.inflationRate || 2,
src/routes/analyzeRoutes.ts:236:      annualExpenseIncrease: formData.longTermAssumptions?.inflationRate || 2,
src/services/propertyDataAggregator.ts:376:      rentGrowthRate: Math.max(2, economicData.inflationRate || 3),
src/services/propertyDataAggregator.ts:377:      inflationRate: economicData.inflationRate || 2.5,
src/services/propertyDataAggregator.ts:439:    const inflationRate = economicData.inflationRate || 3;
```

#### SAFE Fallback Locations (using `??`):

```
src/types/marketData.ts:299:  inflationRate: number;
src/types/wizardTypes.ts:122:    inflationRate: number;
src/types/propertyTypes.ts:96:    inflationRate: number;
src/types/propertyTypes.ts:196:    inflationRate: number;
src/utils/financialCalculations.ts:33:  static calculateOperatingExpenses(baseExpenses: number, inflationRate: number, year: number): number {
src/utils/financialCalculations.ts:34:    return baseExpenses * Math.pow(1 + inflationRate / 100, year);
src/utils/financialCalculations.ts:717:    inflationRate: number;
src/utils/financialCalculations.ts:725:    const inflationFactor = Math.pow(1 + params.inflationRate / 100, params.year - 1);
src/utils/financialCalculations.ts:763:      inflationRate: assumptions.annualExpenseIncrease || 2
src/utils/financialCalculations.ts:855:      inflationRate: assumptions.annualExpenseIncrease || 2
```

---

### Field: `vacancyRate`

**RISKY `||` patterns found**: 16
**SAFE `??` patterns found**: 121

#### RISKY Fallback Locations (using `||`):

```
src/utils/fixers/projectionFixer.ts:66:    const vacancyRate = year.vacancyRate || 0.05; // Default 5% if not available
src/controllers/wizardController.ts:81:        vacancyRate: wizardData.propertyData.vacancyRate || wizardData.propertyData.longTermAssumptions?.vacancyRate || 5,
src/controllers/wizardController.ts:162:        vacancyRate: wizardData.propertyData.vacancyRate || wizardData.propertyData.longTermAssumptions?.vacancyRate || 5,
src/controllers/wizardController.ts:196:      vacancyRate: sfrData.longTermAssumptions.vacancyRate || 5
src/controllers/deals.ts:168:                      dealData.vacancyRate !== undefined ||
src/controllers/deals.ts:202:        vacancyRate: dealData.vacancyRate || dealData.longTermAssumptions?.vacancyRate || 5
src/controllers/deals.ts:278:      vacancyRate: dealData.vacancyRate || dealData.longTermAssumptions?.vacancyRate || 5
src/controllers/deals.ts:950:      vacancyRate: dealData.longTermAssumptions?.vacancyRate || 5
src/controllers/deals.ts:1608:      vacancyRate: dealData.longTermAssumptions?.vacancyRate || 5
src/routes/analyzeRoutes.ts:39:      vacancyRate: wizardData.vacancyRate || wizardData.longTermAssumptions?.vacancyRate || 5
src/routes/analyzeRoutes.ts:202:                        formData.vacancyRate !== undefined ||
src/routes/analyzeRoutes.ts:239:      vacancyRate: formData.longTermAssumptions?.vacancyRate || 5
src/services/investment/investmentDecisionEngine.ts:1993:        vacancyRate: propertyData.longTermAssumptions?.vacancyRate || 5,
src/services/investment/brrrAnalyzer.ts:489:    const vacancyRate = inputs.vacancyRate || 5;
src/services/aiService.ts:191:          vacancyRate: analysis.censusData.housing?.vacancyRate || 5,
src/services/quickCalculationService.ts:64:    const vacancyRate = propertyData.longTermAssumptions?.vacancyRate || 5;
```

#### SAFE Fallback Locations (using `??`):

```
src/types/wizardTypes.ts:113:    vacancyRatePercentage: number;
src/types/propertyTypes.ts:97:    vacancyRate: number;
src/types/propertyTypes.ts:197:    vacancyRate: number;
src/types/propertyTypes.ts:246:  vacancyRate: number;
src/types/propertyTypes.ts:283:      vacancyRate: number;      // Optimistic vacancy rate
src/types/propertyTypes.ts:295:      vacancyRate: number;      // Pessimistic vacancy rate
src/types/census.ts:82:  vacancyRate?: number;
src/types/analysis.ts:311:    vacancyRate: number;
src/types/analysis.ts:321:    vacancyRate: number;
src/analysis/BasePropertyAnalyzer.ts:24:  vacancyRate: number;
```

---

### Field: `turnoverFrequency`

**RISKY `||` patterns found**: 13
**SAFE `??` patterns found**: 27

#### RISKY Fallback Locations (using `||`):

```
src/analysis/BasePropertyAnalyzer.ts:124:      turnoverFrequency: this.assumptions.turnoverFrequency || 2,
src/analysis/BasePropertyAnalyzer.ts:148:    const turnoverFrequency = this.assumptions.turnoverFrequency || 2;
src/analysis/BasePropertyAnalyzer.ts:450:    const turnoverFrequency = this.assumptions.turnoverFrequency || 2;
src/analysis/MultiFamilyAnalyzer.ts:440:    const turnoverFrequency = this.assumptions.turnoverFrequency || 3;
src/analysis/MultiFamilyAnalyzer.ts:1040:      const turnoverFrequency = this.assumptions.turnoverFrequency || 3;
src/analysis/SFRAnalyzer.ts:73:      turnoverFrequency: this.assumptions.turnoverFrequency || 2,
src/analysis/SFRAnalyzer.ts:336:      turnoverFrequency: this.assumptions.turnoverFrequency || 2,
src/utils/financialCalculations.ts:771:      turnoverFrequency: assumptions.turnoverFrequency || 2,
src/utils/financialCalculations.ts:821:          turnoverFrequency: assumptions.turnoverFrequency || 2,
src/utils/financialCalculations.ts:869:      turnoverFrequency: assumptions.turnoverFrequency || 2,
src/controllers/wizardController.ts:82:        turnoverFrequency: wizardData.propertyData.longTermAssumptions?.turnoverFrequency || 2
src/controllers/wizardController.ts:163:        turnoverFrequency: wizardData.propertyData.longTermAssumptions?.turnoverFrequency || 2
src/services/investment/brrrAnalyzer.ts:510:      turnoverFrequency: inputs.longTermAssumptions?.turnoverFrequency || 2,
```

#### SAFE Fallback Locations (using `??`):

```
src/types/propertyTypes.ts:99:    turnoverFrequency?: number;
src/types/propertyTypes.ts:199:    turnoverFrequency?: number;
src/analysis/BasePropertyAnalyzer.ts:25:  turnoverFrequency?: number; // Average tenant stay in years (default: 2)
src/analysis/BasePropertyAnalyzer.ts:124:      turnoverFrequency: this.assumptions.turnoverFrequency || 2,
src/analysis/BasePropertyAnalyzer.ts:148:    const turnoverFrequency = this.assumptions.turnoverFrequency || 2;
src/analysis/BasePropertyAnalyzer.ts:149:    const baseTurnoverRate = 1 / turnoverFrequency;
src/analysis/BasePropertyAnalyzer.ts:154:      turnoverFrequency,
src/analysis/BasePropertyAnalyzer.ts:450:    const turnoverFrequency = this.assumptions.turnoverFrequency || 2;
src/analysis/BasePropertyAnalyzer.ts:452:    const baseTurnoverRate = 1 / turnoverFrequency;
src/analysis/MultiFamilyAnalyzer.ts:440:    const turnoverFrequency = this.assumptions.turnoverFrequency || 3;
```

---

### Field: `prepFees`

**RISKY `||` patterns found**: 10
**SAFE `??` patterns found**: 27

#### RISKY Fallback Locations (using `||`):

```
src/analysis/BasePropertyAnalyzer.ts:146:    const prepFees = this.data.tenantTurnoverFees?.prepFees || 500;
src/analysis/BasePropertyAnalyzer.ts:445:    const prepFees = this.data.tenantTurnoverFees?.prepFees || 500;
src/analysis/MultiFamilyAnalyzer.ts:442:    const prepFees = this.data.tenantTurnoverFees?.prepFees || 500;
src/analysis/MultiFamilyAnalyzer.ts:1042:      const prepFees = (this.data.tenantTurnoverFees?.prepFees || 500) * expenseInflationFactor;
src/analysis/SFRAnalyzer.ts:70:      prepFees: this.data.tenantTurnoverFees?.prepFees || 500,
src/analysis/SFRAnalyzer.ts:333:      prepFees: this.data.tenantTurnoverFees?.prepFees || 500,
src/utils/financialCalculations.ts:768:      prepFees: data.tenantTurnoverFees?.prepFees || 500,
src/utils/financialCalculations.ts:818:          prepFees: data.tenantTurnoverFees?.prepFees || 500,
src/utils/financialCalculations.ts:866:      prepFees: data.tenantTurnoverFees?.prepFees || 500,
src/services/investment/brrrAnalyzer.ts:507:      prepFees: inputs.tenantTurnoverFees?.prepFees || 500,
```

#### SAFE Fallback Locations (using `??`):

```
src/types/propertyTypes.ts:66:    prepFees: number;
src/analysis/BasePropertyAnalyzer.ts:146:    const prepFees = this.data.tenantTurnoverFees?.prepFees || 500;
src/analysis/BasePropertyAnalyzer.ts:152:      prepFees,
src/analysis/BasePropertyAnalyzer.ts:206:      const inflatedPrepFees = prepFees * expenseInflationFactor;
src/analysis/BasePropertyAnalyzer.ts:222:          prepFeesPart: inflatedPrepFees * turnoverRate,
src/analysis/BasePropertyAnalyzer.ts:445:    const prepFees = this.data.tenantTurnoverFees?.prepFees || 500;
src/analysis/BasePropertyAnalyzer.ts:459:    const annualTurnoverCost = (prepFees + (monthlyRent * realtorCommission)) * turnoverRate;
src/analysis/MultiFamilyAnalyzer.ts:442:    const prepFees = this.data.tenantTurnoverFees?.prepFees || 500;
src/analysis/MultiFamilyAnalyzer.ts:445:    const turnoverCosts = (prepFees + (monthlyRent * realtorCommission)) * turnoverRate;
src/analysis/MultiFamilyAnalyzer.ts:1042:      const prepFees = (this.data.tenantTurnoverFees?.prepFees || 500) * expenseInflationFactor;
```

---

### Field: `realtorCommission`

**RISKY `||` patterns found**: 10
**SAFE `??` patterns found**: 27

#### RISKY Fallback Locations (using `||`):

```
src/analysis/BasePropertyAnalyzer.ts:147:    const realtorCommission = this.data.tenantTurnoverFees?.realtorCommission || 0.5;
src/analysis/BasePropertyAnalyzer.ts:446:    const realtorCommission = this.data.tenantTurnoverFees?.realtorCommission || 0.5;
src/analysis/MultiFamilyAnalyzer.ts:443:    const realtorCommission = this.data.tenantTurnoverFees?.realtorCommission || 0.5;
src/analysis/MultiFamilyAnalyzer.ts:1043:      const realtorCommission = this.data.tenantTurnoverFees?.realtorCommission || 0.5;
src/analysis/SFRAnalyzer.ts:72:      realtorCommission: this.data.tenantTurnoverFees?.realtorCommission || 0.5,
src/analysis/SFRAnalyzer.ts:335:      realtorCommission: this.data.tenantTurnoverFees?.realtorCommission || 0.5,
src/utils/financialCalculations.ts:770:      realtorCommission: data.tenantTurnoverFees?.realtorCommission || 0.5,
src/utils/financialCalculations.ts:820:          realtorCommission: data.tenantTurnoverFees?.realtorCommission || 0.5,
src/utils/financialCalculations.ts:868:      realtorCommission: data.tenantTurnoverFees?.realtorCommission || 0.5,
src/services/investment/brrrAnalyzer.ts:509:      realtorCommission: inputs.tenantTurnoverFees?.realtorCommission || 0.5,
```

#### SAFE Fallback Locations (using `??`):

```
src/types/propertyTypes.ts:67:    realtorCommission: number;
src/analysis/BasePropertyAnalyzer.ts:147:    const realtorCommission = this.data.tenantTurnoverFees?.realtorCommission || 0.5;
src/analysis/BasePropertyAnalyzer.ts:153:      realtorCommission,
src/analysis/BasePropertyAnalyzer.ts:213:      const turnoverCosts = (inflatedPrepFees + (monthlyRentForYear * realtorCommission)) * turnoverRate;
src/analysis/BasePropertyAnalyzer.ts:223:          commissionPart: (monthlyRentForYear * realtorCommission) * turnoverRate
src/analysis/BasePropertyAnalyzer.ts:446:    const realtorCommission = this.data.tenantTurnoverFees?.realtorCommission || 0.5;
src/analysis/BasePropertyAnalyzer.ts:459:    const annualTurnoverCost = (prepFees + (monthlyRent * realtorCommission)) * turnoverRate;
src/analysis/MultiFamilyAnalyzer.ts:443:    const realtorCommission = this.data.tenantTurnoverFees?.realtorCommission || 0.5;
src/analysis/MultiFamilyAnalyzer.ts:445:    const turnoverCosts = (prepFees + (monthlyRent * realtorCommission)) * turnoverRate;
src/analysis/MultiFamilyAnalyzer.ts:1043:      const realtorCommission = this.data.tenantTurnoverFees?.realtorCommission || 0.5;
```

---

### Field: `totalUnits`

**RISKY `||` patterns found**: 6
**SAFE `??` patterns found**: 74

#### RISKY Fallback Locations (using `||`):

```
src/services/portfolio/portfolioPropertyMetricsService.ts:258:    const totalUnits = property.totalUnits || 1;
src/services/portfolio/portfolioPropertyMetricsService.ts:288:    const totalUnits = property.totalStorageUnits || 100;
src/services/portfolio/portfolioPropertyMetricsService.ts:296:    const totalLots = property.totalLots || property.totalUnits || 1;
src/services/portfolio/portfolioPropertyMetricsService.ts:318:    const totalUnits = property.totalUnits || 1;
src/services/portfolio/portfolioAnalyticsService.ts:392:      const totalUnits = property.totalUnits || 1;
src/services/portfolio/enhancedPortfolioAI.ts:416:      const units = prop.totalUnits || 1;
```

#### SAFE Fallback Locations (using `??`):

```
src/types/propertyTypes.ts:147:  totalUnits: number;  // 2-32 units (target range)
src/analysis/MultiFamilyAnalyzer.ts:32:    if (this.data.units && this.data.units.length !== this.data.totalUnits) {
src/analysis/MultiFamilyAnalyzer.ts:35:        `  totalUnits field: ${this.data.totalUnits}\n` +
src/analysis/MultiFamilyAnalyzer.ts:38:        `  → Recommendation: Update totalUnits field to match actual unit count`
src/analysis/MultiFamilyAnalyzer.ts:44:      if (aggregatedUnitCount !== this.data.totalUnits) {
src/analysis/MultiFamilyAnalyzer.ts:47:          `  totalUnits field: ${this.data.totalUnits}\n` +
src/analysis/MultiFamilyAnalyzer.ts:134:    if (downPaymentPercent < 15 && this.data.totalUnits >= 5) {
src/analysis/MultiFamilyAnalyzer.ts:152:    if (this.data.buildingType && this.data.totalUnits > 0) {
src/analysis/MultiFamilyAnalyzer.ts:170:      const opExPerUnit = totalMonthlyOpEx / this.data.totalUnits;
src/analysis/MultiFamilyAnalyzer.ts:192:            impact: `Actual expenses may be ${((range.min - opExPerUnit) * this.data.totalUnits * 12).toFixed(0)} higher annually`,
```

---

### Field: `totalSqft`

**RISKY `||` patterns found**: 1
**SAFE `??` patterns found**: 25

#### RISKY Fallback Locations (using `||`):

```
src/services/portfolio/portfolioAnalyticsService.ts:211:            squareFeet = (property as any).totalSqft || 0;
```

#### SAFE Fallback Locations (using `??`):

```
src/types/propertyTypes.ts:148:  totalSqft: number;
src/analysis/MultiFamilyAnalyzer.ts:58:      const sqftDifference = Math.abs(totalCalculatedSqft - this.data.totalSqft);
src/analysis/MultiFamilyAnalyzer.ts:59:      const sqftDifferencePercent = (sqftDifference / this.data.totalSqft) * 100;
src/analysis/MultiFamilyAnalyzer.ts:64:          `  totalSqft field: ${this.data.totalSqft.toLocaleString()} sq ft\n` +
src/analysis/MultiFamilyAnalyzer.ts:74:      const sqftDifference = Math.abs(totalCalculatedSqft - this.data.totalSqft);
src/analysis/MultiFamilyAnalyzer.ts:75:      const sqftDifferencePercent = (sqftDifference / this.data.totalSqft) * 100;
src/analysis/MultiFamilyAnalyzer.ts:80:          `  totalSqft field: ${this.data.totalSqft.toLocaleString()} sq ft\n` +
src/analysis/MultiFamilyAnalyzer.ts:290:    debug(`[MF] Property: ${this.data.totalUnits}-unit building, ${this.data.totalSqft.toLocaleString()} sq ft`);
src/analysis/MultiFamilyAnalyzer.ts:601:    const rentPerSqft = this.calculateRentPerSqft(grossIncome, this.data.totalSqft);
src/analysis/MultiFamilyAnalyzer.ts:625:        this.data.totalSqft
```

---

### Field: `buildingType`

**RISKY `||` patterns found**: 1
**SAFE `??` patterns found**: 17

#### RISKY Fallback Locations (using `||`):

```
src/services/investment/MFDecisionEngine.ts:367:    const adjustment = buildingTypeAdjustments[buildingType] || 0;
```

#### SAFE Fallback Locations (using `??`):

```
src/types/propertyTypes.ts:150:  buildingType?: MFBuildingType;  // Phase 1: GARDEN | MID_RISE | COMPLEX
src/analysis/MultiFamilyAnalyzer.ts:152:    if (this.data.buildingType && this.data.totalUnits > 0) {
src/analysis/MultiFamilyAnalyzer.ts:173:      const buildingTypeRanges: Record<string, { min: number; max: number; typical: string }> = {
src/analysis/MultiFamilyAnalyzer.ts:179:      const range = buildingTypeRanges[this.data.buildingType];
src/analysis/MultiFamilyAnalyzer.ts:183:            `[MF] ⚠️ VALIDATION WARNING: Operating expenses appear low for ${this.data.buildingType}\n` +
src/analysis/MultiFamilyAnalyzer.ts:185:            `  Typical range for ${this.data.buildingType}: ${range.typical}\n` +
src/analysis/MultiFamilyAnalyzer.ts:191:            message: `Operating expenses ($${opExPerUnit.toFixed(2)}/unit/month) appear low for ${this.data.buildingType} building`,
src/analysis/MultiFamilyAnalyzer.ts:193:            recommendation: `Typical range for ${this.data.buildingType}: ${range.typical}. Verify all expense categories are included.`,
src/analysis/MultiFamilyAnalyzer.ts:198:            `[MF] ⚠️ VALIDATION WARNING: Operating expenses appear high for ${this.data.buildingType}\n` +
src/analysis/MultiFamilyAnalyzer.ts:200:            `  Typical range for ${this.data.buildingType}: ${range.typical}\n` +
```

---

### Field: `maintenanceCostPerUnit`

**RISKY `||` patterns found**: 4
**SAFE `??` patterns found**: 15

#### RISKY Fallback Locations (using `||`):

```
src/analysis/MultiFamilyAnalyzer.ts:410:    const maintenance = (maintenanceCostPerUnit || 100) * totalUnits * 12;
src/analysis/MultiFamilyAnalyzer.ts:675:    const maintenance = ((maintenanceCostPerUnit || 100) * totalUnits);
src/analysis/MultiFamilyAnalyzer.ts:1018:      const maintenance = (this.data.maintenanceCostPerUnit || 100) * this.data.totalUnits * 12 * expenseInflationFactor;
src/services/portfolio/portfolioAnalyticsService.ts:393:      const maintenancePerUnit = property.maintenanceCostPerUnit || 0;
```

#### SAFE Fallback Locations (using `??`):

```
src/types/propertyTypes.ts:181:  maintenanceCostPerUnit: number;  // Monthly per-unit maintenance budget
src/analysis/MultiFamilyAnalyzer.ts:399:    const { purchasePrice, propertyTaxRate, insurancePerUnit, propertyManagementRate, maintenanceCostPerUnit, totalUnits } = this.data;
src/analysis/MultiFamilyAnalyzer.ts:410:    const maintenance = (maintenanceCostPerUnit || 100) * totalUnits * 12;
src/analysis/MultiFamilyAnalyzer.ts:413:    if (!maintenanceCostPerUnit) {
src/analysis/MultiFamilyAnalyzer.ts:669:    const { purchasePrice, propertyTaxRate, insurancePerUnit, propertyManagementRate, maintenanceCostPerUnit, totalUnits } = this.data;
src/analysis/MultiFamilyAnalyzer.ts:675:    const maintenance = ((maintenanceCostPerUnit || 100) * totalUnits);
src/analysis/MultiFamilyAnalyzer.ts:1018:      const maintenance = (this.data.maintenanceCostPerUnit || 100) * this.data.totalUnits * 12 * expenseInflationFactor;
src/utils/financialCalculations.ts:851:      maintenanceCost: data.maintenanceCostPerUnit * data.totalUnits,
src/models/Deal.ts:526:  maintenanceCostPerUnit: number;
src/models/Deal.ts:1230:  maintenanceCostPerUnit: { 
```

---

### Field: `electric`

**RISKY `||` patterns found**: 6
**SAFE `??` patterns found**: 10

#### RISKY Fallback Locations (using `||`):

```
src/analysis/MultiFamilyAnalyzer.ts:163:        ? (this.data.commonAreaUtilities.electric || 0) +
src/analysis/MultiFamilyAnalyzer.ts:424:        (this.data.commonAreaUtilities.electric || 0) +
src/analysis/MultiFamilyAnalyzer.ts:684:      commonAreaElectricity = this.data.commonAreaUtilities.electric || 0;
src/analysis/MultiFamilyAnalyzer.ts:718:      (this.data.commonAreaUtilities.electric || 0) +
src/analysis/MultiFamilyAnalyzer.ts:1025:        ? ((this.data.commonAreaUtilities.electric || 0) +
src/services/portfolio/portfolioPropertyMetricsService.ts:313:      return (utilities.electric || 0) + (utilities.water || 0) + 
```

#### SAFE Fallback Locations (using `??`):

```
src/types/propertyTypes.ts:176:    electric: number;   // Common area electricity (monthly)
src/analysis/MultiFamilyAnalyzer.ts:163:        ? (this.data.commonAreaUtilities.electric || 0) +
src/analysis/MultiFamilyAnalyzer.ts:424:        (this.data.commonAreaUtilities.electric || 0) +
src/analysis/MultiFamilyAnalyzer.ts:684:      commonAreaElectricity = this.data.commonAreaUtilities.electric || 0;
src/analysis/MultiFamilyAnalyzer.ts:718:      (this.data.commonAreaUtilities.electric || 0) +
src/analysis/MultiFamilyAnalyzer.ts:985:   * - Common area utilities (electric, water, gas, trash)
src/analysis/MultiFamilyAnalyzer.ts:1025:        ? ((this.data.commonAreaUtilities.electric || 0) +
src/models/Deal.ts:36:  electric: number;
src/controllers/deals.ts:1557:      electric: 350,
src/services/portfolio/portfolioPropertyMetricsService.ts:313:      return (utilities.electric || 0) + (utilities.water || 0) + 
```

---

### Field: `water`

**RISKY `||` patterns found**: 8
**SAFE `??` patterns found**: 19

#### RISKY Fallback Locations (using `||`):

```
src/analysis/MultiFamilyAnalyzer.ts:164:          (this.data.commonAreaUtilities.water || 0) +
src/analysis/MultiFamilyAnalyzer.ts:425:        (this.data.commonAreaUtilities.water || 0) +
src/analysis/MultiFamilyAnalyzer.ts:685:      waterSewer = this.data.commonAreaUtilities.water || 0;
src/analysis/MultiFamilyAnalyzer.ts:719:      (this.data.commonAreaUtilities.water || 0) +
src/analysis/MultiFamilyAnalyzer.ts:1026:           (this.data.commonAreaUtilities.water || 0) +
src/analysis/MultiFamilyAnalyzer.ts:1165:        waterSewer: breakdown.waterSewer || 0,
src/analysis/MultiFamilyAnalyzer.ts:1185:        (exp.waterSewer || 0) +
src/services/portfolio/portfolioPropertyMetricsService.ts:313:      return (utilities.electric || 0) + (utilities.water || 0) + 
```

#### SAFE Fallback Locations (using `??`):

```
src/types/propertyTypes.ts:177:    water: number;      // Water/sewer for common areas (monthly)
src/types/analysis.ts:28:  waterSewer: number;
src/analysis/BasePropertyAnalyzer.ts:472:      waterSewer: 0,
src/analysis/MultiFamilyAnalyzer.ts:164:          (this.data.commonAreaUtilities.water || 0) +
src/analysis/MultiFamilyAnalyzer.ts:425:        (this.data.commonAreaUtilities.water || 0) +
src/analysis/MultiFamilyAnalyzer.ts:680:    let waterSewer = 0;
src/analysis/MultiFamilyAnalyzer.ts:685:      waterSewer = this.data.commonAreaUtilities.water || 0;
src/analysis/MultiFamilyAnalyzer.ts:705:      waterSewer,
src/analysis/MultiFamilyAnalyzer.ts:719:      (this.data.commonAreaUtilities.water || 0) +
src/analysis/MultiFamilyAnalyzer.ts:985:   * - Common area utilities (electric, water, gas, trash)
```

---

### Field: `gas`

**RISKY `||` patterns found**: 6
**SAFE `??` patterns found**: 12

#### RISKY Fallback Locations (using `||`):

```
src/analysis/MultiFamilyAnalyzer.ts:165:          (this.data.commonAreaUtilities.gas || 0) +
src/analysis/MultiFamilyAnalyzer.ts:426:        (this.data.commonAreaUtilities.gas || 0) +
src/analysis/MultiFamilyAnalyzer.ts:686:      utilities = this.data.commonAreaUtilities.gas || 0;
src/analysis/MultiFamilyAnalyzer.ts:720:      (this.data.commonAreaUtilities.gas || 0) +
src/analysis/MultiFamilyAnalyzer.ts:1027:           (this.data.commonAreaUtilities.gas || 0) +
src/services/portfolio/portfolioPropertyMetricsService.ts:314:             (utilities.gas || 0) + (utilities.trash || 0);
```

#### SAFE Fallback Locations (using `??`):

```
src/types/propertyTypes.ts:178:    gas: number;        // Gas for common areas (monthly)
src/analysis/MultiFamilyAnalyzer.ts:165:          (this.data.commonAreaUtilities.gas || 0) +
src/analysis/MultiFamilyAnalyzer.ts:426:        (this.data.commonAreaUtilities.gas || 0) +
src/analysis/MultiFamilyAnalyzer.ts:686:      utilities = this.data.commonAreaUtilities.gas || 0;
src/analysis/MultiFamilyAnalyzer.ts:720:      (this.data.commonAreaUtilities.gas || 0) +
src/analysis/MultiFamilyAnalyzer.ts:985:   * - Common area utilities (electric, water, gas, trash)
src/analysis/MultiFamilyAnalyzer.ts:1027:           (this.data.commonAreaUtilities.gas || 0) +
src/models/Deal.ts:38:  gas: number;
src/controllers/deals.ts:1559:      gas: 200,
src/services/investment/marketTierService.ts:77:    'Tempe', 'Mesa', 'Las Vegas', 'Henderson', 'Boise',
```

---

### Field: `trash`

**RISKY `||` patterns found**: 6
**SAFE `??` patterns found**: 14

#### RISKY Fallback Locations (using `||`):

```
src/analysis/MultiFamilyAnalyzer.ts:166:          (this.data.commonAreaUtilities.trash || 0)
src/analysis/MultiFamilyAnalyzer.ts:427:        (this.data.commonAreaUtilities.trash || 0)
src/analysis/MultiFamilyAnalyzer.ts:687:      garbage = this.data.commonAreaUtilities.trash || 0;
src/analysis/MultiFamilyAnalyzer.ts:721:      (this.data.commonAreaUtilities.trash || 0);
src/analysis/MultiFamilyAnalyzer.ts:1028:           (this.data.commonAreaUtilities.trash || 0)) * 12 * expenseInflationFactor
src/services/portfolio/portfolioPropertyMetricsService.ts:314:             (utilities.gas || 0) + (utilities.trash || 0);
```

#### SAFE Fallback Locations (using `??`):

```
src/types/propertyTypes.ts:179:    trash: number;      // Trash removal (monthly)
src/analysis/MultiFamilyAnalyzer.ts:166:          (this.data.commonAreaUtilities.trash || 0)
src/analysis/MultiFamilyAnalyzer.ts:427:        (this.data.commonAreaUtilities.trash || 0)
src/analysis/MultiFamilyAnalyzer.ts:687:      garbage = this.data.commonAreaUtilities.trash || 0;
src/analysis/MultiFamilyAnalyzer.ts:721:      (this.data.commonAreaUtilities.trash || 0);
src/analysis/MultiFamilyAnalyzer.ts:985:   * - Common area utilities (electric, water, gas, trash)
src/analysis/MultiFamilyAnalyzer.ts:1028:           (this.data.commonAreaUtilities.trash || 0)) * 12 * expenseInflationFactor
src/utils/emailValidator.ts:14:  'throwaway.email', 'trashmail.com', 'trashmail.net',
src/utils/emailValidator.ts:30:  'meltmail.com', 'trashmailer.com', 'put2.net',
src/utils/emailValidator.ts:31:  'spamgourmet.com', 'thankyou2010.com', 'trash2009.com',
```

---

### Field: `afterRepairValue`

**RISKY `||` patterns found**: 6
**SAFE `??` patterns found**: 48

#### RISKY Fallback Locations (using `||`):

```
src/analysis/BasePropertyAnalyzer.ts:96:      (this.data as any).brrrr?.afterRepairValue ||  // Check nested BRRRR structure FIRST
src/analysis/BasePropertyAnalyzer.ts:97:      (this.data as any).afterRepairValue ||          // Then check top-level (backwards compatibility)
src/analysis/BasePropertyAnalyzer.ts:105:      arvNested: (this.data as any).brrrr?.afterRepairValue || 'N/A',
src/analysis/BasePropertyAnalyzer.ts:106:      arvTopLevel: (this.data as any).afterRepairValue || 'N/A',
src/analysis/BasePropertyAnalyzer.ts:378:    const initialPropertyValue = (this.data as any).afterRepairValue || this.data.purchasePrice;
src/validation/brrrValidation.ts:178:  if (!inputs.brrrr.afterRepairValue || inputs.brrrr.afterRepairValue <= 0) {
```

#### SAFE Fallback Locations (using `??`):

```
src/types/propertyTypes.ts:13:  afterRepairValue: number;
src/types/propertyTypes.ts:89:  afterRepairValue?: number;
src/types/propertyTypes.ts:122:  afterRepairValueRatio?: number;
src/types/analysis.ts:69:  afterRepairValueRatio?: number;
src/analysis/BasePropertyAnalyzer.ts:93:    // Fix: Check NESTED brrrr.afterRepairValue first (Issue #42 - Dec 29, 2025)
src/analysis/BasePropertyAnalyzer.ts:94:    // ARV is stored at this.data.brrrr.afterRepairValue, not this.data.afterRepairValue
src/analysis/BasePropertyAnalyzer.ts:96:      (this.data as any).brrrr?.afterRepairValue ||  // Check nested BRRRR structure FIRST
src/analysis/BasePropertyAnalyzer.ts:97:      (this.data as any).afterRepairValue ||          // Then check top-level (backwards compatibility)
src/analysis/BasePropertyAnalyzer.ts:105:      arvNested: (this.data as any).brrrr?.afterRepairValue || 'N/A',
src/analysis/BasePropertyAnalyzer.ts:106:      arvTopLevel: (this.data as any).afterRepairValue || 'N/A',
```

---

### Field: `refinanceInterestRate`

**RISKY `||` patterns found**: 1
**SAFE `??` patterns found**: 5

#### RISKY Fallback Locations (using `||`):

```
src/services/investment/brrrAnalyzer.ts:455:    const refinanceRate = inputs.brrrr.refinanceInterestRate || inputs.interestRate;
```

#### SAFE Fallback Locations (using `??`):

```
src/types/propertyTypes.ts:39:  refinanceInterestRate?: number;
src/services/investment/brrrAnalyzer.ts:43:    refinanceInterestRate?: number; // Issue #51: Cash-out refi rate (typically +2-5% above initial)
src/services/investment/brrrAnalyzer.ts:455:    const refinanceRate = inputs.brrrr.refinanceInterestRate || inputs.interestRate;
src/services/investment/brrrAnalyzer.ts:458:    if (!inputs.brrrr.refinanceInterestRate) {
src/services/investment/brrrAnalyzer.ts:459:      console.warn(`[BRRRR Analyzer] Using fallback refinance rate: ${inputs.interestRate}% (user did not specify refinanceInterestRate)`);
```

---

### Field: `refinanceLTV`

**RISKY `||` patterns found**: 2
**SAFE `??` patterns found**: 24

#### RISKY Fallback Locations (using `||`):

```
src/services/investment/brrrAnalyzer.ts:351:    const ltv = inputs.brrrr.refinanceLTV || 75;
src/validation/brrrValidation.ts:314:  const refinanceLTV = inputs.brrrr.refinanceLTV || BRRRR_VALIDATION_RULES.refinanceLTVDefault;
```

#### SAFE Fallback Locations (using `??`):

```
src/types/propertyTypes.ts:14:  refinanceLTV: number;  // 65-80%, default 75
src/models/Deal.ts:1172:    refinanceLTV: {
src/controllers/deals.ts:920:          error: 'BRRRR strategy requires brrrr object with rehabBudget, afterRepairValue, refinanceLTV, and seasoningPeriod'
src/services/investment/brrrAnalyzer.ts:39:    refinanceLTV?: number; // Default 75%
src/services/investment/brrrAnalyzer.ts:100:  refinanceLTV: number;
src/services/investment/brrrAnalyzer.ts:351:    const ltv = inputs.brrrr.refinanceLTV || 75;
src/services/investment/brrrAnalyzer.ts:369:      refinanceLTV: ltv,
src/validation/brrrValidation.ts:36:  refinanceLTVMin: 65,           // Conservative lender minimum
src/validation/brrrValidation.ts:37:  refinanceLTVMax: 80,           // Standard maximum (some lenders go to 85%)
src/validation/brrrValidation.ts:38:  refinanceLTVDefault: 75,       // Industry standard for cash-out refinance
```

---

### Field: `seasoningPeriod`

**RISKY `||` patterns found**: 6
**SAFE `??` patterns found**: 27

#### RISKY Fallback Locations (using `||`):

```
src/services/investment/investmentDecisionEngine.ts:2099:            `Stabilize property during ${brrrInputs.brrrr.seasoningPeriod || 12}-month seasoning period`,
src/services/investment/investmentDecisionEngine.ts:2103:            `Refinance after ${brrrInputs.brrrr.seasoningPeriod || 12} months to recover ${brrrAnalysis.capitalRecovery.capitalRecoveryRate.toFixed(0)}% of capital`,
src/services/investment/brrrAnalyzer.ts:285:    const months = inputs.brrrr.seasoningPeriod || 12;
src/services/investment/brrrAnalyzer.ts:360:      inputs.brrrr.seasoningPeriod || 12
src/validation/brrrValidation.ts:357:  const seasoningPeriod = inputs.brrrr.seasoningPeriod || BRRRR_VALIDATION_RULES.seasoningPeriodStandard;
src/validation/brrrValidation.ts:451:  const seasoningPeriod = inputs.brrrr?.seasoningPeriod || BRRRR_VALIDATION_RULES.seasoningPeriodStandard;
```

#### SAFE Fallback Locations (using `??`):

```
src/types/propertyTypes.ts:15:  seasoningPeriod: number;  // 6-24 months, default 12
src/models/Deal.ts:1179:    seasoningPeriod: {
src/controllers/deals.ts:920:          error: 'BRRRR strategy requires brrrr object with rehabBudget, afterRepairValue, refinanceLTV, and seasoningPeriod'
src/services/investment/investmentDecisionEngine.ts:2099:            `Stabilize property during ${brrrInputs.brrrr.seasoningPeriod || 12}-month seasoning period`,
src/services/investment/investmentDecisionEngine.ts:2103:            `Refinance after ${brrrInputs.brrrr.seasoningPeriod || 12} months to recover ${brrrAnalysis.capitalRecovery.capitalRecoveryRate.toFixed(0)}% of capital`,
src/services/investment/brrrAnalyzer.ts:40:    seasoningPeriod?: number; // Default 12 months
src/services/investment/brrrAnalyzer.ts:285:    const months = inputs.brrrr.seasoningPeriod || 12;
src/services/investment/brrrAnalyzer.ts:360:      inputs.brrrr.seasoningPeriod || 12
src/validation/brrrValidation.ts:41:  seasoningPeriodStandard: 12,   // 12 months standard
src/validation/brrrValidation.ts:42:  seasoningPeriodMin: 6,         // Some portfolio lenders allow 6 months
```

---

### Field: `rehabDuration`

**RISKY `||` patterns found**: 0
**SAFE `??` patterns found**: 0

---

### Field: `carryingCosts`

**RISKY `||` patterns found**: 0
**SAFE `??` patterns found**: 0

---

### Field: `rehabCosts`

**RISKY `||` patterns found**: 0
**SAFE `??` patterns found**: 0

---

### Field: `rehabBudget`

**RISKY `||` patterns found**: 1
**SAFE `??` patterns found**: 44

#### RISKY Fallback Locations (using `||`):

```
src/validation/brrrValidation.ts:168:  if (!inputs.brrrr.rehabBudget || inputs.brrrr.rehabBudget <= 0) {
```

#### SAFE Fallback Locations (using `??`):

```
src/types/propertyTypes.ts:12:  rehabBudget: number;
src/models/Deal.ts:1162:    rehabBudget: {
src/controllers/deals.ts:920:          error: 'BRRRR strategy requires brrrr object with rehabBudget, afterRepairValue, refinanceLTV, and seasoningPeriod'
src/services/investment/investmentDecisionEngine.ts:2098:            `Complete $${brrrInputs.brrrr.rehabBudget.toLocaleString()} rehab within budget`,
src/services/investment/investmentDecisionEngine.ts:2218:    const rehabPercent = (brrrAnalysis.rehabBudget / brrrAnalysis.totalInvestment) * 100;
src/services/investment/brrrAnalyzer.ts:37:    rehabBudget: number;
src/services/investment/brrrAnalyzer.ts:152:  rehabBudget: number;
src/services/investment/brrrAnalyzer.ts:162:  rehabBudget: number;
src/services/investment/brrrAnalyzer.ts:185:  rehabBudget: number;
src/services/investment/brrrAnalyzer.ts:249:           inputs.brrrr.rehabBudget;
```

---

### Field: `downPaymentPercentage`

**RISKY `||` patterns found**: 0
**SAFE `??` patterns found**: 11

#### SAFE Fallback Locations (using `??`):

```
src/types/wizardTypes.ts:106:    downPaymentPercentage: number;
src/controllers/deals.ts:169:                      dealData.downPaymentPercentage !== undefined;
src/controllers/deals.ts:287:        !['maintenanceReservePercentage', 'downPaymentPercentage', 'closingCostPercentage', '_isWizardData'].includes(key)
src/controllers/deals.ts:300:  delete convertedData.downPaymentPercentage;
src/routes/analyzeRoutes.ts:45:  delete standardData.downPaymentPercentage;
src/routes/analyzeRoutes.ts:186:      hasDownPaymentPercentage: formData.downPaymentPercentage !== undefined,
src/routes/analyzeRoutes.ts:187:      downPaymentPercentageValue: formData.downPaymentPercentage,
src/routes/analyzeRoutes.ts:203:                        formData.downPaymentPercentage !== undefined;
src/routes/analyzeRoutes.ts:210:        downPaymentPercentage: formData.downPaymentPercentage,
src/services/propertyDataAggregator.ts:365:      downPaymentPercentage: propertyType === 'SFR' ? 25 : 25, // 25% for investment properties
```

---

### Field: `closingCostPercentage`

**RISKY `||` patterns found**: 0
**SAFE `??` patterns found**: 6

#### SAFE Fallback Locations (using `??`):

```
src/types/wizardTypes.ts:107:    closingCostPercentage: number;
src/controllers/deals.ts:287:        !['maintenanceReservePercentage', 'downPaymentPercentage', 'closingCostPercentage', '_isWizardData'].includes(key)
src/controllers/deals.ts:301:  delete convertedData.closingCostPercentage;
src/routes/analyzeRoutes.ts:46:  delete standardData.closingCostPercentage;
src/services/propertyDataAggregator.ts:366:      closingCostPercentage: 2.5, // National average
src/services/propertyDataAggregator.ts:470:      closingCostPercentage: 2.5,
```

---

### Field: `maintenanceReservePercentage`

**RISKY `||` patterns found**: 2
**SAFE `??` patterns found**: 39

#### RISKY Fallback Locations (using `||`):

```
src/controllers/deals.ts:167:                      dealData.maintenanceReservePercentage !== undefined ||
src/routes/analyzeRoutes.ts:201:                        formData.maintenanceReservePercentage !== undefined ||
```

#### SAFE Fallback Locations (using `??`):

```
src/types/wizardTypes.ts:112:    maintenanceReservePercentage: number;
src/index.ts:123:    logger.info(`Has maintenanceReservePercentage: ${!!req.body?.maintenanceReservePercentage}`);
src/controllers/wizardController.ts:53:        wizardData.propertyData.maintenanceReservePercentage
src/controllers/wizardController.ts:129:      maintenanceReservePercentage: wizardData.propertyData?.maintenanceReservePercentage,
src/controllers/wizardController.ts:137:      wizardData.propertyData.maintenanceReservePercentage
src/controllers/wizardController.ts:180:      rawMaintenanceReservePercentage: wizardData.propertyData.maintenanceReservePercentage,
src/controllers/wizardController.ts:312:function calculateMaintenanceCost(monthlyRent?: number, maintenanceReservePercentage?: number): number {
src/controllers/wizardController.ts:316:    maintenanceReservePercentage,
src/controllers/wizardController.ts:318:    maintenanceReservePercentageType: typeof maintenanceReservePercentage
src/controllers/wizardController.ts:321:  if (!monthlyRent || !maintenanceReservePercentage) {
```

---

### Field: `annualExpenseIncrease`

**RISKY `||` patterns found**: 9
**SAFE `??` patterns found**: 12

#### RISKY Fallback Locations (using `||`):

```
src/analysis/BasePropertyAnalyzer.ts:182:      const expenseInflationFactor = Math.pow(1 + (this.assumptions.annualExpenseIncrease || 2.5) / 100, year - 1);
src/analysis/MultiFamilyAnalyzer.ts:1013:      const expenseInflationFactor = Math.pow(1 + (this.assumptions.annualExpenseIncrease || 2.5) / 100, year - 1);
src/utils/financialCalculations.ts:763:      inflationRate: assumptions.annualExpenseIncrease || 2
src/utils/financialCalculations.ts:855:      inflationRate: assumptions.annualExpenseIncrease || 2
src/utils/financialCalculations.ts:859:    const inflationFactor = Math.pow(1 + (assumptions.annualExpenseIncrease || 2) / 100, year - 1);
src/controllers/wizardController.ts:193:      annualExpenseIncrease: sfrData.longTermAssumptions.inflationRate || 2,
src/controllers/deals.ts:947:      annualExpenseIncrease: dealData.longTermAssumptions?.annualExpenseIncrease || 2,
src/controllers/deals.ts:1605:      annualExpenseIncrease: dealData.longTermAssumptions?.annualExpenseIncrease || 2,
src/routes/analyzeRoutes.ts:236:      annualExpenseIncrease: formData.longTermAssumptions?.inflationRate || 2,
```

#### SAFE Fallback Locations (using `??`):

```
src/types/propertyTypes.ts:243:  annualExpenseIncrease: number;
src/analysis/BasePropertyAnalyzer.ts:21:  annualExpenseIncrease: number;
src/analysis/BasePropertyAnalyzer.ts:121:      annualExpenseIncrease: this.assumptions.annualExpenseIncrease,
src/analysis/BasePropertyAnalyzer.ts:182:      const expenseInflationFactor = Math.pow(1 + (this.assumptions.annualExpenseIncrease || 2.5) / 100, year - 1);
src/analysis/MultiFamilyAnalyzer.ts:1013:      const expenseInflationFactor = Math.pow(1 + (this.assumptions.annualExpenseIncrease || 2.5) / 100, year - 1);
src/utils/financialCalculations.ts:763:      inflationRate: assumptions.annualExpenseIncrease || 2
src/utils/financialCalculations.ts:855:      inflationRate: assumptions.annualExpenseIncrease || 2
src/utils/financialCalculations.ts:859:    const inflationFactor = Math.pow(1 + (assumptions.annualExpenseIncrease || 2) / 100, year - 1);
src/controllers/wizardController.ts:193:      annualExpenseIncrease: sfrData.longTermAssumptions.inflationRate || 2,
src/controllers/deals.ts:947:      annualExpenseIncrease: dealData.longTermAssumptions?.annualExpenseIncrease || 2,
```

---

### Field: `HOAFees`

**RISKY `||` patterns found**: 0
**SAFE `??` patterns found**: 0

---

### Field: `utilities`

**RISKY `||` patterns found**: 10
**SAFE `??` patterns found**: 33

#### RISKY Fallback Locations (using `||`):

```
src/analysis/MultiFamilyAnalyzer.ts:686:      utilities = this.data.commonAreaUtilities.gas || 0;
src/analysis/MultiFamilyAnalyzer.ts:1166:        utilities: breakdown.utilities || 0,
src/analysis/MultiFamilyAnalyzer.ts:1186:        (exp.utilities || 0) +
src/utils/financialCalculations.ts:860:    const utilitiesTotal = Object.values(data.commonAreaUtilities || {})
src/services/portfolio/portfolioPropertyMetricsService.ts:183:        monthlyUtilities = property.utilitiesCost || 0;
src/services/portfolio/portfolioPropertyMetricsService.ts:198:        monthlyUtilities = tenantPaysNNN ? 0 : (property.utilitiesCost || 0);
src/services/portfolio/portfolioPropertyMetricsService.ts:204:        monthlyUtilities = property.utilitiesCost || 0;
src/services/portfolio/portfolioPropertyMetricsService.ts:210:        monthlyUtilities = property.utilitiesCost || 0;
src/services/portfolio/portfolioPropertyMetricsService.ts:313:      return (utilities.electric || 0) + (utilities.water || 0) + 
src/services/portfolio/portfolioPropertyMetricsService.ts:314:             (utilities.gas || 0) + (utilities.trash || 0);
```

#### SAFE Fallback Locations (using `??`):

```
src/types/analysis.ts:25:  utilities: number;
src/analysis/BasePropertyAnalyzer.ts:469:      utilities: 0,
src/analysis/MultiFamilyAnalyzer.ts:161:      // Calculate total utilities from commonAreaUtilities object
src/analysis/MultiFamilyAnalyzer.ts:677:    // Common area utilities (already monthly from input data)
src/analysis/MultiFamilyAnalyzer.ts:678:    let utilities = 0;
src/analysis/MultiFamilyAnalyzer.ts:686:      utilities = this.data.commonAreaUtilities.gas || 0;
src/analysis/MultiFamilyAnalyzer.ts:702:      utilities,
src/analysis/MultiFamilyAnalyzer.ts:985:   * - Common area utilities (electric, water, gas, trash)
src/analysis/MultiFamilyAnalyzer.ts:1023:      // MF-SPECIFIC: Common area utilities
src/analysis/MultiFamilyAnalyzer.ts:1166:        utilities: breakdown.utilities || 0,
```

---
