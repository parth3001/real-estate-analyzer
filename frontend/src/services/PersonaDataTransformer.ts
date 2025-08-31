// Persona Data Transformer Service
// Created: July 15, 2025

import { 
  UserPersona, 
  PERSONA_CONFIGS
} from '../types/persona';
import type { 
  PersonaSpecificData, 
  CoreMetricData, 
  PersonaInsight, 
  PersonaAction
} from '../types/persona';
import type { Analysis } from '../types/analysis';
import type { SFRPropertyData } from '../types/property';

export class PersonaDataTransformer {
  
  /**
   * Transform analysis data for a specific persona
   */
  static transformForPersona(
    analysisData: Analysis,
    propertyData: SFRPropertyData,
    persona: UserPersona
  ): PersonaSpecificData {
    const config = PERSONA_CONFIGS[persona];
    
    switch (persona) {
      case UserPersona.LEARNING:
        return this.transformForLearningInvestor(analysisData, propertyData, config);
      case UserPersona.EXPERIENCED:
        return this.transformForExperiencedInvestor(analysisData, propertyData, config);
      case UserPersona.DATA_ANALYST:
        return this.transformForDataAnalyst(analysisData, propertyData, config);
      case UserPersona.SPEED_SCANNER:
        return this.transformForSpeedScanner(analysisData, propertyData, config);
      default:
        return this.transformForExperiencedInvestor(analysisData, propertyData, config);
    }
  }

  /**
   * Transform data for Learning Investor persona
   */
  private static transformForLearningInvestor(
    analysisData: Analysis,
    _propertyData: SFRPropertyData,
    _config: any
  ): PersonaSpecificData {
    const coreMetrics = this.getCoreMetricsForLearning(analysisData);
    const insights = this.getInsightsForLearning(analysisData);
    const actions = this.getActionsForLearning();
    
    return {
      persona: UserPersona.LEARNING,
      coreMetrics,
      insights,
      actions,
      presentation: {
        layout: 'cards',
        grouping: 'category',
        sortBy: 'importance',
        showAnimations: true,
        density: 'comfortable',
        theme: 'educational'
      },
      summary: {
        verdict: this.getVerdict(analysisData),
        score: analysisData.investmentDecision?.professionalAssessment?.dealQuality || 0,
        confidence: 85,
        keyPoints: this.getKeyPointsForLearning(analysisData),
        riskAlerts: this.getRiskAlerts(analysisData),
        nextSteps: this.getNextStepsForLearning()
      },
      educational: {
        conceptsIntroduced: this.getConceptsIntroduced(),
        learningResources: this.getLearningResources(),
        progressTracking: {
          conceptsLearned: [],
          analysesCompleted: 0,
          proficiencyLevel: 0
        }
      }
    };
  }

  /**
   * Transform data for Experienced Investor persona
   */
  private static transformForExperiencedInvestor(
    analysisData: Analysis,
    _propertyData: SFRPropertyData,
    _config: any
  ): PersonaSpecificData {
    const coreMetrics = this.getCoreMetricsForExperienced(analysisData);
    const insights = this.getInsightsForExperienced(analysisData);
    const actions = this.getActionsForExperienced();
    
    return {
      persona: UserPersona.EXPERIENCED,
      coreMetrics,
      insights,
      actions,
      presentation: {
        layout: 'summary',
        grouping: 'importance',
        sortBy: 'importance',
        showAnimations: false,
        density: 'comfortable',
        theme: 'professional'
      },
      summary: {
        verdict: this.getVerdict(analysisData),
        score: analysisData.investmentDecision?.professionalAssessment?.dealQuality || 0,
        confidence: 85,
        keyPoints: this.getKeyPointsForExperienced(analysisData),
        riskAlerts: this.getRiskAlerts(analysisData),
        nextSteps: this.getNextStepsForExperienced()
      }
    };
  }

