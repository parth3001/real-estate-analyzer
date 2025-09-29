/**
 * Tax Education Service - Educational Tax Content Only
 *
 * Provides educational tax information without optimization or investment recommendations.
 * This service runs completely parallel to the Investment Decision Engine with zero integration.
 *
 * IMPORTANT: This is purely educational content and does not constitute tax advice.
 * Users should consult with qualified tax professionals for tax planning.
 */

import { logger } from '../../utils/logger';
import { SFRData } from '../../types/propertyTypes';

// Educational content interfaces
export interface TaxEducationalContent {
  disclaimer: string;
  rateComparison: EducationalRates;
  educationalConcepts: TaxConcept[];
  cpaReferral: CPAReferralInfo;
  examples: TaxExample[];
  educational: boolean; // Always true to indicate this is educational content
}

export interface EducationalRates {
  shortTermExample: string;
  longTermExample: string;
  depreciationExample?: string;
  stateTaxExample?: string;
  note: string;
}

export interface TaxConcept {
  title: string;
  description: string;
  learnMoreUrl?: string;
}

export interface TaxExample {
  scenario: string;
  explanation: string;
  disclaimer: string;
}

export interface CPAReferralInfo {
  message: string;
  questionsToAsk: string[];
  findCPAUrl: string;
}

export class TaxEducationService {
  private static instance: TaxEducationService;

  public static getInstance(): TaxEducationService {
    if (!TaxEducationService.instance) {
      TaxEducationService.instance = new TaxEducationService();
    }
    return TaxEducationService.instance;
  }

  /**
   * Generate educational tax content
   * NO optimization calculations - purely educational
   */
  async generateEducationalContent(
    propertyData?: Partial<SFRData>,
    requestedTopic?: 'rates' | 'timeline' | 'strategies'
  ): Promise<TaxEducationalContent> {
    logger.info('Tax Education Service: Generating educational content only');

    return {
      disclaimer: this.getRequiredDisclaimer(),
      rateComparison: this.getSimpleRateComparison(propertyData),
      educationalConcepts: this.getTaxConcepts(requestedTopic),
      cpaReferral: this.getCPAReferralInfo(),
      examples: this.getGenericExamples(propertyData),
      educational: true
    };
  }

  /**
   * Required disclaimer for all tax educational content
   */
  private getRequiredDisclaimer(): string {
    return `
🎓 TAX EDUCATION ONLY

This content is for educational purposes only and does not constitute tax advice,
investment recommendations, or professional guidance. Tax laws are complex and
change frequently. Your specific situation may differ significantly from the
general examples provided.

Always consult with a qualified CPA, tax advisor, or financial professional
before making any tax-related investment decisions. This educational content
should not replace professional tax advice tailored to your specific circumstances.
    `.trim();
  }

  /**
   * Simple rate comparison using actual property data for context
   */
  private getSimpleRateComparison(propertyData?: Partial<SFRData>): EducationalRates {
    // Use actual property data for contextual examples
    const purchasePrice = propertyData?.purchasePrice || 400000;
    const monthlyRent = propertyData?.monthlyRent || Math.round(purchasePrice * 0.007); // 0.7% rent ratio if not provided

    // Use user's appreciation assumptions or realistic defaults
    const userAppreciation = propertyData?.longTermAssumptions?.annualPropertyValueIncrease;
    const realisticAppreciation = this.getRealisticAppreciation(userAppreciation);

    // Calculate realistic appreciation scenarios
    const shortTermGain = Math.round(purchasePrice * (realisticAppreciation / 100)); // 1 year using user's assumption
    const longTermGain = Math.round(purchasePrice * (realisticAppreciation * 2.5 / 100)); // 2.5 years average hold

    // Calculate property-specific depreciation
    const landValue = Math.round(purchasePrice * 0.2); // Typical 20% land value
    const depreciableBasis = purchasePrice - landValue;
    const annualDepreciation = Math.round(depreciableBasis / 27.5);

    // Get appreciation context for user education
    const appreciationContext = this.getAppreciationContext(realisticAppreciation, userAppreciation);

    return {
      shortTermExample: `Example: If you sell YOUR $${purchasePrice.toLocaleString()} property within 1 year with a $${shortTermGain.toLocaleString()} gain (${realisticAppreciation}% appreciation), it would be taxed as ordinary income (typically 22-37% federal tax rate)`,
      longTermExample: `Example: If you hold YOUR property for 2+ years and sell with a $${longTermGain.toLocaleString()} gain (${realisticAppreciation * 2.5}% total appreciation), it would qualify for capital gains rates (typically 0-20% federal tax rate)`,
      depreciationExample: `YOUR $${purchasePrice.toLocaleString()} property (excluding ~$${landValue.toLocaleString()} land value) could provide approximately $${annualDepreciation.toLocaleString()} in annual depreciation deductions`,
      stateTaxExample: propertyData?.propertyAddress?.state ?
        `Property location matters: ${this.getStateContext(propertyData.propertyAddress.state)}` :
        `State tax rates vary significantly - from 0% in states like TX and FL to over 10% in states like CA`,
      note: `${appreciationContext}. These examples use YOUR property values for context. Actual tax treatment depends on your total income, filing status, and specific situation.`
    };
  }

