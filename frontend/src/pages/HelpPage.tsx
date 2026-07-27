/**
 * HelpPage — v2.0 rewrite (Task #128, 2026-07-26)
 *
 * The v1.0 page taught the Property Wizard as the primary flow. In v2.0
 * the wizard is retired from user-facing surfaces — analysis happens in
 * chat. This rewrite is organized around the chat flow, in the voice of
 * a helpful peer investor. Structure:
 *
 *   1. How to describe a deal
 *   2. What to ask the AI
 *   3. What the score means
 *   4. Paying for a deal
 *   5. Refunds & billing
 *   6. FAQ (accordion)
 *
 * Kept scannable per Apple HIG — short paragraphs, no heavy chrome, no
 * screenshots (the product moves too fast for screenshots to age well).
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  Divider,
  Stack,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import QuestionAnswerOutlinedIcon from '@mui/icons-material/QuestionAnswerOutlined';
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
import PaidOutlinedIcon from '@mui/icons-material/PaidOutlined';
import ReplayOutlinedIcon from '@mui/icons-material/ReplayOutlined';

const SECTION_ID = {
  describe: 'how-to-describe-a-deal',
  ask: 'what-to-ask',
  score: 'what-the-score-means',
  pay: 'paying-for-a-deal',
  refunds: 'refunds-billing',
} as const;

const HelpPage: React.FC = () => {
  const navigate = useNavigate();
  const [expandedFaq, setExpandedFaq] = useState<string | false>(false);

  const openChat = (): void => {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('reanalyzr.chat.sessionId');
    }
    navigate('/app');
  };

  const jumpTo = (id: string): void => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <Container maxWidth="md" sx={{ py: { xs: 4, md: 6 } }}>
      {/* Hero */}
      <Box sx={{ mb: 5 }}>
        <Typography
          component="h1"
          sx={{
            fontSize: { xs: '2rem', md: '2.5rem' },
            fontWeight: 700,
            letterSpacing: '-0.02em',
            mb: 1.5,
          }}
        >
          Help
        </Typography>
        <Typography sx={{ fontSize: 17, color: 'text.secondary', maxWidth: 620 }}>
          REanalyzr is a chat-first real estate underwriter. Describe a deal
          in your own words — an address, a listing, or the numbers — and the
          AI runs a full analysis and answers whatever you ask next.
        </Typography>
      </Box>

      {/* Quick jump */}
      <Stack
        direction="row"
        spacing={1}
        useFlexGap
        flexWrap="wrap"
        sx={{ mb: 5 }}
      >
        {[
          { id: SECTION_ID.describe, label: 'Describe a deal' },
          { id: SECTION_ID.ask, label: 'What to ask' },
          { id: SECTION_ID.score, label: 'The score' },
          { id: SECTION_ID.pay, label: 'Paying' },
          { id: SECTION_ID.refunds, label: 'Refunds' },
        ].map((link) => (
          <Button
            key={link.id}
            size="small"
            onClick={() => jumpTo(link.id)}
            sx={{ textTransform: 'none', borderRadius: 2 }}
          >
            {link.label}
          </Button>
        ))}
      </Stack>

      {/* Section: describe */}
      <Section
        id={SECTION_ID.describe}
        icon={<ChatBubbleOutlineIcon />}
        title="How to describe a deal"
      >
        <Typography paragraph>
          Three ways to start — pick whichever is fastest for what's in front
          of you:
        </Typography>
        <List>
          <ListRow>
            <strong>Paste a listing.</strong> Zillow, Redfin, MLS —
            copy the URL or the property card into chat. The AI pulls the
            address, price, beds/baths, and any rent estimate it can find.
          </ListRow>
          <ListRow>
            <strong>Type an address.</strong> Something like
            <em> "1837 Walnut Way, Anna TX 75409"</em>. The AI looks up
            comps, market data, and asks for the numbers it still needs
            (price, rent estimate, financing).
          </ListRow>
          <ListRow>
            <strong>Describe the numbers.</strong> If you already have a
            deal in mind, spell it out — purchase price, rent, down
            payment, interest rate, and the AI takes it from there.
          </ListRow>
        </List>
        <Callout>
          The more specific you are, the fewer clarifying questions the AI
          asks. But if you leave a field out, it'll fill in a reasonable
          default and tell you what it assumed.
        </Callout>
      </Section>

      {/* Section: ask */}
      <Section
        id={SECTION_ID.ask}
        icon={<QuestionAnswerOutlinedIcon />}
        title="What to ask the AI"
      >
        <Typography paragraph>
          After a score comes back, keep going — the AI has the deal in
          context and can pivot to anything you want to explore.
        </Typography>
        <List>
          <ListRow>
            <strong>Stress test.</strong> "What if interest rates go to
            8%?" "What if rent drops to $2,200?" The AI re-runs the deal
            with your change and shows the delta.
          </ListRow>
          <ListRow>
            <strong>Compare to your portfolio.</strong> "How does this
            fit alongside my Anna property?" Portfolio-aware answers if
            you've saved deals before.
          </ListRow>
          <ListRow>
            <strong>Walk-away price.</strong> "What's the walk-away price?"
            The maximum you can pay and still hit a target return.
          </ListRow>
          <ListRow>
            <strong>Explain a metric.</strong> "Why is DSCR so low?"
            "Break down the 10-year IRR assumptions." The AI shows its work.
          </ListRow>
          <ListRow>
            <strong>Second opinions.</strong> "Give me the skeptical CPA
            take" or "run the optimistic-flipper view." Multiple personas
            evaluate the same deal.
          </ListRow>
        </List>
      </Section>

      {/* Section: score */}
      <Section
        id={SECTION_ID.score}
        icon={<AssessmentOutlinedIcon />}
        title="What the score means"
      >
        <Typography paragraph>
          Every deal gets a <strong>0–100 Deal Quality Score</strong> with a
          contextual label:
        </Typography>
        <List>
          <ListRow>
            <ScoreDot color="#16A34A" /> <strong>80–100.</strong> Above
            professional standards.
          </ListRow>
          <ListRow>
            <ScoreDot color="#2563EB" /> <strong>65–79.</strong> Meets
            professional standards.
          </ListRow>
          <ListRow>
            <ScoreDot color="#F59E0B" /> <strong>50–64.</strong> Requires
            optimization to work.
          </ListRow>
          <ListRow>
            <ScoreDot color="#DC2626" /> <strong>0–49.</strong> Below
            professional standards.
          </ListRow>
        </List>
        <Typography paragraph sx={{ mt: 2 }}>
          The score is a weighted composite of cash flow, cap rate, IRR,
          market strength, exit strategy, property risk, and debt
          structure — each factor is visible and traceable to its inputs.
          Ask "why is the score X?" and the AI breaks down which factors
          are pulling it up or down.
        </Typography>
        <Callout>
          The score is analytical, not directive. A 38/100 doesn't mean
          "don't buy" — it means the numbers as given fall below what
          institutional underwriters would accept. Your call whether to
          adjust the deal, walk, or accept the risk.
        </Callout>
      </Section>

      {/* Section: pay */}
      <Section
        id={SECTION_ID.pay}
        icon={<PaidOutlinedIcon />}
        title="Paying for a deal"
      >
        <Typography paragraph>
          Signup is free. Your <strong>first full analysis is included</strong> —
          the deal you analyze right after creating an account unlocks its
          full workspace at no cost.
        </Typography>
        <Typography paragraph>
          After that, each new property is <strong>$4.99, one-time</strong> —
          you get 180 days of unlimited chat on that deal, the full workspace
          (walk-away price, 10-year projection, scenario comparisons,
          adversarial critique, PDF export), and re-editing while the window
          is open.
        </Typography>
        <List>
          <ListRow>
            <strong>No subscription.</strong> You only pay when you go deep.
          </ListRow>
          <ListRow>
            <strong>No auto-renew.</strong> A $4.99 charge is one deal,
            180 days. It doesn't recur.
          </ListRow>
          <ListRow>
            <strong>No credit card required</strong> to sign up. Card only
            enters when you unlock your second deal.
          </ListRow>
        </List>
      </Section>

      {/* Section: refunds */}
      <Section
        id={SECTION_ID.refunds}
        icon={<ReplayOutlinedIcon />}
        title="Refunds & billing"
      >
        <Typography paragraph>
          If a deal analysis is broken — the numbers don't reconcile, the
          agent misinterprets the property, the workspace won't load —
          email <Link href="mailto:support@reanalyzr.com">support@reanalyzr.com</Link>{' '}
          and we'll refund the $4.99 within one business day. No forms,
          no phone tree.
        </Typography>
        <Typography paragraph>
          Payment is handled by Stripe. Your card details never touch our
          servers. Receipts land in your email at the address you signed
          up with.
        </Typography>
      </Section>

      <Divider sx={{ my: 6 }} />

      {/* FAQ */}
      <Typography
        component="h2"
        sx={{
          fontSize: { xs: '1.5rem', md: '1.75rem' },
          fontWeight: 700,
          letterSpacing: '-0.01em',
          mb: 3,
        }}
      >
        Frequently asked
      </Typography>
      {FAQ.map((item) => (
        <Accordion
          key={item.q}
          expanded={expandedFaq === item.q}
          onChange={(_, expanded) => setExpandedFaq(expanded ? item.q : false)}
          elevation={0}
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: '8px !important',
            mb: 1.5,
            '&:before': { display: 'none' },
          }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography sx={{ fontWeight: 600 }}>{item.q}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography sx={{ color: 'text.secondary' }}>{item.a}</Typography>
          </AccordionDetails>
        </Accordion>
      ))}

      {/* CTA */}
      <Box
        sx={{
          mt: 6,
          p: 4,
          bgcolor: 'primary.50',
          borderRadius: 3,
          textAlign: 'center',
        }}
      >
        <Typography sx={{ fontSize: 18, fontWeight: 600, mb: 1 }}>
          Ready to run a deal?
        </Typography>
        <Typography sx={{ color: 'text.secondary', mb: 3 }}>
          Paste a listing or type an address — the AI takes it from there.
        </Typography>
        <Button
          variant="contained"
          size="large"
          onClick={openChat}
          sx={{ textTransform: 'none', px: 4, borderRadius: 2 }}
        >
          Open chat
        </Button>
      </Box>
    </Container>
  );
};

