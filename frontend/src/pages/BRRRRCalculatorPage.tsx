/**
 * BRRRR Calculator Page
 * SEO wrapper that renders full LandingPage with BRRRR-specific meta tags.
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
      name: 'What is a good BRRRR capital recovery percentage?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: '80% or higher is strong. 100% or above (infinite return) is the goal of the BRRRR strategy. Below 70% means too much capital is trapped — at that point, a standard buy-and-hold may give better results.',
      },
    },
    {
      '@type': 'Question',
      name: 'What is the 70% rule in BRRRR?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The 70% rule says you should pay no more than 70% of the after-repair value (ARV) minus rehab costs. Formula: ARV × 0.70 − Rehab = Maximum purchase price. It is a screening tool to ensure enough margin for a successful refinance.',
      },
    },
    {
      '@type': 'Question',
      name: 'What does infinite return mean in BRRRR?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Infinite return means your refinance returned more cash than you originally invested, leaving zero of your own capital in the deal. You own a cash-flowing rental asset with none of your money tied up.',
      },
    },
    {
      '@type': 'Question',
      name: 'What LTV should I target for the BRRRR refinance?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Most conventional lenders offer 75% LTV on investment properties. Some DSCR lenders go to 80%. Use 75% for conservative projections — if the deal works at 75%, it works.',
      },
    },
    {
      '@type': 'Question',
      name: 'What is DSCR and why does it matter for BRRRR?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'DSCR (Debt Service Coverage Ratio) measures how much income the property generates relative to its debt payments. Formula: Net Operating Income ÷ Annual debt payments. Most lenders require 1.25 or higher. Below 1.0 means the property cannot cover its own mortgage.',
      },
    },
    {
      '@type': 'Question',
      name: 'How long does a full BRRRR cycle take?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Expect 2–4 months for rehab, then 6–12 months of seasoning before the refinance. Total cycle: 8–16 months from purchase to refinance completion.',
      },
    },
    {
      '@type': 'Question',
      name: 'What credit score do I need for a BRRRR refinance?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Conventional lenders typically require 680+ minimum and offer the best rates at 720+. DSCR loan programs may approve at 660+, though 700+ gets better terms and lower origination fees.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is the BRRRR strategy risky?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'More than a standard rental purchase, yes. The main risks are ARV overestimation, rehab cost blowouts, interest rates rising before your refinance, and lender seasoning requirements delaying your exit. Conservative underwriting mitigates most of these risks.',
      },
    },
  ],
};

const BRRRRCalculatorPage: React.FC = () => {
  return (
    <>
      {/* Override LandingPage's Helmet tags with BRRRR-specific SEO */}
      <Helmet>
        <title>BRRRR Calculator: Calculate Capital Recovery &amp; Infinite Returns | REanalyzr</title>
        <meta
          name="description"
          content="Free BRRRR calculator. Instantly calculate capital recovery %, infinite return, DSCR, cash-on-cash return, and 70% rule. No login required. Results in 60 seconds."
        />
        <link rel="canonical" href="https://reanalyzr.com/brrrr-calculator" />
        <meta property="og:title" content="BRRRR Calculator: Calculate Capital Recovery &amp; Infinite Returns | REanalyzr" />
        <meta
          property="og:description"
          content="Free BRRRR calculator. Instantly calculate capital recovery %, infinite return, DSCR, cash-on-cash return, and 70% rule. No login required. Results in 60 seconds."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://reanalyzr.com/brrrr-calculator" />
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      </Helmet>

      {/* Render full landing page with all marketing content */}
      <LandingPage />
    </>
  );
};

export default BRRRRCalculatorPage;