  /**
   * Transform data for Data Analyst persona
   */
  private static transformForDataAnalyst(
    analysisData: Analysis,
    _propertyData: SFRPropertyData,
    _config: any
  ): PersonaSpecificData {
    const coreMetrics = this.getAllMetricsForAnalyst(analysisData);
    const insights = this.getInsightsForAnalyst(analysisData);
    const actions = this.getActionsForAnalyst();
    
    return {
      persona: UserPersona.DATA_ANALYST,
      coreMetrics,
      insights,
      actions,
      presentation: {
        layout: 'dashboard',
        grouping: 'category',
        sortBy: 'custom',
        showAnimations: false,
        density: 'compact',
        theme: 'default'
      },
      summary: {
        verdict: this.getVerdict(analysisData),
        score: analysisData.investmentDecision?.professionalAssessment?.dealQuality || 0,
        confidence: 85,
        keyPoints: this.getKeyPointsForAnalyst(analysisData),
        riskAlerts: this.getRiskAlerts(analysisData),
        nextSteps: this.getNextStepsForAnalyst()
      }
    };
  }

  /**
   * Transform data for Speed Scanner persona
   */
  private static transformForSpeedScanner(
    analysisData: Analysis,
    _propertyData: SFRPropertyData,
    _config: any
  ): PersonaSpecificData {
    const coreMetrics = this.getCoreMetricsForSpeed(analysisData);
    const insights = this.getInsightsForSpeed(analysisData);
    const actions = this.getActionsForSpeed();
    
    return {
      persona: UserPersona.SPEED_SCANNER,
      coreMetrics,
      insights,
      actions,
      presentation: {
        layout: 'summary',
        grouping: 'importance',
        sortBy: 'importance',
        showAnimations: false,
        density: 'compact',
        theme: 'minimal'
      },
      summary: {
        verdict: this.getVerdict(analysisData),
        score: analysisData.investmentDecision?.professionalAssessment?.dealQuality || 0,
        confidence: 85,
        keyPoints: this.getKeyPointsForSpeed(analysisData),
        riskAlerts: this.getRiskAlerts(analysisData),
        nextSteps: this.getNextStepsForSpeed()
      }
    };
  }

  /**
   * Get core metrics for Learning Investor
   */
  private static getCoreMetricsForLearning(analysisData: Analysis): CoreMetricData[] {
    const monthlyAnalysis = analysisData.monthlyAnalysis;
    const keyMetrics = analysisData.keyMetrics;
    
    return [
      {
        id: 'monthly_cash_flow',
        name: 'Monthly Cash Flow',
        value: `$${(monthlyAnalysis.cashFlow || 0).toLocaleString()}`,
        status: (monthlyAnalysis.cashFlow || 0) > 0 ? 'positive' : 'negative',
        importance: 'critical',
        educationalContent: {
          tooltip: 'This is the money left over each month after paying all expenses',
          whyItMatters: 'Positive cash flow means the property pays for itself and puts money in your pocket',
          learnMoreUrl: '/learn/cash-flow'
        }
      },
      {
        id: 'cap_rate',
        name: 'Cap Rate',
        value: `${keyMetrics.capRate?.toFixed(2)}%`,
        status: (keyMetrics.capRate || 0) > 6 ? 'positive' : 'neutral',
        importance: 'critical',
        educationalContent: {
          tooltip: 'Cap Rate shows the return on investment if you bought the property with cash',
          whyItMatters: 'Higher cap rates generally mean better returns, but compare to your local market',
          learnMoreUrl: '/learn/cap-rate'
        }
      },
      {
        id: 'cash_on_cash',
        name: 'Cash-on-Cash Return',
        value: `${keyMetrics.cashOnCashReturn?.toFixed(2)}%`,
        status: (keyMetrics.cashOnCashReturn || 0) > 8 ? 'positive' : 'neutral',
        importance: 'high',
        educationalContent: {
          tooltip: 'This shows the return on the actual cash you invested (down payment + closing costs)',
          whyItMatters: 'This is your real return considering you used financing to buy the property',
          learnMoreUrl: '/learn/cash-on-cash'
        }
      },
      {
        id: 'investment_score',
        name: 'Deal Quality Score',
        value: `${analysisData.investmentDecision?.professionalAssessment?.dealQuality || 0}/100`,
        status: (analysisData.investmentDecision?.professionalAssessment?.dealQuality || 0) > 80 ? 'positive' : 'neutral',
        importance: 'high',
        educationalContent: {
          tooltip: 'Professional assessment analyzes all factors and gives this property an overall deal quality score',
          whyItMatters: 'This score considers market conditions, financials, and risks to give you a quick assessment',
          learnMoreUrl: '/learn/investment-score'
        }
      }
    ];
  }

