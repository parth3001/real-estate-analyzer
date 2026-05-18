/**
 * LicenseStatusBadge — visible context for paid vs free flow.
 *
 * Day 10 (2026-05-18).
 *
 * WHAT IT SHOWS
 * ─────────────
 *
 * Rendered above the DealScoreCard on SavedDealHero, this badge tells
 * the user whether they're operating on a licensed property (paid
 * tier, deeper analysis budget) or in free-tier mode. Plus, when
 * licensed, how much of their $2 COGS budget they've consumed —
 * a transparent "your spend so far" signal that's the inverse of a
 * surprise paywall.
 *
 * STATES
 * ──────
 *
 *   - `loading`     — fetch in flight; render an unobtrusive skeleton
 *   - `none`        — no license; render "Free analysis" + (dev only)
 *                     "Activate test license" button
 *   - `active`      — green chip, "Licensed · expires <date>" + budget bar
 *   - `expired`     — gray chip, "License expired" (read-only state)
 *   - `refunded`    — gray chip, "License refunded"
 *
 * BUDGET BAR
 * ──────────
 *
 * For active licenses, a thin horizontal bar shows
 * `costSpentCents / costBudgetCentsStart`. The bar's color follows the
 * same gradient as the DealQualityScore: green when fresh, amber as
 * we approach 80% consumed, red near the cap. The user sees the cap
 * approaching BEFORE it fires — Apple's "show the credit limit, don't
 * surprise with a decline" principle.
 *
 * DEV TEST BUTTON
 * ───────────────
 *
 * When the badge shows `none` AND `import.meta.env.VITE_ENABLE_DEV_LICENSE_SEED`
 * is 'true', we render an "Activate test license" button. Tapping it
 * POSTs to /api/deals/:id/seed-license which the backend gates on its
 * own server-side env var. NEVER ship a public version of this — the
 * server guard is the source of truth, but we hide the UI too so users
 * never see it.
 */

import { useState } from 'react';
import { Box, Typography, Stack, Chip, Button, LinearProgress } from '@mui/material';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { propertyApi, type LicenseStatusWire } from '../../services/api';

export interface LicenseStatusBadgeProps {
  dealId?: string;
  license: LicenseStatusWire | null;
  loading: boolean;
  /** Refetch trigger — called after a successful dev seed. */
  onChange?: () => void;
}

// ===== Helpers =====

