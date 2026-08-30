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

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  Button,
  TextField,
  Link as MuiLink
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import PublicHeader from '../components/common/PublicHeader';
// UniversalCalculator import removed 2026-05-16 (Phase 5) — landing page
// no longer embeds the form widget. See Issue #100 decision #3.
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

// Phase 5 (chat-first IA) — landing-page CTAs route to the chat surface,
// not the wizard. Per Issue #100 decision #7 the wizard route stays
// reachable but no nav links point to it from anywhere visible.
const PRIMARY_CTA_HREF = '/app';
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
  const navigate = useNavigate();
  // W6-S2b — hero-embed chat input. Submitting forwards the prompt to
  // /app, where ChatOverlay auto-runs turn 1 via its initialUserInput
  // prop. Activation handoff feels continuous because the input shape
  // and placeholder match the chat surface 1:1.
  const [heroDraft, setHeroDraft] = useState('');

  const submitHeroPrompt = (): void => {
    const trimmed = heroDraft.trim();
    if (!trimmed) return;
    // Activation event is logged server-side from chat.turn.completed
    // (W6-S2.5) — no frontend SDK call needed yet.
    navigate('/app', { state: { initialUserInput: trimmed } });
  };

  useEffect(() => {
    analytics.trackPageView('landing');
  }, []);

  const sampleColor = getScoreColor(SAMPLE_SCORE);

  return (
    <div data-clarity-unmask="True">
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

      {/* ============== HERO ==============

          UX Designer call 2026-05-16 — single-column centered. Two-column
          (chat | sample-card) layout was creating an 8:1 visual area
          mismatch that pulled the eye to the sample card instead of the
          chat. Sample card moved to its own proof section below the
          hero. The chat is unambiguously THE hero now — full-width
          (max 760px content area), generous multi-line composer,
          labeled CTA button with "Analyze →" instead of icon-only. */}
      <Box component="section" sx={{ py: { xs: 7, md: 11 }, bgcolor: '#FFFFFF' }}>
        <Container maxWidth="md">
          <Box sx={{ textAlign: 'center' }}>
            <Typography
              component="h1"
              sx={{
                fontSize: { xs: '2.25rem', sm: '2.875rem', md: '3.5rem' },
                fontWeight: 700,
                letterSpacing: '-0.02em',
                lineHeight: 1.1,
                color: '#111827',
                mb: 3,
                maxWidth: 820,
                mx: 'auto',
              }}
            >
              Analyze Any Deal. Track Every Property. See Your Full Portfolio — All In One Place.
            </Typography>
            <Typography
              sx={{
                fontSize: { xs: '1.0625rem', md: '1.1875rem' },
                lineHeight: 1.6,
                color: '#4B5563',
                mb: { xs: 5, md: 6 },
                maxWidth: 680,
                mx: 'auto',
              }}
            >
              BRRRR, Buy &amp; Hold, Multi-Family, and commercial — one platform that connects every deal to the portfolio you've already built. Built to flag the deals that don't work, not just the ones that do.
            </Typography>

            {/* THE chat surface — Phase 5 Day 4a (UX Designer's third pass).
                The two prior attempts (bare-input pill, then card-style
                multi-line) didn't pop because an EMPTY input has no
                content competing for the eye. The fix: show a STATIC
                DEMO CONVERSATION above the live composer. The card
                becomes content-rich; the user sees the magic before
                they have to do anything. Same visual language the
                actual chat uses (bubbles + score card preview), so
                the handoff to /app feels continuous, not a switch. */}
            <Box
              sx={{
                maxWidth: 760,
                mx: 'auto',
                bgcolor: '#FFFFFF',
                border: '2px solid #E5E7EB',
                borderRadius: '20px',
                boxShadow: '0 8px 24px rgba(15, 23, 42, 0.06)',
                transition:
                  'border-color 150ms, box-shadow 150ms, transform 150ms',
                '&:hover': {
                  borderColor: '#CBD5E1',
                  boxShadow: '0 12px 32px rgba(15, 23, 42, 0.08)',
                },
                '&:focus-within': {
                  borderColor: ACCENT,
                  boxShadow: `0 0 0 4px ${ACCENT}22, 0 12px 32px rgba(15, 23, 42, 0.08)`,
                },
              }}
              data-testid="landing-hero-chat"
            >
              {/* ===== Demo conversation (read-only, illustrative) ===== */}
              <Box sx={{ px: { xs: 2.5, sm: 3 }, py: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
                {/* Demo user bubble — right-aligned, accent fill */}
                <Box sx={{ alignSelf: 'flex-end', maxWidth: '85%' }}>
                  <Box
                    sx={{
                      bgcolor: ACCENT,
                      color: '#FFFFFF',
                      px: 2,
                      py: 1.25,
                      borderRadius: '18px',
                      fontSize: 15,
                      lineHeight: 1.5,
                      display: 'inline-block',
                    }}
                  >
                    analyze 1837 Walnut Way Anna TX 75409
                  </Box>
                </Box>
                {/* Demo assistant bubble — left-aligned, neutral surface */}
                <Box sx={{ alignSelf: 'flex-start', maxWidth: '90%' }}>
                  <Box
                    sx={{
                      bgcolor: '#F8FAFC',
                      border: '1px solid #E5E7EB',
                      px: 2.5,
                      py: 2,
                      borderRadius: '14px',
                      fontSize: 14.5,
                      lineHeight: 1.55,
                      textAlign: 'left',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 1 }}>
                      <Box
                        component="span"
                        sx={{
                          fontSize: 32,
                          fontWeight: 700,
                          color: '#16A34A',
                          fontVariantNumeric: 'tabular-nums',
                          lineHeight: 1,
                        }}
                      >
                        82
                      </Box>
                      <Box component="span" sx={{ fontSize: 16, color: '#6B7280' }}>
                        / 100
                      </Box>
                      <Box
                        component="span"
                        sx={{
                          ml: 'auto',
                          fontSize: 13,
                          fontWeight: 600,
                          color: '#16A34A',
                        }}
                      >
                        Above professional standards
                      </Box>
                    </Box>
                    <Box sx={{ color: '#374151' }}>
                      <Box component="strong" sx={{ fontWeight: 600 }}>Buy-and-hold for 1837 Walnut Way</Box> — cash flow{' '}
                      <Box component="strong" sx={{ fontWeight: 600 }}>$295/mo</Box>, 10-year IRR{' '}
                      <Box component="strong" sx={{ fontWeight: 600 }}>16.8%</Box>, market strength 85/100.
                      Walk-away price{' '}
                      <Box component="strong" sx={{ fontWeight: 600 }}>$211,500</Box>.
                    </Box>
                  </Box>
                </Box>
              </Box>

              {/* Hairline divider between demo + live input */}
              <Box sx={{ borderTop: '1px solid #E5E7EB' }} />

              {/* ===== Live input — the actual chat composer ===== */}
              <Box
                component="form"
                onSubmit={(e) => {
                  e.preventDefault();
                  submitHeroPrompt();
                }}
                sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  alignItems: { xs: 'stretch', sm: 'flex-end' },
                  gap: 1.5,
                  px: { xs: 2, sm: 2.5 },
                  py: 2,
                }}
              >
                <TextField
                  fullWidth
                  multiline
                  minRows={2}
                  maxRows={8}
                  variant="standard"
                  placeholder="Try yours — paste a Zillow link, type an address, or describe a property"
                  value={heroDraft}
                  onChange={(e) => setHeroDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      submitHeroPrompt();
                    }
                  }}
                  InputProps={{
                    disableUnderline: true,
                    sx: {
                      fontSize: { xs: '1.0625rem', md: '1.125rem' },
                      lineHeight: 1.55,
                      px: 0.5,
                      py: 0.5,
                      textAlign: 'left',
                    },
                  }}
                  inputProps={{
                    'aria-label': 'Ask about a property to analyze',
                    'data-testid': 'landing-hero-chat-input',
                    style: { textAlign: 'left' },
                  }}
                />
                <Button
                  type="submit"
                  variant="contained"
                  disabled={heroDraft.trim().length === 0}
                  endIcon={<SendIcon sx={{ fontSize: 18 }} />}
                  data-testid="landing-hero-chat-send"
                  sx={{
                    flexShrink: 0,
                    alignSelf: { xs: 'stretch', sm: 'flex-end' },
                    height: 52,
                    px: 3,
                    borderRadius: '14px',
                    bgcolor: ACCENT,
                    color: '#FFFFFF',
                    fontSize: '1rem',
                    fontWeight: 600,
                    textTransform: 'none',
                    boxShadow: 'none',
                    '&:hover': { bgcolor: '#0058B3', boxShadow: 'none' },
                    '&.Mui-disabled': {
                      bgcolor: '#E5E7EB',
                      color: '#9CA3AF',
                    },
                  }}
                >
                  Analyze
                </Button>
              </Box>
            </Box>
            <Typography sx={{ mt: 2.5, fontSize: '0.9375rem', color: '#6B7280' }}>
              First analysis free, no credit card. Get a Deal Quality Score in seconds.
            </Typography>
          </Box>
        </Container>
      </Box>

      {/* ============== SAMPLE-ANALYSIS PROOF =============

          Moved out of the hero 2026-05-16 (UX Designer call). The card
          earns its place as social proof — "this is the deal report
          most calculators won't show you" — but on its own row so it
          doesn't compete with the chat for first-glance attention. */}
      <Box
        component="section"
        sx={{ py: { xs: 6, md: 9 }, bgcolor: '#F9FAFB' }}
      >
        <Container maxWidth="md">
          <Box sx={{ textAlign: 'center', mb: { xs: 4, md: 5 } }}>
            <Typography
              component="h2"
              sx={{
                fontSize: { xs: '1.5rem', md: '1.875rem' },
                fontWeight: 700,
                letterSpacing: '-0.01em',
                color: '#111827',
                mb: 1.5,
              }}
            >
              Honest analysis. Even when it's bad news.
            </Typography>
            <Typography
              sx={{
                fontSize: '1.0625rem',
                color: '#4B5563',
                maxWidth: 560,
                mx: 'auto',
                lineHeight: 1.6,
              }}
            >
              Here's a real deal that didn't pencil out. Most calculators won't tell you.
            </Typography>
          </Box>
          <Box sx={{ maxWidth: 520, mx: 'auto' }}>
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
          </Box>
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

      {/* CALCULATOR EMBED — removed 2026-05-16 (Phase 5, chat-first IA).
          Per Issue #100 decision #3, the form widget was retired from
          the landing page; the hero-embed chat above is the canonical
          entry point. The wizard route (/sfr-analysis) remains
          accessible but unlinked. UniversalCalculator still ships for
          the public /calculator route during the migration window. */}

      {/* ============== MANIFESTO ==============

          Day 4b (UX Designer call 2026-05-17) — the old "Social Proof"
          section was the company quoting itself with three vanity stats
          ("100+ beta deals", "3 strategies", "0 spreadsheets"). Quoting
          yourself isn't social proof. Re-framed as a MANIFESTO: a
          point-of-view statement that reinforces the "honest analysis"
          trust hook, without pretending to have social proof we don't
          yet have. When real testimonials + customer logos accumulate,
          they replace this section. */}
      <Box component="section" sx={{ py: { xs: 7, md: 10 }, bgcolor: '#F9FAFB' }}>
        <Container maxWidth="md">
          <Box sx={{ textAlign: 'center', maxWidth: 720, mx: 'auto' }}>
            <Typography
              component="h2"
              sx={{
                fontSize: { xs: '1.625rem', md: '2rem' },
                fontWeight: 700,
                letterSpacing: '-0.02em',
                color: '#111827',
                mb: 4,
              }}
            >
              Why we built this.
            </Typography>
            <Typography
              sx={{
                fontSize: { xs: '1.0625rem', md: '1.1875rem' },
                lineHeight: 1.7,
                color: '#374151',
                mb: 3,
              }}
            >
              Most real estate calculators tell you what you want to hear.
              Plug in numbers, get a green check, feel good, make an offer.
            </Typography>
            <Typography
              sx={{
                fontSize: { xs: '1.0625rem', md: '1.1875rem' },
                lineHeight: 1.7,
                color: '#374151',
                mb: 3,
              }}
            >
              REanalyzr is the opposite: run institutional-grade math
              against your assumptions and tell you the truth — even
              when it&apos;s bad news.
            </Typography>
            <Typography
              sx={{
                fontSize: { xs: '1.0625rem', md: '1.1875rem' },
                lineHeight: 1.7,
                color: '#374151',
                mb: 4,
              }}
            >
              Most deals don&apos;t pencil. If we&apos;re not surfacing that
              math clearly, we&apos;re just another calculator. The world has
              enough calculators.
            </Typography>
            <Typography sx={{ fontSize: '0.9375rem', color: '#6B7280' }}>
              — The REanalyzr team
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

      {/* ============== PRICING CALLOUT ==============

          Day 4c (UX Designer call 2026-05-17) — visitors hate hidden
          pricing. The pricing-strategy conversation locked in: free
          score + free first analysis + $4.99/deal + bundles. Surface
          that on the landing page so prospects know what they're
          looking at before they sign up. Three-column band with a B2B
          inbound CTA below (Marcus Chen's note — captures rare-but-
          valuable lender/agent/syndicator inbound at zero cost).
          Full /pricing page (Issue #107) goes deeper. */}
      <Box component="section" sx={{ py: { xs: 7, md: 10 }, bgcolor: '#FFFFFF', borderTop: '1px solid #F3F4F6' }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: { xs: 5, md: 6 } }}>
            <Typography
              component="h2"
              sx={{
                fontSize: { xs: '1.75rem', md: '2.25rem' },
                fontWeight: 700,
                letterSpacing: '-0.02em',
                color: '#111827',
                mb: 2,
              }}
            >
              Pricing built around your actual usage.
            </Typography>
            <Typography sx={{ fontSize: '1.0625rem', color: '#4B5563', maxWidth: 640, mx: 'auto' }}>
              The platform is free. You pay when you go deep. No subscription, no auto-renew, no surprise charges.
            </Typography>

            {/* Free-beta notice (2026-08-30) — mirrors the banner on
                /pricing. Payments aren't live yet; every analyzed
                property gets a free license. Remove both when billing
                switches on. */}
            <Box
              sx={{
                mt: 3,
                mx: 'auto',
                maxWidth: 640,
                px: 2.5,
                py: 1.5,
                borderRadius: 2,
                border: '1px solid #BFDBFE',
                bgcolor: '#EFF6FF',
              }}
              data-testid="free-beta-notice"
            >
              <Typography sx={{ fontSize: '0.9375rem', color: '#1E3A8A', lineHeight: 1.6 }}>
                <Box component="span" sx={{ fontWeight: 600 }}>
                  Free while we're in beta.
                </Box>{' '}
                Payments aren't switched on yet — every property you analyze
                is fully unlocked at no cost. The pricing below is what it
                will cost when they are.
              </Typography>
            </Box>
          </Box>

          <Grid container spacing={3} justifyContent="center">
            {[
              {
                eyebrow: 'FREE',
                price: '$0',
                priceTail: '',
                title: 'Get the score',
                lines: [
                  'Deal Quality Score on any property',
                  'Portfolio + Pipeline workspace',
                  '1 free full analysis on signup',
                ],
                accent: false,
              },
              {
                eyebrow: 'PER DEAL',
                price: '$4.99',
                priceTail: '/ deal',
                title: 'Go deep on one property',
                lines: [
                  '28+ professional metrics',
                  '10-year projection + walk-away price',
                  '180-day editing window · PDF export',
                ],
                accent: true,
              },
              // Task #124 (2026-07-26): Bundles tier removed. PricingPage
              // ships only Free + Per-Deal per Task #48; Landing must match
              // or user hits trust break clicking Pricing from Landing.
              // Bundles was aspirational — not built, no fulfillment path.
            ].map((tier) => (
              <Grid size={{ xs: 12, sm: 6, md: 5 }} key={tier.eyebrow}>
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
                    position: 'relative',
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
                  <Box component="ul" sx={{ m: 0, p: 0, listStyle: 'none', flexGrow: 1 }}>
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
                </Paper>
              </Grid>
            ))}
          </Grid>

          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Typography sx={{ fontSize: '0.9375rem', color: '#6B7280', mb: 1.5 }}>
              7-day no-questions refund · Cancel any pack within 60 days
            </Typography>
            <Typography sx={{ fontSize: '0.9375rem', color: '#374151' }}>
              For lenders, agents, syndicators —{' '}
              <MuiLink
                href="mailto:contact@reanalyzr.com?subject=B2B%20inquiry"
                sx={{
                  color: ACCENT,
                  fontWeight: 500,
                  textDecoration: 'none',
                  '&:hover': { textDecoration: 'underline' },
                }}
              >
                contact us about volume pricing →
              </MuiLink>
            </Typography>
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
            Five minutes from address to score. First analysis included, then $4.99 per deal.
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
    </div>
  );
};

export default LandingPage;
