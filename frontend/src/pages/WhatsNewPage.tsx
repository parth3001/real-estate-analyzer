/**
 * WhatsNewPage — v2.0 rewrite (Task #129, 2026-07-26)
 *
 * The v1.0 page was a wizard-milestone changelog ("Simplified Property
 * Wizard", "New form fields") — signalling to new visitors that they're
 * using a form product. The v2.0 story is different: the analysis engine
 * that used to live inside a wizard is now surfaced through a chat.
 *
 * This rewrite frames the pivot as the marquee, then lists what got
 * easier for the user. Prior wizard-era milestones are preserved below
 * the fold for continuity but reframed as "now part of the chat" so the
 * page reads as an evolution, not a rewrite.
 *
 * Voice: builder's-log honest (Marcus Chen framing), not marketing-y.
 * No verdict language. No subscription language.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  Container,
  Box,
  Typography,
  Paper,
  Button,
  Divider,
  Chip,
  Stack,
} from '@mui/material';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
import BoltOutlinedIcon from '@mui/icons-material/BoltOutlined';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import StickyHeader from '../components/SampleAnalysis/StickyHeader';

const WhatsNewPage: React.FC = () => {
  const navigate = useNavigate();

  const openChat = (): void => {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('reanalyzr.chat.sessionId');
    }
    navigate('/app');
  };

  return (
    <>
      <Helmet>
        <title>What's new — REanalyzr</title>
        <meta
          name="description"
          content="REanalyzr is now chat-first. Describe a deal in your own words — an address, a listing, or the numbers — and the AI runs a full analysis and answers whatever you ask next."
        />
        <meta property="og:title" content="What's new — REanalyzr" />
        <meta
          property="og:description"
          content="REanalyzr is now chat-first. Describe a deal in your own words and the AI runs the analysis."
        />
      </Helmet>

      <StickyHeader />

      <Container maxWidth="md" sx={{ py: { xs: 4, md: 8 } }}>
        {/* Hero */}
        <Box sx={{ mb: 6 }}>
          <Chip
            label="July 2026"
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
              fontSize: { xs: '2.25rem', md: '3rem' },
              fontWeight: 700,
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
              mb: 3,
            }}
          >
            REanalyzr is now chat-first.
          </Typography>
          <Typography
            sx={{
              fontSize: { xs: '1.0625rem', md: '1.1875rem' },
              color: 'text.secondary',
              lineHeight: 1.6,
              maxWidth: 640,
            }}
          >
            The analysis engine that used to sit inside a wizard is now
            surfaced through a conversation. Describe a deal in your own
            words — an address, a listing URL, or the raw numbers — and
            the AI runs a full underwrite and answers whatever you ask next.
          </Typography>
        </Box>

        {/* Marquee — what changed */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, md: 4 },
            mb: 4,
            border: '2px solid',
            borderColor: 'primary.main',
            borderRadius: 3,
            bgcolor: 'primary.50',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
            <ChatBubbleOutlineIcon color="primary" />
            <Typography sx={{ fontSize: 20, fontWeight: 700 }}>
              The pivot
            </Typography>
          </Box>
          <Typography paragraph sx={{ lineHeight: 1.7 }}>
            The old REanalyzr was a form — 60+ fields to fill out before you
            got an answer. It worked, but it made every deal feel like data
            entry. Investors who move fast weren't going to sit through it.
          </Typography>
          <Typography paragraph sx={{ lineHeight: 1.7 }}>
            The new REanalyzr is a chat. Paste a Zillow link and it pulls
            the property. Type an address and it looks up comps. Say
            <em> "what if interest rates go to 8%?"</em> and it re-runs the
            deal. The underwriting engine underneath is exactly as
            rigorous — same institutional-quality math, same market data —
            but the interface finally matches how investors actually think.
          </Typography>
        </Paper>

        {/* What got easier */}
        <Typography
          component="h2"
          sx={{
            fontSize: { xs: '1.5rem', md: '1.75rem' },
            fontWeight: 700,
            letterSpacing: '-0.01em',
            mb: 3,
            mt: 6,
          }}
        >
          What got easier
        </Typography>

        <Stack spacing={2} sx={{ mb: 6 }}>
          <FeatureRow
            icon={<BoltOutlinedIcon />}
            title="No forms."
            body="Describe the deal however you want. The AI asks for what it still needs and fills in reasonable defaults for the rest — always telling you what it assumed."
          />
          <FeatureRow
            icon={<AssessmentOutlinedIcon />}
            title="Stress tests, conversationally."
            body='Ask "what if rent drops 10%?" or "what if I put 40% down?" — the AI reruns and shows the delta. Every stress test is saved as a scenario you can compare later.'
          />
          <FeatureRow
            icon={<ChatBubbleOutlineIcon />}
            title="Portfolio-aware answers."
            body="If you've saved prior deals, ask 'how does this fit against my Anna property?' and the AI compares across your portfolio without you re-explaining anything."
          />
          <FeatureRow
            icon={<AssessmentOutlinedIcon />}
            title="Walk-away price on demand."
            body="Ask 'what's the walk-away price?' and get the maximum you can pay and still hit a target return. No spreadsheet fiddling."
          />
          <FeatureRow
            icon={<BoltOutlinedIcon />}
            title="Second opinions built in."
            body="Ask for the skeptical CPA take, the optimistic flipper view, or an adversarial critique — multiple personas evaluate the same deal, each with their own lens."
          />
        </Stack>

        {/* Pricing note */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, md: 4 },
            mb: 6,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 3,
          }}
        >
          <Typography sx={{ fontSize: 18, fontWeight: 700, mb: 1.5 }}>
            And a pricing reset.
          </Typography>
          <Typography sx={{ color: 'text.secondary', lineHeight: 1.7 }}>
            No subscription. Signup is free, your first full analysis is
            included, then $4.99 per property gets you 180 days of
            unlimited chat, the full workspace, and PDF export on that
            deal. You only pay when you go deep on one.
          </Typography>
        </Paper>

        {/* CTA */}
        <Box
          sx={{
            p: { xs: 3, md: 4 },
            bgcolor: 'grey.900',
            color: 'grey.100',
            borderRadius: 3,
            textAlign: 'center',
            mb: 6,
          }}
        >
          <Typography sx={{ fontSize: 22, fontWeight: 700, mb: 1 }}>
            Try it now.
          </Typography>
          <Typography sx={{ color: 'grey.400', mb: 3 }}>
            Paste a listing, type an address, or describe the numbers.
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
            Open chat
          </Button>
        </Box>

        <Divider sx={{ my: 6 }} />

        {/* Legacy changelog */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
          <HistoryOutlinedIcon sx={{ color: 'text.secondary' }} />
          <Typography
            component="h2"
            sx={{
              fontSize: { xs: '1.25rem', md: '1.5rem' },
              fontWeight: 700,
              letterSpacing: '-0.01em',
            }}
          >
            Earlier milestones
          </Typography>
        </Box>
        <Typography paragraph sx={{ color: 'text.secondary', mb: 4 }}>
          The underwriting engine has been under development for over a
          year. These are the milestones that got us here — most of what
          shipped inside the wizard is now surfaced through the chat.
        </Typography>

        <Stack spacing={2}>
          <LegacyRow
            date="June 2026"
            title="BRRRR strategy analysis"
            body="Full BRRRR underwriting — ARV, rehab budget, refinance modeling, capital recovery. Now part of the chat: ask 'analyze this as a BRRRR' on any property."
          />
          <LegacyRow
            date="April 2026"
            title="Portfolio intelligence"
            body="Portfolio-aware scoring, geographic concentration analysis, goal tracking. Now surfaced when you ask the AI to compare a new deal to your existing portfolio."
          />
          <LegacyRow
            date="February 2026"
            title="AI-enhanced insights"
            body="GPT-powered market predictions and personalized reasoning. Now the core of every chat response, not a separate tab."
          />
          <LegacyRow
            date="November 2025"
            title="Institutional-quality underwriting engine"
            body="28+ professional metrics: DSCR, cap rate, cash-on-cash, IRR, walk-away price, factor-weighted deal quality score. Same engine runs today — accessible through chat instead of forms."
          />
          <LegacyRow
            date="August 2025"
            title="Investment Decision Engine v2.1"
            body="Deal Quality Score system (0-100 with contextual labels), strategy-aware weighting, professional benchmarks. Now visible whenever you ask the AI to score a deal."
          />
        </Stack>
      </Container>
    </>
  );
};

