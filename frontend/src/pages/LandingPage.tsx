/**
 * Landing Page — Three-Layer Platform Positioning
 *
 * Per /docs/PRODUCT_CONTEXT.md (Apr 25, 2026):
 *   Three-layer platform — Deal Analysis + Pipeline + Portfolio.
 *   Honest analysis is the moat. Portfolio supports all property
 *   types including commercial.
 *
 * Public copy never uses "verdict" or "PASS"/"BUY" labels — score
 * + color + contextual label only. (Liability concern; see memory:
 * feedback_no_verdict_in_public_copy.md.)
 */

import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  Button,
  Link as MuiLink
} from '@mui/material';
import PublicHeader from '../components/common/PublicHeader';
import { UniversalCalculator } from '../components/Calculator';
import { analytics } from '../utils/analytics';
import { getScoreColor } from '../utils/scoreColors';

// Fake illustrative numbers — labeled "Sample analysis" in the UI.
const SAMPLE_SCORE = 34;
const SAMPLE = {
  property: '4-bed SFR · Phoenix, AZ · $425,000 list',
  metrics: [
    { label: 'Monthly cash flow', value: '−$485', note: 'negative' },
    { label: 'DSCR', value: '0.89', note: 'lenders require 1.25' },
    { label: 'Cap rate', value: '4.1%', note: 'market avg 6.2%' },
    { label: '1% rule', value: 'Fails', note: 'rent is 0.52% of price' }
  ],
  walkAway: '$342,000'
};

const FAQ_ITEMS = [
  {
    q: 'How is REanalyzr different from free calculators?',
    a: "Calculators give you the math. REanalyzr connects each deal to a pipeline of properties you're tracking and to the portfolio you already own — including commercial. You get a Deal Quality Score (0–100), 28+ professional metrics, real market data for your specific location, and the same framework applied to every deal."
  },
  {
    q: 'Do I need real estate experience to use this?',
    a: "No. The Deal Quality Score gives you a 0–100 score with the full breakdown — you decide whether the deal fits your standards. Whether you're analyzing your first property or your 30th, the framework is the same."
  },
  {
    q: 'Why do so many deals come back red?',
    a: "Most deals don't pencil. Conservative underwriting surfaces the marginal ones that look good on paper but bleed in year three. Showing you the math behind a low score is more useful than rationalizing a borderline deal into a green one."
  },
  {
    q: 'Does the portfolio support commercial properties?',
    a: 'Yes. The portfolio tracker accepts SFR, multi-family, BRRRR properties, and commercial (strip mall, office, mixed-use). Add what you already own and see how each new deal shifts your cash flow and concentration before you make the offer.'
  },
  {
    q: 'How accurate is the BRRRR calculator?',
    a: 'The BRRRR analyzer uses institutional-grade formulas validated by professional real estate investors. It models the full Buy-Rehab-Rent-Refinance-Repeat cycle including capital recovery, forced equity, and post-refinance cash flow. Accuracy depends on your input quality — use realistic rehab costs and ARV estimates.'
  },
  {
    q: 'What is a good cap rate for rental property?',
    a: 'Cap rates typically range from 5–10% depending on market and property class. 8–10%+ signals strong cash-flow markets, 5–7% appreciation-focused markets, below 5% premium or overheated. The cap rate calculator compares your deal against local benchmarks.'
  },
  {
    q: 'Can I use this for multi-family properties?',
    a: 'Yes. The platform supports single-family homes, duplexes, triplexes, and multi-family up to 32 units. Enter unit-level details for accurate cash flow analysis. Multi-family-specific metrics include per-unit NOI, vacancy rates, and operating expense ratios.'
  },
  {
    q: 'What metrics does the analyzer provide?',
    a: 'Cap Rate, Cash-on-Cash Return, IRR, DSCR, NOI, Cash Flow, Total ROI, Payback Period, Gross Rent Multiplier, Operating Expense Ratio, Break-Even Occupancy, Equity Multiple, and 15+ more — across 10-year projections for both Buy & Hold and BRRRR strategies.'
  },
  {
    q: 'Do I need to create an account to use the calculator?',
    a: 'No. Run analyses anonymously. Create a free account when you want to save deals to your pipeline, compare properties, and track portfolio impact across what you already own.'
  },
  {
    q: 'How is this different from Excel spreadsheets?',
    a: 'Real-time market data, AI-powered scoring, and instant analysis (5 minutes vs 2+ hours in Excel). No formulas to debug, no version conflicts. Built-in validation, professional-grade output, and the deals stay in your pipeline so you can revisit them later.'
  },
  {
    q: 'What is DSCR and why does it matter?',
    a: 'DSCR (Debt Service Coverage Ratio) measures whether rental income covers mortgage payments. The DSCR calculator helps you qualify for investment property loans. Lenders typically require 1.25x minimum (Fannie Mae/Freddie Mac standard); higher DSCR means stronger financing position and better loan terms.'
  },
  {
    q: 'Can I analyze fix-and-flip properties?',
    a: 'Yes. The BRRRR analyzer handles fix-and-flip scenarios — model rehab costs, ARV, holding costs, and sale proceeds. Output includes profit margins, ROI, and annualized returns.'
  }
];

