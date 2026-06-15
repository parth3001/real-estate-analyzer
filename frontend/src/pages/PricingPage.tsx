/**
 * PricingPage — /pricing route.
 *
 * Rewritten 2026-05-18 (Issue #107) to match the locked pricing
 * model from the strategic conversation:
 *   - Free: Deal Quality Score on any property + free first full analysis
 *   - $4.99 per property unlock (single deal)
 *   - 5-pack at $19.99 ($4/deal effective)
 *   - 10-pack at $34.99 ($3.50/deal effective)
 *   - NO monthly subscription (defer to 90-120 days post-launch)
 *   - B2B contracts: separate workstream
 *
 * Previous version pitched "$0/month forever" beta lifetime access
 * which is the opposite of the per-deal model. Removed.
 *
 * Page structure:
 *   1. Hero — "Pay only when you go deep" positioning
 *   2. Three-tier band (Free · Single · Bundles) — same shape as landing
 *   3. What $4.99 buys — the 15-outcome list from the packaging conversation
 *   4. B2B inbound section
 *   5. FAQ (refund, expiry, no-subscription, etc.)
 *   6. Final CTA
 */

import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Box, Container, Typography, Paper, Button, Link as MuiLink } from '@mui/material';
import Grid from '@mui/system/Grid';
import { useNavigate } from 'react-router-dom';
import StickyHeader from '../components/SampleAnalysis/StickyHeader';
import PricingFAQ from '../components/Pricing/PricingFAQ';
import type { FAQItem } from '../components/Pricing/PricingFAQ';
import { analytics } from '../utils/analytics';

const ACCENT = '#0071E3';