  /**
   * Get core metrics for Experienced Investor
   */
  private static getCoreMetricsForExperienced(analysisData: Analysis): CoreMetricData[] {
    const monthlyAnalysis = analysisData.monthlyAnalysis;
    const keyMetrics = analysisData.keyMetrics;
    const annualAnalysis = analysisData.annualAnalysis;
    
    return [
      {
        id: 'monthly_cash_flow',
        name: 'Monthly Cash Flow',
        value: `$${(monthlyAnalysis.cashFlow || 0).toLocaleString()}`,
        status: (monthlyAnalysis.cashFlow || 0) > 0 ? 'positive' : 'negative',
        importance: 'critical'
      },
      {
        id: 'cap_rate',
        name: 'Cap Rate',
        value: `${keyMetrics.capRate?.toFixed(2)}%`,
        status: (keyMetrics.capRate || 0) > 6 ? 'positive' : 'neutral',
        importance: 'critical'
      },
      {
        id: 'cash_on_cash',
        name: 'Cash-on-Cash Return',
        value: `${keyMetrics.cashOnCashReturn?.toFixed(2)}%`,
        status: (keyMetrics.cashOnCashReturn || 0) > 8 ? 'positive' : 'neutral',
        importance: 'high'
      },
      {
        id: 'dscr',
        name: 'DSCR',
        value: `${annualAnalysis.dscr?.toFixed(2)}`,
        status: (annualAnalysis.dscr || 0) > 1.25 ? 'positive' : 'warning',
        importance: 'high'
      },
      {
        id: 'investment_score',
        name: 'Deal Quality Score',
        value: `${analysisData.investmentDecision?.professionalAssessment?.dealQuality || 0}/100`,
        status: (analysisData.investmentDecision?.professionalAssessment?.dealQuality || 0) > 80 ? 'positive' : 'neutral',
        importance: 'high'
      }
    ];
  }

  /**
   * Get all metrics for Data Analyst
   */
  private static getAllMetricsForAnalyst(analysisData: Analysis): CoreMetricData[] {
    // Return all 12 core metrics plus extended metrics
    const coreMetrics = this.getCoreMetricsForExperienced(analysisData);
    const extendedMetrics = this.getExtendedMetrics(analysisData);
    return [...coreMetrics, ...extendedMetrics];
  }

  /**
   * Get core metrics for Speed Scanner
   */
  private static getCoreMetricsForSpeed(analysisData: Analysis): CoreMetricData[] {
    const monthlyAnalysis = analysisData.monthlyAnalysis;
    const keyMetrics = analysisData.keyMetrics;
    
    return [
      {
        id: 'monthly_cash_flow',
        name: 'Cash Flow',
        value: `$${(monthlyAnalysis.cashFlow || 0).toLocaleString()}`,
        status: (monthlyAnalysis.cashFlow || 0) > 0 ? 'positive' : 'negative',
        importance: 'critical'
      },
      {
        id: 'cap_rate',
        name: 'Cap Rate',
        value: `${keyMetrics.capRate?.toFixed(1)}%`,
        status: (keyMetrics.capRate || 0) > 6 ? 'positive' : 'neutral',
        importance: 'critical'
      },
      {
        id: 'investment_score',
        name: 'Score',
        value: `${analysisData.investmentDecision?.professionalAssessment?.dealQuality || 0}`,
        status: (analysisData.investmentDecision?.professionalAssessment?.dealQuality || 0) > 80 ? 'positive' : 'neutral',
        importance: 'critical'
      }
    ];
  }