// ===== Layout helpers =====

const Section: React.FC<{
  id: string;
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}> = ({ id, icon, title, children }) => (
  <Paper
    id={id}
    elevation={0}
    sx={{
      p: { xs: 3, md: 4 },
      mb: 3,
      border: '1px solid',
      borderColor: 'divider',
      borderRadius: 3,
      scrollMarginTop: 24,
    }}
  >
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
      <Box sx={{ color: 'primary.main', display: 'flex' }}>{icon}</Box>
      <Typography
        component="h2"
        sx={{
          fontSize: { xs: '1.25rem', md: '1.4rem' },
          fontWeight: 700,
          letterSpacing: '-0.01em',
        }}
      >
        {title}
      </Typography>
    </Box>
    {children}
  </Paper>
);

const List: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Box component="ul" sx={{ pl: 3, m: 0, mb: 1 }}>
    {children}
  </Box>
);

const ListRow: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Box component="li" sx={{ mb: 1.25, lineHeight: 1.6, color: 'text.primary' }}>
    {children}
  </Box>
);

const Callout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Box
    sx={{
      mt: 2,
      p: 2,
      bgcolor: 'grey.50',
      borderLeft: '3px solid',
      borderColor: 'primary.main',
      borderRadius: 1,
      fontSize: 14,
      color: 'text.secondary',
      lineHeight: 1.6,
    }}
  >
    {children}
  </Box>
);