// ===== Layout helpers =====

const FeatureRow: React.FC<{
  icon: React.ReactNode;
  title: string;
  body: string;
}> = ({ icon, title, body }) => (
  <Paper
    elevation={0}
    sx={{
      p: { xs: 2.5, md: 3 },
      border: '1px solid',
      borderColor: 'divider',
      borderRadius: 2,
      display: 'flex',
      gap: 2,
      alignItems: 'flex-start',
    }}
  >
    <Box sx={{ color: 'primary.main', display: 'flex', pt: 0.25 }}>{icon}</Box>
    <Box>
      <Typography sx={{ fontSize: 16, fontWeight: 700, mb: 0.5 }}>
        {title}
      </Typography>
      <Typography sx={{ fontSize: 14.5, color: 'text.secondary', lineHeight: 1.6 }}>
        {body}
      </Typography>
    </Box>
  </Paper>
);

const LegacyRow: React.FC<{
  date: string;
  title: string;
  body: string;
}> = ({ date, title, body }) => (
  <Paper
    elevation={0}
    sx={{
      p: { xs: 2, md: 2.5 },
      border: '1px solid',
      borderColor: 'divider',
      borderRadius: 2,
    }}
  >
    <Typography
      sx={{ fontSize: 12, color: 'text.secondary', mb: 0.5, fontWeight: 600 }}
    >
      {date.toUpperCase()}
    </Typography>
    <Typography sx={{ fontSize: 15.5, fontWeight: 700, mb: 0.5 }}>
      {title}
    </Typography>
    <Typography sx={{ fontSize: 14, color: 'text.secondary', lineHeight: 1.55 }}>
      {body}
    </Typography>
  </Paper>
);

export default WhatsNewPage;