  /**
   * Get extended metrics for detailed analysis
   */
  private static getExtendedMetrics(analysisData: Analysis): CoreMetricData[] {
    const keyMetrics = analysisData.keyMetrics;
    const _longTermAnalysis = analysisData.longTermAnalysis;
    
    return [
      {
        id: 'irr',
        name: '10-Year IRR',
        value: `${_longTermAnalysis.returns.irr?.toFixed(2)}%`,
        status: (_longTermAnalysis.returns.irr || 0) > 12 ? 'positive' : 'neutral',
        importance: 'high'
      },
      {
        id: 'price_per_sqft',
        name: 'Price/SqFt',
        value: `$${keyMetrics.pricePerSqft?.toFixed(0)}`,
        status: 'neutral',
        importance: 'medium'
      },
      {
        id: 'rent_per_sqft',
        name: 'Rent/SqFt',
        value: `$${(keyMetrics as any).avgRentPerSqft?.toFixed(2) || '0.00'}`,
        status: 'neutral',
        importance: 'medium'
      },
      {
        id: 'total_return',
        name: 'Total Return',
        value: `${(keyMetrics as any).totalReturn?.toFixed(2) || '0.00'}%`,
        status: ((keyMetrics as any).totalReturn || 0) > 15 ? 'positive' : 'neutral',
        importance: 'high'
      },
      {
        id: 'total_investment',
        name: 'Total Investment',
        value: `$${(keyMetrics as any).totalInvestment?.toLocaleString() || '0'}`,
        status: 'neutral',
        importance: 'medium'
      }
    ];
  }

  /**
   * Get insights for Learning Investor
   */
  private static getInsightsForLearning(analysisData: Analysis): PersonaInsight[] {
    const insights: PersonaInsight[] = [];
    
    // Add educational insights based on the analysis
    if ((analysisData.monthlyAnalysis?.cashFlow || 0) > 0) {
      insights.push({
        id: 'positive_cash_flow',
        type: 'strength',
        title: 'Positive Cash Flow',
        description: `This property generates $${(analysisData.monthlyAnalysis?.cashFlow || 0).toLocaleString()} monthly after expenses`,
        impact: 'high',
        urgency: 'immediate',
        confidence: 95,
        educationalContent: {
          explanation: 'Positive cash flow means the property pays for itself and puts money in your pocket each month',
          actionSteps: [
            'Verify the rent estimate with local market research',
            'Review expense estimates to ensure they are realistic',
            'Consider setting aside cash flow for future maintenance'
          ],
          learnMoreUrl: '/learn/cash-flow-analysis'
        }
      });
    }
    
    if (analysisData.investmentDecision?.professionalAssessment?.dealQuality && analysisData.investmentDecision.professionalAssessment.dealQuality > 80) {
      insights.push({
        id: 'strong_deal_quality',
        type: 'strength',
        title: 'Strong Deal Quality',
        description: `Professional assessment gives this property a ${analysisData.investmentDecision.professionalAssessment.dealQuality}/100 quality score`,
        impact: 'high',
        urgency: 'immediate',
        confidence: 80,
        educationalContent: {
          explanation: 'Our AI considers market conditions, financial metrics, and risk factors to score investments',
          actionSteps: [
            'Review the detailed breakdown of the score',
            'Compare this score to other properties you are considering',
            'Consider what factors could improve or worsen the score'
          ]
        }
      });
    }
    
    return insights;
  }

  /**
   * Get insights for other personas
   */
  private static getInsightsForExperienced(analysisData: Analysis): PersonaInsight[] {
    return this.getStandardInsights(analysisData);
  }

  private static getInsightsForAnalyst(analysisData: Analysis): PersonaInsight[] {
    return this.getStandardInsights(analysisData);
  }