const ScoreDot: React.FC<{ color: string }> = ({ color }) => (
  <Box
    component="span"
    sx={{
      display: 'inline-block',
      width: 10,
      height: 10,
      borderRadius: '50%',
      bgcolor: color,
      mr: 1,
      verticalAlign: 'middle',
    }}
  />
);

// External anchor
const Link: React.FC<{ href: string; children: React.ReactNode }> = ({
  href,
  children,
}) => (
  <a href={href} style={{ color: '#2563EB', textDecoration: 'none' }}>
    {children}
  </a>
);

// ===== FAQ content =====

const FAQ: Array<{ q: string; a: string }> = [
  {
    q: 'Which property types can I analyze?',
    a: 'Single-family rentals (buy-and-hold) and BRRRR are fully supported today. Multi-family is in progress — you can add MF properties to your portfolio for tracking, but full MF scoring lands in a later release.',
  },
  {
    q: 'Do you use real market data?',
    a: 'Yes. Mortgage rates come from FRED (Federal Reserve), rent estimates and comps from RentCast, and demographic data from the US Census. All references are visible in the analysis breakdown.',
  },
  {
    q: 'What does the AI actually do vs. the calculator underneath?',
    a: 'The underwriting math is deterministic — every calculation is done by the same engine every time. The AI handles interpretation, comparison, stress-testing, and answering follow-up questions in plain English. When you ask "why is DSCR so low?", the AI reads the actual numbers and explains them, not making things up.',
  },
  {
    q: 'How is this different from Excel or a calculator app?',
    a: 'Speed and portfolio context. A full-metric analysis takes about 30 seconds from a listing URL, and follow-up questions are conversational. If you have prior deals saved, the AI compares against them automatically.',
  },
  {
    q: "What if the AI's numbers look wrong?",
    a: 'Ask "show me the math" or "break down that number" — the AI cites the inputs and formula. If something still looks off, email support@reanalyzr.com with the property and the specific metric; we investigate and refund if there\'s a bug.',
  },
  {
    q: 'Can I export the analysis?',
    a: 'Yes. Every unlocked workspace has a PDF export with the full analysis, factor breakdown, and 10-year projection — suitable for sharing with a partner, lender, or accountant.',
  },
  {
    q: 'Do you store my chat history?',
    a: 'Yes, tied to your account. When you sign up after chatting anonymously, your prior chat and any deals you analyzed carry over automatically.',
  },
  {
    q: 'What happens after the 180-day window closes?',
    a: 'The deal stays in your Saved Properties as read-only. Re-editing the assumptions or running a fresh stress test costs another $4.99 for a new 180-day window on the same property.',
  },
];

export default HelpPage;
