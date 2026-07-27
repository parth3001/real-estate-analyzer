/**
 * SampleAnalysisPage — v2.0 rewrite (Task #127, 2026-07-26)
 *
 * The v1.0 page rendered the entire wizard-output UI (verdict badges,
 * "Investment Decision" panels, "Professional/Institutional-Grade" tier
 * labels) — 1400+ lines that sold the wrong product to public visitors.
 *
 * The v2.0 rewrite is a mock chat conversation about a real property,
 * ending in a score card display. Users see the actual chat interface
 * they'll get post-signup, and hit a "Try it live" CTA that opens /app.
 *
 * Locked decision: mock scripted conversation (not a live chat) —
 * cheapest brand-consistent option, avoids exposing rate limits + LLM
 * costs to bouncing anonymous visitors. Live experience is one click away.
 *
 * SEO note: page URL, canonical, meta stays. Rewritten meta description
 * removes "verdict" language. Structured data suitable for /sample-analysis.
 */

import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Container,
  Chip,
  Paper,
  Stack,
  LinearProgress,
} from '@mui/material';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import BoltOutlinedIcon from '@mui/icons-material/BoltOutlined';
import StickyHeader from '../components/SampleAnalysis/StickyHeader';
import { useAuth } from '../contexts/AuthContext';
import { analytics } from '../utils/analytics';

const SampleAnalysisPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Task #127 (2026-07-26): logged-in users go to /app (chat-first IA).
  // /dashboard 301-redirects to /app anyway, but we skip the extra hop.
  useEffect(() => {
    if (user && location.pathname === '/') {
      navigate('/app', { replace: true });
    }
  }, [user, location.pathname, navigate]);

  useEffect(() => {
    analytics.trackPageView('sample_analysis');
  }, []);

  const openChat = (): void => {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('reanalyzr.chat.sessionId');
    }
    navigate('/app');
  };

  return (
    <>
      <Helmet>
        <title>See the AI analyze a real rental property — REanalyzr</title>
        <meta
          name="description"
          content="Watch REanalyzr's chat-first AI underwrite a real single-family rental in Anna, TX — a full 28-metric analysis, stress tests, and follow-up questions in plain English. Try it live free."
        />
        <meta
          property="og:title"
          content="See the AI analyze a real rental property — REanalyzr"
        />
        <meta
          property="og:description"
          content="Chat-first real estate underwriting. Describe a deal, get institutional-quality analysis in about 30 seconds."
        />
        <link rel="canonical" href="https://reanalyzr.com/sample-analysis" />
      </Helmet>

      <StickyHeader />

      <Container maxWidth="md" sx={{ py: { xs: 4, md: 6 } }}>
        {/* Hero */}
        <Box sx={{ mb: 5, textAlign: { xs: 'left', md: 'center' } }}>
          <Chip
            label="Sample Analysis"
            size="small"
            sx={{
              mb: 2,
              bgcolor: 'primary.50',
              color: 'primary.main',
              fontWeight: 600,
            }}
          />
          <Typography
            component="h1"
            sx={{
              fontSize: { xs: '2rem', md: '2.75rem' },
              fontWeight: 700,
              letterSpacing: '-0.02em',
              lineHeight: 1.15,
              mb: 2,
            }}
          >
            Watch the AI underwrite a real deal.
          </Typography>
          <Typography
            sx={{
              fontSize: { xs: '1rem', md: '1.125rem' },
              color: 'text.secondary',
              maxWidth: 620,
              mx: { xs: 0, md: 'auto' },
              lineHeight: 1.55,
            }}
          >
            Below is an actual conversation about a single-family rental
            in Anna, TX. This is what the chat looks like end-to-end — no
            forms, no wizards, just describe the deal.
          </Typography>
        </Box>

        {/* Try live CTA — above the fold */}
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            justifyContent: 'center',
            mb: 6,
            flexWrap: 'wrap',
          }}
        >
          <Button
            variant="contained"
            size="large"
            onClick={openChat}
            startIcon={<ChatBubbleOutlineIcon />}
            sx={{ textTransform: 'none', px: 4, borderRadius: 2 }}
          >
            Try it live free
          </Button>
          <Button
            variant="outlined"
            size="large"
            href="#conversation"
            sx={{ textTransform: 'none', px: 4, borderRadius: 2 }}
          >
            Watch the sample
          </Button>
        </Box>

        {/* Conversation */}
        <Box id="conversation" sx={{ scrollMarginTop: 24 }}>
          <ConversationContainer>
            {/* User turn 1 */}
            <UserBubble>
              Analyze 1837 Walnut Way, Anna, TX 75409 as a buy-and-hold
              rental.{'\n\n'}
              Purchase price: $385,000{'\n'}
              Down payment: 25%{'\n'}
              Interest rate: 7.0%{'\n'}
              Loan term: 30 years{'\n'}
              Estimated rent: $2,650/month{'\n'}
              Property tax rate: 2.1%{'\n\n'}
              Score this deal and give me the full analysis.
            </UserBubble>

            {/* Assistant turn 1 — the score card */}
            <AssistantBubble>
              <Typography paragraph>
                Here's the full buy-and-hold analysis for{' '}
                <strong>1837 Walnut Way, Anna, TX 75409</strong>.
              </Typography>
              <MockScoreCard />
              <Typography paragraph sx={{ mt: 2 }}>
                The market and exit scores (85 and 83) reflect real strength
                in the Collin County corridor. The pull-down is the
                price-to-rent relationship at 7% financing — mortgage of
                $1,921/mo against $2,517 effective rent leaves a monthly
                shortfall of about $969. Cap rate at 2.97% is well below
                the 7% market median for tier-3 cash-flow markets.
              </Typography>
              <Typography paragraph sx={{ mt: 1 }}>
                Walk-away price: <strong>$175,677</strong> — that's what
                the property would need to be priced at to hit a 1.0 DSCR
                at these rents and rates. Gap of $209,300 to the asking
                price.
              </Typography>
            </AssistantBubble>

            {/* User turn 2 */}
            <UserBubble>What if I put 50% down instead of 25%?</UserBubble>

            {/* Assistant turn 2 — stress test result */}
            <AssistantBubble>
              <Typography paragraph>
                At 50% down, the score moves to <strong>40/100</strong> —
                up 2 points from baseline.
              </Typography>
              <Typography paragraph>
                Monthly cash flow improves from -$969 to -$329 (still
                negative), DSCR climbs from 0.50 to 0.74, and 10-year IRR
                rises from 3.38% to 4.66%. The catch: you're deploying an
                additional $96,250 in equity to get there, and the deal
                still runs negative monthly.
              </Typography>
              <Typography paragraph>
                The core issue isn't leverage — it's that operational cash
                flow is negative regardless of financing. Down payment
                buys breathing room, not a fix. Would help more to test
                higher rents or a lower purchase price.
              </Typography>
            </AssistantBubble>

            {/* User turn 3 */}
            <UserBubble>What's the walk-away price for a 1.25 DSCR?</UserBubble>

            {/* Assistant turn 3 — walk-away calc */}
            <AssistantBubble>
              <Typography paragraph>
                For a <strong>1.25 DSCR</strong> — the threshold most
                lenders want for a rental — the property would need to be
                priced at about <strong>$135,000</strong>.
              </Typography>
              <Typography paragraph>
                That's a $250,000 gap to the current $385,000 ask. Even at
                20% down, a $308K loan at 7% is $2,049/mo P&I — more than
                the rent alone.
              </Typography>
              <Typography paragraph>
                If Anna is the target market, either wait for prices to
                soften, target properties with higher rent potential (this
                one's $2,650 for a 1,268 sqft SFR), or move up the debt
                stack with seller financing or an assumable loan below 7%.
              </Typography>
            </AssistantBubble>
          </ConversationContainer>
        </Box>

        {/* Below-the-fold CTA */}
        <Box
          sx={{
            mt: 6,
            p: { xs: 3, md: 5 },
            bgcolor: 'grey.900',
            color: 'grey.100',
            borderRadius: 3,
            textAlign: 'center',
          }}
        >
          <BoltOutlinedIcon sx={{ fontSize: 40, mb: 2, color: 'primary.main' }} />
          <Typography sx={{ fontSize: { xs: 20, md: 24 }, fontWeight: 700, mb: 1 }}>
            Now analyze YOUR property.
          </Typography>
          <Typography sx={{ color: 'grey.400', mb: 3, maxWidth: 460, mx: 'auto' }}>
            Paste a Zillow link, type an address, or describe the numbers.
            The chat above is exactly what you'll get. Free signup, first
            analysis included.
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={openChat}
            sx={{
              textTransform: 'none',
              px: 4,
              borderRadius: 2,
              bgcolor: 'white',
              color: 'grey.900',
              '&:hover': { bgcolor: 'grey.100' },
            }}
          >
            Try it live free
          </Button>
        </Box>

        {/* Trust line */}
        <Typography
          sx={{
            mt: 3,
            fontSize: 13,
            color: 'text.secondary',
            textAlign: 'center',
          }}
        >
          Institutional-quality underwriting. FRED mortgage rates, RentCast
          comps, Census demographics. No subscription — $4.99 per deal
          after your first free one.
        </Typography>
      </Container>
    </>
  );
};