  private static getInsightsForSpeed(analysisData: Analysis): PersonaInsight[] {
    return this.getStandardInsights(analysisData).slice(0, 2); // Only top 2 insights
  }

  private static getStandardInsights(analysisData: Analysis): PersonaInsight[] {
    const insights: PersonaInsight[] = [];
    
    if ((analysisData.monthlyAnalysis?.cashFlow || 0) > 0) {
      insights.push({
        id: 'positive_cash_flow',
        type: 'strength',
        title: 'Positive Cash Flow',
        description: `Property generates $${(analysisData.monthlyAnalysis?.cashFlow || 0).toLocaleString()} monthly`,
        impact: 'high',
        urgency: 'immediate',
        confidence: 95
      });
    }
    
    if (analysisData.keyMetrics.capRate && analysisData.keyMetrics.capRate > 8) {
      insights.push({
        id: 'strong_cap_rate',
        type: 'strength',
        title: 'Strong Cap Rate',
        description: `${analysisData.keyMetrics.capRate.toFixed(2)}% cap rate is above market average`,
        impact: 'high',
        urgency: 'immediate',
        confidence: 85
      });
    }
    
    return insights;
  }

  /**
   * Get actions for different personas
   */
  private static getActionsForLearning(): PersonaAction[] {
    return [
      {
        id: 'view_all_metrics',
        label: 'View All Metrics',
        type: 'primary',
        icon: '📊',
        description: 'See detailed financial breakdown',
        onClick: () => console.log('View all metrics'),
        educationalTooltip: 'This will show you all the financial calculations and metrics for this property'
      },
      {
        id: 'learn_more',
        label: 'Learn More',
        type: 'secondary',
        icon: '📚',
        description: 'Access educational resources',
        onClick: () => console.log('Learn more'),
        educationalTooltip: 'Access guides and tutorials to understand real estate investing better'
      },
      {
        id: 'save_analysis',
        label: 'Save Analysis',
        type: 'info',
        icon: '💾',
        description: 'Save this analysis for later',
        onClick: () => console.log('Save analysis')
      }
    ];
  }

  private static getActionsForExperienced(): PersonaAction[] {
    return [
      {
        id: 'view_details',
        label: 'View Details',
        type: 'primary',
        icon: '📋',
        onClick: () => console.log('View details')
      },
      {
        id: 'compare_deals',
        label: 'Compare Deals',
        type: 'secondary',
        icon: '⚖️',
        onClick: () => console.log('Compare deals')
      },
      {
        id: 'save_analysis',
        label: 'Save',
        type: 'info',
        icon: '💾',
        onClick: () => console.log('Save analysis')
      }
    ];
  }

  private static getActionsForAnalyst(): PersonaAction[] {
    return [
      {
        id: 'export_data',
        label: 'Export Data',
        type: 'primary',
        icon: '📤',
        onClick: () => console.log('Export data')
      },
      {
        id: 'advanced_charts',
        label: 'Advanced Charts',
        type: 'secondary',
        icon: '📈',
        onClick: () => console.log('Advanced charts')
      },
      {
        id: 'customize_dashboard',
        label: 'Customize',
        type: 'info',
        icon: '⚙️',
        onClick: () => console.log('Customize dashboard')
      }
    ];
  }

  private static getActionsForSpeed(): PersonaAction[] {
    return [
      {
        id: 'next_deal',
        label: 'Next Deal',
        type: 'primary',
        icon: '⚡',
        onClick: () => console.log('Next deal')
      },
      {
        id: 'save_analysis',
        label: 'Save',
        type: 'secondary',
        icon: '💾',
        onClick: () => console.log('Save analysis')
      }
    ];
  }