  /**
   * Get realistic appreciation rate with caps and defaults
   */
  private getRealisticAppreciation(userInput?: number): number {
    if (!userInput) return 4; // Conservative default: 4% annually

    // Cap aggressive inputs while respecting user's thesis
    if (userInput > 8) return 8; // Maximum 8% annually
    if (userInput < 1) return 3; // Minimum 3% annually (positive appreciation)
    return userInput;
  }

  /**
   * Get appreciation context message for user education
   */
  private getAppreciationContext(appliedRate: number, userInput?: number): string {
    if (!userInput) {
      return `Using conservative ${appliedRate}% annual appreciation (market average)`;
    }
    if (userInput !== appliedRate) {
      return `Using ${appliedRate}% appreciation (capped from your ${userInput}% assumption for realistic examples)`;
    }
    return `Based on your ${appliedRate}% annual appreciation assumption`;
  }

  /**
   * Get state-specific context
   */
  private getStateContext(state: string): string {

    const stateTaxInfo: Record<string, string> = {
      'TX': 'Texas has no state income tax - a significant advantage for rental income',
      'FL': 'Florida has no state income tax - maximizing your rental returns',
      'CA': 'California has high state taxes (up to 13.3%) - consider this in your returns',
      'NY': 'New York has high state taxes - factor this into your investment calculations',
      'WA': 'Washington has no state income tax - beneficial for rental income',
      'NV': 'Nevada has no state income tax - advantageous for real estate investors'
    };

    return stateTaxInfo[state] || 'Your state tax situation will affect your overall returns';
  }

  /**
   * Educational tax concepts
   */
  private getTaxConcepts(requestedTopic?: string): TaxConcept[] {
    const allConcepts: TaxConcept[] = [
      {
        title: 'Capital Gains Tax Basics',
        description: 'Capital gains tax applies when you sell an investment property for more than your adjusted basis (purchase price plus improvements minus depreciation).',
        learnMoreUrl: 'https://www.irs.gov/taxtopics/tc409'
      },
      {
        title: 'Short-term vs Long-term Rates',
        description: 'Properties held for 1 year or less are subject to short-term capital gains (ordinary income rates). Properties held over 1 year qualify for long-term capital gains rates.',
        learnMoreUrl: 'https://www.irs.gov/taxtopics/tc409'
      },
      {
        title: 'Depreciation and Recapture',
        description: 'Rental property depreciation reduces your taxable income during ownership but is "recaptured" and taxed at up to 25% when you sell.',
        learnMoreUrl: 'https://www.irs.gov/publications/p946'
      },
      {
        title: '1031 Exchange Basics',
        description: 'A 1031 exchange allows you to defer capital gains taxes by reinvesting proceeds into a "like-kind" property within specific timeframes.',
        learnMoreUrl: 'https://www.irs.gov/newsroom/like-kind-exchanges-real-estate-tax-tips'
      },
      {
        title: 'Passive Activity Loss Rules',
        description: 'Real estate losses may be limited if you\'re not a "real estate professional" as defined by the IRS.',
        learnMoreUrl: 'https://www.irs.gov/publications/p925'
      }
    ];

    // Filter by requested topic if specified
    if (requestedTopic === 'rates') {
      return allConcepts.slice(0, 2);
    } else if (requestedTopic === 'strategies') {
      return allConcepts.slice(3, 5);
    }

    return allConcepts;
  }

  /**
   * CPA referral information
   */
  private getCPAReferralInfo(): CPAReferralInfo {
    return {
      message: 'For personalized tax planning tailored to your specific situation, we strongly recommend consulting with a qualified tax professional.',
      questionsToAsk: [
        'What is my effective tax rate on rental income?',
        'Should I consider a 1031 exchange when selling?',
        'How can I maximize my depreciation deductions?',
        'What entity structure is most tax-efficient for my properties?',
        'How do state taxes affect my investment returns?',
        'What records should I keep for tax purposes?'
      ],
      findCPAUrl: 'https://www.aicpa.org/forthepublic/findacpa.html'
    };
  }