const PRIMARY_CTA_HREF = '/sfr-analysis';
const ACCENT = '#0071E3';

const ctaButtonSx = {
  bgcolor: ACCENT,
  color: '#FFFFFF',
  px: 4,
  py: 1.5,
  borderRadius: '999px',
  fontSize: '1.0625rem',
  fontWeight: 500,
  textTransform: 'none' as const,
  boxShadow: 'none',
  '&:hover': { bgcolor: '#0058B3', boxShadow: 'none' }
};

const LandingPage: React.FC = () => {
  useEffect(() => {
    analytics.trackPageView('landing');
  }, []);

  const sampleColor = getScoreColor(SAMPLE_SCORE);

  return (
    <>
      <Helmet>
        <title>REanalyzr — Analyze Any Deal. Track Every Property. See Your Full Portfolio.</title>
        <meta
          name="description"
          content="REanalyzr is a three-layer real estate platform: analyze BRRRR, Buy & Hold, and Multi-Family deals; track them in one pipeline; see portfolio impact across all your properties — including commercial — before you buy."
        />
        <meta
          name="keywords"
          content="real estate investment platform, rental property analysis, BRRRR analyzer, buy and hold calculator, multi-family analyzer, portfolio tracker, commercial real estate"
        />
        <link rel="canonical" href="https://reanalyzr.com/" />
      </Helmet>

      <PublicHeader />

      {/* ============== HERO ============== */}
      <Box component="section" sx={{ py: { xs: 6, md: 10 }, bgcolor: '#FFFFFF' }}>
        <Container maxWidth="lg">
          <Grid container spacing={{ xs: 5, md: 6 }} alignItems="center">
            <Grid size={{ xs: 12, md: 7 }}>
              <Typography
                component="h1"
                sx={{
                  fontSize: { xs: '2.125rem', sm: '2.75rem', md: '3.25rem' },
                  fontWeight: 700,
                  letterSpacing: '-0.02em',
                  lineHeight: 1.1,
                  color: '#111827',
                  mb: 3
                }}
              >
                Analyze Any Deal. Track Every Property. See Your Full Portfolio — All In One Place.
              </Typography>
              <Typography
                sx={{
                  fontSize: { xs: '1.0625rem', md: '1.125rem' },
                  lineHeight: 1.6,
                  color: '#4B5563',
                  mb: 4,
                  maxWidth: '620px'
                }}
              >
                BRRRR, Buy &amp; Hold, Multi-Family, and commercial — one platform that connects every deal to the portfolio you've already built. Built to flag the deals that don't work, not just the ones that do.
              </Typography>
              <Button variant="contained" size="large" href={PRIMARY_CTA_HREF} sx={ctaButtonSx}>
                Run a Deal Now →
              </Button>
              <Typography sx={{ mt: 2, fontSize: '0.875rem', color: '#6B7280' }}>
                Five minutes from address to score. Free during beta.
              </Typography>
              <MuiLink
                href="#calculator"
                sx={{
                  display: 'inline-block',
                  mt: 1.25,
                  fontSize: '0.9375rem',
                  color: '#6B7280',
                  textDecoration: 'none',
                  '&:hover': { textDecoration: 'underline', color: ACCENT }
                }}
              >
                Or try the free calculator first ↓
              </MuiLink>
            </Grid>

            <Grid size={{ xs: 12, md: 5 }}>
              <Box
                sx={{
                  bgcolor: '#FFFFFF',
                  border: `2px solid ${sampleColor}`,
                  borderRadius: '16px',
                  p: { xs: 3, md: 3.5 },
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.06)'
                }}
              >
                <Typography
                  sx={{
                    fontSize: '0.6875rem',
                    fontWeight: 600,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: '#6B7280',
                    mb: 1.5
                  }}
                >
                  Sample analysis
                </Typography>

                <Box sx={{ textAlign: 'center', mb: 2.5 }}>
                  <Typography
                    sx={{
                      fontSize: { xs: '4.5rem', md: '5rem' },
                      fontWeight: 800,
                      lineHeight: 1,
                      color: sampleColor
                    }}
                  >
                    {SAMPLE_SCORE}
                    <Typography
                      component="span"
                      sx={{
                        fontSize: { xs: '2rem', md: '2.25rem' },
                        color: '#9CA3AF',
                        fontWeight: 700,
                        ml: 0.5
                      }}
                    >
                      /100
                    </Typography>
                  </Typography>
                  <Box
                    sx={{
                      width: '80px',
                      height: '3px',
                      bgcolor: sampleColor,
                      borderRadius: '2px',
                      mx: 'auto',
                      my: 1.5
                    }}
                  />
                  <Typography sx={{ fontSize: '0.9375rem', fontWeight: 500, color: '#374151' }}>
                    Below professional standards
                  </Typography>
                </Box>

                <Box sx={{ borderTop: '1px solid #E5E7EB', pt: 2 }}>
                  <Typography sx={{ fontSize: '0.8125rem', color: '#6B7280', mb: 1.5 }}>
                    {SAMPLE.property}
                  </Typography>
                  {SAMPLE.metrics.map((m, idx) => (
                    <Box
                      key={m.label}
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'baseline',
                        py: 1,
                        borderBottom: idx < SAMPLE.metrics.length - 1 ? '1px solid #F3F4F6' : 'none'
                      }}
                    >
                      <Typography sx={{ fontSize: '0.875rem', color: '#374151' }}>
                        {m.label}
                      </Typography>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography
                          sx={{
                            fontSize: '0.9375rem',
                            fontWeight: 600,
                            color: '#111827',
                            fontVariantNumeric: 'tabular-nums'
                          }}
                        >
                          {m.value}
                        </Typography>
                        <Typography sx={{ fontSize: '0.75rem', color: '#9CA3AF' }}>
                          {m.note}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>

                <Box
                  sx={{
                    mt: 2,
                    pt: 2,
                    borderTop: '1px solid #E5E7EB',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <Typography sx={{ fontSize: '0.8125rem', color: '#6B7280' }}>
                    Walk-away price
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: '1rem',
                      fontWeight: 700,
                      color: '#111827',
                      fontVariantNumeric: 'tabular-nums'
                    }}
                  >
                    {SAMPLE.walkAway}
                  </Typography>
                </Box>

                <MuiLink
                  href="/sample-analysis"
                  sx={{
                    display: 'block',
                    textAlign: 'center',
                    mt: 2.5,
                    color: ACCENT,
                    fontSize: '0.9375rem',
                    fontWeight: 500,
                    textDecoration: 'none',
                    '&:hover': { textDecoration: 'underline' }
                  }}
                >
                  See the full sample analysis →
                </MuiLink>
              </Box>
              <Typography
                sx={{
                  fontSize: '0.75rem',
                  color: '#9CA3AF',
                  textAlign: 'center',
                  mt: 1.5
                }}
              >
                This is the deal report most calculators won't show you.
              </Typography>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* ============== ANALYZE. TRACK. UNDERSTAND. ============== */}
      <Box component="section" sx={{ py: { xs: 6, md: 10 }, bgcolor: '#F9FAFB' }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: { xs: 5, md: 7 } }}>
            <Typography
              component="h2"
              sx={{
                fontSize: { xs: '1.875rem', md: '2.5rem' },
                fontWeight: 700,
                letterSpacing: '-0.02em',
                color: '#111827',
                mb: 2
              }}
            >
              Analyze. Track. Understand.
            </Typography>
            <Typography sx={{ fontSize: '1.0625rem', color: '#4B5563', maxWidth: '640px', mx: 'auto' }}>
              One place to evaluate a deal, organize what you've found, and see how it fits the properties you already own.
            </Typography>
          </Box>

          <Grid container spacing={3}>
            {[
              {
                eyebrow: 'Analyze',
                title: 'Run any deal. Any strategy.',
                body: 'BRRRR, Buy & Hold, and Multi-Family — same structured framework, same Deal Quality Score, same honest math. No spreadsheet rebuild for every property type. Conservative underwriting catches the deals that look good on paper but bleed in year three.',
                link: { label: 'See a full analysis →', href: '/sample-analysis' }
              },
              {
                eyebrow: 'Track',
                title: 'From first look to closing day.',
                body: 'Save every property you analyze. Track status from "reviewing" to "offer made" to "closed" or "passed." Compare three duplexes from last month side-by-side in seconds. The deals you walk away from matter as much as the ones you close.',
                link: { label: 'Tour the pipeline →', href: '/pipeline' }
              },
              {
                eyebrow: 'Understand',
                title: 'See the effect before you buy.',
                body: 'Add the rentals, multi-family, and commercial properties you already own. Then run a new deal and see exactly how it shifts your cash flow, geographic concentration, and goal progress — before you make an offer. Nobody else connects deal decisions to portfolio reality.',
                link: { label: 'See portfolio impact →', href: '/portfolio' }
              }
            ].map((card) => (
              <Grid size={{ xs: 12, md: 4 }} key={card.eyebrow}>
                <Paper
                  elevation={0}
                  sx={{
                    bgcolor: '#FFFFFF',
                    border: '1px solid #E5E7EB',
                    borderRadius: '16px',
                    p: { xs: 3, md: 3.5 },
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: ACCENT,
                      mb: 1.5
                    }}
                  >
                    {card.eyebrow}
                  </Typography>
                  <Typography
                    component="h3"
                    sx={{
                      fontSize: '1.375rem',
                      fontWeight: 700,
                      color: '#111827',
                      mb: 1.5,
                      letterSpacing: '-0.01em'
                    }}
                  >
                    {card.title}
                  </Typography>
                  <Typography sx={{ fontSize: '1rem', lineHeight: 1.65, color: '#4B5563', flexGrow: 1 }}>
                    {card.body}
                  </Typography>
                  <MuiLink
                    href={card.link.href}
                    sx={{
                      mt: 2.5,
                      color: ACCENT,
                      fontSize: '0.9375rem',
                      fontWeight: 500,
                      textDecoration: 'none',
                      '&:hover': { textDecoration: 'underline' }
                    }}
                  >
                    {card.link.label}
                  </MuiLink>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ============== CALCULATOR EMBED ============== */}
      <Box
        component="section"
        id="calculator"
        sx={{ py: { xs: 6, md: 10 }, bgcolor: '#FFFFFF', scrollMarginTop: '80px' }}
      >
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: { xs: 4, md: 5 } }}>
            <Typography
              component="h2"
              sx={{
                fontSize: { xs: '1.75rem', md: '2.25rem' },
                fontWeight: 700,
                letterSpacing: '-0.02em',
                color: '#111827',
                mb: 2
              }}
            >
              Run your own numbers. Get a Deal Quality Score in 60 seconds.
            </Typography>
            <Typography sx={{ fontSize: '1.0625rem', color: '#4B5563', maxWidth: '640px', mx: 'auto' }}>
              Try it free. Save the deal to track it in your pipeline and see how it fits your portfolio.
            </Typography>
          </Box>
          <UniversalCalculator />
        </Container>
      </Box>

      {/* ============== SOCIAL PROOF ============== */}
      <Box component="section" sx={{ py: { xs: 6, md: 10 }, bgcolor: '#F9FAFB' }}>
        <Container maxWidth="md">
          <Box sx={{ textAlign: 'center', mb: { xs: 4, md: 5 } }}>
            <Typography
              component="h2"
              sx={{
                fontSize: { xs: '1.75rem', md: '2.25rem' },
                fontWeight: 700,
                letterSpacing: '-0.02em',
                color: '#111827'
              }}
            >
              Join investors analyzing deals the honest way.
            </Typography>
          </Box>

          <Grid container spacing={3} sx={{ mb: { xs: 5, md: 6 } }}>
            {[
              { stat: '100+', label: 'deals analyzed by beta investors' },
              { stat: '3', label: 'strategies supported — BRRRR, Buy & Hold, Multi-Family' },
              { stat: '0', label: 'spreadsheets required' }
            ].map((s) => (
              <Grid size={{ xs: 12, sm: 4 }} key={s.label}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography
                    sx={{
                      fontSize: { xs: '2.5rem', md: '3rem' },
                      fontWeight: 800,
                      color: '#111827',
                      lineHeight: 1,
                      mb: 1
                    }}
                  >
                    {s.stat}
                  </Typography>
                  <Typography sx={{ fontSize: '0.9375rem', color: '#6B7280' }}>
                    {s.label}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>

          <Box sx={{ borderTop: '1px solid #E5E7EB', pt: 5, textAlign: 'center', maxWidth: '720px', mx: 'auto' }}>
            <Typography
              sx={{
                fontSize: { xs: '1.125rem', md: '1.25rem' },
                lineHeight: 1.6,
                color: '#374151',
                fontStyle: 'italic',
                mb: 2
              }}
            >
              "We built REanalyzr to surface the deals that don't pencil — not just the ones that do. In honest underwriting, most deals come back red. If we're not showing you that math clearly, we're just another calculator. And the world has enough calculators."
            </Typography>
            <Typography sx={{ fontSize: '0.875rem', color: '#6B7280' }}>
              — REanalyzr team
            </Typography>
          </Box>
        </Container>
      </Box>

      {/* ============== HOW IT WORKS ============== */}
      <Box component="section" sx={{ py: { xs: 6, md: 10 }, bgcolor: '#FFFFFF' }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: { xs: 5, md: 7 } }}>
            <Typography
              component="h2"
              sx={{
                fontSize: { xs: '1.875rem', md: '2.5rem' },
                fontWeight: 700,
                letterSpacing: '-0.02em',
                color: '#111827',
                mb: 2
              }}
            >
              How REanalyzr works.
            </Typography>
            <Typography sx={{ fontSize: '1.0625rem', color: '#4B5563' }}>
              Three steps. Five minutes. One platform.
            </Typography>
          </Box>

          <Grid container spacing={{ xs: 4, md: 5 }}>
            {[
              {
                num: '01',
                title: 'Analyze',
                body: 'Enter the address (or fill in the details manually). Pick your strategy — BRRRR, Buy & Hold, or Multi-Family. Get a Deal Quality Score (0–100) with the full breakdown: cash flow, cap rate, DSCR, IRR, and a walk-away price.'
              },
              {
                num: '02',
                title: 'Save to Pipeline',
                body: 'Move it from "reviewing" to "offer made" to "closed" or "passed." Every analysis stays in one place. Revisit your numbers, compare deals side-by-side, never rebuild a spreadsheet.'
              },
              {
                num: '03',
                title: 'See Portfolio Impact',
                body: 'Connect the deal to the properties you already own — SFR, multi-family, or commercial. See how cash flow, concentration risk, and goal progress shift before you make the offer.'
              }
            ].map((step) => (
              <Grid size={{ xs: 12, md: 4 }} key={step.num}>
                <Box>
                  <Typography
                    sx={{
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: ACCENT,
                      letterSpacing: '0.08em',
                      mb: 1.5
                    }}
                  >
                    {step.num}
                  </Typography>
                  <Typography
                    component="h3"
                    sx={{
                      fontSize: '1.5rem',
                      fontWeight: 700,
                      color: '#111827',
                      mb: 1.5,
                      letterSpacing: '-0.01em'
                    }}
                  >
                    {step.title}
                  </Typography>
                  <Typography sx={{ fontSize: '1rem', lineHeight: 1.65, color: '#4B5563' }}>
                    {step.body}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>

          <Box sx={{ textAlign: 'center', mt: { xs: 5, md: 7 } }}>
            <Button variant="contained" size="large" href={PRIMARY_CTA_HREF} sx={ctaButtonSx}>
              Run a Deal Now →
            </Button>
          </Box>
        </Container>
      </Box>

      {/* ============== FINAL CTA ============== */}
      <Box component="section" sx={{ py: { xs: 7, md: 11 }, bgcolor: '#0F172A' }}>
        <Container maxWidth="md" sx={{ textAlign: 'center' }}>
          <Typography
            component="h2"
            sx={{
              fontSize: { xs: '2rem', md: '2.75rem' },
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: '#FFFFFF',
              mb: 2
            }}
          >
            Ready to stop guessing on deals?
          </Typography>
          <Typography
            sx={{
              fontSize: { xs: '1.0625rem', md: '1.125rem' },
              lineHeight: 1.6,
              color: '#CBD5E1',
              mb: 4,
              maxWidth: '600px',
              mx: 'auto'
            }}
          >
            Run your first analysis in five minutes. See exactly why a deal works or doesn't — before you waste a weekend on it.
          </Typography>
          <Button
            variant="contained"
            size="large"
            href={PRIMARY_CTA_HREF}
            sx={{
              bgcolor: '#FFFFFF',
              color: '#0F172A',
              px: 4,
              py: 1.5,
              borderRadius: '999px',
              fontSize: '1.0625rem',
              fontWeight: 500,
              textTransform: 'none',
              boxShadow: 'none',
              '&:hover': { bgcolor: '#F1F5F9', boxShadow: 'none' }
            }}
          >
            Run a Deal Now →
          </Button>
          <Typography sx={{ mt: 2, fontSize: '0.875rem', color: '#94A3B8' }}>
            Five minutes from address to score. Free during beta.
          </Typography>
        </Container>
      </Box>

      {/* ============== FAQ (moved below CTA, kept for SEO) ============== */}
      <Box component="section" sx={{ py: { xs: 6, md: 9 }, bgcolor: '#FFFFFF' }}>
        <Container maxWidth="md">
          <Typography
            component="h2"
            sx={{
              fontSize: { xs: '1.5rem', md: '1.75rem' },
              fontWeight: 600,
              color: '#111827',
              mb: 4,
              textAlign: 'center'
            }}
          >
            Common questions
          </Typography>
          {FAQ_ITEMS.map((item) => (
            <Box key={item.q} sx={{ mb: 3.5 }}>
              <Typography
                component="h3"
                sx={{ fontSize: '1.0625rem', fontWeight: 600, color: '#111827', mb: 1 }}
              >
                {item.q}
              </Typography>
              <Typography sx={{ fontSize: '0.9375rem', lineHeight: 1.7, color: '#4B5563' }}>
                {item.a}
              </Typography>
            </Box>
          ))}
        </Container>
      </Box>
    </>
  );
};

export default LandingPage;
