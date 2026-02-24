/**
 * Cap Rate Calculator Page
 * SEO wrapper that renders full LandingPage with cap-rate-specific meta tags.
 * Provides unique title/description for SEO while maintaining full marketing content.
 */

import React from 'react';
import { Helmet } from 'react-helmet-async';
import LandingPage from './LandingPage';

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is a good cap rate for rental property?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'A cap rate between 4-10% is considered standard for residential rental properties. Class A properties (newer, better locations) typically have 4-6% cap rates. Class B properties range from 5-7%. Class C properties (older, higher risk) show 7-10% cap rates. Higher cap rates mean higher potential returns but also higher risk.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do you calculate cap rate?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Cap rate formula: Net Operating Income (NOI) ÷ Property Value = Cap Rate. Example: A property generates $12,000 annual NOI and is worth $200,000. Cap rate = $12,000 ÷ $200,000 = 6%. NOI is calculated as gross rental income minus operating expenses (property tax, insurance, maintenance, utilities), but NOT including mortgage payments.',
      },
    },
    {
      '@type': 'Question',
      name: 'What is NOI in cap rate calculation?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'NOI (Net Operating Income) is your annual rental income minus operating expenses. Operating expenses include property tax, insurance, maintenance, repairs, utilities, HOA fees, and property management. Mortgage payments are NOT included in NOI. Formula: Gross Rental Income - Operating Expenses = NOI.',
      },
    },
    {
      '@type': 'Question',
      name: 'What is the difference between cap rate and cash-on-cash return?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Cap rate ignores financing and measures property performance regardless of how you paid for it (NOI ÷ Property Value). Cash-on-cash return includes your mortgage and measures actual cash flow relative to your down payment (Annual Cash Flow ÷ Cash Invested). Use cap rate to compare properties. Use cash-on-cash to evaluate your personal investment returns.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is a higher or lower cap rate better?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Higher cap rates mean higher potential returns but come with higher risk (older properties, rougher neighborhoods, more maintenance). Lower cap rates mean safer, more stable investments but lower returns (newer properties, better locations). A 4% cap rate in Beverly Hills is excellent. A 4% cap rate in a declining market is concerning. Compare cap rates within the same market and property class.',
      },
    },
    {
      '@type': 'Question',
      name: 'What expenses are included in NOI for cap rate?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Include: Property tax, insurance, maintenance, repairs, utilities (if landlord-paid), HOA fees, property management fees, lawn care, snow removal. DO NOT include: Mortgage payments, capital improvements (new roof, HVAC), depreciation, income taxes. Only operating expenses that recur annually are included in NOI.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can cap rate be negative?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. If your operating expenses exceed rental income, NOI is negative and cap rate will be negative. Example: Property generates $10,000 rent but has $12,000 in expenses. NOI = -$2,000. Cap rate = -$2,000 ÷ $200,000 = -1%. Negative cap rates mean the property loses money before even paying the mortgage. Avoid these deals unless you have a clear value-add plan.',
      },
    },
    {
      '@type': 'Question',
      name: 'What is purchase cap rate vs pro forma cap rate?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Purchase cap rate uses current actual income and expenses as they exist today (trailing 12 months). Pro forma cap rate uses projected future income after improvements or rent increases. Example: Purchase cap rate = 5% based on current $1,200/month rent. Pro forma cap rate = 7% if you renovate and raise rent to $1,500/month. Always underwrite using purchase cap rate for conservative analysis.',
      },
    },
  ],
};

const CapRateCalculatorPage: React.FC = () => {
  return (
    <>
      {/* Override LandingPage's Helmet tags with cap-rate-specific SEO */}
      <Helmet>
        <title>Cap Rate Calculator: Free Real Estate Calculator | REanalyzr</title>
        <meta
          name="description"
          content="Free cap rate calculator. Calculate capitalization rate, NOI, and cash-on-cash return instantly. Institutional-grade formulas, no login required. Results in 60 seconds."
        />
        <link rel="canonical" href="https://reanalyzr.com/cap-rate-calculator" />
        <meta property="og:title" content="Cap Rate Calculator: Free Real Estate Calculator | REanalyzr" />
        <meta
          property="og:description"
          content="Free cap rate calculator. Calculate capitalization rate, NOI, and cash-on-cash return instantly. Institutional-grade formulas, no login required. Results in 60 seconds."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://reanalyzr.com/cap-rate-calculator" />
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      </Helmet>

      {/* Render full landing page with all marketing content */}
      <LandingPage />
    </>
  );
};

export default CapRateCalculatorPage;