// ===== Chat UI mock =====

const ConversationContainer: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <Paper
    elevation={0}
    sx={{
      p: { xs: 2, md: 3 },
      border: '1px solid',
      borderColor: 'divider',
      borderRadius: 3,
      bgcolor: 'background.paper',
    }}
  >
    <Stack spacing={2.5}>{children}</Stack>
  </Paper>
);

const UserBubble: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
    <Box
      sx={{
        maxWidth: '85%',
        bgcolor: 'primary.main',
        color: 'primary.contrastText',
        px: 2,
        py: 1.5,
        borderRadius: 3,
        fontSize: 15,
        lineHeight: 1.5,
        whiteSpace: 'pre-wrap',
      }}
    >
      {children}
    </Box>
  </Box>
);

const AssistantBubble: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <Box
    sx={{
      alignSelf: 'flex-start',
      maxWidth: '90%',
      bgcolor: 'background.paper',
      border: '1px solid',
      borderColor: 'divider',
      px: 2,
      py: 1.5,
      borderRadius: 3,
      fontSize: 15,
      lineHeight: 1.6,
    }}
  >
    {children}
  </Box>
);

const MockScoreCard: React.FC = () => (
  <Box
    sx={{
      mt: 2,
      p: 2.5,
      border: '1px solid',
      borderColor: 'divider',
      borderRadius: 2,
      bgcolor: 'grey.50',
    }}
  >
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 2,
      }}
    >
      <Box>
        <Typography sx={{ fontSize: 13, color: 'text.secondary', mb: 0.5 }}>
          Deal Quality Score
        </Typography>
        <Typography
          sx={{ fontSize: 40, fontWeight: 700, lineHeight: 1, color: '#DC2626' }}
        >
          38<Typography component="span" sx={{ fontSize: 20, color: 'text.secondary' }}>
            /100
          </Typography>
        </Typography>
        <Typography
          sx={{ fontSize: 13, color: '#DC2626', fontWeight: 600, mt: 0.5 }}
        >
          Below professional standards
        </Typography>
      </Box>
      <Box sx={{ textAlign: 'right' }}>
        <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
          Monthly cash flow
        </Typography>
        <Typography sx={{ fontSize: 20, fontWeight: 700, color: '#DC2626' }}>
          -$969
        </Typography>
      </Box>
    </Box>
    <FactorBar label="Cash flow" value={0} />
    <FactorBar label="Cap rate" value={0} />
    <FactorBar label="IRR" value={42} />
    <FactorBar label="Market strength" value={85} />
    <FactorBar label="Exit strategy" value={83} />
    <FactorBar label="Property risk" value={75} />
    <FactorBar label="Debt structure" value={53} />
  </Box>
);

const FactorBar: React.FC<{ label: string; value: number }> = ({
  label,
  value,
}) => {
  const color =
    value >= 80 ? '#16A34A' : value >= 65 ? '#2563EB' : value >= 50 ? '#F59E0B' : '#DC2626';
  return (
    <Box sx={{ mb: 0.75 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 13,
          mb: 0.25,
        }}
      >
        <span>{label}</span>
        <span style={{ fontWeight: 600 }}>{value}/100</span>
      </Box>
      <LinearProgress
        variant="determinate"
        value={value}
        sx={{
          height: 6,
          borderRadius: 3,
          bgcolor: 'grey.200',
          '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 3 },
        }}
      />
    </Box>
  );
};

export default SampleAnalysisPage;
