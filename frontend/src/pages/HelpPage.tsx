/**
 * Help & Documentation Page
 *
 * UX Designer Approach (Apple-inspired):
 * - Simple, scannable layout with visual hierarchy
 * - Progressive disclosure - show basics first, details on demand
 * - Clear categorization by user journey
 * - Visual icons for quick scanning
 * - Searchable content (future enhancement)
 *
 * Content organized by:
 * 1. Getting Started (first-time users)
 * 2. Core Features (most-used features)
 * 3. Advanced Features (power users)
 * 4. FAQs (common questions)
 */

import React, { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Chip,
  Alert,
  Link
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Home as HomeIcon,
  Apartment as ApartmentIcon,
  School as SchoolIcon,
  Lightbulb as LightbulbIcon,
  Assessment as AssessmentIcon,
  Business as BusinessIcon,
  Help as HelpIcon
} from '@mui/icons-material';
import { appleColors } from '../theme/appleDesignSystem';

const HelpPage: React.FC = () => {
  const [expandedCategory, setExpandedCategory] = useState<string>('getting-started');

  const handleAccordionChange = (panel: string) => (_event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedCategory(isExpanded ? panel : '');
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Hero Section */}
      <Box sx={{ mb: 6, textAlign: 'center' }}>
        <Typography variant="h3" fontWeight={700} gutterBottom>
          Help & Documentation
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
          Everything you need to analyze real estate investments like a professional
        </Typography>
      </Box>

      {/* Quick Links */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{
            cursor: 'pointer',
            '&:hover': { boxShadow: 4, transform: 'translateY(-2px)' },
            transition: 'all 0.2s',
            borderRadius: '16px'
          }}
          onClick={() => setExpandedCategory('getting-started')}
          >
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <SchoolIcon sx={{ fontSize: 40, color: appleColors.primary[500], mb: 1 }} />
              <Typography variant="h6" fontWeight={600}>Getting Started</Typography>
              <Typography variant="body2" color="text.secondary">
                First time? Start here
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{
            cursor: 'pointer',
            '&:hover': { boxShadow: 4, transform: 'translateY(-2px)' },
            transition: 'all 0.2s',
            borderRadius: '16px'
          }}
          onClick={() => setExpandedCategory('sfr-analysis')}
          >
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <HomeIcon sx={{ fontSize: 40, color: appleColors.green[500], mb: 1 }} />
              <Typography variant="h6" fontWeight={600}>SFR Analysis</Typography>
              <Typography variant="body2" color="text.secondary">
                Single-family properties
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{
            cursor: 'pointer',
            '&:hover': { boxShadow: 4, transform: 'translateY(-2px)' },
            transition: 'all 0.2s',
            borderRadius: '16px'
          }}
          onClick={() => setExpandedCategory('mf-analysis')}
          >
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <ApartmentIcon sx={{ fontSize: 40, color: appleColors.purple[500], mb: 1 }} />
              <Typography variant="h6" fontWeight={600}>
                Multi-Family
                <Chip label="New" size="small" color="primary" sx={{ ml: 1, position: 'relative', top: -2 }} />
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Apartments & complexes
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{
            cursor: 'pointer',
            '&:hover': { boxShadow: 4, transform: 'translateY(-2px)' },
            transition: 'all 0.2s',
            borderRadius: '16px'
          }}
          onClick={() => setExpandedCategory('tips')}
          >
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <LightbulbIcon sx={{ fontSize: 40, color: appleColors.orange[500], mb: 1 }} />
              <Typography variant="h6" fontWeight={600}>Tips & Tricks</Typography>
              <Typography variant="body2" color="text.secondary">
                Pro investor secrets
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Content - Accordion Style */}
      <Box sx={{ mb: 4 }}>
        {/* Getting Started */}
        <Accordion
          expanded={expandedCategory === 'getting-started'}
          onChange={handleAccordionChange('getting-started')}
          sx={{ borderRadius: '16px !important', mb: 2, '&:before': { display: 'none' } }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <SchoolIcon sx={{ color: appleColors.primary[500] }} />
              <Typography variant="h6" fontWeight={600}>Getting Started</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ pl: 5 }}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Welcome to Analyzr!
              </Typography>
              <Typography paragraph color="text.secondary">
                Analyzr transforms complex real estate analysis into simple, professional insights.
                Here's how to get started:
              </Typography>

              <Box component="ol" sx={{ pl: 2 }}>
                <Box component="li" sx={{ mb: 2 }}>
                  <Typography fontWeight={600}>Choose Your Property Type</Typography>
                  <Typography color="text.secondary">
                    • <strong>Single-Family Rental (SFR)</strong> - Houses, townhomes, condos
                    <br />
                    • <strong>Multi-Family (MF)</strong> - Duplexes, apartments, complexes (2-32 units)
                  </Typography>
                </Box>

                <Box component="li" sx={{ mb: 2 }}>
                  <Typography fontWeight={600}>Use the Property Wizard (Recommended)</Typography>
                  <Typography color="text.secondary">
                    Our guided wizard walks you through 4 simple steps:
                    <br />
                    1. Address (auto-populates data from public records)
                    <br />
                    2. Financials (purchase price, loan details)
                    <br />
                    3. Rental Info (current rents, market estimates)
                    <br />
                    4. Assumptions (growth rates, hold period)
                  </Typography>
                </Box>

                <Box component="li" sx={{ mb: 2 }}>
                  <Typography fontWeight={600}>Review Your Analysis</Typography>
                  <Typography color="text.secondary">
                    Get instant insights across multiple tabs:
                    <br />
                    • Investment Decision (BUY/NEGOTIATE/PASS verdict)
                    <br />
                    • Financial Details (monthly cash flow breakdown)
                    <br />
                    • Long-term Projections (10-year forecasts)
                    <br />
                    • Tax Intelligence (hold period optimization)
                  </Typography>
                </Box>

                <Box component="li" sx={{ mb: 2 }}>
                  <Typography fontWeight={600}>Save & Compare</Typography>
                  <Typography color="text.secondary">
                    • Save properties for later review
                    <br />
                    • Create scenarios with different assumptions
                    <br />
                    • Build your portfolio over time
                  </Typography>
                </Box>
              </Box>

              <Alert severity="info" sx={{ mt: 3, borderRadius: '12px' }}>
                <Typography variant="body2">
                  <strong>Pro Tip:</strong> Start with the Property Wizard. It auto-fills market data and guides you step-by-step.
                  Advanced users can switch to Manual Form for full control.
                </Typography>
              </Alert>
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* SFR Analysis */}
        <Accordion
          expanded={expandedCategory === 'sfr-analysis'}
          onChange={handleAccordionChange('sfr-analysis')}
          sx={{ borderRadius: '16px !important', mb: 2, '&:before': { display: 'none' } }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <HomeIcon sx={{ color: appleColors.green[500] }} />
              <Typography variant="h6" fontWeight={600}>Single-Family Rental (SFR) Analysis</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ pl: 5 }}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Analyze Houses, Townhomes & Condos
              </Typography>

              <Typography variant="body1" fontWeight={600} sx={{ mt: 3, mb: 1 }}>
                Key Features:
              </Typography>
              <Box component="ul" sx={{ pl: 2 }}>
                <li><Typography><strong>Investment Decision Engine:</strong> Get clear BUY, NEGOTIATE, or PASS verdicts with 0-100 quality scores</Typography></li>
                <li><Typography><strong>Financial Details:</strong> Complete monthly cash flow breakdown including mortgage, taxes, insurance, and maintenance</Typography></li>
                <li><Typography><strong>Long-term Analysis:</strong> 10-year projections showing total return, equity buildup, and appreciation</Typography></li>
                <li><Typography><strong>Tax Intelligence:</strong> Hold period optimization and tax impact calculations</Typography></li>
                <li><Typography><strong>Interactive Analysis:</strong> Adjust assumptions in real-time to see how they affect returns</Typography></li>
                <li><Typography><strong>Deal Optimizer:</strong> Find the maximum purchase price that still meets your goals</Typography></li>
                <li><Typography><strong>Scenario Manager:</strong> Compare multiple scenarios side-by-side</Typography></li>
              </Box>

              <Typography variant="body1" fontWeight={600} sx={{ mt: 3, mb: 1 }}>
                Understanding Your Results:
              </Typography>
              <Box component="ul" sx={{ pl: 2 }}>
                <li>
                  <Typography><strong>Property Quality Score (0-100):</strong> Overall investment quality combining cash flow, appreciation, and risk factors</Typography>
                </li>
                <li>
                  <Typography><strong>Monthly Cash Flow:</strong> Net profit/loss after all expenses including vacancy reserves</Typography>
                </li>
                <li>
                  <Typography><strong>Cap Rate:</strong> Annual return based on net operating income (NOI) divided by purchase price</Typography>
                </li>
                <li>
                  <Typography><strong>Cash-on-Cash Return:</strong> Annual cash flow divided by your initial investment (down payment + closing costs)</Typography>
                </li>
                <li>
                  <Typography><strong>IRR (Internal Rate of Return):</strong> Annualized return including cash flow, appreciation, and tax benefits over the hold period</Typography>
                </li>
              </Box>

              <Alert severity="success" sx={{ mt: 3, borderRadius: '12px' }}>
                <Typography variant="body2">
                  <strong>Best Practice:</strong> Look for properties with positive monthly cash flow AND strong long-term appreciation potential.
                  A good rule of thumb: 8%+ Cash-on-Cash return and 12%+ IRR.
                </Typography>
              </Alert>
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Multi-Family Analysis */}
        <Accordion
          expanded={expandedCategory === 'mf-analysis'}
          onChange={handleAccordionChange('mf-analysis')}
          sx={{ borderRadius: '16px !important', mb: 2, '&:before': { display: 'none' } }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <ApartmentIcon sx={{ color: appleColors.purple[500] }} />
              <Typography variant="h6" fontWeight={600}>
                Multi-Family Analysis
                <Chip label="New in v4.0" size="small" color="primary" sx={{ ml: 1 }} />
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ pl: 5 }}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Analyze Duplexes, Apartments & Complexes (2-32 Units)
              </Typography>

              <Typography paragraph color="text.secondary">
                Multi-family properties offer unique advantages: economies of scale, professional financing,
                and the ability to force appreciation through operational improvements.
              </Typography>

              <Typography variant="body1" fontWeight={600} sx={{ mt: 3, mb: 1 }}>
                MF-Specific Features:
              </Typography>
              <Box component="ul" sx={{ pl: 2 }}>
                <li>
                  <Typography><strong>Unit Mix Analysis:</strong> Track performance by unit type (1BR, 2BR, 3BR) with individual rent rolls</Typography>
                </li>
                <li>
                  <Typography><strong>NOI Calculation:</strong> Institutional-grade Net Operating Income calculations following Fannie Mae/Freddie Mac standards</Typography>
                </li>
                <li>
                  <Typography><strong>Advanced Metrics:</strong> DSCR, Debt Yield, Break-Even Occupancy, GRM, and per-unit analytics</Typography>
                </li>
                <li>
                  <Typography><strong>Common Area Utilities:</strong> Separate tracking for shared expenses (water, trash, landscaping)</Typography>
                </li>
                <li>
                  <Typography><strong>Commercial Financing:</strong> Support for balloon payments and commercial loan structures</Typography>
                </li>
              </Box>

              <Typography variant="body1" fontWeight={600} sx={{ mt: 3, mb: 1 }}>
                Key Multi-Family Metrics:
              </Typography>
              <Box component="ul" sx={{ pl: 2 }}>
                <li>
                  <Typography><strong>DSCR (Debt Service Coverage Ratio):</strong> NOI divided by annual debt service. Lenders typically require 1.20x-1.25x minimum</Typography>
                </li>
                <li>
                  <Typography><strong>Cap Rate:</strong> For MF, typical ranges are 4-6% (Class A), 5-7% (Class B), 7-10% (Class C)</Typography>
                </li>
                <li>
                  <Typography><strong>Break-Even Occupancy:</strong> Minimum occupancy needed to cover all expenses. Target: 60-75%</Typography>
                </li>
                <li>
                  <Typography><strong>GRM (Gross Rent Multiplier):</strong> Purchase price divided by annual gross rents. Target: 4-7 for residential MF</Typography>
                </li>
                <li>
                  <Typography><strong>Operating Expense Ratio:</strong> Operating expenses as % of gross income. Typical: 35-45%</Typography>
                </li>
              </Box>

              <Alert severity="info" sx={{ mt: 3, borderRadius: '12px' }}>
                <Typography variant="body2">
                  <strong>New Investor Tip:</strong> Start with 2-4 unit properties. They qualify for residential financing (easier to get)
                  but give you experience with multi-family operations. Properties with 5+ units require commercial loans.
                </Typography>
              </Alert>

              <Alert severity="warning" sx={{ mt: 2, borderRadius: '12px' }}>
                <Typography variant="body2">
                  <strong>Coming Soon:</strong> Interactive Analysis, Deal Optimizer, and Scenario Manager are being adapted for
                  multi-family properties and will be available in a future update.
                </Typography>
              </Alert>
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Investment Decision Engine */}
        <Accordion
          expanded={expandedCategory === 'decision-engine'}
          onChange={handleAccordionChange('decision-engine')}
          sx={{ borderRadius: '16px !important', mb: 2, '&:before': { display: 'none' } }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <AssessmentIcon sx={{ color: appleColors.blue[500] }} />
              <Typography variant="h6" fontWeight={600}>Investment Decision Engine</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ pl: 5 }}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                How We Calculate Your Investment Verdict
              </Typography>

              <Typography paragraph color="text.secondary">
                Our Investment Decision Engine analyzes 50+ data points to give you a clear, actionable verdict:
                BUY, NEGOTIATE, CAUTION, or PASS.
              </Typography>

              <Typography variant="body1" fontWeight={600} sx={{ mt: 3, mb: 1 }}>
                Scoring Methodology (0-100 Scale):
              </Typography>
              <Box component="ul" sx={{ pl: 2 }}>
                <li>
                  <Typography><strong>Cash Flow Quality (30 points):</strong> Monthly cash flow relative to investment and market standards</Typography>
                </li>
                <li>
                  <Typography><strong>Cap Rate Performance (20 points):</strong> Comparing property cap rate to market benchmarks</Typography>
                </li>
                <li>
                  <Typography><strong>IRR Strength (20 points):</strong> Long-term return potential over your hold period</Typography>
                </li>
                <li>
                  <Typography><strong>Cash-on-Cash Return (15 points):</strong> Immediate return on your invested capital</Typography>
                </li>
                <li>
                  <Typography><strong>DSCR Safety (15 points):</strong> Debt coverage and financial stability</Typography>
                </li>
              </Box>

              <Typography variant="body1" fontWeight={600} sx={{ mt: 3, mb: 1 }}>
                Verdict Categories:
              </Typography>
              <Box sx={{ pl: 2 }}>
                <Box sx={{ mb: 2, p: 2, borderRadius: '12px', backgroundColor: appleColors.green[50] }}>
                  <Typography fontWeight={600} color={appleColors.green[700]}>BUY (75-100 points)</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Strong investment meeting or exceeding professional standards. Proceed with confidence.
                  </Typography>
                </Box>
                <Box sx={{ mb: 2, p: 2, borderRadius: '12px', backgroundColor: appleColors.blue[50] }}>
                  <Typography fontWeight={600} color={appleColors.blue[700]}>NEGOTIATE (60-74 points)</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Decent fundamentals but overpriced. Review the walk-away price and negotiate.
                  </Typography>
                </Box>
                <Box sx={{ mb: 2, p: 2, borderRadius: '12px', backgroundColor: appleColors.orange[50] }}>
                  <Typography fontWeight={600} color={appleColors.orange[700]}>CAUTION (45-59 points)</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Marginal deal with concerns. Requires significant improvements or price reduction.
                  </Typography>
                </Box>
                <Box sx={{ p: 2, borderRadius: '12px', backgroundColor: appleColors.red[50] }}>
                  <Typography fontWeight={600} color={appleColors.red[700]}>PASS (0-44 points)</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Poor investment fundamentals. Does not meet minimum professional standards.
                  </Typography>
                </Box>
              </Box>

              <Alert severity="success" sx={{ mt: 3, borderRadius: '12px' }}>
                <Typography variant="body2">
                  <strong>Conservative by Design:</strong> Our scoring is intentionally conservative to protect you from
                  overpaying. A "NEGOTIATE" verdict doesn't mean it's a bad property - it means you should negotiate for a better price.
                </Typography>
              </Alert>
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Portfolio & Pipeline */}
        <Accordion
          expanded={expandedCategory === 'portfolio'}
          onChange={handleAccordionChange('portfolio')}
          sx={{ borderRadius: '16px !important', mb: 2, '&:before': { display: 'none' } }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <BusinessIcon sx={{ color: appleColors.indigo[500] }} />
              <Typography variant="h6" fontWeight={600}>Portfolio & Pipeline Tracking</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ pl: 5 }}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Organize & Track Your Investments
              </Typography>

              <Typography paragraph color="text.secondary">
                Save properties and track them through your investment journey from research to ownership.
              </Typography>

              <Typography variant="body1" fontWeight={600} sx={{ mt: 3, mb: 1 }}>
                Saved Deals:
              </Typography>
              <Box component="ul" sx={{ pl: 2 }}>
                <li><Typography>Save any property analysis for future reference</Typography></li>
                <li><Typography>Add notes and tags to organize your research</Typography></li>
                <li><Typography>Compare multiple properties side-by-side</Typography></li>
                <li><Typography>Track changes in property details and market conditions</Typography></li>
              </Box>

              <Typography variant="body1" fontWeight={600} sx={{ mt: 3, mb: 1 }}>
                Investment Pipeline:
              </Typography>
              <Box component="ul" sx={{ pl: 2 }}>
                <li><Typography><strong>Researching:</strong> Initial analysis phase</Typography></li>
                <li><Typography><strong>Active Pursuit:</strong> Making offers or negotiating</Typography></li>
                <li><Typography><strong>Under Contract:</strong> Due diligence and closing process</Typography></li>
                <li><Typography><strong>Owned:</strong> Properties in your portfolio</Typography></li>
                <li><Typography><strong>Passed:</strong> Properties you decided not to pursue</Typography></li>
              </Box>

              <Alert severity="info" sx={{ mt: 3, borderRadius: '12px' }}>
                <Typography variant="body2">
                  <strong>Coming Soon:</strong> Portfolio Intelligence will provide aggregate analytics across all your properties,
                  including total cash flow, equity, diversification analysis, and goal tracking.
                </Typography>
              </Alert>
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* FAQs */}
        <Accordion
          expanded={expandedCategory === 'faqs'}
          onChange={handleAccordionChange('faqs')}
          sx={{ borderRadius: '16px !important', mb: 2, '&:before': { display: 'none' } }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <HelpIcon sx={{ color: appleColors.gray[500] }} />
              <Typography variant="h6" fontWeight={600}>Frequently Asked Questions</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ pl: 5 }}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="body1" fontWeight={600} gutterBottom>
                  Q: How accurate are the auto-populated property details?
                </Typography>
                <Typography color="text.secondary">
                  A: We use RentCast API which aggregates data from public records and MLS listings. Accuracy is typically
                  85-95%, but we recommend verifying critical details like property taxes and rent estimates with local sources.
                  You can always override any auto-populated field.
                </Typography>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="body1" fontWeight={600} gutterBottom>
                  Q: What's the difference between the Property Wizard and Manual Form?
                </Typography>
                <Typography color="text.secondary">
                  A: The Property Wizard guides you through 4 simple steps and auto-fills data from public records to save you time.
                  The Manual Form gives you full control over every field - ideal for experienced investors or properties with
                  unique characteristics.
                </Typography>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="body1" fontWeight={600} gutterBottom>
                  Q: How is multi-family analysis different from single-family?
                </Typography>
                <Typography color="text.secondary">
                  A: Multi-family analysis includes unit mix tracking, DSCR calculations, break-even occupancy, and other
                  institutional metrics that commercial lenders require. MF properties are valued based on income (NOI),
                  while SFR properties are primarily valued by comparable sales.
                </Typography>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="body1" fontWeight={600} gutterBottom>
                  Q: Can I trust the Investment Decision Engine's verdict?
                </Typography>
                <Typography color="text.secondary">
                  A: Our engine uses institutional-grade calculations and is intentionally conservative to protect you from
                  overpaying. However, it's designed to inform your decision, not make it for you. Always consider local
                  market conditions, your personal goals, and conduct proper due diligence.
                </Typography>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="body1" fontWeight={600} gutterBottom>
                  Q: What assumptions should I use for growth rates?
                </Typography>
                <Typography color="text.secondary">
                  A: Conservative investors use 2-3% for both appreciation and rent growth (matching inflation).
                  Research your specific market - some areas see 5-7% appreciation while others may be flat.
                  We auto-populate market-based estimates, but you should verify with local data.
                </Typography>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="body1" fontWeight={600} gutterBottom>
                  Q: How do I interpret the Tax Intelligence tab?
                </Typography>
                <Typography color="text.secondary">
                  A: Tax Intelligence shows the impact of hold period on your after-tax returns. Properties held longer than
                  1 year qualify for long-term capital gains rates (typically 15-20%) vs short-term rates (ordinary income, up to 37%).
                  Always consult a CPA for personalized tax advice.
                </Typography>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="body1" fontWeight={600} gutterBottom>
                  Q: Can I analyze properties outside the United States?
                </Typography>
                <Typography color="text.secondary">
                  A: Currently, our platform is optimized for U.S. properties only. Our data sources (RentCast, FRED, Census)
                  and tax calculations are U.S.-specific. International support may be added in future updates.
                </Typography>
              </Box>

              <Box>
                <Typography variant="body1" fontWeight={600} gutterBottom>
                  Q: How often is market data updated?
                </Typography>
                <Typography color="text.secondary">
                  A: Rent estimates and property data are refreshed monthly. Economic indicators (mortgage rates, inflation)
                  are updated weekly. You can see the data freshness timestamp in the property wizard.
                </Typography>
              </Box>
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Tips & Best Practices */}
        <Accordion
          expanded={expandedCategory === 'tips'}
          onChange={handleAccordionChange('tips')}
          sx={{ borderRadius: '16px !important', mb: 2, '&:before': { display: 'none' } }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <LightbulbIcon sx={{ color: appleColors.orange[500] }} />
              <Typography variant="h6" fontWeight={600}>Pro Tips & Best Practices</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ pl: 5 }}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Lessons from Experienced Investors
              </Typography>

              <Box sx={{ mb: 3 }}>
                <Typography variant="body1" fontWeight={600} gutterBottom>
                  1. Always Verify Property Taxes
                </Typography>
                <Typography color="text.secondary">
                  Property tax records can be 1-2 years outdated. Call the county assessor's office for the most current
                  annual tax amount, especially for recently sold properties which may be reassessed.
                </Typography>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="body1" fontWeight={600} gutterBottom>
                  2. Budget Higher for Maintenance Than You Think
                </Typography>
                <Typography color="text.secondary">
                  The "$100/month" rule often underestimates reality. For properties built before 1990, budget $150-200/month.
                  For multi-family, use $100-150 per unit per month. Major systems (roof, HVAC, water heater) fail unexpectedly.
                </Typography>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="body1" fontWeight={600} gutterBottom>
                  3. Don't Forget Capex (Capital Expenditures)
                </Typography>
                <Typography color="text.secondary">
                  Set aside 5-10% of rent for major replacements (roof, HVAC, appliances). A $15,000 roof replacement
                  can wipe out years of cash flow if you're not prepared.
                </Typography>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="body1" fontWeight={600} gutterBottom>
                  4. Vacancy Rate Is Not Optional
                </Typography>
                <Typography color="text.secondary">
                  Even in hot markets, budget 5-8% for vacancy. Turnover costs (cleaning, repairs, advertising) add up.
                  Properties are rarely occupied 100% of the time.
                </Typography>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="body1" fontWeight={600} gutterBottom>
                  5. Run Multiple Scenarios
                </Typography>
                <Typography color="text.secondary">
                  Use the Scenario Manager to model best case, worst case, and realistic case. What if rents don't increase?
                  What if you have a 3-month vacancy? What if interest rates rise at refinance?
                </Typography>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="body1" fontWeight={600} gutterBottom>
                  6. Location {'>'} Everything Else
                </Typography>
                <Typography color="text.secondary">
                  A mediocre house in a great location will outperform a great house in a mediocre location every time.
                  Focus on job growth, population growth, and school quality in your target markets.
                </Typography>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="body1" fontWeight={600} gutterBottom>
                  7. Understand Your Exit Strategy Before You Buy
                </Typography>
                <Typography color="text.secondary">
                  Are you holding for cash flow or appreciation? Planning to flip or hold long-term? Your exit strategy
                  should drive your purchase criteria. The Tax Intelligence tab can help optimize hold periods.
                </Typography>
              </Box>

              <Box>
                <Typography variant="body1" fontWeight={600} gutterBottom>
                  8. Build a Local Team
                </Typography>
                <Typography color="text.secondary">
                  Success in real estate requires: a great real estate agent, a responsive lender, a reliable property manager
                  (if not self-managing), a good contractor, and a CPA familiar with rental property taxation. Build these
                  relationships before you need them.
                </Typography>
              </Box>

              <Alert severity="success" sx={{ mt: 3, borderRadius: '12px' }}>
                <Typography variant="body2">
                  <strong>Golden Rule:</strong> Make money when you buy, not when you sell. The purchase price is the single
                  most important factor in your returns. Don't fall in love with a property - fall in love with the numbers.
                </Typography>
              </Alert>
            </Box>
          </AccordionDetails>
        </Accordion>
      </Box>

      {/* Footer */}
      <Box sx={{ mt: 6, p: 3, textAlign: 'center', backgroundColor: appleColors.gray[50], borderRadius: '16px' }}>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          Still Have Questions?
        </Typography>
        <Typography color="text.secondary" paragraph>
          We're here to help you succeed in your real estate investing journey.
        </Typography>
        <Link href="mailto:support@analyzr.com" underline="none">
          <Typography color="primary" fontWeight={600}>
            Contact Support
          </Typography>
        </Link>
      </Box>
    </Container>
  );
};

export default HelpPage;