function formatExpiry(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function daysUntil(iso: string): number {
  const ms = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
}

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

/** Color for the budget-consumed bar. Mirrors DealScoreCard's gradient. */
function budgetBarColor(pctConsumed: number): string {
  if (pctConsumed >= 80) return '#C7261C'; // red
  if (pctConsumed >= 50) return '#C04A00'; // orange
  if (pctConsumed >= 25) return '#A66700'; // amber
  return '#1B8B3A'; // green
}

const DEV_SEED_ENABLED =
  (import.meta.env.VITE_ENABLE_DEV_LICENSE_SEED ?? 'false')
    .toString()
    .toLowerCase() === 'true';

// ===== Component =====

export function LicenseStatusBadge(
  props: LicenseStatusBadgeProps
): React.JSX.Element | null {
  const { dealId, license, loading, onChange } = props;
  const [seeding, setSeeding] = useState(false);
  const [seedError, setSeedError] = useState<string | null>(null);

  if (loading) {
    return (
      <Box sx={{ height: 32 }} data-testid="license-badge-loading">
        <LinearProgress sx={{ height: 2 }} />
      </Box>
    );
  }

  if (!license) return null;

  const handleSeed = async (): Promise<void> => {
    if (!dealId) return;
    setSeeding(true);
    setSeedError(null);
    try {
      await propertyApi.seedDealLicense(dealId);
      onChange?.();
    } catch (err) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ?? 'Failed to activate test license.';
      setSeedError(message);
    } finally {
      setSeeding(false);
    }
  };

  // ===== Status: none → Free analysis tag + optional dev button =====

  if (license.status === 'none') {
    return (
      <Stack
        direction="row"
        spacing={1.5}
        alignItems="center"
        sx={{ flexWrap: 'wrap' }}
        data-testid="license-badge-none"
      >
        <Chip
          icon={<LockOutlinedIcon sx={{ fontSize: 14 }} />}
          label="Free analysis"
          size="small"
          variant="outlined"
          sx={{
            borderColor: 'divider',
            color: 'text.secondary',
            fontWeight: 500,
            fontSize: 12,
          }}
        />
        <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: 12 }}>
          No active license on this property.
        </Typography>
        {DEV_SEED_ENABLED && (
          <Button
            size="small"
            variant="text"
            onClick={handleSeed}
            disabled={seeding || !dealId}
            sx={{ textTransform: 'none', fontSize: 12, py: 0 }}
            data-testid="license-badge-dev-seed"
          >
            {seeding ? 'Activating…' : 'Activate test license'}
          </Button>
        )}
        {seedError && (
          <Typography
            variant="caption"
            sx={{ color: 'error.main', fontSize: 12 }}
          >
            {seedError}
          </Typography>
        )}
      </Stack>
    );
  }

  // ===== Status: expired / refunded → muted chip =====

  if (license.status === 'expired' || license.status === 'refunded') {
    const label =
      license.status === 'expired' ? 'License expired' : 'License refunded';
    return (
      <Stack
        direction="row"
        spacing={1.5}
        alignItems="center"
        data-testid={`license-badge-${license.status}`}
      >
        <Chip
          icon={<LockOutlinedIcon sx={{ fontSize: 14 }} />}
          label={label}
          size="small"
          variant="outlined"
          sx={{
            borderColor: '#9CA3AF',
            color: 'text.secondary',
            fontWeight: 500,
            fontSize: 12,
          }}
        />
        <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: 12 }}>
          Re-license at /pricing to continue deep-dive analysis.
        </Typography>
      </Stack>
    );
  }

  // ===== Status: active → green chip + budget bar =====

  const days = daysUntil(license.expiresAt);
  const pctConsumed = Math.min(
    100,
    Math.round((license.costSpentCents / license.costBudgetCentsStart) * 100)
  );
  const barColor = budgetBarColor(pctConsumed);

  return (
    <Box data-testid="license-badge-active">
      <Stack
        direction="row"
        spacing={1.5}
        alignItems="center"
        sx={{ flexWrap: 'wrap', mb: 0.75 }}
      >
        <Chip
          icon={<LockOpenIcon sx={{ fontSize: 14 }} />}
          label={
            days > 0
              ? `Licensed · ${days} day${days === 1 ? '' : 's'} remaining`
              : 'Licensed · expires today'
          }
          size="small"
          sx={{
            bgcolor: 'transparent',
            border: '1px solid #1B8B3A',
            color: '#1B8B3A',
            fontWeight: 600,
            fontSize: 12,
          }}
        />
        <Typography
          variant="caption"
          sx={{ color: 'text.secondary', fontSize: 12 }}
        >
          {formatCents(license.costSpentCents)} of{' '}
          {formatCents(license.costBudgetCentsStart)} analytical budget used
        </Typography>
      </Stack>
      {/* Budget bar — shows the user how close they are to the COGS cap.
          Color goes green → amber → orange → red as consumption rises;
          matches the DealQualityScore gradient so the visual language
          is consistent across the surface. */}
      <Box
        sx={{
          height: 4,
          bgcolor: 'action.hover',
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            width: `${pctConsumed}%`,
            height: '100%',
            bgcolor: barColor,
            transition: 'width 200ms ease, background-color 200ms ease',
          }}
          data-testid="license-budget-bar"
        />
      </Box>
      <Typography
        variant="caption"
        sx={{
          display: 'block',
          color: 'text.disabled',
          fontSize: 11,
          mt: 0.5,
        }}
      >
        Purchased {formatExpiry(license.purchasedAt)} · expires{' '}
        {formatExpiry(license.expiresAt)}
      </Typography>
    </Box>
  );
}