  /**
   * Property-specific examples for education
   */
  private getGenericExamples(propertyData?: Partial<SFRData>): TaxExample[] {
    const purchasePrice = propertyData?.purchasePrice || 400000;
    const monthlyRent = propertyData?.monthlyRent || Math.round(purchasePrice * 0.007);
    const downPayment = propertyData?.downPayment || Math.round(purchasePrice * 0.2);

    // Use user's appreciation assumptions or realistic defaults
    const userAppreciation = propertyData?.longTermAssumptions?.annualPropertyValueIncrease;
    const realisticAppreciation = this.getRealisticAppreciation(userAppreciation);

    // Calculate realistic scenarios based on THIS property with precise timeframes
    const quickFlipGain = Math.round(purchasePrice * (realisticAppreciation / 2 / 100)); // 6 months = annual ÷ 2
    const quickFlipSale = purchasePrice + quickFlipGain;

    const holdGain = Math.round(purchasePrice * (realisticAppreciation * 2.5 / 100)); // 2.5 years appreciation
    const holdSale = purchasePrice + holdGain;

    // Calculate precise percentages for display
    const quickFlipPercentage = realisticAppreciation / 2; // 6-month percentage
    const holdPercentage = Math.round((realisticAppreciation * 2.5) * 10) / 10; // 2.5-year percentage, 1 decimal

    const landValue = Math.round(purchasePrice * 0.2);
    const depreciableBasis = purchasePrice - landValue;
    const annualDepreciation = Math.round(depreciableBasis / 27.5);

    // Calculate tax impacts with clear methodology
    const shortTermTax = Math.round(quickFlipGain * 0.32); // 32% ordinary income rate
    const longTermTax = Math.round(holdGain * 0.15); // 15% capital gains rate

    // Tax savings calculation: What you'd pay on holdGain if short-term vs actual long-term
    const holdGainIfShortTerm = Math.round(holdGain * 0.32); // What you'd pay at 32% if short-term
    const taxSavings = holdGainIfShortTerm - longTermTax; // Savings by holding for long-term treatment

    // Get appreciation context for user education
    const appreciationContext = this.getAppreciationContext(realisticAppreciation, userAppreciation);

    return [
      {
        scenario: `YOUR Property: Quick Flip Scenario (Under 1 Year)`,
        explanation: `If you buy YOUR $${purchasePrice.toLocaleString()} property and sell it 6 months later for $${quickFlipSale.toLocaleString()} (${quickFlipPercentage}% gain), the $${quickFlipGain.toLocaleString()} profit would be taxed as ordinary income. At a 32% tax rate, you'd pay approximately $${shortTermTax.toLocaleString()} in taxes.`,
        disclaimer: `${appreciationContext}. Actual rates depend on your tax bracket.`
      },
      {
        scenario: `YOUR Property: Buy and Hold (2+ Years)`,
        explanation: `If you hold YOUR $${purchasePrice.toLocaleString()} property for 2.5 years and sell for $${holdSale.toLocaleString()} (${holdPercentage}% total appreciation), the $${holdGain.toLocaleString()} gain qualifies for long-term capital gains at 15% vs 32% ordinary income rate. Tax savings: $${holdGainIfShortTerm.toLocaleString()} (if short-term) - $${longTermTax.toLocaleString()} (long-term) = $${taxSavings.toLocaleString()} saved.`,
        disclaimer: `${appreciationContext}. Actual savings depend on your specific tax situation and market conditions.`
      },
      {
        scenario: `YOUR Property: Annual Tax Benefits`,
        explanation: `YOUR $${purchasePrice.toLocaleString()} rental property generates $${(monthlyRent * 12).toLocaleString()} annual rent. You can deduct approximately $${annualDepreciation.toLocaleString()} in depreciation annually, reducing taxable rental income by that amount. This could save $${Math.round(annualDepreciation * 0.24).toLocaleString()} in taxes each year (at 24% tax rate).`,
        disclaimer: 'Depreciation recapture applies when selling. Consult a CPA for your specific situation.'
      }
    ];
  }

  /**
   * Get basic tax education without property-specific calculations
   */
  async getBasicEducation(): Promise<TaxEducationalContent> {
    return this.generateEducationalContent();
  }
}

// Export singleton instance
export const taxEducationService = TaxEducationService.getInstance();