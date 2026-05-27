/**
 * DealScoreCard — the inline structured output rendered in the chat
 * thread after score_deal returns.
 *
 * Design lands per the 2026-05-15 UX-Designer / Apple-HIG conversation:
 *
 *   Visual hierarchy (largest → smallest):
 *     1. Strategy + address caption     (11pt uppercase secondary)
 *     2. Score number (huge)            (96pt desktop / 72pt mobile)
 *     3. qualityLabel                   (14pt, score-band accent)
 *     4. Top 3 factors                  (label + LinearProgress + score)
 *     5. Walk-away price + your offer   (with delta)
 *     6. Next step (one-sentence)
 *     7. Collapsed assumptions row      (disclose-after bucket)
 *
 *   Apple HIG decisions (from the conversation):
 *     - NEUTRAL card background; color lands on FOCAL elements only
 *       (score number, qualityLabel, LinearProgress fills, delta).
 *       NOT a tinted whole-card — that's the Apple Card / Stocks
 *       detail pattern: content is king.
 *     - "Change any of these" CTA is the iOS 17+ TINTED variant —
 *       secondary-but-emphasized, not screaming.
 *     - tabular-nums on every financial figure + the score.
 *     - No "BUY" / "PASS" badge — architecture §1.5 forbids directive
 *       language; the score + qualityLabel + accent color do the work.
 */

import { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  Divider,
  Collapse,
  IconButton,
  Button,
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { Link as RouterLink } from 'react-router-dom';
import { bandForScore, tabularNumsSx } from '../../theme/chatTheme';

// ===== Props =====

export interface DealScoreCardFactor {
  /** Human-readable factor label, e.g. "Cash flow", "Debt structure". */
  label: string;
  /** 0-100 factor score. */
  score: number;
  /** Optional explanatory tail, e.g. "monthly $250" — shown after the score. */
  tail?: string;
}

export interface DealScoreCardAssumption {
  /** Display label, e.g. "25% down". */
  label: string;
  /** Optional value column, e.g. "$106,250". */
  value?: string;
  /** Optional provenance, e.g. "FRED market avg" — shown in secondary tone. */
  source?: string;
}

export interface DealScoreCardProps {
  /** Investment strategy — drives the default caption when dealTypeLabel
      is not provided. Kept as 'buy_hold' | 'brrrr' for backward compat
      with chat-flow callers. Use `dealTypeLabel` to override for
      MF / house-hack / future commercial variants. */
  strategy: 'buy_hold' | 'brrrr';
  /** Optional explicit caption override. When provided, replaces the
      strategy-derived caption ("BUY & HOLD ANALYSIS" / "BRRRR ANALYSIS")
      with whatever string the caller wants. Used by SavedDealHero to
      surface "MULTI-FAMILY ANALYSIS · 4 units" / "HOUSE HACK ANALYSIS"
      / future commercial variants. */
  dealTypeLabel?: string;
  /** Property address — displayed in the caption. */
  address: {
    street: string;
    city: string;
    state: string;
  };
  /** 0-100 deal quality score. Score band derives from this. */
  dealQuality: number;
  /** Up to 3 top factors. Caller picks the highest-signal ones. */
  topFactors: DealScoreCardFactor[];
  /** Walk-away price (max acceptable purchase). */
  walkAwayPrice: number;
  /** User's offer / purchase price. Delta vs walk-away is computed. */
  purchasePrice: number;
  /** One-sentence concrete next step. */
  nextStep: string;
  /** Disclose-after bucket — the assumption defaults the user can override. */
  assumptions: DealScoreCardAssumption[];
  /** Optional click-handler for the "Change any of these" CTA. */
  onChangeAssumptions?: () => void;
  /**
   * Optional 10-year projection milestones (Issue #112). When provided,
   * renders as a collapsed "10-year projection" section below the
   * assumptions toggle. Sampled to anchor years (typically 1/3/5/7/10)
   * by the backend projector so the table stays compact.
   */
  projection?: Array<{
    year: number;
    cashFlow: number;
    propertyValue: number;
    equity: number;
  }>;
  /**
   * Anonymous teaser gate flag (Task #22, 2026-05-23). When true, the
   * card hides the three gated sections (top factors, walk-away/offer,
   * assumptions accordion) and renders ONE clean "Sign in to unlock"
   * CTA instead of empty scaffolding. Set explicitly by the backend's
   * gateCardForAnonymous — never inferred from sentinel zeros.
   */
  gated?: boolean;
}

// ===== Helpers =====

function formatCurrency(value: number): string {
  // Tabular-aligned, no decimals on whole-dollar figures.
  return `$${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

function strategyCaption(strategy: 'buy_hold' | 'brrrr'): string {
  return strategy === 'brrrr' ? 'BRRRR ANALYSIS' : 'BUY-AND-HOLD ANALYSIS';
}

function formatAddress(addr: DealScoreCardProps['address']): string {
  return `${addr.street}, ${addr.city} ${addr.state}`;
}

// ===== Component =====

export function DealScoreCard(props: DealScoreCardProps): React.JSX.Element {
  const {
    strategy,
    dealTypeLabel,
    address,
    dealQuality,
    topFactors,
    walkAwayPrice,
    purchasePrice,
    nextStep,
    assumptions,
    onChangeAssumptions,
    projection,
    gated = false,
  } = props;

  const band = bandForScore(dealQuality);
  const [assumptionsOpen, setAssumptionsOpen] = useState(false);
  const [projectionOpen, setProjectionOpen] = useState(false);
  const hasProjection = (projection?.length ?? 0) > 0;

  // Walk-away delta: positive means purchase is above walk-away (negotiation room)
  const delta = purchasePrice - walkAwayPrice;
  const deltaPct = walkAwayPrice > 0 ? (delta / walkAwayPrice) * 100 : 0;
  const deltaText =
    delta === 0
      ? 'at walk-away'
      : delta > 0
      ? `${Math.abs(deltaPct).toFixed(0)}% above`
      : `${Math.abs(deltaPct).toFixed(0)}% below`;

  return (
    <Card sx={{ maxWidth: 640, width: '100%' }} data-testid="deal-score-card">
      <CardContent sx={{ p: { xs: 2, sm: 3 }, '&:last-child': { pb: { xs: 2, sm: 3 } } }}>
        {/* 1. Caption — strategy + address */}
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            fontWeight: 600,
            color: 'text.secondary',
            fontSize: 11,
            mb: 2,
          }}
          data-testid="deal-score-card-caption"
        >
          {dealTypeLabel ?? strategyCaption(strategy)} · {formatAddress(address)}
        </Typography>

        {/* 2 + 3. Score + qualityLabel */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            gap: 2,
            mb: 3,
            flexWrap: 'wrap',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
            <Typography
              component="span"
              sx={{
                ...tabularNumsSx,
                fontSize: { xs: 72, sm: 96 },
                fontWeight: 700,
                lineHeight: 1,
                color: band.accent,
              }}
              data-testid="deal-score-card-score"
            >
              {dealQuality}
            </Typography>
            <Typography
              component="span"
              sx={{
                ...tabularNumsSx,
                fontSize: { xs: 24, sm: 32 },
                fontWeight: 500,
                color: 'text.secondary',
                lineHeight: 1,
              }}
            >
              /100
            </Typography>
          </Box>
          <Typography
            sx={{
              fontSize: 14,
              fontWeight: 600,
              color: band.accent,
              textAlign: 'right',
              alignSelf: 'flex-end',
              maxWidth: 180,
            }}
            data-testid="deal-score-card-label"
          >
            {band.label}
          </Typography>
        </Box>

        {/* Task #22 — anonymous teaser CTA. Replaces the gated rows
            (top factors / walk-away / assumptions) with ONE clean
            "sign in to unlock" affordance. Apple Simplicity: one
            conversion moment, not three locked padlocks. Marcus's
            Layer-1 funnel: the gate IS the signup prompt. */}
        {gated && (
          <Box
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              bgcolor: 'grey.50',
              p: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              mb: 3,
            }}
            data-testid="deal-score-card-anon-cta"
          >
            <LockOutlinedIcon sx={{ color: 'text.secondary', fontSize: 22 }} />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontSize: 14, fontWeight: 600, mb: 0.25 }}>
                See the full breakdown
              </Typography>
              <Typography sx={{ fontSize: 13, color: 'text.secondary', lineHeight: 1.4 }}>
                Walk-away price, factor breakdown, and standard assumptions —
                free for your first deal.
              </Typography>
            </Box>
            <Button
              component={RouterLink}
              to="/login"
              variant="contained"
              size="small"
              sx={{ textTransform: 'none', borderRadius: 2, flexShrink: 0 }}
              data-testid="deal-score-card-anon-signin"
            >
              Sign in
            </Button>
          </Box>
        )}

        {!gated && (
          <>
        <Divider sx={{ mb: 2 }} />

        {/* 4. Top factors */}
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            fontWeight: 600,
            color: 'text.secondary',
            fontSize: 11,
            mb: 1.5,
          }}
        >
          Top factors
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 3 }}>
          {topFactors.slice(0, 3).map((f) => (
            <Box
              key={f.label}
              sx={{ display: 'flex', alignItems: 'center', gap: 2 }}
              data-testid="deal-score-card-factor"
            >
              <Typography sx={{ fontSize: 14, flex: '0 0 38%' }}>
                {f.label}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={Math.max(0, Math.min(100, f.score))}
                sx={{
                  flex: 1,
                  '& .MuiLinearProgress-bar': { backgroundColor: band.accent },
                }}
              />
              <Typography
                sx={{
                  ...tabularNumsSx,
                  fontSize: 13,
                  fontWeight: 500,
                  color: 'text.secondary',
                  minWidth: 64,
                  textAlign: 'right',
                }}
              >
                {f.score}/100
              </Typography>
            </Box>
          ))}
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* 5. Walk-away vs your offer */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography sx={{ fontSize: 14 }}>Walk-away price</Typography>
            <Typography sx={{ ...tabularNumsSx, fontSize: 14, fontWeight: 600 }}>
              {formatCurrency(walkAwayPrice)}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography sx={{ fontSize: 14, color: 'text.secondary' }}>
              Your offer
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
              <Typography sx={{ ...tabularNumsSx, fontSize: 14 }}>
                {formatCurrency(purchasePrice)}
              </Typography>
              <Typography
                sx={{ fontSize: 13, color: band.accent, fontWeight: 600 }}
                data-testid="deal-score-card-delta"
              >
                · {deltaText}
              </Typography>
            </Box>
          </Box>
        </Box>
          </>
        )}

        {/* 6. Next step */}
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            fontWeight: 600,
            color: 'text.secondary',
            fontSize: 11,
            mb: 1,
          }}
        >
          Next step
        </Typography>
        <Typography sx={{ fontSize: 14, mb: 3, lineHeight: 1.5 }} data-testid="deal-score-card-next-step">
          {nextStep}
        </Typography>

        {!gated && (
          <>
        <Divider sx={{ mb: 1 }} />

        {/* 7. Disclose-after — collapsed assumptions row */}
        <Box
          onClick={() => setAssumptionsOpen((o) => !o)}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            py: 1.5,
            cursor: 'pointer',
            minHeight: 44, // HIG touch target
            userSelect: 'none',
          }}
          role="button"
          tabIndex={0}
          aria-expanded={assumptionsOpen}
          aria-controls="deal-score-card-assumptions"
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setAssumptionsOpen((o) => !o);
            }
          }}
          data-testid="deal-score-card-assumptions-toggle"
        >
          <InfoOutlinedIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
          <Typography sx={{ fontSize: 14, flex: 1 }}>
            Standard assumptions used
          </Typography>
          <IconButton
            size="small"
            aria-label={assumptionsOpen ? 'Hide assumptions' : 'Show assumptions'}
            sx={{
              transform: assumptionsOpen ? 'rotate(180deg)' : 'rotate(0)',
              transition: 'transform 200ms',
            }}
            tabIndex={-1}
          >
            <ExpandMoreIcon />
          </IconButton>
        </Box>

        <Collapse in={assumptionsOpen} timeout={200}>
          <Box
            id="deal-score-card-assumptions"
            sx={{ display: 'flex', flexDirection: 'column', gap: 1, pt: 1, pb: 2 }}
            data-testid="deal-score-card-assumptions-list"
          >
            {assumptions.map((a) => (
              <Box
                key={a.label}
                sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}
              >
                <Typography sx={{ fontSize: 13 }}>{a.label}</Typography>
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                  {a.value && (
                    <Typography
                      sx={{ ...tabularNumsSx, fontSize: 13, fontWeight: 500 }}
                    >
                      {a.value}
                    </Typography>
                  )}
                  {a.source && (
                    <Typography
                      sx={{ fontSize: 12, color: 'text.secondary' }}
                    >
                      · {a.source}
                    </Typography>
                  )}
                </Box>
              </Box>
            ))}
            {onChangeAssumptions && (
              <Box sx={{ mt: 2 }}>
                <Button
                  variant="tinted"
                  onClick={onChangeAssumptions}
                  sx={{
                    backgroundColor: band.tint,
                    color: band.accent,
                    '&:hover': {
                      backgroundColor: band.tint,
                      filter: 'brightness(0.97)',
                    },
                  }}
                  data-testid="deal-score-card-change-assumptions"
                >
                  Change any of these →
                </Button>
              </Box>
            )}
          </Box>
        </Collapse>
          </>
        )}

        {/* ===== 8. 10-year projection (Issue #112) =====
            Optional section. Renders only when the backend projector
            sampled milestone years (typically 1/3/5/7/10). Same
            collapse pattern as the assumptions toggle — content
            hidden by default to keep the card compact; users who
            want the projection numbers click to expand. */}
        {hasProjection && (
          <>
            <Divider sx={{ mb: 1 }} />
            <Box
              onClick={() => setProjectionOpen((o) => !o)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                py: 1.5,
                cursor: 'pointer',
                minHeight: 44,
                userSelect: 'none',
              }}
              role="button"
              tabIndex={0}
              aria-expanded={projectionOpen}
              aria-controls="deal-score-card-projection"
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setProjectionOpen((o) => !o);
                }
              }}
              data-testid="deal-score-card-projection-toggle"
            >
              <InfoOutlinedIcon
                sx={{ fontSize: 18, color: 'text.secondary' }}
              />
              <Typography sx={{ fontSize: 14, flex: 1 }}>
                10-year projection
              </Typography>
              <IconButton
                size="small"
                aria-label={
                  projectionOpen ? 'Hide projection' : 'Show projection'
                }
                sx={{
                  transform: projectionOpen ? 'rotate(180deg)' : 'rotate(0)',
                  transition: 'transform 200ms',
                }}
                tabIndex={-1}
              >
                <ExpandMoreIcon />
              </IconButton>
            </Box>
            <Collapse in={projectionOpen} timeout={200}>
              <Box
                id="deal-score-card-projection"
                sx={{ pt: 1, pb: 2, overflowX: 'auto' }}
                data-testid="deal-score-card-projection-table"
              >
                <Box
                  component="table"
                  sx={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: 13,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  <Box component="thead">
                    <Box
                      component="tr"
                      sx={{ borderBottom: '1px solid', borderColor: 'divider' }}
                    >
                      {['Year', 'Cash flow', 'Property value', 'Equity'].map(
                        (h, idx) => (
                          <Box
                            component="th"
                            key={h}
                            sx={{
                              px: 1.25,
                              py: 0.75,
                              fontWeight: 600,
                              fontSize: 12,
                              color: 'text.secondary',
                              textAlign: idx === 0 ? 'left' : 'right',
                              letterSpacing: '0.02em',
                            }}
                          >
                            {h}
                          </Box>
                        )
                      )}
                    </Box>
                  </Box>
                  <Box component="tbody">
                    {projection!.map((row) => (
                      <Box
                        component="tr"
                        key={row.year}
                        sx={{
                          borderBottom: '1px solid',
                          borderColor: 'divider',
                          '&:last-child': { borderBottom: 'none' },
                        }}
                      >
                        <Box
                          component="td"
                          sx={{ px: 1.25, py: 0.875, fontWeight: 500 }}
                        >
                          {row.year}
                        </Box>
                        <Box
                          component="td"
                          sx={{ px: 1.25, py: 0.875, textAlign: 'right' }}
                        >
                          {formatCurrency(row.cashFlow)}
                        </Box>
                        <Box
                          component="td"
                          sx={{ px: 1.25, py: 0.875, textAlign: 'right' }}
                        >
                          {formatCurrency(row.propertyValue)}
                        </Box>
                        <Box
                          component="td"
                          sx={{ px: 1.25, py: 0.875, textAlign: 'right' }}
                        >
                          {formatCurrency(row.equity)}
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </Box>
              </Box>
            </Collapse>
          </>
        )}
      </CardContent>
    </Card>
  );
}