const PricingPage: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    analytics.trackPageView('pricing');
  }, []);

  // ===== Tiers =====
  //
  // Task #48 (2026-06-14): rewrote tier cards to remove unbuilt promises.
  // Strip-list per #33 audit: bundles tier (no Stripe), tax modeling
  // (engine commented out), adversarial bear case (not verified wired),
  // sensitivity analysis (not surfaced). Soft-reworded "lender-ready"
  // PDF claim and split free tier into anonymous + signed-up benefits.
  const tiers = [
    {
      eyebrow: 'FREE',
      price: '$0',
      priceTail: '',
      title: 'Get the score',
      lines: [
        'Deal Quality Score on any property — no signup needed',
        'Sign up free (no card) to save deals to your workspace',
        'First full analysis free after signup',
        'Portfolio + Pipeline workspace',
      ],
      cta: { label: 'Start free →', action: () => navigate('/app') },
      accent: false,
    },
    {
      eyebrow: 'PER DEAL',
      price: '$4.99',
      priceTail: '/ deal',
      title: 'Go deep on one property',
      lines: [
        '28+ professional metrics',
        'Walk-away price + 10-year projection',
        'Stress tests — rate shocks, vacancy, rent drops',
        'AI commentary on every score and trade-off',
        'Full audit trail — every input and assumption',
        'Override any assumption, re-score instantly',
        'Save to workspace · PDF export',
        '180-day editing window per deal',
      ],
      cta: { label: 'Try free first →', action: () => navigate('/app') },
      accent: true,
    },
  ];

  // Task #48 (2026-06-14): trimmed value-prop list to items that ship
  // in v1. Removed sensitivity analysis (not surfaced), adversarial bear
  // case (not verified wired), tax + exit modeling (engine commented
  // out), compare-licensed-deals (Phase 4b). Softened "lender-ready"
  // PDF claim. From 15 items to 11 — still substantive, all deliverable.
  const valueProps = [
    { label: 'Know if it works', detail: 'Full 28+ professional metrics — Cap Rate, DSCR, IRR, Cash-on-Cash, GRM, BEO, debt yield, the works' },
    { label: 'Know your max bid', detail: 'Walk-away price anchored in income approach (NOI ÷ market cap rate), not your offer' },
    { label: 'Project forward 10 years', detail: 'Year-by-year cash flow, equity buildup, total return — the chart you show your partner' },
    { label: 'Stress-test it', detail: 'Rate shocks, vacancy spikes, rent drops — find what breaks the deal before you sign' },
    { label: 'AI commentary', detail: 'Plain-English explanation of why the score is what it is + what to negotiate' },
    { label: 'Override anything', detail: 'Drag rent, vacancy, rate, anything. Re-score in real time.' },
    { label: 'Full audit trail', detail: 'Every input, every assumption, every data source — line-item breakdown of every number you see.' },
    { label: 'Save to workspace', detail: 'Add to your tracked workspace; survives license expiry as read-only' },
    { label: 'PDF export', detail: 'Export your full analysis as a PDF. Send to your loan officer, CPA, or partner.' },
    { label: '180 days of editable access', detail: 'Re-run with new assumptions any time within 180 days of purchase' },
    { label: 'Continuous chat depth', detail: 'Ask follow-up questions — stress tests, what-ifs, comparisons — until you understand the deal' },
  ];

  // Task #48 (2026-06-14): trimmed FAQ to items that match shipped product.
  // Removed bundles Q (bundles deferred to v1.1), changed MF/BRRRR Q to
  // honestly state SFR-only today, dropped the gated-vs-free hairsplit
  // line that contradicted the free tier card.
  const faqItems: FAQItem[] = [
    {
      question: 'What counts as one "deal"?',
      answer: 'One property analysis. You can switch strategies, override assumptions, re-run stress tests, and access the full underwriting unlimited times on the SAME property for 180 days. A different property is a different deal.',
    },
    {
      question: 'Why no monthly subscription?',
      answer: 'Real estate investing is episodic — you analyze 5-10 deals in a pipeline sprint, then nothing for months. Subscriptions don\'t match that behavior. Pay-per-deal aligns price with use. No surprise auto-renews.',
    },
    {
      question: 'What if I want a refund?',
      answer: '7 days, no questions asked. Email us with your purchase reference and we will refund the deal.',
    },
    {
      question: 'What happens after 180 days on a purchased deal?',
      answer: 'The deal becomes read-only — you can still see everything you bought (score, audit trail, projections), it just stops accepting new assumption overrides or fresh re-runs. Market data and rates drift over six months; re-purchase if you want fresh analysis on that property.',
    },
    {
      question: 'How is the free Deal Quality Score useful if it\'s just one number?',
      answer: 'The score (0-100) tells you if a deal is in the ballpark of "above professional standards" or "below" — enough to know if it\'s worth $4.99 to find out for real. Plus you get headline metrics (cash flow direction, cap rate, 1% rule). The deeper detail (audit trail, stress tests, 10-year projection, AI commentary) unlocks with the $4.99 deal.',
    },
    {
      question: 'Is my first analysis really free?',
      answer: 'Yes. After signup, your first property unlock — full depth, 180-day window — is free. No credit card required. We bet that the first analysis is good enough to make $4.99 feel reasonable for the next one.',
    },
    {
      question: 'Do you handle multi-family?',
      answer: 'Today: single-family residential (SFR) buy-and-hold. Multi-family and BRRRR analysis are in active development and will land later this year — they\'ll likely get their own tier reflecting the heavier engine and unit-level inputs.',
    },
    {
      question: 'I\'m a lender / agent / syndicator. Do you have volume pricing?',
      answer: 'Yes — separate B2B pricing for institutional users. Contact us about volume contracts, embedded use cases (loan origination workflow, branded client reports), and team accounts.',
    },
    {
      question: 'Why is the platform different from a calculator?',
      answer: 'Calculators do math. Platforms remember. REanalyzr tracks every deal you\'ve analyzed in your pipeline, connects each new deal to the properties you already own, and surfaces the truth — including when the deal doesn\'t work. The world has enough calculators.',
    },
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#FFFFFF' }}>
      <StickyHeader />

      <Helmet>
        <title>Pricing — REanalyzr | Pay only when you go deep</title>
        <meta
          name="description"
          content="REanalyzr pricing: free Deal Quality Score on any property, $4.99 per deep analysis, no subscription."
        />
        <link rel="canonical" href="https://reanalyzr.com/pricing" />
      </Helmet>

      {/* ===== Hero ===== */}
      <Box sx={{ pt: { xs: 10, md: 12 }, pb: { xs: 6, md: 8 }, px: 3 }}>
        <Container maxWidth="md">
          <Box sx={{ textAlign: 'center' }}>
            <Typography
              component="h1"
              sx={{
                fontSize: { xs: '2.25rem', md: '3rem' },
                fontWeight: 700,
                color: '#111827',
                letterSpacing: '-0.02em',
                lineHeight: 1.1,
                mb: 3,
              }}
            >
              Honest analysis. Pay only when you go deep.
            </Typography>
            <Typography
              sx={{
                fontSize: { xs: '1.0625rem', md: '1.1875rem' },
                color: '#4B5563',
                lineHeight: 1.6,
                maxWidth: 680,
                mx: 'auto',
              }}
            >
              The platform is free. Get a Deal Quality Score on any property. Save deals to your workspace. Pay $4.99 only when you want the full institutional-grade underwriting.
            </Typography>
          </Box>
        </Container>
      </Box>

      {/* ===== Three-tier pricing band ===== */}
      <Box sx={{ pb: { xs: 8, md: 10 }, px: 3 }}>
        <Container maxWidth="lg">
          <Grid container spacing={3}>
            {tiers.map((tier) => (
              <Grid size={{ xs: 12, md: 4 }} key={tier.eyebrow}>
                <Paper
                  elevation={0}
                  sx={{
                    bgcolor: '#FFFFFF',
                    border: tier.accent ? `2px solid ${ACCENT}` : '1px solid #E5E7EB',
                    borderRadius: '16px',
                    p: { xs: 3, md: 3.5 },
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: '0.6875rem',
                      fontWeight: 600,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: tier.accent ? ACCENT : '#6B7280',
                      mb: 2,
                    }}
                  >
                    {tier.eyebrow}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75, mb: 1 }}>
                    <Typography
                      sx={{
                        fontSize: '2.5rem',
                        fontWeight: 700,
                        color: '#111827',
                        lineHeight: 1,
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {tier.price}
                    </Typography>
                    <Typography sx={{ fontSize: '0.9375rem', color: '#6B7280' }}>
                      {tier.priceTail}
                    </Typography>
                  </Box>
                  <Typography
                    component="h3"
                    sx={{
                      fontSize: '1.125rem',
                      fontWeight: 600,
                      color: '#111827',
                      mb: 2,
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {tier.title}
                  </Typography>
                  <Box component="ul" sx={{ m: 0, p: 0, listStyle: 'none', flexGrow: 1, mb: 3 }}>
                    {tier.lines.map((line) => (
                      <Box
                        component="li"
                        key={line}
                        sx={{
                          fontSize: '0.9375rem',
                          color: '#4B5563',
                          lineHeight: 1.6,
                          mb: 1,
                          pl: 2,
                          position: 'relative',
                          '&::before': {
                            content: '"·"',
                            position: 'absolute',
                            left: 0,
                            color: tier.accent ? ACCENT : '#9CA3AF',
                            fontWeight: 700,
                          },
                        }}
                      >
                        {line}
                      </Box>
                    ))}
                  </Box>
                  <Button
                    variant={tier.accent ? 'contained' : 'outlined'}
                    onClick={tier.cta.action}
                    sx={{
                      mt: 'auto',
                      bgcolor: tier.accent ? ACCENT : 'transparent',
                      color: tier.accent ? '#FFFFFF' : ACCENT,
                      borderColor: ACCENT,
                      textTransform: 'none',
                      borderRadius: 2,
                      py: 1.25,
                      fontSize: '1rem',
                      fontWeight: 500,
                      '&:hover': {
                        bgcolor: tier.accent ? '#0058B3' : `${ACCENT}11`,
                      },
                    }}
                  >
                    {tier.cta.label}
                  </Button>
                </Paper>
              </Grid>
            ))}
          </Grid>

          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Typography sx={{ fontSize: '0.9375rem', color: '#6B7280' }}>
              7-day no-questions refund · No subscription · No auto-renew
            </Typography>
          </Box>
        </Container>
      </Box>

      {/* ===== What $4.99 buys (15-outcome list) ===== */}
      <Box sx={{ py: { xs: 7, md: 10 }, bgcolor: '#F9FAFB', px: 3 }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: { xs: 5, md: 7 } }}>
            <Typography
              component="h2"
              sx={{
                fontSize: { xs: '1.875rem', md: '2.5rem' },
                fontWeight: 700,
                color: '#111827',
                letterSpacing: '-0.02em',
                mb: 2,
              }}
            >
              What $4.99 unlocks.
            </Typography>
            <Typography sx={{ fontSize: '1.0625rem', color: '#4B5563', maxWidth: 640, mx: 'auto' }}>
              Not 15 features — 15 questions answered. Each one is something an investor stands in front of a property at 6 PM trying to figure out.
            </Typography>
          </Box>
          <Grid container spacing={3}>
            {valueProps.map((v) => (
              <Grid size={{ xs: 12, md: 6 }} key={v.label}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                  <Box
                    sx={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      bgcolor: ACCENT,
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      flexShrink: 0,
                      mt: 0.25,
                    }}
                  >
                    ✓
                  </Box>
                  <Box>
                    <Typography
                      sx={{
                        fontSize: '1rem',
                        fontWeight: 600,
                        color: '#111827',
                        mb: 0.5,
                      }}
                    >
                      {v.label}
                    </Typography>
                    <Typography sx={{ fontSize: '0.9375rem', color: '#4B5563', lineHeight: 1.55 }}>
                      {v.detail}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ===== B2B section ===== */}
      <Box sx={{ py: { xs: 7, md: 9 }, bgcolor: '#FFFFFF', px: 3 }}>
        <Container maxWidth="md">
          <Box sx={{ textAlign: 'center' }}>
            <Typography
              component="h2"
              sx={{
                fontSize: { xs: '1.625rem', md: '2rem' },
                fontWeight: 700,
                color: '#111827',
                letterSpacing: '-0.02em',
                mb: 2,
              }}
            >
              Lenders · agents · syndicators
            </Typography>
            <Typography sx={{ fontSize: '1.0625rem', color: '#4B5563', maxWidth: 600, mx: 'auto', mb: 3 }}>
              Embedding REanalyzr in your loan-origination workflow? Sharing branded analyses with investor clients? Volume contracts available — contact us to scope.
            </Typography>
            <MuiLink
              href="mailto:contact@reanalyzr.com?subject=B2B%20pricing%20inquiry"
              sx={{
                display: 'inline-block',
                px: 3,
                py: 1.25,
                border: `2px solid ${ACCENT}`,
                borderRadius: 2,
                color: ACCENT,
                fontSize: '1rem',
                fontWeight: 500,
                textDecoration: 'none',
                '&:hover': { bgcolor: `${ACCENT}11`, textDecoration: 'none' },
              }}
            >
              Contact us about volume pricing →
            </MuiLink>
          </Box>
        </Container>
      </Box>

      {/* ===== FAQ ===== */}
      <Box sx={{ py: { xs: 7, md: 9 }, bgcolor: '#F9FAFB', px: 3 }}>
        <Container maxWidth="md">
          <Box sx={{ textAlign: 'center', mb: { xs: 5, md: 6 } }}>
            <Typography
              component="h2"
              sx={{
                fontSize: { xs: '1.875rem', md: '2.25rem' },
                fontWeight: 700,
                color: '#111827',
                letterSpacing: '-0.02em',
              }}
            >
              Pricing FAQ
            </Typography>
          </Box>
          <PricingFAQ items={faqItems} />
        </Container>
      </Box>

      {/* ===== Final CTA ===== */}
      <Box sx={{ py: { xs: 7, md: 10 }, bgcolor: '#0F172A', px: 3 }}>
        <Container maxWidth="md" sx={{ textAlign: 'center' }}>
          <Typography
            component="h2"
            sx={{
              fontSize: { xs: '1.875rem', md: '2.5rem' },
              fontWeight: 700,
              color: '#FFFFFF',
              letterSpacing: '-0.02em',
              mb: 2,
            }}
          >
            Try one deal free.
          </Typography>
          <Typography
            sx={{
              fontSize: { xs: '1.0625rem', md: '1.1875rem' },
              color: '#CBD5E1',
              lineHeight: 1.6,
              mb: 4,
              maxWidth: 600,
              mx: 'auto',
            }}
          >
            Sign up. Get one full property unlock on the house. No credit card. Pay $4.99 only if you want a second.
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/app')}
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
              '&:hover': { bgcolor: '#F1F5F9', boxShadow: 'none' },
            }}
          >
            Start free →
          </Button>
        </Container>
      </Box>
    </Box>
  );
};

export default PricingPage;