  /**
   * Utility methods
   */
  private static getVerdict(analysisData: Analysis): 'strong_buy' | 'buy' | 'hold' | 'pass' | 'avoid' {
    const score = analysisData.investmentDecision?.professionalAssessment?.dealQuality || 0;
    const cashFlow = analysisData.monthlyAnalysis?.cashFlow || 0;
    const capRate = analysisData.keyMetrics?.capRate || 0;
    const cocReturn = analysisData.keyMetrics?.cashOnCashReturn || 0;
    const dscr = analysisData.annualAnalysis?.dscr || 0;
    
    // If key metrics are bad, override the score
    if (cashFlow <= 0 || capRate < 4 || cocReturn < 3 || dscr < 1.0) {
      return 'avoid';
    }
    
    if (cashFlow <= 200 || capRate < 5 || cocReturn < 5 || dscr < 1.15) {
      return 'pass';
    }
    
    // Now use score with tighter thresholds
    if (score >= 85 && cashFlow > 500 && capRate > 7 && cocReturn > 8) return 'strong_buy';
    if (score >= 75 && cashFlow > 300 && capRate > 6 && cocReturn > 6) return 'buy';
    if (score >= 60) return 'hold';
    if (score >= 40) return 'pass';
    return 'avoid';
  }

  private static getKeyPointsForLearning(analysisData: Analysis): string[] {
    const points: string[] = [];
    
    if ((analysisData.monthlyAnalysis?.cashFlow || 0) > 0) {
      points.push(`Positive cash flow of $${(analysisData.monthlyAnalysis?.cashFlow || 0).toLocaleString()}/month`);
    }
    
    if (analysisData.keyMetrics.capRate) {
      points.push(`Cap rate of ${analysisData.keyMetrics.capRate.toFixed(2)}%`);
    }
    
    return points;
  }

  private static getKeyPointsForExperienced(analysisData: Analysis): string[] {
    return this.getKeyPointsForLearning(analysisData);
  }

  private static getKeyPointsForAnalyst(analysisData: Analysis): string[] {
    return this.getKeyPointsForLearning(analysisData);
  }

  private static getKeyPointsForSpeed(analysisData: Analysis): string[] {
    return this.getKeyPointsForLearning(analysisData).slice(0, 3);
  }

  private static getRiskAlerts(analysisData: Analysis): string[] {
    const alerts: string[] = [];
    
    if ((analysisData.monthlyAnalysis?.cashFlow || 0) < 0) {
      alerts.push('Negative cash flow');
    }
    
    if (analysisData.annualAnalysis.dscr && analysisData.annualAnalysis.dscr < 1.25) {
      alerts.push('Low debt service coverage ratio');
    }
    
    return alerts;
  }

  private static getNextStepsForLearning(): string[] {
    return [
      'Review property details and verify assumptions',
      'Research the local market and comparable properties',
      'Consider consulting with a real estate professional',
      'Learn more about property management and maintenance'
    ];
  }

  private static getNextStepsForExperienced(): string[] {
    return [
      'Verify key assumptions with market research',
      'Review comparable sales and rental data',
      'Consider making an offer if metrics align with goals'
    ];
  }

  private static getNextStepsForAnalyst(): string[] {
    return [
      'Dive deeper into detailed financial projections',
      'Analyze market trends and economic indicators',
      'Run sensitivity analysis on key variables',
      'Export data for further analysis'
    ];
  }

  private static getNextStepsForSpeed(): string[] {
    return [
      'Make decision: proceed or pass',
      'Add to comparison list if interested',
      'Move to next deal analysis'
    ];
  }

  private static getConceptsIntroduced(): string[] {
    return [
      'Cash Flow Analysis',
      'Cap Rate Calculation',
      'Cash-on-Cash Return',
      'Investment Scoring'
    ];
  }

  private static getLearningResources(): Array<{ title: string; url: string; type: 'article' | 'video' | 'calculator' | 'guide' }> {
    return [
      {
        title: 'Understanding Cash Flow in Real Estate',
        url: '/learn/cash-flow',
        type: 'article'
      },
      {
        title: 'Cap Rate Calculator and Guide',
        url: '/learn/cap-rate',
        type: 'calculator'
      },
      {
        title: 'Real Estate Investment Fundamentals',
        url: '/learn/fundamentals',
        type: 'guide'
      }
    ];
  }
}